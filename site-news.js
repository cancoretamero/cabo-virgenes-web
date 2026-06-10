/* ============================================================
   CABO VÍRGENES — Puente público ↔ panel /admin (localStorage)
   - Muestra/oculta la sección de Noticias según el ajuste del admin
   - Renderiza las noticias publicadas
   - Aplica los cambios del equipo hechos en el admin
   - Guarda las consultas del formulario de contacto
   ============================================================ */
(function () {
  'use strict';
  const read = (k, def) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; } catch { return def; } };
  const esc = (s) => (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmtDate = (s) => { if (!s) return ''; const d = new Date(s + 'T00:00:00'); return isNaN(d) ? s : d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }); };
  const settings = () => Object.assign({ newsEnabled: false }, read('cv_settings', {}));
  const getNews = () => read('cv_news', []);

  const TEAM_MAP = {
    'modal-team-basavilbaso': 'basavilbaso', 'modal-team-regueiro': 'regueiro', 'modal-team-abizeid': 'abizeid',
    'modal-team-tamagnini': 'tamagnini', 'modal-team-ortiz': 'ortiz', 'modal-team-iglesias': 'iglesias'
  };
  const MORE_ARROW = '<svg viewBox="0 0 24 24" width="13" height="13"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // Sincroniza un modal de detalle existente (#modal-team-key) con el miembro editado.
  function syncTeamDetail(md, m) {
    const ph = md.querySelector('.tm-photo img'); if (ph && m.photo) { ph.src = m.photo; ph.alt = m.name || ''; }
    const h = md.querySelector('.tm-id h3'); if (h && m.name) h.textContent = m.name;
    const r = md.querySelector('.tm-role'); if (r && m.role) r.textContent = m.role;
    const meta = md.querySelector('.tm-meta li strong'); if (meta && m.area) meta.textContent = m.area;
  }
  // Crea/actualiza un modal de detalle para un miembro NUEVO (sin modal estático).
  function ensureTeamDetail(id, m) {
    let md = document.getElementById(id);
    if (!md) { md = document.createElement('div'); md.className = 'info-modal'; md.id = id; md.setAttribute('aria-hidden', 'true'); document.body.appendChild(md); }
    const bio = (m.bio || '').split(/\n+/).filter(Boolean).map(p => `<p>${esc(p)}</p>`).join('');
    md.innerHTML = `<div class="info-back"></div>
      <article class="info-shell glass-deep info-shell-lg team-modal">
        <button class="info-close glass-strong" data-close-modal aria-label="Cerrar">×</button>
        <div class="tm-head">
          <div class="tm-photo">${m.photo ? `<img src="${esc(m.photo)}" alt="${esc(m.name)}" loading="lazy"/>` : ''}</div>
          <div class="tm-id"><p class="eyebrow eyebrow-light"><span class="dot"></span>DIRECCIÓN</p><h3>${esc(m.name || '')}</h3><p class="tm-role">${esc(m.role || '')}</p></div>
        </div>
        ${bio}
        ${m.area ? `<ul class="tm-meta"><li><span>Enfoque</span><strong>${esc(m.area)}</strong></li></ul>` : ''}
      </article>`;
  }

  function applyTeam() {
    const team = read('cv_team', null);
    const deck = document.querySelector('.team-deck');
    if (!deck) return;
    // Formato antiguo (overrides por key) o sin datos → no tocar las tarjetas estáticas.
    if (!Array.isArray(team)) {
      const ov = team;
      if (!ov || typeof ov !== 'object' || !Object.keys(ov).length) return;
      deck.querySelectorAll('.member').forEach(card => {
        const o = ov[TEAM_MAP[card.getAttribute('data-modal')]]; if (!o) return;
        if (o.role) { const el = card.querySelector('.member__role'); if (el) el.textContent = o.role; }
        if (o.name) { const el = card.querySelector('.member__name'); if (el) el.textContent = o.name; const img = card.querySelector('.member__photo img'); if (img) img.alt = o.name; }
        if (o.bio) { const el = card.querySelector('.member__bio'); if (el) el.textContent = o.bio; }
      });
      Object.keys(TEAM_MAP).forEach(mid => { const o = ov[TEAM_MAP[mid]]; const md = document.getElementById(mid); if (o && md) syncTeamDetail(md, o); });
      return;
    }
    // Formato nuevo (array): reconstruir el deck reflejando alta/baja/orden/oculto/foto.
    const visible = team.filter(m => !m.hidden);
    deck.classList.toggle('team-deck-6', visible.length === 6);
    deck.innerHTML = visible.map(m => {
      const hasStatic = m.key && document.getElementById('modal-team-' + m.key);
      const mid = hasStatic ? 'modal-team-' + m.key : 'cv-tm-' + m.id;
      return `<article class="member glass-deep" data-modal="${esc(mid)}" data-reveal>
        <div class="member__photo">${m.photo ? `<img src="${esc(m.photo)}" alt="${esc(m.name)}" loading="lazy"/>` : ''}</div>
        <div class="member__body">
          <span class="member__role">${esc(m.role || '')}</span>
          <h3 class="member__name">${esc(m.name || '')}</h3>
          <p class="member__bio">${esc(m.bio || '')}</p>
          <span class="member__more">Ver perfil ${MORE_ARROW}</span>
        </div>
      </article>`;
    }).join('');
    deck.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('in'));
    // modales de detalle
    visible.forEach(m => {
      const md = m.key && document.getElementById('modal-team-' + m.key);
      if (md) syncTeamDetail(md, m); else ensureTeamDetail('cv-tm-' + m.id, m);
    });
  }

  const ARROW = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M13 6l6 6-6 6"/></svg>';

  const _qs = new URLSearchParams(location.search);
  const EDITOR = _qs.has('editor');
  // Modo ESTUDIO: el admin embebe la sección de noticias real en un iframe para
  // editarla visualmente. Mostramos SOLO la sección de noticias (ocultando el
  // resto de la página y el chrome) y la dejamos siempre visible y editable.
  const STUDIO = _qs.get('studio') === 'news';
  function focusNewsStudio() {
    const sec = document.getElementById('noticias'); if (!sec) return;
    document.documentElement.classList.add('cv-news-studio');
    sec.hidden = false;
    // Oculta todo lo demás de la página y el chrome.
    document.querySelectorAll('main.stage > section, main.stage > footer, .footer, header.header, .fab-stack, .drawer, .side-rail, .num-rail').forEach(el => {
      if (el !== sec && !sec.contains(el)) el.style.display = 'none';
    });
    sec.style.display = '';
    sec.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('in'));
    try { window.scrollTo(0, 0); } catch (_) {}
  }
  const SAMPLE = [
    { title: 'Título de ejemplo de noticia', excerpt: 'Así se verá una noticia. Crea las tuyas desde el panel → Noticias.', category: 'Corporativo', date: new Date().toISOString().slice(0, 10), status: 'published', image: '../esp-1.jpg' },
  ];
  // Destacadas primero, luego por orden y fecha. Las archivadas se excluyen.
  const sortFn = (a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (a.order ?? 0) - (b.order ?? 0) || (b.date || '').localeCompare(a.date || '');
  function renderNews() {
    const sec = document.getElementById('noticias'); if (!sec) return;
    let items = getNews().filter(n => n.status === 'published' && !n.archived).sort(sortFn);
    let on = settings().newsEnabled && items.length > 0;
    if (EDITOR || STUDIO) {
      // En el editor visual / estudio se muestra siempre (incluye borradores; ejemplos si está vacío)
      const all = getNews().filter(n => !n.archived).slice().sort(sortFn);
      items = all.length ? all : SAMPLE; on = true;
    }
    sec.hidden = !on;
    document.querySelectorAll('[data-news-nav]').forEach(el => { el.hidden = !on; });
    if (!on) return;
    const deck = document.getElementById('newsDeck');
    deck.innerHTML = items.map((n, i) => `
      <article class="news-card${n.pinned ? ' is-pinned' : ''}" data-news="${i}">
        <div class="nc-img" style="${n.image ? `background-image:url('${esc(n.image)}')` : ''}">${n.category ? `<span class="nc-cat">${esc(n.category)}</span>` : ''}${n.pinned ? '<span class="nc-pin">Destacada</span>' : ''}</div>
        <div class="nc-body">
          <span class="nc-date">${fmtDate(n.date)}${n.outletName ? ' · ' + esc(n.outletName) : ''}</span>
          <h3 class="nc-title">${esc(n.title)}</h3>
          <p class="nc-ex">${esc(n.excerpt || '')}</p>
          <span class="nc-more">Leer más ${ARROW}</span>
        </div>
      </article>`).join('');
    deck._items = items;
    sec.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('in'));
  }

  function openNewsModal(n) {
    const md = document.getElementById('modal-news'); if (!md) return;
    const img = document.getElementById('nmImg');
    if (n.image) { img.hidden = false; img.style.backgroundImage = `url('${n.image}')`; } else { img.hidden = true; }
    document.getElementById('nmMeta').textContent = [n.category, fmtDate(n.date)].filter(Boolean).join(' · ');
    document.getElementById('nmTitle').textContent = n.title;
    const text = (n.body || n.excerpt || '').split(/\n+/).filter(Boolean).map(p => `<p>${esc(p)}</p>`).join('') || '';
    document.getElementById('nmText').innerHTML = text;
    md.classList.add('open'); md.setAttribute('aria-hidden', 'false');
  }

  document.addEventListener('click', (e) => {
    const card = e.target.closest('.news-card'); if (!card) return;
    const deck = document.getElementById('newsDeck'); const items = deck && deck._items; if (!items) return;
    const n = items[+card.dataset.news]; if (!n) return;
    // En el ESTUDIO (admin), clic en una tarjeta = editar esa noticia (avisa al panel).
    if (STUDIO) { e.preventDefault(); e.stopPropagation(); try { parent.postMessage({ type: 'cv:studio-edit', id: n.id || '' }, '*'); } catch (_) {} return; }
    openNewsModal(n);
  });

  // Delegación: abrir el modal de detalle de un miembro del equipo (tarjetas reconstruidas
  // desde el array no tienen el handler directo de app.js) y cerrar los modales dinámicos.
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.team-deck .member[data-modal]');
    if (card) { const md = document.getElementById(card.getAttribute('data-modal')); if (md) { e.stopPropagation(); md.classList.add('open'); md.setAttribute('aria-hidden', 'false'); } return; }
    const closer = e.target.closest('.info-modal [data-close-modal], .info-modal .info-back');
    if (closer) { const md = closer.closest('.info-modal'); if (md) { md.classList.remove('open'); md.setAttribute('aria-hidden', 'true'); } }
  });

  // Envía a Supabase (fire-and-forget; el localStorage queda como respaldo).
  function postPublic(action, data) {
    try {
      fetch('/api/public', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(Object.assign({ action: action }, data)) }).catch(function () {});
    } catch (_) {}
  }

  // Alta de suscriptor sin duplicar por correo (compartido con el panel /admin)
  function addSubscriber(rec) {
    const email = String(rec.email || '').trim().toLowerCase();
    if (!email) return;
    const subs = read('cv_subscribers', []);
    const i = subs.findIndex(s => String(s.email || '').trim().toLowerCase() === email);
    if (i >= 0) {
      // Completa datos vacíos del registro existente sin pisar lo que ya hay.
      ['name', 'country', 'outlet', 'web', 'phone'].forEach(k => { if (rec[k] && !subs[i][k]) subs[i][k] = rec[k]; });
      if (Array.isArray(rec.interests)) {
        const set = new Set([...(subs[i].interests || []), ...rec.interests].filter(Boolean));
        subs[i].interests = Array.from(set);
      }
    } else {
      subs.push(Object.assign({
        id: 'su' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
        email: String(rec.email || '').trim(), name: '', country: '', interests: [],
        outlet: '', web: '', phone: '', tags: [], notes: '',
        date: new Date().toISOString(), source: 'web'
      }, rec, { email: String(rec.email || '').trim() }));
    }
    localStorage.setItem('cv_subscribers', JSON.stringify(subs));
    postPublic('subscribe', {
      email: rec.email, name: rec.name, country: rec.country,
      interests: rec.interests, outlet: rec.outlet, web: rec.web, phone: rec.phone, source: rec.source
    });
  }

  // Captura de consultas del formulario de contacto (todos los campos)
  const cf = document.getElementById('contactForm');
  if (cf) cf.addEventListener('submit', () => {
    try {
      const fd = new FormData(cf);
      const name = (fd.get('name') || '').toString().trim();
      const email = (fd.get('email') || '').toString().trim();
      const company = (fd.get('company') || '').toString().trim();
      const country = (fd.get('country') || '').toString().trim();
      const topic = (fd.get('topic') || '').toString().trim();
      const message = (fd.get('msg') || '').toString().trim();
      const arr = read('cv_consultas', []);
      arr.push({
        id: 'c' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
        name, email, company, country, topic, message,
        date: new Date().toISOString(), source: 'contacto',
        status: 'new', resolution: 'open', read: false
      });
      localStorage.setItem('cv_consultas', JSON.stringify(arr));
      postPublic('contact', { name, email, company, country, topic, message });
      // Quien escribe por «Prensa» o pide novedades entra también a la base de suscriptores.
      if (email && topic === 'Prensa') {
        addSubscriber({ email, name, country, outlet: company, source: 'prensa', interests: ['Prensa'] });
      }
    } catch (_) {}
  }, true);

  // Captura del formulario de boletín (footer)
  const nf = document.getElementById('newsletterForm');
  if (nf) nf.addEventListener('submit', () => {
    try {
      const inp = nf.querySelector('input[type="email"]');
      const email = inp ? inp.value.trim() : '';
      if (email) addSubscriber({ email, source: 'boletín', interests: ['Boletín'] });
    } catch (_) {}
  }, true);

  /* ============================================================
     BIBLIOTECA FLOTANTE del estudio (modo ?studio=news) — réplica del
     panel de vidrio de Aisa: tabs por estado + contadores, crear,
     tarjetas con chip de estado y acciones, minimizar y arrastrar.
     ============================================================ */
  // Empuja el conjunto COMPLETO de noticias a Supabase tras cada mutación del
  // estudio (este iframe escribe localStorage directo, sin pasar por el admin).
  // Usa el token de sesión del panel; si no hay, el admin padre re-empuja al
  // recibir cv:studio-changed (doble cinturón → los borradores nunca se pierden).
  let _stPushT = null;
  function stCloudPush() {
    clearTimeout(_stPushT);
    _stPushT = setTimeout(() => {
      try {
        const tok = localStorage.getItem('cv_auth_token') || '';
        if (!tok) return;
        fetch('/api/data', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-cabo-admin-token': tok },
          body: JSON.stringify({ entity: 'news', action: 'replace', payload: getNews() }),
        }).catch(() => {});
      } catch (_) {}
    }, 600);
  }
  const setNews = (v) => { try { localStorage.setItem('cv_news', JSON.stringify(v)); } catch (_) {} stCloudPush(); };
  const stStatusOf = (n) => n.archived ? 'archived' : (n.status === 'draft' ? 'draft' : 'published');
  const ICN = {
    drag: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>',
    chev: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    plus: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    image: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.6"/><path d="M21 16l-5-5L5 21"/></svg>',
    edit: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5"/><path d="M18.4 3.6a1.8 1.8 0 012.5 2.5L12 15l-3.5.9.9-3.5z"/></svg>',
    pub: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
    draft: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9.9 5.2A9.6 9.6 0 0112 5c6.5 0 10 7 10 7a18 18 0 01-3 3.8M6.3 6.3A18 18 0 002 12s3.5 7 10 7a9.6 9.6 0 004.3-1M3 3l18 18"/></svg>',
    pin: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.3 5 5.2.5-4 3.4 1.3 5.1L12 19l-4.1 3 1.3-5.1-4-3.4 5.2-.5z"/></svg>',
    archive: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 001 1h12a1 1 0 001-1V8M10 12h4"/></svg>',
    trash: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13"/></svg>',
  };
  let stLibTab = 'all', stLibEl = null, stLibList = null, stLibMin = false;
  function studioMatch(n, tab) {
    if (tab === 'all') return true;
    if (tab === 'archived') return n.archived === true;
    if (tab === 'draft') return !n.archived && n.status === 'draft';
    if (tab === 'published') return !n.archived && n.status !== 'draft';
    return true;
  }
  function studioLibCard(n) {
    const st = stStatusOf(n);
    const lbl = st === 'archived' ? 'Archivada' : (st === 'draft' ? 'Borrador' : 'Publicada');
    const media = n.image
      ? `<div class="cv-stlc__media" style="background-image:url('${esc(String(n.image).replace(/'/g, '%27'))}')"></div>`
      : `<div class="cv-stlc__media cv-stlc__media--empty">${ICN.image}</div>`;
    return `<article class="cv-stlc" data-news-id="${esc(n.id || '')}" data-st="${st}">
      ${media}
      <div class="cv-stlc__body">
        <div class="cv-stlc__top"><span class="cv-stlc__cat">${esc(n.category || 'Actualidad')}</span><span class="cv-stlc__chip cv-stlc__chip--${st}">${lbl}</span></div>
        <h5 class="cv-stlc__title">${esc(n.title || 'Sin título')}</h5>
        <div class="cv-stlc__acts">
          <button type="button" data-act="edit" title="Editar">${ICN.edit}</button>
          <button type="button" class="${st === 'published' ? 'on' : ''}" data-act="status" title="Publicar / borrador">${st === 'published' ? ICN.pub : ICN.draft}</button>
          <button type="button" class="${n.pinned ? 'on' : ''}" data-act="pin" title="Destacar">${ICN.pin}</button>
          <button type="button" class="${n.archived ? 'on' : ''}" data-act="archive" title="Archivar">${ICN.archive}</button>
          <button type="button" class="danger" data-act="del" title="Eliminar">${ICN.trash}</button>
        </div>
      </div>
    </article>`;
  }
  function renderStudioLib() {
    if (!stLibEl) return;
    const arr = getNews();
    const counts = { all: arr.length, published: 0, draft: 0, archived: 0 };
    arr.forEach(n => { if (n.archived) counts.archived++; else if (n.status === 'draft') counts.draft++; else counts.published++; });
    Object.keys(counts).forEach(k => { const em = stLibEl.querySelector('[data-c="' + k + '"]'); if (em) em.textContent = counts[k]; });
    const items = arr.filter(n => studioMatch(n, stLibTab));
    stLibList.innerHTML = items.length ? items.map(studioLibCard).join('') : '<div class="cv-stlib__empty">Sin noticias en esta vista.</div>';
  }
  function studioAction(act, id) {
    const arr = getNews(); const i = arr.findIndex(n => String(n.id) === String(id));
    if (act === 'edit') { try { parent.postMessage({ type: 'cv:studio-edit', id: id }, '*'); } catch (_) {} return; }
    if (i < 0) return;
    if (act === 'status') { arr[i].status = arr[i].status === 'draft' ? 'published' : 'draft'; if (arr[i].status === 'published') arr[i].archived = false; }
    else if (act === 'pin') arr[i].pinned = !arr[i].pinned;
    else if (act === 'archive') arr[i].archived = !arr[i].archived;
    else if (act === 'del') { if (!confirm('¿Eliminar esta noticia?')) return; arr.splice(i, 1); }
    setNews(arr); renderNews(); renderStudioLib(); try { parent.postMessage({ type: 'cv:studio-changed' }, '*'); } catch (_) {}
  }
  function buildStudioLib() {
    if (stLibEl) { renderStudioLib(); return; }
    stLibEl = document.createElement('aside');
    stLibEl.className = 'cv-stlib';
    stLibEl.innerHTML =
      `<header class="cv-stlib__head"><span class="cv-stlib__brand">${ICN.drag} Biblioteca de noticias</span>` +
      `<button type="button" class="cv-stlib__min" data-lib="min" title="Minimizar">${ICN.chev}</button></header>` +
      `<div class="cv-stlib__inner">` +
        `<button type="button" class="cv-stlib__new" data-lib="new">${ICN.plus} Crear noticia</button>` +
        `<div class="cv-stlib__tabs">` +
          `<button type="button" data-tab="all" class="is-active">Todas <em data-c="all">0</em></button>` +
          `<button type="button" data-tab="published">Publicadas <em data-c="published">0</em></button>` +
          `<button type="button" data-tab="draft">Borradores <em data-c="draft">0</em></button>` +
          `<button type="button" data-tab="archived">Archivadas <em data-c="archived">0</em></button>` +
        `</div><div class="cv-stlib__list" id="cvStLibList"></div>` +
        `<footer class="cv-stlib__hint">Clic en una tarjeta del panel o de la página para editarla. Usa los iconos para publicar, destacar o archivar.</footer>` +
      `</div>`;
    document.body.appendChild(stLibEl);
    stLibList = stLibEl.querySelector('#cvStLibList');
    stLibEl.addEventListener('click', (ev) => {
      const t = ev.target.closest('[data-tab],[data-lib],[data-act]'); if (!t) return;
      if (t.hasAttribute('data-tab')) { stLibTab = t.getAttribute('data-tab'); stLibEl.querySelectorAll('.cv-stlib__tabs button').forEach(b => b.classList.toggle('is-active', b === t)); renderStudioLib(); return; }
      if (t.getAttribute('data-lib') === 'min') { stLibMin = !stLibMin; stLibEl.classList.toggle('is-min', stLibMin); return; }
      if (t.getAttribute('data-lib') === 'new') { try { parent.postMessage({ type: 'cv:studio-edit', id: '' }, '*'); } catch (_) {} return; }
      if (t.hasAttribute('data-act')) { ev.preventDefault(); ev.stopPropagation(); const c = t.closest('.cv-stlc'); if (c) studioAction(t.getAttribute('data-act'), c.getAttribute('data-news-id')); }
    });
    // arrastrar el panel por su cabecera
    const head = stLibEl.querySelector('.cv-stlib__head'); let drag = false, ox = 0, oy = 0;
    head.addEventListener('pointerdown', (ev) => { if (ev.target.closest('[data-lib]')) return; drag = true; const r = stLibEl.getBoundingClientRect(); ox = ev.clientX - r.left; oy = ev.clientY - r.top; stLibEl.style.transition = 'none'; try { head.setPointerCapture(ev.pointerId); } catch (_) {} });
    head.addEventListener('pointermove', (ev) => { if (!drag) return; stLibEl.style.left = Math.max(8, Math.min(innerWidth - 60, ev.clientX - ox)) + 'px'; stLibEl.style.top = Math.max(8, Math.min(innerHeight - 60, ev.clientY - oy)) + 'px'; stLibEl.style.right = 'auto'; });
    head.addEventListener('pointerup', () => { drag = false; stLibEl.style.transition = ''; });
    renderStudioLib();
  }

  function run() { try { applyTeam(); } catch (_) {} try { renderNews(); } catch (_) {} if (STUDIO) { try { focusNewsStudio(); } catch (_) {} try { buildStudioLib(); } catch (_) {} } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
  window.addEventListener('storage', (e) => { if (['cv_settings', 'cv_news', 'cv_team'].includes(e.key)) run(); });
})();
