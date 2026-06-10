/* ============================================================
   CABO VÍRGENES — Bootstrap de datos del sitio público (Supabase).
   Baja /api/public?what=site, hidrata localStorage (cv_*) y dispara
   el re-render de los scripts existentes (que escuchan 'storage').

   REGLAS DE SEGURIDAD (los borradores son sagrados):
   - En los iframes del admin (?editor=1 / ?studio=...) NO se ejecuta:
     ahí localStorage es el conjunto de trabajo del equipo (con borradores)
     y /api/public solo trae lo publicado → pisarlo destruiría borradores.
   - En la web pública se FUSIONA: lo del servidor manda sobre lo público,
     pero se preservan los elementos locales no públicos (borradores,
     archivadas, miembros ocultos, vacantes cerradas).
   - Si la API falla, no hace nada (fallback total, nunca rompe).
   ============================================================ */
(function () {
  'use strict';

  // ── Modo admin/editor: NO hidratar (protege el conjunto de trabajo) ──
  var qs = '';
  try { qs = String(location.search || ''); } catch (_) {}
  if (/[?&](editor|studio)=/.test(qs)) { window.CV_SITE_READY = Promise.resolve(null); return; }

  function get(key) { try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? null : v; } catch (_) { return null; } }
  function put(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (_) {} }
  function snapshot(key) {
    // Copia de seguridad previa (una por clave y carga) por si hiciera falta recuperar.
    try { var cur = localStorage.getItem(key); if (cur && cur !== 'null') localStorage.setItem(key + '_prev', cur); } catch (_) {}
  }
  function ping(key) {
    try { window.dispatchEvent(new StorageEvent('storage', { key: key })); } catch (_) {
      try { var e = document.createEvent('StorageEvent'); e.initStorageEvent('storage', false, false, key, null, null, location.href, localStorage); window.dispatchEvent(e); } catch (__) {}
    }
  }

  // Fusiona: servidor manda; conserva los locales "no públicos" que el
  // endpoint público no devuelve (para no destruir el trabajo del equipo).
  function merge(serverArr, localArr, keepLocal) {
    if (!Array.isArray(localArr) || !localArr.length) return serverArr;
    var ids = {};
    serverArr.forEach(function (it) { if (it && it.id != null) ids[String(it.id)] = true; });
    var preserved = localArr.filter(function (it) {
      if (!it) return false;
      if (it.id != null && ids[String(it.id)]) return false; // ya viene del servidor
      return keepLocal(it);
    });
    return serverArr.concat(preserved);
  }

  window.CV_SITE_READY = fetch('/api/public?what=site', { headers: { accept: 'application/json' } })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || !d.ok) return null;
      if (d.settings) { snapshot('cv_settings'); put('cv_settings', d.settings); }
      if (Array.isArray(d.news)) {
        snapshot('cv_news');
        put('cv_news', merge(d.news, get('cv_news'), function (n) { return n.archived === true || (n.status && n.status !== 'published'); }));
      }
      if (Array.isArray(d.team) && d.team.length) {
        snapshot('cv_team');
        var loc = get('cv_team');
        put('cv_team', merge(d.team, Array.isArray(loc) ? loc : null, function (m) { return m.hidden === true; }));
      }
      if (Array.isArray(d.jobs)) {
        snapshot('cv_jobs');
        put('cv_jobs', merge(d.jobs, get('cv_jobs'), function (j) { return j.status && j.status !== 'open'; }));
      }
      // Páginas: las filas ov-* son los overrides del editor visual
      // (cv_content/cv_imgs/cv_styles/cv_legal) — editor.js re-aplica al
      // recibir el evento 'storage' de esas claves, en cualquier navegador.
      var ovPing = [];
      if (d.pages) {
        var OV = { 'ov-content': 'cv_content', 'ov-imgs': 'cv_imgs', 'ov-styles': 'cv_styles', 'ov-legal': 'cv_legal' };
        var rest = {};
        Object.keys(d.pages).forEach(function (slug) {
          if (OV[slug]) { put(OV[slug], d.pages[slug] || {}); ovPing.push(OV[slug]); }
          else rest[slug] = d.pages[slug];
        });
        put('cv_pages', rest);
      }
      if (d.legal && ovPing.indexOf('cv_legal') === -1) { put('cv_legal', d.legal); ovPing.push('cv_legal'); }
      ['cv_settings', 'cv_news', 'cv_team', 'cv_jobs'].concat(ovPing).forEach(ping);
      return d;
    })
    .catch(function () { return null; });
})();
