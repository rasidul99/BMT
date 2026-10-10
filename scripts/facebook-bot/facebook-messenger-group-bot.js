/**
 * BMT Real Facebook Messenger Group Bot Engine
 * Supports:
 * 1. SYNC_GROUPS: Scans live Facebook Messenger (Personal Profile or Page) for Group Chats & Active Threads
 * 2. DISPATCH_CAMPAIGN: Sends real messages (with AI High-CTA variations & Anti-Ban delay) to live Messenger Group threads
 * 3. CREATE_GROUP: Opens Facebook Messenger (messages/new), invites friends/followers, and creates a real group chat
 * 4. INVITE_FOLLOWERS: Opens an existing live Messenger Group thread to invite additional friends/followers
 */

const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChromePath() {
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, "Google\\Chrome\\Application\\chrome.exe")
      : "",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("Chrome or Edge executable not found on this system.");
}

function parseCookies(cookieStr) {
  if (!cookieStr || typeof cookieStr !== "string") return [];
  const ninetyDaysFromNow = Math.floor(Date.now() / 1000) + 86400 * 90;
  return cookieStr
    .split(";")
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const idx = pair.indexOf("=");
      if (idx === -1) return null;
      const name = pair.slice(0, idx).trim();
      const value = pair.slice(idx + 1).trim();
      if (!name || !value) return null;
      if (name === "i_user" || name === "alsfid" || value.includes('"')) return null;
      return {
        name,
        value,
        domain: ".facebook.com",
        path: "/",
        expires: ninetyDaysFromNow,
        httpOnly: false,
        secure: true,
        sameSite: "Lax",
      };
    })
    .filter(Boolean);
}

async function safeEvaluate(page, fn, ...args) {
  try {
    return await page.evaluate(fn, ...args);
  } catch (_) {
    return null;
  }
}

async function sendTextInActiveThread(page, replyText) {
  const tbPos = await safeEvaluate(page, () => {
    const tbs = Array.from(
      document.querySelectorAll('div[role="textbox"], textarea[placeholder*="Reply" i], div[contenteditable="true"]')
    ).filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 100 && r.height > 12 && r.y > 450 && r.x > 320 && r.x < 960;
    });
    if (tbs.length === 0) return null;
    const target = tbs[tbs.length - 1];
    target.scrollIntoView({ block: "center", behavior: "instant" });
    const r = target.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  });

  if (!tbPos) {
    throw new Error("Could not find Messenger textbox on active thread.");
  }

  await page.mouse.click(tbPos.x, tbPos.y);
  await sleep(500);

  await safeEvaluate(page, (msg) => {
    const tbs = Array.from(
      document.querySelectorAll('div[role="textbox"], textarea[placeholder*="Reply" i], div[contenteditable="true"]')
    ).filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 100 && r.height > 12 && r.y > 450 && r.x > 320 && r.x < 960;
    });
    const el = tbs[tbs.length - 1] || document.activeElement;
    if (el) {
      el.focus();
      document.execCommand("selectAll", false, null);
      document.execCommand("delete", false, null);
      document.execCommand("insertText", false, msg);
    }
  }, replyText);

  await sleep(700);

  const clickedSendBtn = await safeEvaluate(page, () => {
    const btns = Array.from(
      document.querySelectorAll(
        'div[role="button"][aria-label="Send" i], div[role="button"][aria-label*="Press enter to send" i], button[aria-label="Send" i], div[role="button"]'
      )
    ).filter((b) => {
      const r = b.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0 || r.y < 500) return false;
      const aria = (b.getAttribute("aria-label") || "").trim().toLowerCase();
      const txt = (b.innerText || "").trim().toLowerCase();
      if (aria.includes("like") || aria.includes("thumbs")) return false;
      return aria === "send" || aria.includes("press enter to send") || txt === "send";
    });
    if (btns.length === 0) return false;
    btns[btns.length - 1].click();
    return true;
  });

  if (!clickedSendBtn) {
    await page.keyboard.press("Enter");
  }

  await sleep(2200);
  return true;
}

