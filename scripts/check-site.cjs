const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const output = process.env.SITE_CHECK_OUTPUT || '/tmp/pulse-site-design-check';
fs.mkdirSync(output, { recursive: true });
const origin = 'http://127.0.0.1:8127';
const types = {
  '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
};
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(root, pathname === '/' ? 'index.html' : pathname);
  try {
    res.setHeader('Content-Type', types[path.extname(file)] || 'text/html');
    res.end(fs.readFileSync(file));
  } catch {
    res.statusCode = 404;
    res.end('Missing');
  }
});

async function verifyPage(page, route, width) {
  await page.goto(origin + route);
  // A full-page screenshot must load below-fold images, too. Ignore the empty
  // existing photo-dialog image until its user action assigns a source.
  await page.locator('img[src]').evaluateAll(images => images.forEach(i => i.loading = 'eager'));
  await page.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => {}))));
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) {
    throw Error(`Horizontal overflow: ${width} ${route}`);
  }
  if (await page.locator('img[src]').evaluateAll(images => images.some(i => !i.naturalWidth))) {
    throw Error(`Missing image: ${route}`);
  }
  const label = route === '/' ? 'home' : 'work';
  await page.screenshot({ path: `${output}/${width}-${label}.png`, fullPage: true });
  if (route === '/work.html') {
    await page.locator('#tab-trade').focus();
    await page.keyboard.press('ArrowRight');
    if (await page.locator('#tab-routes').getAttribute('aria-selected') !== 'true' ||
        !await page.locator('#panel-routes').isVisible()) throw Error('Arrow-key selection failed');
    await page.locator('.pf-case-layout').screenshot({ path: `${output}/${width}-routes.png` });
    await page.keyboard.press('End');
    if (!await page.locator('#panel-mechanism').isVisible()) throw Error('End-key selection failed');
    await page.locator('.pf-case-layout').screenshot({ path: `${output}/${width}-mechanism.png` });
    await page.locator('#tab-trade').click();
    if (!await page.locator('#panel-trade').isVisible()) throw Error('Pointer selection failed');
  }
  const broken = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')]
    .filter(a => !document.getElementById(a.hash.slice(1))).map(a => a.href));
  if (broken.length) throw Error(`Broken anchors: ${broken}`);
  console.log(width, route, 'PASS');
}

(async () => {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(8127, '127.0.0.1', resolve);
  });
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    });
    for (const width of [390, 1440, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      for (const route of ['/', '/work.html']) await verifyPage(page, route, width);
      for (const alias of ['/en/', '/zh/', '/en/work.html', '/zh/work.html']) {
        await page.goto(origin + (alias.endsWith('/') ? alias + 'index.html' : alias));
        await page.waitForURL(alias.includes('work') ? '**/work.html' : origin + '/');
      }
      if (errors.length) throw Error(errors.join('\n'));
      await page.close();
    }
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
