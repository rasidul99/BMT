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
  await page.goto('https://www.facebook.com/61595136714776', { waitUntil: 'networkidle2', timeout: 45000 });

  console.log('1. Page loaded. Clicking primary Switch Now button...');
  const switchClicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('div[role="button"]'));
    const target = buttons.find(b => (b.innerText || '').trim() === 'Switch Now' || (b.innerText || '').trim() === 'Switch');
    if (target) {
      target.click();
      return true;
    }
    return false;
  });

  console.log('Switch button clicked:', switchClicked);
  await new Promise(r => setTimeout(r, 2500));

  console.log('2. Inspecting all clickable elements containing "Switch"...');
  const candidates = await page.evaluate(() => {
    const list = [];
    document.querySelectorAll('*').forEach(el => {
      const text = (el.innerText || '').trim();
      const aria = el.getAttribute('aria-label') || '';
      if ((text === 'Switch' || aria === 'Switch') && (el.getAttribute('role') === 'button' || el.tagName === 'BUTTON' || el.tagName === 'DIV')) {
        list.push({
          tag: el.tagName,
          role: el.getAttribute('role'),
          ariaLabel: aria,
          className: el.className?.slice ? el.className.slice(0, 40) : '',
          text: text
        });
      }
    });
    return list;
  });
  console.log('Candidates:', JSON.stringify(candidates, null, 2));

  // Try clicking the modal Switch button
  const confirmResult = await page.evaluate(() => {
    // Find all elements that look like the blue Switch button in the modal
    const all = Array.from(document.querySelectorAll('div[aria-label="Switch"], div[role="button"]'));
    for (const el of all) {
      const txt = (el.innerText || el.getAttribute('aria-label') || '').trim();
      // Look for the exact "Switch" button inside the modal dialog
      if (txt === 'Switch' && el.closest('div[role="dialog"]')) {
        el.click();
        return { success: true, method: 'dialog Switch clicked' };
      }
    }
    return { success: false };
  });
  console.log('Confirm result:', confirmResult);

  if (confirmResult.success) {
    console.log('Waiting 8 seconds for page to switch profile...');
    await new Promise(r => setTimeout(r, 8000));
    console.log('New URL after profile switch:', page.url());
    console.log('New Title:', await page.title());
    await page.screenshot({ path: path.join(__dirname, 'temp', 'confirmed_switch.png') });
    console.log('Saved confirmed_switch.png');
  }

  await browser.close();
})().catch(e => console.error(e));
