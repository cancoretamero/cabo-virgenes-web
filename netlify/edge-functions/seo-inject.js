// Edge function: inyecta en el HTML el SEO aprobado por Comunicación.
// Lee la config de Blobs (store 'cabo-seo') que escribe el admin vía /api/seo.
// Solo actúa si published === true. Sin config publicada, no toca nada
// (el HTML mantiene el SEO por defecto del repo).
import { getStore } from '@netlify/blobs';

const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default async (request, context) => {
  const res = await context.next();
  const ctype = res.headers.get('content-type') || '';
  if (!ctype.includes('text/html')) return res;

  let cfg = null;
  try {
    cfg = await getStore('cabo-seo').get('config.json', { type: 'json' });
  } catch { /* Blobs no disponible → no tocar */ }
  if (!cfg || !cfg.published) return res;

  let html = await res.text();
  const url = new URL(request.url);
  const isHome = url.pathname === '/' || url.pathname === '/index.html';

  // --- <title> ---
  if (cfg.title) {
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escHtml(cfg.title)}</title>`);
  }
  // --- meta description ---
  if (cfg.description) {
    html = html.replace(/(<meta\s+name="description"\s+content=")[^"]*(")/i, `$1${escAttr(cfg.description)}$2`);
  }
  // --- Open Graph / Twitter (título, descripción, imagen) ---
  const ogTitle = cfg.title;
  const ogDesc = cfg.description;
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

export const config = { path: ['/', '/index.html', '/empleo.html'] };