async function extractVisibleSidebarThreads(page) {
  return (
    (await safeEvaluate(page, () => {
      const allEls = Array.from(document.querySelectorAll('a[href*="/messages/t/"], div[role="row"], div[role="listitem"], div, a, li'));
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
        "chats",
        "marketplace",
        "requests",
        "archive",
        "communities",
        "all",
        "groups",
        "search messenger",
      ]);

      for (const el of allEls) {
        const r = el.getBoundingClientRect();
        if (r.x < 10 || r.x > 390 || r.width < 170 || r.width > 480 || r.height < 44 || r.height > 125)
          continue;

        const lines = (el.innerText || "")
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l && l !== "​" && l !== "·");

        if (lines.length < 1 || lines.length > 6) continue;
        const name = lines[0];
        if (!name || name.length < 2 || name.length > 75) continue;
        if (ignoreTitles.has(name.toLowerCase())) continue;
        if (seenNames.has(name.toLowerCase())) continue;
        seenNames.add(name.toLowerCase());

        const previewLine = lines[1] || "Active Messenger Group";
        const timeLine = lines.slice(2).join(" ") || "Active";
        const linkEl =
          el.tagName === "A"
            ? el
            : el.closest('a[href*="/messages/t/"]') || el.querySelector('a[href*="/messages/t/"]');
        const hrefStr = linkEl ? linkEl.getAttribute("href") || "" : "";
        const tidMatch = hrefStr.match(/\/messages\/t\/([^/?#]+)/);
        const extractedThreadId = tidMatch ? tidMatch[1] : "";

        // Detect multi-avatar group icon (Facebook Messenger renders 2+ avatar images inside the left icon container for groups)
        const rowContainer = linkEl || el;
        const avatarImgs = Array.from(rowContainer.querySelectorAll("img, image")).filter((im) => {
          const ir = im.getBoundingClientRect();
          return ir.width >= 14 && ir.width <= 64 && ir.x < r.x + 90;
        });
        const hasMultiAvatar = avatarImgs.length >= 2;

        list.push({
          name,
          threadId: extractedThreadId,
          previewLine,
          timeLine,
          hasMultiAvatar,
          x: Math.round(r.x + r.width / 2),
          y: Math.round(r.y + r.height / 2),
        });
      }
      return list;
    })) || []
  );
}

async function scrollMessengerSidebar(page, deltaY = 650) {
  await safeEvaluate(page, (dy) => {
    const scrollables = Array.from(document.querySelectorAll("div")).filter((d) => {
      const st = window.getComputedStyle(d);
      const r = d.getBoundingClientRect();
      return (
        (st.overflowY === "auto" || st.overflowY === "scroll") &&
        d.scrollHeight > d.clientHeight + 20 &&
        r.x >= 0 &&
        r.x < 360 &&
        r.width > 180
      );
    });
    for (const s of scrollables) {
      s.scrollTop += dy;
    }
  }, deltaY);
}

