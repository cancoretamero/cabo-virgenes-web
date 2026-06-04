// Mark html.js so CSS reveal rules activate only with JS
document.documentElement.classList.add('js');

// ============ MÓVIL/iOS: liberar memoria (evita crash de Safari) ============
// En táctil quitamos el vídeo decorativo en bucle para no agotar la memoria.
try {
  if (window.matchMedia && window.matchMedia('(hover: none)').matches) {
    const wv = document.querySelector('.wave-video');
    if (wv) { try { wv.pause(); } catch (e) {} wv.removeAttribute('autoplay'); wv.removeAttribute('src'); try { wv.load(); } catch (e) {} wv.remove(); }

    // Descargar de memoria las imágenes muy fuera de pantalla. En una página
    // tan larga, la suma de imágenes decodificadas agota la memoria de iOS y
    // crashea. Mantenemos cargadas ~1,5 pantallas en cada dirección.
    if ('IntersectionObserver' in window) {
      const freeIO = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          const img = e.target;
          if (e.isIntersecting) {
            const f = img.getAttribute('data-frozen');
            if (f) { img.setAttribute('src', f); img.removeAttribute('data-frozen'); }
          } else if (img.getAttribute('src') && !img.getAttribute('data-frozen') && img.complete && img.naturalWidth) {
            if (img.offsetHeight && !img.style.minHeight) img.style.minHeight = img.offsetHeight + 'px';
            img.setAttribute('data-frozen', img.getAttribute('src'));
            img.removeAttribute('src');
          }
        });
      }, { rootMargin: '1400px 0px 1400px 0px' });
      const watchImgs = () => {
        document.querySelectorAll('img').forEach((img) => {
          if (img.dataset.freeWatch) return;
          if (img.closest('.info-modal, .player-modal, .modal, .drawer, .ac-panel, header, .ft-cert-row, .cert-marquee')) return;
          img.dataset.freeWatch = '1';
          freeIO.observe(img);
        });
      };
      watchImgs();
      setTimeout(watchImgs, 2500); // por si se añaden imágenes (noticias)
    }
  }
} catch (e) {}

// ============ LAZY LOADER (Leaflet + Lucide on-demand) ============
// Carga scripts/css externos sólo cuando son necesarios — ahorra ~200KB inicial
const _loaded = new Set();
function loadScript(src){
  if (_loaded.has(src)) return Promise.resolve();
  _loaded.add(src);
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}
function loadCSS(href){
  if (_loaded.has(href)) return Promise.resolve();
  _loaded.add(href);
  return new Promise((res) => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href;
    l.onload = res; l.onerror = res;
    document.head.appendChild(l);
  });
}

// ============ LUCIDE ICONS — lazy-load cuando aparece el primer icono ============
let lucideLoaded = false;
const initLucide = () => {
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    try { lucide.createIcons({ attrs: { 'stroke-width': 1.7 } }); } catch(e){}
  }
};
function ensureLucide(){
  if (lucideLoaded) { initLucide(); return; }
  lucideLoaded = true;
  loadScript('https://cdn.jsdelivr.net/npm/lucide@0.469.0/dist/umd/lucide.min.js')
    .then(initLucide).catch(()=>{});
}
// Si hay iconos data-lucide en viewport o cerca, dispara la carga
if ('IntersectionObserver' in window) {
  const lucideEls = document.querySelectorAll('[data-lucide]');
  if (lucideEls.length) {
    const lio = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { ensureLucide(); lio.disconnect(); break; }
      }
    }, { rootMargin: '200px' });
    lucideEls.forEach(el => lio.observe(el));
  }
} else {
  ensureLucide();
}

// ============ FIT-TO-VIEWPORT (sólo escalado hacia arriba) ============
// Diseño base 1440px. En viewports MAYORES escalamos con zoom para llenar
// monitores anchos. En viewports menores NO se escala — entra el responsive
// CSS limpio y moderno.
const DESIGN_W = 1440;
const fitViewport = () => {
  const html = document.documentElement;
  const w = window.innerWidth;
  let zoom = 1;
  if (w > DESIGN_W){
    zoom = w / DESIGN_W;
    html.style.setProperty('--fit-zoom', zoom);
    html.classList.add('fit-scale');
  } else {
    html.style.removeProperty('--fit-zoom');
    html.classList.remove('fit-scale');
  }
  // Counter-zoom del FAB para que no crezca en monitores anchos
  const fab = document.getElementById('fabStack');
  if (fab) fab.style.transform = zoom > 1 ? `scale(${1/zoom})` : '';
};
fitViewport();
window.addEventListener('resize', fitViewport, { passive: true });
window.addEventListener('load', () => console.log('JS:load done, reveal count=', document.querySelectorAll('[data-reveal]').length, 'in count=', document.querySelectorAll('[data-reveal].in').length));

// ============ HEADER SCROLL ============
const header = document.getElementById('header');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 30);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ============ REVEAL ON SCROLL ============
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
      const cards = e.target.querySelectorAll('.kpi-card, .format-card, .ship-card, .plant-card, .quality-card, .sustain-card');
      cards.forEach((c, i) => { c.style.transitionDelay = (i * 60) + 'ms'; });
    }
  }
}, { threshold: 0.01, rootMargin: '0px 0px 200px 0px' });
document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));

// Fallback: if a reveal element is above the viewport when JS loads, reveal it instantly.
window.addEventListener('load', () => {
  document.querySelectorAll('[data-reveal]:not(.in)').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in');
  });
});

// Safety: 1s tras load, garantizamos que cualquier elemento aún oculto en viewport o cerca aparezca.
window.addEventListener('load', () => setTimeout(() => {
  document.querySelectorAll('[data-reveal]:not(.in)').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 1.5) el.classList.add('in');
  });
}, 1000));

// ============ COUNTER ANIMATION ============
const counterIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const el = e.target;
    const end = parseInt(el.dataset.count, 10);
    const dur = 1400;
    const start = performance.now();
    const isYear = end > 1000;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = isYear ? Math.round(end - (end - 1990) * (1 - eased)) : Math.round(end * eased);
      el.textContent = val.toString();
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    counterIO.unobserve(el);
  }
}, { threshold: 0.5 });
document.querySelectorAll('[data-count]').forEach(el => counterIO.observe(el));

