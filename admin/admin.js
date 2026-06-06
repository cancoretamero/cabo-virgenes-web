/* ============================================================
   CABO VÍRGENES — Admin (client-side, localStorage)
   Réplica adaptada del panel de Aisa Group.
   NOTA: gate de acceso en el navegador (demo). Para seguridad
   real se necesitaría un backend con autenticación de servidor.
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const CRED = { user: 'admin', pass: 'cabovirgenes' };

  // ---------- Store (compartido con la web pública, mismo origen) ----------
  const K = {
    auth: 'cv_admin_auth', news: 'cv_news', settings: 'cv_settings', team: 'cv_team',
    msgs: 'cv_consultas', legal: 'cv_legal',
    // NUEVAS claves
    outlets: 'cv_outlets', journalists: 'cv_journalists', jobs: 'cv_jobs',
    apps: 'cv_applications', subs: 'cv_subscribers', pages: 'cv_pages', audit: 'cv_audit',
    newsletters: 'cv_newsletters',
  };
  const read = (k, def) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; } catch { return def; } };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  const DEFAULT_TEAM = [
    { id: 'basavilbaso', key: 'basavilbaso', name: 'Juan Pablo Basavilbaso', role: 'Gerente General', area: 'Estrategia · Operación', photo: '../team-1.jpg', bio: 'Contador Público con más de 20 años en la industria pesquera argentina. Conduce la estrategia y la operación de Cabo Vírgenes.' },
    { id: 'regueiro', key: 'regueiro', name: 'Matías Regueiro', role: 'Gerente de Operaciones', area: 'Flota · Plantas', photo: '../team-2.jpg', bio: 'Responsable de la operación pesquera e industrial: flota, plantas y cadena de frío, de la captura al producto terminado.' },
    { id: 'abizeid', key: 'abizeid', name: 'Diego Abizeid', role: 'Gerente de Administración y Finanzas', area: 'Finanzas · Control', photo: '../team-3.jpg', bio: 'Conduce la administración, las finanzas y el control de gestión que sostienen la inversión en flota y plantas.' },
    { id: 'tamagnini', key: 'tamagnini', name: 'Romina Tamagnini', role: 'Gerente de Recursos Humanos', area: 'Personas · Cultura', photo: '../team-4.jpg', bio: 'Lidera la gestión de personas: talento, seguridad y cultura de trabajo en Argentina y España.' },
    { id: 'ortiz', key: 'ortiz', name: 'Gastón Ortiz', role: 'Gerente Comercial', area: 'Comercial · Exportación', photo: '../team-5.jpg', bio: 'Dirige la estrategia comercial y la exportación del langostino austral a más de 40 países.' },
    { id: 'iglesias', key: 'iglesias', name: 'Antonio Iglesias', role: 'Gerente España', area: 'Valor agregado · Logística', photo: '../team-6.jpg', bio: 'Responsable de la plataforma de España (Palencia): valor agregado, logística y distribución.' },
  ];
  const SAMPLE_NEWS = [
    { title: 'Cabo Vírgenes se incorpora a AISA Group', excerpt: 'La pesquera refuerza su posicionamiento internacional al integrarse al holding AISA Group, consolidando su estructura binacional Argentina–España.', category: 'Corporativo', date: '2025-01-15', status: 'published', image: '../esp-1.jpg' },
    { title: 'Arranca la temporada de langostino austral', excerpt: 'La flota inicia operaciones en el Atlántico Sudoccidental (FAO 41) con buenas previsiones de captura para la nueva campaña.', category: 'Flota', date: '2026-03-03', status: 'published', image: '../esmeralda-2.jpg' },
    { title: 'Avances hacia la certificación MSC', excerpt: 'Cabo Vírgenes continúa el proceso de certificación de pesquería sostenible y refuerza su programa ambiental junto a RASA.', category: 'Sostenibilidad', date: '2026-05-20', status: 'draft', image: '../rasa-salicornias.jpg' },
  ];

  const getNews = () => read(K.news, []);
  const setNews = (v) => write(K.news, v);
  const getSettings = () => Object.assign({ newsEnabled: false, jobsEnabled: false, whatsappEnabled: false, email: 'info@cabovirgenes.com', phone: '+54 280 4495000' }, read(K.settings, {}));
  const setSettings = (v) => write(K.settings, v);
  const normMember = (m) => ({
    id: m.id || m.key || ('m' + Math.abs(Date.now() % 1e7).toString(36) + Math.floor(Math.random() * 1e4).toString(36)),
    key: m.key || '', name: m.name || '', role: m.role || '', area: m.area || '',
    bio: m.bio || '', photo: m.photo || m.img || '', hidden: !!m.hidden,
  });
  // cv_team: ARRAY de miembros (CRUD completo). Migra el formato antiguo (overrides por key).
  function getTeam() {
    const raw = read(K.team, null);
    if (Array.isArray(raw)) return raw.map(normMember);
    const ov = (raw && typeof raw === 'object') ? raw : {};
    return DEFAULT_TEAM.map(m => normMember(Object.assign({}, m, ov[m.key] || {})));
  }
  const setTeam = (arr) => write(K.team, arr);
  const getMsgs = () => read(K.msgs, []);
  const setMsgs = (v) => write(K.msgs, v);
  const uid = () => 'n' + Math.abs(Date.now() % 1e9).toString(36) + Math.floor(performance.now()).toString(36);

  // ---------- Getters/setters NUEVOS ----------
  const getOutlets = () => read(K.outlets, []);
  const setOutlets = (v) => write(K.outlets, v);
  const getJournalists = () => read(K.journalists, []);
  const setJournalists = (v) => write(K.journalists, v);
  const getJobs = () => read(K.jobs, []);
  const setJobs = (v) => write(K.jobs, v);
  const getApps = () => read(K.apps, []);
  const setApps = (v) => write(K.apps, v);
  const getSubs = () => read(K.subs, []);
  const setSubs = (v) => write(K.subs, v);
  const getPages = () => Object.assign({ noticias: { hero: '', items: [] } }, read(K.pages, {}));
  const setPages = (v) => write(K.pages, v);
  const getAudit = () => read(K.audit, []);
  const setAudit = (v) => write(K.audit, v);
  const getNewsletters = () => read(K.newsletters, []);
  const setNewsletters = (v) => write(K.newsletters, v);

  // ---------- UI helpers ----------
  const toastEl = $('#toast');
  let toastT;
  function toast(msg, kind) {
    toastEl.textContent = msg; toastEl.className = 'toast show' + (kind ? ' ' + kind : '');
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2400);
  }
  const fmtDate = (s) => { if (!s) return ''; const d = new Date(s + 'T00:00:00'); if (isNaN(d)) return s; return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }); };
  const fmtTime = (iso) => { if (!iso) return ''; const d = new Date(iso); if (isNaN(d)) return iso; return d.toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); };
  const esc = (s) => (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const hydrate = () => { if (window.cvIcons) window.cvIcons(); };
  const fileToB64 = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });

  // ---------- Helpers de prensa (Noticias › Medios/Redactores) ----------
  function debounce(fn, wait) { let t = null; return function () { const a = arguments, c = this; clearTimeout(t); t = setTimeout(() => fn.apply(c, a), wait || 180); }; }
  const COUNTRY_LABELS = { AR: 'Argentina', ES: 'España', Otro: 'Otros' };
  function countryLabel(c) { return COUNTRY_LABELS[c] || c || 'Otros'; }
  function outletType(o) { return String((o && (o.type || o.outlet_type || o.tier || o.category)) || 'Otros').trim() || 'Otros'; }

  // Migración compat: añade campos ampliados a outlets/redactores antiguos sin perder datos.
  function migratePress() {
    let chg = false;
    const outs = getOutlets().map(o => {
      const m = Object.assign({}, o);
      if (m.country == null) { m.country = 'AR'; chg = true; }
      if (m.city == null) m.city = '';
      if (m.type == null) m.type = m.tier || m.category || 'Otros';
      if (m.editorialEmail == null) m.editorialEmail = m.email || '';
      if (m.notes == null) m.notes = '';
      if (m.subscribed == null) m.subscribed = true;
      return m;
    });
    if (chg) setOutlets(outs);
    let jchg = false;
    const js = getJournalists().map(j => {
      const m = Object.assign({}, j);
      if (!Array.isArray(m.beats)) { m.beats = m.beats ? String(m.beats).split(',').map(s => s.trim()).filter(Boolean) : []; jchg = true; }
      if (m.status == null) { m.status = 'active'; jchg = true; }
      return m;
    });
    if (jchg) setJournalists(js);
  }

  // Wiring de búsquedas/filtros de Noticias (una sola vez).
  let noticiasFiltersBound = false;
  function bindNoticiasFilters() {
    if (noticiasFiltersBound) return;
    noticiasFiltersBound = true;
    // Biblioteca
    const bs = $('#biblioSearch');
    if (bs) bs.addEventListener('input', debounce(() => { biblioSearch = bs.value || ''; renderBiblioteca(); }, 200));
    const bf = $('#biblioFilters');
    if (bf) bf.addEventListener('click', e => {
      const b = e.target.closest('[data-bstatus]'); if (!b) return;
      $$('#biblioFilters [data-bstatus]').forEach(x => x.classList.toggle('is-active', x === b));
      biblioStatus = b.dataset.bstatus || ''; renderBiblioteca();
    });
    const bsort = $('#biblioSort');
    if (bsort) bsort.addEventListener('change', () => { biblioSort = bsort.value || 'recent'; renderBiblioteca(); });
    // Medios
    const os = $('#outletSearch');
    if (os) os.addEventListener('input', debounce(() => { outletSearch = os.value || ''; renderOutlets(); }, 200));
    const ocf = $('#outletCountryFilter');
    if (ocf) ocf.addEventListener('click', e => {
      const b = e.target.closest('[data-ocountry]'); if (!b) return;
      $$('#outletCountryFilter [data-ocountry]').forEach(x => x.classList.toggle('is-active', x === b));
      outletCountryFilter = b.dataset.ocountry || ''; renderOutlets();
    });
    // Redactores
    const js = $('#journoSearch');
    if (js) js.addEventListener('input', debounce(() => { journoSearch = js.value || ''; renderJournalists(); }, 200));
    const jcf = $('#journoCountryFilter');
    if (jcf) jcf.addEventListener('click', e => {
      const b = e.target.closest('[data-jcountry]'); if (!b) return;
      $$('#journoCountryFilter [data-jcountry]').forEach(x => x.classList.toggle('is-active', x === b));
      journoCountryFilter = b.dataset.jcountry || ''; renderJournalists();
    });
    const jof = $('#journoOutletFilter');
    if (jof) jof.addEventListener('change', () => { journoOutletFilter = jof.value || ''; renderJournalists(); });
    const jsf = $('#journoStatusFilter');
    if (jsf) jsf.addEventListener('change', () => { journoStatusFilter = jsf.value || ''; renderJournalists(); });
  }

  // ============ AUTH ============
  const loginEl = $('#login'), appEl = $('#app');
  function isAuthed() { return localStorage.getItem(K.auth) === '1'; }
  function showApp() {
    loginEl.hidden = true; appEl.hidden = false;
    if (!location.hash || location.hash === '#') location.hash = '#/inicio';
    route(); hydrate();
  }
  function showLogin() { appEl.hidden = true; loginEl.hidden = false; }

  $('#loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const u = $('#userInput').value.trim(), p = $('#passInput').value;
    const msg = $('#loginMsg');
    if (u === CRED.user && p === CRED.pass) {
      localStorage.setItem(K.auth, '1'); msg.textContent = ''; showApp();
    } else { msg.textContent = 'Usuario o contraseña incorrectos.'; msg.className = 'login__msg'; }
  });
  $('#togglePass').addEventListener('click', () => {
    const i = $('#passInput'); i.type = i.type === 'password' ? 'text' : 'password';
  });
  $('#logoutBtn').addEventListener('click', () => { localStorage.removeItem(K.auth); location.hash = ''; showLogin(); });

  // ============ ROUTING ============
  const TITLES = { inicio: 'Inicio', edicion: 'Edición visual', noticias: 'Noticias', equipo: 'Equipo', legales: 'Legales', consultas: 'Consultas', suscriptores: 'Suscriptores', boletines: 'Boletines', empleo: 'Empleo', seo: 'SEO / Buscador', ajustes: 'Ajustes' };
  function currentView() { const m = (location.hash || '').match(/#\/(\w+)/); return m && TITLES[m[1]] ? m[1] : 'inicio'; }
  function route() {
    const v = currentView();
    $$('.view').forEach(s => s.hidden = s.id !== 'view-' + v);
    $$('.side__link').forEach(a => a.classList.toggle('is-active', a.dataset.view === v));
    $('#viewTitle').textContent = TITLES[v];
    appEl.classList.remove('side-open');
    renderView(v);
  }
  window.addEventListener('hashchange', () => { if (isAuthed()) route(); });

  function renderView(v) {
    if (v === 'inicio') renderInicio();
    else if (v === 'edicion') renderEdicion();
    else if (v === 'noticias') renderNoticias();
    else if (v === 'equipo') renderEquipo();
    else if (v === 'legales') renderLegales();
    else if (v === 'consultas') renderConsultas();
    else if (v === 'suscriptores') renderSuscriptores();
    else if (v === 'boletines') renderBoletines();
    else if (v === 'empleo') renderEmpleo();
    else if (v === 'seo') renderSeo();
    else if (v === 'ajustes') renderAjustes();
    hydrate();
  }

  // sidebar toggle (móvil)
  $('#menuToggle').addEventListener('click', () => appEl.classList.toggle('side-open'));
  $('#sideBack').addEventListener('click', () => appEl.classList.remove('side-open'));

  function refreshBadges() {
    const drafts = getNews().filter(n => n.status === 'draft').length;
    const nb = $('#newsBadge'); if (nb) { nb.hidden = drafts === 0; nb.textContent = drafts; }
    const unread = getMsgs().filter(m => !m.read).length;
    const mb = $('#msgBadge'); if (mb) { mb.hidden = unread === 0; mb.textContent = unread; }
    const subs = getSubs().length;
    const sb = $('#subsBadge'); if (sb) { sb.hidden = subs === 0; sb.textContent = subs; }
    const newApps = getApps().filter(a => !a.read).length;
    const jb = $('#jobsBadge'); if (jb) { jb.hidden = newApps === 0; jb.textContent = newApps; }
  }

  // ============ AUDITORÍA (registro de cambios) ============
  const SECTION_LABELS = { texts: 'Texto', media: 'Imagen', styles: 'Estilo', legal: 'Legal', settings: 'Ajustes', news: 'Noticias', team: 'Equipo', jobs: 'Empleo', apps: 'Candidatura' };
  function logAudit(section, key, before, after) {
    const list = getAudit();
    list.unshift({ id: uid(), section, key: key || '', before: before == null ? '' : String(before), after: after == null ? '' : String(after), user: $('#whoami') ? $('#whoami').textContent : 'admin', at: new Date().toISOString() });
    setAudit(list.slice(0, 200));
  }
  function openAudit() {
    renderAudit();
    const m = $('#auditModal'); m.classList.add('open'); m.setAttribute('aria-hidden', 'false'); hydrate();
  }
  function renderAudit() {
    const list = getAudit(), box = $('#auditList');
    if (!box) return;
    if (!list.length) { box.innerHTML = `<div class="news-empty"><span data-ico="history" data-ico-size="40"></span><p>Sin cambios registrados todavía.</p></div>`; hydrate(); return; }
    const sstr = (v) => {
      if (v == null) return '∅';
      if (typeof v === 'object') return Object.entries(v).map(([k, val]) => `${k}: ${val}`).join(' · ') || '∅';
      return String(v).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || '∅';
    };
    box.innerHTML = list.map(e => {
      const lbl = SECTION_LABELS[e.section] || e.section || '—';
      const bef = sstr(e.before), aft = sstr(e.after);
      const diff = (e.before != null || e.after != null)
        ? `<div class="audit-diff"><span class="audit-old">${esc(bef.slice(0, 160))}</span><span class="audit-arrow" data-ico="arrow-right" data-ico-size="14"></span><span class="audit-new">${esc(aft.slice(0, 160))}</span></div>`
        : '';
      return `<div class="audit-row">
        <div class="audit-head"><span class="audit-tag">${esc(lbl)}</span><span class="audit-key mono">${esc(e.key)}</span></div>
        ${diff}
        <div class="audit-meta">${esc(e.user || 'admin')} · ${esc(fmtTime(e.at))}</div>
      </div>`;
    }).join('');
    hydrate();
  }
  $('#auditBtn') && $('#auditBtn').addEventListener('click', openAudit);
  $('#auditClear') && $('#auditClear').addEventListener('click', async () => {
    if (!await confirmDialog('Limpiar historial', '¿Vaciar todo el registro de cambios? Esta acción no se puede deshacer.')) return;
    setAudit([]); renderAudit(); toast('Historial limpiado');
  });

  // ============ DIÁLOGO DE CONFIRMACIÓN (reutilizable) ============
  let confirmResolver = null;
  function confirmDialog(title, text) {
    const m = $('#confirmModal');
    if (!m) return Promise.resolve(window.confirm(text || title || '¿Seguro?'));
    $('#confirmTitle').textContent = title || 'Confirmar';
    $('#confirmText').textContent = text || '¿Seguro?';
    m.classList.add('open'); m.setAttribute('aria-hidden', 'false');
    return new Promise(res => { confirmResolver = res; });
  }
  function closeConfirm(val) {
    const m = $('#confirmModal'); if (m) { m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); }
    if (confirmResolver) { confirmResolver(val); confirmResolver = null; }
  }
  $('#confirmOk') && $('#confirmOk').addEventListener('click', () => closeConfirm(true));
  $('#confirmCancel') && $('#confirmCancel').addEventListener('click', () => closeConfirm(false));
  // El backdrop (#confirmModal .modal__back) lleva [data-close-modal]; el handler genérico
  // de cierre lo enruta a closeConfirm(false). No se añade listener extra para evitar doble-bind.

  // ============ INICIO ============
  function renderInicio() {
    const news = getNews(), pub = news.filter(n => n.status === 'published').length;
    const msgs = getMsgs();
    const subs = getSubs().length;
    const openJobs = getJobs().filter(j => j.status === 'open').length;
    $('#kpis').innerHTML = [
      ['newspaper', news.length, 'Noticias'],
      ['check-circle', pub, 'Publicadas'],
      ['mail', msgs.filter(m => !m.read).length, 'Consultas sin leer'],
      ['at-sign', subs, 'Suscriptores'],
      ['briefcase', openJobs, 'Empleos abiertos'],
      ['users', getTeam().length, 'Equipo directivo'],
    ].map(([ic, n, l]) => `<div class="kpi"><span class="kpi__ic" data-ico="${ic}"></span><div class="kpi__n">${n}</div><div class="kpi__l">${l}</div></div>`).join('');
    $('#quickLinks').innerHTML = [
      ['#/noticias', 'plus', 'Crear noticia', 'Publica novedades'],
      ['#/noticias', 'newspaper', 'Gestionar noticias', 'Editar / ordenar'],
      ['#/empleo', 'briefcase', 'Empleo', 'Ofertas y candidaturas'],
      ['#/equipo', 'users', 'Editar equipo', 'Cargos y bios'],
      ['#/ajustes', 'settings', 'Ajustes', 'Publicar / exportar'],
    ].map(([h, ic, t, sub]) => `<a href="${h}"><span class="quick__ic" data-ico="${ic}"></span><span><span class="quick__t">${t}</span><br><span class="quick__s">${sub}</span></span></a>`).join('');
    const s = getSettings();
    $('#siteStatus').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span style="font-weight:600">Sección de Noticias</span>
          <span class="ntb__state ${s.newsEnabled ? 'on' : 'off'}">${s.newsEnabled ? 'Visible' : 'Oculta'}</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span style="font-weight:600">Sección de Empleo</span>
          <span class="ntb__state ${s.jobsEnabled ? 'on' : 'off'}">${s.jobsEnabled ? 'Visible' : 'Oculta'}</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span style="font-weight:600">Noticias publicadas</span><span class="mono">${pub}</span>
        </div>
        <a href="../" target="_blank" rel="noopener" class="btn btn--ghost btn--sm" style="align-self:flex-start;margin-top:4px"><span class="ar" data-ico="external-link"></span> Abrir sitio público</a>
      </div>`;
    refreshBadges();
    hydrate();
  }

  // ============ NOTICIAS ============
  let newsTab = 'pagina';
  // Estado de búsqueda/orden/filtros (Biblioteca, Medios, Redactores)
  let biblioSearch = '', biblioStatus = '', biblioSort = 'recent';
  let outletSearch = '', outletCountryFilter = '', outletTypeFilter = '';
  let journoSearch = '', journoCountryFilter = '', journoOutletFilter = '', journoStatusFilter = '';
  function renderNoticias() {
    const s = getSettings();
    migratePress();
    bindNoticiasFilters();
    syncNewsToggle(s.newsEnabled);
    showNewsTab(newsTab);
    refreshBadges();
    hydrate();
  }
  function showNewsTab(tab) {
    newsTab = tab;
    $$('#newsTabs [data-ntab]').forEach(b => b.classList.toggle('is-active', b.dataset.ntab === tab));
    ['biblioteca', 'pagina', 'medios', 'redactores'].forEach(t => {
      const p = $('#npanel-' + t); if (p) p.hidden = t !== tab;
    });
    if (tab === 'biblioteca') renderBiblioteca();
    else if (tab === 'pagina') { renderPagina(); if (!pageHistInited) pageResetHistory(); loadNewsStudioFrame(); }
    else if (tab === 'medios') renderOutlets();
    else if (tab === 'redactores') renderJournalists();
    hydrate();
  }
  $('#newsTabs') && $('#newsTabs').addEventListener('click', e => {
    const b = e.target.closest('[data-ntab]'); if (!b) return; showNewsTab(b.dataset.ntab);
  });

  // Estado normalizado de una noticia (archivada > borrador > publicada).
  function newsStatusOf(n) {
    if (n && n.archived) return 'archived';
    if (n && n.status === 'draft') return 'draft';
    return 'published';
  }
  const BIB_STATUS_LABEL = { published: 'Publicada', draft: 'Borrador', archived: 'Archivada' };
  const dateNumNews = (n) => { const t = n && n.date ? Date.parse(n.date) : NaN; return isNaN(t) ? 0 : t; };

  function renderBiblioteca() {
    const all = getNews().slice();
    $('#newsCount').textContent = all.length;
    // Contadores dinámicos por estado.
    const counts = { all: all.length, published: 0, draft: 0, archived: 0 };
    all.forEach(n => { counts[newsStatusOf(n)]++; });
    $$('#biblioFilters [data-count]').forEach(b => { const k = b.dataset.count; if (counts[k] != null) b.textContent = counts[k]; });
    // Filtrado por búsqueda + estado.
    const q = biblioSearch.trim().toLowerCase();
    let news = all.filter(n => {
      if (biblioStatus && newsStatusOf(n) !== biblioStatus) return false;
      if (q) { const hay = ((n.title || '') + ' ' + (n.excerpt || '') + ' ' + (n.outletName || '')).toLowerCase(); if (hay.indexOf(q) < 0) return false; }
      return true;
    });
    // Orden.
    const rank = { published: 0, draft: 1, archived: 2 };
    if (biblioSort === 'recent') news.sort((a, b) => dateNumNews(b) - dateNumNews(a));
    else if (biblioSort === 'old') news.sort((a, b) => dateNumNews(a) - dateNumNews(b));
    else if (biblioSort === 'title') news.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'es'));
    else if (biblioSort === 'status') news.sort((a, b) => (rank[newsStatusOf(a)] - rank[newsStatusOf(b)]) || (dateNumNews(b) - dateNumNews(a)));
    else news.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (a.order ?? 0) - (b.order ?? 0) || (b.date || '').localeCompare(a.date || ''));

    const grid = $('#newsGrid');
    if (!all.length) {
      grid.innerHTML = `<div class="news-empty"><span data-ico="newspaper" data-ico-size="42"></span><p>Todavía no hay noticias.<br>Crea la primera o añade ejemplos.</p></div>`;
    } else if (!news.length) {
      grid.innerHTML = `<div class="news-empty"><span data-ico="search" data-ico-size="42"></span><p>Sin resultados para este filtro.<br>Prueba con otra búsqueda o estado.</p></div>`;
    } else {
      grid.innerHTML = news.map(n => {
        const st = newsStatusOf(n);
        return `
        <article class="ncard${n.archived ? ' is-archived' : ''}" data-id="${n.id}">
          <div class="ncard__img" style="${n.image ? `background-image:url('${esc(n.image)}')` : ''}">
            <div class="ncard__badges">
              <span class="ncard__status ${st}"><span class="ncard__dot ncard__dot--${st}"></span>${BIB_STATUS_LABEL[st]}</span>
              ${n.pinned ? '<span class="ncard__status pinned"><span data-ico="star" data-ico-size="11"></span>Destacada</span>' : ''}
            </div>
            ${n.category ? `<span class="ncard__cat">${esc(n.category)}</span>` : ''}
          </div>
          <div class="ncard__body">
            <span class="ncard__date">${fmtDate(n.date)}${n.outletName ? ' · ' + esc(n.outletName) : ''}</span>
            <h3 class="ncard__title">${esc(n.title)}</h3>
            <p class="ncard__ex">${esc(n.excerpt || '')}</p>
            <div class="ncard__foot">
              <button class="icon-btn" data-preview="${n.id}" title="Vista previa"><span data-ico="eye"></span></button>
              <button class="icon-btn" data-edit="${n.id}" title="Editar"><span data-ico="pencil"></span></button>
              <button class="icon-btn" data-toggle="${n.id}" title="${n.status === 'published' ? 'Pasar a borrador' : 'Publicar'}"><span data-ico="${n.status === 'published' ? 'eye-off' : 'eye'}"></span></button>
              <button class="icon-btn danger" data-del="${n.id}" title="Eliminar" style="margin-left:auto"><span data-ico="trash-2"></span></button>
            </div>
          </div>
        </article>`;
      }).join('');
    }
    hydrate(); refreshBadges();
  }
  function syncNewsToggle(on) {
    $('#newsEnabled').checked = on;
    const bar = $('#newsToggleBar'); bar.classList.toggle('is-on', on);
    const st = $('#newsState'); st.textContent = on ? 'Visible' : 'Oculta'; st.className = 'ntb__state ' + (on ? 'on' : 'off');
    $('#newsEnabledTxt').textContent = on ? 'Sección incluida' : 'Incluir sección';
  }
  function setNewsEnabled(on) {
    const s = getSettings(); const prev = s.newsEnabled; s.newsEnabled = on; setSettings(s);
    if (prev !== on) logAudit('settings', 'newsEnabled', prev ? 'Visible' : 'Oculta', on ? 'Visible' : 'Oculta');
    syncNewsToggle(on);
    const e2 = $('#newsEnabled2'); if (e2) e2.checked = on;
    toast(on ? 'Sección de Noticias activada en la web' : 'Sección de Noticias oculta', 'ok');
  }
  $('#newsEnabled').addEventListener('change', e => setNewsEnabled(e.target.checked));
  $('#newsSeed').addEventListener('click', () => {
    const news = getNews();
    const base = news.length;
    SAMPLE_NEWS.forEach((n, i) => news.push(Object.assign({ id: uid(), order: base + i }, n)));
    setNews(news); renderBiblioteca(); toast('Noticias de ejemplo añadidas', 'ok');
  });

  // ---- Importar desde enlace: abre el modal y enfoca el campo de enlace ----
  $('#newsImport') && $('#newsImport').addEventListener('click', () => {
    openNews(null);
    setTimeout(() => { const u = $('#nfImportUrl'); if (u) u.focus(); }, 80);
  });
  // Heurística de importación (sin backend): deriva título/medio/fuente del enlace.
  function newsImportFromLink() {
    const url = $('#nfImportUrl').value.trim();
    if (!url) { toast('Pega el enlace de la noticia.', 'info'); $('#nfImportUrl').focus(); return; }
    const btn = $('#nfImportBtn'); btn && btn.classList.add('is-busy');
    try {
      const u = new URL(url.includes('://') ? url : 'https://' + url);
      const host = u.hostname.replace(/^www\./, '');
      const segs = u.pathname.split('/').filter(Boolean);
      const last = segs.length ? segs[segs.length - 1] : '';
      const slug = (last || host).replace(/\.\w+$/, '');
      const words = slug.replace(/[-_]+/g, ' ').replace(/[^\w\sáéíóúñü]/gi, ' ').replace(/\s+/g, ' ').trim();
      if (words && !$('#nfTitle').value) $('#nfTitle').value = words.charAt(0).toUpperCase() + words.slice(1);
      if (!$('#nfSource').value) $('#nfSource').value = url;
      if (!$('#nfCat').value || $('#nfCat').value === 'Corporativo') $('#nfCat').value = 'Prensa';
      // Detectar el medio por dominio
      const match = getOutlets().find(o => {
        const w = String(o.url || '').replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase();
        return w && (w.indexOf(host.toLowerCase()) >= 0 || host.toLowerCase().indexOf(w.split('/')[0]) >= 0);
      });
      if (match && $('#nfOutlet')) { $('#nfOutlet').value = String(match.id); toast('Medio detectado: ' + match.name + '.', 'ok'); }
      else toast('Enlace importado. Revisa y completa los datos.', 'ok');
    } catch (_) { toast('Enlace no válido.', 'err'); }
    btn && btn.classList.remove('is-busy');
  }
  $('#nfImportBtn') && $('#nfImportBtn').addEventListener('click', newsImportFromLink);

  // ---- Modal noticia ----
  const newsModal = $('#newsModal');
  // Select de medio (modal de noticia) agrupado por país.
  function populateNewsOutlet(sel) {
    const s = $('#nfOutlet'); if (!s) return;
    const sorted = getOutlets().slice().sort((a, b) =>
      String(countryLabel(a.country)).localeCompare(String(countryLabel(b.country)), 'es') ||
      String(a.name || '').localeCompare(String(b.name || ''), 'es'));
    let html = '<option value="">— Sin medio —</option>', cur = null;
    sorted.forEach(o => {
      const c = countryLabel(o.country);
      if (c !== cur) { if (cur !== null) html += '</optgroup>'; html += `<optgroup label="${esc(c)}">`; cur = c; }
      html += `<option value="${esc(o.id)}">${esc(o.name || '')}</option>`;
    });
    if (cur !== null) html += '</optgroup>';
    s.innerHTML = html;
    s.value = sel || '';
  }
  function openNews(id, prefill) {
    const n = id ? getNews().find(x => x.id === id) : null;
    $('#newsModalTitle').textContent = n ? 'Editar noticia' : 'Nueva noticia';
    $('#nfId').value = n ? n.id : '';
    $('#nfImportUrl').value = '';
    $('#nfTitle').value = n ? n.title : (prefill ? prefill.title || '' : '');
    $('#nfExcerpt').value = n ? (n.excerpt || '') : (prefill ? prefill.excerpt || '' : '');
    $('#nfBody').value = n ? (n.body || '') : (prefill ? prefill.body || '' : '');
    $('#nfCat').value = n ? (n.category || 'Corporativo') : 'Corporativo';
    $('#nfStatus').value = n ? n.status : 'published';
    $('#nfDate').value = n ? (n.date || '') : new Date().toISOString().slice(0, 10);
    $('#nfSource').value = n ? (n.sourceUrl || n.source || '') : '';
    populateNewsOutlet(n ? (n.outletId || '') : '');
    $('#nfPinned').checked = !!(n && n.pinned);
    $('#nfShowHome').checked = !!(n && n.showHome);
    $('#nfArchived').checked = !!(n && n.archived);
    setImgPrev(n ? n.image : '');
    newsModal.classList.add('open'); newsModal.setAttribute('aria-hidden', 'false');
    hydrate();
  }
  function setImgPrev(src) {
    const prev = $('#nfImgPrev'), hint = $('#nfImgHint'), url = $('#nfImage');
    if (src) { prev.src = src; prev.hidden = false; hint.hidden = true; prev.dataset.src = src; if (url && /^(https?:|\.\.?\/|data:)/.test(src)) url.value = src; }
    else { prev.hidden = true; hint.hidden = false; prev.dataset.src = ''; }
  }
  function closeModal(m) { m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); }
  $$('[data-close-modal]').forEach(b => b.addEventListener('click', () => {
    const m = b.closest('.modal');
    if (m && m.id === 'confirmModal') { closeConfirm(false); return; }
    if (m) closeModal(m);
  }));
  $('#newsNew').addEventListener('click', () => openNews(null));
  $('#nfImgDrop').addEventListener('click', () => $('#nfImgFile').click());
  $('#nfImgFile').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    if (f.size > 8 * 1024 * 1024) { toast('La imagen supera 8 MB', 'err'); return; }
    const r = new FileReader(); r.onload = () => setImgPrev(r.result); r.readAsDataURL(f);
  });
  $('#nfImage') && $('#nfImage').addEventListener('input', e => setImgPrev(e.target.value.trim()));
  $('#newsSave').addEventListener('click', () => {
    const title = $('#nfTitle').value.trim();
    if (!title) { toast('Pon un título', 'err'); return; }
    const news = getNews();
    const id = $('#nfId').value;
    const outletId = $('#nfOutlet') ? $('#nfOutlet').value : '';
    const data = {
      title, excerpt: $('#nfExcerpt').value.trim(), body: $('#nfBody').value.trim(),
      category: $('#nfCat').value, status: $('#nfStatus').value, date: $('#nfDate').value,
      image: $('#nfImage').value.trim() || $('#nfImgPrev').dataset.src || '',
      sourceUrl: $('#nfSource').value.trim(),
      outletId: outletId, outletName: outletId ? outletNameById(outletId) : '',
      pinned: $('#nfPinned').checked, showHome: $('#nfShowHome').checked, archived: $('#nfArchived').checked,
    };
    if (id) {
      const i = news.findIndex(x => x.id === id);
      if (i >= 0) { logAudit('news', title, news[i].title, title); news[i] = Object.assign(news[i], data); }
    } else { data.id = uid(); data.order = news.length; news.unshift(data); logAudit('news', title, '∅', 'Creada'); }
    setNews(news); closeModal(newsModal); renderBiblioteca();
    reloadNewsStudioFrame();   // refresca la sección y la biblioteca flotante del estudio
    if (newsTab === 'pagina') { renderPagina(); pageRecord(); }   // refresca el estudio si está activo
    toast('Noticia guardada', 'ok');
  });
  // delegación en el grid
  $('#newsGrid').addEventListener('click', async e => {
    const pv = e.target.closest('[data-preview]'); if (pv) return openNewsPreview(pv.dataset.preview);
    const ed = e.target.closest('[data-edit]'); if (ed) return openNews(ed.dataset.edit);
    const tg = e.target.closest('[data-toggle]');
    if (tg) { const news = getNews(); const n = news.find(x => x.id === tg.dataset.toggle); if (n) { n.status = n.status === 'published' ? 'draft' : 'published'; setNews(news); renderBiblioteca(); toast(n.status === 'published' ? 'Publicada' : 'Pasada a borrador'); } return; }
    const dl = e.target.closest('[data-del]');
    if (dl) { if (!await confirmDialog('Eliminar noticia', '¿Eliminar esta noticia? Esta acción no se puede deshacer.')) return; const n = getNews().find(x => x.id === dl.dataset.del); setNews(getNews().filter(x => x.id !== dl.dataset.del)); if (n) logAudit('news', n.title, 'Existía', 'Eliminada'); renderBiblioteca(); toast('Noticia eliminada'); }
  });

  // ---- Vista previa de noticia ----
  function openNewsPreview(id) {
    const n = getNews().find(x => x.id === id); if (!n) return;
    const body = (n.body || n.excerpt || '').split(/\n{2,}/).map(p => `<p>${esc(p)}</p>`).join('');
    $('#newsPreviewModalTitle').textContent = 'Vista previa';
    $('#previewBody').innerHTML = `
      ${n.image ? `<div class="news-preview__img" style="background-image:url('${esc(n.image)}')"></div>` : ''}
      <div class="news-preview__meta">${esc(fmtDate(n.date))}${n.category ? ' · ' + esc(n.category) : ''}</div>
      <h2 class="news-preview__title">${esc(n.title)}</h2>
      ${n.excerpt ? `<p class="news-preview__lede">${esc(n.excerpt)}</p>` : ''}
      ${body}`;
    const m = $('#newsPreviewModal'); m.classList.add('open'); m.setAttribute('aria-hidden', 'false'); hydrate();
  }

  // ============ NOTICIAS · PÁGINA — ESTUDIO in-place (drag & drop + biblioteca) ============
  // El estudio opera directamente sobre cv_news (estados) y cv_pages.noticias (layout
  // {hero, items:[ids]}). Reescribe `order`/`pinned` en cv_news para que el sitio
  // público (site-news.js, que ordena por pinned→order→fecha y excluye archivadas)
  // refleje EXACTAMENTE el lienzo. Sin backend, sin iframe: todo en el panel.
  let pageLibTab = 'all';            // pestaña activa de la biblioteca (all|published|draft|archived)
  let pagePreviewing = false;        // modo previsualización (oculta el chrome de edición)

  function pageOutletName(n) { return n.outletName || n.outlet || n.category || 'Prensa'; }

  // Ribbon/badges de estado para una tarjeta del estudio.
  function pageRibbonHtml(n) {
    const st = newsStatusOf(n);
    let bits = `<span class="st-chip st-chip--${st}">${BIB_STATUS_LABEL[st]}</span>`;
    if (n.pinned) bits += `<span class="st-chip st-chip--pin"><span data-ico="star" data-ico-size="10"></span> Destacada</span>`;
    if (n.featured) bits += `<span class="st-chip st-chip--feat">Portada</span>`;
    return bits;
  }

  // Tarjeta del lienzo (hero o lista) — decorada con ribbon de estado + acciones.
  function pageMiniCard(n, hero) {
    return `<article class="pdrop-card${hero ? ' is-hero' : ''}" draggable="true" data-id="${n.id}" data-st="${newsStatusOf(n)}">
      <div class="pdrop-card__ribbon">${pageRibbonHtml(n)}</div>
      <div class="pdrop-card__img" style="${n.image ? `background-image:url('${esc(n.image)}')` : ''}">${n.image ? '' : `<span data-ico="image" data-ico-size="18"></span>`}</div>
      <div class="pdrop-card__b">
        <span class="pdrop-card__eyebrow">${esc(pageOutletName(n))}</span>
        <span class="pdrop-card__t">${esc(n.title)}</span>
        <span class="pdrop-card__d">${esc(fmtDate(n.date))}</span>
      </div>
      <div class="pdrop-card__acts">
        <button class="icon-btn" data-page-act="edit" data-id="${n.id}" title="Editar"><span data-ico="pencil" data-ico-size="14"></span></button>
        <button class="icon-btn${n.pinned ? ' on' : ''}" data-page-act="pin" data-id="${n.id}" title="Destacar"><span data-ico="star" data-ico-size="14"></span></button>
        <button class="icon-btn pdrop-card__rm" data-page-rm="${n.id}" title="Quitar de la página"><span data-ico="x" data-ico-size="14"></span></button>
      </div>
    </article>`;
  }

  // Tarjeta del pool/biblioteca — miniatura + meta + ribbon + acciones rápidas.
  function pagePoolCard(n) {
    const st = newsStatusOf(n);
    return `<div class="page-pool__item st-lc" draggable="true" data-id="${n.id}" data-st="${st}" title="Arrastrar al lienzo">
      <span class="page-pool__grip" data-ico="grip-vertical" data-ico-size="16"></span>
      <span class="page-pool__thumb" style="${n.image ? `background-image:url('${esc(n.image)}')` : ''}">${n.image ? '' : `<span data-ico="image" data-ico-size="14"></span>`}</span>
      <span class="page-pool__txt">
        <span class="page-pool__top"><span class="st-chip st-chip--${st} st-chip--xs">${BIB_STATUS_LABEL[st]}</span>${n.pinned ? '<span class="st-chip st-chip--pin st-chip--xs">★</span>' : ''}</span>
        <span class="page-pool__t">${esc(n.title)}</span>
        <span class="page-pool__d">${esc(fmtDate(n.date))}${n.outletName ? ' · ' + esc(n.outletName) : ''}</span>
      </span>
      <span class="page-pool__acts">
        <button class="icon-btn" data-pool-act="edit" data-id="${n.id}" title="Editar"><span data-ico="pencil" data-ico-size="13"></span></button>
        <button class="icon-btn" data-pool-act="status" data-id="${n.id}" title="${st === 'published' ? 'Pasar a borrador' : 'Publicar'}"><span data-ico="${st === 'published' ? 'eye-off' : 'eye'}" data-ico-size="13"></span></button>
        <button class="icon-btn${n.archived ? ' on' : ''}" data-pool-act="archive" data-id="${n.id}" title="${n.archived ? 'Restaurar' : 'Archivar'}"><span data-ico="trash-2" data-ico-size="13"></span></button>
      </span>
    </div>`;
  }

  function pageLibMatch(n, tab) {
    if (tab === 'all') return true;
    return newsStatusOf(n) === tab;
  }

  // Carga/recarga el iframe con la SECCIÓN REAL de noticias (editable inline).
  let _studioFrameLoaded = false;
  function loadNewsStudioFrame(force) {
    const fr = $('#newsStudioFrame'); if (!fr) return;
    if (_studioFrameLoaded && !force) return;
    _studioFrameLoaded = true;
    fr.src = '../?editor=1&studio=news&_=' + Date.now();
  }
  function reloadNewsStudioFrame() { const fr = $('#newsStudioFrame'); if (fr && _studioFrameLoaded) fr.src = '../?editor=1&studio=news&_=' + Date.now(); }
  // Mensajes del iframe del estudio: editar una noticia o refrescar tras un cambio.
  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin) return;
    const d = e.data; if (!d) return;
    if (d.type === 'cv:studio-edit') {
      if (d.id && getNews().some(n => String(n.id) === String(d.id))) openNews(d.id);
      else openNews(null); // ejemplo o sin id → nueva noticia
    } else if (d.type === 'cv:studio-changed') {
      // El estudio modificó cv_news (publicar/archivar/destacar/eliminar): refresca el admin.
      try { refreshBadges(); } catch (_) {}
      try { if (newsTab === 'biblioteca') renderBiblioteca(); if (newsTab === 'pagina') renderPagina(); } catch (_) {}
    }
  });

  function renderPagina() {
    const pages = getPages();
    const news = getNews();
    const byId = {}; news.forEach(n => byId[n.id] = n);
    const layout = pages.noticias || { hero: '', items: [] };
    // El lienzo sólo contiene publicadas y no archivadas (= lo que ve el público).
    const placeable = (id) => byId[id] && byId[id].status === 'published' && !byId[id].archived;
    layout.items = (layout.items || []).filter(placeable);
    if (layout.hero && !placeable(layout.hero)) layout.hero = '';
    const placed = new Set(layout.items);
    if (layout.hero) placed.add(layout.hero);

    // Contadores por estado (sobre TODO el corpus).
    const counts = { all: news.length, published: 0, draft: 0, archived: 0 };
    news.forEach(n => { counts[newsStatusOf(n)]++; });
    $$('#pageLibTabs [data-libc]').forEach(em => { const k = em.dataset.libc; if (counts[k] != null) em.textContent = counts[k]; });

    // Pool = biblioteca filtrada por pestaña, excluyendo lo ya colocado en el lienzo.
    const pool = news.filter(n => !placed.has(n.id) && pageLibMatch(n, pageLibTab));
    const poolBox = $('#pagePoolList');
    if (!news.length) {
      poolBox.innerHTML = `<div class="page-pool__empty">Todavía no hay noticias. Crea la primera con «Crear noticia».</div>`;
    } else if (!pool.length) {
      poolBox.innerHTML = `<div class="page-pool__empty">Sin noticias en esta vista. Cambia de pestaña o arrastra desde el lienzo.</div>`;
    } else {
      poolBox.innerHTML = pool.map(pagePoolCard).join('');
    }

    // Hero
    const heroBox = $('#pageHero');
    if (layout.hero && byId[layout.hero]) { heroBox.innerHTML = pageMiniCard(byId[layout.hero], true); heroBox.classList.add('has-item'); }
    else { heroBox.innerHTML = `<span class="page-hero__hint">Arrastra aquí la noticia destacada (hero)</span>`; heroBox.classList.remove('has-item'); }

    // Lista
    const listBox = $('#pageList');
    if (layout.items.length) listBox.innerHTML = layout.items.map(id => pageMiniCard(byId[id], false)).join('');
    else listBox.innerHTML = `<span class="page-list__hint">Arrastra noticias aquí para ordenar la página pública</span>`;

    pages.noticias = layout; setPages(pages);
    pageSyncOrder(layout);   // proyecta hero/items a pinned/order en cv_news
    updatePageStudioChrome();
    hydrate();
  }

  // Proyecta el layout del estudio (hero, items) sobre cv_news para que el sitio
  // público lo respete: el hero queda `pinned` y al frente; el resto sigue el orden
  // de `items`; las no colocadas van detrás conservando su orden relativo.
  function pageSyncOrder(layout) {
    const news = getNews();
    const ordered = [];
    if (layout.hero) ordered.push(layout.hero);
    (layout.items || []).forEach(id => { if (id !== layout.hero) ordered.push(id); });
    const rank = {}; ordered.forEach((id, i) => { rank[id] = i; });
    let chg = false, next = ordered.length;
    news.forEach(n => {
      const newOrder = rank[n.id] != null ? rank[n.id] : (next++);
      if (n.order !== newOrder) { n.order = newOrder; chg = true; }
      const wantPin = layout.hero === n.id;
      // El hero manda como destacada; no quita pins manuales de otras.
      if (wantPin && !n.pinned) { n.pinned = true; chg = true; }
    });
    if (chg) setNews(news);
  }

  function savePageLayout(layout, msg) {
    const pages = getPages(); pages.noticias = layout; setPages(pages);
    renderPagina();              // normaliza layout + proyecta order/pinned a cv_news
    pageRecord();                // captura el estado YA normalizado para el historial
    logAudit('news', 'página pública', '', 'Layout actualizado');
    reloadNewsStudioFrame();     // refresca la vista en vivo de la sección
    if (msg) toast(msg, 'ok');
  }

  // ---- Historial de snapshots (undo/redo) sobre cv_news + cv_pages.noticias ----
  let pageHist = [], pageHi = -1, pageHistInited = false;
  function pageSnapshot() {
    try { return JSON.stringify({ news: getNews(), layout: (getPages().noticias || { hero: '', items: [] }) }); }
    catch (_) { return null; }
  }
  function pageRecord() {
    const snap = pageSnapshot(); if (snap == null) return;
    if (pageHi >= 0 && pageHist[pageHi] === snap) return;        // sin cambios reales
    if (pageHi < pageHist.length - 1) pageHist = pageHist.slice(0, pageHi + 1);
    pageHist.push(snap);
    if (pageHist.length > 120) pageHist.shift();
    pageHi = pageHist.length - 1;
    updatePageStudioChrome();
  }
  function pageResetHistory() {
    const snap = pageSnapshot(); pageHist = snap == null ? [] : [snap]; pageHi = pageHist.length - 1; pageHistInited = true;
    updatePageStudioChrome();
  }
  function pageApplyHistory() {
    const snap = pageHist[pageHi]; if (snap == null) return;
    try {
      const data = JSON.parse(snap);
      setNews(Array.isArray(data.news) ? data.news : []);
      const pages = getPages(); pages.noticias = data.layout || { hero: '', items: [] }; setPages(pages);
    } catch (_) { return; }
    renderPagina(); renderBiblioteca();
    updatePageStudioChrome();
  }
  function pageUndo() { if (pageHi <= 0) return; pageHi--; pageApplyHistory(); toast('Cambio deshecho', 'ok'); }
  function pageRedo() { if (pageHi >= pageHist.length - 1) return; pageHi++; pageApplyHistory(); toast('Cambio rehecho', 'ok'); }

  // ---- Chrome del estudio (botones deshacer/rehacer/previsualizar) ----
  function updatePageStudioChrome() {
    const u = $('#pageUndo'), r = $('#pageRedo'), pv = $('#pagePreview');
    if (u) u.disabled = pageHi <= 0;
    if (r) r.disabled = pageHi >= pageHist.length - 1;
    if (pv) {
      pv.classList.toggle('is-active', pagePreviewing);
      pv.innerHTML = pagePreviewing
        ? '<span class="ar" data-ico="x-circle"></span> Volver a edición'
        : '<span class="ar" data-ico="eye"></span> Previsualizar';
      hydrate();
    }
  }

  // ---- Acciones de estado compartidas (pool + lienzo) ----
  function pageHandleAct(act, id) {
    const news = getNews(); const n = news.find(x => x.id === id); if (!n) return;
    if (act === 'edit') { openNews(id); return; }
    if (act === 'pin') { n.pinned = !n.pinned; setNews(news); savePageLayout(getPages().noticias, n.pinned ? 'Marcada como destacada' : 'Quitada de destacadas'); return; }
    if (act === 'status') {
      n.status = n.status === 'published' ? 'draft' : 'published';
      if (n.status === 'published') n.archived = false;
      else pageDetachFromLayout(id);   // al despublicar, sale del lienzo
      setNews(news);
      savePageLayout(getPages().noticias, n.status === 'published' ? 'Publicada' : 'Pasada a borrador');
      return;
    }
    if (act === 'archive') {
      n.archived = !n.archived;
      if (n.archived) pageDetachFromLayout(id);
      setNews(news);
      savePageLayout(getPages().noticias, n.archived ? 'Archivada' : 'Restaurada');
      return;
    }
  }
  function pageDetachFromLayout(id) {
    const pages = getPages(); const layout = pages.noticias || { hero: '', items: [] };
    layout.items = (layout.items || []).filter(x => x !== id);
    if (layout.hero === id) layout.hero = '';
    pages.noticias = layout; setPages(pages);
  }

  // ---- Previsualización (sitio público en pestaña nueva) ----
  function pageSetPreview(on) {
    pagePreviewing = on;
    const panel = $('#npanel-pagina'); if (panel) panel.classList.toggle('is-previewing', on);
    updatePageStudioChrome();
    if (on) {
      // Guarda el layout y abre el sitio público en modo editor para verlo en vivo.
      try { window.open('../?editor=1#noticias', '_blank', 'noopener'); } catch (_) {}
      toast('Vista pública abierta en otra pestaña', 'ok');
    }
  }

  // ---- Publicar (persistir cv_pages + cv_news) ----
  function pagePublish() {
    const pages = getPages(); const layout = pages.noticias || { hero: '', items: [] };
    pageSyncOrder(layout);
    pages.noticias = layout; setPages(pages);
    setNews(getNews());          // re-escribe cv_news (dispara `storage` en la web pública)
    pageResetHistory();
    logAudit('news', 'página pública', '', 'Publicada');
    toast('Página publicada · cambios visibles en la web', 'ok');
    updatePageStudioChrome();
  }

  // ---- Crear noticia desde el estudio ----
  function pageCreateNews() {
    if (pagePreviewing) pageSetPreview(false);
    openNews(null);   // abre el modal de noticia (queda como borrador hasta guardar)
  }
  // estado de arrastre de la página
  let pageDrag = null; // {id, src:'pool'|'hero'|'list'}
  function bindPageDnd() {
    const pool = $('#pagePool'), hero = $('#pageHero'), list = $('#pageList');
    if (!pool || pool.dataset.bound) return;
    pool.dataset.bound = '1';

    document.addEventListener('dragstart', e => {
      const item = e.target.closest('#pagePoolList .page-pool__item, #pageHero .pdrop-card, #pageList .pdrop-card');
      if (!item) return;
      const src = item.closest('#pageHero') ? 'hero' : (item.closest('#pageList') ? 'list' : 'pool');
      pageDrag = { id: item.dataset.id, src };
      item.classList.add('is-dragging');
      try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', item.dataset.id); } catch (_) {}
    });
    document.addEventListener('dragend', e => {
      $$('.is-dragging').forEach(x => x.classList.remove('is-dragging'));
      $$('.is-dropover').forEach(x => x.classList.remove('is-dropover'));
      pageDrag = null;
    });

    [hero, list, pool].forEach(zone => {
      if (!zone) return;
      zone.addEventListener('dragover', e => { if (pageDrag) { e.preventDefault(); zone.classList.add('is-dropover'); } });
      zone.addEventListener('dragleave', e => { if (!zone.contains(e.relatedTarget)) zone.classList.remove('is-dropover'); });
    });

    hero.addEventListener('drop', e => {
      if (!pageDrag) return; e.preventDefault(); hero.classList.remove('is-dropover');
      pageEnsurePublished(pageDrag.id);                          // soltar al lienzo = publicar
      const layout = getPages().noticias || { hero: '', items: [] };
      // El hero anterior baja a la lista; el nuevo hero queda destacado (pinned).
      const prevHero = layout.hero;
      layout.items = (layout.items || []).filter(x => x !== pageDrag.id);
      if (prevHero && prevHero !== pageDrag.id && layout.items.indexOf(prevHero) < 0) layout.items.unshift(prevHero);
      layout.hero = pageDrag.id;
      savePageLayout(layout, 'Noticia destacada actualizada');
    });

    list.addEventListener('drop', e => {
      if (!pageDrag) return; e.preventDefault(); list.classList.remove('is-dropover');
      pageEnsurePublished(pageDrag.id);                          // soltar al lienzo = publicar
      const layout = getPages().noticias || { hero: '', items: [] };
      if (layout.hero === pageDrag.id) layout.hero = '';
      layout.items = (layout.items || []).filter(x => x !== pageDrag.id);
      const idx = dropIndex(list, e.clientY);
      layout.items.splice(idx, 0, pageDrag.id);
      savePageLayout(layout, pageDrag.src === 'pool' ? 'Noticia publicada y añadida a la página' : 'Orden actualizado');
    });

    pool.addEventListener('drop', e => {
      if (!pageDrag || pageDrag.src === 'pool') { if (pool) pool.classList.remove('is-dropover'); return; }
      e.preventDefault(); pool.classList.remove('is-dropover');
      // Arrastrar fuera del lienzo (de vuelta a la biblioteca) = quitar y pasar a borrador.
      const layout = getPages().noticias || { hero: '', items: [] };
      layout.items = (layout.items || []).filter(x => x !== pageDrag.id);
      if (layout.hero === pageDrag.id) layout.hero = '';
      pages_unpublish(pageDrag.id);
      savePageLayout(layout, 'Noticia quitada de la página y pasada a borrador');
    });
  }
  // Garantiza que una noticia esté publicada y no archivada (al entrar al lienzo).
  function pageEnsurePublished(id) {
    const news = getNews(); const n = news.find(x => x.id === id); if (!n) return;
    let chg = false;
    if (n.status !== 'published') { n.status = 'published'; chg = true; }
    if (n.archived) { n.archived = false; chg = true; }
    if (chg) setNews(news);
  }
  // Pasa una noticia a borrador (al salir del lienzo hacia la biblioteca).
  function pages_unpublish(id) {
    const news = getNews(); const n = news.find(x => x.id === id); if (!n) return;
    if (n.status !== 'draft') { n.status = 'draft'; setNews(news); }
  }
  function dropIndex(list, y) {
    const cards = $$('.pdrop-card:not(.is-dragging)', list);
    let idx = cards.length;
    for (let i = 0; i < cards.length; i++) {
      const r = cards[i].getBoundingClientRect();
      if (y < r.top + r.height / 2) { idx = i; break; }
    }
    return idx;
  }
  // Acciones del estudio: quitar / editar / destacar (lienzo) y editar / estado / archivar (pool).
  document.addEventListener('click', e => {
    const rm = e.target.closest('[data-page-rm]');
    if (rm) {
      const layout = getPages().noticias || { hero: '', items: [] };
      layout.items = (layout.items || []).filter(x => x !== rm.dataset.pageRm);
      if (layout.hero === rm.dataset.pageRm) layout.hero = '';
      savePageLayout(layout, 'Noticia quitada de la página');
      return;
    }
    const pa = e.target.closest('[data-page-act]');
    if (pa) { e.preventDefault(); pageHandleAct(pa.dataset.pageAct, pa.dataset.id); return; }
    const la = e.target.closest('[data-pool-act]');
    if (la) { e.preventDefault(); pageHandleAct(la.dataset.poolAct, la.dataset.id); return; }
  });

  // Pestañas de estado de la biblioteca (filtran el pool).
  $('#pageLibTabs') && $('#pageLibTabs').addEventListener('click', e => {
    const t = e.target.closest('[data-libtab]'); if (!t) return;
    pageLibTab = t.dataset.libtab;
    $$('#pageLibTabs [data-libtab]').forEach(b => b.classList.toggle('is-active', b === t));
    renderPagina();
  });

  // Barra del estudio: deshacer / rehacer / crear / previsualizar / publicar.
  $('#pageUndo') && $('#pageUndo').addEventListener('click', pageUndo);
  $('#pageRedo') && $('#pageRedo').addEventListener('click', pageRedo);
  $('#pageNewsNew') && $('#pageNewsNew').addEventListener('click', pageCreateNews);
  $('#pagePreview') && $('#pagePreview').addEventListener('click', () => pageSetPreview(!pagePreviewing));
  $('#pagePublish') && $('#pagePublish').addEventListener('click', pagePublish);

  // ⌘Z / ⌘⇧Z (Ctrl en Windows/Linux) mientras la pestaña Página está activa.
  document.addEventListener('keydown', e => {
    if (newsTab !== 'pagina') return;
    const panel = $('#npanel-pagina'); if (!panel || panel.hidden) return;
    const tag = (e.target && e.target.tagName) || '';
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || (e.target && e.target.isContentEditable)) return;
    if ((e.metaKey || e.ctrlKey) && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault();
      if (e.shiftKey) pageRedo(); else pageUndo();
    } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || e.key === 'Y')) {
      e.preventDefault(); pageRedo();
    }
  });

  // ============ NOTICIAS · MEDIOS (outlets) ============
  const outletById = (id) => getOutlets().find(o => String(o.id) === String(id)) || null;
  // Cuenta de redactores por medio: Map<outlet_id, n>.
  function journoCounts() {
    const counts = new Map();
    getJournalists().forEach(j => { const k = String(j.outlet || ''); if (!k) return; counts.set(k, (counts.get(k) || 0) + 1); });
    return counts;
  }
  // Logo con fallback a inicial.
  function outletLogoHTML(o) {
    return o.logo
      ? `<img class="ogrid-card__logo" src="${esc(o.logo)}" alt="${esc(o.name || '')}" loading="lazy">`
      : `<div class="ogrid-card__logo empty">${esc((o.name || '?').slice(0, 1).toUpperCase())}</div>`;
  }
  // Chips de tipo dinámicos según los medios presentes.
  function renderTypeChips(container, outlets, active, onPick) {
    if (!container) return;
    const types = Array.from(new Set((outlets || []).map(outletType))).sort((a, b) => a.localeCompare(b, 'es'));
    let html = `<button type="button" class="chip${!active ? ' is-active' : ''}" data-type="">Todos los tipos</button>`;
    types.forEach(t => { html += `<button type="button" class="chip${active === t ? ' is-active' : ''}" data-type="${esc(t)}">${esc(t)}</button>`; });
    container.innerHTML = html;
    container.hidden = !types.length;
    $$('[data-type]', container).forEach(b => b.addEventListener('click', () => onPick(b.dataset.type || '')));
  }
  // Tarjeta de medio (logo, nombre, ubicación, badges, web).
  function outletCardHTML(o, journoCount) {
    const web = o.url
      ? `<a class="ogrid-card__web" href="${esc(o.url)}" target="_blank" rel="noopener"><span data-ico="globe" data-ico-size="13"></span>${esc(o.url.replace(/^https?:\/\//, ''))}</a>`
      : '';
    const loc = [o.city, countryLabel(o.country)].filter(Boolean).join(', ');
    const sub = o.subscribed !== false ? '<span class="ogrid-badge ogrid-badge--sub">suscrito</span>' : '';
    const jc = journoCount != null && journoCount > 0
      ? `<span class="ogrid-card__journos"><span data-ico="users" data-ico-size="12"></span>${journoCount} redactor${journoCount === 1 ? '' : 'es'}</span>` : '';
    return `<article class="ogrid-card" data-id="${esc(o.id)}">
      ${outletLogoHTML(o)}
      <div class="ogrid-card__body">
        <h3 class="ogrid-card__name">${esc(o.name || '—')}</h3>
        ${loc ? `<div class="ogrid-card__meta"><span data-ico="map-pin" data-ico-size="12"></span>${esc(loc)}</div>` : ''}
        <div class="ogrid-card__tags"><span class="ogrid-badge ogrid-badge--type">${esc(outletType(o))}</span>${sub}${jc}</div>
        ${web}
      </div>
      <div class="ogrid-card__actions">
        <button class="icon-btn" data-out-edit="${esc(o.id)}" title="Editar"><span data-ico="pencil"></span></button>
        <button class="icon-btn danger" data-out-del="${esc(o.id)}" title="Eliminar"><span data-ico="trash-2"></span></button>
      </div>
    </article>`;
  }
  // Grid compartido: filtra y agrupa por País › Tipo.
  function renderOutletGrid(container, outlets, opts) {
    opts = opts || {};
    if (!container) return;
    let list = (outlets || []).slice();
    const q = (opts.search || '').trim().toLowerCase();
    if (q) list = list.filter(o => [o.name, o.url, o.city, countryLabel(o.country)].some(v => String(v || '').toLowerCase().indexOf(q) >= 0));
    if (opts.country) list = list.filter(o => String(o.country || 'AR') === opts.country);
    if (opts.type) list = list.filter(o => outletType(o) === opts.type);
    if (!list.length) {
      container.innerHTML = `<div class="news-empty"><span data-ico="search" data-ico-size="42"></span><p>Sin medios para este filtro.<br>Prueba con otros filtros o añade uno nuevo.</p></div>`;
      hydrate(); return;
    }
    const counts = opts.counts || null;
    const byCountry = {};
    list.forEach(o => { const c = o.country || 'Otro'; (byCountry[c] = byCountry[c] || []).push(o); });
    let html = '';
    Object.keys(byCountry).sort().forEach(c => {
      const items = byCountry[c];
      html += `<section class="ogrid-group"><header class="ogrid-group__head"><span class="ogrid-group__country">${esc(countryLabel(c))}</span><span class="ogrid-group__count">${items.length}</span></header>`;
      const byType = {};
      items.forEach(o => { const t = outletType(o); (byType[t] = byType[t] || []).push(o); });
      Object.keys(byType).sort().forEach(t => {
        const group = byType[t].slice().sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'es'));
        html += `<div class="ogrid-type"><div class="ogrid-type__head">${esc(t)} <span>${group.length}</span></div><div class="ogrid">` +
          group.map(o => outletCardHTML(o, counts ? (counts.get(String(o.id)) || 0) : null)).join('') + `</div></div>`;
      });
      html += '</section>';
    });
    container.innerHTML = html;
    hydrate();
  }
  function renderOutlets() {
    const outlets = getOutlets(), grid = $('#outletGrid');
    if (!outlets.length) {
      const chips = $('#outletTypeFilter'); if (chips) chips.hidden = true;
      grid.innerHTML = `<div class="news-empty"><span data-ico="building-2" data-ico-size="42"></span><p>No hay medios todavía.<br>Añade los medios de prensa con los que trabajas.</p></div>`;
      hydrate(); return;
    }
    renderTypeChips($('#outletTypeFilter'), outlets, outletTypeFilter, (t) => { outletTypeFilter = t; renderOutlets(); });
    renderOutletGrid(grid, outlets, { search: outletSearch, country: outletCountryFilter, type: outletTypeFilter, counts: journoCounts() });
  }
  let outletLogoData = '';
  function openOutlet(id) {
    const o = id ? outletById(id) : null;
    $('#outletModalTitle').textContent = o ? 'Editar medio' : 'Nuevo medio';
    $('#ofId').value = o ? o.id : '';
    $('#ofName').value = o ? o.name : '';
    $('#ofUrl').value = o ? (o.url || '') : '';
    $('#ofCountry').value = o ? (o.country || 'AR') : 'AR';
    $('#ofCity').value = o ? (o.city || '') : '';
    $('#ofType').value = o ? (o.type || o.tier || o.category || '') : '';
    $('#ofEmail').value = o ? (o.editorialEmail || o.email || '') : '';
    $('#ofNotes').value = o ? (o.notes || '') : '';
    $('#ofSubscribed').checked = o ? o.subscribed !== false : true;
    outletLogoData = o ? (o.logo || '') : '';
    const prev = $('#ofLogoPrev'), hint = $('#ofLogo').querySelector('.logo-drop__hint');
    if (outletLogoData) { prev.src = outletLogoData; prev.hidden = false; if (hint) hint.hidden = true; }
    else { prev.hidden = true; if (hint) hint.hidden = false; }
    const m = $('#outletModal'); m.classList.add('open'); m.setAttribute('aria-hidden', 'false'); hydrate();
    setTimeout(() => $('#ofName').focus(), 60);
  }
  $('#outletNew') && $('#outletNew').addEventListener('click', () => openOutlet(null));
  $('#ofLogo') && $('#ofLogo').addEventListener('click', () => $('#ofLogoFile').click());
  $('#ofLogoFile') && $('#ofLogoFile').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    if (f.size > 8 * 1024 * 1024) { toast('La imagen supera 8 MB', 'err'); return; }
    outletLogoData = await fileToB64(f);
    const prev = $('#ofLogoPrev'), hint = $('#ofLogo').querySelector('.logo-drop__hint');
    prev.src = outletLogoData; prev.hidden = false; if (hint) hint.hidden = true;
  });
  $('#outletSave') && $('#outletSave').addEventListener('click', () => {
    const name = $('#ofName').value.trim();
    if (!name) { toast('Pon el nombre del medio', 'err'); $('#ofName').focus(); return; }
    const outlets = getOutlets(); const id = $('#ofId').value;
    const data = {
      name, url: $('#ofUrl').value.trim(), logo: outletLogoData || '',
      country: $('#ofCountry').value || 'AR', city: $('#ofCity').value.trim(),
      type: $('#ofType').value.trim() || 'Otros', editorialEmail: $('#ofEmail').value.trim(),
      notes: $('#ofNotes').value.trim(), subscribed: $('#ofSubscribed').checked,
    };
    if (id) { const i = outlets.findIndex(x => x.id === id); if (i >= 0) outlets[i] = Object.assign(outlets[i], data); logAudit('news', 'medio: ' + name, 'Existía', 'Actualizado'); }
    else { data.id = uid(); outlets.push(data); logAudit('news', 'medio: ' + name, '∅', 'Creado'); }
    setOutlets(outlets); closeModal($('#outletModal'));
    populateNewsOutlet($('#nfOutlet') ? $('#nfOutlet').value : '');
    renderOutlets(); toast('Medio guardado', 'ok');
  });
  $('#outletGrid') && $('#outletGrid').addEventListener('click', async e => {
    const ed = e.target.closest('[data-out-edit]'); if (ed) return openOutlet(ed.dataset.outEdit);
    const dl = e.target.closest('[data-out-del]');
    if (dl) {
      if (!await confirmDialog('Eliminar medio', '¿Eliminar este medio? Los redactores asociados quedarán sin medio.')) return;
      setOutlets(getOutlets().filter(x => x.id !== dl.dataset.outDel));
      renderOutlets(); toast('Medio eliminado');
    }
  });

  // ============ NOTICIAS · REDACTORES (journalists) ============
  // Select de medio en el modal de redactor.
  function populateOutletSelect() {
    const sel = $('#jfOutlet'); if (!sel) return;
    const cur = sel.value;
    const sorted = getOutlets().slice().sort((a, b) =>
      String(countryLabel(a.country)).localeCompare(String(countryLabel(b.country)), 'es') ||
      String(a.name || '').localeCompare(String(b.name || ''), 'es'));
    let html = '<option value="">— Medio —</option>', cur2 = null;
    sorted.forEach(o => {
      const c = countryLabel(o.country);
      if (c !== cur2) { if (cur2 !== null) html += '</optgroup>'; html += `<optgroup label="${esc(c)}">`; cur2 = c; }
      html += `<option value="${esc(o.id)}">${esc(o.name || '')}</option>`;
    });
    if (cur2 !== null) html += '</optgroup>';
    sel.innerHTML = html; sel.value = cur;
  }
  function outletNameById(id) { const o = outletById(id); return o ? o.name : ''; }
  // País de un redactor = país de su medio.
  function journoCountry(j) { const o = outletById(j.outlet); return (o && o.country) || 'Otro'; }
  // Select de filtro por medio: solo medios que tienen redactores.
  function populateJournoOutletFilter() {
    const sel = $('#journoOutletFilter'); if (!sel) return;
    const ids = new Set(getJournalists().map(j => String(j.outlet || '')));
    const opts = getOutlets().filter(o => ids.has(String(o.id))).slice().sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'es'));
    let html = '<option value="">Todos los medios</option>';
    opts.forEach(o => { html += `<option value="${esc(o.id)}"${String(o.id) === journoOutletFilter ? ' selected' : ''}>${esc(o.name || '—')}</option>`; });
    sel.innerHTML = html; sel.value = journoOutletFilter;
  }
  // Tarjeta de redactor (foto/inicial, nombre+estado, rol, medio con logo, beats).
  function journoRowHTML(j) {
    const photo = j.photo
      ? `<img class="jcard__photo" src="${esc(j.photo)}" alt="${esc(j.name || '')}" loading="lazy">`
      : `<div class="jcard__photo empty">${esc((j.name || '?').slice(0, 1).toUpperCase())}</div>`;
    const o = outletById(j.outlet);
    const outletLogo = o && o.logo ? `<img class="jcard__outlet-logo" src="${esc(o.logo)}" alt="" loading="lazy">` : '';
    const outletName = (o && o.name) || j.outletName || 'Sin medio';
    const role = j.role ? `<div class="jcard__role">${esc(j.role)}</div>` : '';
    const st = j.status || 'active';
    const stLabel = st === 'inactive' ? 'inactivo' : 'activo';
    const beats = (Array.isArray(j.beats) ? j.beats : []).slice(0, 4).map(b => `<span class="jcard__beat">${esc(b)}</span>`).join('');
    const beatsRow = beats ? `<div class="jcard__beats">${beats}</div>` : '';
    const email = j.email ? `<a class="jcard__email" href="mailto:${esc(j.email)}"><span data-ico="mail" data-ico-size="12"></span>${esc(j.email)}</a>` : '';
    return `<article class="jcard" data-id="${esc(j.id)}">
      ${photo}
      <div class="jcard__body">
        <div class="jcard__top">
          <h3 class="jcard__name">${esc(j.name || '—')}</h3>
          <span class="jcard__status jcard__status--${esc(st)}">${esc(stLabel)}</span>
        </div>
        ${role}
        <div class="jcard__outlet">${outletLogo}<span>${esc(outletName)}</span></div>
        ${email}
        ${beatsRow}
      </div>
      <div class="jcard__actions">
        <button class="icon-btn" data-jour-edit="${esc(j.id)}" title="Editar"><span data-ico="pencil"></span></button>
        <button class="icon-btn danger" data-jour-del="${esc(j.id)}" title="Eliminar"><span data-ico="trash-2"></span></button>
      </div>
    </article>`;
  }
  function renderJournalists() {
    const all = getJournalists(), grid = $('#journalistGrid');
    populateJournoOutletFilter();
    if (!all.length) {
      grid.innerHTML = `<div class="news-empty"><span data-ico="users" data-ico-size="42"></span><p>No hay redactores todavía.<br>Añade los contactos de prensa.</p></div>`;
      hydrate(); return;
    }
    let list = all.slice();
    const q = journoSearch.trim().toLowerCase();
    if (q) list = list.filter(j => {
      const o = outletById(j.outlet);
      const hay = [j.name, j.email, j.role, (Array.isArray(j.beats) ? j.beats.join(' ') : ''), o && o.name, j.outletName]
        .map(v => String(v || '').toLowerCase()).join(' ');
      return hay.indexOf(q) >= 0;
    });
    if (journoCountryFilter) list = list.filter(j => journoCountry(j) === journoCountryFilter);
    if (journoOutletFilter) list = list.filter(j => String(j.outlet || '') === journoOutletFilter);
    if (journoStatusFilter) list = list.filter(j => (j.status || 'active') === journoStatusFilter);
    if (!list.length) {
      grid.innerHTML = `<div class="news-empty"><span data-ico="search" data-ico-size="42"></span><p>Sin redactores para este filtro.<br>Prueba con otros filtros.</p></div>`;
      hydrate(); return;
    }
    const byCountry = {};
    list.forEach(j => { const c = journoCountry(j); (byCountry[c] = byCountry[c] || []).push(j); });
    let html = '';
    Object.keys(byCountry).sort().forEach(c => {
      const items = byCountry[c].slice().sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'es'));
      html += `<section class="jgrid-group"><header class="jgrid-group__head"><span>${esc(countryLabel(c))}</span><span class="jgrid-group__count">${items.length}</span></header>` +
        `<div class="jgrid">${items.map(journoRowHTML).join('')}</div></section>`;
    });
    grid.innerHTML = html;
    hydrate();
  }
  let journalistPhotoData = '';
  function openJournalist(id) {
    populateOutletSelect();
    const j = id ? getJournalists().find(x => x.id === id) : null;
    $('#journalistModalTitle').textContent = j ? 'Editar redactor' : 'Nuevo redactor';
    $('#jfId').value = j ? j.id : '';
    $('#jfName').value = j ? j.name : '';
    $('#jfRole').value = j ? (j.role || '') : '';
    $('#jfOutlet').value = j ? (j.outlet || '') : '';
    $('#jfEmail').value = j ? (j.email || '') : '';
    $('#jfPhone').value = j ? (j.phone || '') : '';
    $('#jfBeats').value = j ? (Array.isArray(j.beats) ? j.beats.join(', ') : (j.beats || '')) : '';
    $('#jfStatus').value = j ? (j.status || 'active') : 'active';
    journalistPhotoData = j ? (j.photo || '') : '';
    const prev = $('#jfPhotoPrev'), hint = $('#jfPhoto').querySelector('.img-drop__hint');
    if (journalistPhotoData) { prev.src = journalistPhotoData; prev.hidden = false; if (hint) hint.hidden = true; }
    else { prev.hidden = true; if (hint) hint.hidden = false; }
    const m = $('#journalistModal'); m.classList.add('open'); m.setAttribute('aria-hidden', 'false'); hydrate();
    setTimeout(() => $('#jfName').focus(), 60);
  }
  $('#journalistNew') && $('#journalistNew').addEventListener('click', () => openJournalist(null));
  $('#jfPhoto') && $('#jfPhoto').addEventListener('click', () => $('#jfPhotoFile').click());
  $('#jfPhotoFile') && $('#jfPhotoFile').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    if (f.size > 8 * 1024 * 1024) { toast('La imagen supera 8 MB', 'err'); return; }
    journalistPhotoData = await fileToB64(f);
    const prev = $('#jfPhotoPrev'), hint = $('#jfPhoto').querySelector('.img-drop__hint');
    prev.src = journalistPhotoData; prev.hidden = false; if (hint) hint.hidden = true;
  });
  $('#journalistSave') && $('#journalistSave').addEventListener('click', () => {
    const name = $('#jfName').value.trim();
    if (!name) { toast('Pon el nombre del redactor', 'err'); $('#jfName').focus(); return; }
    const js = getJournalists(); const id = $('#jfId').value;
    const data = {
      name, role: $('#jfRole').value.trim(), outlet: $('#jfOutlet').value,
      outletName: outletNameById($('#jfOutlet').value), email: $('#jfEmail').value.trim(),
      phone: $('#jfPhone').value.trim(), photo: journalistPhotoData || '',
      beats: $('#jfBeats').value.split(',').map(s => s.trim()).filter(Boolean),
      status: $('#jfStatus').value || 'active',
    };
    if (id) { const i = js.findIndex(x => x.id === id); if (i >= 0) js[i] = Object.assign(js[i], data); }
    else { data.id = uid(); js.push(data); }
    setJournalists(js); closeModal($('#journalistModal')); renderJournalists(); renderOutlets(); toast('Redactor guardado', 'ok');
  });
  $('#journalistGrid') && $('#journalistGrid').addEventListener('click', async e => {
    const ed = e.target.closest('[data-jour-edit]'); if (ed) return openJournalist(ed.dataset.jourEdit);
    const dl = e.target.closest('[data-jour-del]');
    if (dl) {
      if (!await confirmDialog('Eliminar redactor', '¿Eliminar este contacto de prensa?')) return;
      setJournalists(getJournalists().filter(x => x.id !== dl.dataset.jourDel));
      renderJournalists(); toast('Redactor eliminado');
    }
  });

  // ============ EQUIPO (CRUD completo: alta, edición, foto, oculto, orden) ============
  const teamModal = $('#teamModal');
  let teamPhotoBuf = '';      // foto pendiente (URL o dataURL)
  let teamDragId = null;
  const teamById = (id) => getTeam().find(m => String(m.id) === String(id));

  function renderEquipo() {
    const team = getTeam();
    const list = $('#teamList');
    const cnt = $('#teamCount'); if (cnt) cnt.textContent = team.length;
    if (!list) return;
    if (!team.length) {
      list.innerHTML = `<div class="news-empty"><span data-ico="users" data-ico-size="42"></span><p>Aún no hay miembros del equipo.<br>Añade el primero o restaura los originales.</p></div>`;
      hydrate(); return;
    }
    list.innerHTML = team.map(m => `
      <article class="tm-card${m.hidden ? ' is-hidden' : ''}" draggable="true" data-id="${esc(m.id)}">
        <div class="tm-card__media"${m.photo ? ` style="background-image:url('${esc(m.photo)}')"` : ''}>
          ${m.photo ? '' : `<span class="tm-card__ph" data-ico="users" data-ico-size="26"></span>`}
          <span class="tm-card__grip" data-ico="grip-vertical" data-ico-size="16"></span>
          <span class="tm-card__act">
            <button class="icon-btn" data-tm-edit="${esc(m.id)}" title="Editar"><span data-ico="pencil"></span></button>
            <button class="icon-btn danger" data-tm-del="${esc(m.id)}" title="Eliminar"><span data-ico="trash-2"></span></button>
          </span>
        </div>
        <div class="tm-card__body">
          <span class="tm-card__role">${esc(m.role || '')}${m.area ? ' · ' + esc(m.area) : ''}</span>
          <span class="tm-card__name">${esc(m.name || '(sin nombre)')}${m.hidden ? ' <em class="tm-card__hid">oculto</em>' : ''}</span>
        </div>
      </article>`).join('');
    hydrate();
  }

  function setTeamPhoto(src) {
    teamPhotoBuf = src || '';
    const prev = $('#tfPhotoPrev'), hint = $('#tfPhotoHint'), url = $('#tfPhoto');
    if (src) { prev.src = src; prev.hidden = false; hint.hidden = true; } else { prev.hidden = true; hint.hidden = false; }
    if (url && /^(https?:|\.\.?\/|data:)/.test(src || '')) url.value = src;
  }
  function openTeamModal(id) {
    const m = id != null ? teamById(id) : null;
    $('#teamModalTitle').textContent = m ? 'Editar miembro' : 'Nuevo miembro';
    $('#tfId').value = m ? m.id : '';
    $('#tfName').value = m ? m.name : '';
    $('#tfRole').value = m ? m.role : '';
    $('#tfArea').value = m ? (m.area || '') : '';
    $('#tfBio').value = m ? (m.bio || '') : '';
    $('#tfPhoto').value = m ? (m.photo || '') : '';
    $('#tfHidden').checked = !!(m && m.hidden);
    $('#teamDelete').hidden = !m;
    setTeamPhoto(m ? m.photo : '');
    teamModal.classList.add('open'); teamModal.setAttribute('aria-hidden', 'false');
    hydrate(); setTimeout(() => $('#tfName').focus(), 60);
  }
  $('#teamNew').addEventListener('click', () => openTeamModal(null));
  $('#tfPhotoDrop').addEventListener('click', () => $('#tfPhotoFile').click());
  $('#tfPhotoFile').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    if (f.size > 8 * 1024 * 1024) { toast('La imagen supera 8 MB', 'err'); return; }
    const r = new FileReader(); r.onload = () => setTeamPhoto(r.result); r.readAsDataURL(f);
  });
  $('#tfPhoto').addEventListener('input', e => setTeamPhoto(e.target.value.trim()));
  $('#teamSave').addEventListener('click', () => {
    const name = $('#tfName').value.trim();
    if (!name) { toast('El nombre es obligatorio', 'err'); $('#tfName').focus(); return; }
    const team = getTeam();
    const id = $('#tfId').value;
    const data = {
      name, role: $('#tfRole').value.trim(), area: $('#tfArea').value.trim(),
      bio: $('#tfBio').value.trim(), photo: (teamPhotoBuf || $('#tfPhoto').value.trim()),
      hidden: $('#tfHidden').checked,
    };
    const i = id ? team.findIndex(x => String(x.id) === String(id)) : -1;
    if (i >= 0) { const prev = team[i]; team[i] = Object.assign({}, prev, data); logAudit('team', name, prev.role || '', data.role || ''); }
    else { team.push(normMember(Object.assign({ id: uid() }, data))); logAudit('team', name, '∅', 'nuevo miembro'); }
    setTeam(team); closeModal(teamModal); renderEquipo();
    toast(i >= 0 ? 'Miembro actualizado' : 'Miembro añadido', 'ok');
  });
  $('#teamDelete').addEventListener('click', async () => {
    const id = $('#tfId').value; const m = teamById(id); if (!m) return;
    if (!await confirmDialog('Eliminar miembro', `¿Eliminar a «${m.name}» del equipo?`)) return;
    setTeam(getTeam().filter(x => String(x.id) !== String(id)));
    logAudit('team', m.name, m.role || '', 'eliminado');
    closeModal(teamModal); renderEquipo(); toast('Miembro eliminado');
  });
  $('#teamRestore').addEventListener('click', async () => {
    if (!await confirmDialog('Restaurar equipo', '¿Restaurar el equipo a los 6 directivos originales? Se perderán los cambios y los miembros añadidos.')) return;
    localStorage.removeItem(K.team); renderEquipo(); toast('Equipo restaurado');
  });
  // interacción de la lista (editar/eliminar) + drag para reordenar
  $('#teamList').addEventListener('click', async e => {
    const ed = e.target.closest('[data-tm-edit]'); if (ed) return openTeamModal(ed.dataset.tmEdit);
    const dl = e.target.closest('[data-tm-del]');
    if (dl) { const m = teamById(dl.dataset.tmDel); if (m && await confirmDialog('Eliminar miembro', `¿Eliminar a «${m.name}»?`)) { setTeam(getTeam().filter(x => String(x.id) !== String(dl.dataset.tmDel))); logAudit('team', m.name, m.role || '', 'eliminado'); renderEquipo(); toast('Miembro eliminado'); } }
  });
  $('#teamList').addEventListener('dragstart', e => { const c = e.target.closest && e.target.closest('.tm-card'); if (c) { teamDragId = c.dataset.id; c.classList.add('is-dragging'); try { e.dataTransfer.effectAllowed = 'move'; } catch (_) {} } });
  $('#teamList').addEventListener('dragend', e => { const c = e.target.closest && e.target.closest('.tm-card'); if (c) c.classList.remove('is-dragging'); teamDragId = null; });
  $('#teamList').addEventListener('dragover', e => {
    if (teamDragId == null) return; e.preventDefault();
    const dragged = $$('#teamList .tm-card').find(c => c.dataset.id === String(teamDragId));
    const after = $$('#teamList .tm-card').filter(c => c.dataset.id !== String(teamDragId)).find(c => {
      const r = c.getBoundingClientRect(); return e.clientY < r.top + r.height / 2 && e.clientX < r.right;
    });
    if (dragged) $('#teamList').insertBefore(dragged, after || null);
  });
  $('#teamList').addEventListener('drop', e => {
    if (teamDragId == null) return; e.preventDefault();
    const order = $$('#teamList .tm-card').map(c => c.dataset.id);
    const cur = getTeam();
    setTeam(order.map(id => cur.find(m => String(m.id) === String(id))).filter(Boolean));
    renderEquipo(); toast('Orden actualizado');
  });

  // ============ CONSULTAS ============
  // Estado del filtro de bandeja: 'open' | 'resolved' | '' (todas)
  let inboxResolution = 'open';
  // Normaliza al esquema completo (compatible con consultas antiguas {id,name,email,message,date,read})
  function msgNorm(m) {
    m = m || {};
    const resolution = m.resolution === 'resolved' ? 'resolved' : 'open';
    const status = m.status || (m.replied || (m.reply && String(m.reply).trim()) ? 'replied' : 'new');
    return Object.assign({}, m, {
      id: m.id, name: m.name || '', email: m.email || '', phone: m.phone || '',
      company: m.company || '', country: m.country || '', topic: m.topic || m.subject || '',
      message: m.message || '', date: m.date || '', source: m.source || 'contacto',
      read: !!m.read, status, resolution, reply: m.reply || '',
      repliedAt: m.repliedAt || '', resolvedAt: m.resolvedAt || '',
    });
  }
  const resolutionOf = (m) => (m.resolution === 'resolved' ? 'resolved' : 'open');
  function refreshInboxCounts() {
    const all = getMsgs().map(msgNorm);
    const open = all.filter(m => resolutionOf(m) === 'open').length;
    const resolved = all.length - open;
    const counts = { open, resolved, all: all.length };
    $$('#inboxResolution [data-rcount]').forEach(node => {
      const k = node.dataset.rcount; if (counts[k] != null) node.textContent = String(counts[k]);
    });
  }
  function msgHTML(m) {
    const isReplied = m.status === 'replied';
    const isResolved = resolutionOf(m) === 'resolved';
    const tag = isReplied ? '<span class="tag replied">Respondida</span>' : '<span class="tag new">Nueva</span>';
    const resolvedTag = isResolved ? '<span class="tag resolved">Resuelta</span>' : '';
    const unreadDot = m.read ? '' : '<span class="tag unread">Sin leer</span>';
    const meta = [];
    if (m.company) meta.push(`<span class="msg__meta"><b>Empresa:</b> ${esc(m.company)}</span>`);
    if (m.country) meta.push(`<span class="msg__meta"><b>País:</b> ${esc(m.country)}</span>`);
    if (m.topic) meta.push(`<span class="msg__meta"><b>Asunto:</b> ${esc(m.topic)}</span>`);
    if (m.phone) meta.push(`<span class="msg__meta"><b>Tel:</b> ${esc(m.phone)}</span>`);
    const replyGiven = (isReplied && m.reply)
      ? `<div class="msg__reply-given"><span class="lbl">Tu respuesta${m.repliedAt ? ' · ' + esc(fmtTime(m.repliedAt)) : ''}</span>${esc(m.reply)}</div>` : '';
    return `
      <article class="msg msg--full${m.read ? '' : ' is-unread'}" data-id="${esc(m.id)}">
        <div class="msg__main">
          <div class="msg__top">
            <span class="msg__from">${esc(m.name || 'Anónimo')}</span>
            ${m.email ? `<a class="msg__email" href="mailto:${esc(m.email)}">${esc(m.email)}</a>` : ''}
            ${tag}${resolvedTag}${unreadDot}
            <span class="msg__date">${esc(m.date ? fmtTime(m.date) : '')}</span>
          </div>
          ${meta.length ? `<div class="msg__rows">${meta.join('')}</div>` : ''}
          <p class="msg__txt">${esc(m.message || '')}</p>
          ${replyGiven}
          <div class="msg__actions">
            <button class="btn btn--ghost btn--sm" data-act="read">${m.read ? 'Marcar no leída' : 'Marcar leída'}</button>
            ${m.email ? '<button class="btn btn--ghost btn--sm" data-act="reply"><span class="ar" data-ico="reply"></span> Responder</button>' : ''}
            <button class="btn btn--ghost btn--sm" data-act="resolve">${isResolved ? '<span class="ar" data-ico="rotate-ccw"></span> Reabrir' : '<span class="ar" data-ico="check-circle"></span> Resolver'}</button>
            <button class="btn btn--danger btn--sm" data-act="del" style="margin-left:auto"><span class="ar" data-ico="trash-2"></span> Eliminar</button>
          </div>
        </div>
      </article>`;
  }
  function renderConsultas() {
    const all = getMsgs().map(msgNorm).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    $('#msgCount').textContent = all.length;
    refreshInboxCounts();
    const list = inboxResolution ? all.filter(m => resolutionOf(m) === inboxResolution) : all;
    const box = $('#inbox');
    if (!list.length) {
      const msg = inboxResolution === 'resolved' ? 'No hay consultas resueltas todavía.'
        : (inboxResolution === 'open' ? 'No hay consultas abiertas. ¡Bandeja al día!' : 'No hay consultas todavía.');
      box.innerHTML = `<div class="news-empty"><span data-ico="inbox" data-ico-size="42"></span><p>${msg}</p></div>`;
      hydrate(); refreshBadges(); return;
    }
    box.innerHTML = list.map(msgHTML).join('');
    hydrate(); refreshBadges();
  }
  // Marca leída la consulta al desplegarla (cuando se hace clic en el cuerpo, no en un botón)
  $('#inbox').addEventListener('click', e => {
    if (e.target.closest('[data-act]')) return;
    const row = e.target.closest('.msg');
    if (row && row.classList.contains('is-unread')) {
      const msgs = getMsgs(); const m = msgs.find(x => x.id === row.dataset.id);
      if (m) { m.read = true; setMsgs(msgs); renderConsultas(); }
    }
  });
  // Acciones de cada consulta
  $('#inbox').addEventListener('click', async e => {
    const btn = e.target.closest('[data-act]'); if (!btn) return;
    const row = e.target.closest('.msg'); if (!row) return;
    const id = row.dataset.id; const act = btn.dataset.act;
    const msgs = getMsgs(); const i = msgs.findIndex(x => x.id === id);
    if (i < 0) return; const m = msgs[i];
    if (act === 'read') {
      m.read = !m.read; setMsgs(msgs); renderConsultas();
      toast(m.read ? 'Marcada como leída' : 'Marcada como no leída', 'ok');
    } else if (act === 'reply') {
      if (!m.email) { toast('Esta consulta no tiene correo', 'err'); return; }
      const subject = 'Re: ' + (m.topic ? m.topic + ' · ' : '') + 'Cabo Vírgenes';
      const body = `Hola ${m.name || ''},\n\nGracias por tu consulta a Cabo Vírgenes.\n\n— — —\n${(m.message || '').replace(/\r?\n/g, '\n')}\n— — —\n\n`;
      window.location.href = 'mailto:' + encodeURIComponent(m.email) + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      m.read = true; m.status = 'replied'; m.reply = '(Respondida por correo)'; m.repliedAt = new Date().toISOString();
      setMsgs(msgs); renderConsultas();
    } else if (act === 'resolve') {
      const next = resolutionOf(m) === 'resolved' ? 'open' : 'resolved';
      m.resolution = next; m.resolvedAt = next === 'resolved' ? new Date().toISOString() : '';
      if (next === 'resolved') m.read = true;
      setMsgs(msgs); renderConsultas();
      toast(next === 'resolved' ? 'Consulta resuelta' : 'Consulta reabierta', 'ok');
    } else if (act === 'del') {
      if (!await confirmDialog('Eliminar consulta', '¿Eliminar esta consulta de forma permanente?')) return;
      setMsgs(getMsgs().filter(x => x.id !== id)); renderConsultas(); toast('Consulta eliminada');
    }
  });
  // Filtros Abiertas / Resueltas / Todas
  $('#inboxResolution') && $('#inboxResolution').addEventListener('click', e => {
    const tab = e.target.closest('[data-resolution]'); if (!tab) return;
    $$('#inboxResolution [data-resolution]').forEach(t => t.classList.toggle('is-active', t === tab));
    inboxResolution = tab.dataset.resolution || '';
    renderConsultas();
  });
  $('#inboxRefresh') && $('#inboxRefresh').addEventListener('click', () => { renderConsultas(); toast('Bandeja actualizada', 'ok'); });
  $('#msgDemo').addEventListener('click', () => {
    const msgs = getMsgs();
    msgs.push(msgNorm({ id: uid(), name: 'Importador Demo', email: 'compras@ejemplo.com', company: 'Mariscos Europa', country: 'España', topic: 'Cotización', message: 'Buenos días, nos interesa el langostino HOSO L1 para exportación a Europa. ¿Podrían enviarnos lista de precios y disponibilidad?', date: new Date().toISOString(), source: 'contacto', read: false }));
    setMsgs(msgs); renderConsultas(); toast('Consulta de ejemplo añadida');
  });

  // ============ SUSCRIPTORES ============
  // Filtros activos (espejo cliente del backend de Aisa)
  let subsFilters = { interest: '', country: '', q: '' };
  let subsSort = 'recent';      // recent | old | name | country
  let subsStats = null;
  const subModal = $('#subModal');
  const SUB_TAG_MAX_LEN = 50, SUB_TAG_MAX_COUNT = 20;
  // Normaliza al esquema completo (compatible con altas antiguas {id,email,name,date,source}
  // y con el esquema de Aisa {createdAt,updatedAt}). `date` y `createdAt` quedan sincronizados.
  function subNorm(s) {
    s = s || {};
    const createdAt = s.createdAt || s.date || '';
    return Object.assign({}, s, {
      id: s.id, email: s.email || '', name: s.name || '', country: s.country || '',
      interests: Array.isArray(s.interests) ? s.interests : [], outlet: s.outlet || '',
      web: s.web || '', phone: s.phone || '', tags: Array.isArray(s.tags) ? s.tags : [],
      notes: s.notes || '', date: createdAt, createdAt, updatedAt: s.updatedAt || '',
      source: s.source || 'web',
    });
  }
  function calcSubsStats(all) {
    const byCountry = {}, byInterest = {}, byOutlet = {};
    all.forEach(s => {
      if (s.country) byCountry[s.country] = (byCountry[s.country] || 0) + 1;
      (s.interests || []).forEach(i => { if (i) byInterest[i] = (byInterest[i] || 0) + 1; });
      if (s.outlet) byOutlet[s.outlet] = (byOutlet[s.outlet] || 0) + 1;
    });
    const facet = (o) => Object.entries(o).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
    return { total: all.length, byCountry: facet(byCountry), byInterest: facet(byInterest), byOutlet: facet(byOutlet) };
  }
  function subsHasFilter() { return !!(subsFilters.interest || subsFilters.country || subsFilters.q); }
  // Segmento implícito derivado del filtro activo (para badge + columna CSV + boletines futuros).
  function getActiveSegment() {
    if (subsFilters.country) return { kind: 'País', value: countryLabel(subsFilters.country) };
    if (subsFilters.interest) return { kind: 'Interés', value: subsFilters.interest };
    if (subsFilters.q) return { kind: 'Búsqueda', value: subsFilters.q };
    return null;
  }
  function subsFacetList(label, arr, ico) {
    arr = arr || []; if (!arr.length) return '';
    const items = arr.slice(0, 8).map(f => `<li><span class="subs-facet__v">${esc(f.value || '—')}</span><span class="subs-facet__n">${f.count}</span></li>`).join('');
    const head = `<span class="ar" data-ico="${esc(ico || 'tag')}"></span>${esc(label)}`;
    return `<div class="subs-facet"><h4 class="subs-facet__h">${head}</h4><ul>${items}</ul></div>`;
  }
  function renderSubsStats() {
    const box = $('#subsStats'); if (!box) return;
    if (!subsStats || !subsStats.total) { box.hidden = true; box.innerHTML = ''; return; }
    box.hidden = false;
    box.innerHTML =
      `<div class="subs-stats__total"><span class="subs-stats__num">${subsStats.total}</span><span class="subs-stats__lbl">Suscriptores</span></div>` +
      `<div class="subs-stats__facets">${subsFacetList('Países', subsStats.byCountry, 'map-pin')}${subsFacetList('Intereses', subsStats.byInterest, 'tag')}${subsFacetList('Medios', subsStats.byOutlet, 'building-2')}</div>`;
    hydrate();
  }
  function renderSubsSegment() {
    const box = $('#subsSegment'); if (!box) return;
    const seg = getActiveSegment();
    if (!seg) { box.hidden = true; box.innerHTML = ''; return; }
    box.hidden = false;
    box.innerHTML = `<span class="ar" data-ico="filter"></span>Segmento: ${esc(seg.kind)} · ${esc(seg.value)}`;
    hydrate();
  }
  function renderSubsFilters() {
    const box = $('#subsFilters'), tb = $('#subsToolbar'); if (!box) return;
    const st = subsStats;
    if (!st || !st.total) { if (tb) tb.hidden = true; box.innerHTML = ''; return; }
    if (tb) tb.hidden = false;
    const chip = (kind, value, count) => {
      const active = subsFilters[kind] === value;
      return `<button type="button" class="chip${active ? ' is-active' : ''}" data-fkind="${esc(kind)}" data-fval="${esc(value)}">${esc(value || '—')}${count != null ? ' · ' + count : ''}</button>`;
    };
    const groups = [];
    if ((st.byCountry || []).length) groups.push(`<div class="subs-filter-group"><span class="subs-filter-group__lbl"><span class="ar" data-ico="map-pin"></span>Países</span><div class="chip-row">${st.byCountry.map(f => chip('country', f.value, f.count)).join('')}</div></div>`);
    if ((st.byInterest || []).length) groups.push(`<div class="subs-filter-group"><span class="subs-filter-group__lbl"><span class="ar" data-ico="tag"></span>Intereses</span><div class="chip-row">${st.byInterest.map(f => chip('interest', f.value, f.count)).join('')}</div></div>`);
    const clear = subsHasFilter() ? '<button type="button" class="btn btn--ghost btn--sm subs-clear" id="subsClear"><span class="ar" data-ico="x"></span> Limpiar filtros</button>' : '';
    box.innerHTML = groups.join('') + clear;
    box.querySelectorAll('.chip[data-fkind]').forEach(c => c.addEventListener('click', () => {
      const kind = c.dataset.fkind, val = c.dataset.fval;
      subsFilters[kind] = (subsFilters[kind] === val) ? '' : val;
      renderSuscriptores();
    }));
    const cb = $('#subsClear');
    if (cb) cb.addEventListener('click', () => {
      subsFilters = { interest: '', country: '', q: '' };
      const sb = $('#subsSearch'); if (sb) sb.value = '';
      renderSuscriptores();
    });
    hydrate();
  }
  function subHTML(s) {
    const interests = (s.interests || []).map(i => `<span class="tag">${esc(i)}</span>`).join('');
    const tags = (s.tags || []).map(t => `<span class="chip chip--tag" data-tag="${esc(t)}">${esc(t)}<button type="button" class="chip__x" data-act="untag" data-tag="${esc(t)}" aria-label="Quitar etiqueta"><span class="ar" data-ico="x"></span></button></span>`).join('');
    const rows = [];
    if (s.outlet) rows.push(`<span class="sub__meta"><b>Medio:</b> ${esc(s.outlet)}</span>`);
    if (s.web) rows.push(`<span class="sub__meta"><b>Web:</b> <a href="${esc(s.web)}" target="_blank" rel="noopener">${esc(s.web)}</a></span>`);
    if (s.country) rows.push(`<span class="sub__meta"><b>País:</b> ${esc(s.country)}</span>`);
    if (s.phone) rows.push(`<span class="sub__meta"><b>Tel:</b> ${esc(s.phone)}</span>`);
    rows.push(`<span class="sub__meta"><b>Origen:</b> ${esc(s.source || 'web')}</span>`);
    const created = s.createdAt || s.date;
    const dateBits = [];
    if (created) dateBits.push(`<span class="sub__date-bit"><span class="ar" data-ico="clock"></span>Alta ${esc(fmtTime(created))}</span>`);
    if (s.updatedAt) dateBits.push(`<span class="sub__date-bit"><span class="ar" data-ico="refresh-cw"></span>Act. ${esc(fmtTime(s.updatedAt))}</span>`);
    return `
      <article class="msg sub" data-id="${esc(s.id)}">
        <div class="msg__main">
          <div class="msg__top">
            <span class="msg__from">${esc(s.name || 'Anónimo')}</span>
            ${s.email ? `<a class="msg__email" href="mailto:${esc(s.email)}">${esc(s.email)}</a>` : ''}
            <span class="msg__date sub__dates">${dateBits.join('')}</span>
          </div>
          ${rows.length ? `<div class="sub__rows">${rows.join('')}</div>` : ''}
          ${interests ? `<div class="sub__tags">${interests}</div>` : ''}
          <div class="sub__crm">
            <div class="sub__crm-tags" data-tags>${tags || '<span class="sub__crm-empty">Sin etiquetas</span>'}</div>
            <div class="sub__crm-add">
              <input type="text" class="field__input sub__tag-input" data-tag-input placeholder="Añadir etiqueta…" autocomplete="off">
              <button type="button" class="btn btn--ghost btn--sm" data-act="addtag"><span class="ar" data-ico="plus"></span> Etiqueta</button>
            </div>
            <textarea class="field__input field__area sub__notes" data-notes placeholder="Notas internas sobre este suscriptor…">${esc(s.notes || '')}</textarea>
          </div>
          <div class="msg__actions">
            <button class="btn btn--ghost btn--sm" data-act="edit"><span class="ar" data-ico="pencil"></span> Editar</button>
            <button class="btn btn--ghost btn--sm" data-act="savecrm"><span class="ar" data-ico="check"></span> Guardar</button>
            <button class="btn btn--danger btn--sm" data-act="del" style="margin-left:auto"><span class="ar" data-ico="trash-2"></span> Eliminar</button>
          </div>
        </div>
      </article>`;
  }
  function bindSubscribers() {
    $$('#subsList .sub').forEach(node => {
      const id = node.dataset.id;
      const rec = getSubs().map(subNorm).find(x => String(x.id) === String(id)) || {};
      let tags = (rec.tags || []).slice();
      const tagsBox = node.querySelector('[data-tags]');
      const tagInput = node.querySelector('[data-tag-input]');
      const notesEl = node.querySelector('[data-notes]');
      function paintTags() {
        if (!tags.length) { tagsBox.innerHTML = '<span class="sub__crm-empty">Sin etiquetas</span>'; }
        else { tagsBox.innerHTML = tags.map(t => `<span class="chip chip--tag" data-tag="${esc(t)}">${esc(t)}<button type="button" class="chip__x" data-act="untag" data-tag="${esc(t)}" aria-label="Quitar etiqueta"><span class="ar" data-ico="x"></span></button></span>`).join(''); }
        hydrate(); bindUntag();
      }
      function bindUntag() {
        tagsBox.querySelectorAll('[data-act="untag"]').forEach(b => b.addEventListener('click', () => { tags = tags.filter(t => t !== b.dataset.tag); paintTags(); }));
      }
      function addTag() {
        let v = (tagInput.value || '').trim().slice(0, SUB_TAG_MAX_LEN);
        if (!v) return;
        if (tags.length >= SUB_TAG_MAX_COUNT) { toast(`Máximo ${SUB_TAG_MAX_COUNT} etiquetas por suscriptor`, 'info'); return; }
        if (tags.some(t => t.toLowerCase() === v.toLowerCase())) { tagInput.value = ''; return; }
        tags.push(v);
        tagInput.value = ''; paintTags(); tagInput.focus();
      }
      bindUntag();
      node.querySelector('[data-act="addtag"]').addEventListener('click', addTag);
      tagInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } });
      node.querySelector('[data-act="savecrm"]').addEventListener('click', (e) => {
        const btn = e.currentTarget; btn.classList.add('is-busy');
        const subs = getSubs(); const idx = subs.findIndex(x => String(x.id) === String(id));
        if (idx >= 0) {
          subs[idx].tags = tags.slice(); subs[idx].notes = notesEl.value;
          subs[idx].updatedAt = new Date().toISOString();
          setSubs(subs);
          logAudit('apps', rec.email || rec.name || id, 'CRM', 'Etiquetas/notas actualizadas');
          toast('Suscriptor actualizado', 'ok');
        }
        // Re-render para reflejar la nueva fecha de actualización en la tarjeta.
        setTimeout(() => { btn.classList.remove('is-busy'); renderSuscriptores(); }, 120);
      });
      node.querySelector('[data-act="edit"]').addEventListener('click', () => openSub(id));
      node.querySelector('[data-act="del"]').addEventListener('click', async () => {
        if (!await confirmDialog('Eliminar suscriptor', '¿Eliminar este contacto de la base de datos?')) return;
        setSubs(getSubs().filter(x => String(x.id) !== String(id))); renderSuscriptores(); toast('Suscriptor eliminado');
      });
    });
  }
  // Ordena la lista según subsSort (recent | old | name | country).
  function subsApplySort(arr) {
    const byDate = (a, b) => (b.createdAt || b.date || '').localeCompare(a.createdAt || a.date || '');
    if (subsSort === 'old') return arr.sort((a, b) => -byDate(a, b));
    if (subsSort === 'name') return arr.sort((a, b) => String(a.name || a.email || '').localeCompare(String(b.name || b.email || ''), 'es') || byDate(a, b));
    if (subsSort === 'country') return arr.sort((a, b) => String(countryLabel(a.country)).localeCompare(String(countryLabel(b.country)), 'es') || byDate(a, b));
    return arr.sort(byDate); // recent
  }
  function renderSuscriptores() {
    const all = subsApplySort(getSubs().map(subNorm));
    subsStats = calcSubsStats(all);
    $('#subsCount').textContent = all.length;
    const sortSel = $('#subsSort'); if (sortSel && sortSel.value !== subsSort) sortSel.value = subsSort;
    let filtered = all.slice();
    if (subsFilters.country) filtered = filtered.filter(s => s.country === subsFilters.country);
    if (subsFilters.interest) filtered = filtered.filter(s => (s.interests || []).includes(subsFilters.interest));
    if (subsFilters.q) {
      const q = subsFilters.q.trim().toLowerCase();
      // Full-text: nombre, correo, medio, país, teléfono, web e intereses.
      filtered = filtered.filter(s => [s.name, s.email, s.outlet, countryLabel(s.country), s.country, s.phone, s.web, (s.interests || []).join(' ')].filter(Boolean).some(t => String(t).toLowerCase().includes(q)));
    }
    renderSubsStats(); renderSubsFilters(); renderSubsSegment();
    const box = $('#subsList');
    if (!filtered.length) {
      box.innerHTML = `<div class="news-empty"><span data-ico="at-sign" data-ico-size="42"></span><p>${subsHasFilter() && all.length ? 'Sin resultados para este filtro.' : 'No hay suscriptores todavía.<br>Se añaden desde el formulario de la web o manualmente.'}</p></div>`;
    } else {
      box.innerHTML = filtered.map(subHTML).join('');
      bindSubscribers();
    }
    refreshBadges(); hydrate();
  }
  // Combina dos suscriptores SIN perder datos: rellena campos vacíos del existente
  // con los del nuevo y une intereses/etiquetas; conserva createdAt, refresca updatedAt.
  function mergeSubInto(dst, rec) {
    ['name', 'country', 'outlet', 'web', 'phone', 'source'].forEach(k => { if (rec[k] && !dst[k]) dst[k] = rec[k]; });
    if (rec.notes) dst.notes = dst.notes ? (dst.notes + '\n' + rec.notes) : rec.notes;
    dst.interests = Array.from(new Set([...(dst.interests || []), ...(rec.interests || [])].filter(Boolean)));
    dst.tags = Array.from(new Set([...(dst.tags || []), ...(rec.tags || [])].filter(Boolean)));
    dst.updatedAt = new Date().toISOString();
    return dst;
  }
  // Localiza un duplicado por correo (excluye el propio registro en edición).
  function findSubByEmail(email, exceptId) {
    const e = String(email || '').trim().toLowerCase(); if (!e) return -1;
    return getSubs().findIndex(s => String(s.email || '').trim().toLowerCase() === e && (!exceptId || String(s.id) !== String(exceptId)));
  }
  // Alta/edición sin duplicar por correo. Devuelve true si era nuevo.
  // opts.merge=true combina con el duplicado en vez de rechazar.
  function upsertSub(rec, opts) {
    opts = opts || {};
    const subs = getSubs();
    const now = new Date().toISOString();
    const editIdx = rec.id ? subs.findIndex(s => String(s.id) === String(rec.id)) : -1;
    if (editIdx >= 0) { subs[editIdx] = Object.assign({}, subs[editIdx], rec, { updatedAt: now }); setSubs(subs); return false; }
    const i = findSubByEmail(rec.email, rec.id);
    if (i >= 0) {
      if (opts.merge) { mergeSubInto(subs[i], rec); setSubs(subs); }
      return false;
    }
    subs.push(Object.assign({ id: uid(), createdAt: now, date: now, updatedAt: '', interests: [], tags: [], notes: '' }, rec, { email: String(rec.email || '').trim() }));
    setSubs(subs); return true;
  }
  function openSub(id) {
    const s = id ? getSubs().map(subNorm).find(x => String(x.id) === String(id)) : null;
    $('#subModalTitle').textContent = s ? 'Editar suscriptor' : 'Nuevo suscriptor';
    $('#sfId').value = s ? s.id : '';
    $('#sfEmail').value = s ? s.email : '';
    $('#sfName').value = s ? s.name : '';
    $('#sfCountry').value = s ? s.country : '';
    $('#sfOutlet').value = s ? s.outlet : '';
    $('#sfPhone').value = s ? s.phone : '';
    $('#sfWeb').value = s ? s.web : '';
    $('#sfInterests').value = s ? (s.interests || []).join(', ') : '';
    $('#sfSource').value = s ? (s.source || 'manual') : 'manual';
    subModal.classList.add('open'); subModal.setAttribute('aria-hidden', 'false'); hydrate();
    setTimeout(() => $('#sfEmail').focus(), 60);
  }
  $('#subSave') && $('#subSave').addEventListener('click', async () => {
    const email = $('#sfEmail').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('Correo no válido', 'err'); $('#sfEmail').focus(); return; }
    const id = $('#sfId').value;
    const interests = $('#sfInterests').value.split(',').map(x => x.trim()).filter(Boolean);
    const data = {
      id: id || undefined, email, name: $('#sfName').value.trim(), country: $('#sfCountry').value.trim(),
      outlet: $('#sfOutlet').value.trim(), phone: $('#sfPhone').value.trim(), web: $('#sfWeb').value.trim(),
      interests, source: $('#sfSource').value || 'manual',
    };
    // Dedup: si es alta nueva y el correo ya existe, ofrecer combinar (merge) o cancelar.
    if (!id && findSubByEmail(email) >= 0) {
      const dup = getSubs().map(subNorm)[findSubByEmail(email)];
      const ok = await confirmDialog('Correo ya registrado', `Ya existe un suscriptor con «${email}»${dup && dup.name ? ' (' + dup.name + ')' : ''}. ¿Combinar los datos nuevos con el contacto existente sin perder información?`);
      if (!ok) { $('#sfEmail').focus(); return; }
      upsertSub(data, { merge: true });
      closeModal(subModal); renderSuscriptores(); toast('Contacto combinado', 'ok'); return;
    }
    const wasNew = upsertSub(data);
    closeModal(subModal); renderSuscriptores(); toast(id ? 'Suscriptor actualizado' : (wasNew ? 'Suscriptor añadido' : 'Contacto actualizado'), 'ok');
  });
  $('#subsSearch') && $('#subsSearch').addEventListener('input', debounce(function () { subsFilters.q = this.value || ''; renderSuscriptores(); }, 220));
  $('#subsSort') && $('#subsSort').addEventListener('change', e => { subsSort = e.target.value || 'recent'; renderSuscriptores(); });
  $('#subsRefresh') && $('#subsRefresh').addEventListener('click', () => { renderSuscriptores(); toast('Base actualizada', 'ok'); });
  $('#subsAdd') && $('#subsAdd').addEventListener('click', () => openSub(null));
  $('#subsDemo') && $('#subsDemo').addEventListener('click', () => {
    const samples = [
      { email: 'redaccion@lanacion.com.ar', name: 'Redacción La Nación', country: 'AR', outlet: 'La Nación', source: 'prensa', interests: ['Prensa'] },
      { email: 'compras@mariscoseuropa.es', name: 'Mariscos Europa', country: 'ES', outlet: 'Mariscos Europa', source: 'boletín', interests: ['Comercial', 'Boletín'] },
      { email: 'ana.perez@gmail.com', name: 'Ana Pérez', country: 'AR', source: 'web', interests: ['Boletín'] },
    ];
    const pick = samples[Math.floor(Math.random() * samples.length)];
    const wasNew = upsertSub(pick, { merge: true });
    renderSuscriptores(); toast(wasNew ? 'Alta simulada añadida' : 'Ese contacto ya existía', wasNew ? 'ok' : 'info');
  });
  $('#subsExport') && $('#subsExport').addEventListener('click', () => {
    // Exporta la base completa, o solo el segmento filtrado (si hay filtro/búsqueda activos).
    let subs = getSubs().map(subNorm);
    if (!subs.length) { toast('No hay suscriptores que exportar', 'err'); return; }
    const seg = getActiveSegment();
    const segLabel = seg ? (seg.kind + ': ' + seg.value) : '';
    if (subsFilters.country) subs = subs.filter(s => s.country === subsFilters.country);
    if (subsFilters.interest) subs = subs.filter(s => (s.interests || []).includes(subsFilters.interest));
    if (subsFilters.q) {
      const q = subsFilters.q.trim().toLowerCase();
      subs = subs.filter(s => [s.name, s.email, s.outlet, countryLabel(s.country), s.country, s.phone, s.web, (s.interests || []).join(' ')].filter(Boolean).some(t => String(t).toLowerCase().includes(q)));
    }
    if (!subs.length) { toast('El filtro actual no tiene suscriptores', 'err'); return; }
    subs = subsApplySort(subs);
    const head = ['Nombre', 'Correo', 'Medio', 'Web', 'País', 'Teléfono', 'Intereses', 'Etiquetas', 'Notas', 'Origen', 'Segmento', 'Creado', 'Actualizado'];
    const escCsv = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const rows = subs.map(s => [
      s.name, s.email, s.outlet, s.web, s.country, s.phone,
      (s.interests || []).join(' · '), (s.tags || []).join(' · '), s.notes, s.source,
      segLabel, (s.createdAt || s.date || ''), (s.updatedAt || ''),
    ].map(escCsv).join(','));
    const csv = head.map(escCsv).join(',') + '\r\n' + rows.join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'cabo-virgenes-suscriptores-' + (seg ? 'segmento-' : '') + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(a.href);
    toast(seg ? `CSV del segmento exportado (${subs.length})` : 'CSV exportado', 'ok');
  });

  // ============ EMPLEO ============
  let empTab = 'ofertas';
  let appFilterJob = '';
  let appFilterStatus = '';   // '', new, reviewing, shortlist, rejected, hired
  let appFilterStarred = false;
  // Etiquetas de estado/prioridad (claves ↔ español).
  const APP_STATUS = { new: 'Nueva', reviewing: 'En revisión', shortlist: 'Preseleccionada', rejected: 'Descartada', hired: 'Contratada' };
  const APP_STATUS_ORDER = ['new', 'reviewing', 'shortlist', 'rejected', 'hired'];
  const JOB_PRIORITY = { alta: 'Alta', media: 'Media', baja: 'Baja' };

  // Tira de KPIs de Empleo (ofertas publicadas/total, candidaturas, nuevas).
  function renderEmpKpis() {
    const wrap = $('#empKpis'); if (!wrap) return;
    const jobs = getJobs(), apps = getApps();
    const offTotal = jobs.length;
    const offPub = jobs.filter(j => (j.status || 'open') === 'open').length;
    const appTotal = apps.length;
    const appNew = apps.filter(a => !a.read).length;
    const cards = [
      ['briefcase', offPub + ' / ' + offTotal, 'Vacantes publicadas'],
      ['users', String(appTotal), 'Candidaturas'],
      ['sparkles', String(appNew), 'Nuevas'],
    ];
    wrap.innerHTML = cards.map(([ic, n, l]) =>
      `<div class="kpi"><span class="kpi__ic" data-ico="${ic}"></span><div class="kpi__n">${esc(n)}</div><div class="kpi__l">${esc(l)}</div></div>`
    ).join('');
    hydrate();
  }

  function renderEmpleo() {
    const s = getSettings();
    $('#jobsEnabled').checked = !!s.jobsEnabled;
    renderEmpKpis();
    showEmpTab(empTab);
    refreshBadges();
    hydrate();
  }
  function showEmpTab(tab) {
    empTab = tab;
    $$('#empTabs [data-etab]').forEach(b => b.classList.toggle('is-active', b.dataset.etab === tab));
    const o = $('#epanel-ofertas'), c = $('#epanel-candidaturas');
    if (o) o.hidden = tab !== 'ofertas';
    if (c) c.hidden = tab !== 'candidaturas';
    if (tab === 'ofertas') renderJobs();
    else renderApps();
    hydrate();
  }
  $('#empTabs') && $('#empTabs').addEventListener('click', e => {
    const b = e.target.closest('[data-etab]'); if (!b) return; showEmpTab(b.dataset.etab);
  });
  $('#jobsEnabled') && $('#jobsEnabled').addEventListener('change', e => {
    const s = getSettings(); const prev = s.jobsEnabled; s.jobsEnabled = e.target.checked; setSettings(s);
    if (prev !== e.target.checked) logAudit('settings', 'jobsEnabled', prev ? 'Visible' : 'Oculta', e.target.checked ? 'Visible' : 'Oculta');
    toast(e.target.checked ? 'Sección de Empleo activada en la web' : 'Sección de Empleo oculta', 'ok');
  });

  const JOB_TYPES = { 'full-time': 'Jornada completa', 'part-time': 'Media jornada', 'temporada': 'Temporada', 'prácticas': 'Prácticas' };
  function renderJobs() {
    const jobs = getJobs(), grid = $('#jobGrid');
    if (!jobs.length) {
      grid.innerHTML = `<div class="news-empty"><span data-ico="briefcase" data-ico-size="42"></span><p>No hay ofertas todavía.<br>Crea la primera vacante.</p></div>`;
    } else {
      const appsByJob = {};
      getApps().forEach(a => { const k = String(a.jobId || ''); if (k) appsByJob[k] = (appsByJob[k] || 0) + 1; });
      grid.innerHTML = jobs.map(j => {
        const prio = JOB_PRIORITY[j.priority] ? j.priority : 'media';
        const reqs = Array.isArray(j.requirements) ? j.requirements.filter(Boolean) : [];
        const tags = Array.isArray(j.tags) ? j.tags.filter(Boolean) : [];
        const nApps = appsByJob[String(j.id)] || 0;
        return `
        <article class="job-card ${j.status}" data-id="${j.id}">
          <div class="job-card__head">
            <span class="job-prio job-prio--${prio}" title="Prioridad: ${esc(JOB_PRIORITY[prio])}" aria-label="Prioridad ${esc(JOB_PRIORITY[prio])}"></span>
            <span class="job-card__status ${j.status}">${j.status === 'open' ? 'Abierta' : 'Cerrada'}</span>
            ${j.type ? `<span class="job-card__type">${esc(JOB_TYPES[j.type] || j.type)}</span>` : ''}
          </div>
          <h3 class="job-card__title">${esc(j.title)}</h3>
          <div class="job-card__meta">
            ${j.area ? `<span><span data-ico="tag" data-ico-size="14"></span> ${esc(j.area)}</span>` : ''}
            ${j.location ? `<span><span data-ico="home" data-ico-size="14"></span> ${esc(j.location)}</span>` : ''}
          </div>
          <p class="job-card__summary">${esc(j.summary || '')}</p>
          ${reqs.length ? `<ul class="job-card__reqs">${reqs.slice(0, 5).map(r => `<li>${esc(r)}</li>`).join('')}${reqs.length > 5 ? `<li class="job-card__reqs-more">+${reqs.length - 5} más…</li>` : ''}</ul>` : ''}
          ${tags.length ? `<div class="job-card__tags">${tags.map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div>` : ''}
          <div class="job-card__foot">
            ${nApps ? `<span class="job-card__apps" title="Candidaturas recibidas"><span data-ico="users" data-ico-size="12"></span> ${nApps}</span>` : ''}
            <button class="icon-btn" data-job-edit="${j.id}" title="Editar"><span data-ico="pencil"></span></button>
            <button class="icon-btn" data-job-toggle="${j.id}" title="${j.status === 'open' ? 'Cerrar oferta' : 'Reabrir oferta'}"><span data-ico="${j.status === 'open' ? 'eye-off' : 'eye'}"></span></button>
            <button class="icon-btn danger" data-job-del="${j.id}" title="Eliminar" style="margin-left:auto"><span data-ico="trash-2"></span></button>
          </div>
        </article>`;
      }).join('');
    }
    hydrate();
  }
  function openJob(id) {
    const j = id ? getJobs().find(x => x.id === id) : null;
    $('#jobModalTitle').textContent = j ? 'Editar oferta' : 'Nueva oferta';
    $('#jbId').value = j ? j.id : '';
    $('#jbTitle').value = j ? j.title : '';
    $('#jbArea').value = j ? (j.area || '') : '';
    $('#jbLocation').value = j ? (j.location || '') : '';
    $('#jbType').value = j ? (j.type || 'full-time') : 'full-time';
    $('#jbStatus').value = j ? (j.status || 'open') : 'open';
    $('#jbPriority').value = (j && JOB_PRIORITY[j.priority]) ? j.priority : 'media';
    $('#jbTags').value = j && Array.isArray(j.tags) ? j.tags.join(', ') : '';
    $('#jbRequirements').value = j && Array.isArray(j.requirements) ? j.requirements.join('\n') : '';
    $('#jbSummary').value = j ? (j.summary || '') : '';
    $('#jbBody').value = j ? (j.body || '') : '';
    const m = $('#jobModal'); m.classList.add('open'); m.setAttribute('aria-hidden', 'false'); hydrate();
  }
  $('#jobNew') && $('#jobNew').addEventListener('click', () => openJob(null));
  $('#jobSave') && $('#jobSave').addEventListener('click', () => {
    const title = $('#jbTitle').value.trim();
    if (!title) { toast('Pon el título del puesto', 'err'); return; }
    const jobs = getJobs(); const id = $('#jbId').value;
    const data = {
      title, area: $('#jbArea').value.trim(), location: $('#jbLocation').value.trim(),
      type: $('#jbType').value, status: $('#jbStatus').value,
      priority: JOB_PRIORITY[$('#jbPriority').value] ? $('#jbPriority').value : 'media',
      tags: $('#jbTags').value.split(',').map(s => s.trim()).filter(Boolean),
      requirements: $('#jbRequirements').value.split('\n').map(s => s.trim()).filter(Boolean),
      summary: $('#jbSummary').value.trim(), body: $('#jbBody').value.trim(),
    };
    if (id) {
      const i = jobs.findIndex(x => x.id === id);
      if (i >= 0) { logAudit('jobs', title, jobs[i].title || '∅', 'Editada'); jobs[i] = Object.assign(jobs[i], data); }
    } else {
      data.id = uid(); data.date = new Date().toISOString(); jobs.push(data);
      logAudit('jobs', title, '∅', 'Creada');
    }
    setJobs(jobs); closeModal($('#jobModal')); renderEmpKpis(); renderJobs(); toast('Oferta guardada', 'ok');
  });
  $('#jobGrid') && $('#jobGrid').addEventListener('click', async e => {
    const ed = e.target.closest('[data-job-edit]'); if (ed) return openJob(ed.dataset.jobEdit);
    const tg = e.target.closest('[data-job-toggle]');
    if (tg) {
      const jobs = getJobs(); const j = jobs.find(x => x.id === tg.dataset.jobToggle);
      if (j) { const was = j.status; j.status = j.status === 'open' ? 'closed' : 'open'; setJobs(jobs); logAudit('jobs', j.title, was === 'open' ? 'Abierta' : 'Cerrada', j.status === 'open' ? 'Abierta' : 'Cerrada'); renderEmpKpis(); renderJobs(); toast(j.status === 'open' ? 'Oferta reabierta' : 'Oferta cerrada'); }
      return;
    }
    const dl = e.target.closest('[data-job-del]');
    if (dl) {
      if (!await confirmDialog('Eliminar oferta', '¿Eliminar esta oferta de empleo?')) return;
      const j = getJobs().find(x => x.id === dl.dataset.jobDel);
      setJobs(getJobs().filter(x => x.id !== dl.dataset.jobDel));
      if (j) logAudit('jobs', j.title, 'Existía', 'Eliminada');
      renderEmpKpis(); renderJobs(); toast('Oferta eliminada');
    }
  });

  // ---- Candidaturas ----
  function jobTitleById(id) { const j = getJobs().find(x => x.id === id); return j ? j.title : 'Oferta eliminada'; }
  function populateAppFilter() {
    const sel = $('#appFilter'); if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = '<option value="">Todas las ofertas</option>' + getJobs().map(j => `<option value="${esc(j.id)}">${esc(j.title)}</option>`).join('');
    sel.value = cur;
  }
  // Estado normalizado de una candidatura (compat: sin status = 'new').
  function appStatusOf(a) { return APP_STATUS[a && a.status] ? a.status : 'new'; }
  // Aplica filtros (oferta/estado/destacadas) y ordena: destacadas primero, luego por fecha.
  function filteredApps() {
    let list = getApps().slice();
    if (appFilterJob) list = list.filter(a => String(a.jobId || '') === String(appFilterJob));
    if (appFilterStatus) list = list.filter(a => appStatusOf(a) === appFilterStatus);
    if (appFilterStarred) list = list.filter(a => !!a.starred);
    list.sort((a, b) => {
      if (!!b.starred !== !!a.starred) return b.starred ? 1 : -1;
      return (b.date || '').localeCompare(a.date || '');
    });
    return list;
  }
  // Persiste un cambio puntual en una candidatura (estado/destacar) + auditoría.
  function appUpdate(id, patch, auditLabel) {
    const apps = getApps(); const i = apps.findIndex(x => x.id === id); if (i < 0) return null;
    const before = auditLabel ? auditLabel.before(apps[i]) : null;
    apps[i] = Object.assign({}, apps[i], patch);
    setApps(apps);
    if (auditLabel) logAudit('apps', apps[i].name || apps[i].email || id, before, auditLabel.after(apps[i]));
    return apps[i];
  }
  function renderApps() {
    populateAppFilter();
    const apps = filteredApps();
    $('#appCount').textContent = apps.length;
    const ac = $('#appsCount');
    const newCount = getApps().filter(a => !a.read).length;
    if (ac) { ac.hidden = newCount === 0; ac.textContent = newCount; }
    const sf = $('#appStatusFilter'); if (sf && sf.value !== appFilterStatus) sf.value = appFilterStatus;
    const stf = $('#appStarFilter'); if (stf) { stf.classList.toggle('is-active', appFilterStarred); stf.setAttribute('aria-pressed', appFilterStarred ? 'true' : 'false'); }
    const box = $('#appList');
    if (!getApps().length) {
      box.innerHTML = `<div class="news-empty"><span data-ico="inbox" data-ico-size="42"></span><p>No hay candidaturas todavía.</p></div>`;
    } else if (!apps.length) {
      box.innerHTML = `<div class="news-empty"><span data-ico="filter" data-ico-size="42"></span><p>Ninguna candidatura coincide con el filtro.</p></div>`;
    } else {
      box.innerHTML = apps.map(a => {
        const st = appStatusOf(a);
        return `
        <div class="app-row ${a.read ? '' : 'is-unread'}${a.starred ? ' is-starred' : ''}" data-id="${a.id}">
          <button class="app-row__star${a.starred ? ' is-on' : ''}" data-app-star="${a.id}" title="${a.starred ? 'Quitar destacado' : 'Destacar'}" aria-pressed="${a.starred ? 'true' : 'false'}"><span data-ico="star" data-ico-size="15"></span></button>
          <div class="app-row__av">${esc((a.name || '?').charAt(0).toUpperCase())}</div>
          <div class="app-row__main">
            <div class="app-row__top">
              <span class="app-row__name">${esc(a.name || 'Candidato')}</span>
              <span class="app-row__job">${esc(jobTitleById(a.jobId))}</span>
              <span class="app-status app-status--${st}">${esc(APP_STATUS[st])}</span>
              <span class="app-row__date">${esc(a.date ? new Date(a.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : '')}</span>
            </div>
            <span class="app-row__email">${esc(a.email || '')}</span>
          </div>
          <button class="icon-btn app-row__open" data-app-open="${a.id}" title="Ver candidatura"><span data-ico="external-link"></span></button>
        </div>`;
      }).join('');
    }
    refreshBadges();
    hydrate();
  }
  $('#appFilter') && $('#appFilter').addEventListener('change', e => { appFilterJob = e.target.value; renderApps(); });
  $('#appStatusFilter') && $('#appStatusFilter').addEventListener('change', e => { appFilterStatus = e.target.value; renderApps(); });
  $('#appStarFilter') && $('#appStarFilter').addEventListener('click', () => { appFilterStarred = !appFilterStarred; renderApps(); });
  // Exportar candidaturas (filtradas) a CSV.
  $('#appExport') && $('#appExport').addEventListener('click', () => {
    const apps = filteredApps();
    if (!apps.length) { toast('No hay candidaturas que exportar', 'err'); return; }
    const head = ['Nombre', 'Email', 'Teléfono', 'Puesto', 'Estado', 'Destacada', 'Mensaje', 'Fecha'];
    const escCsv = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const rows = apps.map(a => [
      a.name, a.email, a.phone, jobTitleById(a.jobId),
      APP_STATUS[appStatusOf(a)], a.starred ? 'Sí' : 'No',
      a.message, a.date ? fmtTime(a.date) : '',
    ].map(escCsv).join(','));
    const csv = head.map(escCsv).join(',') + '\r\n' + rows.join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
    link.download = 'cabo-virgenes-candidaturas-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(link); link.click(); link.remove();
    toast('CSV exportado', 'ok');
  });
  let appCurrentId = '';
  function syncAppStarBtn(starred) {
    const b = $('#apStar'); if (!b) return;
    b.classList.toggle('is-on', !!starred);
    b.setAttribute('aria-pressed', starred ? 'true' : 'false');
    const t = $('#apStarTxt'); if (t) t.textContent = starred ? 'Destacada' : 'Destacar';
  }
  function openApplication(id) {
    const apps = getApps(); const a = apps.find(x => x.id === id); if (!a) return;
    appCurrentId = id;
    if (!a.read) { a.read = true; setApps(apps); }
    $('#apName').textContent = a.name || '—';
    $('#apEmail').textContent = a.email || '—';
    $('#apPhone').textContent = a.phone || '—';
    $('#apJob').textContent = jobTitleById(a.jobId);
    const dt = $('#apDate'); if (dt) dt.textContent = a.date ? fmtTime(a.date) : '—';
    $('#apMessage').textContent = a.message || '—';
    const sel = $('#apStatus'); if (sel) sel.value = appStatusOf(a);
    syncAppStarBtn(a.starred);
    const wrap = $('#apCvWrap'), cv = $('#apCv');
    // El público guarda cvData (base64) + cv (nombre de archivo).
    const cvData = a.cvData || (typeof a.cv === 'string' && a.cv.indexOf('data:') === 0 ? a.cv : '');
    const cvName = (a.cv && a.cv.indexOf('data:') !== 0) ? a.cv : 'cv-' + (a.name || 'candidato').replace(/\s+/g, '-').toLowerCase();
    if (cvData) {
      wrap.hidden = false;
      cv.innerHTML = `<button type="button" class="btn btn--ghost btn--sm" id="apCvDownload"><span class="ar" data-ico="download"></span> Descargar CV${a.cv ? ' (' + esc(a.cv) + ')' : ''}</button>`;
      const btn = $('#apCvDownload');
      btn && btn.addEventListener('click', () => downloadCv(cvData, cvName));
    } else if (a.cv) {
      // Compat: sólo nombre, sin datos (candidatura antigua).
      wrap.hidden = false;
      cv.innerHTML = `<span class="app-cv__name"><span class="ar" data-ico="file-text"></span> ${esc(a.cv)} <em>(sin archivo adjunto)</em></span>`;
    } else { wrap.hidden = true; cv.innerHTML = '—'; }
    $('#appDelete').dataset.id = id;
    const m = $('#applicationModal'); m.classList.add('open'); m.setAttribute('aria-hidden', 'false');
    renderApps(); renderEmpKpis(); hydrate();
  }
  // Descarga el CV (dataURL base64) como blob con el nombre original.
  function downloadCv(dataUrl, fname) {
    try {
      const link = document.createElement('a');
      link.href = dataUrl; link.download = fname || 'cv';
      document.body.appendChild(link); link.click(); link.remove();
      toast('Descargando CV…', 'ok');
    } catch (_) { toast('No se pudo descargar el CV', 'err'); }
  }
  // Cambio de estado dentro del modal (persistente + auditoría).
  $('#apStatus') && $('#apStatus').addEventListener('change', e => {
    if (!appCurrentId) return;
    appUpdate(appCurrentId, { status: e.target.value }, { before: a => APP_STATUS[appStatusOf(a)], after: a => APP_STATUS[appStatusOf(a)] });
    renderApps(); toast('Estado actualizado', 'ok');
  });
  // Destacar/quitar destacado desde el modal.
  $('#apStar') && $('#apStar').addEventListener('click', () => {
    if (!appCurrentId) return;
    const a = getApps().find(x => x.id === appCurrentId); if (!a) return;
    const next = !a.starred;
    appUpdate(appCurrentId, { starred: next }, { before: () => a.starred ? 'Destacada' : 'Normal', after: () => next ? 'Destacada' : 'Normal' });
    syncAppStarBtn(next); renderApps();
  });
  $('#appList') && $('#appList').addEventListener('click', e => {
    const star = e.target.closest('[data-app-star]');
    if (star) {
      e.stopPropagation();
      const id = star.dataset.appStar; const a = getApps().find(x => x.id === id); if (!a) return;
      const next = !a.starred;
      appUpdate(id, { starred: next }, { before: () => a.starred ? 'Destacada' : 'Normal', after: () => next ? 'Destacada' : 'Normal' });
      if (appCurrentId === id) syncAppStarBtn(next);
      renderApps(); return;
    }
    const op = e.target.closest('[data-app-open]'); if (op) return openApplication(op.dataset.appOpen);
    const row = e.target.closest('.app-row'); if (row) return openApplication(row.dataset.id);
  });
  $('#appDelete') && $('#appDelete').addEventListener('click', async e => {
    const id = e.currentTarget.dataset.id; if (!id) return;
    if (!await confirmDialog('Eliminar candidatura', '¿Eliminar esta candidatura definitivamente?')) return;
    const a = getApps().find(x => x.id === id);
    setApps(getApps().filter(x => x.id !== id));
    if (a) logAudit('apps', a.name || a.email || id, 'Existía', 'Eliminada');
    appCurrentId = ''; closeModal($('#applicationModal')); renderEmpKpis(); renderApps(); toast('Candidatura eliminada');
  });

  // ============ SEO / BUSCADOR ============
  let seoCfg = null;
  let seoProposals = null;
  // Estando dentro del panel, autoriza con la contraseña del propio login
  // (el servidor la acepta vía CABO_ADMIN_PASS). Sin claves extra para el equipo.
  const seoKey = () => (isAuthed() ? CRED.pass : '');
  async function seoApi(method, body) {
    const headers = { 'content-type': 'application/json' };
    const k = seoKey(); if (k) headers['x-cabo-admin-token'] = k;
    let res, data = {};
    try { res = await fetch('/api/seo', { method, headers, body: body ? JSON.stringify(body) : undefined }); }
    catch (e) { return { ok: false, status: 0, data: { message: 'Sin conexión con el servidor (¿estás en el sitio publicado?).' } }; }
    try { data = await res.json(); } catch {}
    return { ok: res.ok, status: res.status, data };
  }
  const seoEsc = (s) => esc(String(s == null ? '' : s));

  async function renderSeo() {
    $('#seoConnect').hidden = true; // auto-autorizado por el login
    if (!seoCfg) { const r = await seoApi('GET'); seoCfg = (r.data && r.data.config) || {}; }
    const c = seoCfg || {};
    $('#seoTitle').value = c.title || '';
    $('#seoDesc').value = c.description || '';
    $('#seoSite').value = c.siteName || 'Cabo Vírgenes';
    $('#seoPublished').checked = !!c.published;
    $('#seoFavPrev').src = c.favicon || '/favicon-32x32.png';
    $('#seoGFav').src = c.favicon || '/favicon-32x32.png';
    $('#seoOgPrev').src = c.ogImage || '/og-image.jpg';
    $('#seoStatus').textContent = c.updatedAt ? (c.published ? '✓ Publicado · ' : 'Guardado (sin publicar) · ') + new Date(c.updatedAt).toLocaleString() : '';
    seoUpdatePreview(); seoRenderFaq(); seoRenderProposals();
  }

  function seoUpdatePreview() {
    const t = $('#seoTitle').value.trim() || '—';
    const d = $('#seoDesc').value.trim() || '—';
    const site = $('#seoSite').value.trim() || 'Cabo Vírgenes';
    $('#seoGTitle').textContent = t;
    $('#seoGDesc').textContent = d.length > 160 ? d.slice(0, 158) + '…' : d;
    $('#seoGSite').textContent = site;
    $('#seoShareTitle').textContent = t;
    $('#seoShareDesc').textContent = d;
    const tl = $('#seoTitle').value.length, dl = $('#seoDesc').value.length;
    const tc = $('#seoTitleCount'), dc = $('#seoDescCount');
    tc.textContent = tl + '/60'; tc.className = 'seo-count ' + (tl > 60 ? 'over' : tl >= 15 ? 'ok' : '');
    dc.textContent = dl + '/155'; dc.className = 'seo-count ' + (dl > 155 ? 'over' : dl >= 70 ? 'ok' : '');
    const og = $('#seoOgPrev').src;
    $('#seoShareImg').style.backgroundImage = "url('" + og + "')";
  }

  function seoRenderProposals() {
    const box = $('#seoProposals'); if (!box) return;
    const p = seoProposals; if (!p) { box.innerHTML = '<p class="panel-sub">Pulsa “Generar propuestas” para que la IA proponga títulos, descripciones y preguntas frecuentes.</p>'; return; }
    const grp = (title, items, render) => items && items.length ? `<div class="seo-prop-group"><h4>${title}</h4>${items.map(render).join('')}</div>` : '';
    box.innerHTML =
      grp('Títulos', p.titles, (t, i) => `<div class="seo-prop"><div class="seo-prop__txt">${seoEsc(t)} <small>(${t.length})</small></div><div class="seo-prop__act"><button class="seo-pill-btn ok" data-seo-apply="title" data-i="${i}">Usar</button></div></div>`) +
      grp('Descripciones', p.descriptions, (t, i) => `<div class="seo-prop"><div class="seo-prop__txt">${seoEsc(t)} <small>(${t.length})</small></div><div class="seo-prop__act"><button class="seo-pill-btn ok" data-seo-apply="desc" data-i="${i}">Usar</button></div></div>`) +
      grp('Preguntas frecuentes', p.faq, (f, i) => `<div class="seo-prop"><div class="seo-prop__txt"><strong>${seoEsc(f.q)}</strong><br><span style="color:#5a6b7e">${seoEsc(f.a)}</span></div><div class="seo-prop__act"><button class="seo-pill-btn ok" data-seo-faq="${i}">Añadir</button></div></div>`);
    hydrate();
  }

  function seoRenderFaq() {
    const box = $('#seoFaqList'); if (!box) return;
    const faqs = (seoCfg && seoCfg.faq) || [];
    box.innerHTML = faqs.length ? faqs.map((f, i) => `<div class="seo-faq"><div class="seo-faq__body"><input class="seo-faq__q" data-faq-q="${i}" value="${seoEsc(f.q)}"><textarea class="seo-faq__a" data-faq-a="${i}">${seoEsc(f.a)}</textarea></div><button class="seo-faq__del" data-faq-del="${i}" title="Eliminar">×</button></div>`).join('') : '<p class="panel-sub">Sin preguntas todavía. Genera propuestas con IA o añade una manualmente.</p>';
  }

  function seoReadFile(file, maxKB, cb) {
    if (file.size > maxKB * 1024) { toast('Imagen demasiado grande (máx ' + maxKB + ' KB)', 'err'); return; }
    const r = new FileReader(); r.onload = () => cb(r.result); r.readAsDataURL(file);
  }

  ['seoTitle', 'seoDesc', 'seoSite'].forEach(id => { const el = $('#' + id); if (el) el.addEventListener('input', seoUpdatePreview); });
  $('#seoFavFile') && $('#seoFavFile').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; seoReadFile(f, 100, url => { seoCfg = seoCfg || {}; seoCfg.favicon = url; $('#seoFavPrev').src = url; $('#seoGFav').src = url; }); });
  $('#seoFavReset') && $('#seoFavReset').addEventListener('click', () => { seoCfg = seoCfg || {}; seoCfg.favicon = ''; $('#seoFavPrev').src = '/favicon-32x32.png'; $('#seoGFav').src = '/favicon-32x32.png'; });
  $('#seoOgFile') && $('#seoOgFile').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; seoReadFile(f, 250, url => { seoCfg = seoCfg || {}; seoCfg.ogImage = url; $('#seoOgPrev').src = url; seoUpdatePreview(); }); });
  $('#seoOgReset') && $('#seoOgReset').addEventListener('click', () => { seoCfg = seoCfg || {}; seoCfg.ogImage = '/og-image.jpg'; $('#seoOgPrev').src = '/og-image.jpg'; seoUpdatePreview(); });
  $('#seoGenBtn') && $('#seoGenBtn').addEventListener('click', async () => {
    if (!seoKey()) { $('#seoConnect').hidden = false; toast('Conecta primero (clave de publicación)', 'err'); return; }
    const btn = $('#seoGenBtn'); const old = btn.innerHTML; btn.disabled = true; btn.textContent = 'Generando…';
    const r = await seoApi('POST', { action: 'generate' });
    btn.disabled = false; btn.innerHTML = old; hydrate();
    if (!r.ok) { toast((r.data && r.data.message) || 'Error de IA', 'err'); if (r.status === 401 || r.status === 503) $('#seoConnect').hidden = false; return; }
    seoProposals = r.data.proposals; seoRenderProposals(); toast('Propuestas generadas', 'ok');
  });
  $('#seoProposals') && $('#seoProposals').addEventListener('click', e => {
    const ap = e.target.closest('[data-seo-apply]'); const fq = e.target.closest('[data-seo-faq]');
    if (ap) { const i = +ap.dataset.i; if (ap.dataset.seoApply === 'title') $('#seoTitle').value = seoProposals.titles[i]; else $('#seoDesc').value = seoProposals.descriptions[i]; seoUpdatePreview(); toast('Aplicado al editor', 'ok'); }
    if (fq) { const f = seoProposals.faq[+fq.dataset.seoFaq]; seoCfg = seoCfg || {}; seoCfg.faq = seoCfg.faq || []; seoCfg.faq.push({ q: f.q, a: f.a }); seoRenderFaq(); toast('FAQ añadida', 'ok'); }
  });
  $('#seoFaqList') && $('#seoFaqList').addEventListener('input', e => {
    const q = e.target.closest('[data-faq-q]'), a = e.target.closest('[data-faq-a]');
    if (q && seoCfg.faq[+q.dataset.faqQ]) seoCfg.faq[+q.dataset.faqQ].q = q.value;
    if (a && seoCfg.faq[+a.dataset.faqA]) seoCfg.faq[+a.dataset.faqA].a = a.value;
  });
  $('#seoFaqList') && $('#seoFaqList').addEventListener('click', e => {
    const d = e.target.closest('[data-faq-del]'); if (d) { seoCfg.faq.splice(+d.dataset.faqDel, 1); seoRenderFaq(); }
  });
  $('#seoAddFaq') && $('#seoAddFaq').addEventListener('click', () => { seoCfg = seoCfg || {}; seoCfg.faq = seoCfg.faq || []; seoCfg.faq.push({ q: '', a: '' }); seoRenderFaq(); });
  $('#seoSaveBtn') && $('#seoSaveBtn').addEventListener('click', async () => {
    if (!seoKey()) { $('#seoConnect').hidden = false; toast('Conecta primero (clave de publicación)', 'err'); return; }
    const cfg = {
      published: $('#seoPublished').checked,
      siteName: $('#seoSite').value.trim(),
      title: $('#seoTitle').value.trim(),
      description: $('#seoDesc').value.trim(),
      ogImage: (seoCfg && seoCfg.ogImage) || '/og-image.jpg',
      favicon: (seoCfg && seoCfg.favicon) || '',
      faq: ((seoCfg && seoCfg.faq) || []).filter(f => f.q && f.a),
    };
    const btn = $('#seoSaveBtn'); btn.disabled = true;
    const r = await seoApi('PUT', { config: cfg });
    btn.disabled = false;
    if (!r.ok) { toast((r.data && r.data.message) || 'No se pudo guardar', 'err'); if (r.status === 401 || r.status === 503) $('#seoConnect').hidden = false; return; }
    seoCfg = r.data.config;
    $('#seoStatus').textContent = (cfg.published ? '✓ Publicado en el sitio en vivo · ' : 'Guardado (sin publicar) · ') + new Date().toLocaleString();
    logAudit('settings', 'SEO', '', cfg.published ? 'Publicado' : 'Guardado');
    toast(cfg.published ? 'Publicado en vivo' : 'Guardado', 'ok');
  });

  // ---- COMPARADOR IA antes/después (dos vistas reales de la web + slider) ----
  let seoCompFindings = [];
  const seoNorm = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  function seoScanDoc(doc) {
    const pick = (sel) => { const e = doc.querySelector(sel); return e ? seoNorm(e.textContent) : ''; };
    const h1 = pick('main h1') || pick('h1');
    const headings = [].slice.call(doc.querySelectorAll('main h2, main h3')).map(h => seoNorm(h.textContent)).filter(Boolean);
    const seen = {};
    const alts = [].slice.call(doc.querySelectorAll('main img, header img')).map(i => ({ src: i.getAttribute('src') || '', alt: i.getAttribute('alt') || '' }))
      .filter(a => a.src && !/^data:/.test(a.src) && !seen[a.src] && (seen[a.src] = 1));
    let leads = [].slice.call(doc.querySelectorAll('main .lead, main .ship-desc, main .sec-head p, main .phc-body p')).map(p => seoNorm(p.textContent)).filter(t => t.length > 45);
    leads = leads.filter((t, i) => leads.indexOf(t) === i).slice(0, 12);
    return { url: location.origin + '/', title: doc.title, description: (doc.querySelector('meta[name="description"]') || {}).content || '', h1, headings, alts, leads };
  }
  function seoFindByText(doc, f) {
    const sels = f.type === 'h1' ? ['main h1', 'h1'] : (f.type === 'heading' ? ['main h2', 'main h3'] : ['main p', 'main .lead', 'main .ship-desc', 'main h2', 'main h3', 'main h1']);
    const cur = seoNorm(f.current);
    for (const s of sels) { const nodes = doc.querySelectorAll(s); for (let i = 0; i < nodes.length; i++) if (seoNorm(nodes[i].textContent) === cur) return nodes[i]; }
    return null;
  }
  function seoApplyToDoc(doc, findings) {
    findings.forEach(f => {
      try {
        if (f.type === 'title') doc.title = f.proposed;
        else if (f.type === 'description') { const m = doc.querySelector('meta[name="description"]'); if (m) m.setAttribute('content', f.proposed); }
        else if (f.type === 'alt' && f.src) { const im = doc.querySelector('img[src="' + f.src.replace(/"/g, '\\"') + '"]'); if (im) { im.setAttribute('alt', f.proposed); im.style.outline = '3px dashed #1cb5b0'; im.style.outlineOffset = '2px'; } }
        else { const el = seoFindByText(doc, f); if (el) { el.textContent = f.proposed; el.style.background = 'rgba(28,181,176,.14)'; el.style.outline = '2px dashed #1cb5b0'; el.style.outlineOffset = '3px'; el.style.borderRadius = '3px'; } }
      } catch (e) {}
    });
  }
  function seoScrollBoth(p) {
    let y = 0;
    try { const bw = $('#seoFrBefore').contentWindow, bd = $('#seoFrBefore').contentDocument; y = Math.max(0, (bd.body.scrollHeight - bw.innerHeight)) * p / 100; } catch (e) {}
    ['#seoFrBefore', '#seoFrAfter'].forEach(s => { try { $(s).contentWindow.scrollTo(0, y); } catch (e) {} });
  }
  function seoSetupSlider() {
    const frames = $('#seoCompFrames'), handle = $('#seoCompHandle'), range = $('#seoCompPos');
    const setPos = (p) => { p = Math.max(0, Math.min(100, p)); frames.style.setProperty('--split', p + '%'); handle.style.left = p + '%'; };
    setPos(50);
    if (range) range.value = 0;
    if (frames.__wired) return; // ya cableado (evita listeners duplicados)
    frames.__wired = 1;
    let drag = false;
    const move = (x) => { const r = frames.getBoundingClientRect(); setPos(((x - r.left) / r.width) * 100); };
    frames.addEventListener('mousedown', (e) => { drag = true; move(e.clientX); e.preventDefault(); });
    window.addEventListener('mousemove', (e) => { if (drag) move(e.clientX); });
    window.addEventListener('mouseup', () => { drag = false; });
    frames.addEventListener('touchmove', (e) => move(e.touches[0].clientX), { passive: true });
    if (range) range.oninput = () => seoScrollBoth(+range.value);
    frames.addEventListener('wheel', (e) => { e.preventDefault(); const v = Math.max(0, Math.min(100, (+(range.value || 0)) + (e.deltaY > 0 ? 4 : -4))); range.value = v; seoScrollBoth(v); }, { passive: false });
  }
  function seoRenderChanges() {
    const L = { title: 'Meta título', description: 'Meta descripción', h1: 'Encabezado H1', heading: 'Encabezado', alt: 'Texto ALT (imagen)', content: 'Texto' };
    $('#seoChanges').innerHTML = seoCompFindings.map(f => `<div class="seo-change"><div class="seo-change__h"><span class="seo-change__sev ${f.severity}"></span><span class="seo-change__type">${seoEsc(L[f.type] || f.type)}</span></div><div class="seo-change__ba"><div class="seo-change__col b"><small>Antes</small>${seoEsc(f.current) || '<i>(vacío)</i>'}</div><div class="seo-change__col a"><small>Después</small>${seoEsc(f.proposed)}</div></div><p class="seo-change__why">💡 ${seoEsc(f.reason)}</p></div>`).join('');
    $('#seoCompCount').textContent = seoCompFindings.length + ' cambios propuestos · ' + seoCompFindings.filter(f => f.severity === 'alta').length + ' de prioridad alta';
  }
  // página seleccionada (Inicio / Empleo / FAQs)
  let seoPage = { path: '/', src: '../', label: 'Inicio' };
  [].slice.call(document.querySelectorAll('.seo-pagetab')).forEach(tab => tab.addEventListener('click', () => {
    document.querySelectorAll('.seo-pagetab').forEach(t => t.classList.remove('is-on'));
    tab.classList.add('is-on');
    seoPage = { path: tab.dataset.path, src: tab.dataset.src, label: tab.dataset.label };
  }));

  // Extrae findings COMPLETOS del JSON que llega en streaming (respeta strings).
  function seoExtractFindings(buf) {
    let i = buf.indexOf('"findings"'); if (i < 0) return []; i = buf.indexOf('[', i); if (i < 0) return [];
    const out = []; let depth = 0, start = -1, inStr = false, esc = false;
    for (let j = i + 1; j < buf.length; j++) {
      const c = buf[j];
      if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
      if (c === '"') { inStr = true; continue; }
      if (c === '{') { if (depth === 0) start = j; depth++; }
      else if (c === '}') { depth--; if (depth === 0 && start >= 0) { try { out.push(JSON.parse(buf.slice(start, j + 1))); } catch (e) {} start = -1; } }
      else if (c === ']' && depth === 0) break;
    }
    return out;
  }
  function seoNormF(f) { return { type: String(f.type || ''), src: String(f.src || ''), current: String(f.current || ''), proposed: String(f.proposed || ''), reason: String(f.reason || ''), severity: ['alta', 'media', 'baja'].indexOf(f.severity) >= 0 ? f.severity : 'media' }; }
  const SEO_TLBL = { title: 'Meta título', description: 'Meta descripción', h1: 'Encabezado H1', heading: 'Encabezado', alt: 'Texto ALT (imagen)', content: 'Texto' };
  function seoAppendChange(f) {
    const div = document.createElement('div'); div.className = 'seo-change';
    div.innerHTML = `<div class="seo-change__h"><span class="seo-change__sev ${f.severity}"></span><span class="seo-change__type">${seoEsc(SEO_TLBL[f.type] || f.type)}</span></div><div class="seo-change__ba"><div class="seo-change__col b"><small>Antes</small>${seoEsc(f.current) || '<i>(vacío)</i>'}</div><div class="seo-change__col a"><small>Después</small>${seoEsc(f.proposed)}</div></div><p class="seo-change__why">💡 ${seoEsc(f.reason)}</p>`;
    $('#seoChanges').appendChild(div);
  }

  $('#seoGenVer') && $('#seoGenVer').addEventListener('click', async () => {
    if (!seoKey()) { toast('Entra al panel primero', 'err'); return; }
    const btn = $('#seoGenVer'), old = btn.innerHTML; btn.disabled = true; btn.textContent = 'Cargando…';
    seoCompFindings = []; let appliedN = 0;
    $('#seoChanges').innerHTML = ''; $('#seoCompActions').hidden = true;
    $('#seoCompStage').hidden = false;
    const live = $('#seoLive'); live.hidden = false; live.classList.remove('done');
    $('#seoLiveLog').textContent = ''; $('#seoLiveN').textContent = '0'; $('#seoLiveStatus').textContent = 'Cargando la web (' + seoPage.label + ')…';
    const before = $('#seoFrBefore'), after = $('#seoFrAfter');
    try {
      await new Promise((res) => { let n = 0; const done = () => { if (++n >= 2) res(); }; before.onload = done; after.onload = done; before.src = seoPage.src; after.src = seoPage.src; setTimeout(res, 9000); });
      await new Promise(r => setTimeout(r, 1600));
      seoSetupSlider();
      const page = seoScanDoc(before.contentDocument); page.label = seoPage.label;
      $('#seoLiveStatus').textContent = 'Analizando con IA en vivo…'; btn.textContent = 'Analizando…';
      const headers = { 'content-type': 'application/json' }; const k = seoKey(); if (k) headers['x-cabo-admin-token'] = k;
      // URL directa de la función (el redirect /api/* bufferiza el streaming).
      const resp = await fetch('/.netlify/functions/seo', { method: 'POST', headers, body: JSON.stringify({ action: 'audit', stream: true, page }) });
      if (!resp.ok || !resp.body) { const ed = await resp.json().catch(() => ({})); throw new Error((ed && ed.message) || 'IA no disponible'); }
      const reader = resp.body.getReader(); const dec = new TextDecoder(); let buf = ''; const log = $('#seoLiveLog');
      while (true) {
        let rd;
        try { rd = await reader.read(); } catch (streamErr) { break; } // el stream pudo cortar al final: usamos lo recibido
        if (rd.done) break;
        buf += dec.decode(rd.value, { stream: true });
        log.textContent = buf.slice(-1600); log.scrollTop = log.scrollHeight;
        const fs = seoExtractFindings(buf);
        while (appliedN < fs.length) {
          const f = seoNormF(fs[appliedN]); appliedN++;
          if (!f.proposed || !f.type) continue;
          seoCompFindings.push(f);
          try { seoApplyToDoc(after.contentDocument, [f]); } catch (e) {}
          seoAppendChange(f); $('#seoLiveN').textContent = seoCompFindings.length;
        }
      }
      btn.disabled = false; btn.innerHTML = old; hydrate();
      if (!seoCompFindings.length) { $('#seoLiveStatus').textContent = 'No se obtuvieron cambios. Reintenta.'; toast('La IA no devolvió cambios', 'err'); return; }
      // re-aplica al iframe por si recargó algo + resetea scroll alineado
      try { seoApplyToDoc(after.contentDocument, seoCompFindings); } catch (e) {}
      try { before.contentWindow.scrollTo(0, 0); after.contentWindow.scrollTo(0, 0); } catch (e) {}
      live.classList.add('done'); $('#seoLiveStatus').textContent = '✓ Análisis completado · ' + seoCompFindings.length + ' cambios';
      $('#seoCompCount').textContent = seoCompFindings.length + ' cambios · ' + seoCompFindings.filter(f => f.severity === 'alta').length + ' de prioridad alta';
      $('#seoCompActions').hidden = false;
      setTimeout(() => { live.hidden = true; }, 2600);
    } catch (e) { btn.disabled = false; btn.innerHTML = old; $('#seoLiveStatus').textContent = 'Error: ' + (e.message || ''); toast(e.message || 'No se pudo generar', 'err'); }
  });
  $('#seoCompReset') && $('#seoCompReset').addEventListener('click', () => { $('#seoCompStage').hidden = true; $('#seoChanges').innerHTML = ''; $('#seoCompActions').hidden = true; seoCompFindings = []; });
  $('#seoPublishVer') && $('#seoPublishVer').addEventListener('click', async () => {
    if (!seoCompFindings.length) return;
    const cfg = { published: true, altOverrides: Object.assign({}, (seoCfg && seoCfg.altOverrides) || {}), textOverrides: ((seoCfg && seoCfg.textOverrides) || []).slice() };
    const haveFind = {}; cfg.textOverrides.forEach(o => { haveFind[o.find] = 1; });
    let mTitle = null, mDesc = null;
    seoCompFindings.forEach(f => {
      if (f.type === 'title') mTitle = f.proposed;
      else if (f.type === 'description') mDesc = f.proposed;
      else if (f.type === 'alt' && f.src) cfg.altOverrides[f.src] = f.proposed;
      else if (!haveFind[f.current]) { cfg.textOverrides.push({ find: f.current, replace: f.proposed }); haveFind[f.current] = 1; }
    });
    if (seoPage.path === '/') { if (mTitle) cfg.title = mTitle; if (mDesc) cfg.description = mDesc; }
    else { cfg.metaByPath = {}; cfg.metaByPath[seoPage.path] = { title: mTitle || '', description: mDesc || '' }; }
    const btn = $('#seoPublishVer'); btn.disabled = true; btn.textContent = 'Publicando…';
    const r = await seoApi('PUT', { config: cfg });
    btn.disabled = false; hydrate();
    if (!r.ok) { toast((r.data && r.data.message) || 'No se pudo publicar', 'err'); return; }
    seoCfg = r.data.config; logAudit('settings', 'SEO', '', 'Versión IA publicada (' + seoCompFindings.length + ' cambios)');
    $('#seoCompCount').textContent = '✓ Publicado en la web en vivo';
    toast('Versión optimizada publicada en vivo', 'ok');
  });

  // ============ AJUSTES ============
  function renderAjustes() {
    const s = getSettings();
    $('#newsEnabled2').checked = s.newsEnabled;
    if ($('#whatsappEnabled')) $('#whatsappEnabled').checked = !!s.whatsappEnabled;
    $('#setEmail').value = s.email || ''; $('#setPhone').value = s.phone || '';
    hydrate();
  }
  $('#newsEnabled2').addEventListener('change', e => { setNewsEnabled(e.target.checked); });
  if ($('#whatsappEnabled')) $('#whatsappEnabled').addEventListener('change', e => {
    const s = getSettings(); const prev = !!s.whatsappEnabled; s.whatsappEnabled = e.target.checked; setSettings(s);
    if (prev !== e.target.checked) logAudit('settings', 'whatsappEnabled', prev ? 'Visible' : 'Oculto', e.target.checked ? 'Visible' : 'Oculto');
    toast(e.target.checked ? 'WhatsApp activado (recuerda republicar)' : 'WhatsApp oculto', 'ok');
  });
  $('#setEmail').addEventListener('change', e => { const s = getSettings(); s.email = e.target.value; setSettings(s); });
  $('#setPhone').addEventListener('change', e => { const s = getSettings(); s.phone = e.target.value; setSettings(s); });
  $('#exportBtn').addEventListener('click', () => {
    const data = {
      news: getNews(), settings: getSettings(), team: getTeam(),
      legal: read(K.legal, {}), msgs: getMsgs(),
      outlets: getOutlets(), journalists: getJournalists(), jobs: getJobs(),
      apps: getApps(), subs: getSubs(), pages: getPages(), audit: getAudit(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'cabo-virgenes-contenido.json'; a.click();
    toast('Contenido exportado', 'ok');
  });
  $('#importBtn').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (d.news) setNews(d.news);
        if (d.settings) setSettings(d.settings);
        if (d.team) write(K.team, d.team);
        if (d.legal) write(K.legal, d.legal);
        if (d.msgs) setMsgs(d.msgs);
        if (d.outlets) setOutlets(d.outlets);
        if (d.journalists) setJournalists(d.journalists);
        if (d.jobs) setJobs(d.jobs);
        if (d.apps) setApps(d.apps);
        if (d.subs) setSubs(d.subs);
        if (d.pages) setPages(d.pages);
        if (d.audit) setAudit(d.audit);
        legalBuf = null;
        route(); refreshBadges(); toast('Contenido importado', 'ok');
      }
      catch { toast('Archivo no válido', 'err'); }
    }; r.readAsText(f);
  });
  $('#resetBtn').addEventListener('click', async () => {
    if (!await confirmDialog('Restablecer contenido', '¿Restablecer todo el contenido del admin? (noticias, equipo, medios, redactores, empleo, suscriptores, página e historial en este navegador)')) return;
    [K.news, K.settings, K.team, K.msgs, K.outlets, K.journalists, K.jobs, K.apps, K.subs, K.pages, K.audit].forEach(k => localStorage.removeItem(k));
    legalBuf = null;
    route(); refreshBadges(); toast('Contenido restablecido');
  });

  // ============ EDICIÓN VISUAL ============
  let editLoaded = false, editorReady = false;
  function renderEdicion() {
    const frame = $('#siteFrame');
    if (!editLoaded) { frame.src = '../?editor=1'; editLoaded = true; }
  }
  // selector de dispositivo (ancho por CSS sobre el wrapper)
  document.addEventListener('click', e => {
    const d = e.target.closest('#view-edicion [data-device]'); if (!d) return;
    $$('#view-edicion [data-device]').forEach(b => b.classList.toggle('is-active', b === d));
    const frame = $('#editFrame'); if (frame) frame.dataset.device = d.dataset.device;
  });
  function postToEditor(msg) {
    const f = $('#siteFrame'); if (!f || !f.contentWindow) return;
    try { f.contentWindow.postMessage(msg, location.origin); } catch (_) {}
    try { f.contentWindow.postMessage(msg, '*'); } catch (_) {}
  }
  $('#editReload').addEventListener('click', () => { editorReady = false; setDirty(false); $('#siteFrame').src = '../?editor=1&_=' + Date.now(); });
  $('#editSave').addEventListener('click', () => {
    postToEditor({ type: 'cv:save' });
    // compat legacy
    const f = $('#siteFrame'); try { f.contentWindow.postMessage({ type: 'cv-save' }, '*'); } catch (_) {}
  });
  $('#undoBtn') && $('#undoBtn').addEventListener('click', () => postToEditor({ type: 'cv:undo' }));
  $('#redoBtn') && $('#redoBtn').addEventListener('click', () => postToEditor({ type: 'cv:redo' }));
  function setDirty(on) { const f = $('#dirtyFlag'); if (f) f.hidden = !on; }
  function setHistory(canUndo, canRedo) {
    const u = $('#undoBtn'), r = $('#redoBtn');
    if (u) u.disabled = !canUndo;
    if (r) r.disabled = !canRedo;
  }
  window.addEventListener('message', e => {
    if (e.origin !== location.origin) return;
    const d = e.data; if (!d || typeof d !== 'object') return;
    switch (d.type) {
      case 'cv:ready':
        editorReady = true; setDirty(false); setHistory(false, false);
        break;
      case 'cv:dirty':
        setDirty(!!d.dirty);
        break;
      case 'cv:saved':
        setDirty(false);
        toast(d.ok === false ? 'No se pudo guardar' : 'Cambios guardados', d.ok === false ? 'err' : 'ok');
        break;
      case 'cv:history':
        setHistory(!!d.canUndo, !!d.canRedo);
        break;
      case 'cv:toast':
        if (d.msg) toast(d.msg, d.kind);
        break;
      case 'cv-saved': // legacy
        setDirty(false); toast('Cambios guardados', 'ok');
        break;
    }
  });

  // ============ LEGALES ============
  // Editor visual (RTE) con tabs, generador por plantillas locales y vista previa.
  // Modelo cv_legal: { tipo:{ title, updated, html }, _company:{ name,cuit,address,email,site } }.
  // Migra el formato antiguo (tipo -> "string HTML").
  const LEGAL_IDS = { privacidad: 'modal-legal-privacidad', terminos: 'modal-legal-terminos', cookies: 'modal-legal-cookies', aviso: 'modal-legal-aviso', datos: 'modal-legal-datos' };
  const LEGAL_LABELS = { privacidad: 'Privacidad', terminos: 'Términos', cookies: 'Cookies', aviso: 'Aviso legal', datos: 'Protección de datos' };
  const LEGAL_DEFAULT_TITLE = { privacidad: 'Política de privacidad', terminos: 'Términos y condiciones', cookies: 'Política de cookies', aviso: 'Aviso legal', datos: 'Protección de datos' };
  let legalDefaults = null, legalBuf = null, activeLegal = 'privacidad', legalBound = false;

  const toDateInput = (s) => {
    if (!s) return '';
    const d = new Date(/^\d{4}-\d{2}-\d{2}/.test(s) ? s + 'T00:00:00' : s);
    return isNaN(d) ? '' : d.toISOString().slice(0, 10);
  };

  // Extrae el HTML por defecto de cada modal legal del sitio público (fallback inicial).
  async function loadLegalDefaults() {
    if (legalDefaults) return legalDefaults;
    legalDefaults = {};
    try {
      const html = await (await fetch('../index.html?_=' + Date.now())).text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      Object.entries(LEGAL_IDS).forEach(([k, id]) => {
        const art = doc.querySelector('#' + id + ' .info-shell');
        if (art) { const c = art.querySelector('.info-close'); if (c) c.remove(); legalDefaults[k] = art.innerHTML.trim(); }
        else legalDefaults[k] = '';
      });
    } catch (_) { Object.keys(LEGAL_IDS).forEach(k => legalDefaults[k] = ''); }
    return legalDefaults;
  }

  // Normaliza una entrada (string antigua u objeto nuevo) a { title, updated, html }.
  function normLegalEntry(v, key, def) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return { title: v.title || LEGAL_DEFAULT_TITLE[key] || '', updated: v.updated || '', html: v.html || '' };
    }
    const html = (typeof v === 'string' && v) ? v : (def || '');
    return { title: LEGAL_DEFAULT_TITLE[key] || '', updated: '', html };
  }

  // Construye legalBuf desde localStorage + defaults, migrando formatos.
  async function ensureLegalBuf() {
    if (legalBuf) return legalBuf;
    const def = await loadLegalDefaults();
    const stored = read(K.legal, {}) || {};
    legalBuf = {};
    Object.keys(LEGAL_IDS).forEach(k => { legalBuf[k] = normLegalEntry(stored[k], k, def[k]); });
    legalBuf._company = Object.assign({ name: '', cuit: '', address: '', email: '', site: '' }, stored._company || {});
    return legalBuf;
  }

  function getCompany() {
    if (!legalBuf) return { name: '', cuit: '', address: '', email: '', site: '' };
    legalBuf._company = legalBuf._company || { name: '', cuit: '', address: '', email: '', site: '' };
    return legalBuf._company;
  }
  function setCompany(obj) { if (legalBuf) legalBuf._company = Object.assign(getCompany(), obj); }
  function getLegalDoc(key) {
    if (!legalBuf) return { title: '', updated: '', html: '' };
    legalBuf[key] = legalBuf[key] || { title: LEGAL_DEFAULT_TITLE[key] || '', updated: '', html: '' };
    return legalBuf[key];
  }

  function populateCompany() {
    const c = getCompany();
    $('#lcName').value = c.name || '';
    $('#lcCuit').value = c.cuit || '';
    $('#lcAddr').value = c.address || '';
    $('#lcEmail').value = c.email || '';
    $('#lcSite').value = c.site || '';
  }
  function stashCompany() {
    setCompany({
      name: $('#lcName').value.trim(), cuit: $('#lcCuit').value.trim(),
      address: $('#lcAddr').value.trim(), email: $('#lcEmail').value.trim(), site: $('#lcSite').value.trim(),
    });
  }

  // ---- Editor de texto enriquecido (contenteditable) ----
  function getLegalHtml() { const r = $('#legalRte'); return r ? cleanRteHtml(r.innerHTML) : ''; }
  function setLegalHtml(h) { const r = $('#legalRte'); if (r) r.innerHTML = h || ''; }
  function cleanRteHtml(h) {
    return String(h || '')
      .replace(/<div>/gi, '<p>').replace(/<\/div>/gi, '</p>')
      .replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')
      .replace(/\sstyle="[^"]*"/gi, '')
      .trim();
  }
  function rteCmd(cmd) {
    const area = $('#legalRte'); if (!area) return;
    area.focus();
    try {
      if (cmd === 'h2' || cmd === 'h3' || cmd === 'p') document.execCommand('formatBlock', false, cmd);
      else if (cmd === 'bold') document.execCommand('bold');
      else if (cmd === 'italic') document.execCommand('italic');
      else if (cmd === 'ul') document.execCommand('insertUnorderedList');
      else if (cmd === 'ol') document.execCommand('insertOrderedList');
      else if (cmd === 'indent') document.execCommand('indent');
      else if (cmd === 'outdent') document.execCommand('outdent');
      else if (cmd === 'clear') { document.execCommand('removeFormat'); document.execCommand('formatBlock', false, 'p'); }
      else if (cmd === 'link') { const url = prompt('Dirección del enlace:', 'https://'); if (url) document.execCommand('createLink', false, url); }
    } catch (e) {}
    stashLegal();
    renderLegalPreview();
  }
  function bindRteToolbar() {
    const bar = $('#legalRteBar'); if (!bar) return;
    bar.addEventListener('mousedown', (e) => { if (e.target.closest('[data-cmd]')) e.preventDefault(); });
    bar.addEventListener('click', (e) => { const b = e.target.closest('[data-cmd]'); if (b) rteCmd(b.getAttribute('data-cmd')); });
  }

  // ---- Plantillas locales (sin IA): interpolan los datos de empresa ----
  function legalTemplate(kind, co) {
    const name = esc(co.name || 'la empresa');
    const cuit = esc(co.cuit || '—');
    const addr = esc(co.address || '—');
    const email = esc(co.email || 'legal@cabovirgenes.com');
    const siteRaw = (co.site || '').trim();
    const site = esc(siteRaw || 'este sitio web');
    const today = new Date().toISOString().slice(0, 10);
    const T = {
      privacidad: {
        title: 'Política de privacidad',
        html:
`<h4>1. Responsable del tratamiento</h4>
<p><strong>${name}</strong>, con domicilio en ${addr} (CUIT/NIF ${cuit}), es responsable del tratamiento de los datos personales recabados a través de ${site}. Contacto: <strong>${email}</strong>.</p>
<h4>2. Datos que recopilamos</h4>
<p>Recopilamos los datos que voluntariamente nos proporcionás mediante nuestros formularios (nombre, empresa, email, país, mensaje) y datos técnicos de navegación (IP, navegador, idioma, páginas visitadas) a través de cookies estrictamente necesarias.</p>
<h4>3. Finalidad</h4>
<p>Tratamos los datos para responder consultas comerciales o institucionales, enviar comunicaciones solicitadas, cumplir obligaciones legales y mejorar el rendimiento del sitio.</p>
<h4>4. Base jurídica</h4>
<p>Tu consentimiento explícito y el interés legítimo de ${name} para gestionar relaciones comerciales (RGPD UE 2016/679 y Ley 25.326 de Argentina).</p>
<h4>5. Conservación</h4>
<p>Conservamos los datos mientras dure la relación comercial o durante 5 años desde el último contacto, salvo obligación legal de mayor plazo.</p>
<h4>6. Tus derechos</h4>
<p>Podés ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a <strong>${email}</strong>, así como presentar reclamación ante la autoridad de control competente (AAIP Argentina / AEPD España).</p>`,
      },
      terminos: {
        title: 'Términos y condiciones',
        html:
`<h4>1. Titularidad</h4>
<p>${site} es operado por <strong>${name}</strong> (CUIT/NIF ${cuit}), con domicilio en ${addr}.</p>
<h4>2. Objeto</h4>
<p>Estas condiciones regulan el acceso y uso del sitio. El acceso implica la aceptación plena de los presentes términos.</p>
<h4>3. Uso del sitio</h4>
<p>El usuario se compromete a utilizar el sitio conforme a la ley y a no realizar actividades que dañen, inutilicen o sobrecarguen los servicios, ni vulneren derechos de terceros.</p>
<h4>4. Propiedad intelectual</h4>
<p>Los contenidos, marcas, logotipos e imágenes son titularidad de ${name} o de sus licenciantes y están protegidos por la normativa de propiedad intelectual e industrial.</p>
<h4>5. Responsabilidad</h4>
<p>La información se publica con fines informativos. ${name} no garantiza la ausencia de errores ni la disponibilidad ininterrumpida del sitio.</p>
<h4>6. Legislación aplicable</h4>
<p>Estas condiciones se rigen por la legislación argentina y, en su caso, española. Para consultas: <strong>${email}</strong>.</p>`,
      },
      cookies: {
        title: 'Política de cookies',
        html:
`<h4>1. Qué son las cookies</h4>
<p>Las cookies son pequeños archivos que se almacenan en tu dispositivo al navegar por ${site} y permiten recordar tus preferencias y medir el uso del sitio.</p>
<h4>2. Cookies que utilizamos</h4>
<p><strong>Estrictamente necesarias:</strong> garantizan el funcionamiento básico del sitio. <strong>Analíticas:</strong> nos ayudan a entender de forma agregada cómo se usa el sitio.</p>
<h4>3. Gestión de cookies</h4>
<p>Podés configurar o eliminar las cookies desde tu navegador en cualquier momento. Deshabilitarlas puede afectar a algunas funciones del sitio.</p>
<h4>4. Consentimiento</h4>
<p>Al continuar navegando consentís el uso de cookies según esta política. Para más información escribí a <strong>${email}</strong>.</p>`,
      },
      aviso: {
        title: 'Aviso legal',
        html:
`<h4>Identificación de la empresa</h4>
<p><strong>Razón social:</strong> ${name}<br/>
<strong>CUIT / NIF:</strong> ${cuit}<br/>
<strong>Domicilio:</strong> ${addr}<br/>
<strong>Email:</strong> ${email}<br/>
<strong>Sitio web:</strong> ${site}</p>
<h4>Actividad</h4>
<p>Captura, procesamiento, comercialización y exportación de productos del mar.</p>
<h4>Responsabilidad</h4>
<p>El contenido publicado es de carácter informativo. ${name} no garantiza la inexistencia de errores ni la actualidad permanente de la información.</p>
<h4>Reclamaciones</h4>
<p>Para presentar reclamaciones formales: <strong>${email}</strong> o mediante carta certificada al domicilio indicado.</p>`,
      },
      datos: {
        title: 'Protección de datos',
        html:
`<h4>1. Responsable del tratamiento</h4>
<p><strong>${name}</strong>, con domicilio en ${addr} (CUIT/NIF ${cuit}), es responsable del tratamiento de los datos personales recabados a través de ${site}. Contacto: <strong>${email}</strong>.</p>
<h4>2. Principios aplicados</h4>
<p>Tratamos los datos conforme a los principios de licitud, lealtad y transparencia, limitación de la finalidad, minimización, exactitud, limitación del plazo de conservación, integridad y confidencialidad (RGPD UE 2016/679 y Ley 25.326).</p>
<h4>3. Categorías de datos</h4>
<p>Datos identificativos y de contacto y datos de navegación. No tratamos categorías especiales de datos.</p>
<h4>4. Medidas de seguridad</h4>
<p>Aplicamos medidas técnicas y organizativas apropiadas: cifrado en tránsito, control de accesos, copias de respaldo y registro de actividad.</p>
<h4>5. Ejercicio de derechos</h4>
<p>Podés ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a <strong>${email}</strong>.</p>
<h4>6. Autoridad de control</h4>
<p>Tenés derecho a presentar una reclamación ante la AAIP (Argentina) o la AEPD (España).</p>`,
      },
    };
    const tpl = T[kind] || T.privacidad;
    return { title: tpl.title, updated: today, html: tpl.html };
  }

  // ---- Render / flujo ----
  function populateLegal() {
    const doc = getLegalDoc(activeLegal);
    $('#legalTitle').value = doc.title || '';
    $('#legalUpdated').value = doc.updated ? toDateInput(doc.updated) : '';
    setLegalHtml(doc.html || '');
    $('#legalGenKind').textContent = LEGAL_LABELS[activeLegal] || activeLegal;
    renderLegalPreview();
  }
  async function renderLegales() {
    await ensureLegalBuf();
    bindLegal();
    populateCompany();
    populateLegal();
    hydrate();
  }
  function renderLegalPreview() {
    const p = $('#legalPreview'); if (!p) return;
    p.innerHTML = getLegalHtml() || '<p style="color:var(--gray-400)">Sin contenido.</p>';
  }
  function stashLegal() {
    if (!legalBuf) return;
    const doc = getLegalDoc(activeLegal);
    doc.title = $('#legalTitle').value;
    doc.updated = $('#legalUpdated').value;
    doc.html = getLegalHtml();
  }

  // Generador local (sin backend): rellena con la plantilla del documento activo.
  function legalGen() {
    stashCompany();
    const btn = $('#legalGenBtn'); btn.classList.add('is-busy');
    try {
      const gen = legalTemplate(activeLegal, getCompany());
      setLegalHtml(gen.html);
      if (!$('#legalTitle').value.trim()) $('#legalTitle').value = gen.title;
      $('#legalUpdated').value = gen.updated;
      stashLegal();
      renderLegalPreview();
      toast('Documento generado. Revisalo y pulsá “Guardar legales”.', 'ok');
    } catch (err) { toast('No se pudo generar el documento', 'err'); }
    finally { btn.classList.remove('is-busy'); }
  }

  function saveLegal() {
    stashLegal();
    const btn = $('#legalSave'); btn.classList.add('is-busy');
    try {
      write(K.legal, legalBuf || {});
      logAudit('legal', activeLegal, '', 'Guardado');
      toast('Documentos legales guardados', 'ok');
    } catch (err) { toast('Error al guardar', 'err'); }
    finally { btn.classList.remove('is-busy'); }
  }

  function bindLegal() {
    if (legalBound) return; legalBound = true;
    $$('#legalTabs [data-legal]').forEach((btn) => {
      btn.addEventListener('click', () => {
        stashLegal();
        $$('#legalTabs [data-legal]').forEach((b) => b.classList.toggle('is-active', b === btn));
        activeLegal = btn.dataset.legal;
        populateLegal();
      });
    });
    ['legalTitle', 'legalUpdated'].forEach((id) => {
      const el = $('#' + id);
      if (el) el.addEventListener('input', () => { stashLegal(); renderLegalPreview(); });
    });
    const rte = $('#legalRte');
    if (rte) rte.addEventListener('input', () => { stashLegal(); renderLegalPreview(); });
    bindRteToolbar();
    ['lcName', 'lcCuit', 'lcAddr', 'lcEmail', 'lcSite'].forEach((id) => {
      const el = $('#' + id);
      if (el) el.addEventListener('input', stashCompany);
    });
    const gen = $('#legalGenBtn'); if (gen) gen.addEventListener('click', legalGen);
    const save = $('#legalSave'); if (save) save.addEventListener('click', saveLegal);
    const reset = $('#legalReset');
    if (reset) reset.addEventListener('click', async () => {
      const def = await loadLegalDefaults();
      const doc = getLegalDoc(activeLegal);
      doc.html = def[activeLegal] || '';
      doc.title = LEGAL_DEFAULT_TITLE[activeLegal] || '';
      populateLegal();
      toast('Restaurado al original');
    });
  }

  // ============ BOLETINES / NEWSLETTER ============
  // 100% cliente (localStorage cv_newsletters). Compón asunto + intro + selección
  // de noticias publicadas + estilo, previsualiza el HTML email, y "envía" sin
  // backend: registra el envío y exporta destinatarios (CSV) / copia HTML / mailto.
  const BN_SITE = (function () {
    try { return location.origin + location.pathname.replace(/\/admin\/.*/, '/'); }
    catch (_) { return '../'; }
  })();
  const BN_TEMPLATES = {
    clasico: { label: 'Clásico — tinta y oro', bg: '#eef2f6', paper: '#ffffff', ink: '#0b1a2c', accent: '#e9b048', soft: '#06182f' },
    costa:   { label: 'Costa — teal sobre papel', bg: '#e9f3f3', paper: '#ffffff', ink: '#0b1a2c', accent: '#1cb5b0', soft: '#0fa6a0' },
    sobrio:  { label: 'Sobrio — minimalista', bg: '#f4f5f6', paper: '#ffffff', ink: '#1a1a1a', accent: '#6b7a8a', soft: '#22303f' },
  };
  // Presets de contenido (rellenan el compositor; heurística local, sin IA/backend).
  // {fill} recibe el estado y devuelve {subject, intro, template, autoItems}.
  const BN_PRESETS = {
    digest: {
      label: 'Digest mensual',
      build() {
        const mes = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
        return {
          subject: 'Novedades de Cabo Vírgenes — ' + mes.charAt(0).toUpperCase() + mes.slice(1),
          intro: 'Hola,\n\nEste es el resumen de novedades de Cabo Vírgenes. Repasamos lo más destacado del mes en la operación pesquera, la flota y nuestra estructura binacional Argentina–España.',
          template: 'clasico', autoItems: 4,
        };
      },
    },
    anuncio: {
      label: 'Anuncio',
      build() {
        return {
          subject: 'Anuncio importante de Cabo Vírgenes',
          intro: 'Hola,\n\nQueremos compartir contigo una novedad importante. A continuación encontrarás todos los detalles.',
          template: 'costa', autoItems: 1,
        };
      },
    },
    bienvenida: {
      label: 'Bienvenida',
      build() {
        return {
          subject: 'Bienvenido/a al boletín de Cabo Vírgenes',
          intro: 'Hola,\n\n¡Gracias por suscribirte! A partir de ahora recibirás nuestras novedades sobre la pesca del langostino austral, la flota y nuestra plataforma en Argentina y España.\n\nUn saludo,\nEquipo de Cabo Vírgenes',
          template: 'costa', autoItems: 0,
        };
      },
    },
    carta: {
      label: 'Carta breve',
      build() {
        return {
          subject: 'Una nota breve de Cabo Vírgenes',
          intro: 'Hola,\n\nTe escribimos con una breve actualización. Gracias por tu interés y tu confianza en Cabo Vírgenes.\n\nUn cordial saludo.',
          template: 'sobrio', autoItems: 0,
        };
      },
    },
  };
  // Etiquetas legibles de segmento (interés ya es libre; país usa countryLabel).
  function bnAudLabel(a) {
    a = a || { mode: 'all' };
    if (a.mode === 'interest') return 'Interés: ' + (a.value || '—');
    if (a.mode === 'country') return 'País: ' + countryLabel(a.value);
    return 'Todos';
  }
  // Suscriptores que coinciden con un segmento {mode, value}.
  function bnAudienceList(a) {
    a = a || { mode: 'all' };
    const subs = getSubs().map(subNorm);
    if (a.mode === 'interest') return subs.filter(s => (s.interests || []).includes(a.value));
    if (a.mode === 'country') return subs.filter(s => String(s.country || '') === String(a.value));
    return subs;
  }
  // Estado del compositor (en memoria; el historial vive en cv_newsletters)
  let bnDraft = { subject: '', intro: '', template: 'clasico', items: [], audience: { mode: 'all', value: '' } };
  let bnBound = false;
  let bnDevice = 'desktop';
  const BN_DRAFT_KEY = 'cv_newsletter_draft';
  let bnDraftStateT = null;
  // ---- Persistencia de borrador (localStorage, no perder cambios) ----
  function bnLoadDraft() {
    const d = read(BN_DRAFT_KEY, null);
    if (d && typeof d === 'object') {
      bnDraft = {
        subject: d.subject || '', intro: d.intro || '',
        template: BN_TEMPLATES[d.template] ? d.template : 'clasico',
        items: Array.isArray(d.items) ? d.items : [],
        audience: (d.audience && d.audience.mode) ? d.audience : { mode: 'all', value: '' },
      };
    }
  }
  function bnSaveDraft() {
    bnStashDraft();
    write(BN_DRAFT_KEY, bnDraft);
    const el = $('#bnDraftState');
    if (el) { el.hidden = false; el.classList.add('is-shown'); clearTimeout(bnDraftStateT); bnDraftStateT = setTimeout(() => el.classList.remove('is-shown'), 1600); }
  }
  const bnSaveDraftDebounced = debounce(bnSaveDraft, 500);
  function bnClearDraft() { try { localStorage.removeItem(BN_DRAFT_KEY); } catch (_) {} }

  function bnPublishedNews() {
    return getNews()
      .filter(n => n.status === 'published' && !n.archived)
      .slice()
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }

  let bnDraftLoaded = false;
  function renderBoletines() {
    if (!bnDraftLoaded) { bnLoadDraft(); bnDraftLoaded = true; }
    bindBoletines();
    // limpia ids de noticias que ya no existan / no estén publicadas
    const valid = new Set(bnPublishedNews().map(n => n.id));
    bnDraft.items = (bnDraft.items || []).filter(id => valid.has(id));
    if (!bnDraft.audience || !bnDraft.audience.mode) bnDraft.audience = { mode: 'all', value: '' };
    if ($('#bnSubject')) $('#bnSubject').value = bnDraft.subject || '';
    if ($('#bnIntro')) $('#bnIntro').value = bnDraft.intro || '';
    if ($('#bnTemplate')) $('#bnTemplate').value = bnDraft.template || 'clasico';
    renderBnNewsPick();
    renderBnSegments();
    renderBnAudience();
    renderBnHistory();
    hydrate();
  }

  // ---- Segmentación de audiencia: chips por interés / país / todos ----
  function renderBnSegments() {
    const subs = getSubs().map(subNorm);
    const stats = calcSubsStats(subs);
    const a = bnDraft.audience || { mode: 'all', value: '' };
    // "Todos"
    const allBox = $('#bnSegAll');
    if (allBox) {
      allBox.innerHTML = `<button type="button" class="bn-seg-chip${a.mode === 'all' ? ' is-active' : ''}" data-seg-mode="all" data-seg-value="">Todos <span class="bn-seg-chip__n">${subs.length}</span></button>`;
    }
    // Por interés
    const iBox = $('#bnSegInterest');
    if (iBox) {
      const list = (stats.byInterest || []);
      iBox.innerHTML = list.length
        ? list.map(f => `<button type="button" class="bn-seg-chip${a.mode === 'interest' && a.value === f.value ? ' is-active' : ''}" data-seg-mode="interest" data-seg-value="${esc(f.value)}">${esc(f.value)} <span class="bn-seg-chip__n">${f.count}</span></button>`).join('')
        : `<span class="bn-seg__empty">Sin intereses registrados.</span>`;
    }
    // Por país
    const cBox = $('#bnSegCountry');
    if (cBox) {
      const list = (stats.byCountry || []);
      cBox.innerHTML = list.length
        ? list.map(f => `<button type="button" class="bn-seg-chip${a.mode === 'country' && a.value === f.value ? ' is-active' : ''}" data-seg-mode="country" data-seg-value="${esc(f.value)}">${esc(countryLabel(f.value))} <span class="bn-seg-chip__n">${f.count}</span></button>`).join('')
        : `<span class="bn-seg__empty">Sin países registrados.</span>`;
    }
    hydrate();
  }
  function bnSetAudience(mode, value) {
    bnDraft.audience = { mode: mode || 'all', value: mode === 'all' ? '' : (value || '') };
    renderBnSegments();
    renderBnAudience();
    bnSaveDraft();
  }

  function renderBnNewsPick() {
    const box = $('#bnNewsPick'); if (!box) return;
    const news = bnPublishedNews();
    const sel = new Set(bnDraft.items || []);
    if (!news.length) {
      box.innerHTML = `<div class="bn-pick-empty">No hay noticias publicadas. Publica noticias en <b>Noticias › Biblioteca</b> para incluirlas en el boletín.</div>`;
    } else {
      box.innerHTML = news.map(n => `
        <label class="bn-pick${sel.has(n.id) ? ' is-on' : ''}" data-id="${esc(n.id)}">
          <input type="checkbox" class="bn-pick__cb" data-pick="${esc(n.id)}"${sel.has(n.id) ? ' checked' : ''}>
          <span class="bn-pick__thumb"${n.image ? ` style="background-image:url('${esc(n.image)}')"` : ''}>${n.image ? '' : '<span data-ico="image" data-ico-size="16"></span>'}</span>
          <span class="bn-pick__b">
            <span class="bn-pick__t">${esc(n.title)}</span>
            <span class="bn-pick__m">${esc(fmtDate(n.date))}${n.category ? ' · ' + esc(n.category) : ''}</span>
          </span>
          <span class="bn-pick__check" data-ico="check" data-ico-size="15"></span>
        </label>`).join('');
    }
    const cnt = $('#bnPickCount'); if (cnt) cnt.textContent = (bnDraft.items || []).length;
    hydrate();
  }

  function renderBnAudience() {
    const a = bnDraft.audience || { mode: 'all', value: '' };
    const n = bnAudienceList(a).length;
    const el = $('#bnAudCount'); if (el) el.textContent = n;
    const lbl = $('#bnAudLbl');
    if (lbl) lbl.textContent = a.mode === 'all' ? 'destinatarios' : ('destinatarios · ' + bnAudLabel(a));
  }

  function bnSelectedNews() {
    const byId = {}; bnPublishedNews().forEach(n => byId[n.id] = n);
    return (bnDraft.items || []).map(id => byId[id]).filter(Boolean);
  }

  function bnStashDraft() {
    bnDraft.subject = $('#bnSubject') ? $('#bnSubject').value : bnDraft.subject;
    bnDraft.intro = $('#bnIntro') ? $('#bnIntro').value : bnDraft.intro;
    bnDraft.template = ($('#bnTemplate') && $('#bnTemplate').value) || 'clasico';
  }

  // ---- Render HTML email-safe (estética Cabo, inline styles + tablas) ----
  function bnRenderHTML() {
    bnStashDraft();
    const t = BN_TEMPLATES[bnDraft.template] || BN_TEMPLATES.clasico;
    const subject = bnDraft.subject || 'Boletín de Cabo Vírgenes';
    const intro = (bnDraft.intro || '').trim();
    const news = bnSelectedNews();
    const cap = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1).trim() + '…' : s; };

    const introHTML = intro
      ? intro.split(/\n{2,}/).map(p => `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${t.ink}">${esc(p).replace(/\n/g, '<br>')}</p>`).join('')
      : '';

    const itemsHTML = news.map(n => `
      <tr><td style="padding:0 0 22px">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e2e8ee;border-radius:14px;overflow:hidden;background:#ffffff">
          ${n.image ? `<tr><td><img src="${esc(n.image)}" alt="" width="100%" style="display:block;width:100%;max-height:240px;object-fit:cover"></td></tr>` : ''}
          <tr><td style="padding:18px 22px 20px">
            ${n.category ? `<span style="display:inline-block;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${t.accent};margin-bottom:8px">${esc(n.category)}</span>` : ''}
            <h3 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:1.25;color:${t.ink};font-weight:500">${esc(n.title)}</h3>
            ${n.excerpt ? `<p style="margin:0 0 6px;font-size:14px;line-height:1.6;color:#4a5a6a">${esc(cap(n.excerpt, 220))}</p>` : ''}
            <span style="display:block;font-size:12px;color:#8a98a6;margin-top:6px">${esc(fmtDate(n.date))}</span>
          </td></tr>
        </table>
      </td></tr>`).join('');

    const noNews = news.length ? '' : `<tr><td style="padding:0 0 22px;font-size:13px;color:#8a98a6">— Aún no has seleccionado noticias para este boletín. —</td></tr>`;

    return `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${t.bg};-webkit-text-size-adjust:100%">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${t.bg};padding:28px 0">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="width:600px;max-width:600px;background:${t.paper};border-radius:18px;overflow:hidden;box-shadow:0 14px 40px -24px rgba(11,26,44,.5)">
      <!-- Cabecera -->
      <tr><td style="background:${t.soft};padding:30px 34px">
        <span style="display:block;font-size:11px;font-weight:700;letter-spacing:.28em;text-transform:uppercase;color:${t.accent}">Boletín</span>
        <span style="display:block;margin-top:8px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.15;color:#ffffff;font-weight:500">Cabo Vírgenes</span>
      </td></tr>
      <!-- Cuerpo -->
      <tr><td style="padding:32px 34px 14px">
        <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.25;color:${t.ink};font-weight:500">${esc(subject)}</h1>
        ${introHTML}
      </td></tr>
      <tr><td style="padding:8px 34px 0">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${itemsHTML || noNews}
        </table>
      </td></tr>
      <!-- CTA -->
      <tr><td style="padding:6px 34px 34px" align="left">
        <a href="${esc(BN_SITE)}" style="display:inline-block;background:${t.accent};color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:100px">Visitar el sitio</a>
      </td></tr>
      <!-- Pie -->
      <tr><td style="padding:24px 34px;background:#f5f7f9;border-top:1px solid #e2e8ee">
        <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#8a98a6">Recibes este boletín porque te suscribiste en cabovirgenes.com.</p>
        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#8a98a6">Para darte de baja, responde a este mensaje con el asunto «Baja». · Cabo Vírgenes · Parte de AISA Group</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
  }

  function bnOpenPreview() {
    const html = bnRenderHTML();
    const frame = $('#bnPreviewFrame');
    if (frame) frame.srcdoc = html;
    bnSetDevice(bnDevice);
    const m = $('#bnPreviewModal'); if (m) { m.classList.add('open'); m.setAttribute('aria-hidden', 'false'); }
    hydrate();
  }

  // ---- Preview por dispositivo (desktop 600 / tablet 768 / mobile 320) ----
  function bnSetDevice(dev) {
    bnDevice = (['desktop', 'tablet', 'mobile'].indexOf(dev) >= 0) ? dev : 'desktop';
    const stage = $('#bnStage'); if (stage) stage.dataset.dev = bnDevice;
    $$('#bnDev [data-dev]').forEach(b => b.classList.toggle('is-active', b.dataset.dev === bnDevice));
  }

  // ---- Aplicar plantilla / preset al compositor ----
  function bnApplyPreset(key) {
    const p = BN_PRESETS[key]; if (!p) return;
    const data = p.build();
    bnStashDraft();
    bnDraft.subject = data.subject || bnDraft.subject;
    bnDraft.intro = data.intro || bnDraft.intro;
    bnDraft.template = BN_TEMPLATES[data.template] ? data.template : bnDraft.template;
    // Autoselección de las N noticias publicadas más recientes (si el preset lo pide).
    if (typeof data.autoItems === 'number') {
      bnDraft.items = bnPublishedNews().slice(0, data.autoItems).map(n => n.id);
    }
    if ($('#bnSubject')) $('#bnSubject').value = bnDraft.subject;
    if ($('#bnIntro')) $('#bnIntro').value = bnDraft.intro;
    if ($('#bnTemplate')) $('#bnTemplate').value = bnDraft.template;
    renderBnNewsPick();
    bnSaveDraft();
    $$('#bnPresets [data-preset]').forEach(b => b.classList.toggle('is-active', b.dataset.preset === key));
    toast('Plantilla «' + p.label + '» aplicada. Revisa y ajusta el contenido.', 'ok');
  }

  // ---- Email de prueba (sin backend: confirma y registra el "envío de prueba") ----
  async function bnTest() {
    bnStashDraft();
    const inp = $('#bnTestEmail'); const to = inp ? inp.value.trim() : '';
    if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) { toast('Escribe un email de prueba válido', 'err'); if (inp) inp.focus(); return; }
    const subject = (bnDraft.subject || '').trim() || 'Boletín de Cabo Vírgenes';
    const ok = await confirmDialog('Enviar prueba', `Este sitio es estático y no envía correo real. Se preparará una prueba de «${subject}» para ${to}: copia el HTML del boletín y envíalo desde tu plataforma de correo, o usa «Abrir en cliente de correo». ¿Copiar el HTML al portapapeles ahora?`);
    if (!ok) return;
    bnCopyHtml();
    logAudit('settings', 'boletín', '∅', 'Prueba preparada para ' + to);
    toast('Prueba lista: HTML copiado para enviar a ' + to, 'ok');
  }

  // ---- Copiar HTML al portapapeles ----
  function bnCopyHtml() {
    const html = bnRenderHTML();
    const done = () => toast('HTML del boletín copiado al portapapeles', 'ok');
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = html; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (_) { toast('No se pudo copiar el HTML', 'err'); }
      ta.remove();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(html).then(done).catch(fallback);
    } else fallback();
  }

  // ---- Exportar destinatarios (CSV) ----
  function bnExportDest() {
    const subs = bnAudienceList(bnDraft.audience);
    if (!subs.length) { toast('No hay destinatarios en este segmento', 'err'); return; }
    const head = ['Correo', 'Nombre', 'País', 'Intereses'];
    const escCsv = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const rows = subs.map(s => [s.email, s.name, s.country, (s.interests || []).join(' · ')].map(escCsv).join(','));
    const csv = head.map(escCsv).join(',') + '\r\n' + rows.join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    const slug = (bnDraft.subject || 'boletin').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'boletin';
    a.download = 'cabo-virgenes-destinatarios-' + slug + '-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    toast('Destinatarios exportados (' + subs.length + ')', 'ok');
  }

  // ---- Abrir cliente de correo (mailto, destinatarios en BCC) ----
  function bnMailto() {
    bnStashDraft();
    const subs = bnAudienceList(bnDraft.audience).map(s => s.email).filter(Boolean);
    const subject = bnDraft.subject || 'Boletín de Cabo Vírgenes';
    const body = (bnDraft.intro || '') + '\n\n[Pega aquí el contenido del boletín o usa «Copiar HTML».]\n';
    const bcc = subs.slice(0, 50).join(',');
    const href = 'mailto:?bcc=' + encodeURIComponent(bcc) + '&subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    window.location.href = href;
    if (subs.length > 50) toast('Tu cliente abrió los primeros 50 destinatarios. Usa el CSV para el resto.', 'info');
  }

  // ---- Registrar envío (sin backend) ----
  async function bnSend() {
    bnStashDraft();
    const subject = (bnDraft.subject || '').trim();
    if (!subject) { toast('Pon un asunto para el boletín', 'err'); if ($('#bnSubject')) $('#bnSubject').focus(); return; }
    const aud = bnDraft.audience || { mode: 'all', value: '' };
    const subs = bnAudienceList(aud);
    if (!subs.length) {
      if (!await confirmDialog('Sin destinatarios', 'No hay destinatarios en este segmento. ¿Registrar el envío de todos modos (0 destinatarios)?')) return;
    }
    const news = bnSelectedNews();
    if (!await confirmDialog('Registrar envío', `Se registrará el boletín «${subject}» para ${subs.length} destinatario(s) (${bnAudLabel(aud)}). No se envía correo real: descarga el CSV de destinatarios o copia el HTML para enviarlo desde tu plataforma. ¿Continuar?`)) return;
    const rec = {
      id: uid(),
      subject,
      intro: bnDraft.intro || '',
      template: bnDraft.template || 'clasico',
      date: new Date().toISOString(),
      recipientCount: subs.length,
      audience: { mode: aud.mode, value: aud.value || '' },
      items: news.map(n => ({ id: n.id, title: n.title })),
      html: bnRenderHTML(),
    };
    const list = getNewsletters(); list.unshift(rec); setNewsletters(list);
    logAudit('settings', 'boletín', '∅', 'Enviado: ' + subject + ' · ' + bnAudLabel(aud));
    // limpia el compositor tras registrar (incluido el borrador persistido)
    bnDraft = { subject: '', intro: '', template: bnDraft.template, items: [], audience: { mode: 'all', value: '' } };
    bnClearDraft();
    if ($('#bnSubject')) $('#bnSubject').value = '';
    if ($('#bnIntro')) $('#bnIntro').value = '';
    renderBnNewsPick();
    renderBnSegments();
    renderBnAudience();
    renderBnHistory();
    toast('Boletín registrado. Exporta los destinatarios o copia el HTML para enviarlo.', 'ok');
  }

  // ---- Historial de boletines enviados ----
  function renderBnHistory() {
    const list = getNewsletters();
    const cnt = $('#bnHistCount'); if (cnt) cnt.textContent = list.length;
    const box = $('#bnHistory'); if (!box) return;
    if (!list.length) {
      box.innerHTML = `<div class="news-empty"><span data-ico="send" data-ico-size="40"></span><p>Aún no has registrado boletines.<br>Compón uno arriba y pulsa «Registrar envío».</p></div>`;
      hydrate(); return;
    }
    box.innerHTML = list.map(b => {
      const items = (b.items || []).length;
      const tmpl = (BN_TEMPLATES[b.template] || {}).label || b.template || '';
      const aud = bnAudLabel(b.audience);
      return `<article class="bn-hrow" data-id="${esc(b.id)}">
        <span class="bn-hrow__ic" data-ico="send" data-ico-size="18"></span>
        <div class="bn-hrow__b">
          <span class="bn-hrow__subj">${esc(b.subject || 'Sin asunto')}</span>
          <span class="bn-hrow__meta">${esc(fmtTime(b.date))} · ${b.recipientCount || 0} destinatario(s) · ${items} noticia(s)${tmpl ? ' · ' + esc(tmpl) : ''}</span>
          <span class="bn-hrow__tags"><span class="bn-hrow__aud"><span data-ico="users" data-ico-size="11"></span>${esc(aud)}</span></span>
        </div>
        <div class="bn-hrow__act">
          <button type="button" class="icon-btn" data-bn-view="${esc(b.id)}" title="Ver HTML"><span data-ico="eye"></span></button>
          <button type="button" class="icon-btn" data-bn-copy="${esc(b.id)}" title="Copiar HTML"><span data-ico="copy"></span></button>
          <button type="button" class="icon-btn danger" data-bn-del="${esc(b.id)}" title="Eliminar del registro"><span data-ico="trash-2"></span></button>
        </div>
      </article>`;
    }).join('');
    hydrate();
  }

  function bnHistById(id) { return getNewsletters().find(b => String(b.id) === String(id)); }
  function bnCopyHtmlOf(id) {
    const b = bnHistById(id); if (!b || !b.html) { toast('Este boletín no tiene HTML guardado', 'err'); return; }
    const done = () => toast('HTML copiado al portapapeles', 'ok');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(b.html).then(done).catch(() => toast('No se pudo copiar', 'err'));
    else {
      const ta = document.createElement('textarea'); ta.value = b.html; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (_) { toast('No se pudo copiar', 'err'); } ta.remove();
    }
  }
  function bnViewHtmlOf(id) {
    const b = bnHistById(id); if (!b || !b.html) { toast('Este boletín no tiene HTML guardado', 'err'); return; }
    const frame = $('#bnPreviewFrame'); if (frame) frame.srcdoc = b.html;
    const m = $('#bnPreviewModal'); if (m) { m.classList.add('open'); m.setAttribute('aria-hidden', 'false'); }
    hydrate();
  }

  // ---- Bindings (una sola vez) ----
  function bindBoletines() {
    if (bnBound) return; bnBound = true;
    const subj = $('#bnSubject'); if (subj) subj.addEventListener('input', () => { bnDraft.subject = subj.value; bnSaveDraftDebounced(); });
    const intro = $('#bnIntro'); if (intro) intro.addEventListener('input', () => { bnDraft.intro = intro.value; bnSaveDraftDebounced(); });
    const tpl = $('#bnTemplate'); if (tpl) tpl.addEventListener('change', () => { bnDraft.template = tpl.value; bnSaveDraft(); });

    const pick = $('#bnNewsPick');
    if (pick) pick.addEventListener('change', e => {
      const cb = e.target.closest('[data-pick]'); if (!cb) return;
      const id = cb.dataset.pick;
      const set = new Set(bnDraft.items || []);
      if (cb.checked) set.add(id); else set.delete(id);
      bnDraft.items = Array.from(set);
      const row = cb.closest('.bn-pick'); if (row) row.classList.toggle('is-on', cb.checked);
      const cnt = $('#bnPickCount'); if (cnt) cnt.textContent = bnDraft.items.length;
      bnSaveDraft();
    });

    // Plantillas rápidas (presets)
    const presets = $('#bnPresets');
    if (presets) presets.addEventListener('click', e => {
      const b = e.target.closest('[data-preset]'); if (!b) return; bnApplyPreset(b.dataset.preset);
    });

    // Segmentación de audiencia (chips: todos / interés / país)
    ['#bnSegAll', '#bnSegInterest', '#bnSegCountry'].forEach(sel => {
      const box = $(sel);
      if (box) box.addEventListener('click', e => {
        const b = e.target.closest('[data-seg-mode]'); if (!b) return;
        bnSetAudience(b.dataset.segMode, b.dataset.segValue || '');
      });
    });

    // Email de prueba
    const tb = $('#bnTestBtn'); if (tb) tb.addEventListener('click', bnTest);
    const te = $('#bnTestEmail'); if (te) te.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); bnTest(); } });

    // Preview por dispositivo
    const dev = $('#bnDev');
    if (dev) dev.addEventListener('click', e => { const b = e.target.closest('[data-dev]'); if (b) bnSetDevice(b.dataset.dev); });

    const pv = $('#bnPreviewBtn'); if (pv) pv.addEventListener('click', bnOpenPreview);
    const send = $('#bnSendBtn'); if (send) send.addEventListener('click', bnSend);
    const expd = $('#bnExportDest'); if (expd) expd.addEventListener('click', bnExportDest);
    const cph = $('#bnCopyHtml'); if (cph) cph.addEventListener('click', bnCopyHtml);
    const cph2 = $('#bnCopyHtml2'); if (cph2) cph2.addEventListener('click', bnCopyHtml);
    const mt = $('#bnMailto'); if (mt) mt.addEventListener('click', bnMailto);

    const hist = $('#bnHistory');
    if (hist) hist.addEventListener('click', async e => {
      const v = e.target.closest('[data-bn-view]'); if (v) return bnViewHtmlOf(v.dataset.bnView);
      const c = e.target.closest('[data-bn-copy]'); if (c) return bnCopyHtmlOf(c.dataset.bnCopy);
      const d = e.target.closest('[data-bn-del]');
      if (d) {
        if (!await confirmDialog('Eliminar del registro', '¿Quitar este boletín del historial? No afecta a correos ya enviados desde tu plataforma.')) return;
        setNewsletters(getNewsletters().filter(b => String(b.id) !== String(d.dataset.bnDel)));
        renderBnHistory(); toast('Boletín eliminado del registro');
      }
    });
  }

  // ============ INIT ============
  bindPageDnd();
  if (isAuthed()) showApp(); else showLogin();
  document.body.classList.remove('is-loading');
  refreshBadges();
  hydrate();
})();
