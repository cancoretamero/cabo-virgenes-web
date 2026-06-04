/* ============================================================
   CABO VÍRGENES — Editor visual + aplicación de overrides
   - Siempre: aplica textos/imágenes/legales editados en el admin
   - Con ?editor=1 (dentro del iframe del panel): edición en vivo
     · clic en un texto para editarlo
     · insignia ✎ en imágenes para reemplazarlas
     · autoguardado en localStorage (mismo origen que el panel)
   ============================================================ */
(function () {
  'use strict';
  const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const EDITOR = new URLSearchParams(location.search).has('editor');

  // Selectores de TEXTO editable (curados; se excluyen tarjetas de noticias = datos)
  const TEXT_SEL = [
    '.hero-title', '.hero-copy', '.hero-text .eyebrow',
    '.sec-title', '.lead', '.sec-text > p', '.sec-head .eyebrow', '.sec-text .eyebrow',
    '.kpi-title', '.kpi-label', '.kpi-card > p', '.kpi-num + .kpi-label',
    '.v-tag', '.v-body h3', '.v-body p',
    '.fmt-card h3', '.fmt-sub', '.fmt-desc', '.phc-body h3', '.phc-tag',
    '.flota-hero h3', '.fh-tag', '.sc-type', '.ship-card-v2 h3',
    '.plant-card h4', '.plant-tag',
    '.member__role', '.member__name', '.member__bio',
    '.cc-card h3', '.cc-card p', '.cc-tag',
    '.ft-tagline', '.ft-tagline-meta', '.footer h5',
    '.rasa-head h3', '.rasa-lead', '.rg-item figcaption strong', '.rg-item figcaption span',
    '#noticias .eyebrow', '#noticias .sec-title', '#noticias .lead'
  ].join(',');
  // Imágenes reemplazables
  const IMG_SEL = '.ship-img, .v-photo img, .sc-photo img, .fh-img img, .member__photo img, .phc-img img, .fmt-photo img, .flota-hero img';

  const LEGAL_MAP = { privacidad: 'modal-legal-privacidad', terminos: 'modal-legal-terminos', cookies: 'modal-legal-cookies', aviso: 'modal-legal-aviso' };

  function keyOf(el, list) { return list.indexOf(el); } // índice estable en HTML estático

  // ---------- Aplicar overrides (siempre) ----------
  function applyAll() {
    const content = read('cv_content', {});
    const texts = Array.from(document.querySelectorAll(TEXT_SEL));
    texts.forEach((el, i) => { if (content[i] != null) el.innerHTML = content[i]; });
    const imgs = read('cv_imgs', {});
    const imgEls = Array.from(document.querySelectorAll(IMG_SEL));
    imgEls.forEach((el, i) => { if (imgs[i]) el.src = imgs[i]; });
    const legal = read('cv_legal', {});
    Object.entries(LEGAL_MAP).forEach(([k, id]) => {
      if (!legal[k]) return;
      const art = document.querySelector('#' + id + ' .info-shell'); if (!art) return;
      const close = art.querySelector('.info-close'); const closeHTML = close ? close.outerHTML : '';
      art.innerHTML = closeHTML + legal[k];
    });
  }

  // ---------- Modo edición ----------
  function enterEditMode() {
    document.documentElement.classList.add('cv-editing');
    // Mostrar la sección de Noticias aunque esté oculta (para editarla)
    const news = document.getElementById('noticias');
    if (news) { news.hidden = false; news.dataset.editorForced = '1'; news.querySelectorAll('[data-reveal]').forEach(e => e.classList.add('in')); }
    document.querySelectorAll('[data-news-nav]').forEach(el => { el.hidden = false; });

    const content = read('cv_content', {});
    const texts = Array.from(document.querySelectorAll(TEXT_SEL));
    let saveT;
    const flush = () => { write('cv_content', content); };
    texts.forEach((el, i) => {
      el.classList.add('cv-ed-text');
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('spellcheck', 'false');
      el.addEventListener('input', () => { content[i] = el.innerHTML; clearTimeout(saveT); saveT = setTimeout(flush, 500); });
      el.addEventListener('blur', flush);
      el.addEventListener('keydown', e => { if (e.key === 'Enter' && /H[1-6]/.test(el.tagName)) { e.preventDefault(); el.blur(); } });
    });

    // Imágenes
    const imgs = read('cv_imgs', {});
    const imgEls = Array.from(document.querySelectorAll(IMG_SEL));
    imgEls.forEach((el, i) => {
      const wrap = el.parentElement;
      if (wrap && getComputedStyle(wrap).position === 'static') wrap.style.position = 'relative';
      const badge = document.createElement('button');
      badge.type = 'button'; badge.className = 'cv-ed-imgbtn'; badge.title = 'Reemplazar imagen';
      badge.innerHTML = '✎';
      badge.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
        inp.onchange = () => { const f = inp.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { el.src = r.result; imgs[i] = r.result; write('cv_imgs', imgs); toast('Imagen reemplazada'); }; r.readAsDataURL(f); };
        inp.click();
      });
      (wrap || el).appendChild(badge);
    });

    // Neutralizar clics que abren modales / navegan, para no estorbar la edición
    document.addEventListener('click', (e) => {
      const t = e.target;
      if (t.closest('.cv-ed-imgbtn')) return;
      if (t.closest('[contenteditable="true"]')) return; // permitir foco de texto
      const interactive = t.closest('[data-modal],a[href^="#"],a[href^="."],.more-link,.btn,.fmt-card,.ship-card-v2,.v-card,.member,.plant-card-clickable,[data-next-section],.rail-arrow');
      if (interactive) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    // Guardar por mensaje desde el panel
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'cv-save') { flush(); write('cv_imgs', imgs); try { e.source.postMessage({ type: 'cv-saved' }, '*'); } catch (_) {} toast('Cambios guardados'); }
    });

    // Mini-aviso
    const hint = document.createElement('div'); hint.className = 'cv-ed-hint';
    hint.textContent = 'Modo edición · clic en un texto para editarlo · ✎ en las imágenes';
    document.body.appendChild(hint);

    let tT; function toast(m) { hint.textContent = m; hint.classList.add('cv-ed-hint--flash'); clearTimeout(tT); tT = setTimeout(() => { hint.classList.remove('cv-ed-hint--flash'); hint.textContent = 'Modo edición · clic en un texto para editarlo · ✎ en las imágenes'; }, 1600); }

    // Estilos del editor
    const css = document.createElement('style');
    css.textContent = `
      .cv-editing .cv-ed-text{outline:1.5px dashed transparent;outline-offset:3px;border-radius:4px;transition:outline-color .15s,background .15s;cursor:text}
      .cv-editing .cv-ed-text:hover{outline-color:rgba(28,181,176,.6);background:rgba(28,181,176,.05)}
      .cv-editing .cv-ed-text:focus{outline:1.5px solid #1cb5b0;background:rgba(28,181,176,.08)}
      .cv-ed-imgbtn{position:absolute;top:8px;right:8px;z-index:30;width:30px;height:30px;border-radius:8px;background:rgba(6,18,40,.78);color:#fff;border:1px solid rgba(255,255,255,.25);font-size:14px;display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:0;transition:opacity .18s;backdrop-filter:blur(4px)}
      .cv-editing *:hover > .cv-ed-imgbtn,.cv-ed-imgbtn:hover{opacity:1}
      .cv-ed-hint{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:9999;background:#0b1a2c;color:#fff;font:600 12px/1 'Inter',sans-serif;padding:11px 18px;border-radius:100px;box-shadow:0 16px 40px -16px rgba(0,0,0,.5);letter-spacing:.02em}
      .cv-ed-hint--flash{background:#1cb5b0}
    `;
    document.head.appendChild(css);
  }

  function init() { applyAll(); if (EDITOR) enterEditMode(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  // refrescar overrides si cambian desde el panel (otra pestaña)
  window.addEventListener('storage', (e) => { if (!EDITOR && ['cv_content', 'cv_imgs', 'cv_legal'].includes(e.key)) applyAll(); });
})();
