// CRUD genérico sobre Supabase para el panel de Cabo Vírgenes.
//   POST /api/data { entity, action, id?, key?, payload?, query? }   (requiere admin)
//     action ∈ list | get | save | delete | reorder
//   → { ok, data } | { ok:false, error, message }
//
// Escrituras vía service-role (bypassa RLS); el gate real es requirePerm en JS,
// idéntico al patrón de Aisa (insights.js/prensa.js). El cliente trabaja con
// claves camelCase; aquí se mapean a las columnas snake_case de Postgres.
import { json, preflight, requireAdmin, requirePerm, resolveUser, safe } from './_lib.mjs';
import { service, configured } from './_supabase.mjs';
import { randomUUID } from 'node:crypto';

// entidad → { table, perm, pk(columna id), singleton?(keyed por 'key') }
const MAP = {
  news:        { table: 'cv_news',        perm: 'noticias' },
  // altKey: clave natural única además del id (cv_team.member_key). El upsert se
  // resuelve por ella para que la migración del seed por defecto (ids no-UUID
  // como 'basavilbaso') no choque con la fila ya existente (mismo member_key).
  team:        { table: 'cv_team',        perm: 'equipo', altKey: 'member_key' },
  consultas:   { table: 'cv_consultas',   perm: 'consultas' },
  subscribers: { table: 'cv_subscribers', perm: 'suscriptores' },
  jobs:        { table: 'cv_jobs',        perm: 'empleo' },
  applications:{ table: 'cv_applications',perm: 'empleo' },
  outlets:     { table: 'cv_outlets',     perm: 'noticias' },
  journalists: { table: 'cv_journalists', perm: 'noticias' },
  newsletters: { table: 'cv_newsletters', perm: 'boletines' },
  audit:       { table: 'cv_audit',       perm: 'ajustes' },
  profiles:    { table: 'cv_profiles',    perm: 'ajustes' },
  // singletons keyed (settings.key / pages.slug / legal.key)
  settings:    { table: 'cv_settings',    perm: 'ajustes',  keyed: 'key' },
  pages:       { table: 'cv_pages',       perm: 'edicion',  keyed: 'slug' },
  legal:       { table: 'cv_legal',       perm: 'legales',  keyed: 'key' },
};

// Alias client(camelCase) ↔ db(snake_case), por entidad. Solo las que difieren.
const ALIAS = {
  news:        { date: 'news_date', order: 'sort_order' },
  team:        { key: 'member_key', order: 'sort_order' },
  consultas:   { read: 'is_read', date: 'created_at' },
  subscribers: { createdAt: 'created_at', updatedAt: 'updated_at' },
  jobs:        { type: 'job_type', date: 'created_at', order: 'sort_order' },
  applications:{ jobId: 'job_id', jobTitle: 'job_title', cvUrl: 'cv_url', coverLetter: 'message', date: 'created_at' },
  outlets:     { type: 'outlet_type', editorialEmail: 'editorial_email', web: 'website' },
  journalists: { outletId: 'outlet_id' },
  newsletters: { audienceLabel: 'audience_label', recipientCount: 'recipient_count', sentBy: 'sent_by', sentAt: 'sent_at', text: 'text_body' },
  audit:       { before: 'before_val', after: 'after_val', at: 'created_at' },
};
// Columnas válidas por tabla (filtra cualquier campo extra del cliente).
const COLS = {
  cv_news: ['id','slug','title','excerpt','body','category','image','status','pinned','sort_order','news_date','author'],
  cv_team: ['id','member_key','name','role','area','bio','photo','hidden','sort_order'],
  cv_consultas: ['id','name','email','company','country','topic','message','source','is_read','created_at'],
  cv_subscribers: ['id','email','name','country','interests','outlet','web','phone','tags','notes','source'],
  cv_jobs: ['id','title','area','location','job_type','status','priority','tags','requirements','summary','body','sort_order'],
  cv_applications: ['id','job_id','job_title','name','email','phone','message','cv_url','status','starred'],
  cv_outlets: ['id','name','country','city','outlet_type','editorial_email','website','notes','subscribed'],
  cv_journalists: ['id','name','role','outlet','outlet_id','email','phone','beats','status'],
  cv_newsletters: ['id','subject','html','text_body','audience_label','status','recipient_count','sent','failed','provider','error','sent_by','meta','sent_at'],
  cv_audit: ['id','actor','section','action','before_val','after_val','meta','created_at'],
  cv_profiles: ['id','email','name','role','perms','active'],
  cv_settings: ['key','value','updated_at'],
  cv_pages: ['slug','layout','updated_at'],
  cv_legal: ['key','title','html','doc_updated','updated_at'],
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v) => typeof v === 'string' && UUID_RE.test(v);
const slugify = (s) => String(s || '').toLowerCase().normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
// Red de seguridad: ninguna fila de una entidad con clave natural alterna
// (team.member_key) debe quedarse SIN ella — si no, el sync la descartaría y
// luego la borraría del servidor. Genera una clave única en el lote.
function ensureAltKeys(entity, rows) {
  const ak = MAP[entity] && MAP[entity].altKey;
  if (!ak) return rows;
  const used = new Set(rows.map(r => r[ak]).filter(Boolean).map(String));
  for (const r of rows) {
    if (r[ak]) continue;
    let base = slugify(r.name) || ('m' + Math.random().toString(36).slice(2, 8));
    let k = base, i = 2;
    while (used.has(k)) { k = base + '-' + i++; }
    used.add(k); r[ak] = k;
  }
  return rows;
}

