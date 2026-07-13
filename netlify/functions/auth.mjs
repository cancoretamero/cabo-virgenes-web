// Autenticación multi-usuario para el panel de Cabo Vírgenes.
//   POST /api/auth { action:'login', email, password }                 → { ok, token, user }
//   POST /api/auth { action:'logout' }                                 → { ok }
//   GET  /api/auth                                                     → { ok, user }  (valida la sesión actual)
//   GET  /api/auth?action=review_request&id=…&d=…&sig=…                → HTML (enlaces firmados del email de solicitud)
//   POST /api/auth { action:'changePassword', current, next }          → { ok }        (requiere sesión)
//   POST /api/auth { action:'create', email, name, pass, role, notify }→ { ok, user, notified } (token maestro o sesión owner)
//   POST /api/auth { action:'request_access', nombre, apellidos, cargo, email, pass, message } → { ok, notified } (pública)
//   POST /api/auth { action:'reseed' }                                 → { ok, count } (requiere token maestro)
//
// _lib.mjs:resolveUser() importa este módulo y llama resolveSessionUser(req) primero;
// si no hay sesión válida cae al token maestro (CABO_ADMIN_TOKEN) / CABO_ADMIN_PASS.
//
// Seguridad:
//  - Las contraseñas iniciales NUNCA van en el código (repo público). Se leen de
//    variables de entorno de Netlify: CABO_PW_GABRIELA_A, CABO_PW_JUANJOSE_R,
//    CABO_PW_CHANI_G, CABO_PW_RTAMAGNINI. Si falta una, se siembra una aleatoria
//    (esa persona no podrá entrar hasta resetear) para no romper el arranque.
//  - Hash de contraseña con scrypt (sal por usuario), comparación en tiempo constante.
//  - Tokens de sesión aleatorios (64 hex), guardados en Netlify Blobs (store 'cabo-auth').
import { json, preflight, store, bearer, safe, resolveUser } from './_lib.mjs';
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'node:crypto';

const STORE = 'cabo-auth';
const USERS_KEY = 'users.json';
const SESS_KEY = 'sessions.json';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 días

// Perfiles del equipo. Sin contraseñas aquí: se inyectan por entorno (ver arriba).
const SEED_USERS = [
  { id: 'gabriela-a', email: 'gabriela.a@aisagroup.ca',     name: 'Gabriela',         role: 'owner', perms: [] },
  { id: 'juanjose-r', email: 'juanjose.r@aisagroup.ca',     name: 'Juan José',        role: 'owner', perms: [] },
  { id: 'chani-g',    email: 'chani.g@aisagroup.ca',        name: 'Chani',            role: 'owner', perms: [] },
  { id: 'rtamagnini', email: 'rtamagnini@cabovirgenes.com', name: 'Romina Tamagnini', role: 'owner', perms: [] },
];

const envPwKey = (id) => 'CABO_PW_' + id.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
function seedPassword(id) {
  const v = process.env[envPwKey(id)];
  return (v && String(v)) || randomBytes(12).toString('base64url');
}
function hashPassword(password, salt) {
  return scryptSync(String(password), salt, 64).toString('hex');
}
function makeUser(seed) {
  const salt = randomBytes(16).toString('hex');
  return {
    id: seed.id,
    email: String(seed.email || '').toLowerCase().trim(),
    name: seed.name || seed.email,
    role: seed.role || 'editor',
    perms: Array.isArray(seed.perms) ? seed.perms : [],
    salt,
    passwordHash: hashPassword(seedPassword(seed.id), salt),
    active: true,
    createdAt: new Date().toISOString(),
  };
}
function publicUser(u) {
  return { id: u.id, email: u.email, name: u.name, role: u.role, perms: u.perms || [], master: false };
}