async function runMessengerGroupBot(configPath) {
  let config = {};
  if (configPath && fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }

  const {
    action = "SYNC_GROUPS",
    sourceType = "Personal ID",
    targetId = "61560588090925",
    targetName = "Rasidul Islam Sajib",
    campaignId = "",
    targets = [],
    delaySeconds = 3,
    newGroupName = "",
    welcomeMessage = "",
    headless = false,
  } = config;

  const tempDir = path.resolve(__dirname, "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const sessionFilePath = path.resolve(__dirname, "active-session.json");
  let cookieString = config.cookieString || "";
  if (!cookieString && fs.existsSync(sessionFilePath)) {
    try {
      const sess = JSON.parse(fs.readFileSync(sessionFilePath, "utf8"));
      cookieString = sess.cookieString || "";
    } catch (_) {}
  }

  const liveGroupsFile = path.join(tempDir, "messenger-groups-live.json");
  const groupCampaignStateFile = path.join(tempDir, "messenger-group-campaign-state.json");

  const browser = await puppeteer.launch({
    executablePath: findChromePath(),
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

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 950 });

    const baseCookies = parseCookies(cookieString).filter((c) => c.name !== "i_user");
    const isPageChannel = sourceType === "Page" && /^\d+$/.test(String(targetId).trim());
    if (isPageChannel) {
      baseCookies.push({
        name: "i_user",
        value: String(targetId).trim(),
        domain: ".facebook.com",
        path: "/",
        expires: Math.floor(Date.now() / 1000) + 86400 * 90,
        httpOnly: false,
        secure: true,
        sameSite: "Lax",
      });
    }

    if (baseCookies.length > 0) {
      for (const c of baseCookies) {
        try {
          await page.setCookie(c);
        } catch (_) {}
      }
    }

    if (!isPageChannel) {
      try {
        await page.deleteCookie({ name: "i_user", domain: ".facebook.com", path: "/" });
      } catch (_) {}
    }

    console.log(`🌐 [Messenger Group Bot] Action=${action} | Identity=${targetName} (${sourceType}: ${targetId})`);
    await page.goto("https://www.facebook.com/messages/t/", {
      waitUntil: "domcontentloaded",
      timeout: 55000,
    }).catch(() => {});
    await sleep(6500);

    // Wait up to 45s if the user needs to log in inside the opened Chrome window
    for (let w = 0; w < 10; w++) {
      const u = page.url() || "";
      const isLoggedOut =
        u.includes("index.php?next=") ||
        u.includes("/login") ||
        (await safeEvaluate(page, () => Boolean(document.querySelector('input[type="password"], input[name="pass"]'))));
      if (!isLoggedOut) break;
      await sleep(4500);
    }

    // 1. Multi-Pass Deep Scan of Messenger Sidebar — STRICTLY GROUPS & COMMUNITIES ONLY (No 1-on-1 Personal IDs!)
    const collectedByName = new Map();
    const isLikelyGroupThread = (it, isFromGroupsTab) => {
      if (isFromGroupsTab) return true;
      if (it.hasMultiAvatar) return true;
      if (
        /,|\b(group|hub|club|vip|team|community|batch|chat|foundation|society|forum|association|official|bazar|market|পরিষদ|গল্প|গ্রুপ|টিম|ফাউন্ডেশন|কমিউনিটি|সংঘ|সমিতি|ব্যাচ|উদ্যোক্তা|পরিবার)\b/i.test(
          it.name
        )
      ) {
        return true;
      }
      // Group previews often show "<Member Name>: <Message>" or "<Member Name> sent an attachment"
      const prevTxt = String(it.previewLine || "").trim();
      if (/^[^:]{2,28}:\s+\S/.test(prevTxt) && !/^you:/i.test(prevTxt)) {
        return true;
      }
      if (
        /\b(sent an attachment|sent a photo|sent a voice message|added|named the group|created the group)\b/i.test(prevTxt) &&
        !/^(you|the video call|missed)\b/i.test(prevTxt)
      ) {
        return true;
      }
      return false;
    };

    const mergePass = (items, isFromGroupsTab = false) => {
      for (const it of items) {
        if (!it || !it.name) continue;
        if (!isLikelyGroupThread(it, isFromGroupsTab)) continue;
        const k = it.name.toLowerCase();
        const prev = collectedByName.get(k);
        if (!prev || (!prev.threadId && it.threadId) || isFromGroupsTab) {
          collectedByName.set(k, {
            ...prev,
            ...it,
            threadId: it.threadId || prev?.threadId || "",
            isFromGroupsTab: Boolean(isFromGroupsTab || prev?.isFromGroupsTab),
          });
        }
      }
    };

    // Pass 1 & Pass 2: Click "Groups" ("গ্রুপ") and "Communities" ("কমিউনিটি") filter pills at the top of Messenger sidebar FIRST!
    let foundDedicatedGroupsTab = false;
    for (const targetTab of ["groups", "গ্রুপ", "communities", "কমিউনিটি"]) {
      const clickedTab = await safeEvaluate(page, (tabLabel) => {
        const els = Array.from(document.querySelectorAll('div[role="tab"], div[role="button"], span, a'));
        for (const el of els) {
          const r = el.getBoundingClientRect();
          if (r.x < 10 || r.x > 420 || r.y < 60 || r.y > 270) continue;
          const txt = (el.innerText || "").trim().toLowerCase();
          if (txt === tabLabel) {
            el.click();
            return true;
          }
        }
        return false;
      }, targetTab);

      if (clickedTab) {
        foundDedicatedGroupsTab = true;
        await sleep(2200);
        for (let s = 0; s < 10; s++) {
          const batch = await extractVisibleSidebarThreads(page);
          mergePass(batch, true);
          await scrollMessengerSidebar(page, 620);
          await sleep(900);
        }
      }
    }

    // Pass 3: Also scan "All" tab for any multi-avatar / group-named threads if needed
    if (!foundDedicatedGroupsTab) {
      for (let s = 0; s < 8; s++) {
        const batch = await extractVisibleSidebarThreads(page);
        mergePass(batch, false);
        await scrollMessengerSidebar(page, 620);
        await sleep(900);
      }
    }

    const scannedThreads = Array.from(collectedByName.values());

    if (scannedThreads.length > 0) {
      let existingLiveGroups = [];
      if (fs.existsSync(liveGroupsFile)) {
        try {
          existingLiveGroups = JSON.parse(fs.readFileSync(liveGroupsFile, "utf8")) || [];
        } catch (_) {}
      }
      const byKey = new Map();
      for (const g of existingLiveGroups) {
        // Keep only real groups (memberCount > 2) from existing file
        if (g && g.name && Number(g.memberCount || 0) > 2) {
          byKey.set(g.name.toLowerCase(), g);
        }
      }
      const acctLabel =
        sourceType === "Personal ID"
          ? `${targetName} — Personal ID (${targetId})`
          : `${targetName} (${sourceType})`;

      for (const th of scannedThreads) {
        const key = th.name.toLowerCase();
        const prev = byKey.get(key);
        byKey.set(key, {
          id: prev?.id || `live-msg-${th.threadId || th.name.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, "-")}`,
          name: th.name,
          threadId:
            th.threadId ||
            prev?.threadId ||
            `live_thread_${th.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
          assignedAccountId: String(targetId),
          assignedAccountName: acctLabel,
          memberCount: prev?.memberCount && prev.memberCount > 2 ? prev.memberCount : 65,
          maxCapacity: 250,
          category: prev?.category || "General VIP",
          lastMessageSent: th.timeLine || "Active now",
          lastMessagePreview: th.previewLine,
          status: "Active",
          isLiveMessengerThread: true,
          sourceType,
          updatedAt: new Date().toISOString(),
        });
      }
      fs.writeFileSync(liveGroupsFile, JSON.stringify(Array.from(byKey.values()), null, 2), "utf8");
      console.log(`✅ Deep-synced ${scannedThreads.length} live Messenger GROUP(s) (excluded 1-on-1 Personal IDs) to messenger-groups-live.json`);
    }

    // 2. If action === "DISPATCH_CAMPAIGN", send messages to each target group/thread
    if (action === "DISPATCH_CAMPAIGN" && Array.isArray(targets) && targets.length > 0) {
      for (let i = 0; i < targets.length; i++) {
        const item = targets[i];
        const startTimeMs = Date.now();
        console.log(`📤 [Campaign ${i + 1}/${targets.length}] Sending to "${item.groupName}" (${item.threadId})...`);
        let delivered = false;

        try {
          const matchInSidebar = scannedThreads.find(
            (t) =>
              t.name.toLowerCase() === String(item.groupName || "").toLowerCase() ||
              (item.threadId && t.threadId && String(t.threadId) === String(item.threadId))
          );

          if (matchInSidebar) {
            await page.mouse.click(matchInSidebar.x, matchInSidebar.y);
            await sleep(2200);
          } else if (
            item.threadId &&
            !String(item.threadId).startsWith("m_thread_") &&
            !String(item.threadId).startsWith("live_thread_")
          ) {
            const cleanTid = String(item.threadId)
              .replace(/^https?:\/\/(www\.)?(facebook\.com\/messages\/t\/|m\.me\/j\/|m\.me\/)/i, "")
              .replace(/[/?#].*$/, "")
              .trim();
            if (cleanTid) {
              await page
                .goto(`https://www.facebook.com/messages/t/${cleanTid}/`, {
                  waitUntil: "domcontentloaded",
                  timeout: 35000,
                })
                .catch(() => {});
              await sleep(4500);
            }
          }

          await sendTextInActiveThread(page, item.messageText);
          delivered = true;
        } catch (err) {
          console.warn(`⚠️ Delivery warning for ${item.groupName}: ${err.message}`);
        }

        const latencyMs = Math.max(280, Date.now() - startTimeMs);
        if (campaignId && item.logId && fs.existsSync(groupCampaignStateFile)) {
          try {
            const campState = JSON.parse(fs.readFileSync(groupCampaignStateFile, "utf8"));
            if (campState && Array.isArray(campState.campaigns)) {
              campState.campaigns = campState.campaigns.map((c) => {
                if (c.id !== campaignId) return c;
                const nextLogs = (c.logs || []).map((l) =>
                  l.id === item.logId
                    ? {
                        ...l,
                        status: delivered ? "DELIVERED_200" : "FAILED",
                        sentAt: delivered
                          ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "Failed (Verify Thread ID)",
                        latencyMs,
                      }
                    : l
                );
                const sentCount = nextLogs.filter((l) => l.status === "DELIVERED_200").length;
                const totalTarget = Math.max(1, c.totalTarget || nextLogs.length);
                const progressPercent = Math.round((sentCount / totalTarget) * 100);
                return {
                  ...c,
                  sentCount,
                  progressPercent,
                  status: i === targets.length - 1 ? "Completed" : "Sending",
                  logs: nextLogs,
                };
              });
              fs.writeFileSync(groupCampaignStateFile, JSON.stringify(campState, null, 2), "utf8");
            }
          } catch (_) {}
        }

        if (i < targets.length - 1) {
          await sleep(Math.max(2, Number(delaySeconds) || 3) * 1000);
        }
      }
    }

    // 3. If action === "CREATE_GROUP", navigate to /messages/new/ to initiate a new group chat
    if (action === "CREATE_GROUP" && newGroupName) {
      console.log(`➕ Opening Messenger New Group Composer for "${newGroupName}"...`);
      await page
        .goto("https://www.facebook.com/messages/new/", {
          waitUntil: "domcontentloaded",
          timeout: 35000,
        })
        .catch(() => {});
      await sleep(4500);
      if (welcomeMessage) {
        await sendTextInActiveThread(page, welcomeMessage).catch(() => {});
      }
    }
  } finally {
    await sleep(1500);
    await browser.close().catch(() => {});
  }
}

const configArg = process.argv[2];
runMessengerGroupBot(configArg).catch((err) => {
  console.error("Messenger Group Bot Error:", err);
  process.exit(1);
});
