/* ============================================================
   CABO VÍRGENES — Editor visual + aplicación de overrides
   Paridad total con el edit.js de Aisa, adaptado a sitio estático
   + localStorage (mismo origen admin ↔ web).

   - SIEMPRE (con o sin ?editor=1) aplica overrides:
       textos (cv_content) · imágenes (cv_imgs) · estilos (cv_styles)
       · legales (cv_legal) — todo indexado por autoKey estable.
   - Con ?editor=1 (dentro del iframe del panel /admin) entra en
     modo edición en vivo:
       · markText  → texto inline contenteditable
       · markMedia → insignia ✎ + panel Medio
       · markNav   → clic-derecho edita nav/CTAs/enlaces
       · barra flotante .cv-bar (Acciones/Texto/Bloque/Medio)
       · IA local determinista (Corregir / Mejorar)
       · Undo/Redo (snapshot, cap 60) + atajos ⌘Z/⇧⌘Z/⌘Y
       · save() → persiste + registra cv_audit + postMessage
   - Protocolo postMessage cv:* (compat legacy cv-save/cv-saved).
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- helpers de almacenamiento ---------------- */
  const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} };
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const uid = () => 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  const EDITOR = new URLSearchParams(location.search).has('editor');

  /* ---------------- selectores Cabo Vírgenes ---------------- */
  // Texto editable (curado; se excluyen tarjetas de noticias = datos).
  const TEXT_SEL = [
    '.hero-title', '.hero-copy', '.hero-text .eyebrow',
    '.sec-title', '.lead', '.sec-text > p', '.sec-head .eyebrow', '.sec-text .eyebrow',
    '.kpi-title', '.kpi-label', '.kpi-card > p',
    '.v-tag', '.v-body h3', '.v-body p',
    '.fmt-card h3', '.fmt-sub', '.fmt-desc', '.phc-tag', '.phc-body h3',
    '.flota-hero h3', '.fh-tag', '.sc-type', '.ship-card-v2 h3',
    '.plant-card h3', '.plant-tag', '.plant-list li',
    '.member__role', '.member__name', '.member__bio',
    '.cc-card h3', '.cc-card > p', '.cc-tag',
    '.qc-step h4', '.qc-step p', '.cert-title', '.qcv-front h3', '.qcv-front p',
    '.sp-card h3', '.sp-desc', '.bc-card h4', '.bc-desc',
    '.sv-caption h4', '.cf-title', '.contact-title',
    '.ft-tagline', '.ft-tagline-meta', '.footer h5',
    '.rasa-head h3', '.rasa-lead', '.rg-item figcaption strong', '.rg-item figcaption span',
    '.ml-item span', '.mip-eyebrow', '#mipTitle', '.mip-sub',
    '#noticias .eyebrow', '#noticias .sec-title', '#noticias .lead'
  ].join(',');

  // Imágenes / vídeos reemplazables.
  const IMG_SEL = '.ship-img,.v-photo img,.sc-photo img,.fh-img img,.member__photo img,.phc-img img,.fmt-photo img,.flota-hero img,.rg-item img,.hero-media img,.player-poster img';

  // Enlaces / CTAs que se editan con clic-derecho (no contenteditable directo).
  const NAV_SEL = '.nav-dropdown a,.navpill a,.drawer a,.footer-grid a,.footer-base a,.hero-cta .btn,.mf-btn,.more-link,[data-modal],[data-legal],.cc-card,.sp-cta,.bc-cta';

  // Zonas SIEMPRE excluidas de toda edición.
  const SKIP_SEL = '#worldMap,.leaflet-container,.cert-marquee,.cert-track,.fab-stack,.lang-flag,.lang-menu,.cv-bar,.side-rail,.num-rail,.rail-arrow,svg,.play-btn,.nav-menu,.drawer-close';

  const LEGAL_MAP = { privacidad: 'modal-legal-privacidad', terminos: 'modal-legal-terminos', cookies: 'modal-legal-cookies', aviso: 'modal-legal-aviso', datos: 'modal-legal-datos' };
  // cv_legal soporta dos formatos: nuevo { tipo:{title,updated,html} } y antiguo { tipo:"<html>" }.
  const legalHtml = (v) => (v && typeof v === 'object') ? (v.html || '') : (typeof v === 'string' ? v : '');

  /* ---------------- autoKey (idéntico en grabación y aplicación) ---------------- */
  function autoKey(node) {
    let scope = node.closest('section[id], header, footer');
    let pid = scope && scope.id ? scope.id : (scope ? scope.tagName.toLowerCase() : 'doc');
    let parts = [];
    let el = node;
    while (el && el !== scope && el !== document.body) {
      let tag = el.tagName.toLowerCase();
      let i = 1, s = el;
      while ((s = s.previousElementSibling)) { if (s.tagName === el.tagName) i++; }
      parts.unshift(tag + '[' + i + ']');
      el = el.parentElement;
    }
    return '@' + pid + '/' + parts.join('>');
  }
  // Clave de texto: data-k explícita o autoKey.
  const keyText = (n) => n.getAttribute('data-k') || autoKey(n);
  // Clave de media: data-mk explícita o autoKey.
  const keyMedia = (n) => n.getAttribute('data-mk') || autoKey(n);

  /* ---------------- aplicación de estilo de bloque ---------------- */
  function applyBlockStyle(node, st) {
    if (!node) return;
    st = st || {};
    const widthMap = { narrow: '34ch', normal: '', wide: '62ch', full: 'none' };
    // Ancho
    if (st.width) {
      const mw = widthMap[st.width];
      const disp = getComputedStyle(node).display;
      if (disp === 'inline') node.style.display = 'inline-block';
      node.style.maxWidth = (mw === undefined ? '' : mw);
      if (st.width === 'full') node.style.width = '100%';
      else node.style.removeProperty('width');
      // Centrar bloques estrechados salvo que align lo controle.
      if ((st.width === 'narrow' || st.width === 'wide') && !st.align) {
        node.style.marginLeft = 'auto'; node.style.marginRight = 'auto';
      } else if (!st.align) {
        node.style.removeProperty('margin-left'); node.style.removeProperty('margin-right');
      }
    } else {
      node.style.removeProperty('max-width');
      node.style.removeProperty('width');
    }
    // Alineación
    if (st.align) {
      node.style.textAlign = st.align;
      if (st.align === 'center') { node.style.marginLeft = 'auto'; node.style.marginRight = 'auto'; }
    } else {
      node.style.removeProperty('text-align');
    }
    // Color de texto
    if (st.color) node.style.color = st.color; else node.style.removeProperty('color');
    // Fondo (CTAs)
    if (st.bg) {
      node.style.backgroundColor = st.bg;
      node.style.backgroundImage = 'none';
      node.style.borderColor = 'transparent';
    } else {
      node.style.removeProperty('background-color');
      node.style.removeProperty('background-image');
      node.style.removeProperty('border-color');
    }
    // Desplazamiento (nudge) clamp ±80px
    const dx = clamp(+st.dx || 0, -80, 80);
    const dy = clamp(+st.dy || 0, -80, 80);
    if (dx || dy) node.style.transform = `translate(${dx}px,${dy}px)`;
    else node.style.removeProperty('transform');
  }

  /* ---------------- aplicar overrides (SIEMPRE) ---------------- */
  function applyAll() {
    const content = read('cv_content', {});
    const styles = read('cv_styles', {});
    const imgs = read('cv_imgs', {});
    const legal = read('cv_legal', {});

    // Texto + estilo por autoKey.
    $$(TEXT_SEL).forEach((el) => {
      const k = keyText(el);
      if (content[k] != null) el.innerHTML = content[k];
      if (styles[k]) applyBlockStyle(el, styles[k]);
    });

    // Estilos sobre nodos que no son de texto pero sí tienen override (CTAs nav, etc.).
    $$(NAV_SEL).forEach((el) => {
      const k = keyText(el);
      if (styles[k]) applyBlockStyle(el, styles[k]);
    });

    // Media por autoKey.
    $$(IMG_SEL).forEach((el) => {
      const k = keyMedia(el);
      const url = imgs[k];
      if (url) applyMedia(el, url);
    });

    // Legales (innerHTML del shell, preservando el botón cerrar).
    Object.entries(LEGAL_MAP).forEach(([k, id]) => {
      const html = legalHtml(legal[k]);
      if (!html) return;
      const art = $('#' + id + ' .info-shell'); if (!art) return;
      const close = art.querySelector('.info-close');
      const closeHTML = close ? close.outerHTML : '';
      art.innerHTML = closeHTML + html;
    });
  }

  function applyMedia(node, url) {
    if (!node) return;
    const tag = node.tagName;
    if (tag === 'IMG') { node.src = url; node.removeAttribute('srcset'); }
    else if (tag === 'VIDEO') {
      node.src = url;
      const src = node.querySelector('source'); if (src) src.src = url;
      try { node.load(); } catch (_) {}
    } else {
      node.style.backgroundImage = `url("${url}")`;
    }
  }

  /* ============================================================
     A PARTIR DE AQUÍ: solo en modo editor (?editor=1)
     ============================================================ */
  if (!EDITOR) {
    function boot() { applyAll(); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
    // Reaplicar overrides si cambian desde el panel (otra pestaña).
    window.addEventListener('storage', (e) => {
      if (['cv_content', 'cv_imgs', 'cv_styles', 'cv_legal'].includes(e.key)) applyAll();
    });
    return;
  }

  /* ---------------- estado del editor ---------------- */
  const changedTexts = {};   // key → innerHTML
  const changedMedia = {};   // key → url
  const changedStyles = {};  // key → {width,align,color,bg,dx,dy}
  const origTexts = {};      // key → innerHTML original
  const origMedia = {};      // key → url original
  const origStyles = {};     // key → estilo original (vacío)
  const touchedText = new Set(), touchedMedia = new Set(), touchedStyle = new Set();
  const nodeByKey = {}, mediaNodeByKey = {};

  let dirty = false;
  let activeBlock = null;    // bloque de texto enfocado
  let activeMedia = null;    // media seleccionada
  let savedRange = null;     // rango de selección guardado
  let aiBusy = false;

  // Historial undo/redo.
  let history = [];
  let hIndex = -1;
  let applyingSnapshot = false;

  /* ---------------- mensajería con el host ---------------- */
  function post(msg) { try { parent.postMessage(msg, '*'); } catch (_) {} }
  function emitDirty(v) { dirty = v; post({ type: 'cv:dirty', dirty: v }); }
  function emitToast(msg, kind) { post({ type: 'cv:toast', msg, kind: kind || 'info' }); flashHint(msg); }
  function emitHistory() { post({ type: 'cv:history', canUndo: hIndex > 0, canRedo: hIndex < history.length - 1 }); paintHistoryButtons(); }

  /* ---------------- registro de cambios ---------------- */
  function recordText(node) {
    const k = keyText(node);
    nodeByKey[k] = node;
    if (!(k in origTexts)) origTexts[k] = node.innerHTML;
    changedTexts[k] = node.innerHTML;
    touchedText.add(k);
    emitDirty(true);
  }
  function recordMedia(node, url) {
    const k = keyMedia(node);
    mediaNodeByKey[k] = node;
    changedMedia[k] = url;
    touchedMedia.add(k);
    emitDirty(true);
  }
  function recordStyle(node, patch) {
    const k = keyText(node);
    nodeByKey[k] = node;
    const cur = changedStyles[k] || read('cv_styles', {})[k] || {};
    const next = Object.assign({}, cur, patch);
    // Limpiar claves vacías para no ensuciar.
    Object.keys(next).forEach(p => { if (next[p] === '' || next[p] == null) delete next[p]; });
    changedStyles[k] = next;
    touchedStyle.add(k);
    applyBlockStyle(node, next);
    emitDirty(true);
  }

  /* ============================================================
     ENABLE
     ============================================================ */
  function enable() {
    document.documentElement.classList.add('cv-editing');
    injectChrome();

    // Forzar visible la sección Noticias (para poder editarla aunque esté oculta).
    const news = document.getElementById('noticias');
    if (news) {
      news.hidden = false; news.dataset.editorForced = '1';
      news.querySelectorAll('[data-reveal]').forEach(e => e.classList.add('in'));
    }
    $$('[data-news-nav]').forEach(el => { el.hidden = false; });
    // Asegurar reveals visibles en edición.
    $$('[data-reveal]').forEach(e => e.classList.add('in'));

    applyAll();
    markText();
    markMedia();
    markNav();
    buildBar();
    bindSelection();
    bindKeys();
    bindInbound();
    pushHistory(); // snapshot inicial

    post({ type: 'cv:ready' });
    flashHint('Modo edición · clic en un texto · ✎ en imágenes · clic-derecho en enlaces');
  }

  /* ---------------- ¿este nodo es excluible? ---------------- */
  function isSkipped(node) {
    if (!node || node.nodeType !== 1) return true;
    if (node.closest(SKIP_SEL)) return true;
    return false;
  }
  // Hoja de texto editable: sin hijos que también sean editables.
  function isLeaf(node) {
    return !node.querySelector(TEXT_SEL);
  }

  /* ============================================================
     TEXTO INLINE — contenteditable (markText)
     ============================================================ */
  function markText() {
    $$(TEXT_SEL).forEach((node) => {
      if (isSkipped(node)) return;
      if (!isLeaf(node)) return;                 // saltar contenedores con hojas dentro
      if (node.closest(NAV_SEL) && !node.hasAttribute('data-k')) return; // los enlaces van a clic-derecho

      const k = keyText(node);
      nodeByKey[k] = node;
      if (!(k in origTexts)) origTexts[k] = node.innerHTML;

      node.classList.add('cv-ed-text');
      node.setAttribute('contenteditable', 'true');
      node.setAttribute('spellcheck', 'false');

      node.addEventListener('focus', () => focusBlock(node));
      node.addEventListener('blur', () => {
        node.classList.remove('cv-ed-focus');
        if (node.__edited) { node.__edited = false; pushHistory(); }
      });
      node.addEventListener('input', () => {
        node.__edited = true;
        recordText(node);
      });
      node.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !/^(DIV|P|LI)$/.test(node.tagName)) {
          e.preventDefault(); node.blur();
        }
      });
    });
  }

  function focusBlock(node) {
    activeBlock = node;
    node.classList.add('cv-ed-focus');
    refreshBar();
  }

  /* ============================================================
     MEDIA — insignia ✎ + panel (markMedia)
     ============================================================ */
  function markMedia() {
    $$(IMG_SEL).forEach((node) => {
      if (isSkipped(node)) return;
      const k = keyMedia(node);
      mediaNodeByKey[k] = node;
      if (!(k in origMedia)) {
        origMedia[k] = node.tagName === 'IMG' ? node.getAttribute('src') : (node.src || '');
      }
      node.classList.add('cv-ed-media');

      // Host para la insignia.
      const host = node.closest('figure, picture, .ship-cutout, .v-photo, .sc-photo, .fh-img, .phc-img, .fmt-photo, .member__photo, .rg-item') || node.parentElement || node;
      if (host && getComputedStyle(host).position === 'static') host.style.position = 'relative';

      // Una insignia por host.
      if (host && host.querySelector(':scope > .cv-ed-badge')) {
        // ya existe: enlazar al primer nodo
      } else if (host) {
        const badge = document.createElement('button');
        badge.type = 'button';
        badge.className = 'cv-ed-badge';
        badge.innerHTML = (node.tagName === 'VIDEO' ? '✎ Vídeo' : '✎ Imagen');
        badge.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); showMedia(node); });
        host.appendChild(badge);
      }

      // Click directo sobre la media (fase captura) también abre el panel.
      node.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); showMedia(node); }, true);
    });
  }

  function showMedia(node) {
    activeMedia = node;
    $$('.cv-ed-media').forEach(m => m.classList.remove('cv-ed-media-on'));
    node.classList.add('cv-ed-media-on');
    refreshBar();
    flashHint('Medio seleccionado · Subir archivo o pegar URL desde la barra');
  }

  function pickFile() {
    if (!activeMedia) return;
    const isVideo = activeMedia.tagName === 'VIDEO';
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = isVideo ? 'video/*' : 'image/*';
    inp.onchange = () => {
      const f = inp.files && inp.files[0]; if (!f) return;
      const capMB = isVideo ? 40 : 8;
      if (f.size > capMB * 1024 * 1024) { emitToast(`Archivo demasiado grande (máx ${capMB}MB)`, 'err'); return; }
      const r = new FileReader();
      r.onload = () => {
        applyMedia(activeMedia, r.result);
        recordMedia(activeMedia, r.result);
        pushHistory();
        emitToast(isVideo ? 'Vídeo reemplazado' : 'Imagen reemplazada', 'ok');
      };
      r.readAsDataURL(f);
    };
    inp.click();
  }

  function pasteUrl() {
    if (!activeMedia) return;
    const url = window.prompt('Pega la URL de la imagen/vídeo:', '');
    if (!url) return;
    applyMedia(activeMedia, url.trim());
    recordMedia(activeMedia, url.trim());
    pushHistory();
    emitToast('Medio actualizado', 'ok');
  }

  /* ============================================================
     NAV / CTAs / enlaces — clic-derecho edita (markNav)
     ============================================================ */
  function markNav() {
    $$(NAV_SEL).forEach((node) => {
      if (isSkipped(node)) return;
      if (node.hasAttribute('data-k')) return; // ya editable como texto
      node.classList.add('cv-ed-nav');

      // Clic simple → bloqueado + hint.
      node.addEventListener('click', (e) => {
        if (e.target.closest('.cv-ed-badge')) return;
        e.preventDefault(); e.stopPropagation();
        flashHint('Doble clic para abrir · clic derecho para editar el texto');
      });

      // Doble clic → seguir enlace (re-añade ?editor=1 en mismo origen).
      node.addEventListener('dblclick', (e) => {
        e.preventDefault(); e.stopPropagation();
        followLink(node);
      });

      // Clic derecho → editar etiqueta inline.
      node.addEventListener('contextmenu', (e) => {
        e.preventDefault(); e.stopPropagation();
        editNavLabel(node);
      });
    });
  }

  function followLink(node) {
    const href = node.getAttribute('href');
    if (href && href.charAt(0) === '#') {
      const target = document.getElementById(href.slice(1));
      if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    }
    if (href && /^https?:|^\.|^\//.test(href)) {
      // Mismo origen → re-añadir ?editor=1.
      try {
        const u = new URL(href, location.href);
        if (u.origin === location.origin) { u.searchParams.set('editor', '1'); location.href = u.href; return; }
      } catch (_) {}
      window.open(href, '_blank', 'noopener');
      return;
    }
    // No navegable (data-modal, etc.) → editar etiqueta.
    editNavLabel(node);
  }

  function editNavLabel(node) {
    // Elegir el span de texto interno (excluye flechas/iconos), o el propio nodo.
    let target = node.querySelector('.nav-name, span:not([class*="arrow"]):not([class*="circle"]):not([class*="ico"]):not(.btn-arrow):not(.more-circle):not(.cc-meta)') || node;
    // Si el target contiene SVG/hijos, usar el nodo con solo texto.
    if (target.querySelector('svg') && target !== node) target = node;

    target.setAttribute('contenteditable', 'true');
    target.classList.add('cv-ed-navedit');
    target.focus();
    // Seleccionar todo.
    try {
      const r = document.createRange(); r.selectNodeContents(target);
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    } catch (_) {}
    activeBlock = target;
    refreshBar();

    const finish = () => {
      target.removeAttribute('contenteditable');
      target.classList.remove('cv-ed-navedit');
      recordText(target);
      pushHistory();
      activeBlock = null; refreshBar();
      target.removeEventListener('blur', finish);
      target.removeEventListener('keydown', onKey);
    };
    const onKey = (e) => { if (e.key === 'Enter') { e.preventDefault(); target.blur(); } if (e.key === 'Escape') { target.blur(); } };
    target.addEventListener('blur', finish, { once: true });
    target.addEventListener('keydown', onKey);
  }

  /* ============================================================
     SELECCIÓN — guardar rango + repintar estados
     ============================================================ */
  function bindSelection() {
    // Devuelve el elemento más cercano (o null) de forma segura aunque e.target
    // sea document/window/un nodo de texto (eventos sintéticos o de selección).
    const elOf = (t) => (t && t.closest ? t : (t && t.parentElement) || null);
    const hit = (e, sel) => { const el = elOf(e.target); return el ? el.closest(sel) : null; };
    document.addEventListener('mouseup', (e) => { if (!hit(e, '.cv-bar')) updateSel(); });
    document.addEventListener('keyup', (e) => { if (e.shiftKey || e.key === 'ArrowLeft' || e.key === 'ArrowRight') updateSel(); });
    document.addEventListener('mousedown', (e) => {
      if (hit(e, '.cv-bar')) return;
      if (hit(e, '.cv-ed-media') || hit(e, '.cv-ed-badge')) return;
      if (!hit(e, '.cv-ed-text') && !hit(e, '.cv-ed-navedit')) {
        // clic fuera: limpiar contexto de media (no de texto, que lo gestiona focus/blur)
        if (!hit(e, '.cv-ed-media-on')) clearMedia();
      }
    });
  }

  function updateSel() {
    const sel = getSelection();
    if (sel && sel.rangeCount) {
      const r = sel.getRangeAt(0);
      const host = (r.commonAncestorContainer.nodeType === 1 ? r.commonAncestorContainer : r.commonAncestorContainer.parentElement);
      if (host && (host.closest('.cv-ed-text') || host.closest('.cv-ed-navedit'))) {
        savedRange = r.cloneRange();
        activeBlock = host.closest('.cv-ed-text') || host.closest('.cv-ed-navedit');
        refreshBar();
        paintSelStates();
      }
    }
  }

  function restoreRange() {
    if (!savedRange) return false;
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRange);
    return true;
  }

  function clearMedia() {
    activeMedia = null;
    $$('.cv-ed-media-on').forEach(m => m.classList.remove('cv-ed-media-on'));
    refreshBar();
  }

  /* ============================================================
     BARRA FLOTANTE .cv-bar — 4 grupos contextuales
     ============================================================ */
  const PALETTE = [
    ['Oro', '#e9b048'], ['Teal', '#1cb5b0'], ['Tinta', '#0b1a2c'], ['Profundo', '#0a2c5e'],
    ['Cielo', '#9fd9e8'], ['Gris', '#6b7a8a'], ['Blanco', '#ffffff'], ['Negro', '#06121f']
  ];
  const FONTS = [
    ['fx-display', 'Aa', 'Display'], ['fx-serif', 'Aa', 'Serif'],
    ['fx-sans', 'Aa', 'Sans'], ['fx-mono', 'Aa', 'Mono']
  ];

  let bar = null;
  function buildBar() {
    bar = document.createElement('div');
    bar.className = 'cv-bar';
    bar.setAttribute('role', 'toolbar');

    const swColor = PALETTE.map(([n, c]) =>
      `<button type="button" class="cv-sw" data-color="${c}" title="${n}" style="--sw:${c}"></button>`).join('');
    const swBg = PALETTE.map(([n, c]) =>
      `<button type="button" class="cv-sw" data-bg="${c}" title="${n}" style="--sw:${c}"></button>`).join('') +
      `<button type="button" class="cv-mini" data-bg="" title="Sin fondo">∅</button>`;
    const fontBtns = FONTS.map(([cls, gly, lbl]) =>
      `<button type="button" class="cv-font ${cls}" data-font="${cls}" title="${lbl}">${gly}</button>`).join('');

    bar.innerHTML = `
      <div class="cv-grp cv-grp-act">
        <button type="button" class="cv-btn" data-act="undo" title="Deshacer (⌘Z)">↶</button>
        <button type="button" class="cv-btn" data-act="redo" title="Rehacer (⇧⌘Z)">↷</button>
      </div>
      <div class="cv-grp cv-grp-text cv-grp-off">
        <span class="cv-sep"></span>
        <button type="button" class="cv-btn" data-cmd="bold" title="Negrita"><b>B</b></button>
        <button type="button" class="cv-btn" data-cmd="italic" title="Cursiva"><i>I</i></button>
        <button type="button" class="cv-btn" data-cmd="underline" title="Subrayado"><u>U</u></button>
        <span class="cv-sep"></span>
        <span class="cv-fonts">${fontBtns}</span>
        <span class="cv-sep"></span>
        <span class="cv-swatches">${swColor}</span>
        <span class="cv-sep"></span>
        <button type="button" class="cv-btn" data-clear="1" title="Quitar formato">⌫</button>
        <button type="button" class="cv-btn cv-ai" data-ai="proofread" title="Corregir con IA">✓</button>
        <button type="button" class="cv-btn cv-ai" data-ai="improve" title="Mejorar con IA">✦</button>
      </div>
      <div class="cv-grp cv-grp-block cv-grp-off">
        <span class="cv-sep"></span>
        <span class="cv-mini-grp" title="Ancho">
          <button type="button" class="cv-mini" data-width="narrow" title="Estrecho">▮</button>
          <button type="button" class="cv-mini" data-width="normal" title="Normal">▭</button>
          <button type="button" class="cv-mini" data-width="wide" title="Ancho">▬</button>
          <button type="button" class="cv-mini" data-width="full" title="Completo">⬛</button>
        </span>
        <span class="cv-mini-grp" title="Alinear">
          <button type="button" class="cv-mini" data-align="left" title="Izquierda">⇤</button>
          <button type="button" class="cv-mini" data-align="center" title="Centro">↔</button>
          <button type="button" class="cv-mini" data-align="right" title="Derecha">⇥</button>
        </span>
        <span class="cv-mini-grp" title="Mover">
          <button type="button" class="cv-mini" data-nudge="left" title="←">←</button>
          <button type="button" class="cv-mini" data-nudge="up" title="↑">↑</button>
          <button type="button" class="cv-mini" data-nudge="down" title="↓">↓</button>
          <button type="button" class="cv-mini" data-nudge="right" title="→">→</button>
          <button type="button" class="cv-mini" data-nudge="reset" title="Reiniciar">⊙</button>
        </span>
        <span class="cv-grp-bg cv-grp-off">
          <span class="cv-sep"></span>
          <span class="cv-swatches">${swBg}</span>
        </span>
      </div>
      <div class="cv-grp cv-grp-media cv-grp-off">
        <span class="cv-sep"></span>
        <button type="button" class="cv-btn" data-pick="1" title="Subir archivo">⇅</button>
        <button type="button" class="cv-btn" data-url="1" title="Pegar URL">↪</button>
      </div>`;

    document.body.appendChild(bar);

    // No perder selección al pulsar la barra.
    bar.addEventListener('mousedown', (e) => { e.preventDefault(); });
    bar.addEventListener('click', onBarClick);
  }

  function setGrp(cls, on) {
    const g = bar.querySelector('.' + cls);
    if (g) g.classList.toggle('cv-grp-off', !on);
  }

  function refreshBar() {
    if (!bar) return;
    const hasText = !!activeBlock;
    const hasMedia = !!activeMedia;
    setGrp('cv-grp-text', hasText);
    setGrp('cv-grp-block', hasText);
    setGrp('cv-grp-media', hasMedia);
    // Subgrupo Fondo solo si el bloque es CTA.
    const isCta = hasText && activeBlock.closest('.btn,.more-link,.mf-btn,.cc-card,.sp-cta,.bc-cta,[data-modal]');
    const bg = bar.querySelector('.cv-grp-bg');
    if (bg) bg.classList.toggle('cv-grp-off', !isCta);
    paintHistoryButtons();
  }

  function paintSelStates() {
    if (!bar) return;
    const set = (sel, on) => { const b = bar.querySelector(sel); if (b) b.classList.toggle('cv-on', on); };
    try {
      set('[data-cmd="bold"]', document.queryCommandState('bold'));
      set('[data-cmd="italic"]', document.queryCommandState('italic'));
      set('[data-cmd="underline"]', document.queryCommandState('underline'));
    } catch (_) {}
    // Fuente activa: buscar ancestro fx-* de la selección.
    bar.querySelectorAll('.cv-font').forEach(b => b.classList.remove('cv-on'));
    const sel = getSelection();
    if (sel && sel.rangeCount) {
      let n = sel.getRangeAt(0).commonAncestorContainer;
      if (n.nodeType !== 1) n = n.parentElement;
      const fx = n && n.closest('.fx-display,.fx-serif,.fx-sans,.fx-mono');
      if (fx) {
        const cls = ['fx-display', 'fx-serif', 'fx-sans', 'fx-mono'].find(c => fx.classList.contains(c));
        if (cls) set('[data-font="' + cls + '"]', true);
      }
    }
  }

  /* ---------------- despacho de la barra ---------------- */
  function onBarClick(e) {
    const btn = e.target.closest('button'); if (!btn) return;
    const d = btn.dataset;

    if (d.act === 'undo') { undo(); return; }
    if (d.act === 'redo') { redo(); return; }

    // Acciones de medio.
    if (d.pick) { pickFile(); return; }
    if (d.url) { pasteUrl(); return; }

    // Acciones de bloque (no necesitan selección de texto).
    if (d.width) { if (activeBlock) { recordStyle(activeBlock, { width: d.width }); pushHistory(); } return; }
    if (d.align) { if (activeBlock) { recordStyle(activeBlock, { align: d.align }); pushHistory(); } return; }
    if (d.nudge) { nudgeBlock(d.nudge); return; }
    if ('bg' in d) { if (activeBlock) { recordStyle(activeBlock, { bg: d.bg }); pushHistory(); } return; }

    // Acciones inline de texto: requieren restaurar selección.
    if (d.cmd) { restoreRange(); document.execCommand(d.cmd, false, null); afterInline(); return; }
    if (d.font) { applyFont(d.font); return; }
    if (d.color) { applyColor(d.color); return; }
    if (d.clear) { clearFormat(); return; }
    if (d.ai) { runAI(d.ai, btn); return; }
  }

  function afterInline() {
    if (activeBlock) recordText(activeBlock);
    paintSelStates();
    updateSel();
    pushHistory();
  }

  /* ---------------- fuentes (conmutan, nunca anidan) ---------------- */
  function applyFont(cls) {
    if (!restoreRange()) return;
    const sel = getSelection(); if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    unwrapFxIn(range);
    const span = document.createElement('span');
    span.className = cls;
    try {
      range.surroundContents(span);
    } catch (_) {
      const frag = range.extractContents();
      span.appendChild(frag);
      range.insertNode(span);
    }
    // Reseleccionar el span.
    const r = document.createRange(); r.selectNodeContents(span);
    sel.removeAllRanges(); sel.addRange(r);
    savedRange = r.cloneRange();
    afterInline();
  }

  /* ---------------- color (determinista: span con color inline, conmuta) ---------------- */
  function applyColor(color) {
    if (!restoreRange()) return;
    const sel = getSelection(); if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;
    unwrapColorIn(range);
    const span = document.createElement('span');
    span.className = 'cv-fc';
    span.style.color = color;
    try {
      range.surroundContents(span);
    } catch (_) {
      const frag = range.extractContents();
      span.appendChild(frag);
      range.insertNode(span);
    }
    const r = document.createRange(); r.selectNodeContents(span);
    sel.removeAllRanges(); sel.addRange(r);
    savedRange = r.cloneRange();
    afterInline();
  }
  function unwrapColorIn(range) {
    const host = range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
    if (!host) return;
    const root = host.closest('.cv-ed-text, .cv-ed-navedit') || host;
    root.querySelectorAll('span.cv-fc').forEach((span) => {
      if (range.intersectsNode(span)) {
        const parent = span.parentNode;
        while (span.firstChild) parent.insertBefore(span.firstChild, span);
        parent.removeChild(span);
        parent.normalize();
      }
    });
  }

  function unwrapFxIn(range) {
    const host = range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
    if (!host) return;
    const root = host.closest('.cv-ed-text, .cv-ed-navedit') || host;
    root.querySelectorAll('.fx-display,.fx-serif,.fx-sans,.fx-mono').forEach((span) => {
      if (range.intersectsNode(span)) {
        const parent = span.parentNode;
        while (span.firstChild) parent.insertBefore(span.firstChild, span);
        parent.removeChild(span);
        parent.normalize();
      }
    });
  }

  function clearFormat() {
    restoreRange();
    try { document.execCommand('styleWithCSS', false, false); } catch (_) {}
    document.execCommand('removeFormat', false, null);
    const sel = getSelection();
    if (sel.rangeCount) { unwrapFxIn(sel.getRangeAt(0)); unwrapColorIn(sel.getRangeAt(0)); }
    afterInline();
  }

  /* ---------------- nudge (mover bloque) ---------------- */
  function nudgeBlock(dir) {
    if (!activeBlock) return;
    const k = keyText(activeBlock);
    const cur = changedStyles[k] || read('cv_styles', {})[k] || {};
    let dx = +cur.dx || 0, dy = +cur.dy || 0;
    const STEP = 8;
    if (dir === 'left') dx -= STEP;
    else if (dir === 'right') dx += STEP;
    else if (dir === 'up') dy -= STEP;
    else if (dir === 'down') dy += STEP;
    else if (dir === 'reset') { dx = 0; dy = 0; }
    dx = clamp(dx, -80, 80); dy = clamp(dy, -80, 80);
    recordStyle(activeBlock, { dx, dy });
    pushHistory();
  }

  /* ============================================================
     IA local determinista (runAI)
     ============================================================ */
  function localProofread(text) {
    let t = text;
    t = t.replace(/[ \t]+/g, ' ');            // espacios múltiples
    t = t.replace(/\s+([,.;:!?])/g, '$1');    // espacio antes de puntuación
    t = t.replace(/([,.;:!?])(?=[A-Za-zÁÉÍÓÚÑáéíóúñ])/g, '$1 '); // espacio tras puntuación
    t = t.replace(/--/g, '—');                // guion doble → raya
    t = t.replace(/\.\.\./g, '…');            // puntos suspensivos
    t = t.replace(/"([^"]*)"/g, '«$1»');      // comillas tipográficas
    t = t.replace(/\s+$/g, '').replace(/^\s+/g, '');
    if (t.length) t = t.charAt(0).toUpperCase() + t.slice(1); // mayúscula inicial
    return t;
  }
  function localImprove(text) {
    let t = localProofread(text);
    const MULETILLAS = [
      [/\bbásicamente\b/gi, ''], [/\ben realidad\b/gi, ''], [/\bla verdad es que\b/gi, ''],
      [/\bo sea\b/gi, ''], [/\bes decir,?\s*/gi, ''], [/\bun poco\b/gi, ''],
      [/\bmuy muy\b/gi, 'muy'], [/\bpara nada\b/gi, 'en absoluto'],
      [/\bcosa\b/gi, 'aspecto'], [/\bcosas\b/gi, 'elementos']
    ];
    MULETILLAS.forEach(([re, rep]) => { t = t.replace(re, rep); });
    t = t.replace(/[ \t]{2,}/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
    if (t.length) t = t.charAt(0).toUpperCase() + t.slice(1);
    return t;
  }

  async function runAI(task, btn) {
    if (aiBusy) return;
    if (!restoreRange()) { emitToast('Selecciona texto primero', 'err'); return; }
    const sel = getSelection();
    const input = savedRange.toString();
    if (!input.trim()) { emitToast('Selecciona texto primero', 'err'); return; }

    aiBusy = true;
    const prevLabel = btn.innerHTML;
    btn.innerHTML = '…'; btn.classList.add('cv-busy');

    let out;
    try {
      if (typeof window.CV_AI === 'function') {
        out = await window.CV_AI(task, input);
      } else {
        out = task === 'improve' ? localImprove(input) : localProofread(input);
      }
    } catch (_) {
      out = task === 'improve' ? localImprove(input) : localProofread(input);
    }

    // Reemplazar el texto seleccionado.
    restoreRange();
    const range = getSelection().getRangeAt(0);
    range.deleteContents();
    const tn = document.createTextNode(out);
    range.insertNode(tn);
    // Reseleccionar lo insertado.
    const r = document.createRange(); r.selectNode(tn);
    sel.removeAllRanges(); sel.addRange(r);
    savedRange = r.cloneRange();

    if (activeBlock) recordText(activeBlock);
    paintSelStates();
    pushHistory();

    btn.innerHTML = prevLabel; btn.classList.remove('cv-busy');
    aiBusy = false;
    emitToast(task === 'improve' ? 'Texto mejorado.' : 'Texto corregido.', 'ok');
  }

  /* ============================================================
     UNDO / REDO
     ============================================================ */
  function snapshot() {
    return {
      texts: JSON.parse(JSON.stringify(changedTexts)),
      media: JSON.parse(JSON.stringify(changedMedia)),
      styles: JSON.parse(JSON.stringify(changedStyles))
    };
  }

  function pushHistory() {
    if (applyingSnapshot) return;
    const snap = snapshot();
    // Saltar si idéntico al tope.
    if (hIndex >= 0 && JSON.stringify(history[hIndex]) === JSON.stringify(snap)) { emitHistory(); return; }
    history = history.slice(0, hIndex + 1);
    history.push(snap);
    if (history.length > 60) history.shift();
    hIndex = history.length - 1;
    emitHistory();
  }

  function applySnapshot(snap) {
    applyingSnapshot = true;
    // Limpiar diffs y rehidratar.
    Object.keys(changedTexts).forEach(k => delete changedTexts[k]);
    Object.keys(changedMedia).forEach(k => delete changedMedia[k]);
    Object.keys(changedStyles).forEach(k => delete changedStyles[k]);
    Object.assign(changedTexts, snap.texts);
    Object.assign(changedMedia, snap.media);
    Object.assign(changedStyles, snap.styles);

    // Reaplicar al DOM: texto.
    Object.entries(snap.texts).forEach(([k, html]) => {
      const node = nodeByKey[k] || resolveTextNode(k);
      if (node) node.innerHTML = html;
    });
    // Restaurar textos que ya no estén en el snapshot a su original.
    Object.keys(origTexts).forEach((k) => {
      if (!(k in snap.texts)) { const node = nodeByKey[k]; if (node) node.innerHTML = origTexts[k]; }
    });
    // Media.
    Object.entries(snap.media).forEach(([k, url]) => {
      const node = mediaNodeByKey[k] || resolveMediaNode(k);
      if (node) applyMedia(node, url);
    });
    Object.keys(origMedia).forEach((k) => {
      if (!(k in snap.media)) { const node = mediaNodeByKey[k]; if (node) applyMedia(node, origMedia[k]); }
    });
    // Estilos.
    const allStyleKeys = new Set([...Object.keys(snap.styles), ...touchedStyle]);
    allStyleKeys.forEach((k) => {
      const node = nodeByKey[k] || resolveTextNode(k);
      if (node) applyBlockStyle(node, snap.styles[k] || {});
    });

    applyingSnapshot = false;
    recomputeDirty();
  }

  function resolveTextNode(k) {
    const hit = $$(TEXT_SEL).find(n => keyText(n) === k) || $$(NAV_SEL).find(n => keyText(n) === k);
    if (hit) nodeByKey[k] = hit;
    return hit;
  }
  function resolveMediaNode(k) {
    const hit = $$(IMG_SEL).find(n => keyMedia(n) === k);
    if (hit) mediaNodeByKey[k] = hit;
    return hit;
  }

  function recomputeDirty() {
    const has = Object.keys(changedTexts).length || Object.keys(changedMedia).length || Object.keys(changedStyles).length;
    emitDirty(!!has);
  }

  function undo() {
    if (hIndex <= 0) return;
    hIndex--;
    applySnapshot(history[hIndex]);
    emitHistory();
    flashHint('Deshecho');
  }
  function redo() {
    if (hIndex >= history.length - 1) return;
    hIndex++;
    applySnapshot(history[hIndex]);
    emitHistory();
    flashHint('Rehecho');
  }

  function paintHistoryButtons() {
    if (!bar) return;
    const u = bar.querySelector('[data-act="undo"]'), r = bar.querySelector('[data-act="redo"]');
    if (u) u.disabled = hIndex <= 0;
    if (r) r.disabled = hIndex >= history.length - 1;
  }

  /* ============================================================
     TECLADO
     ============================================================ */
  function bindKeys() {
    document.addEventListener('keydown', (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((key === 'z' && e.shiftKey) || key === 'y') { e.preventDefault(); redo(); }
      else if (key === 's') { e.preventDefault(); save(); }
    }, true);
  }

  /* ============================================================
     ENTRANTE desde el host
     ============================================================ */
  function bindInbound() {
    window.addEventListener('message', (e) => {
      // Comprobar origen para mensajes entrantes del host.
      // Permitimos same-origin; 'null' aparece en about:blank / file:// (mismo equipo).
      if (e.origin && e.origin !== location.origin && e.origin !== 'null') return;
      const d = e.data; if (!d || typeof d !== 'object') return;
      const t = d.type;
      if (t === 'cv:save' || t === 'cv-save') { save(e.source); }
      else if (t === 'cv:undo') { undo(); }
      else if (t === 'cv:redo') { redo(); }
    });
  }

  /* ============================================================
     GUARDAR (save)
     ============================================================ */
  function save(source) {
    const beforeContent = read('cv_content', {});
    const beforeImgs = read('cv_imgs', {});
    const beforeStyles = read('cv_styles', {});

    const audit = read('cv_audit', []);
    const at = new Date().toISOString();
    const addAudit = (section, key, before, after) => {
      if (JSON.stringify(before) === JSON.stringify(after)) return;
      audit.unshift({ id: uid(), section, key, before, after, user: 'admin', at });
    };

    // Texto.
    const nextContent = Object.assign({}, beforeContent);
    touchedText.forEach((k) => {
      const after = changedTexts[k];
      addAudit('texts', k, beforeContent[k] != null ? beforeContent[k] : (origTexts[k] || ''), after);
      nextContent[k] = after;
    });

    // Media.
    const nextImgs = Object.assign({}, beforeImgs);
    touchedMedia.forEach((k) => {
      const after = changedMedia[k];
      addAudit('media', k, beforeImgs[k] != null ? beforeImgs[k] : (origMedia[k] || ''), after);
      nextImgs[k] = after;
    });

    // Estilos.
    const nextStyles = Object.assign({}, beforeStyles);
    touchedStyle.forEach((k) => {
      const after = changedStyles[k] || {};
      addAudit('styles', k, beforeStyles[k] || {}, after);
      if (Object.keys(after).length) nextStyles[k] = after; else delete nextStyles[k];
    });

    write('cv_content', nextContent);
    write('cv_imgs', nextImgs);
    write('cv_styles', nextStyles);
    write('cv_audit', audit.slice(0, 200));

    // Limpiar diffs y touched.
    Object.keys(changedTexts).forEach(k => delete changedTexts[k]);
    Object.keys(changedMedia).forEach(k => delete changedMedia[k]);
    Object.keys(changedStyles).forEach(k => delete changedStyles[k]);
    touchedText.clear(); touchedMedia.clear(); touchedStyle.clear();

    emitDirty(false);
    post({ type: 'cv:saved', ok: true, at });
    // Compat legacy.
    try { (source || parent).postMessage({ type: 'cv-saved' }, '*'); } catch (_) {}
    emitToast('Cambios guardados', 'ok');
  }

  /* ============================================================
     HINT inferior (mini-toast en iframe)
     ============================================================ */
  let hintEl = null, hintT = null;
  const HINT_DEFAULT = 'Modo edición · clic en un texto · ✎ en imágenes · clic-derecho en enlaces';
  function flashHint(msg) {
    if (!hintEl) {
      hintEl = document.createElement('div');
      hintEl.className = 'cv-ed-hint';
      document.body.appendChild(hintEl);
    }
    hintEl.textContent = msg;
    hintEl.classList.add('cv-ed-hint--flash');
    clearTimeout(hintT);
    hintT = setTimeout(() => { hintEl.classList.remove('cv-ed-hint--flash'); hintEl.textContent = HINT_DEFAULT; }, 1800);
  }

  /* ============================================================
     CHROME CSS (tokens Cabo · teal #1cb5b0)
     ============================================================ */
  function injectChrome() {
    const css = document.createElement('style');
    css.id = 'cv-editor-chrome';
    css.textContent = `
      :root{ --cv-teal:#1cb5b0; --cv-teal-d:#0fa6a0; --cv-ink:#0b1a2c; --cv-deep:#06182f; --cv-yellow:#e9b048; }
      /* Fuentes conmutables */
      .fx-display{font-family:'Fraunces',serif;font-weight:600}
      .fx-serif{font-family:'Fraunces',serif;font-weight:500}
      .fx-sans{font-family:'Inter',sans-serif}
      .fx-mono{font-family:'JetBrains Mono','SFMono-Regular',ui-monospace,monospace}

      /* Texto editable */
      .cv-editing .cv-ed-text{outline:1.5px dashed transparent;outline-offset:3px;border-radius:5px;transition:outline-color .15s,background .15s;cursor:text}
      .cv-editing .cv-ed-text:hover{outline-color:rgba(28,181,176,.55);background:rgba(28,181,176,.05)}
      .cv-editing .cv-ed-text:focus,.cv-editing .cv-ed-focus{outline:1.6px solid var(--cv-teal);background:rgba(28,181,176,.08)}
      .cv-editing .cv-ed-navedit{outline:1.6px solid var(--cv-teal);background:rgba(28,181,176,.1);border-radius:4px;padding:0 2px}

      /* Enlaces / CTAs en modo edición */
      .cv-editing .cv-ed-nav{outline:1px dashed rgba(233,176,72,.5);outline-offset:2px;border-radius:5px;cursor:context-menu;position:relative}
      .cv-editing .cv-ed-nav:hover{outline-color:rgba(233,176,72,.9);background:rgba(233,176,72,.07)}

      /* Insignia ✎ en media */
      .cv-ed-badge{position:absolute;top:10px;right:10px;z-index:40;display:inline-flex;align-items:center;gap:5px;
        height:30px;padding:0 11px;border-radius:9px;background:rgba(6,18,40,.82);color:#fff;
        border:1px solid rgba(255,255,255,.22);font:600 11.5px/1 'Inter',sans-serif;letter-spacing:.02em;
        cursor:pointer;opacity:0;transform:translateY(-3px);transition:opacity .18s,transform .18s,background .15s}
      .cv-editing :hover > .cv-ed-badge,.cv-ed-badge:hover{opacity:1;transform:translateY(0)}
      .cv-ed-badge:hover{background:var(--cv-teal)}
      .cv-editing .cv-ed-media{outline:1.5px dashed transparent;outline-offset:2px;transition:outline-color .15s;cursor:pointer}
      .cv-editing .cv-ed-media:hover{outline-color:rgba(28,181,176,.6)}
      .cv-editing .cv-ed-media-on{outline:2px solid var(--cv-teal);outline-offset:2px}

      /* ===== Barra flotante .cv-bar ===== */
      .cv-bar{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:99999;
        display:flex;align-items:center;gap:4px;max-width:calc(100vw - 24px);flex-wrap:wrap;justify-content:center;
        padding:7px 9px;border-radius:16px;
        background:linear-gradient(180deg,rgba(8,24,47,.94),rgba(6,18,40,.97));
        border:1px solid rgba(28,181,176,.35);
        box-shadow:0 18px 50px -16px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.04) inset;
        font-family:'Inter',sans-serif;color:#eaf4f6;user-select:none}
      .cv-grp{display:flex;align-items:center;gap:3px}
      .cv-grp-off{display:none}
      .cv-sep{width:1px;height:22px;background:rgba(255,255,255,.14);margin:0 3px}
      .cv-btn,.cv-mini,.cv-font{display:inline-flex;align-items:center;justify-content:center;
        border-radius:9px;color:#dceef0;background:rgba(255,255,255,.04);
        border:1px solid transparent;cursor:pointer;transition:background .14s,color .14s,border-color .14s}
      .cv-btn{min-width:32px;height:32px;padding:0 8px;font-size:14px;font-weight:600}
      .cv-mini{width:28px;height:28px;font-size:13px}
      .cv-font{width:34px;height:32px;font-size:15px}
      .cv-font.fx-display{font-family:'Fraunces',serif}
      .cv-font.fx-serif{font-family:'Fraunces',serif;font-weight:500}
      .cv-font.fx-sans{font-family:'Inter',sans-serif}
      .cv-font.fx-mono{font-family:'JetBrains Mono',monospace}
      .cv-btn:hover,.cv-mini:hover,.cv-font:hover{background:rgba(28,181,176,.18);color:#fff;border-color:rgba(28,181,176,.4)}
      .cv-btn:disabled{opacity:.32;cursor:default;background:transparent}
      .cv-on{background:var(--cv-teal)!important;color:#04222a!important;border-color:var(--cv-teal)!important}
      .cv-ai{color:var(--cv-yellow)}
      .cv-busy{opacity:.6}
      .cv-fonts,.cv-swatches,.cv-mini-grp,.cv-grp-bg{display:inline-flex;align-items:center;gap:3px}
      .cv-mini-grp{padding:2px 4px;border-radius:9px;background:rgba(255,255,255,.03)}
      .cv-sw{width:18px;height:18px;border-radius:50%;background:var(--sw);
        border:1.5px solid rgba(255,255,255,.45);cursor:pointer;transition:transform .12s,box-shadow .12s}
      .cv-sw:hover{transform:scale(1.18);box-shadow:0 0 0 2px rgba(28,181,176,.5)}

      /* Hint inferior */
      .cv-ed-hint{position:fixed;left:50%;bottom:62px;transform:translateX(-50%);z-index:99998;
        background:var(--cv-ink);color:#fff;font:600 12px/1 'Inter',sans-serif;
        padding:10px 18px;border-radius:100px;letter-spacing:.015em;
        box-shadow:0 14px 36px -14px rgba(0,0,0,.55);pointer-events:none;max-width:90vw;text-align:center}
      .cv-ed-hint--flash{background:var(--cv-teal)}

      /* Animaciones pausadas en edición (marquee = logos, no editable) */
      .cv-editing .cert-track{animation-play-state:paused!important}
    `;
    document.head.appendChild(css);
  }

  /* ============================================================
     ARRANQUE
     ============================================================ */
  function boot() { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enable); else enable(); }
  boot();

  // Exponer para verificación / hooks.
  window.CVEditor = { applyAll, applyBlockStyle, autoKey, save, undo, redo, snapshot: () => snapshot() };
})();
