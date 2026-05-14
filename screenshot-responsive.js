const puppeteer = require('puppeteer');
(async () => {
  const b = await puppeteer.launch({ args: ['--no-sandbox'] });
  const widths = [1920, 1440, 1100, 880, 600];
  for (const w of widths) {
    const p = await b.newPage();
    await p.setViewport({ width: w, height: 900, deviceScaleFactor: 1 });
    await p.goto('http://127.0.0.1:8080', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await p.evaluate(() => Promise.all(Array.from(document.images).map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; }))));
    await p.evaluate(() => { document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('in')); window.scrollTo(0,0); });
    await new Promise(r => setTimeout(r, 800));
    await p.screenshot({ path: `resp-${w}.png`, fullPage: false });
    await p.close();
  }
  await b.close();
  console.log('ok');
})();
