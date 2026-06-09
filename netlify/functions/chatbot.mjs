// Chatbot público de Cabo Vírgenes con IA real (Claude).
// POST /api/chatbot  body: { message, history:[{role,content}], lang? }
//   → { reply }
// Sin ANTHROPIC_API_KEY responde 503 y el front cae a su base de conocimiento
// local (KB) sin romper la experiencia.
import { json, preflight, callClaude, store, safe } from './_lib.mjs';

const SYSTEM = `Eres el asistente virtual de Cabo Vírgenes, empresa pesquera de langostino austral salvaje (Pleoticus muelleri) del Atlántico Sudoccidental (FAO 41), parte de AISA Group desde enero de 2025 (fundada en 2008).

DATOS CLAVE (responde solo con esto; si no lo sabes, invita a contactar):
- PRODUCTO: langostino austral salvaje. 5 formatos — HOSO (entero con cabeza y cáscara), HLSO (cola con cáscara), EZP (easy peel / fácil pelado), P&D (pelado y devenado), PDTO (pelado y devenado con cola). Calibres L1/L2/L3/C1/C2/CR.
- FLOTA: 5 buques propios. Fresqueros: Espartano (21 m), Cristo Redentor (31 m), Iglú I (32 m). Factoría (congelan IQF a bordo): Mar Esmeralda (53 m), Kaleu Kaleu (56 m). Captura > 10.000 t/año desde Puerto Rawson.
- PLANTAS: Puerto Rawson, Chubut (Argentina) — núcleo productivo, congelación, hielo en escama. Palencia (España) — plataforma logística y valor agregado, 4.600 m², 22 t/día, 1.100+ paneles solares (autoconsumo, ~450 t CO₂/año evitadas).
- EXPORTACIÓN: 40+ países en 4 continentes (América, Europa, Asia, África).
- CERTIFICACIONES: HACCP, BRCGS, IFS Food, MSC (en proceso), ASC, FDA; SENASA y habilitaciones de exportación.
- SOSTENIBILIDAD / RASA (Rawson Ambiental S.A.): tratamiento integral de efluentes pesqueros + granja biosalina; el agua tratada cultiva halófitos (salicornia, microalgas, zampa, piquillín). Cabo Vírgenes participa accionariamente. 0% de vertido a cuerpos de agua.
- CONTACTO: info@cabovirgenes.com (consultas comerciales e institucionales) · prensa@cabovirgenes.com (prensa) · rrhh@cabovirgenes.com (empleo).

ESTILO: breve, profesional y cordial; español rioplatense. Responde SIEMPRE en el idioma del usuario. No inventes precios ni datos confidenciales: para cotizaciones deriva a info@cabovirgenes.com o al formulario de contacto. No menciones WhatsApp. Sin emojis excesivos.`;

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

  const lang = safe(body.lang, 8);
  const sys = lang && lang !== 'es' ? `${SYSTEM}\n\nIDIOMA DEL USUARIO: ${lang}. Responde en ese idioma.` : SYSTEM;

  const r = await callClaude({ system: sys, messages: msgs, maxTokens: 700, temperature: 0.4 });
  if (!r.ok) return json({ error: 'ai', message: r.message }, r.status || 502);

  return json({ reply: r.text });
};