// ============ TILT CARDS (mouse parallax) ============
document.querySelectorAll('.tilt, .card-3d').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(900px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) translateY(-4px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// ============ NAV DROPDOWN (flotante) ============
const navMenuBtn = document.getElementById('navMenuBtn');
const navDropdown = document.getElementById('navDropdown');
if (navMenuBtn && navDropdown) {
  const closeNav = () => {
    navDropdown.classList.remove('open');
    navMenuBtn.setAttribute('aria-expanded', 'false');
    navDropdown.setAttribute('aria-hidden', 'true');
  };
  const openNav = () => {
    navDropdown.classList.add('open');
    navMenuBtn.setAttribute('aria-expanded', 'true');
    navDropdown.setAttribute('aria-hidden', 'false');
  };
  navMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    navDropdown.classList.contains('open') ? closeNav() : openNav();
  });
  document.addEventListener('click', (e) => {
    if (!navDropdown.contains(e.target) && e.target !== navMenuBtn) closeNav();
  });
  navDropdown.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
}

// Drawer legacy: ocultamos sin romper (puede no existir si se elimina más adelante)
const drawer = document.getElementById('drawer');
const drawerBack = document.getElementById('drawerBack');
if (drawer) drawer.style.display = 'none';
if (drawerBack) drawerBack.style.display = 'none';

// ============ INFO MODALS ============
document.querySelectorAll('[data-modal]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const id = btn.dataset.modal;
    const m = document.getElementById(id);
    if (m) { m.classList.add('open'); m.setAttribute('aria-hidden', 'false'); }
  });
});
document.querySelectorAll('[data-close-modal]').forEach(btn => {
  btn.addEventListener('click', () => {
    const m = btn.closest('.info-modal');
    if (m) { m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); }
  });
});
document.querySelectorAll('.info-modal .info-back').forEach(b => {
  b.addEventListener('click', () => {
    const m = b.closest('.info-modal');
    m.classList.remove('open'); m.setAttribute('aria-hidden', 'true');
  });
});

// ============ TOAST ============
const toastEl = document.getElementById('toast');
const toast = (msg, ms = 2000) => {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toastEl.classList.remove('show'), ms);
};

// ============ COPY EMAIL ============
const copyMail = document.getElementById('copyMail');
if (copyMail) {
  copyMail.addEventListener('click', (e) => {
    e.preventDefault();
    navigator.clipboard.writeText('info@cabovirgenes.com').then(() => toast('Email copiado al portapapeles'));
  });
}

// ============ CONTACT FORM ============
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    toast('Consulta enviada — te contactaremos pronto');
    contactForm.reset();
  });
}

// ============ VIDEO PLAYER MODAL ============
const playerModal = document.getElementById('playerModal');
const openPlayerBtn = document.getElementById('openPlayer');
const heroVideoTrigger = document.getElementById('heroVideoTrigger');
const closePlayerBtn = document.getElementById('closePlayer');
const modalVideo = document.getElementById('modalVideo');
const playerPoster = document.getElementById('playerPoster');
const playBigBtn = document.getElementById('playBigBtn');
const playPauseBtn = document.getElementById('playPauseBtn');
const iconPlay = document.getElementById('iconPlay');
const iconPause = document.getElementById('iconPause');
const seekBack = document.getElementById('seekBack');
const seekFwd = document.getElementById('seekFwd');
const pcTimeCur = document.getElementById('pcTimeCur');
const pcTimeDur = document.getElementById('pcTimeDur');
const pcProgress = document.getElementById('pcProgress');
const pcBar = document.getElementById('pcBar');
const pcBuffer = document.getElementById('pcBuffer');
const pcThumb = document.getElementById('pcThumb');
const muteBtn = document.getElementById('muteBtn');
const iconVolOn = document.getElementById('iconVolOn');
const iconVolOff = document.getElementById('iconVolOff');
const pcVolFill = document.getElementById('pcVolFill');
const speedBtn = document.getElementById('speedBtn');
const pipBtn = document.getElementById('pipBtn');
const minimizeBtn = document.getElementById('minimizeBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');

const fmt = (s) => {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return m + ':' + String(sec).padStart(2, '0');
};

const openPlayer = () => {
  playerModal.classList.add('open');
  playerModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
};
const closePlayer = () => {
  playerModal.classList.remove('open');
  playerModal.classList.remove('minimized');
  playerModal.setAttribute('aria-hidden', 'true');
  modalVideo.pause();
  document.body.style.overflow = '';
};

if (openPlayerBtn) openPlayerBtn.addEventListener('click', (e) => { e.stopPropagation(); openPlayer(); });
if (heroVideoTrigger) heroVideoTrigger.addEventListener('click', openPlayer);
if (closePlayerBtn) closePlayerBtn.addEventListener('click', closePlayer);
playerModal.querySelector('.player-back').addEventListener('click', closePlayer);

const playVideo = () => {
  playerPoster.classList.add('hidden');
  modalVideo.play();
};
const pauseVideo = () => modalVideo.pause();

if (playBigBtn) playBigBtn.addEventListener('click', playVideo);
playerPoster.addEventListener('click', playVideo);

playPauseBtn.addEventListener('click', () => {
  if (modalVideo.paused) playVideo();
  else pauseVideo();
});
modalVideo.addEventListener('play', () => { iconPlay.style.display = 'none'; iconPause.style.display = 'block'; });
modalVideo.addEventListener('pause', () => { iconPlay.style.display = 'block'; iconPause.style.display = 'none'; });
modalVideo.addEventListener('ended', () => { iconPlay.style.display = 'block'; iconPause.style.display = 'none'; playerPoster.classList.remove('hidden'); });

modalVideo.addEventListener('loadedmetadata', () => { pcTimeDur.textContent = fmt(modalVideo.duration); });
modalVideo.addEventListener('timeupdate', () => {
  const pct = (modalVideo.currentTime / modalVideo.duration) * 100;
  pcBar.style.width = pct + '%';
  pcThumb.style.left = pct + '%';
  pcTimeCur.textContent = fmt(modalVideo.currentTime);
});
modalVideo.addEventListener('progress', () => {
  if (modalVideo.buffered.length) {
    const end = modalVideo.buffered.end(modalVideo.buffered.length - 1);
    pcBuffer.style.width = ((end / modalVideo.duration) * 100) + '%';
  }
});

seekBack.addEventListener('click', () => { modalVideo.currentTime = Math.max(0, modalVideo.currentTime - 10); });
seekFwd.addEventListener('click', () => { modalVideo.currentTime = Math.min(modalVideo.duration, modalVideo.currentTime + 10); });

let isDragging = false;
const seekTo = (clientX) => {
  const r = pcProgress.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
  modalVideo.currentTime = pct * modalVideo.duration;
};
pcProgress.addEventListener('mousedown', (e) => { isDragging = true; seekTo(e.clientX); });
window.addEventListener('mousemove', (e) => { if (isDragging) seekTo(e.clientX); });
window.addEventListener('mouseup', () => { isDragging = false; });

