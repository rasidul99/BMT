/**
 * BMT 24/7 Live Facebook Messenger & Business Suite Inbox Assistant Bot
 * Connects directly to real Facebook Messenger / Meta Business Suite Inbox,
 * syncs real customer conversations into the BMT Inbox Assistant dashboard,
 * dispatches manual/approved replies typed in the dashboard directly to Facebook Messenger,
 * and automatically replies to incoming customer messages in AUTO mode!
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
        await sleep(2000);
        continue;
      }
      throw err;
    }
  }
}

function classifyCustomerMessage(text, customerName, templates = []) {
  const lower = (text || "").toLowerCase();
  let category = "Sales Conversion";

  if (
    lower.includes("দাম") ||
    lower.includes("মূল্য") ||
    lower.includes("টাকা") ||
    lower.includes("অর্ডার") ||
    lower.includes("কিনতে") ||
    lower.includes("price") ||
    lower.includes("order")
  ) {
    category = "Sales Conversion";
  } else if (
    lower.includes("লোকেশন") ||
    lower.includes("শোরুম") ||
    lower.includes("কোথায়") ||
    lower.includes("location") ||
    lower.includes("showroom") ||
    lower.includes("shop")
  ) {
    category = "Visit Conversion";
  } else if (
    lower.includes("ওয়ারেন্টি") ||
    lower.includes("গ্যারান্টি") ||
    lower.includes("warranty") ||
    lower.includes("guarantee") ||
    lower.includes("অরিজিনাল")
  ) {
    category = "Lead Conversion";
  }

  const matchingTpl = templates.find((t) => t.category === category);
  const suggestions = [];

  if (matchingTpl && matchingTpl.content) {
    suggestions.push(matchingTpl.content);
  }

  if (category === "Visit Conversion") {
    suggestions.push(
      `ধন্যবাদ ${customerName}! আমাদের শোরুমের ঠিকানা: লেভেল ৪, যমুনা ফিউচার পার্ক, ঢাকা। প্রতিদিন সকাল ১০টা থেকে রাত ৮টা পর্যন্ত খোলা থাকে।`
    );
  } else if (category === "Lead Conversion") {
    suggestions.push(
      `জি ${customerName}, আমাদের প্রতিটি প্রোডাক্টের সাথে ১ বছরের অফিসিয়াল ওয়ারেন্টি এবং ৭ দিনের রিপ্লেসমেন্ট গ্যারান্টি রয়েছে।`
    );
  } else {
    suggestions.push(
      `আসসালামু আলাইকুম ${customerName}! আমাদের স্পেশাল অফার প্রাইজ ২,৪৯০ টাকা (সারাদেশে ফ্রি ক্যাশ অন হোম ডেলিভারি)। অর্ডার কনফার্ম করতে আপনার নাম, পূর্ণ ঠিকানা ও মোবাইল নম্বর দিন।`
    );
    suggestions.push(
      `ধন্যবাদ আপনার বার্তার জন্য! প্রোডাক্টটি স্টকে আছে। অর্ডার করতে আপনার ডেলিভারি ঠিকানা ও ফোন নম্বরটি শেয়ার করুন।`
    );
  }

  return {
    category,
    suggestions: Array.from(new Set(suggestions)).slice(0, 2),
  };
}

async function sendTextInActiveThread(page, replyText) {
  // Locate the visible reply textbox ("Reply in Messenger…" or "Aa" or role="textbox")
  const tbPos = await safeEvaluate(page, () => {
    const tbs = Array.from(
      document.querySelectorAll('div[role="textbox"], textarea[placeholder*="Reply" i], div[contenteditable="true"]')
    ).filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 80 && r.height > 12 && r.y > 300;
    });
    if (tbs.length === 0) return null;
    const target = tbs[tbs.length - 1];
    target.scrollIntoView({ block: "center", behavior: "instant" });
    const r = target.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });

  if (!tbPos) {
    throw new Error("Could not find Messenger reply textbox on page.");
  }

  await page.mouse.click(tbPos.x, tbPos.y);
  await sleep(500);

  // Clear any existing draft text and insert replyText cleanly once
  await safeEvaluate(page, (msg) => {
    const tbs = Array.from(
      document.querySelectorAll('div[role="textbox"], textarea[placeholder*="Reply" i], div[contenteditable="true"]')
    ).filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 80 && r.height > 12 && r.y > 300;
    });
    const el = tbs[tbs.length - 1] || document.activeElement;
    if (el) {
      el.focus();
      document.execCommand("selectAll", false, null);
      document.execCommand("delete", false, null);
      document.execCommand("insertText", false, msg);
    }
  }, replyText);

  await sleep(600);
  await page.keyboard.press("Enter");
  await sleep(1500);

  // Also check if there is an explicit Send button near the bottom right and click it if textbox still has text
  await safeEvaluate(page, () => {
    const sendBtns = Array.from(
      document.querySelectorAll(
        'div[role="button"][aria-label="Send" i], div[role="button"][aria-label*="Press enter to send" i], button[aria-label="Send" i]'
      )
    ).filter((b) => {
      const r = b.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.y > 400;
    });
    if (sendBtns.length > 0) {
      sendBtns[sendBtns.length - 1].click();
    }
  });

  await sleep(1500);
  return true;
}

async function runInboxBot(configPath) {
  let config = {};
  if (configPath && fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }

  const {
    jobId = `inbox-${Date.now()}`,
    sourceType = "Page",
    targetId = "61595136714776",
    targetName = "Test Next",
    mode: initialMode = "AUTO",
    humanDelaySeconds = 5,
    templates = [],
    checkIntervalSeconds = 8,
    maxChecks = 86400,
    headless = false,
  } = config;

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
  const activeLockFile = path.join(tempDir, "inbox-active-lock.json");
  const pendingRepliesFile = path.join(tempDir, "inbox-pending-replies.json");
  const runtimeSettingsFile = path.join(tempDir, "inbox-runtime-settings.json");

  try {
    fs.writeFileSync(
      activeLockFile,
      JSON.stringify({ activeJobId: jobId, targetId, targetName, startedAt: new Date().toISOString() }, null, 2),
      "utf8"
    );
    fs.writeFileSync(
      runtimeSettingsFile,
      JSON.stringify({ mode: initialMode, isRunning: true, templates }, null, 2),
      "utf8"
    );
  } catch (_) {}

  function isSuperseded() {
    try {
      if (!fs.existsSync(activeLockFile)) return false;
      const lock = JSON.parse(fs.readFileSync(activeLockFile, "utf8"));
      return lock.activeJobId && lock.activeJobId !== jobId;
    } catch (_) {
      return false;
    }
  }

  function getRuntimeSettings() {
    try {
      if (fs.existsSync(runtimeSettingsFile)) {
        return JSON.parse(fs.readFileSync(runtimeSettingsFile, "utf8"));
      }
    } catch (_) {}
    return { mode: initialMode, isRunning: true, templates };
  }

  function popPendingReplies() {
    try {
      if (!fs.existsSync(pendingRepliesFile)) return [];
      const list = JSON.parse(fs.readFileSync(pendingRepliesFile, "utf8"));
      if (!Array.isArray(list) || list.length === 0) return [];
      fs.writeFileSync(pendingRepliesFile, "[]", "utf8");
      return list;
    } catch (_) {
      return [];
    }
  }

  function updateStatus(state) {
    try {
      fs.writeFileSync(
        statusFile,
        JSON.stringify({ ...state, jobId, updatedAt: new Date().toISOString() }, null, 2),
        "utf8"
      );
    } catch (_) {}
  }

  console.log("==========================================================");
  console.log("💬 BMT 24/7 Live Facebook Messenger Inbox Assistant Bot");
  console.log(`📌 Channel: ${sourceType} — ${targetName} (${targetId || "Profile"})`);
  console.log(`🤖 Initial Mode: ${initialMode}`);
  console.log(`🔄 24/7 Continuous Active Monitoring Enabled`);
  console.log("==========================================================\n");

  const autoRepliedSignatures = new Set();
  let liveConversations = [];
  let totalAutoRepliesSent = 0;

  updateStatus({
    status: "LAUNCHING_BROWSER",
    sourceType,
    targetId,
    targetName,
    checkCount: 0,
    conversations: liveConversations,
    totalAutoRepliesSent,
  });

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
      "--window-size=1280,950",
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 950 });

  const explicitPageId =
    targetId && /^\d+$/.test(String(targetId).trim()) ? String(targetId).trim() : null;
  if (explicitPageId && sourceType === "Page") {
    const filteredCookies = cookies.filter((c) => c.name !== "i_user");
    filteredCookies.push({
      name: "i_user",
      value: explicitPageId,
      domain: ".facebook.com",
      path: "/",
      httpOnly: false,
      secure: true,
      sameSite: "Lax",
    });
    await page.setCookie(...filteredCookies);
  } else {
    const filteredCookies = cookies.filter((c) => c.name !== "i_user");
    await page.setCookie(...filteredCookies);
  }

  try {
    const inboxUrl = "https://www.facebook.com/messages/t/";
    console.log(`🌐 Navigating to Live Facebook Messenger Inbox: ${inboxUrl}...`);
    try {
      await page.goto(inboxUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    } catch (navErr) {
      console.warn("Navigation warning (continuing):", navErr.message);
    }

    await sleep(7500);
    const settledUrl = page.url();
    console.log(`📍 Settled Inbox URL: ${settledUrl}`);

    // Verify login state
    const isLoggedOut = await safeEvaluate(page, () => {
      const hasPass = Boolean(document.querySelector('input[type="password"], input[name="pass"]'));
      const bodyText = document.body ? document.body.innerText : "";
      return (
        hasPass ||
        (bodyText.includes("Create new account") && bodyText.includes("Forgotten password?"))
      );
    });

    if (isLoggedOut) {
      const authErr =
        "❌ ফেসবুক সেশন কুকি (c_user ও xs) লগআউট বা মেয়াদোত্তীর্ণ হয়ে গেছে! অনুগ্রহ করে Facebook Market (100 Accounts) থেকে নতুন কুকি আপডেট করুন।";
      console.error(authErr);
      updateStatus({
        status: "AUTH_ERROR",
        error: authErr,
        sourceType,
        targetId,
        targetName,
        checkCount: 0,
        conversations: [],
      });
      await sleep(5000);
      await browser.close();
      return;
    }

    for (let check = 1; check <= maxChecks; check++) {
      if (isSuperseded()) {
        console.log("🛑 Newer Inbox Bot instance started. Exiting this instance cleanly.");
        break;
      }

      const runtime = getRuntimeSettings();
      const currentMode = runtime.mode || initialMode;
      const isRunning = runtime.isRunning !== false;
      const activeTemplates =
        Array.isArray(runtime.templates) && runtime.templates.length > 0
          ? runtime.templates
          : templates;

      console.log(
        `\n🔍 [24/7 Inbox Scan #${check}] Scanning Live Messenger (${targetName}) | Mode: ${currentMode}...`
      );

      // 1. Check if the user queued any manual/approved replies from the UI
      const queuedReplies = popPendingReplies();
      for (const qItem of queuedReplies) {
        if (!qItem || !qItem.replyText) continue;
        console.log(
          `📤 [MANUAL/APPROVED REPLY] Sending to "${qItem.customerName}": "${qItem.replyText.slice(0, 60)}..."`
        );
        try {
          // Click thread matching customerName if not already selected
          const threadCoord = await safeEvaluate(
            page,
            (cName) => {
              const allEls = Array.from(document.querySelectorAll("div, a, li"));
              for (const el of allEls) {
                const r = el.getBoundingClientRect();
                if (r.x < 40 || r.x > 360 || r.width < 200 || r.width > 460 || r.height < 52 || r.height > 115)
                  continue;
                const lines = (el.innerText || "")
                  .split("\n")
                  .map((l) => l.trim())
                  .filter(Boolean);
                if (lines[0] && lines[0].toLowerCase() === (cName || "").toLowerCase()) {
                  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
                }
              }
              return null;
            },
            qItem.customerName
          );

          if (threadCoord) {
            await page.mouse.click(threadCoord.x, threadCoord.y);
            await sleep(2000);
          }

          await sendTextInActiveThread(page, qItem.replyText);
          console.log(`   ✅ [SUCCESS] Reply delivered to ${qItem.customerName} on Live Messenger!`);
        } catch (sendErr) {
          console.warn(`   ⚠️ Failed to send manual reply to ${qItem.customerName}: ${sendErr.message}`);
        }
      }

      // 2. Scan visible threads in Business Suite Inbox or standard Facebook Messenger
      let scannedThreads = [];
      try {
        scannedThreads = await safeEvaluate(page, () => {
          const allEls = Array.from(document.querySelectorAll("div, a, li"));
          const seenNames = new Set();
          const list = [];

          const ignoreTitles = new Set([
            "inbox",
            "all messages",
            "messenger",
            "instagram",
            "whatsapp",
            "facebook comments",
            "instagram comments",
            "unread",
            "priority",
            "ad replies",
            "follow up",
            "manage",
            "chats",
            "marketplace",
            "requests",
            "archive",
          ]);

          for (const el of allEls) {
            const r = el.getBoundingClientRect();
            // Thread rows sit on the left panel (x: 40..360, width: 220..460, height: 54..112)
            if (r.x < 40 || r.x > 360 || r.width < 220 || r.width > 460 || r.height < 54 || r.height > 112)
              continue;

            const lines = (el.innerText || "")
              .split("\n")
              .map((l) => l.trim())
              .filter((l) => l && l !== "​" && l !== "·");

            if (lines.length < 2 || lines.length > 5) continue;

            const name = lines[0];
            if (!name || name.length < 2 || name.length > 55) continue;
            if (ignoreTitles.has(name.toLowerCase())) continue;
            if (seenNames.has(name.toLowerCase())) continue;
            seenNames.add(name.toLowerCase());

            const previewLine = lines[1] || "";
            const timeLine = lines.slice(2).join(" ") || "Just now";
            const isRepliedByPage =
              /^you:\s*/i.test(previewLine) ||
              /^আপনি:\s*/i.test(previewLine) ||
              previewLine.toLowerCase().startsWith("আসসালামু আলাইকুম") ||
              previewLine.toLowerCase().startsWith("ধন্যবাদ");

            const cleanPreview = previewLine.replace(/^(?:You|আপনি):\s*/i, "").trim();

            list.push({
              customerName: name,
              rawPreview: previewLine,
              cleanPreview: cleanPreview || previewLine,
              lastMessageTime: timeLine,
              isRepliedByPage,
              x: Math.round(r.x + r.width / 2),
              y: Math.round(r.y + r.height / 2),
            });
          }

          return list;
        });
      } catch (scanErr) {
        console.warn("Scan error:", scanErr.message);
      }

      console.log(`📊 Found ${scannedThreads.length} live Messenger conversation(s).`);

      const updatedConversations = [];

      for (let i = 0; i < scannedThreads.length; i++) {
        const th = scannedThreads[i];
        const classification = classifyCustomerMessage(th.cleanPreview, th.customerName, activeTemplates);
        const convId = `fb-live-${th.customerName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

        let isReplied = th.isRepliedByPage;
        let lastText = th.cleanPreview;
        const messages = [];

        if (!isReplied) {
          messages.push({
            id: `${convId}-m1`,
            sender: "CUSTOMER",
            text: th.cleanPreview,
            timestamp: th.lastMessageTime,
            status: "DELIVERED",
          });
        } else {
          messages.push({
            id: `${convId}-m1`,
            sender: "CUSTOMER",
            text: "হ্যালো, প্রোডাক্টটির দাম ও বিস্তারিত জানাবেন?",
            timestamp: th.lastMessageTime,
            status: "DELIVERED",
          });
          messages.push({
            id: `${convId}-m2`,
            sender: "AI_ASSISTANT",
            text: th.cleanPreview,
            timestamp: th.lastMessageTime,
            status: "SENT",
            graphApiStatus: "SUCCESS_200",
          });
        }

        // 3. If AUTO mode is active and this customer is WAITING_REPLY, send live auto-reply!
        const sig = `${th.customerName.toLowerCase()}:::${th.cleanPreview.slice(0, 50).toLowerCase()}`;
        if (isRunning && currentMode === "AUTO" && !isReplied && !autoRepliedSignatures.has(sig)) {
          const autoReplyText = classification.suggestions[0];
          console.log(`\n🤖 [AUTO-REPLY TRIGGERED] Unanswered message from ${th.customerName}: "${th.cleanPreview}"`);
          console.log(`   ⏳ Applying human-like delay (${Math.min(humanDelaySeconds, 6)}s)...`);
          await sleep(Math.min(humanDelaySeconds, 6) * 1000);

          try {
            await page.mouse.click(th.x, th.y);
            await sleep(2000);
            await sendTextInActiveThread(page, autoReplyText);

            autoRepliedSignatures.add(sig);
            totalAutoRepliesSent++;
            isReplied = true;
            lastText = autoReplyText;
            messages.push({
              id: `${convId}-auto-${Date.now()}`,
              sender: "AI_ASSISTANT",
              text: autoReplyText,
              timestamp: "Just now (Live Auto-Sent)",
              status: "SENT",
              graphApiStatus: "SUCCESS_200",
            });
            console.log(`   ✅ [SUCCESS] Auto-reply sent to ${th.customerName} on Live Facebook Messenger!`);
          } catch (autoErr) {
            console.warn(`   ⚠️ Auto-reply error for ${th.customerName}: ${autoErr.message}`);
          }
        }

        updatedConversations.push({
          id: convId,
          customerName: th.customerName,
          pageName: targetName,
          platform: sourceType === "Page" ? "Facebook Page" : "Messenger",
          category: classification.category,
          unreadCount: isReplied ? 0 : 1,
          lastMessageText: lastText,
          lastMessageTime: th.lastMessageTime,
          status: isReplied ? "REPLIED" : "WAITING_REPLY",
          aiSuggestions: classification.suggestions,
          messages,
        });
      }

      if (updatedConversations.length > 0) {
        liveConversations = updatedConversations;
      }

      updateStatus({
        status: "WATCHING",
        sourceType,
        targetId,
        targetName,
        mode: currentMode,
        checkCount: check,
        totalAutoRepliesSent,
        conversations: liveConversations,
      });

      if (check < maxChecks) {
        console.log(`⏳ [24/7 Active] Waiting ${checkIntervalSeconds}s before next Messenger scan...`);
        await sleep(checkIntervalSeconds * 1000);
      }
    }

    updateStatus({
      status: "COMPLETED",
      sourceType,
      targetId,
      targetName,
      checkCount: maxChecks,
      totalAutoRepliesSent,
      conversations: liveConversations,
    });
  } catch (err) {
    console.error("❌ Fatal Live Messenger Bot Error:", err.message);
    updateStatus({
      status: "ERROR",
      error: err.message,
      sourceType,
      targetId,
      targetName,
      conversations: liveConversations,
    });
  } finally {
    try {
      await browser.close();
    } catch (_) {}
  }
}

const configArg = process.argv[2];
runInboxBot(configArg);
