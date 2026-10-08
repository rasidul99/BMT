/**
 * BMT Live Facebook Link Comment Block Shield Bot (24/7 Active Daemon)
 * Monitors a real Facebook Post (Personal Profile, Page, or Group) 24/7,
 * detects incoming comments from OTHER users containing links or blacklisted spam keywords,
 * and automatically DELETES or HIDES them directly on Facebook!
 * Strictly ignores the Post Owner / Author's own comments and Whitelisted domains.
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

const STRICT_URL_REGEX =
  /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(?:com|net|org|io|me|xyz|app|site|live|shop|store|online|info|biz|bd|co|in|uk|us|ru|top|pro|tv|link|ly)(?:\/[^\s]*)?)/gi;
const STANDARD_URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

function analyzeCommentForLinks(commentText, settings) {
  const regex = settings.sensitivity === "STANDARD" ? STANDARD_URL_REGEX : STRICT_URL_REGEX;
  const matches = (commentText || "").match(regex) || [];
  const detectedLinks = Array.from(new Set(matches.map((m) => m.trim())));

  const lowerText = (commentText || "").toLowerCase();
  const matchedKeywords = (settings.blacklistedKeywords || []).filter(
    (kw) => kw && lowerText.includes(kw.toLowerCase())
  );

  if (detectedLinks.length === 0 && matchedKeywords.length === 0) {
    return { shouldBlock: false, isWhitelisted: false, detectedLinks: [], matchedKeywords: [] };
  }

  const whitelistedDomains = (settings.whitelistedDomains || []).map((d) =>
    d.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "")
  );

  const isAllWhitelisted =
    detectedLinks.length > 0 &&
    matchedKeywords.length === 0 &&
    detectedLinks.every((link) => {
      const cleanedLink = link
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "");
      return whitelistedDomains.some(
        (domain) =>
          domain &&
          (cleanedLink === domain ||
            cleanedLink.startsWith(`${domain}/`) ||
            cleanedLink.endsWith(`.${domain}`) ||
            cleanedLink.includes(`.${domain}/`))
      );
    });

  if (isAllWhitelisted) {
    return { shouldBlock: false, isWhitelisted: true, detectedLinks, matchedKeywords: [] };
  }

  return {
    shouldBlock: true,
    isWhitelisted: false,
    detectedLinks:
      detectedLinks.length > 0
        ? detectedLinks
        : matchedKeywords.map((k) => `Keyword: "${k}"`),
    matchedKeywords,
  };
}

async function runLinkShieldBot(configPath) {
  let config = {};
  if (configPath && fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }

  const {
    jobId = `shield-${Date.now()}`,
    postUrl,
    postTitle = "Monitored Facebook Post",
    sourceType = "Page",
    targetId = "",
    targetName = "Facebook Page",
    actionType = "AUTO_DELETE", // "AUTO_DELETE" | "HIDE_COMMENT"
    sensitivity = "STRICT",
    whitelistedDomains = ["bmt.link", "myshopbd.com"],
    blacklistedKeywords = ["crypto", "telegram", "t.me/", "wa.me/", "whatsapp", "free gift"],
    checkIntervalSeconds = 10,
    // Default to 24/7 continuous operation (86,400 checks = 10 days of continuous 10s scans)
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
  const activeLockFile = path.join(tempDir, "shield-active-lock.json");

  // Write single-instance lock so any older duplicate shield bot gracefully exits
  try {
    fs.writeFileSync(
      activeLockFile,
      JSON.stringify({ activeJobId: jobId, postUrl, startedAt: new Date().toISOString() }, null, 2),
      "utf8"
    );
  } catch (_) {}

  function isSupersededByNewerJob() {
    try {
      if (!fs.existsSync(activeLockFile)) return false;
      const lock = JSON.parse(fs.readFileSync(activeLockFile, "utf8"));
      return lock.activeJobId && lock.activeJobId !== jobId;
    } catch (_) {
      return false;
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
  console.log("🛡️ BMT 24/7 Live Facebook Link Comment Block Shield Bot");
  console.log(`🔗 Target Post: ${postUrl}`);
  console.log(`📌 Source: ${sourceType} — ${targetName}`);
  console.log(`⚡ Enforcement Action: ${actionType} | Sensitivity: ${sensitivity}`);
  console.log(`✅ Whitelisted Domains: ${whitelistedDomains.join(", ") || "None"}`);
  console.log(`🚫 Blacklisted Keywords: ${blacklistedKeywords.slice(0, 6).join(", ")}`);
  console.log(`🔄 Mode: 24/7 Continuous Active Protection`);
  console.log("==========================================================\n");

  const incidents = [];
  const processedCleanKeys = new Set();

  updateStatus({
    status: "LAUNCHING_BROWSER",
    postUrl,
    postTitle,
    targetName,
    checkCount: 0,
    incidents,
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
    await page.setCookie(...cookies);
  }

  async function scrollDialog() {
    try {
      await page.mouse.move(640, 500);
      await page.mouse.wheel({ deltaY: 600 });
      await sleep(800);
      await page.mouse.wheel({ deltaY: 600 });
      await sleep(800);
    } catch (_) {
      await safeEvaluate(page, () => window.scrollBy({ top: 500, behavior: "smooth" }));
      await sleep(800);
    }
  }

  async function switchCommentFilterToAll() {
    try {
      const filterPos = await safeEvaluate(page, () => {
        const spans = Array.from(document.querySelectorAll('div[role="button"] span, span[dir="auto"]'));
        const filterBtn = spans.find((s) => {
          const r = s.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return false;
          const t = (s.innerText || "").trim().toLowerCase();
          return t === "most relevant" || t === "সবচেয়ে প্রাসঙ্গিক";
        });
        if (filterBtn) {
          const clickable = filterBtn.closest('div[role="button"]') || filterBtn;
          const r = clickable.getBoundingClientRect();
          return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
        }
        return null;
      });

      if (filterPos) {
        await page.mouse.click(filterPos.x, filterPos.y);
        await sleep(1200);
        const allItemPos = await safeEvaluate(page, () => {
          const items = Array.from(
            document.querySelectorAll('div[role="menuitem"], div[role="menuitemradio"], div[role="option"], span')
          );
          const allItem = items.find((el) => {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) return false;
            const t = (el.innerText || "").trim().toLowerCase();
            return t.startsWith("all comments") || t.startsWith("সব মন্তব্য") || t.startsWith("newest");
          });
          if (allItem) {
            const clickable =
              allItem.closest('div[role="menuitem"], div[role="menuitemradio"], div[role="option"]') || allItem;
            const r = clickable.getBoundingClientRect();
            return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
          }
          return null;
        });
        if (allItemPos) {
          await page.mouse.click(allItemPos.x, allItemPos.y);
          await sleep(1800);
        }
      }
    } catch (_) {}
  }

  try {
    console.log(`🌐 Navigating to Post URL: ${postUrl}...`);
    try {
      await page.goto(postUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    } catch (navErr) {
      console.warn("Navigation warning (continuing):", navErr.message);
    }

    await sleep(5000);
    let settledUrl = page.url();
    console.log(`📍 Settled Post URL: ${settledUrl}`);

    const settledPageIdMatch =
      settledUrl.match(/[?&]id=(\d+)/) || settledUrl.match(/facebook\.com\/(\d+)\//);
    const detectedPageId = explicitPageId || (settledPageIdMatch ? settledPageIdMatch[1] : null);

    if (detectedPageId && sourceType !== "Personal ID") {
      console.log(`🏢 Ensuring Page profile context (i_user=${detectedPageId})...`);
      try {
        await page.setCookie({
          name: "i_user",
          value: detectedPageId,
          domain: ".facebook.com",
          path: "/",
          httpOnly: false,
          secure: true,
          sameSite: "Lax",
        });
      } catch (_) {}
    }

    if ((settledUrl.includes("permalink.php") && postUrl.includes("/share/")) || detectedPageId) {
      try {
        await page.goto(settledUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
        await sleep(4000);
        settledUrl = page.url();
      } catch (_) {}
    }

    // Check if logged out modal/overlay is blocking the post
    const authState = await safeEvaluate(page, () => {
      const hasPass = Boolean(document.querySelector('input[type="password"], input[name="pass"]'));
      const bodyText = document.body ? document.body.innerText : "";
      return {
        hasPass,
        isLoggedOut:
          hasPass ||
          (bodyText.includes("Create new account") && bodyText.includes("Forgotten password?")),
      };
    });

    if (authState && authState.isLoggedOut) {
      const authErr =
        "❌ ফেসবুক সেশন কুকি (c_user ও xs) লগআউট বা মেয়াদোত্তীর্ণ হয়ে গেছে! অনুগ্রহ করে Facebook Market (100 Accounts) থেকে নতুন কুকি আপডেট করুন।";
      console.error(authErr);
      updateStatus({
        status: "AUTH_ERROR",
        error: authErr,
        postUrl,
        postTitle,
        targetName,
        checkCount: 0,
        incidents,
      });
      await sleep(5000);
      await browser.close();
      return;
    }

    await scrollDialog();
    await switchCommentFilterToAll();

    for (let check = 1; check <= maxChecks; check++) {
      if (isSupersededByNewerJob()) {
        console.log("🛑 Newer Link Shield Bot instance detected. Closing this instance cleanly.");
        break;
      }

      // Periodically refresh post every 15 scans (~2.5 minutes) so new comments always appear in DOM
      if (check > 1 && check % 15 === 0) {
        console.log("🔄 Refreshing post view to fetch any newly arrived comments...");
        try {
          await page.goto(settledUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
          await sleep(4000);
          await scrollDialog();
          await switchCommentFilterToAll();
        } catch (_) {}
      } else if (check > 1 && check % 5 === 0) {
        await switchCommentFilterToAll();
      }

      console.log(`\n🔍 [24/7 Shield Scan #${check}] Checking post comments for links & spam...`);
      updateStatus({
        status: "WATCHING",
        checkCount: check,
        postUrl,
        postTitle,
        targetName,
        incidents,
      });

      let detectedComments = [];
      try {
        detectedComments = await safeEvaluate(
          page,
          (ownerTargetName) => {
            let activeOwnerName = "";
            const commentAsBox = document.querySelector(
              'div[role="textbox"][aria-label*="Comment as " i], div[role="textbox"][aria-label*="হিসাবে মন্তব্য" i]'
            );
            if (commentAsBox) {
              const label = commentAsBox.getAttribute("aria-label") || "";
              const m = label.match(/Comment as (.+)$/i) || label.match(/^(.+?) হিসাবে মন্তব্য/i);
              if (m && m[1]) activeOwnerName = m[1].trim().toLowerCase();
            }
            const cleanTargetOwner = (ownerTargetName || "")
              .replace(/\(Personal ID\)/gi, "")
              .split("—")[0]
              .trim()
              .toLowerCase();

            // Only select VISIBLE comment/reply articles (width > 0 & height > 0)
            const rawCommentArticles = Array.from(
              document.querySelectorAll(
                'div[role="article"][aria-label*="Comment by" i], div[role="article"][aria-label*="Reply by" i], div[role="article"][aria-label*="মন্তব্য" i]'
              )
            ).filter((art) => {
              const r = art.getBoundingClientRect();
              return r.width > 0 && r.height > 0;
            });

            // Prefer articles inside an open dialog if present
            const dialogArticles = rawCommentArticles.filter((art) => Boolean(art.closest('div[role="dialog"]')));
            const commentArticles = dialogArticles.length > 0 ? dialogArticles : rawCommentArticles;

            const seenSignatures = new Set();
            const list = [];

            commentArticles.forEach((art, idx) => {
              const ariaLabel = art.getAttribute("aria-label") || "";
              const text = (art.innerText || "").trim();
              if (!text || text.length < 2) return;

              // Check if comment is already hidden (shows "Unhide" button)
              const isAlreadyHidden = /\bunhide\b/i.test(text) || text.includes("আনহাইড");

              let author = "";
              const ariaMatch = ariaLabel.match(
                /(?:Comment|Reply) by (.+?)(?: to .+?'s comment)?(?: \d+| about | an? | just now| yesterday|$)/i
              );
              if (ariaMatch && ariaMatch[1]) {
                author = ariaMatch[1].trim();
              }
              if (!author) {
                const nameEl = art.querySelector('a[role="link"] span, h3 span, strong span, a span');
                author = nameEl ? (nameEl.innerText || nameEl.textContent || "").trim() : "";
              }

              const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
              if (!author) {
                author = lines[0] || "Facebook User";
              }

              const lowerAuthor = author.trim().toLowerCase();
              const isAuthor =
                /\bauthor\b/i.test(text) ||
                text.includes("লেখক") ||
                (activeOwnerName && lowerAuthor === activeOwnerName) ||
                (cleanTargetOwner && lowerAuthor === cleanTargetOwner);

              const bodyLines = lines.filter((l) => {
                const low = l.toLowerCase();
                if (l === author) return false;
                if (
                  low === "like" ||
                  low === "reply" ||
                  low === "send message" ||
                  low === "hide" ||
                  low === "unhide" ||
                  low === "see translation" ||
                  low === "author" ||
                  low === "follow" ||
                  low === "top fan" ||
                  low.includes("see response") ||
                  low.includes("রেসপন্স দেখুন")
                )
                  return false;
                if (low === "·" || /^\d+\s*[mhdwy]$/i.test(low) || low.includes("ago") || low === "just now")
                  return false;
                if (low.includes("পছন্দ") || low.includes("উত্তর") || low.includes("বার্তা পাঠান") || low === "লেখক")
                  return false;
                return true;
              });

              let body = bodyLines.join(" ").trim() || lines[lines.length - 1] || text;
              body = body.replace(/(?:Like|Reply|Send message|See translation|See response)+$/gi, "").trim();

              const dedupKey = `${lowerAuthor}:::${body.slice(0, 60).toLowerCase()}`;
              if (seenSignatures.has(dedupKey)) return;
              seenSignatures.add(dedupKey);

              list.push({
                index: idx,
                ariaLabel,
                author,
                isAuthor,
                isAlreadyHidden,
                text: body,
              });
            });

            return list;
          },
          targetName || ""
        );
      } catch (scanErr) {
        console.warn(`Scan error: ${scanErr.message}`);
        await sleep(3000);
        continue;
      }

      console.log(`📊 Found ${detectedComments.length} visible comments on post.`);

      for (const item of detectedComments) {
        const cleanKey = `${item.author}:::${item.text.slice(0, 60)}`;

        // 1. Strictly skip Post Owner / Author's own comments!
        if (item.isAuthor) {
          if (!processedCleanKeys.has(cleanKey)) {
            console.log(`ℹ️ Skipping Post Owner/Author comment (${item.author}): "${item.text.slice(0, 40)}..."`);
            processedCleanKeys.add(cleanKey);
          }
          continue;
        }

        // Skip if already hidden when mode is HIDE_COMMENT
        if (item.isAlreadyHidden && actionType === "HIDE_COMMENT") {
          processedCleanKeys.add(cleanKey);
          continue;
        }

        // 2. Analyze comment for links & blacklisted keywords
        const analysis = analyzeCommentForLinks(item.text, {
          sensitivity,
          whitelistedDomains,
          blacklistedKeywords,
        });

        if (!analysis.shouldBlock && !analysis.isWhitelisted) {
          processedCleanKeys.add(cleanKey);
          continue;
        }

        if (analysis.isWhitelisted) {
          if (!processedCleanKeys.has(cleanKey)) {
            console.log(`✅ [WHITELIST PASS] Allowed safe link from ${item.author}: ${analysis.detectedLinks.join(", ")}`);
            processedCleanKeys.add(cleanKey);
            incidents.unshift({
              id: `inc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              commentId: `fb_live_${Date.now()}`,
              postId: postUrl,
              postTitle,
              senderName: item.author,
              pageOrAccountName: targetName,
              commentText: item.text,
              detectedLinks: analysis.detectedLinks,
              detectedAt: new Date().toLocaleTimeString(),
              actionTaken: "ALLOWED_WHITELIST",
              graphApiStatus: "SUCCESS_200",
              latencyMs: 120,
            });
            updateStatus({
              status: "WATCHING",
              checkCount: check,
              postUrl,
              postTitle,
              targetName,
              incidents,
            });
          }
          continue;
        }

        // 3. Unauthorized Link or Blacklisted Spam Keyword Detected! Delete or Hide on Live Facebook!
        const startTime = Date.now();
        console.log(`\n🚨 [UNAUTHORIZED LINK / SPAM DETECTED]:`);
        console.log(`   👤 Commenter: ${item.author}`);
        console.log(`   💬 Comment: "${item.text}"`);
        console.log(`   🔗 Detected: ${analysis.detectedLinks.join(", ")}`);
        console.log(`   ⚡ Executing live Facebook action: ${actionType}...`);

        let actionSucceeded = false;
        let finalActionTaken = actionType === "HIDE_COMMENT" ? "HIDDEN" : "AUTO_DELETED";

        try {
          // Step A: Find the VISIBLE comment article and scroll it into view
          const commentCoords = await safeEvaluate(
            page,
            (targetAuthor, targetText) => {
              const articles = Array.from(
                document.querySelectorAll(
                  'div[role="article"][aria-label*="Comment by" i], div[role="article"][aria-label*="Reply by" i], div[role="article"][aria-label*="মন্তব্য" i]'
                )
              ).filter((a) => {
                const r = a.getBoundingClientRect();
                return r.width > 0 && r.height > 0;
              });

              const snippet = targetText.slice(0, 25).toLowerCase();
              const art = articles.find((a) => {
                const t = (a.innerText || "").toLowerCase();
                return t.includes(snippet) && (!targetAuthor || t.includes(targetAuthor.toLowerCase()));
              });
              if (!art) return null;

              art.scrollIntoView({ block: "center", behavior: "instant" });
              const r = art.getBoundingClientRect();
              return { x: r.x + r.width / 2, y: r.y + Math.min(30, r.height / 2) };
            },
            item.author,
            item.text
          );

          if (commentCoords) {
            await page.mouse.move(commentCoords.x, commentCoords.y);
            await sleep(800);
          }

          // Step B: Locate the 3-dots (...) menu button inside this visible comment article and click it with mouse
          const menuBtnCoords = await safeEvaluate(
            page,
            (targetAuthor, targetText) => {
              const articles = Array.from(
                document.querySelectorAll(
                  'div[role="article"][aria-label*="Comment by" i], div[role="article"][aria-label*="Reply by" i], div[role="article"][aria-label*="মন্তব্য" i]'
                )
              ).filter((a) => {
                const r = a.getBoundingClientRect();
                return r.width > 0 && r.height > 0;
              });

              const snippet = targetText.slice(0, 25).toLowerCase();
              const art = articles.find((a) => {
                const t = (a.innerText || "").toLowerCase();
                return t.includes(snippet) && (!targetAuthor || t.includes(targetAuthor.toLowerCase()));
              });
              if (!art) return null;

              const menuBtn = art.querySelector(
                'div[aria-haspopup="menu"], div[role="button"][aria-label*="Delete, hide or report" i], div[role="button"][aria-label*="Actions for this comment" i], div[role="button"][aria-label*="Hide or report" i], div[role="button"][aria-label*="Comment options" i]'
              );
              if (!menuBtn) return null;
              const br = menuBtn.getBoundingClientRect();
              if (br.width === 0 || br.height === 0) {
                menuBtn.click();
                return { clickedViaDom: true };
              }
              return { x: br.x + br.width / 2, y: br.y + br.height / 2 };
            },
            item.author,
            item.text
          );

          let menuOpened = false;
          if (menuBtnCoords) {
            if (menuBtnCoords.x && menuBtnCoords.y) {
              await page.mouse.click(menuBtnCoords.x, menuBtnCoords.y);
            }
            menuOpened = true;
          }

          if (menuOpened) {
            await sleep(1400);

            // Step C: Find "Delete" or "Hide comment" inside div[role="menu"] and get its coordinates
            const menuTarget = await safeEvaluate(
              page,
              (desiredAction) => {
                const menu = document.querySelector('div[role="menu"]');
                if (!menu) return null;

                const candidates = Array.from(
                  menu.querySelectorAll('div[role="button"], div[role="menuitem"], span')
                ).filter((el) => {
                  const r = el.getBoundingClientRect();
                  return r.width > 0 && r.height > 0;
                });

                const findDelete = () =>
                  candidates.find((el) => {
                    const t = (el.innerText || "").trim().toLowerCase();
                    return t === "delete" || t === "delete..." || t === "delete comment" || t === "মুছে ফেলুন";
                  });

                const findHide = () =>
                  candidates.find((el) => {
                    const t = (el.innerText || "").trim().toLowerCase();
                    return (
                      t === "hide comment" ||
                      t === "hide" ||
                      t.startsWith("hide comment") ||
                      t.includes("মন্তব্য লুকান")
                    );
                  });

                let chosen = null;
                let type = "AUTO_DELETED";

                if (desiredAction === "AUTO_DELETE") {
                  chosen = findDelete();
                  type = "AUTO_DELETED";
                  if (!chosen) {
                    chosen = findHide();
                    type = "HIDDEN";
                  }
                } else {
                  chosen = findHide();
                  type = "HIDDEN";
                  if (!chosen) {
                    chosen = findDelete();
                    type = "AUTO_DELETED";
                  }
                }

                if (!chosen) return null;
                const clickable =
                  chosen.closest('div[role="button"], div[role="menuitem"]') || chosen;
                const r = clickable.getBoundingClientRect();
                return {
                  type,
                  x: r.x + r.width / 2,
                  y: r.y + r.height / 2,
                };
              },
              actionType
            );

            if (menuTarget && menuTarget.x && menuTarget.y) {
              finalActionTaken = menuTarget.type;
              await page.mouse.click(menuTarget.x, menuTarget.y);
              await sleep(1600);

              // Step D: If "Delete" opened a confirmation modal ("Delete comment?"), click its "Delete" button!
              if (finalActionTaken === "AUTO_DELETED") {
                const confirmCoords = await safeEvaluate(page, () => {
                  const dialogs = Array.from(
                    document.querySelectorAll('div[role="dialog"], div[role="alertdialog"]')
                  );
                  // Look specifically for the "Delete comment?" confirmation dialog first
                  const delDialog =
                    dialogs.find((d) => {
                      const label = (d.getAttribute("aria-label") || "").toLowerCase();
                      const txt = (d.innerText || "").toLowerCase();
                      return (
                        label.includes("delete") ||
                        label.includes("মুছে") ||
                        txt.includes("delete comment?") ||
                        txt.includes("are you sure you want to delete")
                      );
                    }) || dialogs[dialogs.length - 1];

                  if (!delDialog) return null;

                  const btns = Array.from(delDialog.querySelectorAll('div[role="button"], button')).filter(
                    (b) => {
                      const r = b.getBoundingClientRect();
                      return r.width > 0 && r.height > 0;
                    }
                  );

                  const confirmBtn = btns.find((b) => {
                    const t = (b.innerText || b.getAttribute("aria-label") || "").trim().toLowerCase();
                    return t === "delete" || t === "মুছে ফেলুন" || t === "confirm";
                  });

                  if (!confirmBtn) return null;
                  confirmBtn.click();
                  const r = confirmBtn.getBoundingClientRect();
                  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
                });

                if (confirmCoords && confirmCoords.x && confirmCoords.y) {
                  await page.mouse.click(confirmCoords.x, confirmCoords.y);
                }
                await sleep(2500);
              }

              actionSucceeded = true;
              console.log(
                `   ✅ [SUCCESS] Comment from ${item.author} was ${finalActionTaken} on live Facebook!`
              );
            } else {
              console.warn(`   ⚠️ Menu opened, but Delete/Hide option was not found.`);
              // Close any open menu by pressing Escape
              try {
                await page.keyboard.press("Escape");
              } catch (_) {}
            }
          } else {
            console.warn(`   ⚠️ Could not locate 3-dots comment menu button for ${item.author}.`);
          }
        } catch (actErr) {
          console.warn(`   ⚠️ Error while executing ${actionType}: ${actErr.message}`);
        }

        if (actionSucceeded) {
          const latencyMs = Math.max(250, Date.now() - startTime);
          incidents.unshift({
            id: `inc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            commentId: `fb_live_${Date.now()}`,
            postId: postUrl,
            postTitle,
            senderName: item.author,
            pageOrAccountName: targetName,
            commentText: item.text,
            detectedLinks: analysis.detectedLinks,
            detectedAt: new Date().toLocaleTimeString(),
            actionTaken: finalActionTaken,
            graphApiStatus: "SUCCESS_200",
            latencyMs,
          });

          updateStatus({
            status: "WATCHING",
            checkCount: check,
            postUrl,
            postTitle,
            targetName,
            incidents,
          });
        }
      }

      if (check < maxChecks) {
        console.log(`⏳ [24/7 Active] Waiting ${checkIntervalSeconds}s before next scan...`);
        await sleep(checkIntervalSeconds * 1000);
      }
    }

    updateStatus({
      status: "COMPLETED",
      checkCount: maxChecks,
      postUrl,
      postTitle,
      targetName,
      incidents,
    });
  } catch (err) {
    console.error("❌ Fatal Link Shield Bot Error:", err.message);
    updateStatus({
      status: "ERROR",
      error: err.message,
      postUrl,
      postTitle,
      targetName,
      incidents,
    });
  } finally {
    try {
      await browser.close();
    } catch (_) {}
  }
}

const configArg = process.argv[2];
runLinkShieldBot(configArg);
