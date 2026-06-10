/* ============================================================
   CABO VÍRGENES — Página de Empleo (pública, localStorage)
   - Renderiza las vacantes abiertas (cv_jobs, status open) si la
     sección está activada en el admin (cv_settings.jobsEnabled).
   - Formulario de candidatura → cv_applications (lo ve el admin).
   ============================================================ */
(function () {
  'use strict';
  const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} };
  const esc = (s) => (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const uid = () => 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const $ = (s) => document.querySelector(s);

  const TYPE_LABEL = { 'full-time': 'Jornada completa', 'part-time': 'Media jornada', temporada: 'Temporada', 'prácticas': 'Prácticas', practicas: 'Prácticas' };
  const ICN = {
    pin: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    clock: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  };

  function getJobs() { return read('cv_jobs', []); }
  function jobsEnabled() { return !!(read('cv_settings', {}) || {}).jobsEnabled; }

  function renderJobs() {
    const host = $('#jobsList'); if (!host) return;
    const enabled = jobsEnabled();
    const open = getJobs().filter(j => (j.status || 'open') === 'open');
    if (!enabled || !open.length) {
      host.innerHTML = `<div class="emp-empty">
        <h3>No hay vacantes abiertas en este momento</h3>
        <p>Pero siempre estamos buscando talento. Dejanos tu candidatura espontánea y te contactamos cuando surja una oportunidad.</p>
        <button class="emp-btn emp-btn--solid" type="button" data-apply data-apply-title="Candidatura espontánea" style="margin-top:18px;background:var(--teal);color:#06182f">Enviar candidatura <span class="ar">→</span></button>
      </div>`;
      return;
    }
    host.innerHTML = open.map(j => {
      const desc = j.summary || j.description || j.body || '';
      const type = TYPE_LABEL[j.type] || j.type || '';
      return `<article class="emp-job">
        <div class="emp-job__main">
          <div class="emp-job__tags">
            ${j.area ? `<span class="emp-job__tag area">${esc(j.area)}</span>` : ''}
            ${type ? `<span class="emp-job__tag">${esc(type)}</span>` : ''}
          </div>
          <h3>${esc(j.title || 'Vacante')}</h3>
          ${desc ? `<p>${esc(desc)}</p>` : ''}
          <div class="emp-job__meta">
            ${j.location ? `<span>${ICN.pin}${esc(j.location)}</span>` : ''}
            ${type ? `<span>${ICN.clock}${esc(type)}</span>` : ''}
          </div>
        </div>
        <div class="emp-job__apply">
          <button class="emp-btn emp-btn--solid" type="button" data-apply data-apply-job="${esc(j.id)}" data-apply-title="${esc(j.title || 'Vacante')}" style="background:var(--ink);color:#fff">Postularme <span class="ar">→</span></button>
        </div>
      </article>`;
    }).join('');
  }

  // ---------- Modal de candidatura ----------
  const modal = $('#applyModal');
  function openApply(jobId, title) {
    $('#apJobId').value = jobId || '';
    $('#applyTitle').textContent = jobId ? ('Postularme: ' + title) : 'Candidatura espontánea';
    $('#applySub').textContent = jobId ? 'Completá tus datos para postularte a esta vacante.' : 'Dejanos tu CV y te contactamos cuando surja una oportunidad.';
    $('#applyForm').reset(); $('#apJobId').value = jobId || '';
    $('#apCvName').textContent = 'Adjuntar CV (PDF, opcional)';
    $('#applyMsg').textContent = ''; window._apCv = null;
    modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
    setTimeout(() => $('#apName').focus(), 60);
  }
  function closeApply() { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); }

  document.addEventListener('click', (e) => {
    const ap = e.target.closest('[data-apply]');
    if (ap) { openApply(ap.getAttribute('data-apply-job') || '', ap.getAttribute('data-apply-title') || ''); return; }
    if (e.target.closest('[data-apply-close]')) { closeApply(); return; }
  });

  $('#apCvFile').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    $('#apCvName').textContent = f.name;
    if (f.size <= 4 * 1024 * 1024) { const r = new FileReader(); r.onload = () => { window._apCv = { name: f.name, data: r.result }; }; r.readAsDataURL(f); }
    else { window._apCv = { name: f.name }; }
  });

  $('#applyForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#apName').value.trim(), email = $('#apEmail').value.trim();
    const msg = $('#applyMsg');
    if (!name || !email) { msg.textContent = 'Completá nombre y email.'; msg.className = 'emp-msg err'; return; }
    const apps = read('cv_applications', []);
    const job = getJobs().find(j => String(j.id) === String($('#apJobId').value));
    apps.unshift({
      id: uid(), jobId: $('#apJobId').value || '', jobTitle: job ? job.title : 'Candidatura espontánea',
      name, email, phone: $('#apPhone').value.trim(), message: $('#apMessage').value.trim(),
      cv: (window._apCv && window._apCv.name) || '', cvData: (window._apCv && window._apCv.data) || '',
      date: new Date().toISOString(), read: false,
    });
    write('cv_applications', apps);
    try {
      fetch('/api/public', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'apply', jobId: $('#apJobId').value || null,
          jobTitle: job ? job.title : 'Candidatura espontánea', name, email,
          phone: $('#apPhone').value.trim(), message: $('#apMessage').value.trim() }) }).catch(function () {});
    } catch (_) {}
    msg.textContent = '✓ ¡Candidatura enviada! Gracias, te contactaremos.'; msg.className = 'emp-msg ok';
    setTimeout(closeApply, 1600);
  });

  function init() { renderJobs(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.addEventListener('storage', (e) => { if (['cv_jobs', 'cv_settings'].includes(e.key)) renderJobs(); });
})();
