// Biblioteca de Assets del sitio Cabo Vírgenes (imágenes, vídeos, documentos).
// Binarios en Supabase Storage (bucket público `web-assets`, URLs absolutas CDN);
// fallback a Netlify Blobs si Supabase no está configurado. El índice de
// metadatos vive en el store Blobs `cabo-assets` (clave index.json).
//
// GET  /api/assets                -> { ok, items, supabase } (admin)
// GET  /api/assets?file=<id>      -> sirve el binario (solo fallback Blobs; público)
// POST /api/assets (admin)        -> acciones:
//   { action:'upload', name, type, dataBase64, thumbBase64?, w?, h?, duration?, tags? }
//       Subida directa (≤ ~4.5MB binario). Devuelve { ok, item }.
//   { action:'sign', name, type }
//       URL firmada para subir GRANDES (vídeos ≤50MB) directo del navegador a
//       Supabase Storage sin pasar por la function. Devuelve { ok, id, path, uploadUrl, publicUrl }.
//   { action:'record', id, path, name, type, size, w?, h?, duration?, thumbBase64?, tags? }
//       Registra en el índice un archivo ya subido con 'sign'. Devuelve { ok, item }.
//   { action:'update', id, name?, tags? }
//   { action:'delete', id }
import { json, preflight, requireAdmin, store } from './_lib.mjs';
import { service, configured } from './_supabase.mjs';

const BUCKET = 'web-assets';
const INDEX_KEY = 'index.json';

function assetsStore() {
  return store('cabo-assets');
}

async function readIndex() {
  const idx = await assetsStore().get(INDEX_KEY, { type: 'json' });
  return idx && Array.isArray(idx.items) ? idx : { items: [] };
}

async function writeIndex(idx) {
  idx.updatedAt = new Date().toISOString();
  await assetsStore().setJSON(INDEX_KEY, idx);
}

