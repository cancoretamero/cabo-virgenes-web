const puppeteer = require('puppeteer');
(async () => {
  const b = await puppeteer.launch({ args: ['--no-sandbox'] });
  const p = await b.newPage();
  p.on('console', msg => console.log('PAGE LOG:', msg.text()));
  p.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await p.goto('http://127.0.0.1:8080', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await p.evaluate(() => Promise.all(Array.from(document.images).map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; }))));
  // Force-trigger all reveals (so static screenshot shows everything)
  await p.evaluate(() => {
    document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('in'));
    window.scrollTo(0, 0);
  });
  await new Promise(r => setTimeout(r, 1200));
  await p.screenshot({ path: 'current.png', fullPage: true });
  await b.close();
  console.log('ok');
})();
