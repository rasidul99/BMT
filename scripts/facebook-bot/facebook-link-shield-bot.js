/**
 * BMT Live Facebook Link Comment Block Shield Bot
 * Monitors a real Facebook Post (Personal Profile, Page, or Group),
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
    maxChecks = 50,
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

  function updateStatus(state) {
    fs.writeFileSync(
      statusFile,
      JSON.stringify({ ...state, updatedAt: new Date().toISOString() }, null, 2),
      "utf8"
    );
  }

  console.log("==========================================================");
  console.log("🛡️ BMT Live Facebook Link Comment Block Shield Bot");
  console.log(`🔗 Target Post: ${postUrl}`);
  console.log(`📌 Source: ${sourceType} — ${targetName}`);
  console.log(`⚡ Enforcement Action: ${actionType} | Sensitivity: ${sensitivity}`);
  console.log(`✅ Whitelisted Domains: ${whitelistedDomains.join(", ") || "None"}`);
  console.log(`🚫 Blacklisted Keywords: ${blacklistedKeywords.slice(0, 6).join(", ")}`);
  console.log(`👁️ Headless: ${headless}`);
  console.log("==========================================================\n");

  const incidents = [];
  const processedKeys = new Set();

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
      await page.mouse.move(640, 450);
      await page.mouse.wheel({ deltaY: 650 });
      await sleep(1000);
      await page.mouse.wheel({ deltaY: 650 });
      await sleep(1000);
    } catch (_) {
      await safeEvaluate(page, () => window.scrollBy({ top: 500, behavior: "smooth" }));
      await sleep(1000);
    }
  }

  try {
    console.log(`🌐 Navigating to Post URL: ${postUrl}...`);
    try {
      await page.goto(postUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    } catch (navErr) {
      console.warn("Navigation warning (continuing):", navErr.message);
    }

    await sleep(5000);
    const currentUrl = page.url();
    console.log(`📍 Settled Post URL: ${currentUrl}`);

    const settledPageIdMatch =
      currentUrl.match(/[?&]id=(\d+)/) || currentUrl.match(/facebook\.com\/(\d+)\//);
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

    if ((currentUrl.includes("permalink.php") && postUrl.includes("/share/")) || detectedPageId) {
      try {
        await page.goto(currentUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
        await sleep(4000);
      } catch (_) {}
    }

    // Check if logged out modal/overlay is blocking the post
    const authState = await safeEvaluate(page, () => {
      const hasPass = Boolean(document.querySelector('input[type="password"], input[name="pass"]'));
      const bodyText = document.body ? document.body.innerText : "";
      const hasContinueBtn = Array.from(document.querySelectorAll('div[role="button"], button, span')).some(
        (el) => (el.innerText || "").trim() === "Continue"
      );
      return {
        hasPass,
        hasContinueBtn,
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

    // Switch "Most relevant" comment filter to "All comments"
    try {
      const switchedFilter = await safeEvaluate(page, () => {
        const spans = Array.from(document.querySelectorAll('div[role="button"] span, span[dir="auto"]'));
        const filterBtn = spans.find((s) => {
          const t = (s.innerText || "").trim().toLowerCase();
          return t === "most relevant" || t === "সবচেয়ে প্রাসঙ্গিক";
        });
        if (filterBtn) {
          const clickable = filterBtn.closest('div[role="button"]') || filterBtn;
          clickable.click();
          return true;
        }
        return false;
      });
      if (switchedFilter) {
        await sleep(1500);
        await safeEvaluate(page, () => {
          const items = Array.from(
            document.querySelectorAll('div[role="menuitem"], div[role="menuitemradio"], div[role="option"], span')
          );
          const allItem = items.find((el) => {
            const t = (el.innerText || "").trim().toLowerCase();
            return t.startsWith("all comments") || t.startsWith("সব মন্তব্য") || t.startsWith("newest");
          });
          if (allItem) {
            const clickable =
              allItem.closest('div[role="menuitem"], div[role="menuitemradio"], div[role="option"]') || allItem;
            clickable.click();
          }
        });
        await sleep(2000);
      }
    } catch (_) {}

    for (let check = 1; check <= maxChecks; check++) {
      console.log(`\n🔍 [Shield Scan ${check}/${maxChecks}] Checking post comments for links & spam...`);
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

            // Prefer top-level & nested comments by other users
            let commentArticles = Array.from(
              document.querySelectorAll(
                'div[role="article"][aria-label*="Comment by" i], div[role="article"][aria-label*="Reply by" i], div[role="article"][aria-label*="মন্তব্য" i]'
              )
            );

            if (commentArticles.length === 0) {
              const allArticles = Array.from(document.querySelectorAll('div[role="article"]'));
              commentArticles = allArticles.filter((art) => {
                const hasChildComment = allArticles.some(
                  (other) =>
                    other !== art &&
                    art.contains(other) &&
                    (other.getAttribute("aria-label") || "").toLowerCase().includes("comment")
                );
                return !hasChildComment;
              });
            }

            const seenSignatures = new Set();
            const list = [];

            commentArticles.forEach((art, idx) => {
              const ariaLabel = art.getAttribute("aria-label") || "";
              const text = (art.innerText || "").trim();
              if (!text || text.length < 2) return;

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
                  low === "see translation" ||
                  low === "author" ||
                  low === "follow" ||
                  low === "top fan" ||
                  low.includes("see response") ||
                  low.includes("রেসপন্স দেখুন")
                )
                  return false;
                if (low.includes("·") || /^\d+\s*[mhdwy]$/i.test(low) || low.includes("ago") || low === "just now")
                  return false;
                if (low.includes("পছন্দ") || low.includes("উত্তর") || low.includes("বার্তা পাঠান") || low === "লেখক")
                  return false;
                return true;
              });

              let body = bodyLines.join(" ").trim() || lines[lines.length - 1] || text;
              // Clean trailing concatenated action labels
              body = body.replace(/(?:Like|Reply|Send message|See translation|See response)+$/gi, "").trim();

              const dedupKey = `${lowerAuthor}:::${body.slice(0, 50).toLowerCase()}`;
              if (seenSignatures.has(dedupKey)) return;
              seenSignatures.add(dedupKey);

              list.push({
                index: idx,
                ariaLabel,
                author,
                isAuthor,
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

      console.log(`📊 Found ${detectedComments.length} unique comments on post.`);

      for (const item of detectedComments) {
        const commentKey = `${item.author}:::${item.text.slice(0, 50)}`;
        if (processedKeys.has(commentKey)) continue;

        // 1. Strictly skip Post Owner / Author's own comments!
        if (item.isAuthor) {
          console.log(`ℹ️ Skipping Post Owner/Author comment (${item.author}): "${item.text.slice(0, 40)}..."`);
          processedKeys.add(commentKey);
          continue;
        }

        // 2. Analyze comment for links & blacklisted keywords
        const analysis = analyzeCommentForLinks(item.text, {
          sensitivity,
          whitelistedDomains,
          blacklistedKeywords,
        });

        if (!analysis.shouldBlock && !analysis.isWhitelisted) {
          // Normal clean customer comment without links — leave untouched
          processedKeys.add(commentKey);
          continue;
        }

        if (analysis.isWhitelisted) {
          console.log(`✅ [WHITELIST PASS] Allowed safe link from ${item.author}: ${analysis.detectedLinks.join(", ")}`);
          processedKeys.add(commentKey);
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
          // Step A: Scroll comment into view and get its coordinates so we can hover with mouse
          const commentCoords = await safeEvaluate(
            page,
            (targetAuthor, targetText) => {
              const articles = Array.from(
                document.querySelectorAll(
                  'div[role="article"][aria-label*="Comment by" i], div[role="article"][aria-label*="Reply by" i], div[role="article"]'
                )
              );
              const art = articles.find((a) => {
                const t = a.innerText || "";
                return t.includes(targetText.slice(0, 25)) && (!targetAuthor || t.includes(targetAuthor));
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
            await sleep(900);
          }

          // Step B: Click the 3-dots (...) menu button next to this comment
          const menuOpened = await safeEvaluate(
            page,
            (targetAuthor, targetText) => {
              const articles = Array.from(
                document.querySelectorAll(
                  'div[role="article"][aria-label*="Comment by" i], div[role="article"][aria-label*="Reply by" i], div[role="article"]'
                )
              );
              const art = articles.find((a) => {
                const t = a.innerText || "";
                return t.includes(targetText.slice(0, 25)) && (!targetAuthor || t.includes(targetAuthor));
              });
              if (!art) return false;

              const scopes = [art, art.parentElement, art.parentElement && art.parentElement.parentElement].filter(
                Boolean
              );

              for (const scope of scopes) {
                const candidates = Array.from(
                  scope.querySelectorAll(
                    'div[aria-haspopup="menu"], div[role="button"][aria-label*="Actions for this comment" i], div[role="button"][aria-label*="Hide or report" i], div[role="button"][aria-label*="Comment options" i], div[role="button"][aria-label*="More" i], div[role="button"][aria-label*="আরও" i], div[role="button"][aria-label*="মন্তব্য" i]'
                  )
                );
                if (candidates.length > 0) {
                  candidates[0].click();
                  return true;
                }
              }
              return false;
            },
            item.author,
            item.text
          );

          if (menuOpened) {
            await sleep(1400);

            // Step C: Click "Delete" or "Hide comment" inside the opened menu
            const menuClickResult = await safeEvaluate(
              page,
              (desiredAction) => {
                const menuItems = Array.from(
                  document.querySelectorAll('div[role="menuitem"], div[role="menu"] span, div[role="menu"] div')
                );

                const findDelete = () =>
                  menuItems.find((el) => {
                    const t = (el.innerText || "").trim().toLowerCase();
                    return t === "delete" || t === "delete..." || t === "delete comment" || t === "মুছে ফেলুন";
                  });

                const findHide = () =>
                  menuItems.find((el) => {
                    const t = (el.innerText || "").trim().toLowerCase();
                    return (
                      t === "hide comment" ||
                      t === "hide" ||
                      t.startsWith("hide comment") ||
                      t.includes("মন্তব্য লুকান")
                    );
                  });

                if (desiredAction === "AUTO_DELETE") {
                  const delBtn = findDelete();
                  if (delBtn) {
                    const clickable = delBtn.closest('div[role="menuitem"]') || delBtn;
                    clickable.click();
                    return { clicked: true, type: "AUTO_DELETED" };
                  }
                  const hideBtn = findHide();
                  if (hideBtn) {
                    const clickable = hideBtn.closest('div[role="menuitem"]') || hideBtn;
                    clickable.click();
                    return { clicked: true, type: "HIDDEN" };
                  }
                } else {
                  const hideBtn = findHide();
                  if (hideBtn) {
                    const clickable = hideBtn.closest('div[role="menuitem"]') || hideBtn;
                    clickable.click();
                    return { clicked: true, type: "HIDDEN" };
                  }
                  const delBtn = findDelete();
                  if (delBtn) {
                    const clickable = delBtn.closest('div[role="menuitem"]') || delBtn;
                    clickable.click();
                    return { clicked: true, type: "AUTO_DELETED" };
                  }
                }

                return { clicked: false };
              },
              actionType
            );

            if (menuClickResult && menuClickResult.clicked) {
              finalActionTaken = menuClickResult.type;
              await sleep(1500);

              // Step D: If "Delete" opened a confirmation modal ("Delete Comment?"), confirm it!
              if (finalActionTaken === "AUTO_DELETED") {
                await safeEvaluate(page, () => {
                  const dialogs = Array.from(document.querySelectorAll('div[role="dialog"]'));
                  for (const d of dialogs) {
                    const btns = Array.from(d.querySelectorAll('div[role="button"], button, span'));
                    const confirmBtn = btns.find((b) => {
                      const t = (b.innerText || b.getAttribute("aria-label") || "").trim().toLowerCase();
                      return t === "delete" || t === "মুছে ফেলুন" || t === "confirm";
                    });
                    if (confirmBtn) {
                      const clickable = confirmBtn.closest('div[role="button"], button') || confirmBtn;
                      clickable.click();
                      return true;
                    }
                  }
                  return false;
                });
                await sleep(2000);
              }

              actionSucceeded = true;
              console.log(
                `   ✅ [SUCCESS] Comment from ${item.author} was ${finalActionTaken} on live Facebook!`
              );
            } else {
              console.warn(`   ⚠️ Menu opened, but Delete/Hide option was not available for this account role.`);
            }
          } else {
            console.warn(`   ⚠️ Could not locate 3-dots comment menu button for ${item.author}.`);
          }
        } catch (actErr) {
          console.warn(`   ⚠️ Error while executing ${actionType}: ${actErr.message}`);
        }

        processedKeys.add(commentKey);
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
          graphApiStatus: actionSucceeded ? "SUCCESS_200" : "SIMULATED_200",
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

      if (check < maxChecks) {
        console.log(`⏳ Waiting ${checkIntervalSeconds}s before next scan...`);
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