function genId() {
  return 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function safeName(name) {
  return String(name || 'archivo').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
}

function kindOf(mime, name) {
  const m = String(mime || '').toLowerCase();
  if (m.startsWith('image/')) return 'image';
  if (m.startsWith('video/')) return 'video';
  if (m.startsWith('audio/')) return 'audio';
  if (m === 'application/pdf' || /\.(pdf|docx?|xlsx?|pptx?|txt|md|csv)$/i.test(String(name || ''))) return 'doc';
  return 'file';
}

function publicUrl(path) {
  return `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

// Sube bytes al bucket; devuelve la URL pública o null si falló.
async function sbUpload(path, bytes, contentType) {
  const svc = service();
  if (!svc) return null;
  const { error } = await svc.storage.from(BUCKET).upload(path, bytes, { contentType, upsert: true });
  if (error) return null;
  return publicUrl(path);
}

async function uploadThumb(id, thumbBase64) {
  if (!thumbBase64) return null;
  try {
    const bytes = Buffer.from(thumbBase64, 'base64');
    if (bytes.length > 600 * 1024) return null; // las miniaturas deben ser pequeñas
    if (configured()) return await sbUpload(`thumbs/${id}.jpg`, bytes, 'image/jpeg');
    await assetsStore().set(`thumb:${id}`, bytes, { metadata: { type: 'image/jpeg' } });
    return `/api/assets?file=thumb:${encodeURIComponent(id)}`;
  } catch {
    return null;
  }
}

function itemFrom(fields) {
  return {
    id: fields.id,
    name: String(fields.name || 'archivo').slice(0, 160),
    kind: kindOf(fields.type, fields.name),
    mime: String(fields.type || 'application/octet-stream').slice(0, 100),
    size: Number(fields.size) || 0,
    url: fields.url,
    thumb: fields.thumb || null,
    w: Number(fields.w) || null,
    h: Number(fields.h) || null,
    duration: Number(fields.duration) || null,
    tags: Array.isArray(fields.tags) ? fields.tags.map((t) => String(t).slice(0, 40)).slice(0, 12) : [],
    by: fields.by || null,
    storage: fields.storage,
    path: fields.path || null,
    createdAt: new Date().toISOString()
  };
}

export default async (req) => {
  const pf = preflight(req);
  if (pf) return pf;

  const url = new URL(req.url);

  // Servir binario del fallback Blobs (público, cache fuerte).
  if (req.method === 'GET' && url.searchParams.get('file')) {
    const key = url.searchParams.get('file');
    const blob = await assetsStore().getWithMetadata(
      key.startsWith('thumb:') ? key : `bin:${key}`,
      { type: 'arrayBuffer' }
    );
    if (!blob) return json({ error: 'not_found' }, 404);
    return new Response(blob.data, {
      status: 200,
      headers: {
        'content-type': (blob.metadata && blob.metadata.type) || 'application/octet-stream',
        'cache-control': 'public, max-age=31536000, immutable',
        'access-control-allow-origin': '*'
      }
    });
  }

  const auth = await requireAdmin(req);
  if (auth) return auth;

  if (req.method === 'GET') {
    const idx = await readIndex();
    return json({ ok: true, items: idx.items, supabase: configured() });
  }

  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }
  const action = String(body.action || '');

  if (action === 'upload') {
    const { name = 'archivo', type = 'application/octet-stream', dataBase64 } = body;
    if (!dataBase64) return json({ error: 'missing_data' }, 400);
    const bytes = Buffer.from(dataBase64, 'base64');
    const id = genId();
    const safe = safeName(name);
    let fileUrl = null;
    let storage = 'supabase';
    let path = `library/${id}/${safe}`;
    if (configured()) fileUrl = await sbUpload(path, bytes, type);
    if (!fileUrl) {
      // Fallback: binario en Blobs, servido por esta misma function.
      await assetsStore().set(`bin:${id}`, bytes, { metadata: { type, name: safe } });
      fileUrl = `/api/assets?file=${encodeURIComponent(id)}`;
      storage = 'blob';
      path = null;
    }
    const thumb = await uploadThumb(id, body.thumbBase64);
    const item = itemFrom({
      id, name, type, size: bytes.length, url: fileUrl, thumb,
      w: body.w, h: body.h, duration: body.duration, tags: body.tags, storage, path
    });
    const idx = await readIndex();
    idx.items.unshift(item);
    await writeIndex(idx);
    return json({ ok: true, item, url: item.url });
  }

  if (action === 'sign') {
    if (!configured()) return json({ error: 'no_supabase', message: 'Supabase Storage no está configurado; usa la subida normal (≤4 MB).' }, 503);
    const id = genId();
    const path = `library/${id}/${safeName(body.name)}`;
    const svc = service();
    const { data, error } = await svc.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) return json({ error: 'sign_failed', message: String((error && error.message) || 'No se pudo firmar la subida.') }, 502);
    return json({
      ok: true,
      id,
      path,
      token: data.token,
      uploadUrl: `${process.env.SUPABASE_URL}/storage/v1/object/upload/sign/${BUCKET}/${path}?token=${encodeURIComponent(data.token)}`,
      publicUrl: publicUrl(path)
    });
  }

  if (action === 'record') {
    const { id, path, name = 'archivo', type = 'application/octet-stream' } = body;
    if (!id || !path) return json({ error: 'missing_fields' }, 400);
    const thumb = await uploadThumb(id, body.thumbBase64);
    const item = itemFrom({
      id, name, type, size: body.size, url: publicUrl(path), thumb,
      w: body.w, h: body.h, duration: body.duration, tags: body.tags,
      storage: 'supabase', path
    });
    const idx = await readIndex();
    if (!idx.items.some((it) => it.id === id)) idx.items.unshift(item);
    await writeIndex(idx);
    return json({ ok: true, item, url: item.url });
  }

  if (action === 'update') {
    const idx = await readIndex();
    const item = idx.items.find((it) => it.id === body.id);
    if (!item) return json({ error: 'not_found' }, 404);
    if (body.name != null) item.name = String(body.name).slice(0, 160);
    if (Array.isArray(body.tags)) item.tags = body.tags.map((t) => String(t).slice(0, 40)).slice(0, 12);
    await writeIndex(idx);
    return json({ ok: true, item });
  }

  if (action === 'delete') {
    const idx = await readIndex();
    const item = idx.items.find((it) => it.id === body.id);
    if (!item) return json({ error: 'not_found' }, 404);
    idx.items = idx.items.filter((it) => it.id !== body.id);
    await writeIndex(idx);
    // Borrado del binario best-effort: el índice es la fuente de verdad.
    try {
      if (item.storage === 'supabase' && item.path && configured()) {
        const svc = service();
        await svc.storage.from(BUCKET).remove([item.path, `thumbs/${item.id}.jpg`]);
      } else if (item.storage === 'blob') {
        await assetsStore().delete(`bin:${item.id}`);
        await assetsStore().delete(`thumb:${item.id}`);
      }
    } catch { /* el binario huérfano no bloquea */ }
    return json({ ok: true });
  }

  return json({ error: 'unknown_action' }, 400);
};
