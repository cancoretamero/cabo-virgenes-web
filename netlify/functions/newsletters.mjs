// Envío de boletines por email vía Resend (paridad con Aisa).
//   POST /api/newsletters { action:'send', subject, html, text?, recipients:[email...],
//                           audienceLabel?, meta? }   (requiere admin)
//        → { ok, sent, failed, error }
//   GET  /api/newsletters                              → { ok, history:[...] } (registro en Blobs)
//
// Cabo no tiene store de suscriptores en el servidor (viven en localStorage del
// admin), por eso los DESTINATARIOS llegan en el cuerpo del POST ya segmentados
// por el panel. El servidor solo envía y archiva un registro de auditoría.
import { json, preflight, store, requireAdmin, resolveUser, safe } from './_lib.mjs';

const STORE = 'cabo-newsletters';
const KEY = 'history.json';
const REPLY_TO = process.env.RESEND_REPLY_TO || 'info@cabovirgenes.com';

// ── Envío batcheado por Resend (hasta 100 por llamada al endpoint /emails/batch) ──
async function sendEmails(toList, subject, html, text) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: 0, failed: toList.length, error: 'no_resend_key' };
  const from = process.env.RESEND_FROM || 'Cabo Vírgenes <noticias@cabovirgenes.com>';
  const headers = { authorization: `Bearer ${key}`, 'content-type': 'application/json' };
  const emailHeaders = { 'List-Unsubscribe': `<mailto:${REPLY_TO}?subject=Baja>` };
  let sent = 0, failed = 0, lastError = null;
  for (let i = 0; i < toList.length; i += 100) {
    const chunk = toList.slice(i, i + 100);
    const payload = chunk.map((to) => ({
      from, to: [to], reply_to: REPLY_TO, subject, html,
      ...(text ? { text } : {}), headers: emailHeaders,
    }));
    try {
      const res = await fetch('https://api.resend.com/emails/batch', { method: 'POST', headers, body: JSON.stringify(payload) });
      if (res.ok) sent += chunk.length;
      else { failed += chunk.length; lastError = (await res.text().catch(() => 'resend_error')).slice(0, 400); }
    } catch (e) { failed += chunk.length; lastError = String((e && e.message) || e).slice(0, 400); }
  }
  return { sent, failed, error: lastError };
}

function validEmail(e) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(e || '').trim()); }

async function loadHistory() {
  try { const d = await store(STORE).get(KEY, { type: 'json' }); if (d && Array.isArray(d.items)) return d.items; } catch {}
  return [];
}
async function saveHistory(items) {
  try { await store(STORE).setJSON(KEY, { items: items.slice(0, 200), updatedAt: new Date().toISOString() }); } catch {}
}

export default async (req) => {
  const pf = preflight(req); if (pf) return pf;

  if (req.method === 'GET') {
    return json({ ok: true, history: await loadHistory() });
  }

  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  const auth = await requireAdmin(req); if (auth) return auth;
  const who = await resolveUser(req);

  let body; try { body = await req.json(); } catch { return json({ error: 'bad-json' }, 400); }
  const action = String(body.action || 'send');
  if (action !== 'send') return json({ error: 'action' }, 400);

  const subject = safe(body.subject, 200).trim();
  const html = safe(body.html, 400000);
  const text = body.text ? safe(body.text, 100000) : '';
  if (!subject) return json({ ok: false, error: 'no_subject', message: 'Falta el asunto.' }, 400);
  if (!html) return json({ ok: false, error: 'no_html', message: 'Falta el HTML del boletín.' }, 400);

  const recipients = Array.from(new Set(
    (Array.isArray(body.recipients) ? body.recipients : [])
      .map(e => String(e || '').trim().toLowerCase())
      .filter(validEmail)
  )).slice(0, 5000);
  if (!recipients.length) return json({ ok: false, sent: 0, error: 'no_recipients', message: 'No hay destinatarios válidos para esta audiencia.' }, 400);

  const r = await sendEmails(recipients, subject, html, text);

  const items = await loadHistory();
  items.unshift({
    id: 'srv-' + Date.now().toString(36),
    subject,
    audienceLabel: safe(body.audienceLabel, 120) || 'Todos',
    recipientCount: recipients.length,
    sent: r.sent, failed: r.failed,
    status: r.sent > 0 ? (r.failed ? 'partial' : 'sent') : 'failed',
    provider: 'resend',
    error: r.error || null,
    sentBy: who ? (who.name || who.user || who.email || who.id) : 'admin',
    meta: (body.meta && typeof body.meta === 'object') ? body.meta : null,
    sentAt: new Date().toISOString(),
  });
  await saveHistory(items);

  return json({ ok: r.sent > 0, sent: r.sent, failed: r.failed, error: r.error });
};
