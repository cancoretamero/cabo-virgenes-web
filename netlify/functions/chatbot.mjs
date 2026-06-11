// Chatbot público de Cabo Vírgenes con IA real (Claude).
// POST /api/chatbot  body: { message, history:[{role,content}], lang? }
//   → { reply }
// Sin ANTHROPIC_API_KEY responde 503 y el front cae a su base de conocimiento
// local (KB) sin romper la experiencia.
// El system prompt (marca + conocimiento dinámico del admin → Assets →
// Conocimiento IA) se compone en _knowledge-lib.mjs: ÚNICA fuente, compartida
// con el probador del admin (knowledge.mjs).
import { json, preflight, callClaude, store, safe } from './_lib.mjs';
import { loadComposedSystem } from './_knowledge-lib.mjs';

export default async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  const body = await req.json().catch(() => ({}));
  const message = safe(body.message, 2000);
  if (!message) return json({ error: 'empty' }, 400);

  // Respeta un posible toggle de visibilidad del admin (best-effort).
  try {
    const content = await store('cabo-site').get('settings.json', { type: 'json' });
    if (content && content.chatbotEnabled === false) {
      return json({ reply: 'El asistente no está disponible en este momento. Escribinos a info@cabovirgenes.com.' }, 200);
    }
  } catch { /* ignore */ }

  // Construye la secuencia de mensajes (alterna user/assistant, empieza en user).
  const hist = Array.isArray(body.history) ? body.history : [];
  let msgs = hist
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && String(m.content || '').trim())
    .map(m => ({ role: m.role, content: safe(m.content, 4000) }));
  // Recorta turnos iniciales 'assistant' (la API exige empezar en 'user').
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();
  // Garantiza que el último turno es el mensaje actual del visitante.
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user' || msgs[msgs.length - 1].content !== message) {
    if (msgs.length && msgs[msgs.length - 1].role === 'user') msgs.push({ role: 'assistant', content: '…' });
    msgs.push({ role: 'user', content: message });
  }
  msgs = msgs.slice(-12);
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();

  // Prompt base de marca + conocimiento autorizado por el equipo (Blobs
  // 'cabo-assets'/knowledge.json). callClaude ya manda el system como bloque
  // cacheable, así que solo cambia de precio cuando el equipo edita el conocimiento.
  const system = await loadComposedSystem(store);
  const lang = safe(body.lang, 8);
  const sys = lang && lang !== 'es' ? `${system}\n\nIDIOMA DEL USUARIO: ${lang}. Responde en ese idioma.` : system;

  const r = await callClaude({ system: sys, messages: msgs, maxTokens: 700, temperature: 0.4 });
  if (!r.ok) return json({ error: 'ai', message: r.message }, r.status || 502);

  return json({ reply: r.text });
};