muteBtn.addEventListener('click', () => {
  modalVideo.muted = !modalVideo.muted;
  iconVolOn.style.display = modalVideo.muted ? 'none' : 'block';
  iconVolOff.style.display = modalVideo.muted ? 'block' : 'none';
});

const pcVolTrack = document.querySelector('.pc-vol-track');
let isVolDragging = false;
const setVol = (clientX) => {
  const r = pcVolTrack.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
  modalVideo.volume = pct;
  pcVolFill.style.width = (pct * 100) + '%';
  if (pct === 0) { modalVideo.muted = true; iconVolOn.style.display = 'none'; iconVolOff.style.display = 'block'; }
  else if (modalVideo.muted) { modalVideo.muted = false; iconVolOn.style.display = 'block'; iconVolOff.style.display = 'none'; }
};
pcVolTrack.addEventListener('mousedown', (e) => { isVolDragging = true; setVol(e.clientX); });
window.addEventListener('mousemove', (e) => { if (isVolDragging) setVol(e.clientX); });
window.addEventListener('mouseup', () => { isVolDragging = false; });

const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
speedBtn.addEventListener('click', () => {
  const cur = parseFloat(speedBtn.dataset.speed);
  const idx = speeds.indexOf(cur);
  const next = speeds[(idx + 1) % speeds.length];
  speedBtn.dataset.speed = next;
  speedBtn.textContent = next + '×';
  modalVideo.playbackRate = next;
});

pipBtn.addEventListener('click', async () => {
  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else if (modalVideo.requestPictureInPicture) {
      await modalVideo.requestPictureInPicture();
    }
  } catch (e) { toast('Picture-in-Picture no disponible'); }
});

minimizeBtn.addEventListener('click', () => {
  playerModal.classList.toggle('minimized');
});

fullscreenBtn.addEventListener('click', () => {
  const stage = document.getElementById('playerStage');
  if (document.fullscreenElement) document.exitFullscreen();
  else (stage.requestFullscreen || stage.webkitRequestFullscreen).call(stage);
});

// Keyboard shortcuts when player is open
window.addEventListener('keydown', (e) => {
  if (!playerModal.classList.contains('open')) return;
  if (e.key === ' ') { e.preventDefault(); playPauseBtn.click(); }
  else if (e.key === 'ArrowLeft') seekBack.click();
  else if (e.key === 'ArrowRight') seekFwd.click();
  else if (e.key === 'f') fullscreenBtn.click();
  else if (e.key === 'm') muteBtn.click();
  else if (e.key === 'Escape') closePlayer();
});

// ============ WAVE: pause cuando NO está visible (ahorra CPU) ============
const waveVideo = document.querySelector('.wave-band .wave-video');
const waveBand = document.querySelector('.wave-band');
if (waveBand && waveVideo && 'IntersectionObserver' in window) {
  const waveIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { waveVideo.play().catch(()=>{}); }
      else { waveVideo.pause(); }
    }
  }, { threshold: 0.1 });
  waveIO.observe(waveBand);
}

