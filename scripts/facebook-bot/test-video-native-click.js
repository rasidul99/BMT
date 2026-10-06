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
    await page.evaluate(() => {
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
    await sleep(8000);
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
  }

  // Type caption
  console.log("4. Typing video caption...");
  const textBox = await page.$('div[role="dialog"] div[role="textbox"]');
  if (textBox) {
    await textBox.click();
    await sleep(500);
    await page.type('div[role="dialog"] div[role="textbox"]', "Eid Mega Sale 2026 Viral Video (1080p)\n\nঈদ অফারে পাচ্ছেন প্রিমিয়াম ওয়াচ কালেকশনে ৪০% পর্যন্ত ছাড়! স্টক সীমিত।\n\n#EidSale #WatchOffer #VideoPost ", { delay: 25 });
    await sleep(2000);
  }

  // Click outside to dismiss hashtag autocomplete
  const outside = await page.$('div[role="dialog"] h2, div[role="dialog"] span');
  if (outside) await outside.click();
  await sleep(1000);

  // Multi-step native clicker
  for (let step = 1; step <= 5; step++) {
    await sleep(3000);
    console.log(`Checking step ${step} dialog buttons...`);

    // Take screenshot of step
    await page.screenshot({ path: path.join(__dirname, 'temp', `step_${step}.png`) });

    // Look for button with trusted mouse click
    const buttonInfo = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('div[role="dialog"] div[role="button"], div[role="dialog"] button'));

      const isPostOrPublish = (t) => {
        const lower = t.toLowerCase();
        return lower === 'post' || lower === 'publish' || lower === 'share' || lower === 'share now' || lower === 'পোস্ট করুন' || lower === 'প্রকাশ করুন' || lower === 'শেয়ার করুন';
      };
      const isNext = (t) => {
        const lower = t.toLowerCase();
        return lower === 'next' || lower === 'পরবর্তী';
      };

      // Filter only visible on-screen buttons
      const visibleButtons = allButtons.filter(b => {
        const r = b.getBoundingClientRect();
        return r.x >= 0 && r.y >= 0 && r.width >= 30 && r.height >= 20 && (r.x + r.width) <= window.innerWidth;
      });

      // Check publish first
      let target = visibleButtons.find(b => isPostOrPublish((b.innerText || b.getAttribute('aria-label') || '').trim()));
      let type = "publish";
      if (!target) {
        target = visibleButtons.find(b => isNext((b.innerText || b.getAttribute('aria-label') || '').trim()));
        type = "next";
      }

      if (target) {
        const rect = target.getBoundingClientRect();
        return {
          found: true,
          type,
          text: (target.innerText || target.getAttribute('aria-label') || '').trim(),
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2,
          width: rect.width,
          height: rect.height,
          disabled: target.getAttribute('aria-disabled') === 'true' || target.disabled === true
        };
      }
      return null;
    });

    console.log(`Step ${step} button found:`, buttonInfo);

    if (!buttonInfo) {
      console.log("No button found, maybe dialog closed? Done!");
      break;
    }

    if (buttonInfo.disabled) {
      console.log("Button is disabled (video still processing), waiting 5s...");
      await sleep(5000);
      continue;
    }

    // Trusted CDP mouse click
    console.log(`Clicking ${buttonInfo.type} button at (${buttonInfo.x}, ${buttonInfo.y})...`);
    await page.mouse.click(buttonInfo.x, buttonInfo.y);
    await sleep(4000);

    if (buttonInfo.type === 'publish') {
      console.log("Clicked final publish button! Waiting for video upload...");
      break;
    }
  }

  // Dismiss any "Not now" upsell modals
  for (let check = 0; check < 5; check++) {
    await sleep(1500);
    const notNowInfo = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('div[role="button"], button, span, div[aria-label]'));
      const notNow = all.find(el => {
        const t = (el.innerText || el.getAttribute('aria-label') || '').trim();
        return t === 'Not now' || t === 'এখন নয়';
      });
      if (notNow) {
        const rect = notNow.getBoundingClientRect();
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      }
      return null;
    });
    if (notNowInfo) {
      await page.mouse.click(notNowInfo.x, notNowInfo.y);
      console.log("Dismissed Not now modal");
      break;
    }
  }

  console.log("Waiting 20s for Facebook to finish uploading video post...");
  await sleep(20000);

  await page.screenshot({ path: path.join(__dirname, 'temp', 'live_feed_video_verified.png') });
  console.log('Saved live_feed_video_verified.png');

  await browser.close();
  console.log("FULL VIDEO PUBLISH COMPLETE!");
  process.exit(0);
})().catch(e => {
  console.error("Test error:", e);
  process.exit(1);
});