async function loadUsers() {
  let data;
  try { data = await store(STORE).get(USERS_KEY, { type: 'json' }); } catch { data = null; }
  if (data && Array.isArray(data.users) && data.users.length) return data.users;
  const users = SEED_USERS.map(makeUser);
  try { await store(STORE).setJSON(USERS_KEY, { users, seededAt: new Date().toISOString() }); } catch {}
  return users;
}
async function saveUsers(users) {
  try { await store(STORE).setJSON(USERS_KEY, { users, updatedAt: new Date().toISOString() }); } catch {}
}
async function loadSessions() {
  try { const d = await store(STORE).get(SESS_KEY, { type: 'json' }); if (d && d.sessions) return d.sessions; } catch {}
  return {};
}
async function saveSessions(sessions) {
  const now = Date.now();
  for (const [tok, s] of Object.entries(sessions)) { if (!s || (s.exp && s.exp < now)) delete sessions[tok]; }
  try { await store(STORE).setJSON(SESS_KEY, { sessions, updatedAt: new Date().toISOString() }); } catch {}
}

function tokenFrom(req) {
  return req.headers.get('x-cabo-admin-token') || bearer(req) || '';
}
function constEq(aHex, bHex) {
  try {
    const a = Buffer.from(aHex, 'hex'), b = Buffer.from(bHex, 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch { return false; }
}

// ── Llamado por _lib.mjs:resolveUser() ──────────────────────────────────────
export async function resolveSessionUser(req) {
  const token = tokenFrom(req);
  if (!token || token.length < 40) return null; // tokens de sesión = 64 hex; descarta passes cortas
  const sessions = await loadSessions();
  const s = sessions[token];
  if (!s || (s.exp && s.exp < Date.now())) return null;
  const users = await loadUsers();
  const u = users.find(x => x.id === s.userId && x.active !== false);
  return u ? publicUser(u) : null;
}

// ════════════════════════════════════════════════════════════════════════════
// Alta de usuarios + emails de credenciales + solicitudes de acceso
// ════════════════════════════════════════════════════════════════════════════
const SITE_URL = 'https://cabovirgenes.com';
const ADMIN_URL = `${SITE_URL}/admin/`;
const EMAIL_LOGO = `${SITE_URL}/email-logo-white.png`; // mismo logo blanco que usan los boletines
const REPLY_TO = process.env.RESEND_REPLY_TO || 'info@cabovirgenes.com';
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const ROLES = ['owner', 'editor', 'comunicacion', 'viewer'];
const ROLE_LABEL = { owner: 'Propietario', editor: 'Editor', comunicacion: 'Comunicación', viewer: 'Lectura' };
const ACCESS_APPROVERS = (process.env.ACCESS_APPROVERS || 'juanjose.r@aisagroup.ca,chani.g@aisagroup.ca,gabriela.a@aisagroup.ca')
  .split(',').map(s => s.trim()).filter(Boolean);

function escH(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// Id legible derivado de la parte local del email ('nombre.apellido@…' → 'nombre-apellido'),
// con sufijo numérico si colisiona con un id existente.
function idFromEmail(email, users) {
  const base = String(email).split('@')[0].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'usuario';
  let id = base, n = 2;
  while (users.some(u => u.id === id)) id = `${base}-${n++}`;
  return id;
}

// Crea un registro de usuario con la MISMA forma que makeUser y lo añade a la
// lista (no re-siembra nada). `salt`/`passwordHash` pueden venir ya calculados
// (solicitudes de acceso aprobadas) o derivarse de `pass`.
function buildUser(users, { email, name, role, pass, salt, passwordHash }) {
  const cleanEmail = String(email || '').toLowerCase().trim();
  const s = salt || randomBytes(16).toString('hex');
  return {
    id: idFromEmail(cleanEmail, users),
    email: cleanEmail,
    name: (name && String(name).trim()) || cleanEmail,
    role: ROLES.includes(role) ? role : 'editor',
    perms: [],
    salt: s,
    passwordHash: passwordHash || hashPassword(pass, s),
    active: true,
    createdAt: new Date().toISOString(),
  };
}

// ── Envío genérico por Resend (mismo patrón de payload que newsletters.mjs) ──
async function sendEmail({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, skipped: 'no_key' };
  const from = process.env.RESEND_FROM || 'Cabo Vírgenes <noticias@cabovirgenes.com>';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to: Array.isArray(to) ? to : [to], reply_to: REPLY_TO, subject, html })
    });
    if (!res.ok) return { ok: false, error: (await res.text().catch(() => 'resend_error')).slice(0, 400) };
    return { ok: true };
  } catch (e) { return { ok: false, error: String((e && e.message) || e).slice(0, 400) }; }
}

