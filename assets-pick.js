/* Cabo Vírgenes — selector flotante de Assets para el editor visual (iframe del
   admin). Panel liquid-glass autosuficiente: inyecta sus estilos, lista
   /api/assets y permite subir nuevos archivos.
   API: window.CaboAssetPicker.open({ token?, accept, onPick, title })
        accept: 'image' | 'video' | '' (todo)
   El token se lee de localStorage('cv_auth_token') (mismo origen que el admin),
   con fallback a opts.token. NUNCA se incrusta ningún secreto aquí.            */
(function () {
  'use strict';
  if (window.CaboAssetPicker) return;

  var API = '/api';
  var items = null;
  var panel = null;
  var state = { token: '', accept: '', onPick: null };

  function authToken() {
    var t = '';
    try { t = localStorage.getItem('cv_auth_token') || ''; } catch (_) {}
    return t || state.token || '';
  }

  var CSS = [
    '.cv-aspick{position:fixed;top:84px;right:20px;z-index:2147482500;width:min(340px,88vw);max-height:calc(100vh - 110px);display:flex;flex-direction:column;background:rgba(238,242,246,.88);border:1px solid rgba(11,26,44,.14);border-radius:18px;-webkit-backdrop-filter:blur(26px) saturate(1.7);backdrop-filter:blur(26px) saturate(1.7);box-shadow:0 24px 60px rgba(11,26,44,.26);font-family:Inter,system-ui,sans-serif;color:#0b1a2c;animation:cvApIn .28s cubic-bezier(.2,.8,.25,1)}',
    '@keyframes cvApIn{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:none}}',
    '.cv-aspick__head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 15px 10px;cursor:grab;user-select:none}',
    '.cv-aspick__head b{font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase}',
    '.cv-aspick__x{border:0;background:transparent;cursor:pointer;font-size:15px;line-height:1;color:inherit;padding:4px 6px;border-radius:8px}',
    '.cv-aspick__x:hover{background:rgba(11,26,44,.08)}',
    '.cv-aspick__tools{display:flex;gap:8px;padding:0 15px 10px}',
    '.cv-aspick__q{flex:1;padding:8px 11px;border:1px solid rgba(11,26,44,.16);border-radius:10px;background:#fff;font:500 12.5px/1.3 inherit;color:inherit;outline:0}',
    '.cv-aspick__q:focus{border-color:#1cb5b0;box-shadow:0 0 0 3px rgba(28,181,176,.14)}',
    '.cv-aspick__up{padding:8px 12px;border:1px solid rgba(11,26,44,.18);border-radius:10px;background:#fff;font:600 11.5px/1.3 inherit;cursor:pointer;white-space:nowrap;color:inherit}',
    '.cv-aspick__up:hover{border-color:#1cb5b0;color:#0fa6a0}',
    '.cv-aspick__grid{flex:1;overflow:auto;display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:4px 15px 15px}',
    '.cv-aspick__it{position:relative;border:1px solid rgba(11,26,44,.12);border-radius:12px;overflow:hidden;background:#fff;cursor:pointer;transition:transform .15s,border-color .15s}',
    '.cv-aspick__it:hover{transform:translateY(-2px);border-color:#1cb5b0}',
    '.cv-aspick__th{aspect-ratio:4/3;background:#e4eaf0;display:flex;align-items:center;justify-content:center;overflow:hidden}',
    '.cv-aspick__th img{width:100%;height:100%;object-fit:cover;display:block}',
    '.cv-aspick__ph{font-size:20px;opacity:.45}',
    '.cv-aspick__nm{display:block;padding:7px 9px;font:600 10.5px/1.35 inherit;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.cv-aspick__vid{position:absolute;left:6px;top:6px;background:rgba(11,26,44,.82);color:#fff;border-radius:999px;font:700 8.5px/1 inherit;letter-spacing:.08em;padding:4px 7px;text-transform:uppercase}',
    '.cv-aspick__empty{grid-column:1/-1;text-align:center;padding:26px 10px;font:500 12px/1.5 inherit;color:rgba(11,26,44,.55)}'
  ].join('\n');

  function injectCss() {
    if (document.getElementById('cvAspickCss')) return;
    var s = document.createElement('style');
    s.id = 'cvAspickCss';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function fetchItems(cb) {
    fetch(API + '/assets', { headers: { 'x-cabo-admin-token': authToken() } })
      .then(function (r) { return r.json(); })
      .then(function (d) { items = (d && d.items) || []; cb(); })
      .catch(function () { items = []; cb(); });
  }

  function matches(it, q) {
    if (state.accept && it.kind !== state.accept) return false;
    if (q) {
      var hay = ((it.name || '') + ' ' + (it.tags || []).join(' ')).toLowerCase();
      if (hay.indexOf(q.toLowerCase()) < 0) return false;
    }
    return true;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function paint() {
    if (!panel) return;
    var grid = panel.querySelector('.cv-aspick__grid');
    var q = panel.querySelector('.cv-aspick__q').value.trim();
    if (items === null) { grid.innerHTML = '<div class="cv-aspick__empty">Cargando biblioteca…</div>'; return; }
    var list = items.filter(function (it) { return matches(it, q); });
    if (!list.length) { grid.innerHTML = '<div class="cv-aspick__empty">No hay archivos' + (state.accept ? ' de este tipo' : '') + '.<br>Usa «Subir» para añadir uno.</div>'; return; }
    grid.innerHTML = list.map(function (it) {
      var visual = it.thumb || (it.kind === 'image' ? it.url : null);
      return '<div class="cv-aspick__it" data-id="' + esc(it.id) + '">' +
        '<div class="cv-aspick__th">' + (visual ? '<img loading="lazy" src="' + esc(visual) + '" alt="">' : '<span class="cv-aspick__ph">▦</span>') + '</div>' +
        (it.kind === 'video' ? '<span class="cv-aspick__vid">Vídeo</span>' : '') +
        '<span class="cv-aspick__nm">' + esc(it.name) + '</span></div>';
    }).join('');
  }

  function close() {
    if (panel) { panel.remove(); panel = null; }
  }

  // Subida desde el propio picker (pequeños por base64, grandes por URL firmada).
  function uploadFile(file, done) {
    var headers = { 'content-type': 'application/json', 'x-cabo-admin-token': authToken() };
    function post(body) {
      return fetch(API + '/assets', { method: 'POST', headers: headers, body: JSON.stringify(body) })
        .then(function (r) { return r.json(); });
    }
    function finish(d) {
      if (d && d.item) { items = items || []; items.unshift(d.item); done(d.item); }
      else done(null, (d && (d.message || d.error)) || 'Error al subir.');
    }
    if (file.size <= 4 * 1024 * 1024) {
      var reader = new FileReader();
      reader.onload = function () {
        post({ action: 'upload', name: file.name, type: file.type || 'application/octet-stream', dataBase64: String(reader.result).split(',')[1] })
          .then(finish).catch(function () { done(null, 'Error al subir.'); });
      };
      reader.readAsDataURL(file);
      return;
    }
    if (file.size > 50 * 1024 * 1024) { done(null, 'El archivo supera 50 MB.'); return; }
    post({ action: 'sign', name: file.name, type: file.type })
      .then(function (s) {
        if (!s || !s.uploadUrl) throw new Error((s && s.message) || 'No se pudo firmar.');
        return fetch(s.uploadUrl, { method: 'PUT', headers: { 'content-type': file.type || 'application/octet-stream' }, body: file })
          .then(function (r) {
            if (!r.ok) throw new Error('Almacenamiento: HTTP ' + r.status);
            return post({ action: 'record', id: s.id, path: s.path, name: file.name, type: file.type, size: file.size });
          });
      })
      .then(finish)
      .catch(function (e) { done(null, String(e && e.message || e)); });
  }

  function build(title) {
    injectCss();
    close();
    panel = document.createElement('aside');
    panel.className = 'cv-aspick';
    panel.innerHTML =
      '<div class="cv-aspick__head"><b>' + esc(title || 'Biblioteca de Assets') + '</b><button type="button" class="cv-aspick__x" aria-label="Cerrar">✕</button></div>' +
      '<div class="cv-aspick__tools"><input class="cv-aspick__q" placeholder="Buscar…"><button type="button" class="cv-aspick__up">⇅ Subir</button>' +
      '<input type="file" hidden' + (state.accept === 'image' ? ' accept="image/*"' : state.accept === 'video' ? ' accept="video/*"' : '') + '></div>' +
      '<div class="cv-aspick__grid"></div>';
    document.body.appendChild(panel);

    panel.querySelector('.cv-aspick__x').addEventListener('click', close);
    panel.querySelector('.cv-aspick__q').addEventListener('input', paint);
    var fileInp = panel.querySelector('input[type=file]');
    var upBtn = panel.querySelector('.cv-aspick__up');
    upBtn.addEventListener('click', function () { fileInp.click(); });
    fileInp.addEventListener('change', function () {
      var f = fileInp.files && fileInp.files[0];
      fileInp.value = '';
      if (!f) return;
      upBtn.textContent = 'Subiendo…'; upBtn.disabled = true;
      uploadFile(f, function (item, err) {
        upBtn.textContent = '⇅ Subir'; upBtn.disabled = false;
        if (!item) { paint(); alert(err || 'Error al subir.'); return; }
        var cb = state.onPick; close();
        if (cb) cb(item);
      });
    });
    panel.querySelector('.cv-aspick__grid').addEventListener('click', function (e) {
      var card = e.target.closest('.cv-aspick__it');
      if (!card) return;
      var it = (items || []).filter(function (x) { return x.id === card.getAttribute('data-id'); })[0];
      if (!it) return;
      var cb = state.onPick; close();
      if (cb) cb(it);
    });
    document.addEventListener('keydown', function onEsc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onEsc); } });

    // Arrastrable por la cabecera.
    var head = panel.querySelector('.cv-aspick__head');
    head.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.cv-aspick__x')) return;
      var r = panel.getBoundingClientRect();
      var dx = e.clientX - r.left, dy = e.clientY - r.top;
      head.setPointerCapture(e.pointerId);
      function move(ev) {
        panel.style.left = Math.max(6, Math.min(window.innerWidth - r.width - 6, ev.clientX - dx)) + 'px';
        panel.style.top = Math.max(6, Math.min(window.innerHeight - 60, ev.clientY - dy)) + 'px';
        panel.style.right = 'auto';
      }
      function up() { head.removeEventListener('pointermove', move); head.removeEventListener('pointerup', up); }
      head.addEventListener('pointermove', move);
      head.addEventListener('pointerup', up);
    });
  }

  window.CaboAssetPicker = {
    open: function (opts) {
      opts = opts || {};
      state.token = opts.token || state.token || '';
      state.accept = opts.accept || '';
      state.onPick = opts.onPick || null;
      build(opts.title);
      paint();
      fetchItems(paint);
    },
    close: close
  };
})();
