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
  const videoFile = path.resolve(__dirname, '../../apps/web/public/sample-video.mp4');
  console.log("Video file to test:", videoFile, "Exists:", fs.existsSync(videoFile));

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setCookie(...parseCookies(cfg.cookieString));
  await page.goto('https://www.facebook.com/61595136714776', { waitUntil: 'networkidle2' });
  await sleep(3500);

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
    if (modalSwitchClicked) {
      console.log("Switched profile, waiting for reload...");
      await sleep(8000);
    }
  }

  // Open composer
  console.log("1. Opening post composer...");
  await page.evaluate(() => {
    const allButtons = Array.from(document.querySelectorAll('div[role="button"], span'));
    const trigger = allButtons.find(b => {
      const t = (b.innerText || b.getAttribute('aria-label') || '').trim();
      return t.includes("What's on your mind") || t.includes("Create a post") || t.includes("মনে কী আছে?") || t.includes("কিছু লিখুন") || t.includes("পোস্ট লিখুন");
    });
    if (trigger) trigger.click();
  });
  await sleep(3000);

  // Click Photo/video inside dialog
  console.log("2. Clicking Photo/video button...");
  await page.evaluate(() => {
    const dialog = document.querySelector('div[role="dialog"]');
    if (!dialog) return;
    const items = Array.from(dialog.querySelectorAll('div[aria-label], div[role="button"]'));
    const photo = items.find((el) => {
      const a = (el.getAttribute("aria-label") || "").toLowerCase();
      return a.includes("photo/video") || a.includes("photo") || a.includes("ছবি") || a.includes("video") || a.includes("ভিডিও");
    });
    if (photo) photo.click();
  });
  await sleep(2500);

  // Upload video
  console.log("3. Uploading video file to input[type=file] inside dialog...");
  const fileInput = await page.$('div[role="dialog"] input[type="file"]');
  if (fileInput) {
    await fileInput.uploadFile(videoFile);
    console.log("Video uploaded! Waiting 12s for Facebook to process video preview...");
    await sleep(12000);
  } else {
    console.error("File input not found inside dialog!");
  }

  // Type caption
  console.log("4. Typing video caption...");
  const textBox = await page.$('div[role="dialog"] div[role="textbox"]');
  if (textBox) {
    await textBox.click();
    await sleep(500);
    await page.type('div[role="dialog"] div[role="textbox"]', "Eid Mega Sale 2026 Viral Video (1080p)\n\nঈদ অফারে পাচ্ছেন প্রিমিয়াম ওয়াচ কালেকশনে ৪০% পর্যন্ত ছাড়! স্টক সীমিত।\n\n#EidSale #WatchOffer #VideoPost", { delay: 30 });
    await sleep(2000);
  }

  await page.screenshot({ path: path.join(__dirname, 'temp', 'composer_with_video.png') });
  console.log('Saved composer_with_video.png');

  // Dynamic wizard progression loop: handles Image, Video, and Reel multi-step dialogs
  console.log("5. Advancing through Facebook dialog wizard (Next -> Next -> Publish/Post)...");
  for (let step = 0; step < 5; step++) {
    await sleep(3000);
    const action = await page.evaluate(() => {
      const dialog = document.querySelector('div[role="dialog"]');
      if (!dialog) return { found: false, text: "no dialog" };
      const buttons = Array.from(dialog.querySelectorAll('div[role="button"], button'));

      // Prefer final Submit (Publish, Post, Share now)
      const finalBtn = buttons.find(b => {
        const t = (b.innerText || b.getAttribute('aria-label') || '').trim().toLowerCase();
        return t === 'publish' || t === 'post' || t === 'share now' || t === 'পোস্ট করুন' || t === 'প্রকাশ করুন' || t === 'শেয়ার করুন';
      });
      if (finalBtn) {
        finalBtn.click();
        return { found: true, isFinal: true, text: (finalBtn.innerText || finalBtn.getAttribute('aria-label') || '').trim() };
      }

      // Next button
      const nextBtn = buttons.find(b => {
        const t = (b.innerText || b.getAttribute('aria-label') || '').trim().toLowerCase();
        return t === 'next' || t === 'পরবর্তী';
      });
      if (nextBtn) {
        nextBtn.click();
        return { found: true, isFinal: false, text: (nextBtn.innerText || nextBtn.getAttribute('aria-label') || '').trim() };
      }

      return { found: false, text: "none" };
    });

    console.log(`Wizard step ${step + 1}:`, action);
    if (action.isFinal) {
      console.log("🎯 Successfully clicked final Publish/Post button!");
      break;
    }
    if (!action.found && step > 0) break;
  }

  // Dismiss any "Not now" upsell modals
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
      console.log("Dismissed Not now modal");
      break;
    }
  }

  console.log("Waiting 15s for Facebook to finish uploading video post...");
  await sleep(15000);

  await page.screenshot({ path: path.join(__dirname, 'temp', 'final_video_post_feed.png') });
  console.log('Saved final_video_post_feed.png');

  await browser.close();
  console.log("VIDEO TEST COMPLETE!");
  process.exit(0);
})().catch(e => {
  console.error("Test error:", e);
  process.exit(1);
});