// ── Plantillas (branding Cabo Vírgenes: azul marino profundo + teal) ─────────
function emailShell(title, inner) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escH(title)}</title></head>
<body style="margin:0;padding:0;background:#E9EDEF;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E9EDEF;padding:28px 12px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#F7F9FA;border-radius:14px;overflow:hidden;border:1px solid #d8dee3;">
  <tr><td style="background:#0A2233;padding:26px 36px;" align="center">
    <img src="${EMAIL_LOGO}" alt="Cabo Vírgenes" height="44" style="display:block;height:44px;width:auto;max-width:60%;">
  </td></tr>
  ${inner}
  <tr><td style="background:#0A2233;padding:18px 36px;" align="center">
    <p style="margin:0;font-family:'Courier New',monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:rgba(247,249,250,.62);">Cabo Vírgenes · Parte de AISA Group · cabovirgenes.com</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export function accessEmailHtml({ name, email, pass, role }) {
  const greet = name ? `Hola ${escH(name)},` : 'Hola,';
  const roleLabel = ROLE_LABEL[role] || 'Editor';
  return emailShell('Tu acceso al panel de Cabo Vírgenes', `
  <tr><td style="padding:36px 36px 8px;">
    <p style="margin:0 0 6px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#0FA6A0;font-weight:bold;">Panel de administración</p>
    <h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-weight:600;font-size:26px;line-height:1.15;color:#0A2233;">Tu acceso al panel de Cabo&nbsp;Vírgenes</h1>
    <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#35424a;">${greet}</p>
    <p style="margin:0 0 22px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#35424a;">Te hemos dado de alta en el panel de administración de <b>cabovirgenes.com</b>. Desde él se gestionan la web, las noticias, los boletines y el contenido del sitio. Estos son tus datos de acceso:</p>
  </td></tr>
  <tr><td style="padding:0 36px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #dde4e8;border-radius:10px;">
      <tr><td style="padding:22px 26px;">
        <p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#35424a;"><span style="display:inline-block;min-width:110px;color:#7f8a91;">Dirección</span> <a href="${ADMIN_URL}" style="color:#0A2233;font-weight:bold;text-decoration:none;">${ADMIN_URL.replace('https://', '')}</a></p>
        <p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#35424a;"><span style="display:inline-block;min-width:110px;color:#7f8a91;">Usuario</span> <b style="color:#0A2233;">${escH(email)}</b></p>
        <p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#35424a;"><span style="display:inline-block;min-width:110px;color:#7f8a91;">Contraseña</span> <b style="font-family:'Courier New',monospace;font-size:15px;color:#0A2233;letter-spacing:.04em;">${escH(pass)}</b></p>
        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#35424a;"><span style="display:inline-block;min-width:110px;color:#7f8a91;">Perfil</span> ${escH(roleLabel)}</p>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:26px 36px 8px;" align="center">
    <a href="${ADMIN_URL}" style="display:inline-block;background:#1CB5B0;color:#FFFFFF;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;padding:13px 34px;border-radius:100px;">Entrar al panel&nbsp;&nbsp;→</a>
  </td></tr>
  <tr><td style="padding:18px 36px 30px;">
    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12.5px;line-height:1.6;color:#7f8a91;">Se entra con tu <b>email</b> y esta contraseña. Por seguridad, te recomendamos cambiarla en tu primer acceso, desde tu perfil dentro del panel. Si no esperabas este correo, responde a este mensaje.</p>
  </td></tr>`);
}

