// Edge function: inyecta en el HTML el SEO aprobado por Comunicación.
// Lee la config de Blobs (store 'cabo-seo') que escribe el admin vía /api/seo.
// Solo actúa si published === true. Sin config publicada, no toca nada
// (el HTML mantiene el SEO por defecto del repo).
import { getStore } from '@netlify/blobs';

const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default async (request, context) => {
  const res = await context.next();
  const ctype = res.headers.get('content-type') || '';
  if (!ctype.includes('text/html')) return res;

  let cfg = null;
  try {
    cfg = await getStore({ name: 'cabo-seo', consistency: 'strong' }).get('config.json', { type: 'json' });
  } catch { /* Blobs no disponible → no tocar */ }
  if (!cfg || !cfg.published) return res;

  let html = await res.text();
  const url = new URL(request.url);
  const isHome = url.pathname === '/' || url.pathname === '/index.html';

  // Meta por página: home usa cfg.title/description; el resto, cfg.metaByPath[path].
  const pm = isHome ? { title: cfg.title, description: cfg.description } : ((cfg.metaByPath && cfg.metaByPath[url.pathname]) || {});

  // --- <title> ---
  if (pm.title) {
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escHtml(pm.title)}</title>`);
  }
  // --- meta description ---
  if (pm.description) {
    html = html.replace(/(<meta\s+name="description"\s+content=")[^"]*(")/i, `$1${escAttr(pm.description)}$2`);
  }
  // --- Open Graph / Twitter (título, descripción, imagen) ---
  const ogTitle = pm.title;
  const ogDesc = pm.description;
  const setMetaProp = (prop, val) => {
    if (!val) return;
    const re = new RegExp(`(<meta\\s+property="${prop}"\\s+content=")[^"]*(")`, 'i');
    html = html.replace(re, `$1${escAttr(val)}$2`);
  };
  const setMetaName = (name, val) => {
    if (!val) return;
    const re = new RegExp(`(<meta\\s+name="${name}"\\s+content=")[^"]*(")`, 'i');
    html = html.replace(re, `$1${escAttr(val)}$2`);
  };
  if (ogTitle) { setMetaProp('og:title', ogTitle); setMetaName('twitter:title', ogTitle); }
  if (ogDesc) { setMetaProp('og:description', ogDesc); setMetaName('twitter:description', ogDesc); }
  if (cfg.ogImage) { setMetaProp('og:image', absUrl(cfg.ogImage, url)); setMetaName('twitter:image', absUrl(cfg.ogImage, url)); }

  // --- ALT de imágenes (del Editor Visual SEO) ---
  if (cfg.altOverrides && typeof cfg.altOverrides === 'object') {
    for (const [src, alt] of Object.entries(cfg.altOverrides)) {
      if (!src || !alt) continue;
      const re = new RegExp(`<img\\b[^>]*\\bsrc=["']${escRe(src)}["'][^>]*>`, 'i');
      html = html.replace(re, (tag) => /\balt=/i.test(tag)
        ? tag.replace(/\balt=("|')[^"']*\1/i, `alt="${escAttr(alt)}"`)
        : tag.replace(/<img\b/i, `<img alt="${escAttr(alt)}"`));
    }
  }
  // --- Textos visibles (encabezados/leads) del Editor Visual SEO ---
  if (Array.isArray(cfg.textOverrides)) {
    for (const o of cfg.textOverrides) {
      if (o && o.find && o.replace && html.includes(o.find)) {
        html = html.replace(o.find, () => escHtml(o.replace));
      }
    }
  }

  // --- favicon (data-url o ruta) → inyecta un <link rel="icon"> que gana ---
  if (cfg.favicon) {
    html = html.replace(/<\/head>/i, `<link rel="icon" href="${escAttr(cfg.favicon)}" />\n<link rel="apple-touch-icon" href="${escAttr(cfg.favicon)}" />\n</head>`);
  }

  // --- FAQPage JSON-LD (solo en la home) ---
  if (isHome && Array.isArray(cfg.faq) && cfg.faq.length) {
    const faq = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: cfg.faq.filter(f => f && f.q && f.a).map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    };
    if (faq.mainEntity.length) {
      const block = `<script type="application/ld+json">${JSON.stringify(faq)}</script>\n</head>`;
      html = html.replace(/<\/head>/i, block);
    }
  }

  const headers = new Headers(res.headers);
  headers.delete('content-length');
  return new Response(html, { status: res.status, headers });
};

function absUrl(v, url) {
  if (/^(https?:|data:)/i.test(v)) return v;
  return url.origin + (v.startsWith('/') ? v : '/' + v);
}

export const config = { path: ['/', '/index.html', '/empleo.html', '/faqs.html'] };
