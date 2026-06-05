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

  const EDITOR = new URLSearchParams(location.search).has('editor');
  const SAMPLE = [
    { title: 'Título de ejemplo de noticia', excerpt: 'Así se verá una noticia. Crea las tuyas desde el panel → Noticias.', category: 'Corporativo', date: new Date().toISOString().slice(0, 10), status: 'published', image: '../esp-1.jpg' },
  ];
  // Destacadas primero, luego por orden y fecha. Las archivadas se excluyen.
  const sortFn = (a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (a.order ?? 0) - (b.order ?? 0) || (b.date || '').localeCompare(a.date || '');
  function renderNews() {
    const sec = document.getElementById('noticias'); if (!sec) return;
    let items = getNews().filter(n => n.status === 'published' && !n.archived).sort(sortFn);
    let on = settings().newsEnabled && items.length > 0;
    if (EDITOR) {
      // En el editor visual se muestra siempre (incluye borradores; ejemplos si está vacío)
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
    const n = items[+card.dataset.news]; if (n) openNewsModal(n);
  });

  // Delegación: abrir el modal de detalle de un miembro del equipo (tarjetas reconstruidas
  // desde el array no tienen el handler directo de app.js) y cerrar los modales dinámicos.
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.team-deck .member[data-modal]');
    if (card) { const md = document.getElementById(card.getAttribute('data-modal')); if (md) { e.stopPropagation(); md.classList.add('open'); md.setAttribute('aria-hidden', 'false'); } return; }
    const closer = e.target.closest('.info-modal [data-close-modal], .info-modal .info-back');
    if (closer) { const md = closer.closest('.info-modal'); if (md) { md.classList.remove('open'); md.setAttribute('aria-hidden', 'true'); } }
  });

  // Captura de consultas del formulario de contacto
  const cf = document.getElementById('contactForm');
  if (cf) cf.addEventListener('submit', () => {
    try {
      const fd = new FormData(cf);
      const arr = read('cv_consultas', []);
      arr.push({
        id: 'c' + Date.now().toString(36), name: fd.get('name') || '', email: fd.get('email') || '',
        message: (fd.get('msg') || '') + (fd.get('topic') ? ` · ${fd.get('topic')}` : '') + (fd.get('country') ? ` · ${fd.get('country')}` : ''),
        date: new Date().toISOString(), read: false
      });
      localStorage.setItem('cv_consultas', JSON.stringify(arr));
    } catch (_) {}
  }, true);

  function run() { try { applyTeam(); } catch (_) {} try { renderNews(); } catch (_) {} }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
  window.addEventListener('storage', (e) => { if (['cv_settings', 'cv_news', 'cv_team'].includes(e.key)) run(); });
})();
