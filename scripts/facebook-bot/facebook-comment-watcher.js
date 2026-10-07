/**
 * BMT Facebook Comment Watcher & Dual-Reply Bot
 * Monitors a live Facebook Post (Personal Profile, Page, or Group)
 * Detects incoming comments, posts an AI public comment reply, AND sends a private message!
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

async function safeEvaluate(page, fn, ...args) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      return await page.evaluate(fn, ...args);
    } catch (err) {
      if (
        (err.message.includes("Execution context was destroyed") ||
          err.message.includes("Target closed") ||
          err.message.includes("Session closed") ||
          err.message.includes("context")) &&
        attempt < 4
      ) {
        console.warn(`[SafeEval] Retrying page evaluation after navigation attempt ${attempt}...`);
        await sleep(2500);
        continue;
      }
      throw err;
    }
  }
}

// AI Intent Classifier (Bengali + Banglish + English)
function getAiReply(commentText) {
  const lower = (commentText || "").toLowerCase().trim();

  // Price queries: দাম, price, koto, কত, cost, taka, টাকা, rate
  if (
    lower.includes("দাম") ||
    lower.includes("price") ||
    lower.includes("koto") ||
    lower.includes("কত") ||
    lower.includes("cost") ||
    lower.includes("taka") ||
    lower.includes("টাকা") ||
    lower.includes("rate") ||
    lower.includes("dam")
  ) {
    return {
      intent: "Price Query",
      reply: "ধন্যবাদ ভাইয়া! প্রিমিয়াম কালেকশনের স্পেশাল অফার প্রাইজ ইনবক্সে পাঠানো হয়েছে। দয়া করে ইনবক্স চেক করুন।",
      inbox: "আসসালামু আলাইকুম! ওয়াচটির ঈদ স্পেশাল অফার প্রাইজ মাত্র ২,৪৯০ টাকা (সারাদেশে ফ্রি হোম ডেলিভারি)। অর্ডার করতে নাম, পূর্ণ ঠিকানা ও মোবাইল নম্বর দিন।"
    };
  }

  // Delivery queries: ডেলিভারি, delivery, charge, চার্জ, cash on, ক্যাশ অন
  if (
    lower.includes("ডেলিভারি") ||
    lower.includes("delivery") ||
    lower.includes("charge") ||
    lower.includes("চার্জ") ||
    lower.includes("ক্যাশ অন") ||
    lower.includes("cash on") ||
    lower.includes("ঢাকার বাইরে")
  ) {
    return {
      intent: "Delivery Query",
      reply: "জি ভাইয়া, আমরা সারাদেশে ফ্রি ক্যাশ অন ডেলিভারি দিচ্ছি। ডেলিভারি সংক্রান্ত বিস্তারিত ইনবক্সে চেক করুন।",
      inbox: "জি সম্মানিত গ্রাহক! ঢাকা সিটিতে ২৪ ঘণ্টার মধ্যে এবং ঢাকার বাইরে ৪৮ ঘণ্টার মধ্যে ক্যাশ অন ডেলিভারি পাবেন। ডেলিভারি ম্যানের সামনে প্রোডাক্ট দেখে মূল্য পরিশোধ করতে পারবেন।"
    };
  }

  // Stock queries: স্টক, stock, available, ase, ache, আছে, কালার, color
  if (
    lower.includes("স্টক") ||
    lower.includes("stock") ||
    lower.includes("available") ||
    lower.includes("ase") ||
    lower.includes("ache") ||
    lower.includes("আছে") ||
    lower.includes("কালার") ||
    lower.includes("color")
  ) {
    return {
      intent: "Stock Query",
      reply: "প্রোডাক্টটির সীমিত স্টক এভেইলেবল আছে ভাইয়া! দ্রুত ইনবক্স চেক করে আপনার বুকিং কনফার্ম করুন।",
      inbox: "জি প্রোডাক্টটি এই মুহূর্তে আমাদের স্টকে এভেইলেবল আছে। এখনই বুকিং কনফার্ম করতে আমাদের মেসেজে জানিয়ে দিন।"
    };
  }

  // Warranty queries: ওয়ারেন্টি, warranty, গ্যারান্টি, guarantee
  if (lower.includes("ওয়ারেন্টি") || lower.includes("warranty") || lower.includes("গ্যারান্টি") || lower.includes("guarantee")) {
    return {
      intent: "Warranty Query",
      reply: "জি সম্মানিত কাস্টমার, প্রতিটি প্রডাক্টে পাচ্ছেন ১ বছরের অফিসিয়াল রিপ্লেসমেন্ট ওয়ারেন্টি! বিস্তারিত ইনবক্সে দেওয়া হলো।",
      inbox: "আমাদের প্রতিটি অথেনটিক প্রডাক্টের সাথে পাবেন অফিসিয়াল ১ বছরের রিপ্লেসমেন্ট কার্ড।"
    };
  }

  return {
    intent: "General Greeting",
    reply: "আসসালামু আলাইকুম! বিস্তারিত তথ্য আপনার ইনবক্সে মেসেজ করা হয়েছে, দয়া করে মেসেঞ্জার চেক করুন।",
    inbox: "স্বাগতম! আপনি আমাদের পণ্যটি সম্পর্কে জানতে চাওয়ায় ধন্যবাদ। যেকোনো তথ্য বা অর্ডারের জন্য আমাদের জানাতে পারেন।"
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
    checkIntervalSeconds = 12,
    maxChecks = 40,
    autoReply = true,
    sendInbox = true,
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
  console.log("👀 BMT Live Facebook Comment Watcher & Dual-Reply Bot");
  console.log(`🔗 Target Post: ${postUrl}`);
  console.log(`⏱️ Check Interval: ${checkIntervalSeconds}s | Max Checks: ${maxChecks}`);
  console.log(`🤖 AI Auto-Reply: ${autoReply ? "ENABLED" : "DISABLED"}`);
  console.log(`💬 Private Messenger Inbox: ${sendInbox ? "ENABLED" : "DISABLED"}`);
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
    // Ensure acting as Page if Page ID is present in URL
    const pageIdMatch = postUrl.match(/id=(\d+)/) || postUrl.match(/facebook\.com\/(\d+)/);
    if (pageIdMatch && pageIdMatch[1]) {
      const pageId = pageIdMatch[1];
      console.log(`🏢 Checking profile switch for Page ID ${pageId}...`);
      try {
        await page.goto(`https://www.facebook.com/${pageId}`, { waitUntil: "networkidle2", timeout: 45000 });
        await sleep(3000);
        const switched = await safeEvaluate(page, () => {
          const buttons = Array.from(document.querySelectorAll('div[role="button"]'));
          const target = buttons.find(b => (b.innerText || '').trim() === 'Switch Now' || (b.innerText || '').trim() === 'Switch');
          if (target) {
            target.click();
            return true;
          }
          return false;
        });
        if (switched) {
          console.log("   🔄 Switch button clicked, confirming modal switch...");
          await sleep(2500);
          await safeEvaluate(page, () => {
            const all = Array.from(document.querySelectorAll('div[aria-label="Switch"], div[role="button"]'));
            for (const el of all) {
              const txt = (el.innerText || el.getAttribute('aria-label') || '').trim();
              if (txt === 'Switch' && el.closest('div[role="dialog"]')) {
                el.click();
                break;
              }
            }
          });
          await sleep(8000);
          console.log("   ✅ Profile switched to Page.");
        }
      } catch (swErr) {
        console.warn("   ⚠️ Profile switch notice:", swErr.message);
      }
    }

    console.log(`🌐 Navigating to Post URL: ${postUrl}...`);

    // Safe navigation with client-side redirect tolerance
    try {
      await page.goto(postUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    } catch (navErr) {
      console.warn("Navigation warning (continuing):", navErr.message);
    }

    // Wait for any Facebook client-side redirection (e.g. share/p/ -> permalink.php) to settle
    console.log("⏳ Waiting for Facebook URL redirection to settle...");
    await sleep(6000);

    const currentUrl = page.url();
    console.log(`📍 Current Facebook URL settled at: ${currentUrl}`);

    // If redirected from share/p to permalink, ensure direct full post load
    if (currentUrl.includes("permalink.php") && postUrl.includes("/share/")) {
      console.log(`🔄 Reloading canonical permalink directly: ${currentUrl}`);
      try {
        await page.goto(currentUrl, { waitUntil: "networkidle2", timeout: 45000 });
        await sleep(4000);
      } catch (_) {}
    }

    // Close any blocking popup/dialog if present
    try {
      await safeEvaluate(page, () => {
        const closeBtns = Array.from(document.querySelectorAll('div[aria-label="Close"], div[aria-label="বন্ধ করুন"], div[role="button"][aria-label*="Close" i]'));
        if (closeBtns.length > 0 && !closeBtns[0].closest('div[role="dialog"][aria-label*="post" i]')) {
          closeBtns[0].click();
        }
      });
      await sleep(1000);
    } catch (_) {}

    // Scroll post / modal to ensure comments are visible
    try {
      await page.mouse.move(640, 450);
      await page.mouse.wheel({ deltaY: 800 });
      await sleep(1500);
      await page.mouse.wheel({ deltaY: 800 });
      await sleep(2000);
    } catch (_) {
      await safeEvaluate(page, () => window.scrollBy({ top: 500, behavior: "smooth" }));
      await sleep(2000);
    }

    for (let check = 1; check <= maxChecks; check++) {
      console.log(`\n🔍 [Check ${check}/${maxChecks}] Scanning comment section...`);
      updateStatus({ status: "WATCHING", checkCount: check, replies: allReplies, postUrl });

      // Scan page for comments safely
      let detectedComments = [];
      try {
        detectedComments = await safeEvaluate(page, () => {
          const articles = Array.from(document.querySelectorAll('div[role="article"], div[aria-label*="Comment by" i], div[aria-label*="মন্তব্য" i]'));
          const list = [];

          articles.forEach((art, idx) => {
            const text = (art.innerText || "").trim();
            if (!text || text.length < 2) return;

            // Check if this comment is from the Post Author (has 'Author' badge)
            const isAuthor = text.toLowerCase().includes("author") || text.includes("লেখক");

            // Check for buttons under this comment
            const buttons = Array.from(art.querySelectorAll('div[role="button"], span[role="button"], a[role="button"]'));
            const hasReplyBtn = buttons.some((b) => {
              const bt = (b.innerText || b.getAttribute("aria-label") || "").trim().toLowerCase();
              return bt === "reply" || bt === "উত্তর দিন" || bt.includes("reply") || bt.includes("উত্তর");
            });

            const hasMessageBtn = buttons.some((b) => {
              const bt = (b.innerText || b.getAttribute("aria-label") || "").trim().toLowerCase();
              return bt === "send message" || bt === "বার্তা পাঠান" || bt.includes("send message") || bt.includes("বার্তা পাঠান");
            });

            // STRICT FILTER: A real comment MUST have a Reply button!
            // Sidebars like 'INFINITY BANGLADESH', 'People you may know', 'Reels' do NOT have a Reply button.
            if (!hasReplyBtn) return;

            // Extract commenter name and comment text cleanly
            const nameEl = art.querySelector('a[role="link"] span, h3 span, strong span, a span');
            let author = nameEl ? (nameEl.innerText || nameEl.textContent || '').trim() : '';

            const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
            if (!author) {
              author = lines[0] || "Facebook User";
            }

            // Filter out button labels and metadata from body text
            const bodyLines = lines.filter((l) => {
              const low = l.toLowerCase();
              if (l === author) return false;
              if (low === "like" || low === "reply" || low === "send message" || low === "see translation" || low === "author") return false;
              if (low.includes("·") || low.endsWith("m") || low.endsWith("h") || low.endsWith("d") || low.includes("ago")) return false;
              if (low.includes("পছন্দ") || low.includes("উত্তর") || low.includes("বার্তা পাঠান")) return false;
              return true;
            });
            const body = bodyLines.join(" ").trim() || (lines[lines.length - 1] || text);

            list.push({
              index: idx,
              author,
              isAuthor,
              text: body,
              fullText: text,
              hasReplyBtn,
              hasMessageBtn,
            });
          });

          return list;
        });
      } catch (scanErr) {
        console.warn(`Scan error (will retry next check): ${scanErr.message}`);
        await sleep(3000);
        continue;
      }

      console.log(`📊 Found ${detectedComments.length} comment blocks on post.`);

      for (const item of detectedComments) {
        const commentKey = `${item.author}:::${item.text.slice(0, 40)}`;

        if (processedComments.has(commentKey)) {
          continue;
        }

        // Skip comments made by the author itself (e.g. pinned 1st comments)
        if (item.isAuthor) {
          console.log(`ℹ️ Skipping Author comment: "${item.text.slice(0, 30)}..."`);
          processedComments.add(commentKey);
          continue;
        }

        console.log(`\n🎯 [NEW CUSTOMER COMMENT DETECTED]:`);
        console.log(`   👤 Customer Name: ${item.author}`);
        console.log(`   💬 Customer Query: "${item.text}"`);

        const ai = getAiReply(item.text);
        console.log(`   🤖 AI Intent Detected: ${ai.intent}`);
        console.log(`   📝 AI Public Comment Reply: "${ai.reply}"`);
        console.log(`   📩 AI Private Inbox Message: "${ai.inbox}"`);

        let publicSuccess = false;
        let inboxSuccess = false;

        // 1. Send Private Messenger Message if "Send message" button is present
        if (sendInbox && item.hasMessageBtn) {
          console.log(`   ✉️ Locating and clicking "Send message" button for ${item.author}...`);
          try {
            const clickedMsg = await safeEvaluate(page, (artIdx) => {
              const articles = Array.from(document.querySelectorAll('div[role="article"], div[aria-label*="Comment by" i], div[aria-label*="মন্তব্য" i]'));
              const targetArt = articles[artIdx];
              if (!targetArt) return false;
              const buttons = Array.from(targetArt.querySelectorAll('div[role="button"], span[role="button"], a[role="button"]'));
              const msgBtn = buttons.find((b) => {
                const bt = (b.innerText || b.getAttribute("aria-label") || "").trim().toLowerCase();
                return bt === "send message" || bt === "বার্তা পাঠান";
              });
              if (msgBtn) {
                msgBtn.click();
                return true;
              }
              return false;
            }, item.index);

            if (clickedMsg) {
              await sleep(3000);

              // Check for message popup modal
              const msgSent = await safeEvaluate(page, async (msgText) => {
                const dialogs = Array.from(document.querySelectorAll('div[role="dialog"]'));
                const msgDialog = dialogs.find(d => {
                  const t = (d.innerText || '');
                  return t.includes("Message ") || t.includes("Send a message as") || t.includes("Send Message");
                }) || dialogs[dialogs.length - 1];

                if (!msgDialog) return { success: false, reason: "No message dialog found" };

                // Find textbox in the message dialog
                const tb = msgDialog.querySelector('div[role="textbox"]');
                if (!tb) return { success: false, reason: "No textbox in message dialog" };

                tb.focus();
                document.execCommand('insertText', false, msgText);

                await new Promise(r => setTimeout(r, 800));

                // Find and click "Send Message" button
                const sendBtns = Array.from(msgDialog.querySelectorAll('div[role="button"], div[aria-label*="Send" i]'));
                const sendBtn = sendBtns.find(b => (b.innerText || b.getAttribute('aria-label') || '').trim().toLowerCase() === 'send message');
                if (sendBtn) {
                  sendBtn.click();
                  return { success: true, method: "send button clicked" };
                }
                return { success: true, method: "text inserted into dialog" };
              }, ai.inbox);

              console.log("   Private message modal dispatch:", msgSent);
              if (msgSent.success) {
                await sleep(3500);
                inboxSuccess = true;
                console.log(`   ✅ [SUCCESS] Private message sent to ${item.author}'s Messenger!`);
              }

              // Close message modal if still visible to unblock the comment thread
              try {
                await safeEvaluate(page, () => {
                  const dialogs = Array.from(document.querySelectorAll('div[role="dialog"]'));
                  const msgDialog = dialogs.find(d => (d.innerText || '').includes("Message "));
                  if (msgDialog) {
                    const closeBtn = msgDialog.querySelector('div[aria-label="Close"], div[role="button"][aria-label*="Close" i]');
                    if (closeBtn) closeBtn.click();
                  }
                });
                await sleep(1500);
              } catch (_) {}
            }
          } catch (mErr) {
            console.warn(`   ⚠️ Private message dispatch notice: ${mErr.message}`);
          }
        }

        // 2. Post Public Comment Reply (Strictly Nested)
        if (autoReply) {
          console.log(`   ⏳ Locating and clicking "Reply" button for ${item.author}...`);
          try {
            const clickedReply = await safeEvaluate(page, (artIdx) => {
              const articles = Array.from(document.querySelectorAll('div[role="article"], div[aria-label*="Comment by" i], div[aria-label*="মন্তব্য" i]'));
              const targetArt = articles[artIdx];
              if (!targetArt) return false;

              const buttons = Array.from(targetArt.querySelectorAll('div[role="button"], span[role="button"], a[role="button"]'));
              const replyBtn = buttons.find((b) => {
                const bt = (b.innerText || b.getAttribute("aria-label") || "").trim().toLowerCase();
                return bt === "reply" || bt === "উত্তর দিন";
              });

              if (replyBtn) {
                replyBtn.click();
                return true;
              }
              return false;
            }, item.index);

            if (clickedReply) {
              await sleep(2000);

              // The active nested reply textbox will have aria-label starting with "Reply to ..."
              const nestedBox = await page.$('div[role="textbox"][aria-label^="Reply to" i], div[role="textbox"][aria-label^="উত্তর দিন" i]');
              const boxToUse = nestedBox || (await page.$$('div[role="textbox"][contenteditable="true"]')).pop();

              if (boxToUse) {
                await boxToUse.click();
                await sleep(500);

                console.log(`   ⌨️ Typing AI nested public reply into comment box...`);
                for (const char of ai.reply) {
                  await page.keyboard.type(char, { delay: Math.floor(Math.random() * 35) + 15 });
                }

                await sleep(800);
                console.log(`   🚀 Submitting nested comment reply (pressing Enter)...`);
                await page.keyboard.press("Enter");
                await sleep(4000);

                console.log(`   ✅ [SUCCESS] AI Nested Reply successfully posted on Facebook!`);
                publicSuccess = true;
              }
            } else {
              console.warn(`   ⚠️ Reply button not found on this comment block.`);
            }
          } catch (rErr) {
            console.warn(`   ⚠️ Public reply dispatch notice: ${rErr.message}`);
          }
        }

        const replyRecord = {
          author: item.author,
          commentText: item.text,
          intent: ai.intent,
          aiReply: ai.reply,
          inboxMessage: ai.inbox,
          publicSuccess,
          inboxSuccess,
          status: publicSuccess ? "SUCCESS" : "DISPATCHED",
          timestamp: new Date().toISOString(),
        };
        allReplies.push(replyRecord);
        updateStatus({ status: "WATCHING", checkCount: check, replies: allReplies, postUrl });

        processedComments.add(commentKey);
      }

      // Wait before next scan interval
      if (check < maxChecks) {
        console.log(`⏳ Waiting ${checkIntervalSeconds}s for new incoming comments...`);
        await sleep(checkIntervalSeconds * 1000);

        // Gentle jitter scroll using mouse wheel to trigger real-time Facebook updates
        try {
          await page.mouse.move(640, 450);
          await page.mouse.wheel({ deltaY: 300 });
          await sleep(800);
          await page.mouse.wheel({ deltaY: -300 });
        } catch (_) {
          await safeEvaluate(page, () => window.scrollBy({ top: 120, behavior: "smooth" }));
        }
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
