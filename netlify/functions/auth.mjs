// Autenticación multi-usuario para el panel de Cabo Vírgenes.
//   POST /api/auth { action:'login', email, password }                 → { ok, token, user }
//   POST /api/auth { action:'logout' }                                 → { ok }
//   GET  /api/auth                                                     → { ok, user }  (valida la sesión actual)
//   POST /api/auth { action:'changePassword', current, next }          → { ok }        (requiere sesión)
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
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

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

export default async (req) => {
  const pf = preflight(req); if (pf) return pf;

  if (req.method === 'GET') {
    const u = await resolveSessionUser(req);
    if (!u) return json({ ok: false, error: 'unauthorized' }, 401);
    return json({ ok: true, user: u });
  }

  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  let body; try { body = await req.json(); } catch { return json({ error: 'bad-json' }, 400); }
  const action = String(body.action || 'login');

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