// ============ WORLD MAP (Section 05) — LAZY LOAD de Leaflet ============
async function ensureLeaflet(){
  if (typeof L !== 'undefined') return;
  await loadCSS('https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css');
  await loadScript('https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js');
}
const initWorldMap = async () => {
  const mapEl = document.getElementById('worldMap');
  if (!mapEl) return;
  if (mapEl._leaflet_id) return;
  await ensureLeaflet();
  if (typeof L === 'undefined') return;

  const map = L.map(mapEl, {
    center: [22, -10],
    zoom: 2,
    minZoom: 2,
    maxZoom: 6,
    zoomControl: true,
    scrollWheelZoom: false,
    worldCopyJump: true,
    preferCanvas: false,
  });
  // Tile provider con fallback automático
  const tileUrls = [
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  ];
  let tileLayer = L.tileLayer(tileUrls[0], {
    attribution: '© OpenStreetMap · © CartoDB',
    subdomains: 'abcd',
    maxZoom: 19,
  });
  let idx = 0;
  tileLayer.on('tileerror', () => {
    idx++;
    if (idx < tileUrls.length) {
      map.removeLayer(tileLayer);
      tileLayer = L.tileLayer(tileUrls[idx], {
        attribution: '© OpenStreetMap',
        subdomains: idx === 0 ? 'abcd' : 'abc',
        maxZoom: 19,
      });
      tileLayer.addTo(map);
    }
  });
  tileLayer.addTo(map);

  // HQ markers (plantas operativas)
  const hqIcon = L.divIcon({
    className: '',
    html: '<div class="cv-marker-hq"></div>',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
  const hqList = [
    { name: 'Puerto Rawson', country: 'Argentina', coords: [-43.30, -65.10], role: 'Núcleo productivo' },
    { name: 'Palencia', country: 'España', coords: [42.00, -4.53], role: 'Logística + valor agregado' },
  ];
  hqList.forEach(hq => {
    L.marker(hq.coords, { icon: hqIcon, zIndexOffset: 1000 })
      .addTo(map)
      .bindPopup(`<strong>${hq.name}</strong><span>${hq.country} · ${hq.role}</span>`);
  });

  // Export markets (mercados destino) — clasificados por región
  const markets = [
    // Europa (eu)
    ['España','eu',[40.4,-3.7],'Iberia · principal mercado europeo'],
    ['Italia','eu',[41.9,12.5],'Sur de Europa · foodservice premium'],
    ['Francia','eu',[48.85,2.35],'HORECA y retail gourmet'],
    ['Reino Unido','eu',[51.5,-0.13],'Hospitality + Asian markets'],
    ['Alemania','eu',[52.5,13.4],'Industria de procesamiento'],
    ['Países Bajos','eu',[52.37,4.9],'Hub logístico Rotterdam'],
    ['Portugal','eu',[38.72,-9.14],'Mercado tradicional langostino'],
    ['Bélgica','eu',[50.85,4.35],'Foodservice + retail'],
    ['Polonia','eu',[52.23,21.01],'Retail europeo en expansión'],
    ['Grecia','eu',[37.98,23.73],'HORECA mediterránea'],
    ['Suecia','eu',[59.33,18.07],'Mercado nórdico premium'],
    ['Dinamarca','eu',[55.68,12.57],'Distribuidor regional'],
    ['Rumania','eu',[44.43,26.10],'Mercado emergente del Este'],
    ['Croacia','eu',[45.81,15.98],'Adriático foodservice'],
    // América (am)
    ['Estados Unidos','am',[38.9,-77.04],'Foodservice + retail gourmet'],
    ['Canadá','am',[45.42,-75.69],'Asian and ethnic markets'],
    ['México','am',[19.43,-99.13],'Foodservice Latam'],
    ['Argentina','am',[-34.61,-58.38],'Mercado interno'],
    ['Brasil','am',[-15.79,-47.88],'Sushi + foodservice'],
    ['Chile','am',[-33.45,-70.66],'Premium retail'],
    ['Uruguay','am',[-34.90,-56.16],'Importador regional'],
    ['Perú','am',[-12.05,-77.04],'Foodservice y ceviche'],
    ['Colombia','am',[4.71,-74.07],'Retail premium'],
    // Asia (as)
    ['Japón','as',[35.68,139.69],'Sushi grade · alta exigencia'],
    ['China','as',[39.90,116.40],'Volumen + retail premium'],
    ['Corea del Sur','as',[37.57,126.98],'Foodservice + retail'],
    ['Singapur','as',[1.35,103.82],'Hub regional Sudeste Asiático'],
    ['Tailandia','as',[13.75,100.50],'Industria procesadora'],
    ['Vietnam','as',[21.03,105.85],'Reproceso + reexportación'],
    ['Hong Kong','as',[22.32,114.17],'Foodservice de lujo'],
    ['Taiwán','as',[25.03,121.57],'Premium retail'],
    ['Filipinas','as',[14.60,120.98],'Foodservice'],
    ['EAU','as',[25.20,55.27],'Hospitality de lujo'],
    ['Israel','as',[31.78,35.22],'Retail kosher'],
    ['Arabia Saudita','as',[24.71,46.68],'Hospitality premium'],
    // África (af)
    ['Marruecos','af',[33.59,-7.62],'Reexportación a Europa'],
    ['Egipto','af',[30.04,31.24],'Hospitality Mediterráneo'],
    ['Sudáfrica','af',[-25.75,28.19],'Hub Sub-Sahara'],
    ['Nigeria','af',[9.08,8.68],'Retail emergente'],
    // Oceanía (oc)
    ['Australia','oc',[-33.87,151.21],'Premium retail + foodservice'],
    ['Nueva Zelanda','oc',[-41.29,174.78],'Foodservice premium'],
  ];

  const mktMarkers = [];
  markets.forEach(([name, region, coords, desc], i) => {
    const icon = L.divIcon({
      className: '',
      html: '<div class="cv-marker-mkt" data-region="' + region + '"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
    const m = L.marker(coords, { icon, opacity: 0 }).addTo(map);
    m._cvRegion = region;
    m._cvName = name;
    m._cvDesc = desc;
    m.bindTooltip(name, { direction: 'top', offset: [0, -8], className: 'cv-map-tooltip' });

    // Update side panel on hover
    m.on('mouseover', () => {
      const t = document.getElementById('mipTitle');
      const s = document.getElementById('mipSub');
      const b = document.getElementById('mipBar');
      if (t) t.textContent = name;
      if (s) s.textContent = desc;
      if (b) {
        const regionColor = {eu:'#7fe3df',am:'#1cb5b0',as:'#9fd9e8',af:'#e9b048',oc:'#8aa0f5'}[region];
        b.style.background = regionColor;
      }
    });
    m.on('mouseout', () => {
      const t = document.getElementById('mipTitle');
      const s = document.getElementById('mipSub');
      if (t) t.textContent = 'Presencia global';
      if (s) s.textContent = 'Hover sobre un marcador para ver el destino';
    });

    // Reveal escalonado al cargar
    setTimeout(() => m.setOpacity(1), 200 + i * 35);
    mktMarkers.push(m);
  });

  // Region filter
  document.querySelectorAll('.mf-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = btn.dataset.region;
      document.querySelectorAll('.mf-btn').forEach(b => b.classList.toggle('on', b === btn));
      mktMarkers.forEach(m => {
        const show = r === 'all' || m._cvRegion === r;
        m.setOpacity(show ? 1 : 0.12);
      });
    });
  });

  // Líneas de exportación desde Puerto Rawson hacia algunos mercados clave (sutiles)
  const hubArgentina = [-43.30, -65.10];
  const hubEspana = [42.00, -4.53];
  const keyDest = [
    [38.9, -77.04],   // USA
    [35.68, 139.69],  // Japón
    [39.90, 116.40],  // China
    [-25.75, 28.19],  // Sudáfrica
    [-33.87, 151.21], // Australia
  ];
  keyDest.forEach(d => {
    L.polyline([hubArgentina, d], {
      color: '#7fe3df', weight: 1, opacity: 0.18, dashArray: '4 6', interactive: false,
    }).addTo(map);
  });
  // Línea Argentina ↔ España (plantas conectadas)
  L.polyline([hubArgentina, hubEspana], {
    color: '#1cb5b0', weight: 2, opacity: 0.5, dashArray: '8 8', interactive: false,
  }).addTo(map);

  // Lazy resize cuando entra en viewport (Leaflet necesita invalidateSize si está oculto)
  const mapIO = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { map.invalidateSize(); } });
  }, { threshold: 0.05 });
  mapIO.observe(mapEl);
  setTimeout(() => map.invalidateSize(), 500);
};
// Pre-carga Leaflet + init mapa
const mapSection = document.getElementById('worldMap');
if (mapSection) {
  // En cuanto la página está idle, carga Leaflet Y inicializa el mapa
  const bootMap = async () => {
    try {
      await ensureLeaflet();
      await initWorldMap();
    } catch(e){ console.warn('Map boot failed:', e); }
  };
  const isTouch = window.matchMedia && window.matchMedia('(hover: none)').matches;
  if (isTouch) {
    // Móvil/iOS: no auto-cargar el mapa (Leaflet + decenas de tiles = mucha
    // memoria → crash). Se carga al tocar.
    const hint = document.createElement('button');
    hint.type = 'button'; hint.className = 'map-taphint';
    hint.innerHTML = '<span>🗺️ Toca para cargar el mapa interactivo</span>';
    mapSection.appendChild(hint);
    hint.addEventListener('click', () => { hint.remove(); bootMap(); }, { once: true });
  } else if ('requestIdleCallback' in window) {
    requestIdleCallback(bootMap, { timeout: 2000 });
  } else {
    setTimeout(bootMap, 1000);
  }
}

