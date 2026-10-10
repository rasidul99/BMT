const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

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
  const localImagePath = path.join(__dirname, 'temp', 'watch_test.jpg');
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

  // Switch if needed
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
    if (modalSwitchClicked) await sleep(8000);
  }

  // Open composer via What's on your mind
  console.log("1. Opening composer...");
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('div[role="button"], span')).find(x => (x.innerText||'').includes("What's on your mind"));
    if (b) b.click();
  });
  await sleep(3500);

  // Click Photo/video button in "Add to your post"
  console.log("2. Clicking Photo/video inside dialog...");
  await page.evaluate(() => {
    const dialog = document.querySelector('div[role="dialog"]');
    if (!dialog) return;
    const items = Array.from(dialog.querySelectorAll('div[aria-label], div[role="button"]'));
    const photo = items.find(el => {
      const a = el.getAttribute('aria-label') || '';
      return a === 'Photo/video' || a === 'ছবি/ভিডিও' || a.includes('Photo');
    });
    if (photo) photo.click();
  });
  await sleep(2500);

  // Upload file
  console.log("3. Uploading image to input[type=file] inside dialog...");
  const fileInput = await page.$('div[role="dialog"] input[type="file"]');
  if (fileInput) {
    await fileInput.uploadFile(localImagePath);
    console.log("Uploaded! Waiting 6s for Facebook to process image...");
    await sleep(6000);
  }

  // Type clean message (NO [Curiosity]!)
  console.log("4. Typing post message (clean)...");
  const textBox = await page.$('div[role="dialog"] div[role="textbox"]');
  if (textBox) {
    await textBox.click();
    await sleep(500);
    await page.type('div[role="dialog"] div[role="textbox"]', "Eid Special Premium Watch Collection Offer 2026\n\nঈদ অফারে পাচ্ছেন প্রিমিয়াম ওয়াচ কালেকশনে ৪০% পর্যন্ত ছাড়! স্টক সীমিত। অর্ডার করতে এখনই ইনবক্স করুন।\n\n#EidSale #FashionBD #WatchOffer", { delay: 30 });
    await sleep(2000);
  }

  // Screenshot to see attached image in composer!
  await page.screenshot({ path: path.join(__dirname, 'temp', 'composer_with_real_image.png') });
  console.log('Saved composer_with_real_image.png');

  // Submit post
  console.log("5. Submitting post...");
  const primarySubmit = await page.evaluate(() => {
    const dialog = document.querySelector('div[role="dialog"]');
    if (!dialog) return false;
    const buttons = Array.from(dialog.querySelectorAll('div[role="button"], button'));
    const nextBtn = buttons.find(b => {
      const t = (b.innerText || b.getAttribute('aria-label') || '').trim();
      return t === 'Next' || t === 'Post' || t === 'পোস্ট করুন' || t === 'পরবর্তী';
    });
    if (nextBtn) {
      nextBtn.click();
      return { success: true, text: (nextBtn.innerText || nextBtn.getAttribute('aria-label') || '').trim() };
    }
    return { success: false };
  });

  console.log("Primary submit:", primarySubmit);
  await sleep(3000);

  if (primarySubmit && (primarySubmit.text === 'Next' || primarySubmit.text === 'পরবর্তী')) {
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('div[role="button"], button, div[aria-label]'));
      const postBtn = buttons.find(b => {
        const t = (b.innerText || b.getAttribute('aria-label') || '').trim();
        return t === 'Post' || t === 'Publish' || t === 'পোস্ট করুন' || t === 'প্রকাশ করুন';
      });
      if (postBtn) postBtn.click();
    });

    for (let check = 0; check < 5; check++) {
      await sleep(1500);
      const dismissed = await page.evaluate(() => {
        const all = Array.from(document.querySelectorAll('div[role="button"], button, span, div[aria-label]'));
        const notNow = all.find(el => {
          const t = (el.innerText || el.getAttribute('aria-label') || '').trim();
          return t === 'Not now' || t === 'এখন নয়';
        });
        if (notNow) {
          notNow.click();
          return true;
        }
        return false;
      });
      if (dismissed) {
        console.log("Dismissed Not now");
        break;
      }
    }
  }

  console.log("Waiting 12s for Facebook to finish uploading post...");
  await sleep(12000);

  await page.screenshot({ path: path.join(__dirname, 'temp', 'final_image_post_feed.png') });
  console.log('Saved final_image_post_feed.png');

  await browser.close();
  console.log("COMPLETE!");
})().catch(e => console.error(e));