const SYS = new Set(['extra', 'created_at', 'updated_at']);
function toDb(entity, obj) {
  const a = ALIAS[entity] || {};
  const table = MAP[entity].table;
  const cols = COLS[table] || [];
  const hasExtra = !MAP[entity].keyed; // las tablas keyed (settings/pages/legal) no tienen extra
  const out = {}; const extra = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (SYS.has(k)) continue;
    const col = a[k] || k;
    if (cols.includes(col)) out[col] = v;
    else if (hasExtra) extra[k] = v; // preserva campos sin columna propia
  }
  if (hasExtra && Object.keys(extra).length) out.extra = extra;
  return out;
}
function fromDb(entity, row) {
  if (!row) return row;
  const a = ALIAS[entity] || {};
  const inv = Object.fromEntries(Object.entries(a).map(([c, d]) => [d, c]));
  const out = {};
  const extra = (row.extra && typeof row.extra === 'object') ? row.extra : {};
  for (const [k, v] of Object.entries(row)) { if (k === 'extra') continue; out[inv[k] || k] = v; }
  Object.assign(out, extra); // re-hidrata los campos extra
  return out;
}

export default async (req) => {
  const pf = preflight(req); if (pf) return pf;
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  if (!configured()) return json({ ok: false, error: 'config', message: 'Supabase no está configurado en el servidor (SUPABASE_SECRET_KEY).' }, 503);

  let body; try { body = await req.json(); } catch { return json({ error: 'bad-json' }, 400); }
  const entity = String(body.entity || '');
  const action = String(body.action || 'list');
  const m = MAP[entity];
  if (!m) return json({ ok: false, error: 'entity', message: 'Entidad desconocida.' }, 400);

  // Gate: requirePerm (owner pasa todo; el resto necesita el permiso).
  const gate = await requirePerm(req, m.perm); if (gate) return gate;
  const who = await resolveUser(req);
  const db = service();
  const pkCol = m.keyed || 'id';

  try {
    if (action === 'list') {
      let q = db.from(m.table).select('*');
      // Orden por defecto razonable
      if (COLS[m.table].includes('sort_order')) q = q.order('sort_order', { ascending: true });
      else if (COLS[m.table].includes('created_at')) q = q.order('created_at', { ascending: false });
      const { data, error } = await q;
      if (error) throw error;
      return json({ ok: true, data: (data || []).map(r => fromDb(entity, r)) });
    }

    if (action === 'get') {
      const idv = body.id ?? body.key;
      const { data, error } = await db.from(m.table).select('*').eq(pkCol, idv).maybeSingle();
      if (error) throw error;
      return json({ ok: true, data: fromDb(entity, data) });
    }

    if (action === 'save') {
      const row = toDb(entity, body.payload || {});
      // singletons: garantizar la clave
      if (m.keyed && !row[m.keyed] && (body.id || body.key)) row[m.keyed] = body.id || body.key;
      let onConflict = m.keyed || 'id';
      // Garantiza member_key (no dejar que caiga al upsert por id no-UUID).
      if (m.altKey && !row[m.altKey]) ensureAltKeys(entity, [row]);
      // Entidad con clave natural alterna (team.member_key): resuelve el upsert
      // por ella y descarta el id si no es UUID (seed/local) → la fila existente
      // se actualiza en vez de intentar insertar un duplicado.
      if (m.altKey && row[m.altKey]) {
        onConflict = m.altKey;
        if (!isUuid(row.id)) delete row.id;
      } else if (!m.keyed && (row.id === null || row.id === undefined || row.id === '')) {
        // Si no hay pk y no es singleton, deja que la BD genere el uuid (no enviar id null).
        delete row.id;
      }
      const { data, error } = await db.from(m.table).upsert(row, { onConflict }).select().maybeSingle();
      if (error) throw error;
      await audit(db, who, entity, 'save', body.payload);
      return json({ ok: true, data: fromDb(entity, data) });
    }

    if (action === 'delete') {
      const idv = body.id ?? body.key;
      const { error } = await db.from(m.table).delete().eq(pkCol, idv);
      if (error) throw error;
      await audit(db, who, entity, 'delete', { id: idv });
      return json({ ok: true });
    }

    if (action === 'replace') {
      // Sincroniza el array COMPLETO de una entidad: upsert de todo + borra lo
      // que ya no esté (por la clave de conflicto). Lo usa el write-through del admin.
      const arr = Array.isArray(body.payload) ? body.payload : [];
      // Para entidades con clave natural alterna (team.member_key) el sync se
      // resuelve por ella, descartando ids no-UUID (seed/local) que romperían
      // el upsert contra las filas ya existentes.
      const conflict = m.altKey || m.keyed || 'id';
      const mapped = arr.map(o => {
        const r = toDb(entity, o);
        if (m.altKey) { if (!isUuid(r.id)) delete r.id; }
        // Entidad normal sin id (item nuevo creado en el cliente sin id): NO se
        // descarta — se le asigna un id para que se INSERTE (antes se filtraba y
        // se perdía en silencio). Las columnas id son TEXT, un uuid vale.
        else if (!m.keyed && (r.id === null || r.id === undefined || r.id === '')) r.id = randomUUID();
        return r;
      });
      // Rellena member_key a las filas que lleguen sin ella ANTES de filtrar:
      // así no se descartan (y, por tanto, no se borran del servidor).
      if (m.altKey) ensureAltKeys(entity, mapped);
      const rows = mapped.filter(r => r[conflict] != null && r[conflict] !== '');
      if (rows.length) {
        const { error } = await db.from(m.table).upsert(rows, { onConflict: conflict });
        if (error) throw error;
      }
      // Qué habría que borrar: filas del servidor ausentes del array entrante.
      const keep = new Set(rows.map(r => String(r[conflict])));
      const { data: existing, error: selErr } = await db.from(m.table).select(conflict);
      if (selErr) throw selErr;
      const serverCount = (existing || []).length;
      const toDelete = (existing || []).map(x => x[conflict]).filter(k => !keep.has(String(k)));

      // ── RED DE SEGURIDAD ANTI-BORRADO CATASTRÓFICO ──────────────────────────
      // (a) Payload VACÍO contra un servidor con filas = casi seguro un cliente en
      //     estado obsoleto (sesión caducada, hidratación a medias, storage pisado).
      //     NUNCA es un "borra todo" legítimo → se ignora el borrado. Borrar de
      //     verdad se hace con la acción 'delete'. (Esto es lo que causó la pérdida.)
      if (rows.length === 0 && serverCount > 0) {
        await audit(db, who, entity, 'replace', { count: 0, deleted: 0, guard: 'empty-payload', wouldDelete: toDelete.length });
        return json({ ok: true, count: 0, deleted: 0, guard: 'empty-payload', wouldDelete: toDelete.length });
      }
      // (b) Borrado MASIVO (≥4 filas y más de las que se conservan) sin confirmar
      //     explícitamente → se aplican los upserts pero NO se borra. Dirección
      //     segura: nada se pierde; como mucho reaparece algo que el usuario puede
      //     volver a borrar. El cliente recibe pruneBlocked y lo puede confirmar.
      const massDelete = toDelete.length >= 4 && toDelete.length > rows.length;
      if (massDelete && body.confirmDeletions !== true) {
        await audit(db, who, entity, 'replace', { count: rows.length, deleted: 0, guard: 'mass-delete-blocked', wouldDelete: toDelete.slice(0, 50) });
        return json({ ok: true, count: rows.length, deleted: 0, pruneBlocked: true, wouldDelete: toDelete.slice(0, 50) });
      }

      if (toDelete.length) {
        const { error: delErr } = await db.from(m.table).delete().in(conflict, toDelete);
        if (delErr) throw delErr;
      }
      // Audita las claves borradas (rastro de recuperación ante un sync erróneo).
      await audit(db, who, entity, 'replace', { count: rows.length, deleted: toDelete.length, deletedKeys: toDelete.slice(0, 50) });
      return json({ ok: true, count: rows.length, deleted: toDelete.length });
    }

    if (action === 'reorder') {
      // payload: [{id, order, pinned?}] → actualiza sort_order/pinned
      const items = Array.isArray(body.payload) ? body.payload : [];
      for (const it of items) {
        const patch = {};
        if ('order' in it) patch.sort_order = it.order;
        if ('sort_order' in it) patch.sort_order = it.sort_order;
        if ('pinned' in it) patch.pinned = it.pinned;
        if (Object.keys(patch).length) await db.from(m.table).update(patch).eq('id', it.id);
      }
      await audit(db, who, entity, 'reorder', { count: items.length });
      return json({ ok: true });
    }

    return json({ ok: false, error: 'action' }, 400);
  } catch (e) {
    return json({ ok: false, error: 'db', message: String((e && e.message) || e).slice(0, 300) }, 500);
  }
};

async function audit(db, who, entity, action, payload) {
  try {
    await db.from('cv_audit').insert({
      actor: who ? (who.name || who.email || who.id || 'admin') : 'admin',
      section: entity, action,
      after_val: payload ? safe(JSON.stringify(payload), 2000) : null,
    });
  } catch { /* no romper por el audit */ }
}
