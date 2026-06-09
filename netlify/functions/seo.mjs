// SEO / Buscador — config editable por Comunicación + propuestas con IA.
// GET  /api/seo            → config actual (para el admin y como fallback)
// PUT  /api/seo  {config}  → guarda config (auth)         [aplica/publica]
// POST /api/seo  {action:'generate', focus?} → propuestas IA (auth)
//
// La config se guarda en Netlify Blobs (store 'cabo-seo', clave 'config.json').
// La edge function 'seo-inject' la lee e inyecta el SEO aprobado en el HTML.
import { json, preflight, store, callClaude, extractJson, requireAdmin, safe, CLAUDE_MODEL, ANTHROPIC_VERSION } from './_lib.mjs';

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
  metaByPath: {},         // { '/empleo.html': {title, description} } meta por página
  updatedAt: null,
};

const BRAND_FACTS = `Cabo Vírgenes: empresa pesquera de LANGOSTINO AUSTRAL SALVAJE (Pleoticus muelleri), Atlántico Sudoccidental (FAO 41), Patagonia argentina. Parte de AISA Group (desde enero 2025; fundada 2008).
- 5 buques propios (3 fresqueros + 2 factoría), captura >10.000 t/año desde Puerto Rawson.
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
      metaByPath: (inc.metaByPath && typeof inc.metaByPath === 'object')
        ? Object.assign({}, cur.metaByPath || {}, Object.fromEntries(Object.entries(inc.metaByPath).slice(0, 20).map(([k, v]) => [safe(k, 120), { title: safe(v && v.title, 70), description: safe(v && v.description, 320) }])))
        : (cur.metaByPath || {}),
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
      const pageLabel = safe(pg.label, 60) || 'la página';
      const compact = {
        title: safe(pg.title, 200),
        description: safe(pg.description, 400),
        h1: safe(pg.h1, 200),
        headings: Array.isArray(pg.headings) ? pg.headings.slice(0, 18).map(s => safe(s, 160)) : [],
        alts: Array.isArray(pg.alts) ? pg.alts.slice(0, 22).map(a => ({ src: safe(a.src, 200), alt: safe(a.alt, 200) })) : [],
        leads: Array.isArray(pg.leads) ? pg.leads.slice(0, 8).map(s => safe(s, 400)) : [],
      };
      const SYS = `Eres auditor SEO senior. ${BRAND_FACTS}
Analizas el contenido REAL de "${pageLabel}" de Cabo Vírgenes y REHACES una versión optimizada para SEO, SIN inventar datos (usa solo los hechos dados; corrige imprecisiones del producto si las ves, p.ej. HOSO es CON cabeza).
Cubre TODO: meta título, meta descripción, H1, TODOS los encabezados, textos lead/visibles y los textos ALT de imágenes. PRIORIZA reescribir el contenido VISIBLE (H1, encabezados, leads) para que el antes/después se note: titulares más claros con la keyword principal (langostino austral salvaje, Patagonia, FAO 41) manteniendo el tono premium y SIN exagerar. Conserva el significado; mejora claridad + keyword + intención de búsqueda.
Devuelve SOLO JSON: {"findings":[{"type": "title|description|h1|heading|alt|content", "src": "(solo para alt: el src exacto de la imagen)", "current": "texto/alt actual EXACTO tal cual te lo doy", "proposed": "versión mejorada", "reason": "justificación SEO clara (1-2 frases)", "severity": "alta|media|baja"}]}.
Reglas: título <=60 car, descripción 140-155 car, ALT descriptivos con keyword (5-12 palabras). "current" debe coincidir EXACTO con el texto dado (para poder localizarlo). Máx 20 hallazgos. Español de España.
IMPORTANTE: responde ÚNICAMENTE con el objeto JSON. NO escribas absolutamente nada antes ni después (ni resúmenes, ni explicaciones, ni texto). Termina inmediatamente al cerrar el JSON con "}".`;
      const USER = `Audita y reoptimiza ${pageLabel} (JSON):\n${JSON.stringify(compact)}`;

      // --- STREAMING: emite los tokens de la IA en vivo (live stream) ---
      if (body.stream) {
        const key = process.env.ANTHROPIC_API_KEY;
        if (!key) return json({ error: 'config', message: 'Falta ANTHROPIC_API_KEY.' }, 503);
        let aRes;
        try {
          aRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': ANTHROPIC_VERSION },
            body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: 3500, temperature: 0.4, stream: true, system: SYS, messages: [{ role: 'user', content: USER }] }),
          });
        } catch (e) { return json({ error: 'ai', message: 'No se pudo contactar la IA.' }, 502); }
        if (!aRes.ok || !aRes.body) { const d = await aRes.text().catch(() => ''); return json({ error: 'ai', message: 'Error del servicio de IA.', detail: d.slice(0, 200) }, 502); }
        const reader = aRes.body.getReader();
        const dec = new TextDecoder(); const enc = new TextEncoder();
        let sse = '';
        const out = new ReadableStream({
          async pull(controller) {
            const { done, value } = await reader.read();
            if (done) { controller.close(); return; }
            sse += dec.decode(value, { stream: true });
            let nl;
            while ((nl = sse.indexOf('\n')) >= 0) {
              const line = sse.slice(0, nl); sse = sse.slice(nl + 1);
              if (line.startsWith('data:')) {
                const d = line.slice(5).trim();
                if (!d || d === '[DONE]') continue;
                try { const ev = JSON.parse(d); if (ev.type === 'content_block_delta' && ev.delta && typeof ev.delta.text === 'string') controller.enqueue(enc.encode(ev.delta.text)); } catch (e) {}
              }
            }
          },
          cancel() { try { reader.cancel(); } catch (e) {} },
        });
        return new Response(out, { headers: { 'content-type': 'text/plain; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'no-cache', 'x-accel-buffering': 'no' } });
      }

      // --- No streaming (fallback) ---
      const r = await callClaude({ system: SYS, messages: [{ role: 'user', content: USER }], maxTokens: 3500, temperature: 0.4 });
      if (!r.ok) return json({ error: 'ai', message: r.message }, r.status || 502);
      const data = extractJson(r.text);
      if (!data || !Array.isArray(data.findings)) return json({ error: 'parse', message: 'La IA no devolvió hallazgos válidos.' }, 502);
      const findings = data.findings.slice(0, 24).map(f => ({
        type: safe(f.type, 20), src: safe(f.src, 200), current: safe(f.current, 600),
        proposed: safe(f.proposed, 600), reason: safe(f.reason, 300),
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
