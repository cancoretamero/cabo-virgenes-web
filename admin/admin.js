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
  const K = { auth: 'cv_admin_auth', news: 'cv_news', settings: 'cv_settings', team: 'cv_team', msgs: 'cv_consultas', legal: 'cv_legal' };
  const read = (k, def) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; } catch { return def; } };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  const DEFAULT_TEAM = [
    { key: 'basavilbaso', name: 'Juan Pablo Basavilbaso', role: 'Gerente General', img: '../team-1.jpg', bio: 'Contador Público con más de 20 años en la industria pesquera argentina. Conduce la estrategia y la operación de Cabo Vírgenes.' },
    { key: 'regueiro', name: 'Matías Regueiro', role: 'Gerente de Operaciones', img: '../team-2.jpg', bio: 'Responsable de la operación pesquera e industrial: flota, plantas y cadena de frío, de la captura al producto terminado.' },
    { key: 'abizeid', name: 'Diego Abizeid', role: 'Gerente de Administración y Finanzas', img: '../team-3.jpg', bio: 'Conduce la administración, las finanzas y el control de gestión que sostienen la inversión en flota y plantas.' },
    { key: 'tamagnini', name: 'Romina Tamagnini', role: 'Gerente de Recursos Humanos', img: '../team-4.jpg', bio: 'Lidera la gestión de personas: talento, seguridad y cultura de trabajo en Argentina y España.' },
    { key: 'ortiz', name: 'Gastón Ortiz', role: 'Gerente Comercial', img: '../team-5.jpg', bio: 'Dirige la estrategia comercial y la exportación del langostino austral a más de 40 países.' },
    { key: 'iglesias', name: 'Antonio Iglesias', role: 'Gerente España', img: '../team-6.jpg', bio: 'Responsable de la plataforma de España (Palencia): valor agregado, logística y distribución.' },
  ];
  const SAMPLE_NEWS = [
    { title: 'Cabo Vírgenes se incorpora a AISA Group', excerpt: 'La pesquera refuerza su posicionamiento internacional al integrarse al holding AISA Group, consolidando su estructura binacional Argentina–España.', category: 'Corporativo', date: '2025-01-15', status: 'published', image: '../esp-1.jpg' },
    { title: 'Arranca la temporada de langostino austral', excerpt: 'La flota inicia operaciones en el Atlántico Sudoccidental (FAO 41) con buenas previsiones de captura para la nueva campaña.', category: 'Flota', date: '2026-03-03', status: 'published', image: '../esmeralda-2.jpg' },
    { title: 'Avances hacia la certificación MSC', excerpt: 'Cabo Vírgenes continúa el proceso de certificación de pesquería sostenible y refuerza su programa ambiental junto a RASA.', category: 'Sostenibilidad', date: '2026-05-20', status: 'draft', image: '../rasa-salicornias.jpg' },
  ];

  const getNews = () => read(K.news, []);
  const setNews = (v) => write(K.news, v);
  const getSettings = () => Object.assign({ newsEnabled: false, email: 'comercial@cabovirgenes.com', phone: '+54 280 4495000' }, read(K.settings, {}));
  const setSettings = (v) => write(K.settings, v);
  const getTeam = () => { const ov = read(K.team, {}); return DEFAULT_TEAM.map(m => Object.assign({}, m, ov[m.key] || {})); };
  const getMsgs = () => read(K.msgs, []);
  const setMsgs = (v) => write(K.msgs, v);
  const uid = () => 'n' + Math.abs(Date.now() % 1e9).toString(36) + Math.floor(performance.now()).toString(36);

  // ---------- UI helpers ----------
  const toastEl = $('#toast');
  let toastT;
  function toast(msg, kind) {
    toastEl.textContent = msg; toastEl.className = 'toast show' + (kind ? ' ' + kind : '');
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2400);
  }
  const fmtDate = (s) => { if (!s) return ''; const d = new Date(s + 'T00:00:00'); if (isNaN(d)) return s; return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }); };
  const esc = (s) => (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const hydrate = () => { if (window.cvIcons) window.cvIcons(); };

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
  const TITLES = { inicio: 'Inicio', edicion: 'Edición visual', noticias: 'Noticias', equipo: 'Equipo', legales: 'Legales', consultas: 'Consultas', ajustes: 'Ajustes' };
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
    else if (v === 'ajustes') renderAjustes();
    hydrate();
  }

  // sidebar toggle (móvil)
  $('#menuToggle').addEventListener('click', () => appEl.classList.toggle('side-open'));
  $('#sideBack').addEventListener('click', () => appEl.classList.remove('side-open'));

  function refreshBadges() {
    const drafts = getNews().filter(n => n.status === 'draft').length;
    const nb = $('#newsBadge'); nb.hidden = drafts === 0; nb.textContent = drafts;
    const unread = getMsgs().filter(m => !m.read).length;
    const mb = $('#msgBadge'); mb.hidden = unread === 0; mb.textContent = unread;
  }

  // ============ INICIO ============
  function renderInicio() {
    const news = getNews(), pub = news.filter(n => n.status === 'published').length;
    const s = getSettings(), msgs = getMsgs();
    $('#kpis').innerHTML = [
      ['newspaper', news.length, 'Noticias'],
      ['check-circle', pub, 'Publicadas'],
      ['mail', msgs.filter(m => !m.read).length, 'Consultas sin leer'],
      ['users', getTeam().length, 'Equipo directivo'],
    ].map(([ic, n, l]) => `<div class="kpi"><span class="kpi__ic" data-ico="${ic}"></span><div class="kpi__n">${n}</div><div class="kpi__l">${l}</div></div>`).join('');
    $('#quickLinks').innerHTML = [
      ['#/noticias', 'plus', 'Crear noticia', 'Publica novedades'],
      ['#/noticias', 'newspaper', 'Gestionar noticias', 'Editar / ordenar'],
      ['#/equipo', 'users', 'Editar equipo', 'Cargos y bios'],
      ['#/ajustes', 'settings', 'Ajustes', 'Publicar / exportar'],
    ].map(([h, ic, t, sub]) => `<a href="${h}"><span class="quick__ic" data-ico="${ic}"></span><span><span class="quick__t">${t}</span><br><span class="quick__s">${sub}</span></span></a>`).join('');
    $('#siteStatus').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span style="font-weight:600">Sección de Noticias</span>
          <span class="ntb__state ${s.newsEnabled ? 'on' : 'off'}">${s.newsEnabled ? 'Visible' : 'Oculta'}</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span style="font-weight:600">Noticias publicadas</span><span class="mono">${pub}</span>
        </div>
        <a href="../" target="_blank" rel="noopener" class="btn btn--ghost btn--sm" style="align-self:flex-start;margin-top:4px"><span class="ar" data-ico="external-link"></span> Abrir sitio público</a>
      </div>`;
    hydrate();
  }

  // ============ NOTICIAS ============
  function renderNoticias() {
    const news = getNews().slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (b.date || '').localeCompare(a.date || ''));
    $('#newsCount').textContent = news.length;
    const s = getSettings();
    syncNewsToggle(s.newsEnabled);
    const grid = $('#newsGrid');
    if (!news.length) {
      grid.innerHTML = `<div class="news-empty"><span data-ico="newspaper" data-ico-size="42"></span><p>Todavía no hay noticias.<br>Crea la primera o añade ejemplos.</p></div>`;
    } else {
      grid.innerHTML = news.map(n => `
        <article class="ncard" data-id="${n.id}">
          <div class="ncard__img" style="${n.image ? `background-image:url('${esc(n.image)}')` : ''}">
            <div class="ncard__badges"><span class="ncard__status ${n.status}">${n.status === 'published' ? 'Publicada' : 'Borrador'}</span></div>
            ${n.category ? `<span class="ncard__cat">${esc(n.category)}</span>` : ''}
          </div>
          <div class="ncard__body">
            <span class="ncard__date">${fmtDate(n.date)}</span>
            <h3 class="ncard__title">${esc(n.title)}</h3>
            <p class="ncard__ex">${esc(n.excerpt || '')}</p>
            <div class="ncard__foot">
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
    const s = getSettings(); s.newsEnabled = on; setSettings(s);
    syncNewsToggle(on);
    const e2 = $('#newsEnabled2'); if (e2) e2.checked = on;
    toast(on ? 'Sección de Noticias activada en la web' : 'Sección de Noticias oculta', 'ok');
  }
  $('#newsEnabled').addEventListener('change', e => setNewsEnabled(e.target.checked));
  $('#newsSeed').addEventListener('click', () => {
    const news = getNews();
    const base = news.length;
    SAMPLE_NEWS.forEach((n, i) => news.push(Object.assign({ id: uid(), order: base + i }, n)));
    setNews(news); renderNoticias(); toast('Noticias de ejemplo añadidas', 'ok');
  });

  // ---- Modal noticia ----
  const newsModal = $('#newsModal');
  function openNews(id) {
    const n = id ? getNews().find(x => x.id === id) : null;
    $('#newsModalTitle').textContent = n ? 'Editar noticia' : 'Nueva noticia';
    $('#nfId').value = n ? n.id : '';
    $('#nfTitle').value = n ? n.title : '';
    $('#nfExcerpt').value = n ? (n.excerpt || '') : '';
    $('#nfBody').value = n ? (n.body || '') : '';
    $('#nfCat').value = n ? (n.category || 'Corporativo') : 'Corporativo';
    $('#nfStatus').value = n ? n.status : 'published';
    $('#nfDate').value = n ? (n.date || '') : new Date().toISOString().slice(0, 10);
    setImgPrev(n ? n.image : '');
    newsModal.classList.add('open'); newsModal.setAttribute('aria-hidden', 'false');
    hydrate();
  }
  function setImgPrev(src) {
    const prev = $('#nfImgPrev'), hint = $('#nfImgHint');
    if (src) { prev.src = src; prev.hidden = false; hint.hidden = true; prev.dataset.src = src; }
    else { prev.hidden = true; hint.hidden = false; prev.dataset.src = ''; }
  }
  function closeModal(m) { m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); }
  $$('[data-close-modal]').forEach(b => b.addEventListener('click', () => closeModal(b.closest('.modal'))));
  $('#newsNew').addEventListener('click', () => openNews(null));
  $('#nfImgDrop').addEventListener('click', () => $('#nfImgFile').click());
  $('#nfImgFile').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => setImgPrev(r.result); r.readAsDataURL(f);
  });
  $('#newsSave').addEventListener('click', () => {
    const title = $('#nfTitle').value.trim();
    if (!title) { toast('Pon un título', 'err'); return; }
    const news = getNews();
    const id = $('#nfId').value;
    const data = {
      title, excerpt: $('#nfExcerpt').value.trim(), body: $('#nfBody').value.trim(),
      category: $('#nfCat').value, status: $('#nfStatus').value, date: $('#nfDate').value,
      image: $('#nfImgPrev').dataset.src || '',
    };
    if (id) { const i = news.findIndex(x => x.id === id); if (i >= 0) news[i] = Object.assign(news[i], data); }
    else { data.id = uid(); data.order = news.length; news.push(data); }
    setNews(news); closeModal(newsModal); renderNoticias(); toast('Noticia guardada', 'ok');
  });
  // delegación en el grid
  $('#newsGrid').addEventListener('click', e => {
    const ed = e.target.closest('[data-edit]'); if (ed) return openNews(ed.dataset.edit);
    const tg = e.target.closest('[data-toggle]');
    if (tg) { const news = getNews(); const n = news.find(x => x.id === tg.dataset.toggle); if (n) { n.status = n.status === 'published' ? 'draft' : 'published'; setNews(news); renderNoticias(); toast(n.status === 'published' ? 'Publicada' : 'Pasada a borrador'); } return; }
    const dl = e.target.closest('[data-del]');
    if (dl) { if (!confirm('¿Eliminar esta noticia?')) return; setNews(getNews().filter(x => x.id !== dl.dataset.del)); renderNoticias(); toast('Noticia eliminada'); }
  });

  // ============ EQUIPO ============
  function renderEquipo() {
    $('#teamAdmin').innerHTML = getTeam().map(m => `
      <div class="tmember" data-key="${m.key}">
        <div class="tmember__img" style="background-image:url('${esc(m.img)}')"></div>
        <div class="tmember__b">
          <span class="tmember__role">${esc(m.role)}</span>
          <span class="tmember__name">${esc(m.name)}</span>
          <button class="btn btn--ghost btn--sm" data-edit-team="${m.key}" style="margin-top:4px"><span class="ar" data-ico="pencil"></span> Editar</button>
        </div>
      </div>`).join('');
    hydrate();
  }
  const teamModal = $('#teamModal');
  $('#teamAdmin').addEventListener('click', e => {
    const b = e.target.closest('[data-edit-team]'); if (!b) return;
    const m = getTeam().find(x => x.key === b.dataset.editTeam);
    $('#tfKey').value = m.key; $('#tfName').value = m.name; $('#tfRole').value = m.role; $('#tfBio').value = m.bio || '';
    teamModal.classList.add('open'); teamModal.setAttribute('aria-hidden', 'false'); hydrate();
  });
  $('#teamSave').addEventListener('click', () => {
    const ov = read(K.team, {}); const key = $('#tfKey').value;
    ov[key] = { name: $('#tfName').value.trim(), role: $('#tfRole').value.trim(), bio: $('#tfBio').value.trim() };
    write(K.team, ov); closeModal(teamModal); renderEquipo(); toast('Directivo actualizado', 'ok');
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
    const data = { news: getNews(), settings: getSettings(), team: read(K.team, {}), exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'cabo-virgenes-contenido.json'; a.click();
    toast('Contenido exportado', 'ok');
  });
  $('#importBtn').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => {
      try { const d = JSON.parse(r.result); if (d.news) setNews(d.news); if (d.settings) setSettings(d.settings); if (d.team) write(K.team, d.team); route(); toast('Contenido importado', 'ok'); }
      catch { toast('Archivo no válido', 'err'); }
    }; r.readAsText(f);
  });
  $('#resetBtn').addEventListener('click', () => {
    if (!confirm('¿Restablecer todo el contenido del admin? (noticias, ajustes y equipo en este navegador)')) return;
    [K.news, K.settings, K.team, K.msgs].forEach(k => localStorage.removeItem(k));
    route(); toast('Contenido restablecido');
  });

  // ============ EDICIÓN VISUAL ============
  let editLoaded = false;
  function renderEdicion() {
    const frame = $('#siteFrame');
    if (!editLoaded) { frame.src = '../?editor=1'; editLoaded = true; }
  }
  document.addEventListener('click', e => {
    const d = e.target.closest('#view-edicion [data-device]'); if (!d) return;
    $$('#view-edicion [data-device]').forEach(b => b.classList.toggle('is-active', b === d));
    $('#editFrame').dataset.device = d.dataset.device;
  });
  $('#editReload').addEventListener('click', () => { $('#siteFrame').src = '../?editor=1&_=' + Date.now(); });
  $('#editSave').addEventListener('click', () => {
    const f = $('#siteFrame'); try { f.contentWindow.postMessage({ type: 'cv-save' }, '*'); } catch (_) {}
    toast('Cambios guardados', 'ok');
  });
  window.addEventListener('message', e => { if (e.data && e.data.type === 'cv-saved') toast('Cambios guardados', 'ok'); });

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
    write(K.legal, legalBuf || {}); toast('Documentos legales guardados', 'ok');
  });
  $('#legalReset').addEventListener('click', () => {
    if (!legalDefaults || !legalBuf) return;
    legalBuf[legalKey] = legalDefaults[legalKey]; $('#legalArea').value = legalDefaults[legalKey] || ''; toast('Restaurado al original');
  });

  // ============ INIT ============
  if (isAuthed()) showApp(); else showLogin();
  document.body.classList.remove('is-loading');
  hydrate();
})();
