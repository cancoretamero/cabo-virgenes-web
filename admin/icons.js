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
    reply: '<path d="M9 7L4 12l5 5"/><path d="M4 12h11a5 5 0 015 5v2"/>',
    'map-pin': '<path d="M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
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
    scale: '<path d="M12 3v18M7 21h10M12 5l7 2-2.5 6a3.5 3.5 0 01-9 0L5 7l7-2z"/><path d="M2.5 13a3.5 3.5 0 007 0M14.5 13a3.5 3.5 0 007 0"/>',
    monitor: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
    tablet: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M11 18h2"/>',
    smartphone: '<rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M11 18.5h2"/>',
    'mail-check': '<path d="M21 10.5V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h8"/><path d="M4 7l8 6 8-6"/><path d="M15.5 19l2 2 4-4"/>',
    'layout-template': '<rect x="3" y="3" width="18" height="6" rx="1"/><rect x="3" y="12" width="8" height="9" rx="1"/><rect x="15" y="12" width="6" height="9" rx="1"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 3 2 3H5"/>',
    history: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3 8.5M3 4v4.5h4.5"/><path d="M12 7.5V12l3 2"/>',
    briefcase: '<rect x="3" y="7.5" width="18" height="12" rx="2"/><path d="M8 7.5V6a2 2 0 012-2h4a2 2 0 012 2v1.5M3 13h18"/>',
    'user-plus': '<path d="M14 19c0-2.8-2.2-5-5-5s-5 2.2-5 5"/><circle cx="9" cy="8" r="3.2"/><path d="M18 8v6M21 11h-6"/>',
    'at-sign': '<circle cx="12" cy="12" r="3.5"/><path d="M15.5 12v1.5a2.5 2.5 0 005 0V12a8.5 8.5 0 10-3.3 6.7"/>',
    link: '<path d="M9.5 14.5l5-5M10.5 7l1.2-1.2a4 4 0 015.7 5.7L16.2 13M13.5 17l-1.2 1.2a4 4 0 01-5.7-5.7L7.8 11"/>',
    'file-text': '<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6M9 9h2"/>',
    bold: '<path d="M7 4h6.5a3.5 3.5 0 010 7H7zM7 11h7.5a3.5 3.5 0 010 7H7z"/>',
    italic: '<path d="M19 4h-7M14 20H7M15 4L9 20"/>',
    underline: '<path d="M7 4v6a5 5 0 0010 0V4M5 21h14"/>',
    type: '<path d="M4 7V5h16v2M9 19h6M12 5v14"/>',
    heading: '<path d="M6 4v16M18 4v16M6 12h12"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1.1"/><circle cx="3.5" cy="12" r="1.1"/><circle cx="3.5" cy="18" r="1.1"/>',
    'list-ordered': '<path d="M10 6h11M10 12h11M10 18h11"/><path d="M4 5h1v4M3.5 9h2M3.5 13.5h2l-2 3.5h2"/>',
    indent: '<path d="M21 6H8M21 12H12M21 18H8M3 8l4 4-4 4"/>',
    outdent: '<path d="M21 6H8M21 12H12M21 18H8M7 8l-4 4 4 4"/>',
    'remove-formatting': '<path d="M4 7V4h16v3M12 4v9M9 20h6M16 15l5 5M21 15l-5 5"/>',
    palette: '<path d="M12 3a9 9 0 000 18c1.2 0 1.8-1 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.7-1.6 1.6-1.6H16a5 5 0 005-5c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11.5" r="1.1"/><circle cx="10.5" cy="7.5" r="1.1"/><circle cx="15" cy="8" r="1.1"/>',
    'wand-2': '<path d="M5 21l11-11M14 6l1-2 2-1-2-1-1-2-1 2-2 1 2 1zM19.5 12.5l.6-1.2 1.2-.6-1.2-.6-.6-1.2-.6 1.2-1.2.6 1.2.6zM6 4l.5-1 1-.5-1-.5L6 1l-.5 1-1 .5 1 .5z"/>',
    'rotate-ccw': '<path d="M3 12a9 9 0 109-9 8.97 8.97 0 00-6.4 2.7L3 8M3 3v5h5"/>',
    'rotate-cw': '<path d="M21 12a9 9 0 11-9-9 8.97 8.97 0 016.4 2.7L21 8M21 3v5h-5"/>',
    'align-left': '<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>',
    'align-center': '<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>',
    'align-right': '<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>',
    move: '<path d="M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/>',
    'building-2': '<path d="M6 21V5a1 1 0 011-1h6a1 1 0 011 1v16M14 9h3a1 1 0 011 1v11M3 21h18M9 8h.01M9 12h.01M9 16h.01M11 8h.01M11 12h.01M11 16h.01"/>',
    send: '<path d="M21 3L3 10.5l7 2.5 2.5 7zM21 3L10 14"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4-2v-4z"/>',
    'x-circle': '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
    'user-check': '<path d="M14 19c0-2.8-2.2-5-5-5s-5 2.2-5 5"/><circle cx="9" cy="8" r="3.2"/><path d="M16 12l2 2 4-4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>',
    'arrow-up-down': '<path d="M7 4v16M7 4L4 7M7 4l3 3M17 20V4M17 20l-3-3M17 20l3-3"/>',
    // Assets (biblioteca de medios) — paths Lucide
    play: '<path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/>',
    video: '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
    loader: '<path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/>',
    'triangle-alert': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    'layout-grid': '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
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
