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

  function applyTeam() {
    const ov = read('cv_team', {});
    if (!ov || !Object.keys(ov).length) return;
    document.querySelectorAll('.team-deck .member').forEach(card => {
      const o = ov[TEAM_MAP[card.getAttribute('data-modal')]]; if (!o) return;
      if (o.role) { const el = card.querySelector('.member__role'); if (el) el.textContent = o.role; }
      if (o.name) { const el = card.querySelector('.member__name'); if (el) el.textContent = o.name; const img = card.querySelector('.member__photo img'); if (img) img.alt = o.name; }
      if (o.bio) { const el = card.querySelector('.member__bio'); if (el) el.textContent = o.bio; }
    });
    Object.keys(TEAM_MAP).forEach(mid => {
      const o = ov[TEAM_MAP[mid]]; if (!o) return; const md = document.getElementById(mid); if (!md) return;
      if (o.name) { const h = md.querySelector('.tm-id h3'); if (h) h.textContent = o.name; }
      if (o.role) { const r = md.querySelector('.tm-role'); if (r) r.textContent = o.role; }
    });
  }

  const ARROW = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M13 6l6 6-6 6"/></svg>';

  function renderNews() {
    const sec = document.getElementById('noticias'); if (!sec) return;
    const items = getNews().filter(n => n.status === 'published')
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (b.date || '').localeCompare(a.date || ''));
    const on = settings().newsEnabled && items.length > 0;
    sec.hidden = !on;
    document.querySelectorAll('[data-news-nav]').forEach(el => { el.hidden = !on; });
    if (!on) return;
    const deck = document.getElementById('newsDeck');
    deck.innerHTML = items.map((n, i) => `
      <article class="news-card" data-news="${i}">
        <div class="nc-img" style="${n.image ? `background-image:url('${esc(n.image)}')` : ''}">${n.category ? `<span class="nc-cat">${esc(n.category)}</span>` : ''}</div>
        <div class="nc-body">
          <span class="nc-date">${fmtDate(n.date)}</span>
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