// ============ PLANT MODAL — video play en thumbnails ============
document.querySelectorAll('[data-play-video]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    // Cierra el modal de planta y abre el reproductor de video global
    const plantModal = btn.closest('.info-modal');
    if (plantModal) {
      plantModal.classList.remove('open');
      plantModal.setAttribute('aria-hidden', 'true');
    }
    const playerModalEl = document.getElementById('playerModal');
    if (playerModalEl) {
      playerModalEl.classList.add('open');
      playerModalEl.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  });
});

// ============ GALERÍAS en modales de planta: miniatura → imagen principal ============
document.querySelectorAll('.pm-gallery .pm-thumbs img').forEach(thumb => {
  thumb.addEventListener('click', (e) => {
    e.stopPropagation();
    const gallery = thumb.closest('.pm-gallery');
    const mainImg = gallery && gallery.querySelector('.pm-main img');
    if (!mainImg) return;
    if (mainImg.getAttribute('src') === thumb.getAttribute('src')) return;
    mainImg.src = thumb.src;
    mainImg.alt = thumb.alt;
    mainImg.classList.remove('pm-fade');
    void mainImg.offsetWidth; // reinicia la animación de fundido
    mainImg.classList.add('pm-fade');
    gallery.querySelectorAll('.pm-thumbs img').forEach(t => t.classList.remove('on'));
    thumb.classList.add('on');
  });
});

