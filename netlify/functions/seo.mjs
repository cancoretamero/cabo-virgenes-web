// SEO / Buscador — config editable por Comunicación + propuestas con IA.
// GET  /api/seo            → config actual (para el admin y como fallback)
// PUT  /api/seo  {config}  → guarda config (auth)         [aplica/publica]
// POST /api/seo  {action:'generate', focus?} → propuestas IA (auth)
//
// La config se guarda en Netlify Blobs (store 'cabo-seo', clave 'config.json').
// La edge function 'seo-inject' la lee e inyecta el SEO aprobado en el HTML.
import { json, preflight, store, callClaude, extractJson, requireAdmin, safe } from './_lib.mjs';

const STORE = 'cabo-seo';
const KEY = 'config.json';

// Config por defecto (coincide con lo que hoy hay en el HTML).
const DEFAULTS = {
  published: false,
  siteName: 'Cabo Vírgenes',
  title: 'Cabo Vírgenes — Langostino austral salvaje | Pesca y exportación',
  description: 'Cabo Vírgenes es una empresa pesquera especializada en langostino austral salvaje (Pleoticus muelleri): captura, procesamiento y exportación a 40 países, con plantas en Puerto Rawson (Argentina) y Palencia (España).',
  ogImage: '/og-image.jpg',
  favicon: '',            // vacío = usa el favicon por defecto del repo
  faq: [],                // [{q,a}] aprobadas → FAQPage
  updatedAt: null,
};

const BRAND_FACTS = `Cabo Vírgenes: empresa pesquera de LANGOSTINO AUSTRAL SALVAJE (Pleoticus muelleri), Atlántico Sudoccidental (FAO 41), Patagonia argentina. Parte de AISA Group (desde enero 2025; fundada 2008).
- 5 buques propios (3 fresqueros + 2 factoría), captura >3.000 t/año desde Puerto Rawson.
- 5 formatos: HOSO (entero, con cabeza y cáscara), HLSO (cola con cáscara, sin cabeza), EZP (fácil pelado, cáscara pre-cortada), P&D (pelado y devenado), PDTO (pelado y devenado con cola). Producto salvaje, natural, sin antibióticos.
- 2 plantas: Puerto Rawson (Chubut, AR) y Palencia (ES). Exporta a 40 países en 4 continentes.
- Certificaciones: HACCP, BRCGS, IFS, MSC (en proceso), ASC, FDA.
- Sostenibilidad: RASA (tratamiento de efluentes + granja biosalina), 0% vertido, energía solar en Palencia.
- Contacto: info@cabovirgenes.com.`;

async function getConfig() {
  try {
    const c = await store(STORE).get(KEY, { type: 'json' });
    if (c) return { ...DEFAULTS, ...c };
  } catch {}
  return { ...DEFAULTS };
}

export default async (req) => {
  const pf = preflight(req);
  if (pf) return pf;

  // ---- GET: leer config (sin auth; no es sensible) ----
  if (req.method === 'GET') {
    return json({ ok: true, config: await getConfig() });
  }

  // ---- PUT: guardar/publicar (requiere admin) ----
  if (req.method === 'PUT') {
    const auth = await requireAdmin(req); if (auth) return auth;
    let body; try { body = await req.json(); } catch { return json({ error: 'bad-json' }, 400); }
    const cur = await getConfig();
    const inc = body.config || {};
    const next = {
      ...cur,
      published: typeof inc.published === 'boolean' ? inc.published : cur.published,
      siteName: safe(inc.siteName ?? cur.siteName, 120),
      title: safe(inc.title ?? cur.title, 70),
      description: safe(inc.description ?? cur.description, 320),
      ogImage: safe(inc.ogImage ?? cur.ogImage, 300000),     // permite data-url
      favicon: safe(inc.favicon ?? cur.favicon, 300000),     // permite data-url
      faq: Array.isArray(inc.faq) ? inc.faq.slice(0, 20).map(f => ({ q: safe(f.q, 200), a: safe(f.a, 1200) })) : cur.faq,
      updatedAt: new Date().toISOString(),
    };
    try { await store(STORE).setJSON(KEY, next); }
    catch (e) { return json({ error: 'store', message: 'No se pudo guardar (¿Blobs disponible?).' }, 503); }
    return json({ ok: true, config: next });
  }

  // ---- POST: generar propuestas con IA (requiere admin) ----
  if (req.method === 'POST') {
    const auth = await requireAdmin(req); if (auth) return auth;
    let body; try { body = await req.json(); } catch { body = {}; }
    if (String(body.action) !== 'generate') return json({ error: 'action' }, 400);
    const focus = safe(body.focus, 200);

    const r = await callClaude({
      system: `Eres consultor SEO senior para una web corporativa premium de pesca/seafood. ${BRAND_FACTS}
Devuelves SOLO un objeto JSON válido (sin texto extra) con esta forma exacta:
{"titles":[3 strings],"descriptions":[3 strings],"faq":[6-8 objetos {"q":string,"a":string}]}
Reglas: títulos atractivos y con keyword, <= 60 caracteres. Descripciones persuasivas con llamada implícita, 140-155 caracteres. FAQ = preguntas reales que la gente busca en Google sobre la empresa/producto, respuestas claras de 1-3 frases basadas SOLO en los datos dados. Español de España neutro. No inventes datos.`,
      messages: [{ role: 'user', content: `Genera propuestas SEO para Cabo Vírgenes.${focus ? ' Enfoque: ' + focus : ''}` }],
      maxTokens: 1800, temperature: 0.6,
    });
    if (!r.ok) return json({ error: 'ai', message: r.message }, r.status || 502);
    const data = extractJson(r.text);
    if (!data) return json({ error: 'parse', message: 'La IA no devolvió un JSON válido.' }, 502);
    return json({
      ok: true,
      proposals: {
        titles: Array.isArray(data.titles) ? data.titles.slice(0, 4).map(s => safe(s, 70)) : [],
        descriptions: Array.isArray(data.descriptions) ? data.descriptions.slice(0, 4).map(s => safe(s, 320)) : [],
        faq: Array.isArray(data.faq) ? data.faq.slice(0, 10).map(f => ({ q: safe(f.q, 200), a: safe(f.a, 1200) })) : [],
      },
    });
  }

  return json({ error: 'method' }, 405);
};
