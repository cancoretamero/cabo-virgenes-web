// Composición del system prompt del asistente IA de Cabo Vírgenes.
// Única fuente: la usan chatbot.mjs (público) y knowledge.mjs (probador admin).
// El conocimiento dinámico (admin → Assets → Conocimiento IA) se añade al prompt base.

export const BASE_SYSTEM = `Eres el asistente virtual de Cabo Vírgenes, empresa pesquera de langostino austral salvaje (Pleoticus muelleri) del Atlántico Sudoccidental (FAO 41), parte de AISA Group desde enero de 2025 (fundada en 2008).

DATOS CLAVE (responde solo con esto; si no lo sabes, invita a contactar):
- PRODUCTO: langostino austral salvaje. 5 formatos — HOSO (entero con cabeza y cáscara), HLSO (cola con cáscara), EZP (easy peel / fácil pelado), P&D (pelado y devenado), PDTO (pelado y devenado con cola). Calibres L1/L2/L3/C1/C2/CR.
- FLOTA: 5 buques propios. Fresqueros: Espartano (21 m), Cristo Redentor (31 m), Iglú I (32 m). Factoría (congelan IQF a bordo): Mar Esmeralda (53 m), Kaleu Kaleu (56 m). Captura > 10.000 t/año desde Puerto Rawson.
- PLANTAS: Puerto Rawson, Chubut (Argentina) — núcleo productivo, congelación, hielo en escama. Palencia (España) — plataforma logística y valor agregado, 4.600 m², 22 t/día, 1.100+ paneles solares (autoconsumo, ~450 t CO₂/año evitadas).
- EXPORTACIÓN: 40+ países en 4 continentes (América, Europa, Asia, África).
- CERTIFICACIONES: HACCP, BRCGS, IFS Food, MSC (en proceso), ASC, FDA; SENASA y habilitaciones de exportación.
- SOSTENIBILIDAD / RASA (Rawson Ambiental S.A.): tratamiento integral de efluentes pesqueros + granja biosalina; el agua tratada cultiva halófitos (salicornia, microalgas, zampa, piquillín). Cabo Vírgenes participa accionariamente. 0% de vertido a cuerpos de agua.
- CONTACTO: info@cabovirgenes.com (consultas comerciales e institucionales) · prensa@cabovirgenes.com (prensa) · rrhh@cabovirgenes.com (empleo).

ESTILO: breve, profesional y cordial; español rioplatense. Responde SIEMPRE en el idioma del usuario. No inventes precios ni datos confidenciales: para cotizaciones deriva a info@cabovirgenes.com o al formulario de contacto. No menciones WhatsApp. Sin emojis excesivos.`;

// Presupuesto total de conocimiento inyectado (chars). Mantiene el prompt
// dentro de un coste razonable y cacheable.
const KNOWLEDGE_BUDGET = 48000;

// cfg = { global, items:[{ title, instructions, digest, enabled, status }] }
export function composeSystem(cfg) {
  let system = BASE_SYSTEM;
  if (!cfg) return system;
  const enabled = (cfg.items || []).filter((it) => it.enabled && it.status === 'ready' && it.digest);
  const hasGlobal = cfg.global && String(cfg.global).trim();
  if (!enabled.length && !hasGlobal) return system;

  let block = '\n\n=== CONOCIMIENTO AUTORIZADO (cargado por el equipo de Cabo Vírgenes) ===\n' +
    'Lo siguiente es información y reglas oficiales gestionadas por los administradores del sitio. ' +
    'Tiene PRIORIDAD sobre los "DATOS CLAVE" anteriores si entran en conflicto.\n';

  if (hasGlobal) {
    block += '\nREGLAS GLOBALES DEL EQUIPO (cúmplelas siempre):\n' + String(cfg.global).trim() + '\n';
  }

  let used = block.length;
  for (const it of enabled) {
    let piece = '\n--- ' + String(it.title || 'Documento').trim() + ' ---\n';
    if (it.instructions && String(it.instructions).trim()) {
      piece += 'INSTRUCCIONES DEL EQUIPO sobre este material (cúmplelas estrictamente; si limitan qué puedes contar, NO reveles el resto):\n' +
        String(it.instructions).trim() + '\n';
    }
    piece += 'CONTENIDO:\n' + String(it.digest).trim() + '\n';
    if (used + piece.length > KNOWLEDGE_BUDGET) break;
    block += piece;
    used += piece.length;
  }

  block += '\nSi el visitante pregunta por información que NO está cubierta aquí, que las instrucciones marcan como restringida, o que sea confidencial, ' +
    'no la inventes ni la reveles: responde amablemente que esa información no está disponible públicamente e invita a contactar por email.';

  return system + block;
}

// Carga knowledge.json del store y compone el system. Nunca lanza.
export async function loadComposedSystem(storeFn) {
  try {
    const cfg = await storeFn('cabo-assets').get('knowledge.json', { type: 'json' });
    return composeSystem(cfg);
  } catch {
    return BASE_SYSTEM;
  }
}
