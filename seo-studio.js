/* ============================================================
   SEO STUDIO — editor visual de SEO (modo ?seo=1)
   Menú flotante que: (1) escanea TODA la página, (2) la analiza con IA,
   (3) muestra cada mejora con visor ANTES/DESPUÉS (slider), (4) aplica y
   publica en vivo (vía /api/seo + edge function), sin tocar código.
   ============================================================ */
(function () {
  var params = new URLSearchParams(location.search);
  if (params.get('seo') !== '1') return;

  var KEY_LS = 'cv_seo_key';
  function getKey() { try { return sessionStorage.getItem(KEY_LS) || localStorage.getItem(KEY_LS) || ''; } catch (e) { return ''; } }
  function setKey(k) { try { sessionStorage.setItem(KEY_LS, k); } catch (e) {} }

  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var norm = function (s) { return String(s || '').replace(/\s+/g, ' ').trim(); };

  // ---- estado ----
  var findings = [];          // hallazgos de la IA
  var applied = {};           // index -> true (aplicados)
  var pending = { title: null, description: null, altOverrides: {}, textOverrides: [] };
  var current = null;         // config SEO actual (cargada)

  // ============ ESTILOS ============
  var css = document.createElement('style');
  css.textContent = [
    '.seos{position:fixed;top:0;right:0;bottom:0;width:min(420px,94vw);z-index:99999;display:flex;flex-direction:column;',
    'background:linear-gradient(180deg,rgba(9,22,44,.98),rgba(5,14,30,.99));color:#e8eef5;',
    'box-shadow:-20px 0 60px -20px rgba(0,0,0,.6);border-left:1px solid rgba(127,227,223,.18);',
    'font-family:Inter,system-ui,sans-serif;transition:transform .3s}',
    '.seos.min{transform:translateX(calc(100% - 52px))}',
    '.seos__bar{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.08);flex:0 0 auto}',
    '.seos__bar b{font-family:Fraunces,serif;font-weight:500;font-size:17px;flex:1}',
    '.seos__chip{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#7fe3df;background:rgba(28,181,176,.14);padding:4px 9px;border-radius:100px}',
    '.seos__ico{width:30px;height:30px;border:1px solid rgba(255,255,255,.14);border-radius:8px;background:rgba(255,255,255,.04);color:#cfe0ee;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px}',
    '.seos__ico:hover{background:rgba(255,255,255,.1)}',
    '.seos__body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}',
    '.seos__intro{font-size:12.5px;line-height:1.55;color:#aebfd0}',
    '.seos__intro b{color:#fff}',
    '.seos__btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:12px;border-radius:11px;border:0;cursor:pointer;font-weight:600;font-size:14px}',
    '.seos__btn--main{background:linear-gradient(135deg,#1cb5b0,#159c97);color:#06182f}',
    '.seos__btn--main:hover{filter:brightness(1.06)}',
    '.seos__btn--pub{background:#e9b048;color:#3a2a06}',
    '.seos__btn[disabled]{opacity:.55;cursor:default}',
    '.seos__pass{display:flex;gap:8px}',
    '.seos__pass input{flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:9px;color:#fff;padding:10px;font-size:13px}',
    '.seos__sum{display:flex;gap:8px;flex-wrap:wrap;font-size:11px}',
    '.seos__sum span{padding:4px 9px;border-radius:100px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)}',
    '.seos__sum .s-alta{color:#ff9b8a;border-color:rgba(255,120,90,.3)}',
    '.seos__f{border:1px solid rgba(255,255,255,.1);border-radius:13px;overflow:hidden;background:rgba(255,255,255,.025)}',
    '.seos__f.is-applied{border-color:rgba(28,181,176,.5)}',
    '.seos__fh{display:flex;align-items:center;gap:8px;padding:11px 13px;cursor:pointer}',
    '.seos__sev{width:8px;height:8px;border-radius:50%;flex:0 0 auto}',
    '.seos__sev.alta{background:#ff7b5a}.seos__sev.media{background:#e9b048}.seos__sev.baja{background:#7fe3df}',
    '.seos__ft{flex:1;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9fb3c8}',
    '.seos__fd{padding:0 13px 13px;display:none}',
    '.seos__f.open .seos__fd{display:block}',
    '.seos__reason{font-size:12px;color:#9fb3c8;margin:0 0 10px;line-height:1.5}',
    /* comparador antes/después */
    '.seos__cmp{position:relative;border-radius:10px;overflow:hidden;border:1px solid rgba(255,255,255,.12);user-select:none}',
    '.seos__cmp .lay{padding:12px 13px;font-size:13px;line-height:1.5}',
    '.seos__cmp .after{position:absolute;inset:0;background:linear-gradient(180deg,rgba(28,181,176,.14),rgba(28,181,176,.06));color:#eafaf7;overflow:hidden;white-space:nowrap}',
    '.seos__cmp .after .inner{width:var(--w,420px);padding:12px 13px;white-space:normal}',
    '.seos__cmp .before{background:rgba(255,255,255,.03);color:#c2d2e2}',
    '.seos__cmp .tag{position:absolute;top:7px;font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:2px 7px;border-radius:100px;z-index:3}',
    '.seos__cmp .tag-b{left:8px;background:rgba(0,0,0,.4);color:#cdd}',
    '.seos__cmp .tag-a{right:8px;background:#1cb5b0;color:#06182f}',
    '.seos__cmp .handle{position:absolute;top:0;bottom:0;left:50%;width:2px;background:#1cb5b0;z-index:4;cursor:ew-resize}',
    '.seos__cmp .handle::after{content:"⇆";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:26px;height:26px;border-radius:50%;background:#1cb5b0;color:#06182f;display:flex;align-items:center;justify-content:center;font-size:13px}',
    '.seos__fact{display:flex;gap:8px;margin-top:10px}',
    '.seos__fact button{flex:1;padding:8px;border-radius:9px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);color:#dce8f2;font-size:12px;font-weight:600;cursor:pointer}',
    '.seos__fact button.ap{background:rgba(28,181,176,.18);border-color:rgba(28,181,176,.5);color:#9ff0e3}',
    '.seos__fact button.ap:hover{background:rgba(28,181,176,.3)}',
    '.seos__fact button.un{color:#9fb3c8}',
    '.seos__foot{padding:14px 16px;border-top:1px solid rgba(255,255,255,.08);flex:0 0 auto;display:flex;flex-direction:column;gap:8px}',
    '.seos__note{font-size:11px;color:#8aa0b6;text-align:center}',
    '.seo-hl{outline:3px solid #1cb5b0 !important;outline-offset:2px;border-radius:4px;transition:outline .2s}',
    '.seos__tab{margin-left:46px}'
  ].join('');
  document.head.appendChild(css);

  // ============ PANEL ============
  var panel = document.createElement('div');
  panel.className = 'seos';
  panel.innerHTML =
    '<div class="seos__bar">' +
      '<button class="seos__ico" id="seosMin" title="Minimizar">‹</button>' +
      '<b>SEO Studio</b><span class="seos__chip">IA</span>' +
      '<a class="seos__ico" href="?" title="Salir" style="text-decoration:none">✕</a>' +
    '</div>' +
    '<div class="seos__body" id="seosBody"></div>' +
    '<div class="seos__foot" id="seosFoot"></div>';
  document.body.appendChild(panel);
  document.getElementById('seosMin').addEventListener('click', function () { panel.classList.toggle('min'); this.textContent = panel.classList.contains('min') ? '›' : '‹'; });

  var body = document.getElementById('seosBody');
  var foot = document.getElementById('seosFoot');

  // ============ ESCANEO DE LA PÁGINA ============
  function scanPage() {
    var pick = function (sel) { var e = document.querySelector(sel); return e ? norm(e.textContent) : ''; };
    var h1 = pick('main h1') || pick('h1');
    var headings = [].slice.call(document.querySelectorAll('main h2, main h3')).map(function (h) { return norm(h.textContent); }).filter(Boolean);
    var alts = [].slice.call(document.querySelectorAll('main img, header img, .footer-logo')).map(function (i) {
      return { src: i.getAttribute('src') || '', alt: i.getAttribute('alt') || '' };
    }).filter(function (a) { return a.src && !/^data:/.test(a.src); });
    // dedup por src
    var seen = {}; alts = alts.filter(function (a) { if (seen[a.src]) return false; seen[a.src] = 1; return true; });
    var leads = [].slice.call(document.querySelectorAll('main .lead, main .ship-desc, main .sec-head p, main .phc-body p, main .eyebrow + h2 + p')).map(function (p) { return norm(p.textContent); }).filter(function (t) { return t.length > 45; });
    leads = leads.filter(function (t, i) { return leads.indexOf(t) === i; }).slice(0, 12);
    return {
      url: location.href.split('?')[0],
      title: document.title,
      description: (document.querySelector('meta[name="description"]') || {}).content || '',
      h1: h1, headings: headings, alts: alts, leads: leads,
    };
  }

  // ============ API ============
  function api(method, payload) {
    var headers = { 'content-type': 'application/json' };
    var k = getKey(); if (k) headers['x-cabo-admin-token'] = k;
    return fetch('/api/seo', { method: method, headers: headers, body: payload ? JSON.stringify(payload) : undefined })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, status: r.status, data: d }; }); })
      .catch(function () { return { ok: false, status: 0, data: {} }; });
  }

  // ============ RENDER ============
  function renderIntro() {
    if (!getKey()) { renderPass(); return; }
    body.innerHTML =
      '<p class="seos__intro"><b>¿Qué hace esto?</b> La IA revisa <b>toda la página</b> (título, descripción, encabezados, textos y los <b>textos alternativos de las imágenes</b>) y propone mejoras de SEO. Verás cada cambio con un visor <b>antes/después</b> y decides cuáles aplicar. Al publicar, salen en la web real sin tocar código.</p>' +
      '<button class="seos__btn seos__btn--main" id="seosRun">✨ Analizar toda la página con IA</button>';
    document.getElementById('seosRun').addEventListener('click', runAudit);
    foot.innerHTML = '<p class="seos__note">Modo edición SEO · solo tú lo ves</p>';
  }

  function renderPass() {
    body.innerHTML =
      '<p class="seos__intro">Introduce la <b>contraseña del panel</b> para activar el editor de SEO.</p>' +
      '<div class="seos__pass"><input type="password" id="seosPass" placeholder="Contraseña"><button class="seos__btn seos__btn--main" style="width:auto;padding:10px 16px" id="seosPassBtn">Entrar</button></div>';
    var go = function () { var v = document.getElementById('seosPass').value.trim(); if (v) { setKey(v); renderIntro(); } };
    document.getElementById('seosPassBtn').addEventListener('click', go);
    document.getElementById('seosPass').addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
    foot.innerHTML = '';
  }

  function runAudit() {
    body.innerHTML = '<p class="seos__intro">Analizando toda la página con IA… <span class="seos__chip">~10s</span></p>';
    Promise.all([
      current ? Promise.resolve({ data: { config: current } }) : api('GET'),
      api('POST', { action: 'audit', page: scanPage() })
    ]).then(function (res) {
      current = (res[0].data && res[0].data.config) || current || {};
      pending.altOverrides = Object.assign({}, current.altOverrides || {});
      pending.textOverrides = (current.textOverrides || []).slice();
      var a = res[1];
      if (!a.ok) {
        if (a.status === 401 || a.status === 503) { try { sessionStorage.removeItem(KEY_LS); } catch (e) {} renderPass(); return; }
        body.innerHTML = '<p class="seos__intro">No se pudo analizar: ' + esc((a.data && a.data.message) || 'error') + '</p><button class="seos__btn seos__btn--main" id="seosRetry">Reintentar</button>';
        document.getElementById('seosRetry').addEventListener('click', runAudit); return;
      }
      findings = a.data.findings || []; applied = {};
      renderFindings();
    });
  }

  var TYPE_LABEL = { title: 'Meta título', description: 'Meta descripción', h1: 'Encabezado H1', heading: 'Encabezado', alt: 'Texto ALT (imagen)', content: 'Texto' };

  function renderFindings() {
    if (!findings.length) { body.innerHTML = '<p class="seos__intro">✓ La IA no encontró mejoras relevantes. ¡Buen SEO!</p>'; return; }
    var counts = { alta: 0, media: 0, baja: 0 }; findings.forEach(function (f) { counts[f.severity] = (counts[f.severity] || 0) + 1; });
    var html = '<div class="seos__sum"><span class="s-alta">' + counts.alta + ' prioridad alta</span><span>' + counts.media + ' media</span><span>' + counts.baja + ' baja</span></div>';
    findings.forEach(function (f, i) {
      html += '<div class="seos__f" data-i="' + i + '">' +
        '<div class="seos__fh"><span class="seos__sev ' + f.severity + '"></span><span class="seos__ft">' + esc(TYPE_LABEL[f.type] || f.type) + '</span><span class="seos__ico" style="width:24px;height:24px">▾</span></div>' +
        '<div class="seos__fd">' +
          '<p class="seos__reason">' + esc(f.reason) + '</p>' +
          cmpHtml(f) +
          '<div class="seos__fact"><button class="ap" data-ap="' + i + '">✓ Aplicar</button><button class="un" data-un="' + i + '">Descartar</button></div>' +
        '</div></div>';
    });
    body.innerHTML = html;
    wireFindings();
    renderFoot();
  }

  function cmpHtml(f) {
    return '<div class="seos__cmp" data-cmp>' +
      '<span class="tag tag-b">Antes</span><span class="tag tag-a">Después</span>' +
      '<div class="lay before">' + (esc(f.current) || '<i>(vacío)</i>') + '</div>' +
      '<div class="after"><div class="inner">' + esc(f.proposed) + '</div></div>' +
      '<div class="handle"></div></div>';
  }

  function wireFindings() {
    // abrir/cerrar + resaltar elemento
    [].slice.call(body.querySelectorAll('.seos__fh')).forEach(function (h) {
      h.addEventListener('click', function () {
        var card = h.parentNode; card.classList.toggle('open');
        if (card.classList.contains('open')) { setupCmp(card.querySelector('[data-cmp]')); highlight(findings[+card.dataset.i]); }
      });
    });
    // aplicar / descartar
    [].slice.call(body.querySelectorAll('[data-ap]')).forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); applyFinding(+b.dataset.ap); }); });
    [].slice.call(body.querySelectorAll('[data-un]')).forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); unapplyFinding(+b.dataset.un); }); });
    // marca aplicados
    Object.keys(applied).forEach(function (i) { var c = body.querySelector('.seos__f[data-i="' + i + '"]'); if (c) c.classList.add('is-applied'); });
  }

  // slider del comparador
  function setupCmp(box) {
    if (!box || box.__wired) return; box.__wired = 1;
    var after = box.querySelector('.after'); var inner = box.querySelector('.inner'); var handle = box.querySelector('.handle');
    function setW() { inner.style.setProperty('--w', box.clientWidth + 'px'); inner.style.width = box.clientWidth + 'px'; }
    setW();
    function set(p) { p = Math.max(4, Math.min(96, p)); after.style.width = p + '%'; handle.style.left = p + '%'; }
    set(50);
    var drag = false;
    function move(x) { var r = box.getBoundingClientRect(); set(((x - r.left) / r.width) * 100); }
    handle.addEventListener('mousedown', function () { drag = true; });
    box.addEventListener('mousedown', function (e) { drag = true; move(e.clientX); });
    window.addEventListener('mousemove', function (e) { if (drag) move(e.clientX); });
    window.addEventListener('mouseup', function () { drag = false; });
    box.addEventListener('touchmove', function (e) { move(e.touches[0].clientX); }, { passive: true });
    window.addEventListener('resize', setW);
  }

  // resaltar el elemento en la página
  var lastHl = null;
  function highlight(f) {
    if (lastHl) { lastHl.classList.remove('seo-hl'); lastHl = null; }
    var el = locate(f);
    if (el) { el.classList.add('seo-hl'); lastHl = el; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }
  function locate(f) {
    if (f.type === 'alt' && f.src) return document.querySelector('img[src="' + f.src + '"]');
    if (f.type === 'title' || f.type === 'description') return null;
    var sel = f.type === 'h1' ? 'h1' : (f.type === 'heading' ? 'h2,h3' : 'p,.lead,.ship-desc');
    var nodes = [].slice.call(document.querySelectorAll('main ' + sel.split(',').join(', main ')));
    var cur = norm(f.current);
    for (var i = 0; i < nodes.length; i++) if (norm(nodes[i].textContent) === cur) return nodes[i];
    return null;
  }

  // ============ APLICAR / PUBLICAR ============
  function applyFinding(i) {
    var f = findings[i]; if (!f) return; applied[i] = true;
    if (f.type === 'title') { pending.title = f.proposed; document.title = f.proposed; }
    else if (f.type === 'description') { pending.description = f.proposed; var m = document.querySelector('meta[name="description"]'); if (m) m.content = f.proposed; }
    else if (f.type === 'alt' && f.src) { pending.altOverrides[f.src] = f.proposed; var im = document.querySelector('img[src="' + f.src + '"]'); if (im) im.setAttribute('alt', f.proposed); }
    else { // h1 / heading / content → textOverride + cambia el DOM
      pending.textOverrides.push({ find: f.current, replace: f.proposed });
      var el = locate(f); if (el) el.textContent = f.proposed;
    }
    var c = body.querySelector('.seos__f[data-i="' + i + '"]'); if (c) c.classList.add('is-applied');
    renderFoot();
  }
  function unapplyFinding(i) {
    delete applied[i]; var c = body.querySelector('.seos__f[data-i="' + i + '"]'); if (c) c.classList.remove('is-applied');
    // (no revierte el preview del DOM; al recargar vuelve)
    renderFoot();
  }

  function renderFoot() {
    var n = Object.keys(applied).length;
    foot.innerHTML = '<button class="seos__btn seos__btn--pub" id="seosPub"' + (n ? '' : ' disabled') + '>🚀 Publicar ' + (n ? (n + ' cambio' + (n > 1 ? 's' : '')) : 'cambios') + '</button>' +
      '<p class="seos__note">' + (n ? 'Se aplicarán en la web real para todos.' : 'Aplica al menos un cambio para publicar.') + '</p>';
    if (n) document.getElementById('seosPub').addEventListener('click', publish);
  }

  function publish() {
    var cfg = { published: true, altOverrides: pending.altOverrides, textOverrides: pending.textOverrides };
    if (pending.title) cfg.title = pending.title;
    if (pending.description) cfg.description = pending.description;
    var btn = document.getElementById('seosPub'); btn.disabled = true; btn.textContent = 'Publicando…';
    api('PUT', { config: cfg }).then(function (r) {
      if (!r.ok) { btn.disabled = false; btn.textContent = '🚀 Reintentar publicar'; alert((r.data && r.data.message) || 'No se pudo publicar'); return; }
      current = r.data.config;
      foot.innerHTML = '<p class="seos__note" style="color:#9ff0e3">✓ Publicado en la web. Google lo verá al re-rastrear.</p>';
    });
  }

  renderIntro();
})();
