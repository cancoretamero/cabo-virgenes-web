// Conocimiento del asistente IA — gestionado desde el admin (Assets → Conocimiento IA).
// Cada elemento = un documento/texto cargado por el equipo + unas instrucciones
// sencillas del propietario ("de la ficha técnica responde solo X; el resto es confidencial").
// El chatbot público compone su system prompt con los elementos ACTIVOS.
//
// Almacén: Blobs `cabo-assets`, clave knowledge.json:
//   { global: '', items: [{ id, title, instructions, digest, enabled, sourceName,
//                           sourceUrl, mime, status, by, createdAt, updatedAt }] }
//
// GET  /api/knowledge (admin)  -> { ok, config }
// POST /api/knowledge (admin)  -> acciones:
//   { action:'global', text }                          reglas globales del asistente
//   { action:'add', title?, instructions?, text? }     conocimiento pegado como texto
//   { action:'add', title?, instructions?, name, type, dataBase64 }  PDF o imagen → Claude extrae el contenido
//   { action:'add', title?, instructions?, url, name?, type? }       ingesta desde URL (p.ej. un asset ya subido)
//   { action:'update', id, title?, instructions?, enabled?, digest? }
//   { action:'delete', id }
//   { action:'test', messages }                        probar el asistente con el conocimiento actual
import { json, preflight, requireAdmin, store, callClaude } from './_lib.mjs';
import { composeSystem } from './_knowledge-lib.mjs';

const KEY = 'knowledge.json';
const DIGEST_MAX = 12000; // chars por elemento (≈3k tokens)

function kstore() {
  return store('cabo-assets');
}

async function readConfig() {
  const cfg = await kstore().get(KEY, { type: 'json' });
  return cfg && Array.isArray(cfg.items) ? cfg : { global: '', items: [] };
}

async function writeConfig(cfg) {
  cfg.updatedAt = new Date().toISOString();
  await kstore().setJSON(KEY, cfg);
}

function genId() {
  return 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const EXTRACT_PROMPT =
  'Extrae el contenido útil de este material para la base de conocimiento del asistente del sitio web de Cabo Vírgenes. ' +
  'Devuelve un volcado fiel y estructurado en español: datos, cifras, fechas, nombres, listas y conceptos clave, conservando los detalles concretos. ' +
  'No inventes nada, no comentes, no saludes: SOLO el contenido extraído, en texto plano con guiones para las listas.';

// Extrae texto de un PDF/imagen con Claude (vision/document). Devuelve { ok, text|message }.
async function extractWithClaude({ type, dataBase64 }) {
  const mime = String(type || '').toLowerCase();
  let block = null;
  if (mime === 'application/pdf') {
    block = { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: dataBase64 } };
  } else if (/^image\/(png|jpe?g|webp|gif)$/.test(mime)) {
    block = { type: 'image', source: { type: 'base64', media_type: mime === 'image/jpg' ? 'image/jpeg' : mime, data: dataBase64 } };
  } else {
    // Texto plano (txt/md/csv/html…): decodificar directamente.
    try {
      const text = Buffer.from(dataBase64, 'base64').toString('utf8');
      if (text && /\S/.test(text)) return { ok: true, text };
    } catch { /* sigue */ }
    return { ok: false, message: 'Formato no soportado. Sube PDF, imagen o texto (txt/md/csv), o pega el texto directamente.' };
  }
  // maxTokens contenido: la function tiene ~10s de timeout; un digest de ~1200
  // tokens sale en pocos segundos con Haiku. Documentos muy largos → pegar texto.
  const r = await callClaude({
    system: 'Eres un extractor de documentos meticuloso. Tu salida se usará literalmente como base de conocimiento.',
    messages: [{ role: 'user', content: [block, { type: 'text', text: EXTRACT_PROMPT }] }],
    maxTokens: 1400,
    temperature: 0
  });
  if (!r.ok) return { ok: false, message: r.message || 'La IA no pudo procesar el documento.' };
  return { ok: true, text: r.text };
}

