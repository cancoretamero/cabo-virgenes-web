/* ============================================================
   Cabo Vírgenes — Admin icon system
   Uso: <span data-ico="newspaper" data-ico-size="18"></span>
   Re-hidratar tras render dinámico: window.cvIcons()
   ============================================================ */
(function () {
  const I = {
    'layout-dashboard': '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    newspaper: '<path d="M4 4h13a1 1 0 011 1v13a2 2 0 01-2 2H5a2 2 0 01-2-2V5"/><path d="M19 8h1a1 1 0 011 1v9a2 2 0 01-2 2"/><path d="M7 8h7M7 12h7M7 16h4"/>',
    users: '<path d="M16 19c0-2.8-2.2-5-5-5s-5 2.2-5 5"/><circle cx="11" cy="8" r="3.2"/><path d="M17 14.5c1.8.4 3 1.9 3 4M16 5.2a3 3 0 010 5.6"/>',
    'square-pen': '<path d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5"/><path d="M18.4 3.6a1.8 1.8 0 012.5 2.5L12 15l-3.5.9.9-3.5z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M4 7l8 6 8-6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5l1.3 2.6 2.9-.5.6 2.9 2.6 1.3-1.3 2.6 1.3 2.6-2.6 1.3-.6 2.9-2.9-.5L12 21.5l-1.3-2.6-2.9.5-.6-2.9L4.6 15l1.3-2.6L4.6 9.8l2.6-1.3.6-2.9 2.9.5z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    'eye-off': '<path d="M9.9 5.2A9.6 9.6 0 0112 5c6.5 0 10 7 10 7a18 18 0 01-3 3.8M6.3 6.3A18 18 0 002 12s3.5 7 10 7a9.6 9.6 0 004.3-1M3 3l18 18M9.5 9.6a3 3 0 004.2 4.2"/>',
    'arrow-right': '<path d="M5 12h13M13 6l6 6-6 6"/>',
    'external-link': '<path d="M14 5h5v5M19 5l-8 8M19 14v3a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    save: '<path d="M5 3h11l3 3v13a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"/><path d="M8 3v5h7M8 21v-7h8v7"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>',
    'refresh-cw': '<path d="M3.5 12a8.5 8.5 0 0114.5-6M20.5 12A8.5 8.5 0 016 18"/><path d="M18 2.5V6h-3.5M6 21.5V18h3.5"/>',
    sparkles: '<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/><path d="M18 14l.7 1.9L20.6 17l-1.9.7L18 19.6l-.7-1.9L15.4 17l1.9-.7z"/>',
    'undo-2': '<path d="M9 7L4 12l5 5M4 12h11a5 5 0 010 10h-1"/>',
    'redo-2': '<path d="M15 7l5 5-5 5M20 12H9a5 5 0 000 10h1"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>',
    'chevron-down': '<path d="M6 9l6 6 6-6"/>',
    'chevron-right': '<path d="M9 6l6 6-6 6"/>',
    'trash-2': '<path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13M10 11v6M14 11v6"/>',
    pencil: '<path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M5 12l4.5 4.5L19 7"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.8"/><path d="M21 16l-5-5L5 21"/>',
    calendar: '<rect x="3.5" y="4.5" width="17" height="16" rx="2"/><path d="M3.5 9h17M8 2.5v4M16 2.5v4"/>',
    'grip-vertical': '<circle cx="9" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="15" cy="18" r="1.4"/>',
    tag: '<path d="M20.4 13.1l-7.3 7.3a1.5 1.5 0 01-2.1 0l-7-7A1.5 1.5 0 013.5 12.3V5.6A1.6 1.6 0 015.1 4h6.7c.42 0 .82.17 1.12.46l7.5 7.5a1.5 1.5 0 010 2.14z"/><circle cx="8" cy="8" r="1.25"/>',
    'eye-toggle': '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    'log-out': '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>',
    fish: '<path d="M3 12c3-5 9-6 13-4 2 1 4 3 5 4-1 1-3 3-5 4-4 2-10 1-13-4z"/><path d="M16 9l3-3v12l-3-3M8 12h.01"/>',
    ship: '<path d="M3 15l9-3 9 3-1.6 4.6a1 1 0 01-.95.7H5.55a1 1 0 01-.95-.7L3 15z"/><path d="M12 12V5M8 7h8"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.2l2.4 2.4 4.6-4.8"/>',
    inbox: '<path d="M3 12h5l1.5 3h5L21 12M3 12l3-7h12l3 7v6a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>',
    home: '<path d="M4 11l8-7 8 7v8a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1z"/>',
    leaf: '<path d="M5 21c0-9 5-14 14-14 0 9-5 14-14 14z"/><path d="M9 17c2.5-3 5-5 8-6"/>',
  };
  const SVG = (name, size) => {
    const p = I[name];
    if (!p) return '';
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  };
  function hydrate(root) {
    (root || document).querySelectorAll('[data-ico]').forEach(el => {
      if (el.dataset.icoDone === '1') return;
      const size = parseInt(el.getAttribute('data-ico-size') || '18', 10);
      el.innerHTML = SVG(el.getAttribute('data-ico'), size);
      el.dataset.icoDone = '1';
    });
  }
  window.cvIcons = hydrate;
  window.cvIcon = SVG;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => hydrate());
  else hydrate();
})();
