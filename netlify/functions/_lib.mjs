// Helpers compartidos para las Netlify Functions de Cabo Vírgenes.
// ESM (.mjs) → independiente del "type" del package.json.
import { getStore } from '@netlify/blobs';

export const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';
export const ANTHROPIC_VERSION = '2023-06-01';

export const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type, authorization, x-cabo-admin-token, x-cabo-admin-user',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

export function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...extra }
  });
}

export function preflight(req) {
  if (req.method === 'OPTIONS') {
    // Cuerpo mínimo (no 204 vacío: el runtime Lambda de Netlify falla al
    // decodificar un 204 sin cuerpo → 502 en el preflight CORS).
    return new Response('{"ok":true}', { status: 200, headers: JSON_HEADERS });
  }
  return null;
}

// ── Netlify Blobs (almacenamiento simple: auth, transcripciones del bot,
//    ajustes). Import ESTÁTICO (el dinámico se bundlea mal con esbuild y pierde
//    los métodos del store). try/catch: si no hay contexto Netlify (test local),
//    devuelve un stub no-op para no romper el flujo. ──
export async function store(name) {
  try {
    return getStore({ name, consistency: 'strong' });
  } catch {
    return {
      async get() { return null; },
      async set() { return null; },
      async setJSON() { return null; },
      async delete() { return null; },
      async list() { return { blobs: [] }; }
    };
  }
}

// ── Claude (Anthropic Messages API) ──────────────────────────────────────
// Devuelve { ok, text, usage } o { ok:false, status, message }.
export async function callClaude({ system, messages, maxTokens = 1024, temperature = 0.3 }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, status: 503, message: 'Falta ANTHROPIC_API_KEY. Configúrala en Netlify para activar la IA.' };
  const cap = Math.min(Math.max(64, maxTokens | 0), 4096);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': ANTHROPIC_VERSION
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: cap,
        temperature,
        // Bloque de sistema cacheable (mismo prompt entre llamadas → más barato).
        system: system ? [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }] : undefined,
        messages
      })
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return { ok: false, status: 502, message: 'Error del servicio de IA.', detail };
    }
    const data = await res.json();
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
    return { ok: true, text, usage: data.usage };
  } catch (e) {
    return { ok: false, status: 502, message: 'No se pudo contactar con el servicio de IA.' };
  }
}

// Extrae el primer objeto JSON de una respuesta del modelo (tolera fences).
export function extractJson(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try { return JSON.parse(raw.slice(start, end + 1)); } catch { return null; }
}

export function safe(s, max = 8000) { return String(s || '').slice(0, max); }

// ── Auth admin (gate). Acepta el token maestro (CABO_ADMIN_TOKEN) o una sesión
//    válida emitida por /api/auth. Devuelve null si autorizado, o una Response. ─
export async function resolveUser(req) {
  // 1) Sesión multi-usuario (auth.mjs), si existe.
  try {
    const mod = await import('./auth.mjs');
    if (mod.resolveSessionUser) {
      const u = await mod.resolveSessionUser(req);
      if (u) return u;
    }
  } catch { /* auth.mjs aún no disponible */ }
  // 2) Token maestro de respaldo.
  const master = process.env.CABO_ADMIN_TOKEN;
  const got = req.headers.get('x-cabo-admin-token') || bearer(req);
  if (master && got && got === master) {
    return { id: 'master', user: process.env.CABO_ADMIN_USER || 'admin', name: 'Propietario', role: 'owner', perms: [], master: true };
  }
  return null;
}

export function bearer(req) {
  const h = req.headers.get('authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export async function requireAdmin(req) {
  const user = await resolveUser(req);
  if (user) return null;
  if (!process.env.CABO_ADMIN_TOKEN) {
    return json({ error: 'config', message: 'Configura CABO_ADMIN_TOKEN en Netlify y crea usuarios en Ajustes para activar el panel.' }, 503);
  }
  return json({ error: 'unauthorized', message: 'Sesión no válida.' }, 401);
}

export async function requirePerm(req, perm) {
  const user = await resolveUser(req);
  if (!user) {
    if (!process.env.CABO_ADMIN_TOKEN) return json({ error: 'config', message: 'Panel no configurado.' }, 503);
    return json({ error: 'unauthorized', message: 'Sesión no válida.' }, 401);
  }
  if (user.role === 'owner' || (Array.isArray(user.perms) && user.perms.includes(perm))) return null;
  return json({ error: 'forbidden', message: 'No tienes permiso para esta sección.' }, 403);
}
