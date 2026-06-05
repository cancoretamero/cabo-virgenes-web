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
  altOverrides: {},       // { src|altActual: nuevoAlt }
  textOverrides: [],      // [{ find, replace }] textos visibles
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
      // Overrides del Editor Visual de SEO (aplicados por la edge function):
      altOverrides: (inc.altOverrides && typeof inc.altOverrides === 'object')
        ? Object.fromEntries(Object.entries(inc.altOverrides).slice(0, 80).map(([k, v]) => [safe(k, 200), safe(v, 300)]))
        : (cur.altOverrides || {}),
      textOverrides: Array.isArray(inc.textOverrides)
        ? inc.textOverrides.slice(0, 60).map(o => ({ find: safe(o.find, 600), replace: safe(o.replace, 600) })).filter(o => o.find && o.replace)
        : (cur.textOverrides || []),
      updatedAt: new Date().toISOString(),
    };
    try { await store(STORE).setJSON(KEY, next); }
    catch (e) { return json({ error: 'store', message: 'No se pudo guardar.', detail: String(e && e.message || e) }, 503); }
    return json({ ok: true, config: next });
  }

  // ---- POST: IA (generate | audit) ----
  if (req.method === 'POST') {
    const auth = await requireAdmin(req); if (auth) return auth;
    let body; try { body = await req.json(); } catch { body = {}; }
    const action = String(body.action || '');

    // ---- AUDIT: analiza toda la página y propone mejoras (antes/después) ----
    if (action === 'audit') {
      const pg = body.page || {};
      const compact = {
        title: safe(pg.title, 200),
        description: safe(pg.description, 400),
        h1: safe(pg.h1, 200),
        headings: Array.isArray(pg.headings) ? pg.headings.slice(0, 30).map(s => safe(s, 160)) : [],
        alts: Array.isArray(pg.alts) ? pg.alts.slice(0, 60).map(a => ({ src: safe(a.src, 200), alt: safe(a.alt, 200) })) : [],
        leads: Array.isArray(pg.leads) ? pg.leads.slice(0, 12).map(s => safe(s, 400)) : [],
      };
      const r = await callClaude({
        system: `Eres auditor SEO senior. ${BRAND_FACTS}
Analizas el contenido REAL de una página y propones mejoras de SEO concretas, SIN inventar datos (usa solo los hechos dados; corrige imprecisiones del producto si las ves, p.ej. HOSO es CON cabeza).
Cubre TODO: meta título, meta descripción, H1, encabezados, textos ALT de imágenes (clave para SEO de imágenes y accesibilidad) y textos lead. Para cada elemento que MEJORARÍAS, crea un hallazgo. No propongas cambios cosméticos sin valor SEO.
Devuelve SOLO JSON: {"findings":[{"type": "title|description|h1|heading|alt|content", "src": "(solo para alt: el src exacto de la imagen)", "current": "texto/alt actual exacto", "proposed": "versión mejorada", "reason": "por qué mejora el SEO (breve)", "severity": "alta|media|baja"}]}.
Reglas: título <=60 car, descripción 140-155 car, ALT descriptivos con keyword (5-12 palabras), naturales. Máx 18 hallazgos, ordénalos por severidad (alta primero). Español de España.`,
        messages: [{ role: 'user', content: `Audita esta página de Cabo Vírgenes (JSON):\n${JSON.stringify(compact)}` }],
        maxTokens: 3000, temperature: 0.4,
      });
      if (!r.ok) return json({ error: 'ai', message: r.message }, r.status || 502);
      const data = extractJson(r.text);
      if (!data || !Array.isArray(data.findings)) return json({ error: 'parse', message: 'La IA no devolvió hallazgos válidos.' }, 502);
      const findings = data.findings.slice(0, 24).map(f => ({
        type: safe(f.type, 20),
        src: safe(f.src, 200),
        current: safe(f.current, 600),
        proposed: safe(f.proposed, 600),
        reason: safe(f.reason, 300),
        severity: ['alta', 'media', 'baja'].includes(f.severity) ? f.severity : 'media',
      })).filter(f => f.proposed && f.type);
      return json({ ok: true, findings });
    }

    if (action !== 'generate') return json({ error: 'action' }, 400);
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
