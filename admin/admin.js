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
  const getSettings = () => Object.assign({ newsEnabled: false, jobsEnabled: false, email: 'comercial@cabovirgenes.com', phone: '+54 280 4495000' }, read(K.settings, {}));
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
  const TITLES = { inicio: 'Inicio', edicion: 'Edición visual', noticias: 'Noticias', equipo: 'Equipo', legales: 'Legales', consultas: 'Consultas', suscriptores: 'Suscriptores', empleo: 'Empleo', ajustes: 'Ajustes' };
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
    else if (v === 'empleo') renderEmpleo();
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
  const SECTION_LABELS = { texts: 'Texto', media: 'Imagen', styles: 'Estilo', legal: 'Legal', settings: 'Ajustes', news: 'Noticias', team: 'Equipo' };
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
  let newsTab = 'biblioteca';
  function renderNoticias() {
    const s = getSettings();
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
    else if (tab === 'pagina') renderPagina();
    else if (tab === 'medios') renderOutlets();
    else if (tab === 'redactores') renderJournalists();
    hydrate();
  }
  $('#newsTabs') && $('#newsTabs').addEventListener('click', e => {
    const b = e.target.closest('[data-ntab]'); if (!b) return; showNewsTab(b.dataset.ntab);
  });

  function renderBiblioteca() {
    const news = getNews().slice().sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (a.order ?? 0) - (b.order ?? 0) || (b.date || '').localeCompare(a.date || ''));
    $('#newsCount').textContent = news.length;
    const grid = $('#newsGrid');
    if (!news.length) {
      grid.innerHTML = `<div class="news-empty"><span data-ico="newspaper" data-ico-size="42"></span><p>Todavía no hay noticias.<br>Crea la primera o añade ejemplos.</p></div>`;
    } else {
      grid.innerHTML = news.map(n => `
        <article class="ncard${n.archived ? ' is-archived' : ''}" data-id="${n.id}">
          <div class="ncard__img" style="${n.image ? `background-image:url('${esc(n.image)}')` : ''}">
            <div class="ncard__badges">
              <span class="ncard__status ${n.status}">${n.status === 'published' ? 'Publicada' : 'Borrador'}</span>
              ${n.pinned ? '<span class="ncard__status pinned">Destacada</span>' : ''}
              ${n.archived ? '<span class="ncard__status archived">Archivada</span>' : ''}
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
        </article>`).join('');
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
  function populateNewsOutlet(sel) {
    const s = $('#nfOutlet'); if (!s) return;
    s.innerHTML = '<option value="">— Sin medio —</option>' + getOutlets().map(o => `<option value="${esc(o.id)}">${esc(o.name)}</option>`).join('');
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
    setNews(news); closeModal(newsModal); renderBiblioteca(); toast('Noticia guardada', 'ok');
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

  // ============ NOTICIAS · PÁGINA (drag & drop) ============
  function pageOutletName(n) { return n.outlet || n.category || 'Prensa'; }
  function pageMiniCard(n, hero) {
    return `<article class="pdrop-card${hero ? ' is-hero' : ''}" draggable="true" data-id="${n.id}">
      <div class="pdrop-card__img" style="${n.image ? `background-image:url('${esc(n.image)}')` : ''}"></div>
      <div class="pdrop-card__b">
        <span class="pdrop-card__eyebrow">${esc(pageOutletName(n))}</span>
        <span class="pdrop-card__t">${esc(n.title)}</span>
        <span class="pdrop-card__d">${esc(fmtDate(n.date))}</span>
      </div>
      <button class="icon-btn pdrop-card__rm" data-page-rm="${n.id}" title="Quitar de la página"><span data-ico="x"></span></button>
    </article>`;
  }
  function renderPagina() {
    const pages = getPages();
    const all = getNews().filter(n => n.status === 'published');
    const byId = {}; all.forEach(n => byId[n.id] = n);
    const layout = pages.noticias || { hero: '', items: [] };
    // limpia ids que ya no existen / no publicados
    layout.items = (layout.items || []).filter(id => byId[id]);
    if (layout.hero && !byId[layout.hero]) layout.hero = '';
    const placed = new Set(layout.items);
    if (layout.hero) placed.add(layout.hero);

    // Pool = publicadas no colocadas
    const pool = all.filter(n => !placed.has(n.id));
    const poolBox = $('#pagePoolList');
    if (!pool.length) {
      poolBox.innerHTML = `<div class="page-pool__empty">No hay noticias publicadas disponibles. Publica noticias en la pestaña «Biblioteca».</div>`;
    } else {
      poolBox.innerHTML = pool.map(n => `
        <div class="page-pool__item" draggable="true" data-id="${n.id}">
          <span class="page-pool__grip" data-ico="grip-vertical" data-ico-size="16"></span>
          <span class="page-pool__thumb" style="${n.image ? `background-image:url('${esc(n.image)}')` : ''}"></span>
          <span class="page-pool__txt"><span class="page-pool__t">${esc(n.title)}</span><span class="page-pool__d">${esc(fmtDate(n.date))}</span></span>
        </div>`).join('');
    }

    // Hero
    const heroBox = $('#pageHero');
    if (layout.hero && byId[layout.hero]) heroBox.innerHTML = pageMiniCard(byId[layout.hero], true);
    else heroBox.innerHTML = `<span class="page-hero__hint">Arrastra aquí la noticia destacada (hero)</span>`;

    // Lista
    const listBox = $('#pageList');
    if (layout.items.length) listBox.innerHTML = layout.items.map(id => pageMiniCard(byId[id], false)).join('');
    else listBox.innerHTML = `<span class="page-list__hint">Arrastra noticias aquí para ordenar la página pública</span>`;

    pages.noticias = layout; setPages(pages);
    hydrate();
  }
  function savePageLayout(layout, msg) {
    const pages = getPages(); pages.noticias = layout; setPages(pages);
    logAudit('news', 'página pública', '', 'Layout actualizado');
    renderPagina();
    if (msg) toast(msg, 'ok');
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
      const layout = getPages().noticias || { hero: '', items: [] };
      // quita de items y de hero previo
      layout.items = (layout.items || []).filter(x => x !== pageDrag.id);
      if (layout.hero && layout.hero !== pageDrag.id) layout.items = layout.items; // hero anterior se descarta al pool
      layout.hero = pageDrag.id;
      savePageLayout(layout, 'Noticia destacada actualizada');
    });

    list.addEventListener('drop', e => {
      if (!pageDrag) return; e.preventDefault(); list.classList.remove('is-dropover');
      const layout = getPages().noticias || { hero: '', items: [] };
      if (layout.hero === pageDrag.id) layout.hero = '';
      layout.items = (layout.items || []).filter(x => x !== pageDrag.id);
      const idx = dropIndex(list, e.clientY);
      layout.items.splice(idx, 0, pageDrag.id);
      savePageLayout(layout, pageDrag.src === 'pool' ? 'Noticia añadida a la página' : 'Orden actualizado');
    });

    pool.addEventListener('drop', e => {
      if (!pageDrag || pageDrag.src === 'pool') { if (pool) pool.classList.remove('is-dropover'); return; }
      e.preventDefault(); pool.classList.remove('is-dropover');
      const layout = getPages().noticias || { hero: '', items: [] };
      layout.items = (layout.items || []).filter(x => x !== pageDrag.id);
      if (layout.hero === pageDrag.id) layout.hero = '';
      savePageLayout(layout, 'Noticia quitada de la página');
    });
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
  // quitar con botón
  document.addEventListener('click', e => {
    const rm = e.target.closest('[data-page-rm]'); if (!rm) return;
    const layout = getPages().noticias || { hero: '', items: [] };
    layout.items = (layout.items || []).filter(x => x !== rm.dataset.pageRm);
    if (layout.hero === rm.dataset.pageRm) layout.hero = '';
    savePageLayout(layout, 'Noticia quitada de la página');
  });

  // ============ NOTICIAS · MEDIOS (outlets) ============
  function renderOutlets() {
    const outlets = getOutlets(), grid = $('#outletGrid');
    if (!outlets.length) {
      grid.innerHTML = `<div class="news-empty"><span data-ico="building-2" data-ico-size="42"></span><p>No hay medios todavía.<br>Añade los medios de prensa con los que trabajas.</p></div>`;
    } else {
      grid.innerHTML = outlets.map(o => `
        <article class="outlet-card" data-id="${o.id}">
          <div class="outlet-card__logo">${o.logo ? `<img src="${esc(o.logo)}" alt="${esc(o.name)}">` : `<span class="outlet-card__init">${esc((o.name || '?').charAt(0).toUpperCase())}</span>`}</div>
          <div class="outlet-card__b">
            <span class="outlet-card__name">${esc(o.name)}</span>
            ${o.url ? `<a href="${esc(o.url)}" target="_blank" rel="noopener" class="outlet-card__url">${esc(o.url.replace(/^https?:\/\//, ''))}</a>` : '<span class="outlet-card__url muted">Sin sitio web</span>'}
          </div>
          <div class="outlet-card__foot">
            <button class="icon-btn" data-out-edit="${o.id}" title="Editar"><span data-ico="pencil"></span></button>
            <button class="icon-btn danger" data-out-del="${o.id}" title="Eliminar"><span data-ico="trash-2"></span></button>
          </div>
        </article>`).join('');
    }
    hydrate();
  }
  let outletLogoData = '';
  function openOutlet(id) {
    const o = id ? getOutlets().find(x => x.id === id) : null;
    $('#outletModalTitle').textContent = o ? 'Editar medio' : 'Nuevo medio';
    $('#ofId').value = o ? o.id : '';
    $('#ofName').value = o ? o.name : '';
    $('#ofUrl').value = o ? (o.url || '') : '';
    outletLogoData = o ? (o.logo || '') : '';
    const prev = $('#ofLogoPrev'), hint = $('#ofLogo').querySelector('.logo-drop__hint');
    if (outletLogoData) { prev.src = outletLogoData; prev.hidden = false; if (hint) hint.hidden = true; }
    else { prev.hidden = true; if (hint) hint.hidden = false; }
    const m = $('#outletModal'); m.classList.add('open'); m.setAttribute('aria-hidden', 'false'); hydrate();
  }
  $('#outletNew') && $('#outletNew').addEventListener('click', () => openOutlet(null));
  $('#ofLogo') && $('#ofLogo').addEventListener('click', () => $('#ofLogoFile').click());
  $('#ofLogoFile') && $('#ofLogoFile').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    outletLogoData = await fileToB64(f);
    const prev = $('#ofLogoPrev'), hint = $('#ofLogo').querySelector('.logo-drop__hint');
    prev.src = outletLogoData; prev.hidden = false; if (hint) hint.hidden = true;
  });
  $('#outletSave') && $('#outletSave').addEventListener('click', () => {
    const name = $('#ofName').value.trim();
    if (!name) { toast('Pon el nombre del medio', 'err'); return; }
    const outlets = getOutlets(); const id = $('#ofId').value;
    const data = { name, url: $('#ofUrl').value.trim(), logo: outletLogoData || '' };
    if (id) { const i = outlets.findIndex(x => x.id === id); if (i >= 0) outlets[i] = Object.assign(outlets[i], data); }
    else { data.id = uid(); outlets.push(data); }
    setOutlets(outlets); closeModal($('#outletModal')); renderOutlets(); toast('Medio guardado', 'ok');
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
  function populateOutletSelect() {
    const sel = $('#jfOutlet'); if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = '<option value="">— Medio —</option>' + getOutlets().map(o => `<option value="${esc(o.id)}">${esc(o.name)}</option>`).join('');
    sel.value = cur;
  }
  function outletNameById(id) { const o = getOutlets().find(x => x.id === id); return o ? o.name : ''; }
  function renderJournalists() {
    const js = getJournalists(), grid = $('#journalistGrid');
    if (!js.length) {
      grid.innerHTML = `<div class="news-empty"><span data-ico="users" data-ico-size="42"></span><p>No hay redactores todavía.<br>Añade los contactos de prensa.</p></div>`;
    } else {
      grid.innerHTML = js.map(j => `
        <article class="journalist-card" data-id="${j.id}">
          <div class="journalist-card__photo">${j.photo ? `<img src="${esc(j.photo)}" alt="${esc(j.name)}">` : `<span class="journalist-card__init">${esc((j.name || '?').charAt(0).toUpperCase())}</span>`}</div>
          <div class="journalist-card__b">
            <span class="journalist-card__name">${esc(j.name)}</span>
            <span class="journalist-card__role">${esc([j.role, outletNameById(j.outlet) || j.outletName].filter(Boolean).join(' · '))}</span>
            ${j.email ? `<a href="mailto:${esc(j.email)}" class="journalist-card__email">${esc(j.email)}</a>` : ''}
            ${j.phone ? `<span class="journalist-card__phone">${esc(j.phone)}</span>` : ''}
          </div>
          <div class="journalist-card__foot">
            <button class="icon-btn" data-jour-edit="${j.id}" title="Editar"><span data-ico="pencil"></span></button>
            <button class="icon-btn danger" data-jour-del="${j.id}" title="Eliminar"><span data-ico="trash-2"></span></button>
          </div>
        </article>`).join('');
    }
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
    journalistPhotoData = j ? (j.photo || '') : '';
    const prev = $('#jfPhotoPrev'), hint = $('#jfPhoto').querySelector('.img-drop__hint');
    if (journalistPhotoData) { prev.src = journalistPhotoData; prev.hidden = false; if (hint) hint.hidden = true; }
    else { prev.hidden = true; if (hint) hint.hidden = false; }
    const m = $('#journalistModal'); m.classList.add('open'); m.setAttribute('aria-hidden', 'false'); hydrate();
  }
  $('#journalistNew') && $('#journalistNew').addEventListener('click', () => openJournalist(null));
  $('#jfPhoto') && $('#jfPhoto').addEventListener('click', () => $('#jfPhotoFile').click());
  $('#jfPhotoFile') && $('#jfPhotoFile').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    journalistPhotoData = await fileToB64(f);
    const prev = $('#jfPhotoPrev'), hint = $('#jfPhoto').querySelector('.img-drop__hint');
    prev.src = journalistPhotoData; prev.hidden = false; if (hint) hint.hidden = true;
  });
  $('#journalistSave') && $('#journalistSave').addEventListener('click', () => {
    const name = $('#jfName').value.trim();
    if (!name) { toast('Pon el nombre del redactor', 'err'); return; }
    const js = getJournalists(); const id = $('#jfId').value;
    const data = {
      name, role: $('#jfRole').value.trim(), outlet: $('#jfOutlet').value,
      outletName: outletNameById($('#jfOutlet').value), email: $('#jfEmail').value.trim(),
      phone: $('#jfPhone').value.trim(), photo: journalistPhotoData || '',
    };
    if (id) { const i = js.findIndex(x => x.id === id); if (i >= 0) js[i] = Object.assign(js[i], data); }
    else { data.id = uid(); js.push(data); }
    setJournalists(js); closeModal($('#journalistModal')); renderJournalists(); toast('Redactor guardado', 'ok');
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
  function renderConsultas() {
    const msgs = getMsgs().slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    $('#msgCount').textContent = msgs.length;
    const box = $('#inbox');
    if (!msgs.length) { box.innerHTML = `<div class="news-empty"><span data-ico="inbox" data-ico-size="42"></span><p>No hay consultas todavía.</p></div>`; hydrate(); refreshBadges(); return; }
    box.innerHTML = msgs.map(m => `
      <div class="msg ${m.read ? '' : 'is-unread'}" data-id="${m.id}">
        <div class="msg__av">${esc((m.name || '?').charAt(0).toUpperCase())}</div>
        <div class="msg__main">
          <div class="msg__top">
            <span class="msg__from">${esc(m.name || 'Anónimo')}</span>
            <span class="msg__email">${esc(m.email || '')}</span>
            <span class="msg__date">${esc(m.date ? new Date(m.date).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '')}</span>
          </div>
          <p class="msg__txt">${esc(m.message || '')}</p>
        </div>
        <button class="icon-btn danger" data-del-msg="${m.id}" title="Eliminar"><span data-ico="trash-2"></span></button>
      </div>`).join('');
    hydrate(); refreshBadges();
  }
  $('#inbox').addEventListener('click', e => {
    const d = e.target.closest('[data-del-msg]');
    if (d) { setMsgs(getMsgs().filter(x => x.id !== d.dataset.delMsg)); renderConsultas(); return; }
    const row = e.target.closest('.msg'); if (row && row.classList.contains('is-unread')) { const msgs = getMsgs(); const m = msgs.find(x => x.id === row.dataset.id); if (m) { m.read = true; setMsgs(msgs); renderConsultas(); } }
  });
  $('#msgDemo').addEventListener('click', () => {
    const msgs = getMsgs();
    msgs.push({ id: uid(), name: 'Importador Demo', email: 'compras@ejemplo.com', message: 'Buenos días, nos interesa el langostino HOSO L1 para exportación a Europa. ¿Podrían enviarnos lista de precios y disponibilidad?', date: new Date().toISOString(), read: false });
    setMsgs(msgs); renderConsultas(); toast('Consulta de ejemplo añadida');
  });

  // ============ SUSCRIPTORES ============
  let subsFilter = '';
  function renderSuscriptores() {
    const all = getSubs().slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const q = subsFilter.trim().toLowerCase();
    const subs = q ? all.filter(s => [s.email, s.name, s.source].filter(Boolean).some(t => t.toLowerCase().includes(q))) : all;
    $('#subsCount').textContent = all.length;
    const box = $('#subsList');
    if (!subs.length) {
      box.innerHTML = `<div class="news-empty"><span data-ico="at-sign" data-ico-size="42"></span><p>${q ? 'Sin resultados para tu búsqueda.' : 'No hay suscriptores todavía.<br>Se añaden desde el formulario de la web.'}</p></div>`;
    } else {
      box.innerHTML = `
        <table class="subs-table">
          <thead><tr><th>Correo</th><th>Nombre</th><th>Fecha</th><th>Origen</th><th></th></tr></thead>
          <tbody>
          ${subs.map(s => `
            <tr data-id="${s.id}">
              <td class="subs-table__email">${esc(s.email)}</td>
              <td>${esc(s.name || '—')}</td>
              <td>${esc(s.date ? new Date(s.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : '')}</td>
              <td><span class="subs-tag">${esc(s.source || 'web')}</span></td>
              <td><button class="icon-btn danger" data-sub-del="${s.id}" title="Eliminar"><span data-ico="trash-2"></span></button></td>
            </tr>`).join('')}
          </tbody>
        </table>`;
    }
    refreshBadges();
    hydrate();
  }
  $('#subsSearch') && $('#subsSearch').addEventListener('input', e => { subsFilter = e.target.value; renderSuscriptores(); });
  $('#subsList') && $('#subsList').addEventListener('click', async e => {
    const d = e.target.closest('[data-sub-del]'); if (!d) return;
    if (!await confirmDialog('Eliminar suscriptor', '¿Eliminar este contacto de la base de datos?')) return;
    setSubs(getSubs().filter(x => x.id !== d.dataset.subDel)); renderSuscriptores(); toast('Suscriptor eliminado');
  });
  $('#subsAdd') && $('#subsAdd').addEventListener('click', () => {
    const email = prompt('Correo del nuevo suscriptor:');
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { toast('Correo no válido', 'err'); return; }
    const name = prompt('Nombre (opcional):') || '';
    const subs = getSubs();
    subs.push({ id: uid(), email: email.trim(), name: name.trim(), date: new Date().toISOString(), source: 'manual' });
    setSubs(subs); renderSuscriptores(); toast('Suscriptor añadido', 'ok');
  });
  $('#subsDemo') && $('#subsDemo').addEventListener('click', () => {
    const samples = [
      { email: 'redaccion@lanacion.com.ar', name: 'Redacción La Nación', source: 'prensa' },
      { email: 'compras@mariscoseuropa.es', name: 'Mariscos Europa', source: 'boletín' },
      { email: 'ana.perez@gmail.com', name: 'Ana Pérez', source: 'web' },
    ];
    const pick = samples[Math.floor(Math.random() * samples.length)];
    const subs = getSubs();
    subs.push(Object.assign({ id: uid(), date: new Date().toISOString() }, pick));
    setSubs(subs); renderSuscriptores(); toast('Alta simulada añadida');
  });
  $('#subsExport') && $('#subsExport').addEventListener('click', () => {
    const subs = getSubs();
    if (!subs.length) { toast('No hay suscriptores que exportar', 'err'); return; }
    const head = ['email', 'nombre', 'fecha', 'origen'];
    const rows = subs.map(s => [s.email || '', s.name || '', s.date || '', s.source || ''].map(v => '"' + String(v).replace(/"/g, '""') + '"').join(','));
    const csv = head.join(',') + '\n' + rows.join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'cabo-virgenes-suscriptores.csv'; a.click();
    toast('CSV exportado', 'ok');
  });

  // ============ EMPLEO ============
  let empTab = 'ofertas';
  let appFilterJob = '';
  function renderEmpleo() {
    const s = getSettings();
    $('#jobsEnabled').checked = !!s.jobsEnabled;
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
      grid.innerHTML = jobs.map(j => `
        <article class="job-card ${j.status}" data-id="${j.id}">
          <div class="job-card__head">
            <span class="job-card__status ${j.status}">${j.status === 'open' ? 'Abierta' : 'Cerrada'}</span>
            ${j.type ? `<span class="job-card__type">${esc(JOB_TYPES[j.type] || j.type)}</span>` : ''}
          </div>
          <h3 class="job-card__title">${esc(j.title)}</h3>
          <div class="job-card__meta">
            ${j.area ? `<span><span data-ico="tag" data-ico-size="14"></span> ${esc(j.area)}</span>` : ''}
            ${j.location ? `<span><span data-ico="home" data-ico-size="14"></span> ${esc(j.location)}</span>` : ''}
          </div>
          <p class="job-card__summary">${esc(j.summary || '')}</p>
          <div class="job-card__foot">
            <button class="icon-btn" data-job-edit="${j.id}" title="Editar"><span data-ico="pencil"></span></button>
            <button class="icon-btn" data-job-toggle="${j.id}" title="${j.status === 'open' ? 'Cerrar oferta' : 'Reabrir oferta'}"><span data-ico="${j.status === 'open' ? 'eye-off' : 'eye'}"></span></button>
            <button class="icon-btn danger" data-job-del="${j.id}" title="Eliminar" style="margin-left:auto"><span data-ico="trash-2"></span></button>
          </div>
        </article>`).join('');
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
      summary: $('#jbSummary').value.trim(), body: $('#jbBody').value.trim(),
    };
    if (id) { const i = jobs.findIndex(x => x.id === id); if (i >= 0) jobs[i] = Object.assign(jobs[i], data); }
    else { data.id = uid(); data.date = new Date().toISOString(); jobs.push(data); }
    setJobs(jobs); closeModal($('#jobModal')); renderJobs(); toast('Oferta guardada', 'ok');
  });
  $('#jobGrid') && $('#jobGrid').addEventListener('click', async e => {
    const ed = e.target.closest('[data-job-edit]'); if (ed) return openJob(ed.dataset.jobEdit);
    const tg = e.target.closest('[data-job-toggle]');
    if (tg) {
      const jobs = getJobs(); const j = jobs.find(x => x.id === tg.dataset.jobToggle);
      if (j) { j.status = j.status === 'open' ? 'closed' : 'open'; setJobs(jobs); renderJobs(); toast(j.status === 'open' ? 'Oferta reabierta' : 'Oferta cerrada'); }
      return;
    }
    const dl = e.target.closest('[data-job-del]');
    if (dl) {
      if (!await confirmDialog('Eliminar oferta', '¿Eliminar esta oferta de empleo?')) return;
      setJobs(getJobs().filter(x => x.id !== dl.dataset.jobDel));
      renderJobs(); toast('Oferta eliminada');
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
  function renderApps() {
    populateAppFilter();
    const all = getApps().slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const apps = appFilterJob ? all.filter(a => a.jobId === appFilterJob) : all;
    $('#appCount').textContent = apps.length;
    const ac = $('#appsCount');
    const newCount = getApps().filter(a => !a.read).length;
    if (ac) { ac.hidden = newCount === 0; ac.textContent = newCount; }
    const box = $('#appList');
    if (!apps.length) {
      box.innerHTML = `<div class="news-empty"><span data-ico="inbox" data-ico-size="42"></span><p>No hay candidaturas todavía.</p></div>`;
    } else {
      box.innerHTML = apps.map(a => `
        <div class="app-row ${a.read ? '' : 'is-unread'}" data-id="${a.id}">
          <div class="app-row__av">${esc((a.name || '?').charAt(0).toUpperCase())}</div>
          <div class="app-row__main">
            <div class="app-row__top">
              <span class="app-row__name">${esc(a.name || 'Candidato')}</span>
              <span class="app-row__job">${esc(jobTitleById(a.jobId))}</span>
              <span class="app-row__date">${esc(a.date ? new Date(a.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : '')}</span>
            </div>
            <span class="app-row__email">${esc(a.email || '')}</span>
          </div>
          <button class="icon-btn app-row__open" data-app-open="${a.id}" title="Ver candidatura"><span data-ico="external-link"></span></button>
        </div>`).join('');
    }
    refreshBadges();
    hydrate();
  }
  $('#appFilter') && $('#appFilter').addEventListener('change', e => { appFilterJob = e.target.value; renderApps(); });
  function openApplication(id) {
    const apps = getApps(); const a = apps.find(x => x.id === id); if (!a) return;
    if (!a.read) { a.read = true; setApps(apps); }
    $('#apName').textContent = a.name || '—';
    $('#apEmail').textContent = a.email || '—';
    $('#apPhone').textContent = a.phone || '—';
    $('#apJob').textContent = jobTitleById(a.jobId);
    $('#apMessage').textContent = a.message || '—';
    const wrap = $('#apCvWrap'), cv = $('#apCv');
    if (a.cv) { wrap.hidden = false; cv.innerHTML = `<a href="${esc(a.cv)}" target="_blank" rel="noopener" class="btn btn--ghost btn--sm"><span class="ar" data-ico="file-text"></span> Ver / descargar CV</a>`; }
    else { wrap.hidden = true; cv.innerHTML = '—'; }
    $('#appDelete').dataset.id = id;
    const m = $('#applicationModal'); m.classList.add('open'); m.setAttribute('aria-hidden', 'false');
    renderApps(); hydrate();
  }
  $('#appList') && $('#appList').addEventListener('click', e => {
    const op = e.target.closest('[data-app-open]'); if (op) return openApplication(op.dataset.appOpen);
    const row = e.target.closest('.app-row'); if (row) return openApplication(row.dataset.id);
  });
  $('#appDelete') && $('#appDelete').addEventListener('click', async e => {
    const id = e.currentTarget.dataset.id; if (!id) return;
    if (!await confirmDialog('Eliminar candidatura', '¿Eliminar esta candidatura definitivamente?')) return;
    setApps(getApps().filter(x => x.id !== id)); closeModal($('#applicationModal')); renderApps(); toast('Candidatura eliminada');
  });

  // ============ AJUSTES ============
  function renderAjustes() {
    const s = getSettings();
    $('#newsEnabled2').checked = s.newsEnabled;
    $('#setEmail').value = s.email || ''; $('#setPhone').value = s.phone || '';
    hydrate();
  }
  $('#newsEnabled2').addEventListener('change', e => { setNewsEnabled(e.target.checked); });
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
  const LEGAL_IDS = { privacidad: 'modal-legal-privacidad', terminos: 'modal-legal-terminos', cookies: 'modal-legal-cookies', aviso: 'modal-legal-aviso' };
  let legalDefaults = null, legalBuf = null, legalKey = 'privacidad';
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
  async function renderLegales() {
    const def = await loadLegalDefaults();
    if (!legalBuf) legalBuf = Object.assign({}, def, read(K.legal, {}));
    $('#legalArea').value = legalBuf[legalKey] || '';
  }
  $('#legalArea').addEventListener('input', e => { if (legalBuf) legalBuf[legalKey] = e.target.value; });
  document.addEventListener('click', e => {
    const t = e.target.closest('#legalTabs [data-legal]'); if (!t) return;
    if (legalBuf) legalBuf[legalKey] = $('#legalArea').value;
    legalKey = t.dataset.legal;
    $$('#legalTabs [data-legal]').forEach(b => b.classList.toggle('is-active', b === t));
    $('#legalArea').value = (legalBuf && legalBuf[legalKey]) || '';
  });
  $('#legalSave').addEventListener('click', () => {
    if (legalBuf) legalBuf[legalKey] = $('#legalArea').value;
    write(K.legal, legalBuf || {});
    logAudit('legal', legalKey, '', 'Editado');
    toast('Documentos legales guardados', 'ok');
  });
  $('#legalReset').addEventListener('click', () => {
    if (!legalDefaults || !legalBuf) return;
    legalBuf[legalKey] = legalDefaults[legalKey]; $('#legalArea').value = legalDefaults[legalKey] || ''; toast('Restaurado al original');
  });

  // ============ INIT ============
  bindPageDnd();
  if (isAuthed()) showApp(); else showLogin();
  document.body.classList.remove('is-loading');
  refreshBadges();
  hydrate();
})();