export default async (req) => {
  const pf = preflight(req);
  if (pf) return pf;

  const auth = await requireAdmin(req);
  if (auth) return auth;

  if (req.method === 'GET') {
    const cfg = await readConfig();
    return json({ ok: true, config: cfg });
  }
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }
  const action = String(body.action || '');

  if (action === 'global') {
    const cfg = await readConfig();
    cfg.global = String(body.text || '').slice(0, 6000);
    await writeConfig(cfg);
    return json({ ok: true, config: cfg });
  }

  if (action === 'add') {
    let digest = '';
    let status = 'ready';
    let error = null;

    if (body.text) {
      digest = String(body.text).slice(0, DIGEST_MAX);
    } else {
      let dataBase64 = body.dataBase64;
      let type = body.type;
      if (!dataBase64 && body.url) {
        // Ingesta desde URL (p.ej. un documento ya subido a la biblioteca).
        try {
          const src = String(body.url).startsWith('/') ? new URL(body.url, req.url).toString() : String(body.url);
          const r = await fetch(src);
          if (!r.ok) throw new Error('HTTP ' + r.status);
          const buf = Buffer.from(await r.arrayBuffer());
          if (buf.length > 4.5 * 1024 * 1024) {
            return json({ error: 'too_big', message: 'El documento supera 4,5 MB; para documentos grandes pega el texto relevante.' }, 400);
          }
          dataBase64 = buf.toString('base64');
          type = type || r.headers.get('content-type') || '';
        } catch (e) {
          return json({ error: 'fetch_failed', message: 'No se pudo descargar el documento: ' + String(e).slice(0, 120) }, 400);
        }
      }
      if (!dataBase64) return json({ error: 'missing_content', message: 'Falta el documento o el texto.' }, 400);
      const out = await extractWithClaude({ type, dataBase64 });
      if (!out.ok) {
        status = 'error';
        error = out.message;
      } else {
        digest = String(out.text || '').slice(0, DIGEST_MAX);
      }
    }

    const item = {
      id: genId(),
      title: String(body.title || body.name || 'Documento').slice(0, 140),
      instructions: String(body.instructions || '').slice(0, 2400),
      digest,
      enabled: status === 'ready',
      sourceName: String(body.name || '').slice(0, 160) || null,
      sourceUrl: body.url ? String(body.url).slice(0, 500) : null,
      mime: String(body.type || (body.text ? 'text/plain' : '')).slice(0, 100),
      status,
      error,
      by: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const cfg = await readConfig();
    cfg.items.unshift(item);
    await writeConfig(cfg);
    return json({ ok: status === 'ready', item, config: cfg, message: error });
  }

  if (action === 'update') {
    const cfg = await readConfig();
    const item = cfg.items.find((it) => it.id === body.id);
    if (!item) return json({ error: 'not_found' }, 404);
    if (body.title != null) item.title = String(body.title).slice(0, 140);
    if (body.instructions != null) item.instructions = String(body.instructions).slice(0, 2400);
    if (body.digest != null) {
      item.digest = String(body.digest).slice(0, DIGEST_MAX);
      if (item.status === 'error' && item.digest) { item.status = 'ready'; item.error = null; }
    }
    if (typeof body.enabled === 'boolean') item.enabled = body.enabled;
    item.updatedAt = new Date().toISOString();
    await writeConfig(cfg);
    return json({ ok: true, item });
  }

  if (action === 'delete') {
    const cfg = await readConfig();
    const before = cfg.items.length;
    cfg.items = cfg.items.filter((it) => it.id !== body.id);
    if (cfg.items.length === before) return json({ error: 'not_found' }, 404);
    await writeConfig(cfg);
    return json({ ok: true });
  }

  if (action === 'test') {
    // Probador del admin: misma composición de system que el chatbot público.
    const cfg = await readConfig();
    const system = composeSystem(cfg);
    const messages = (Array.isArray(body.messages) ? body.messages : []).slice(-12).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, 4000)
    }));
    if (!messages.length) return json({ error: 'missing_messages' }, 400);
    const r = await callClaude({ system, messages, maxTokens: 512, temperature: 0.3 });
    if (!r.ok) return json({ error: 'ai', message: r.message }, r.status || 502);
    return json({ ok: true, reply: r.text });
  }

  return json({ error: 'unknown_action' }, 400);
};
