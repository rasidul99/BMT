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
    args: ['--no-sandbox', '--disable-notifications']
  });

  const page = (await browser.pages())[0] || (await browser.newPage());
  await page.setViewport({ width: 1280, height: 900 });
  await page.setCookie(...parseCookies(cfg.cookieString));

  console.log('1. Navigating to Facebook Page...');
  await page.goto('https://www.facebook.com/61595136714776', { waitUntil: 'networkidle2', timeout: 45000 });
  await sleep(3000);

  // Check if we need to switch into the Page
  console.log('2. Checking if Switch prompt is present...');
  const switchTriggered = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('div[role="button"]'));
    // Look specifically for Switch Now banner button or Switch button
    const target = buttons.find(b => {
      const t = (b.innerText || b.getAttribute('aria-label') || '').trim();
      return t === 'Switch Now' || t === 'Switch';
    });
    if (target) {
      target.click();
      return true;
    }
    return false;
  });

  if (switchTriggered) {
    console.log('Found & clicked initial switch button. Waiting for dialog...');
    await sleep(2500);

    // Click confirm switch in the modal
    const modalSwitchClicked = await page.evaluate(() => {
      // Find all elements that have aria-label="Switch" or text "Switch" inside a dialog
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
    if (modalSwitchClicked) {
      console.log('Waiting 8 seconds for page reload as Page identity...');
      await sleep(8000);
    }
  }

  console.log('3. Now looking for Composer...');
  // Click on "What's on your mind?"
  let composerOpened = false;
  for (let attempt = 0; attempt < 3; attempt++) {
    composerOpened = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('div[role="button"], span'));
      const trigger = allButtons.find(b => {
        const t = (b.innerText || b.getAttribute('aria-label') || '').trim();
        return t.includes("What's on your mind") || t.includes("Create a post") || t.includes("মনে কী আছে?") || t.includes("কিছু লিখুন");
      });
      if (trigger) {
        trigger.click();
        return true;
      }
      return false;
    });

    if (composerOpened) {
      console.log('Successfully clicked composer trigger!');
      break;
    }
    console.log(`Composer trigger not clicked yet, retrying attempt ${attempt + 1}...`);
    await sleep(2000);
  }

  console.log('Waiting for textbox in dialog...');
  const textBoxSelector = 'div[role="dialog"] div[role="textbox"]';
  await page.waitForSelector(textBoxSelector, { timeout: 15000 });
  await page.click(textBoxSelector);
  await sleep(500);

  const testMsg = `🚀 BMT Automated Test Post (${new Date().toLocaleTimeString('en-US')})\n\nThis post was automatically published by BMT Puppeteer Bot directly to Test next Page!`;
  console.log('Typing message...');
  await page.type(textBoxSelector, testMsg, { delay: 35 });
  await sleep(2000);

  console.log('4. Locating and clicking Next or Post button...');
  const nextOrPostClicked = await page.evaluate(() => {
    const dialog = document.querySelector('div[role="dialog"]');
    if (!dialog) return false;
    const buttons = Array.from(dialog.querySelectorAll('div[role="button"], button'));
    // Check for "Next" or "Post"
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

  console.log('Primary action clicked:', nextOrPostClicked);
  await sleep(3000);

  // If "Next" was clicked, look for secondary "Post" / "Publish" button
  if (nextOrPostClicked && (nextOrPostClicked.text === 'Next' || nextOrPostClicked.text === 'পরবর্তী')) {
    console.log('Clicked "Next", checking for "Not now" prompt or final Post button...');
    await sleep(2500);

    // Check if Facebook popped up "Speak to people directly" / "Not now"
    const dismissedPopup = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('div[role="button"], button'));
      const notNow = buttons.find(b => {
        const t = (b.innerText || b.getAttribute('aria-label') || '').trim();
        return t === 'Not now' || t === 'এখন নয়';
      });
      if (notNow) {
        notNow.click();
        return true;
      }
      return false;
    });

    console.log('Dismissed "Not now" prompt:', dismissedPopup);
    await sleep(2000);

    // Now click the final Post / Publish button in the dialog
    const finalSubmitClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('div[role="button"], button, div[aria-label]'));
      const postBtn = buttons.find(b => {
        const t = (b.innerText || b.getAttribute('aria-label') || '').trim();
        return t === 'Post' || t === 'Publish' || t === 'পোস্ট করুন' || t === 'প্রকাশ করুন';
      });
      if (postBtn) {
        postBtn.click();
        return { success: true, text: (postBtn.innerText || postBtn.getAttribute('aria-label') || '').trim() };
      }
      return { success: false };
    });
    console.log('Final submit button clicked:', finalSubmitClicked);

    // After clicking Post, Facebook NPE often shows "Speak to people directly" popup with "Not now"
    console.log('Checking if Facebook shows "Not now" upsell modal after clicking Post...');
    for (let check = 0; check < 5; check++) {
      await sleep(1500);
      const promptHandled = await page.evaluate(() => {
        const all = Array.from(document.querySelectorAll('div[role="button"], button, span, div[aria-label]'));
        const notNow = all.find(el => {
          const t = (el.innerText || el.getAttribute('aria-label') || '').trim();
          return t === 'Not now' || t === 'এখন নয়';
        });
        if (notNow) {
          notNow.click();
          return 'Not now clicked';
        }
        return null;
      });
      if (promptHandled) {
        console.log('Successfully dismissed Facebook upsell prompt:', promptHandled);
        break;
      }
    }
  }

  console.log('Waiting 10 seconds for post to be processed by Facebook...');
  await sleep(10000);

  // Take a full screenshot of the page after posting
  await page.screenshot({ path: path.join(__dirname, 'temp', 'final_posted_page.png') });
  console.log('Saved final_posted_page.png');

  await browser.close();
  console.log('SUCCESS! Post completed.');
})().catch(e => console.error('Error during post:', e));
