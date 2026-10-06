const fs = require('fs');
const path = require('path');

function loadPuppeteer() {
  const possiblePaths = [
    "puppeteer-core",
    path.resolve(__dirname, "../../apps/workers/node_modules/puppeteer-core"),
    path.resolve(__dirname, "../../node_modules/puppeteer-core"),
    path.resolve(__dirname, "../../node_modules/.pnpm/puppeteer-core@25.12.0/node_modules/puppeteer-core"),
  ];
  for (const p of possiblePaths) {
    try { return require(p); } catch (_) {}
  }
  throw new Error("puppeteer-core could not be loaded.");
}
const puppeteer = loadPuppeteer();

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'active-session.json'), 'utf8'));

function parseCookies(str) {
  return str.split(';').map(s => s.trim()).filter(Boolean).map(item => {
    const eq = item.indexOf('=');
    return { name: item.slice(0, eq).trim(), value: item.slice(eq+1).trim(), domain: '.facebook.com', path: '/' };
  });
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setCookie(...parseCookies(cfg.cookieString));
  console.log('Navigating to https://www.facebook.com/61595136714776...');
  await page.goto('https://www.facebook.com/61595136714776', { waitUntil: 'networkidle2', timeout: 45000 });
  
  const title = await page.title();
  console.log('PAGE TITLE:', title);

  const textSnippets = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('div[role="button"], span, div[role="textbox"]'));
    return elements
      .map(el => (el.innerText || el.getAttribute('aria-label') || '').trim())
      .filter(t => t.includes('post') || t.includes('Post') || t.includes('write') || t.includes('Write') || t.includes('Switch') || t.includes('welcome') || t.includes('কিছু') || t.includes('পোস্ট'))
      .slice(0, 20);
  });
  console.log('RELEVANT ELEMENTS:', JSON.stringify(textSnippets, null, 2));

  const screenshotPath = path.join(__dirname, 'temp', 'page_preview.png');
  await page.screenshot({ path: screenshotPath });
  console.log('SCREENSHOT SAVED to:', screenshotPath);

  await browser.close();
})().catch(e => console.error('ERR:', e.message));