// ============ GALERÍAS de buque: carrusel + lightbox + iconos de ficha ============
(function () {
  const ns = 'http://www.w3.org/2000/svg';
  const S = (d, w) => `<svg viewBox="0 0 24 24" width="${w||20}" height="${w||20}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const ICONS = {
    ruler:'<path d="M15.5 3.5l5 5L8.5 20.5l-5-5z"/><path d="M9 7l2 2M12 10l1.5 1.5M6 10l2 2M15.5 6.5l1.5 1.5"/>',
    ship:'<path d="M3.5 14l8.5-3.6 8.5 3.6-1.7 5.4a1 1 0 01-.95.66H6.15a1 1 0 01-.95-.66L3.5 14z"/><path d="M12 10.2V4.2M9.2 6.2h5.6"/>',
    calendar:'<rect x="3.5" y="4.8" width="17" height="15.7" rx="2"/><path d="M3.5 9.3h17M8 2.8v4M16 2.8v4"/>',
    id:'<rect x="3" y="5.2" width="18" height="13.6" rx="2"/><circle cx="8.5" cy="11" r="2"/><path d="M13 9.5h5M13 13h5M5.4 15.4c.7-1.3 1.9-1.9 3.1-1.9s2.4.6 3.1 1.9"/>',
    anchor:'<circle cx="12" cy="5" r="2.2"/><path d="M12 7.2V20M5.5 12.5a6.5 6.5 0 0013 0M5.5 12.5H3.4M18.5 12.5h2.1"/>',
    cycle:'<path d="M3.6 12a8.4 8.4 0 0114.2-6.1M20.4 12A8.4 8.4 0 016.2 18.1"/><path d="M17.5 2.4V6h-3.6M6.5 21.6V18h3.6"/>',
    globe:'<circle cx="12" cy="12" r="8.4"/><path d="M3.6 12h16.8M12 3.6c2.5 2.4 2.5 14.4 0 16.8M12 3.6c-2.5 2.4-2.5 14.4 0 16.8"/>',
    snow:'<path d="M12 3v18M5 7.5l14 9M19 7.5l-14 9M12 3l-2.3 2.3M12 3l2.3 2.3M12 21l-2.3-2.3M12 21l2.3-2.3"/>',
    box:'<path d="M21 8.5l-9-5-9 5 9 5 9-5z"/><path d="M3 8.5v7l9 5 9-5v-7M12 13.5v7"/>',
    coins:'<ellipse cx="12" cy="6.4" rx="6.4" ry="2.7"/><path d="M5.6 6.4v5.4c0 1.5 2.9 2.7 6.4 2.7s6.4-1.2 6.4-2.7V6.4M5.6 11.8v5.4c0 1.5 2.9 2.7 6.4 2.7s6.4-1.2 6.4-2.7v-5.4"/>',
    pin:'<path d="M12 21s-6.4-5-6.4-11A6.4 6.4 0 0112 3.6 6.4 6.4 0 0118.4 10c0 6-6.4 11-6.4 11z"/><circle cx="12" cy="9.6" r="2.3"/>',
    people:'<circle cx="9" cy="8" r="3"/><path d="M3.6 19.5c0-3 2.4-5.4 5.4-5.4s5.4 2.4 5.4 5.4M16 5.2a3 3 0 010 5.7M20.4 19.5c0-2.3-1.2-4.2-3-5.1"/>',
    gauge:'<path d="M4 17.5a8 8 0 1116 0"/><path d="M12 17.5l3.6-3.6"/><circle cx="12" cy="17.5" r="1.2" fill="currentColor" stroke="none"/>',
    tag:'<path d="M20.4 13.1l-7.3 7.3a1.5 1.5 0 01-2.1 0l-7-7A1.5 1.5 0 013.5 12.3V5.6A1.6 1.6 0 015.1 4h6.7c.42 0 .82.17 1.12.46l7.5 7.5a1.5 1.5 0 010 2.14z"/><circle cx="8" cy="8" r="1.25"/>',
    shield:'<path d="M12 3l7.4 2.8v5.6c0 4.6-3.1 7.5-7.4 8.6-4.3-1.1-7.4-4-7.4-8.6V5.8z"/><path d="M9 12l2.1 2.1L15.1 10"/>'
  };
  // Decorar fichas con iconos
  document.querySelectorAll('.spec-card[data-ic]').forEach(card => {
    const ic = ICONS[card.getAttribute('data-ic')];
    if (!ic) return;
    const sp = document.createElement('span');
    sp.className = 'spec-ic'; sp.innerHTML = S(ic, 20);
    card.insertBefore(sp, card.firstChild);
  });
  document.querySelectorAll('.spec-highlight').forEach(h => {
    const sp = document.createElement('span');
    sp.className = 'sh-ic'; sp.innerHTML = S(ICONS.shield, 22);
    h.insertBefore(sp, h.firstChild);
  });

  // Lightbox global
  const lb = document.getElementById('sgLightbox');
  const lbImg = lb && lb.querySelector('.sgl-img');
  const lbCur = lb && lb.querySelector('.sgl-cur');
  const lbTot = lb && lb.querySelector('.sgl-total');
  let lbList = [], lbIdx = 0;
  function lbRender(){ if(!lbImg) return; lbImg.src=lbList[lbIdx].src; lbImg.alt=lbList[lbIdx].alt; if(lbCur)lbCur.textContent=lbIdx+1; if(lbTot)lbTot.textContent=lbList.length; }
  function lbOpen(list,i){ lbList=list; lbIdx=i; lbRender(); lb.classList.add('open'); lb.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
  function lbClose(){ lb.classList.remove('open'); lb.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
  function lbGo(d){ lbIdx=(lbIdx+d+lbList.length)%lbList.length; lbRender(); }
  if (lb) {
    lb.querySelector('.sgl-close').addEventListener('click', lbClose);
    lb.querySelector('.sgl-prev').addEventListener('click', e=>{e.stopPropagation();lbGo(-1);});
    lb.querySelector('.sgl-next').addEventListener('click', e=>{e.stopPropagation();lbGo(1);});
    lb.addEventListener('click', e=>{ if(e.target===lb||e.target.classList.contains('sgl-figure')) lbClose(); });
    document.addEventListener('keydown', e=>{ if(!lb.classList.contains('open'))return; if(e.key==='Escape')lbClose(); else if(e.key==='ArrowLeft')lbGo(-1); else if(e.key==='ArrowRight')lbGo(1); });
  }

  // Cada galería de buque
  document.querySelectorAll('[data-gallery]').forEach(g => {
    const stage = g.querySelector('.sg-stage');
    const main = g.querySelector('.sg-main');
    const thumbs = [...g.querySelectorAll('.sg-thumb')];
    const imgs = thumbs.map(t => { const im=t.querySelector('img'); return {src:im.getAttribute('src'), alt:im.getAttribute('alt')}; });
    let idx = 0;
    // Controles inyectados
    const counter = document.createElement('span');
    counter.className = 'sg-counter';
    counter.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 16l5-4 4 3 3-2 6 4"/><circle cx="8.5" cy="9" r="1.4"/></svg><span class="sg-cur">1</span>&#8201;/&#8201;<span class="sg-total">${imgs.length}</span>`;
    stage.appendChild(counter);
    const cur = counter.querySelector('.sg-cur');
    const mkNav = (cls, path, label) => { const b=document.createElement('button'); b.type='button'; b.className='sg-nav '+cls; b.setAttribute('aria-label',label); b.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`; return b; };
    const prev = mkNav('sg-prev','M15 6l-6 6 6 6','Imagen anterior');
    const next = mkNav('sg-next','M9 6l6 6-6 6','Imagen siguiente');
    const zoom = document.createElement('button'); zoom.type='button'; zoom.className='sg-zoom'; zoom.setAttribute('aria-label','Ampliar imagen');
    zoom.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-3.6-3.6M11 8.2v5.6M8.2 11h5.6"/></svg>';
    stage.appendChild(prev); stage.appendChild(next); stage.appendChild(zoom);
    if (imgs.length <= 1) {
      prev.style.display='none'; next.style.display='none'; counter.style.display='none';
      const tw = g.querySelector('.sg-thumbs'); if (tw) tw.style.display='none';
    }
    // Check en miniaturas
    thumbs.forEach(t => { const c=document.createElement('span'); c.className='sg-check'; c.innerHTML='<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4 10-10"/></svg>'; t.appendChild(c); });

    function show(i){
      idx = (i + imgs.length) % imgs.length;
      main.classList.remove('sg-fade'); void main.offsetWidth; main.classList.add('sg-fade');
      main.src = imgs[idx].src; main.alt = imgs[idx].alt;
      thumbs.forEach((t,k)=>t.classList.toggle('is-active', k===idx));
      cur.textContent = idx+1;
    }
    thumbs.forEach((t,k)=> t.addEventListener('click', e=>{ e.stopPropagation(); show(k); }));
    prev.addEventListener('click', e=>{ e.stopPropagation(); show(idx-1); });
    next.addEventListener('click', e=>{ e.stopPropagation(); show(idx+1); });
    const openZoom = e=>{ e.stopPropagation(); lbOpen(imgs, idx); };
    zoom.addEventListener('click', openZoom);
    main.addEventListener('click', openZoom);
  });
})();

// ============ EQUIPO — filtro por área ============
(function () {
  const bar = document.querySelector('[data-team-filter]');
  if (!bar) return;
  const members = Array.prototype.slice.call(document.querySelectorAll('[data-team-grid] .member'));
  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('.tf');
    if (!btn) return;
    const f = btn.getAttribute('data-f');
    bar.querySelectorAll('.tf').forEach(b => b.classList.toggle('is-active', b === btn));
    members.forEach(m => {
      const show = f === 'all' || m.getAttribute('data-area') === f;
      m.classList.toggle('is-hidden', !show);
    });
  });
})();

// ============ AI CHATBOT (LLM real Qwen2 + KB fallback) ============
const AI_CHAT_ENDPOINT = 'https://rendering-totally-production-looksmart.trycloudflare.com/chat';
const aiChatBtn = document.getElementById('aiChatBtn');
const aiChat = document.getElementById('aiChat');
const aiChatClose = document.getElementById('aiChatClose');
const aiChatForm = document.getElementById('aiChatForm');
const aiChatInput = document.getElementById('aiChatInput');
const aiChatBody = document.getElementById('aiChatBody');
const chatHistory = []; // [{role, content}]

// Knowledge base: keywords → respuesta estructurada
const KB = [
  { keys:['producto','productos','venden','vendes','vende','que vende','que producen','que produce','que hace','que hacen','catalogo','catálogo','oferta'],
    a:`Cabo Vírgenes es especialista en <strong>langostino austral salvaje</strong> (<em>Pleoticus muelleri</em>), capturado en el Atlántico Sudoccidental (FAO 41). Ofrecemos 5 formatos:<ul><li><strong>HOSO</strong> — entero con cabeza y caparazón</li><li><strong>HLSO</strong> — cola con caparazón</li><li><strong>EZP</strong> — easy peel</li><li><strong>P&D</strong> — pelado y desvenado</li><li><strong>PDTO</strong> — tail-on</li></ul>Y 6 calibres (L1, L2, L3, C1, C2, CR).`},
  { keys:['ubicacion','ubicación','donde estan','dónde están','donde están','sede','oficina','direccion','dirección','plantas','planta','localizacion'],
    a:`Tenemos <strong>2 plantas operativas</strong>:<ul><li>🇦🇷 <strong>Puerto Rawson, Chubut (Argentina)</strong> — núcleo productivo. Congelación 100 t/día, almacenamiento 1.600 t.</li><li>🇪🇸 <strong>Palencia (España)</strong> — plataforma logística + valor agregado. 4.600 m², procesamiento 22.000 kg/día.</li></ul>Exportamos a 40+ países en 5 continentes.`},
  { keys:['certificacion','certificación','certificaciones','calidad','iso','haccp','msc','brcgs','ifs','asc','fda'],
    a:`Tenemos <strong>6 certificaciones activas</strong>:<ul><li><strong>HACCP</strong> — análisis de peligros</li><li><strong>BRCGS</strong> — Global Food Safety v9</li><li><strong>IFS Food</strong> — Higher Level</li><li><strong>MSC</strong> — pesca sostenible (en proceso)</li><li><strong>ASC</strong> — acuicultura responsable</li><li><strong>FDA</strong> — habilitación EEUU</li></ul>Más SENASA (Argentina), CIQ (China) y EU Approved.`},
  { keys:['cotizacion','cotización','precio','presupuesto','comprar','pedido','muestra','muestras','quote'],
    a:`Para cotizar, escribinos a <strong>comercial@cabovirgenes.com</strong> o llamá al <strong>+54 280 4495000</strong>. Respondemos en menos de 24h con:<ul><li>Disponibilidad por formato/calibre</li><li>Presentaciones (estuches, bloques, granel)</li><li>Volúmenes y precios por destino</li><li>Tiempos de despacho desde Puerto Rawson o Palencia</li></ul>También podés llenar el formulario en la sección Contacto.`},
  { keys:['rasa','rawson ambiental','biosalina','efluentes','sostenibilidad','sostenible','ambiental','medio ambiente','reciclaje','circular'],
    a:`<strong>RASA (Rawson Ambiental S.A.)</strong> es nuestra apuesta de economía circular. Es la <strong>primera planta del país</strong> que combina tratamiento integral de efluentes pesqueros con una <strong>granja biosalina</strong>.<br/><br/>El agua tratada se reutiliza para cultivar 4 halófitos comercializables: <strong>Salicornia</strong> (gourmet), <strong>Microalgas</strong> (acuícola), <strong>Zampa</strong> (forraje) y <strong>Piquillín</strong> (bayas nativas). Cabo Vírgenes participa accionariamente. 0% de vertido al océano.`},
  { keys:['flota','barcos','barco','buques','buque','espartano','mar esmeralda','kaleu','cristo','iglu'],
    a:`Operamos <strong>5 buques propios</strong>:<ul><li><strong>3 fresqueros</strong>: Espartano (21m), Cristo Redentor (31m), Iglú I (32m) — operan desde Puerto Rawson con ciclo corto.</li><li><strong>2 factoría</strong>: Mar Esmeralda (53m) y Kaleu Kaleu (56m) — congelan a bordo IQF.</li></ul>Captura total &gt; 3.000 t/año.`},
  { keys:['historia','fundacion','fundación','año','desde cuando','quienes son','quiénes son','empresa','aisa'],
    a:`Cabo Vírgenes fue <strong>fundada en 2008</strong>. En <strong>enero de 2025</strong> se incorporó a <strong>AISA Group</strong>, consolidando su posicionamiento en la industria pesquera internacional. Estructura binacional Argentina–España, especializada en langostino austral salvaje.`},
  { keys:['exportacion','exportación','exportan','paises','países','mercados','destino','europa','asia','estados unidos','china','japon','japón','msc countries','clientes'],
    a:`Exportamos a <strong>40+ países en 5 continentes</strong>:<ul><li><strong>Europa</strong> (14): España, Italia, Francia, UK, Alemania, Países Bajos, Portugal, Bélgica, Polonia, Grecia, Suecia, Dinamarca, Rumania, Croacia</li><li><strong>América</strong> (9): USA, Canadá, México, Brasil, Chile, etc.</li><li><strong>Asia</strong> (12): Japón, China, Corea del Sur, Singapur, Tailandia, etc.</li><li><strong>África</strong> (4) y <strong>Oceanía</strong> (2)</li></ul>`},
  { keys:['trazabilidad','origen','captura','pesca','seguimiento','traceability','lote'],
    a:`Trazabilidad <strong>end-to-end</strong> por lote: cada caja máster lleva impresos la zona FAO, buque captor, fecha de captura, planta de procesamiento y código de lote. Sistema compatible con auditorías UE, FDA, SENASA y CIQ China. Captura en FAO 41 (Atlántico Sudoccidental).`},
  { keys:['solar','energia','energía','renovable','paneles','sol','fotovoltaico','co2','huella'],
    a:`Tenemos <strong>1.100+ paneles fotovoltaicos</strong> en la planta de Palencia, activados en 2024. Sistema de autoconsumo que cubre el <strong>38%</strong> de la demanda eléctrica y evita <strong>~450 t de CO₂/año</strong>.`},
  { keys:['contacto','hablar','telefono','teléfono','email','whatsapp','wa','escribir'],
    a:`Múltiples canales de contacto:<ul><li>📧 <strong>info@cabovirgenes.com</strong> (general)</li><li>📧 <strong>comercial@cabovirgenes.com</strong> (cotizaciones)</li><li>📧 <strong>prensa@cabovirgenes.com</strong> (PR)</li><li>📧 <strong>rrhh@cabovirgenes.com</strong> (RRHH)</li><li>📞 <strong>+54 280 4495000</strong></li><li>💬 <strong><a href="https://wa.me/542804495000" target="_blank">WhatsApp</a></strong> — respuesta inmediata</li></ul>`},
  { keys:['hola','hi','hey','buenas','buenos dias','buenos días','buen dia','buen día','saludos'],
    a:`¡Hola! 👋 Soy el asistente virtual de Cabo Vírgenes. Puedo ayudarte con información sobre productos, certificaciones, plantas, flota, sostenibilidad o cualquier consulta sobre la empresa. ¿En qué puedo ayudarte?`},
  { keys:['gracias','thanks'],
    a:`¡Gracias a vos! Si necesitás algo más, escribime. Para consultas comerciales formales: <strong>comercial@cabovirgenes.com</strong> o <a href="https://wa.me/542804495000" target="_blank">WhatsApp</a>.`},
];

function normalize(s){
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/[¿?¡!.,;:]/g,'').trim();
}
function findAnswer(q){
  const n = normalize(q);
  let best = null, bestScore = 0;
  for (const item of KB) {
    let score = 0;
    for (const k of item.keys){
      if (n.includes(normalize(k))) score += k.length;
    }
    if (score > bestScore) { bestScore = score; best = item; }
  }
  return best ? best.a :
    `No encontré información específica sobre eso. Te recomiendo:<ul><li>Escribir a <strong>info@cabovirgenes.com</strong></li><li>Mandar <a href="https://wa.me/542804495000?text=${encodeURIComponent(q)}" target="_blank"><strong>WhatsApp</strong></a> con tu consulta</li><li>Llenar el formulario en la sección Contacto</li></ul>El equipo te responde en menos de 24h hábiles.`;
}

function addMsg(html, type='bot'){
  const wrap = document.createElement('div');
  wrap.className = 'ac-msg ac-msg-' + type;
  const p = document.createElement('p');
  p.innerHTML = html;
  wrap.appendChild(p);
  aiChatBody.appendChild(wrap);
  aiChatBody.scrollTop = aiChatBody.scrollHeight;
  return wrap;
}
function addTyping(){
  const t = document.createElement('div');
  t.className = 'ac-typing';
  t.innerHTML = '<span></span><span></span><span></span>';
  t.id = 'acTyping';
  aiChatBody.appendChild(t);
  aiChatBody.scrollTop = aiChatBody.scrollHeight;
}
function rmTyping(){ const t=document.getElementById('acTyping'); if(t)t.remove(); }

async function askBot(q){
  addMsg(q, 'user');
  chatHistory.push({ role:'user', content:q });
  addTyping();

  // Intentar LLM real primero
  try {
    const r = await fetch(AI_CHAT_ENDPOINT, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        message: q,
        history: chatHistory.slice(-10), // últimos 10 turnos
      }),
    });
    if (r.ok) {
      const data = await r.json();
      const reply = (data?.reply || '').trim();
      if (reply) {
        rmTyping();
        // Convertir saltos de línea a <br>
        const html = escapeHtml(reply).replace(/\n/g, '<br>');
        addMsg(html, 'bot');
        chatHistory.push({ role:'assistant', content: reply });
        return;
      }
    }
  } catch(e){ /* fallthrough a KB local */ }

  // Fallback a knowledge base local
  rmTyping();
  const ans = findAnswer(q);
  addMsg(ans, 'bot');
  chatHistory.push({ role:'assistant', content: ans.replace(/<[^>]+>/g,'') });
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

if (aiChatBtn && aiChat) {
  aiChatBtn.addEventListener('click', () => aiChat.classList.toggle('open'));
  if (aiChatClose) aiChatClose.addEventListener('click', () => aiChat.classList.remove('open'));
  if (aiChatForm) {
    aiChatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = aiChatInput.value.trim();
      if (!q) return;
      aiChatInput.value = '';
      askBot(q);
    });
  }
  // Click on suggestion chips
  document.addEventListener('click', (e) => {
    if (e.target.classList?.contains('ac-sug')) askBot(e.target.dataset.q);
  });
}

// ============ SOLAR GRID (Section 07 — 1.100 paneles animados) ============
const solarGrid = document.getElementById('solarGrid');
if (solarGrid) {
  // Rejilla de paneles (decorativa). 1.120 celdas con transform 3D agotaban la
  // GPU de iOS y crasheaban la página; usamos muchas menos (sigue leyéndose como
  // un campo de paneles). En táctil, mínimas y sin animación.
  const touch = window.matchMedia && window.matchMedia('(hover: none)').matches;
  const cols = touch ? 12 : 24, rows = touch ? 8 : 15;
  solarGrid.style.gridTemplateColumns = `repeat(${cols},1fr)`;
  solarGrid.style.gridTemplateRows = `repeat(${rows},1fr)`;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < cols * rows; i++) {
    const d = document.createElement('span');
    d.className = 'sv-cell';
    if (!touch) d.style.animationDelay = ((i % cols) * 50 + Math.floor(i / cols) * 30) + 'ms';
    frag.appendChild(d);
  }
  solarGrid.appendChild(frag);
}

// ============ HERO ship-cutout: switch to video on hover ============
const heroVideo = document.querySelector('.ship-cutout .ship-video');
if (heroVideo) {
  heroVideo.muted = true;
  heroVideo.play().catch(() => {});
}

// ============ V-CARDS FAN: shuffle natural (auto + pager) ============
const fan = document.getElementById('vcardsFan');
const pager = document.getElementById('vcardsPager');
if (fan && pager) {
  const cards = Array.from(fan.querySelectorAll('.v-card'));
  const dots = Array.from(pager.querySelectorAll('button'));
  const total = cards.length;
  let active = 0, timer = null;
  const reorderFan = (a) => {
    active = ((a % total) + total) % total;
    // la activa pasa a data-fan=0, el resto se reasigna en orden (baraja)
    cards.forEach((c, idx) => {
      c.dataset.fan = String(((idx - active) + total) % total);
    });
    dots.forEach((d, i) => d.classList.toggle('on', i === active));
  };
  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
  const start = () => { stop(); timer = setInterval(() => reorderFan(active + 1), 4000); };
  dots.forEach((d, i) => d.addEventListener('click', () => { reorderFan(i); start(); }));
  fan.addEventListener('mouseenter', stop);
  fan.addEventListener('mouseleave', start);
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) start();
}

// ============ LANGUAGE DROPDOWN ============
const langPillBtn = document.getElementById('langPillBtn');
const langMenu = document.getElementById('langMenu');
const langCurrent = document.getElementById('langCurrent');
if (langPillBtn && langMenu) {
  const closeLang = () => {
    langMenu.classList.remove('open');
    langPillBtn.setAttribute('aria-expanded', 'false');
    langMenu.setAttribute('aria-hidden', 'true');
  };
  const openLang = () => {
    langMenu.classList.add('open');
    langPillBtn.setAttribute('aria-expanded', 'true');
    langMenu.setAttribute('aria-hidden', 'false');
  };
  langPillBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    langMenu.classList.contains('open') ? closeLang() : openLang();
  });
  document.addEventListener('click', (e) => {
    if (!langMenu.contains(e.target) && e.target !== langPillBtn) closeLang();
  });
  langMenu.querySelectorAll('.lang-item').forEach(item => {
    item.addEventListener('click', async () => {
      const lang = item.dataset.lang;
      langMenu.querySelectorAll('.lang-item').forEach(i => i.classList.toggle('active', i === item));
      langCurrent.textContent = lang.toUpperCase();
      if (window.cvI18n) await window.cvI18n.setLanguage(lang);
      closeLang();
      if (lang !== 'es') toast('Idioma cambiado a ' + item.querySelector('.lang-name').textContent);
    });
  });
}

// ============ SIDE RAIL ARROW: scroll a la siguiente sección ============
// Cualquier .rail-arrow con data-next-section navega a la sección siguiente
document.querySelectorAll('.rail-arrow[data-next-section]').forEach(arrow => {
  arrow.addEventListener('click', (e) => {
    e.preventDefault();
    const target = arrow.dataset.nextSection;
    const el = document.getElementById(target);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
