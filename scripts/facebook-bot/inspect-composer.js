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

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setCookie(...parseCookies(cfg.cookieString));
  await page.goto('https://www.facebook.com/61595136714776', { waitUntil: 'networkidle2' });
  await sleep(3000);

  // Proven switch from facebook-poster.js
  const switchTriggered = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('div[role="button"], button'));
    const target = buttons.find(b => {
      const t = (b.innerText || b.getAttribute('aria-label') || '').trim();
      return t === 'Switch Now' || t === 'Switch';
    });
    if (target) { target.click(); return true; }
    return false;
  });

  if (switchTriggered) {
    await sleep(2500);
    const modalSwitchClicked = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('div[role="dialog"] *'));
      for (const el of elements) {
        const text = (el.innerText || el.getAttribute('aria-label') || '').trim();
        if (text === 'Switch' && (el.getAttribute('role') === 'button' || el.tagName === 'BUTTON' || el.getAttribute('aria-label') === 'Switch')) {
          el.click();
          return true;
        }
      }
      return false;
    });
    console.log('Modal switch clicked:', modalSwitchClicked);
    if (modalSwitchClicked) await sleep(8000);
  }

  // Open composer via What's on your mind
  console.log("Clicking What's on your mind...");
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('div[role="button"], span')).find(x => (x.innerText||'').includes("What's on your mind"));
    if (b) b.click();
  });
  await sleep(3500);

  console.log('Looking for photo icon in Add to your post...');
  // Inspect all icons in Add to your post
  const icons = await page.evaluate(() => {
    const dialog = document.querySelector('div[role="dialog"]');
    if (!dialog) return [];
    return Array.from(dialog.querySelectorAll('div[aria-label], img[alt], div[role="button"]')).map(el => ({
      ariaLabel: el.getAttribute('aria-label'),
      alt: el.getAttribute('alt'),
      role: el.getAttribute('role'),
      tag: el.tagName
    })).filter(x => x.ariaLabel || x.alt);
  });
  console.log('ICONS IN DIALOG:', JSON.stringify(icons, null, 2));

  // Click Photo/video button inside "Add to your post"
  const photoClicked = await page.evaluate(() => {
    const dialog = document.querySelector('div[role="dialog"]');
    if (!dialog) return false;
    const items = Array.from(dialog.querySelectorAll('div[aria-label], div[role="button"]'));
    const photo = items.find(el => {
      const a = el.getAttribute('aria-label') || '';
      return a === 'Photo/video' || a === 'ছবি/ভিডিও' || a.includes('Photo');
    });
    if (photo) {
      photo.click();
      return true;
    }
    return false;
  });
  console.log('Photo clicked in dialog:', photoClicked);
  await sleep(3000);

  // Now inspect file inputs inside dialog!
  const fileInputs = await page.evaluate(() => {
    const dialog = document.querySelector('div[role="dialog"]');
    if (!dialog) return [];
    return Array.from(dialog.querySelectorAll('input[type="file"]')).map(inp => ({
      accept: inp.accept,
      multiple: inp.multiple,
      name: inp.name
    }));
  });
  console.log('FILE INPUTS IN DIALOG AFTER PHOTO CLICK:', JSON.stringify(fileInputs, null, 2));

  // Take screenshot of composer with photo dropzone open
  await page.screenshot({ path: path.join(__dirname, 'temp', 'photo_dropzone.png') });
  console.log('Saved photo_dropzone.png');

  await browser.close();
})().catch(e => console.error(e));
