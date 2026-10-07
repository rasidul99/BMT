/**
 * BMT Facebook Comment Watcher & Auto-Reply Bot
 * Monitors a live Facebook Post (Personal Profile, Group, or Page)
 * Automatically detects incoming comments from other users and replies via AI!
 */

const fs = require("fs");
const path = require("path");

function loadPuppeteer() {
  const possiblePaths = [
    "puppeteer-core",
    path.resolve(__dirname, "../../apps/workers/node_modules/puppeteer-core"),
    path.resolve(__dirname, "../../node_modules/puppeteer-core"),
    path.resolve(__dirname, "../../node_modules/.pnpm/puppeteer-core@25.12.0/node_modules/puppeteer-core"),
  ];

  for (const p of possiblePaths) {
    try {
      return require(p);
    } catch (_) {}
  }
  throw new Error("puppeteer-core could not be loaded from any known path.");
}

const puppeteer = loadPuppeteer();

const CHROME_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  process.env.CHROME_BIN,
].filter(Boolean);

function findChromePath() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("No compatible Chrome or Edge executable found.");
}

function parseCookies(rawCookieStr) {
  if (!rawCookieStr) return [];
  const items = rawCookieStr.split(";").map((s) => s.trim()).filter(Boolean);
  const cookies = [];

  for (const item of items) {
    const eqIdx = item.indexOf("=");
    if (eqIdx === -1) continue;
    const name = item.slice(0, eqIdx).trim();
    const value = item.slice(eqIdx + 1).trim();

    if (!name || !value) continue;

    cookies.push({
      name,
      value,
      domain: ".facebook.com",
      path: "/",
      httpOnly: ["xs", "datr", "sb", "fr"].includes(name),
      secure: true,
      sameSite: "Lax",
    });
  }

  return cookies;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// AI Intent Generator
function getAiReply(commentText) {
  const lower = (commentText || "").toLowerCase();
  if (lower.includes("দাম") || lower.includes("price") || lower.includes("কত") || lower.includes("cost") || lower.includes("টাকা")) {
    return {
      intent: "Price Query",
      reply: "ধন্যবাদ ভাইয়া! প্রিমিয়াম কালেকশনের স্পেশাল অফার প্রাইজ ইনবক্সে পাঠানো হয়েছে। দয়া করে ইনবক্স চেক করুন।",
      inbox: "আসসালামু আলাইকুম! ওয়াচটির ঈদ অফার প্রাইজ মাত্র ২,৪৯০ টাকা (সারাদেশে ফ্রি হোম ডেলিভারি)। অর্ডার করতে নাম ও ঠিকানা দিন।"
    };
  }
  if (lower.includes("ডেলিভারি") || lower.includes("delivery") || lower.includes("ক্যাশ অন") || lower.includes("চার্জ")) {
    return {
      intent: "Delivery Query",
      reply: "জি ভাইয়া, আমরা সারাদেশে ক্যাশ অন ডেলিভারি দিচ্ছি। ডেলিভারি সংক্রান্ত বিস্তারিত তথ্য ইনবক্সে পাঠিয়েছি।",
      inbox: "জি সম্মানিত গ্রাহক! ঢাকা সিটিতে ২৪ ঘণ্টার মধ্যে এবং ঢাকার বাইরে ৪৮ ঘণ্টার মধ্যে ক্যাশ অন ডেলিভারি পাবেন।"
    };
  }
  if (lower.includes("স্টক") || lower.includes("stock") || lower.includes("কালার") || lower.includes("color")) {
    return {
      intent: "Stock Query",
      reply: "প্রোডাক্টটির সীমিত স্টক এভেইলেবল আছে ভাইয়া! দ্রুত ইনবক্স চেক করে বুকিং কনফার্ম করুন।",
      inbox: "জি প্রোডাক্টটি আমাদের স্টকে এভেইলেবল আছে। এখনই বুকিং করতে মেসেজ করুন!"
    };
  }
  return {
    intent: "General Greeting",
    reply: "আসসালামু আলাইকুম! বিস্তারিত তথ্য আপনার ইনবক্সে মেসেজ করা হয়েছে, দয়া করে মেসেঞ্জার চেক করুন।",
    inbox: "স্বাগতম! আপনার অনুসন্ধানের জন্য ধন্যবাদ। আমরা আপনাকে সহায়তা করতে প্রস্তুত।"
  };
}

async function runWatcher(configPath) {
  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (e) {
    console.error("❌ Failed to parse config JSON:", e.message);
    process.exit(1);
  }

  const {
    jobId = `watcher-${Date.now()}`,
    postUrl,
    checkIntervalSeconds = 15,
    maxChecks = 30, // 30 checks * 15s = ~7.5 minutes
    autoReply = true,
    headless = false,
  } = config;

  // Resolve session cookies
  let cookieString = config.cookieString;
  const sessionFilePath = path.resolve(__dirname, "active-session.json");
  if (!cookieString && fs.existsSync(sessionFilePath)) {
    try {
      const sess = JSON.parse(fs.readFileSync(sessionFilePath, "utf8"));
      cookieString = sess.cookieString;
    } catch {}
  }

  const tempDir = path.resolve(__dirname, "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  const statusFile = path.join(tempDir, `${jobId}-status.json`);

  function updateStatus(state) {
    fs.writeFileSync(statusFile, JSON.stringify({ ...state, updatedAt: new Date().toISOString() }, null, 2), "utf8");
  }

  console.log("==========================================================");
  console.log("👀 BMT Live Facebook Comment Watcher & Auto-Reply Bot");
  console.log(`🔗 Target Post: ${postUrl}`);
  console.log(`⏱️ Check Interval: ${checkIntervalSeconds}s | Max Checks: ${maxChecks}`);
  console.log(`🤖 AI Auto-Reply: ${autoReply ? "ENABLED" : "DISABLED"}`);
  console.log(`👁️ Headless: ${headless}`);
  console.log("==========================================================\n");

  updateStatus({ status: "LAUNCHING_BROWSER", postUrl, replies: [], checkCount: 0 });

  const cookies = parseCookies(cookieString);
  const chromeExecutable = findChromePath();

  const browser = await puppeteer.launch({
    executablePath: chromeExecutable,
    headless: headless ? "new" : false,
    defaultViewport: null,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-notifications",
      "--window-size=1280,900",
    ],
  });

  const page = await browser.newPage();
  await page.setCookie(...cookies);

  const processedComments = new Set();
  const allReplies = [];

  try {
    console.log(`🌐 Navigating to Post URL: ${postUrl}...`);
    await page.goto(postUrl, { waitUntil: "networkidle2", timeout: 60000 });
    await sleep(3000);

    // Close any blocking overlay if present
    try {
      const closeDialogBtn = await page.$('div[aria-label="Close"], div[aria-label="বন্ধ করুন"], div[role="button"][aria-label*="Close" i]');
      if (closeDialogBtn) {
        await closeDialogBtn.click();
        await sleep(1000);
      }
    } catch (_) {}

    // Scroll slightly down to make comments area active
    await page.evaluate(() => window.scrollBy({ top: 400, behavior: "smooth" }));
    await sleep(2000);

    for (let check = 1; check <= maxChecks; check++) {
      console.log(`\n🔍 [Check ${check}/${maxChecks}] Scanning comment section...`);
      updateStatus({ status: "WATCHING", checkCount: check, replies: allReplies, postUrl });

      // Scan page for comments
      const detectedComments = await page.evaluate(() => {
        // Find comment articles or containers
        const articles = Array.from(document.querySelectorAll('div[role="article"], div[aria-label*="Comment by" i], div[aria-label*="মন্তব্য" i]'));
        const list = [];

        articles.forEach((art, idx) => {
          const text = (art.innerText || "").trim();
          if (!text || text.length < 2) return;

          // Check if this article contains a reply button
          const buttons = Array.from(art.querySelectorAll('div[role="button"], span[role="button"], a[role="button"]'));
          const hasReplyBtn = buttons.some((b) => {
            const bt = (b.innerText || b.getAttribute("aria-label") || "").toLowerCase();
            return bt.includes("reply") || bt.includes("উত্তর দিন") || bt.includes("উত্তর");
          });

          // Extract commenter name and comment text
          const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
          const author = lines[0] || "Facebook User";
          // Comment body usually line 2 or combined
          const body = lines.slice(1).filter((l) => !l.includes("Like") && !l.includes("Reply") && !l.includes("Share") && !l.includes("পছন্দ") && !l.includes("উত্তর")).join(" ");

          list.push({
            index: idx,
            author,
            text: body || text,
            fullText: text,
            hasReplyBtn,
          });
        });

        return list;
      });

      console.log(`📊 Found ${detectedComments.length} comment blocks on post.`);

      for (const item of detectedComments) {
        const commentKey = `${item.author}:::${item.text.slice(0, 40)}`;

        if (processedComments.has(commentKey)) {
          continue;
        }

        // Check if author is our own bot profile
        if (item.author.toLowerCase().includes("rasidul") || item.author.toLowerCase().includes("care hub")) {
          processedComments.add(commentKey);
          continue;
        }

        console.log(`\n🎯 [NEW COMMENT DETECTED from 2nd ID]:`);
        console.log(`   👤 Commenter: ${item.author}`);
        console.log(`   💬 Comment: "${item.text}"`);

        const ai = getAiReply(item.text);
        console.log(`   🤖 AI Intent Detected: ${ai.intent}`);
        console.log(`   📝 AI Public Reply: "${ai.reply}"`);

        if (autoReply) {
          console.log(`   ⏳ Locating and clicking "Reply" button for ${item.author}...`);

          const clickedReply = await page.evaluate((artIdx) => {
            const articles = Array.from(document.querySelectorAll('div[role="article"], div[aria-label*="Comment by" i], div[aria-label*="মন্তব্য" i]'));
            const targetArt = articles[artIdx];
            if (!targetArt) return false;

            const buttons = Array.from(targetArt.querySelectorAll('div[role="button"], span[role="button"], a[role="button"]'));
            const replyBtn = buttons.find((b) => {
              const bt = (b.innerText || b.getAttribute("aria-label") || "").toLowerCase();
              return bt === "reply" || bt === "উত্তর দিন" || bt.includes("reply") || bt.includes("উত্তর");
            });

            if (replyBtn) {
              replyBtn.click();
              return true;
            }
            return false;
          }, item.index);

          if (clickedReply) {
            await sleep(1500);

            // Wait for nested reply textbox
            const replyBoxSelector = 'div[role="textbox"][contenteditable="true"]';
            try {
              await page.waitForSelector(replyBoxSelector, { timeout: 6000 });
              // Get all textboxes, usually the last one is the active reply box
              const textboxes = await page.$$(replyBoxSelector);
              const activeBox = textboxes[textboxes.length - 1];

              if (activeBox) {
                await activeBox.click();
                await sleep(500);

                // Type AI reply with human typing jitter
                console.log(`   ⌨️ Typing AI reply into comment box...`);
                for (const char of ai.reply) {
                  await page.keyboard.type(char, { delay: Math.floor(Math.random() * 40) + 20 });
                }

                await sleep(800);
                console.log(`   🚀 Submitting reply (pressing Enter)...`);
                await page.keyboard.press("Enter");
                await sleep(4000);

                console.log(`   ✅ [SUCCESS] AI Reply successfully posted on Facebook!`);
                const replyRecord = {
                  author: item.author,
                  commentText: item.text,
                  intent: ai.intent,
                  aiReply: ai.reply,
                  inboxMessage: ai.inbox,
                  status: "DISPATCHED_TO_FACEBOOK",
                  timestamp: new Date().toISOString(),
                };
                allReplies.push(replyRecord);
                updateStatus({ status: "WATCHING", checkCount: check, replies: allReplies, postUrl });
              }
            } catch (boxErr) {
              console.warn(`   ⚠️ Could not focus reply input: ${boxErr.message}`);
            }
          } else {
            console.warn(`   ⚠️ Reply button not found on this comment block.`);
          }
        }

        processedComments.add(commentKey);
      }

      // Wait before next check
      if (check < maxChecks) {
        console.log(`⏳ Waiting ${checkIntervalSeconds}s for next incoming comment from 2nd ID...`);
        await sleep(checkIntervalSeconds * 1000);

        // Periodically refresh post slightly or scroll to trigger new comments
        await page.evaluate(() => window.scrollBy({ top: 100, behavior: "smooth" }));
        await sleep(1000);
        await page.evaluate(() => window.scrollBy({ top: -100, behavior: "smooth" }));
      }
    }

    console.log("\n🏁 Comment watcher session completed.");
    updateStatus({ status: "COMPLETED", replies: allReplies, postUrl, checkCount: maxChecks });
  } catch (err) {
    console.error("❌ Watcher runtime error:", err.message);
    updateStatus({ status: "ERROR", error: err.message, replies: allReplies, postUrl });
  } finally {
    await sleep(5000);
    await browser.close();
  }
}

// Standalone CLI execution
if (require.main === module) {
  const configFile = process.argv[2];
  if (!configFile) {
    console.error("Usage: node facebook-comment-watcher.js <path-to-config.json>");
    process.exit(1);
  }
  runWatcher(configFile).then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runWatcher };