async function sendAccessEmail(user, pass) {
  return sendEmail({
    to: user.email,
    subject: 'Tu acceso al panel de Cabo Vírgenes',
    html: accessEmailHtml({ name: user.name, email: user.email, pass, role: user.role })
  });
}

// ── Solicitudes de acceso (formulario público del login) ─────────────────────
const REQUESTS_KEY = 'access_requests.json';

async function readRequests() {
  try {
    const d = await store(STORE).get(REQUESTS_KEY, { type: 'json' });
    if (d && Array.isArray(d.requests)) return d.requests;
  } catch {}
  return [];
}
async function writeRequests(requests) {
  try { await store(STORE).setJSON(REQUESTS_KEY, { requests, updatedAt: new Date().toISOString() }); } catch {}
}

// Firma HMAC de los enlaces Autorizar/Rechazar de los emails.
function signReview(id, decision) {
  const secret = process.env.CABO_ADMIN_TOKEN || 'no-secret';
  return createHmac('sha256', secret).update(id + '.' + decision).digest('hex');
}

function reviewEmailHtml(r, approveUrl, rejectUrl) {
  const row = (k, v) => `<p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#35424a;"><span style="display:inline-block;min-width:120px;color:#7f8a91;">${k}</span> <b style="color:#0A2233;">${escH(v)}</b></p>`;
  return emailShell('Solicitud de acceso al panel', `
  <tr><td style="padding:36px 36px 8px;">
    <p style="margin:0 0 6px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#0FA6A0;font-weight:bold;">Panel de administración</p>
    <h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-weight:600;font-size:26px;line-height:1.15;color:#0A2233;">Nueva solicitud de acceso</h1>
    <p style="margin:0 0 22px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#35424a;">Una persona ha solicitado acceso al panel de administración de <b>cabovirgenes.com</b>. Revisa los datos y autoriza o rechaza la solicitud:</p>
  </td></tr>
  <tr><td style="padding:0 36px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #dde4e8;border-radius:10px;"><tr><td style="padding:22px 26px;">
      ${row('Nombre', r.nombre + ' ' + r.apellidos)}
      ${row('Cargo', r.cargo || '—')}
      ${row('Email', r.email)}
      ${r.message ? `<p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#35424a;"><span style="color:#7f8a91;">Mensaje</span><br>${escH(r.message)}</p>` : ''}
    </td></tr></table>
  </td></tr>
  <tr><td style="padding:26px 36px 8px;" align="center">
    <a href="${approveUrl}" style="display:inline-block;background:#1CB5B0;color:#FFFFFF;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;padding:13px 30px;border-radius:100px;margin:0 6px 10px;">Autorizar acceso&nbsp;&nbsp;→</a>
    <a href="${rejectUrl}" style="display:inline-block;background:#FFFFFF;color:#7a2e2e;border:1px solid #d8dee3;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 30px;border-radius:100px;margin:0 6px 10px;">Rechazar</a>
  </td></tr>
  <tr><td style="padding:14px 36px 30px;">
    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12.5px;line-height:1.6;color:#7f8a91;">Si se autoriza, la persona podrá entrar con su email y la contraseña que ella misma definió al solicitar el acceso, con perfil de Editor. Este aviso se envió a los autorizadores del panel.</p>
  </td></tr>`);
}

function resultEmailHtml(r, approved) {
  const body = approved
    ? `<p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#35424a;">Hola ${escH(r.nombre)},</p>
       <p style="margin:0 0 22px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#35424a;">Tu solicitud de acceso al panel de administración de <b>cabovirgenes.com</b> ha sido <b>autorizada</b>. Ya puedes entrar con tu email (<b>${escH(r.email)}</b>) y la contraseña que definiste al enviar la solicitud.</p>`
    : `<p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#35424a;">Hola ${escH(r.nombre)},</p>
       <p style="margin:0 0 22px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#35424a;">Tu solicitud de acceso al panel de administración de <b>cabovirgenes.com</b> no ha sido aprobada en esta ocasión. Si crees que se trata de un error, contacta con tu responsable.</p>`;
  const cta = approved ? `<tr><td style="padding:4px 36px 30px;" align="center"><a href="${ADMIN_URL}" style="display:inline-block;background:#1CB5B0;color:#FFFFFF;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;padding:13px 34px;border-radius:100px;">Entrar al panel&nbsp;&nbsp;→</a></td></tr>` : '';
  return emailShell(approved ? 'Acceso autorizado' : 'Solicitud de acceso', `
  <tr><td style="padding:36px 36px 8px;">
    <p style="margin:0 0 6px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#0FA6A0;font-weight:bold;">Panel de administración</p>
    <h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-weight:600;font-size:26px;line-height:1.15;color:#0A2233;">${approved ? 'Tu acceso ha sido autorizado' : 'Sobre tu solicitud de acceso'}</h1>
    ${body}
  </td></tr>
  ${cta}`);
}

function reviewPageHtml(title, text) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escH(title)}</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0A2233;color:#F7F9FA;font-family:Georgia,'Times New Roman',serif;text-align:center;padding:24px;">
<div><div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#7FE3DF;margin-bottom:14px;">Cabo Vírgenes — Panel de administración</div>
<h1 style="font-weight:600;font-size:30px;margin:0 0 12px;">${escH(title)}</h1>
<p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:rgba(247,249,250,.75);max-width:46ch;margin:0 auto;">${escH(text)}</p></div>
</body></html>`;
}
function htmlResponse(html, status = 200) {
  return new Response(html, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

// GET /api/auth?action=review_request&id=…&d=approve|reject&sig=…
async function handleReviewRequest(url) {
  const id = url.searchParams.get('id') || '';
  const decision = url.searchParams.get('d') === 'approve' ? 'approve' : url.searchParams.get('d') === 'reject' ? 'reject' : '';
  const sig = url.searchParams.get('sig') || '';
  if (!id || !decision) return htmlResponse(reviewPageHtml('Enlace no válido', 'Faltan parámetros en el enlace. Usa los botones del email de solicitud.'), 400);
  if (!constEq(sig, signReview(id, decision))) return htmlResponse(reviewPageHtml('Enlace no válido', 'La firma del enlace no es correcta o ha sido alterada.'), 403);

  const requests = await readRequests();
  const r = requests.find(x => x.id === id);
  if (!r) return htmlResponse(reviewPageHtml('Solicitud no encontrada', 'La solicitud ya no existe.'), 404);
  const fullName = `${r.nombre} ${r.apellidos}`.trim();
  if (r.status !== 'pending') {
    const label = r.status === 'approved' ? 'ya fue autorizada' : 'ya fue rechazada';
    return htmlResponse(reviewPageHtml('Solicitud ya procesada', `La solicitud de ${fullName} ${label} el ${new Date(r.resolvedAt).toLocaleDateString('es-ES')}.`));
  }

  if (decision === 'approve') {
    const users = await loadUsers();
    if (!users.some(u => u.email === r.email)) {
      // Reutiliza el hash scrypt guardado al recibir la solicitud (la contraseña
      // en claro nunca se almacenó).
      users.push(buildUser(users, {
        email: r.email, name: fullName, role: 'editor',
        salt: r.salt, passwordHash: r.passwordHash
      }));
      await saveUsers(users);
    }
    r.status = 'approved'; r.resolvedAt = new Date().toISOString();
    await writeRequests(requests);
    await sendEmail({ to: r.email, subject: 'Tu acceso al panel de Cabo Vírgenes ha sido autorizado', html: resultEmailHtml(r, true) }).catch(() => {});
    return htmlResponse(reviewPageHtml('Acceso autorizado', `${fullName} (${r.email}) ya puede entrar al panel con perfil de Editor. Le hemos avisado por email.`));
  }

  r.status = 'rejected'; r.resolvedAt = new Date().toISOString();
  await writeRequests(requests);
  await sendEmail({ to: r.email, subject: 'Sobre tu solicitud de acceso al panel de Cabo Vírgenes', html: resultEmailHtml(r, false) }).catch(() => {});
  return htmlResponse(reviewPageHtml('Solicitud rechazada', `La solicitud de ${fullName} (${r.email}) ha sido rechazada. Le hemos avisado por email.`));
}

// POST { action:'request_access', … } — pública, desde la pantalla de login.
async function handleAccessRequest(body) {
  const nombre = safe(body.nombre, 120).trim();
  const apellidos = safe(body.apellidos, 120).trim();
  const cargo = safe(body.cargo, 160).trim();
  const email = safe(body.email, 160).toLowerCase().trim();
  const pass = String(body.pass || '');
  const message = safe(body.message, 1000).trim();
  if (!nombre || !apellidos || !cargo || !email || !pass) {
    return json({ ok: false, error: 'missing', message: 'Completa nombre, apellidos, cargo, email y contraseña.' }, 400);
  }
  if (!EMAIL_RE.test(email)) return json({ ok: false, error: 'email', message: 'El email no es válido.' }, 400);
  if (pass.length < 8) return json({ ok: false, error: 'weak', message: 'La contraseña debe tener al menos 8 caracteres.' }, 400);

  const users = await loadUsers();
  if (users.some(u => u.email === email)) {
    return json({ ok: false, error: 'exists', message: 'Ya existe un usuario con ese email. Si has olvidado tu contraseña, contacta con un administrador.' }, 409);
  }

  const requests = await readRequests();
  if (requests.some(x => x.email === email && x.status === 'pending')) {
    return json({ ok: false, error: 'pending', message: 'Ya hay una solicitud pendiente para ese email. Recibirás un aviso cuando sea revisada.' }, 409);
  }

  // La contraseña se guarda SOLO como scrypt salt+hash, nunca en claro.
  const salt = randomBytes(16).toString('hex');
  const r = {
    id: 'r-' + randomBytes(8).toString('hex'),
    nombre, apellidos, cargo, email, message,
    salt, passwordHash: hashPassword(pass, salt),
    status: 'pending', createdAt: new Date().toISOString()
  };
  requests.push(r);
  await writeRequests(requests);

  const approveUrl = `${SITE_URL}/api/auth?action=review_request&id=${r.id}&d=approve&sig=${signReview(r.id, 'approve')}`;
  const rejectUrl = `${SITE_URL}/api/auth?action=review_request&id=${r.id}&d=reject&sig=${signReview(r.id, 'reject')}`;
  const sent = await sendEmail({
    to: ACCESS_APPROVERS,
    subject: `Solicitud de acceso al panel — ${nombre} ${apellidos}`,
    html: reviewEmailHtml(r, approveUrl, rejectUrl)
  });
  return json({ ok: true, notified: !!(sent && sent.ok) });
}

export default async (req) => {
  const pf = preflight(req); if (pf) return pf;

  if (req.method === 'GET') {
    // Enlaces firmados de los emails de autorización (Autorizar / Rechazar).
    const url = new URL(req.url);
    if (url.searchParams.get('action') === 'review_request') return handleReviewRequest(url);
    // Sin action → valida la sesión actual (comportamiento original).
    const u = await resolveSessionUser(req);
    if (!u) return json({ ok: false, error: 'unauthorized' }, 401);
    return json({ ok: true, user: u });
  }

  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  let body; try { body = await req.json(); } catch { return json({ error: 'bad-json' }, 400); }
  const action = String(body.action || 'login');

  // ---- Solicitud de acceso (pública, desde la pantalla de login) ----
  if (action === 'request_access') return handleAccessRequest(body);

  if (action === 'logout') {
    const token = tokenFrom(req);
    if (token) { const sessions = await loadSessions(); if (sessions[token]) { delete sessions[token]; await saveSessions(sessions); } }
    return json({ ok: true });
  }

  if (action === 'login') {
    const email = safe(body.email, 160).toLowerCase().trim();
    const password = String(body.password || '');
    if (!email || !password) return json({ ok: false, error: 'missing' }, 400);
    const users = await loadUsers();
    const u = users.find(x => x.email === email && x.active !== false);
    // Tiempo constante incluso si el usuario no existe (no filtrar existencia por timing).
    const salt = u ? u.salt : 'dummy-salt-00000000000000000000';
    const candidate = hashPassword(password, salt);
    const okPass = u ? constEq(candidate, u.passwordHash) : false;
    if (!u || !okPass) return json({ ok: false, error: 'invalid', message: 'Email o contraseña incorrectos.' }, 401);
    const token = randomBytes(32).toString('hex');
    const sessions = await loadSessions();
    sessions[token] = { userId: u.id, createdAt: Date.now(), exp: Date.now() + SESSION_TTL_MS };
    await saveSessions(sessions);
    return json({ ok: true, token, user: publicUser(u) });
  }

  if (action === 'changePassword') {
    const u0 = await resolveSessionUser(req);
    if (!u0) return json({ ok: false, error: 'unauthorized', message: 'Inicia sesión para cambiar la contraseña.' }, 401);
    const current = String(body.current || '');
    const next = String(body.next || '');
    if (next.length < 8) return json({ ok: false, error: 'weak', message: 'La nueva contraseña debe tener al menos 8 caracteres.' }, 400);
    const users = await loadUsers();
    const u = users.find(x => x.id === u0.id);
    if (!u) return json({ ok: false, error: 'unauthorized' }, 401);
    if (!constEq(hashPassword(current, u.salt), u.passwordHash)) {
      return json({ ok: false, error: 'bad_current', message: 'La contraseña actual no es correcta.' }, 400);
    }
    u.salt = randomBytes(16).toString('hex');
    u.passwordHash = hashPassword(next, u.salt);
    u.updatedAt = new Date().toISOString();
    await saveUsers(users);
    return json({ ok: true });
  }

  if (action === 'create') {
    // Alta individual (no destructiva): requiere token maestro (mismo mecanismo
    // que 'reseed') o una sesión válida de un usuario con role 'owner'.
    const caller = await resolveUser(req);
    if (!caller || (!caller.master && caller.role !== 'owner')) {
      return json({ ok: false, error: 'forbidden' }, 403);
    }
    const email = safe(body.email, 160).toLowerCase().trim();
    const name = safe(body.name, 120).trim();
    const pass = String(body.pass || '');
    const role = ROLES.includes(body.role) ? body.role : 'editor';
    if (!email || !pass) return json({ ok: false, error: 'missing', message: 'Email y contraseña obligatorios.' }, 400);
    if (!EMAIL_RE.test(email)) return json({ ok: false, error: 'email', message: 'El email no es válido.' }, 400);
    if (pass.length < 8) return json({ ok: false, error: 'weak', message: 'La contraseña debe tener al menos 8 caracteres.' }, 400);
    const users = await loadUsers();
    if (users.some(u => u.email === email)) {
      return json({ ok: false, error: 'exists', message: 'Ya existe un usuario con ese email.' }, 409);
    }
    const u = buildUser(users, { email, name, role, pass });
    users.push(u);
    await saveUsers(users);
    let notified = false;
    if (body.notify !== false) {
      try { const r = await sendAccessEmail(u, pass); notified = !!(r && r.ok); } catch { /* best-effort */ }
    }
    return json({ ok: true, user: { id: u.id, email: u.email, name: u.name, role: u.role }, notified });
  }

  if (action === 'reseed') {
    // Re-siembra los usuarios desde SEED_USERS + entorno. Solo token maestro.
    const master = await resolveUser(req);
    if (!master || !master.master) return json({ ok: false, error: 'forbidden' }, 403);
    const users = SEED_USERS.map(makeUser);
    await saveUsers(users);
    await saveSessions({}); // invalida sesiones previas
    return json({ ok: true, count: users.length });
  }

  return json({ error: 'action' }, 400);
};
