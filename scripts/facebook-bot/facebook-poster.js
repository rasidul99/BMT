/**
 * BMT Headless Facebook Group Automation Bot
 * Powered by Puppeteer & Chrome Automation
 * 
 * Features:
 * - Injects verified Facebook session cookies (c_user, xs, datr, sb, fr)
 * - Anti-ban human emulation (typing delay, mouse jitter, random wait intervals)
 * - Automatic group navigation and post composing
 * - Bypasses CORS restrictions via direct headless browser execution
 * - Supports both Headless (silent background) and Headed (visible Chrome window) modes
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const client = url.startsWith("https") ? https : http;
    client
      .get(url, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        }
        response.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}

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

// Default Chrome Paths on Windows
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
  throw new Error("No compatible Chrome or Edge executable found on this Windows system.");
}

/**
 * Parse standard raw cookie string into Puppeteer cookie format
 * Example input: "c_user=61560588012345; xs=42%3Asome_token; datr=abc; fr=xyz;"
 */
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

/**
 * Random humanized sleep interval
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runFacebookGroupBot(config) {
  const {
    accountName = "Facebook Account",
    cookieString,
    groups = [],
    postMessage = "BMT Automated Post",
    mediaUrl = "",
    delaySeconds = 60,
    headless = false, // Set false so user can visibly watch the bot post in Chrome!
  } = config;

  // Prepare local media file if mediaUrl is provided
  let localMediaFile = null;
  const rawMedia = mediaUrl || config.imageUrl || config.image;
  if (rawMedia && typeof rawMedia === "string" && rawMedia.trim()) {
    const trimmed = rawMedia.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      try {
        let ext = "jpg";
        if (trimmed.includes(".mp4")) ext = "mp4";
        else if (trimmed.includes(".mov")) ext = "mov";
        else if (trimmed.includes(".webm")) ext = "webm";
        else if (trimmed.includes(".png")) ext = "png";
        else if (trimmed.includes(".gif")) ext = "gif";
        else if (trimmed.includes(".webp")) ext = "webp";

        const tempMediaDir = path.join(__dirname, "temp");
        if (!fs.existsSync(tempMediaDir)) fs.mkdirSync(tempMediaDir, { recursive: true });
        localMediaFile = path.join(tempMediaDir, `upload-${Date.now()}.${ext}`);
        console.log(`⬇️ Downloading media attachment from: ${trimmed}`);
        await downloadFile(trimmed, localMediaFile);
        console.log(`✅ Media attachment downloaded to: ${localMediaFile}`);
      } catch (dErr) {
        console.warn(`⚠️ Failed to download media attachment: ${dErr.message}`);
        localMediaFile = null;
      }
    } else {
      // Local path candidate resolution (supports /sample-video.mp4, public folder relative paths, etc.)
      const candidates = [
        trimmed,
        path.resolve(process.cwd(), trimmed),
        path.resolve(__dirname, "../../apps/web/public", trimmed.replace(/^\/+/, "")),
        path.resolve(__dirname, "../../../apps/web/public", trimmed.replace(/^\/+/, "")),
        path.resolve("G:/Development/BMT/apps/web/public", trimmed.replace(/^\/+/, "")),
      ];
      for (const cand of candidates) {
        if (cand && fs.existsSync(cand)) {
          localMediaFile = cand;
          console.log(`✅ Resolved local media file: ${localMediaFile}`);
          break;
        }
      }
      if (!localMediaFile) {
        console.warn(`⚠️ Local media path not found: ${trimmed}`);
      }
    }
  }

  console.log("==========================================================");
  console.log("🚀 BMT Facebook Group Automation Engine");
  console.log(`👤 Account: ${accountName}`);
  console.log(`📋 Total Target Groups: ${groups.length}`);
  console.log(`⏱️ Anti-Spam Delay: ${delaySeconds} seconds between posts`);
  console.log(`👁️ Mode: ${headless ? "Headless (Silent Background)" : "Visible Browser Window"}`);
  console.log("==========================================================\n");

  const cookies = parseCookies(cookieString);
  const cUser = cookies.find((c) => c.name === "c_user")?.value || "Unknown";

  if (!cookies.some((c) => c.name === "c_user") || !cookies.some((c) => c.name === "xs")) {
    console.error("❌ Error: Invalid Cookie string. Both 'c_user' and 'xs' are required for Facebook authentication.");
    return { success: false, error: "Missing required cookies (c_user or xs)" };
  }

  console.log(`🔑 Verified Session Found: c_user=${cUser}`);
  const chromeExecutable = findChromePath();
  console.log(`🌐 Launching Chrome at: ${chromeExecutable}`);

  const browser = await puppeteer.launch({
    executablePath: chromeExecutable,
    headless: headless ? "new" : false,
    defaultViewport: null,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-infobars",
      "--disable-notifications",
      "--window-size=1280,850",
    ],
  });

  const results = [];

  try {
    const page = (await browser.pages())[0] || (await browser.newPage());

    // Stealth evasion headers
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    );

    // Inject cookies into Facebook domain
    console.log("🍪 Injecting authenticated Facebook session cookies...");
    await page.setCookie(...cookies);

    // Test session validity by navigating to Facebook home
    console.log("🔍 Checking Facebook login status...");
    await page.goto("https://www.facebook.com/", { waitUntil: "networkidle2", timeout: 45000 });
    await sleep(2500);

    const currentUrl = page.url();
    if (currentUrl.includes("/login") || currentUrl.includes("/checkpoint")) {
      console.error("❌ Login failed: Facebook redirected to login or checkpoint page.");
      await browser.close();
      return { success: false, error: "Session expired or checkpoint encountered" };
    }

    console.log("✅ Facebook Session Active and Authenticated!\n");

    // Loop through target groups
    for (let i = 0; i < groups.length; i++) {
      const grp = groups[i];
      let groupUrl = grp.url || (grp.groupId && String(grp.groupId).startsWith("http") ? grp.groupId : null);
      if (!groupUrl) {
        const idStr = String(grp.groupId || grp.pageId || "");
        if (grp.isPage || (!idStr.includes("groups/") && idStr.length > 5 && !idStr.startsWith("grp-"))) {
          groupUrl = `https://www.facebook.com/${idStr}`;
        } else {
          groupUrl = `https://www.facebook.com/groups/${idStr}`;
        }
      }

      console.log(`----------------------------------------------------------`);
      console.log(`📍 [${i + 1}/${groups.length}] Processing Destination: ${grp.groupName || grp.name || grp.groupId}`);
      console.log(`🔗 URL: ${groupUrl}`);

      try {
        await page.goto(groupUrl, { waitUntil: "networkidle2", timeout: 45000 });
        await sleep(3500);

        // Check if destination is accessible
        const pageTitle = await page.title();
        console.log(`📄 Page Title: "${pageTitle}"`);

        const pageText = await page.evaluate(() => (document.body ? document.body.innerText : ""));
        if (
          pageText.includes("This content isn't available right now") ||
          pageText.includes("এই কন্টেন্টটি এই মুহূর্তে পাওয়া যাচ্ছে না") ||
          pageText.includes("The link you followed may be broken") ||
          pageText.includes("Page Not Found")
        ) {
          throw new Error(`ফেসবুক গ্রুপের লিংকটি ভুল বা ফেসবুক পেজটি পাওয়া যাচ্ছে না (${groupUrl})`);
        }

        // 1. Check if Page profile switch is required (Facebook NPE Pages)
        console.log("🔍 Checking if Page Profile Switch is required...");
        const switchTriggered = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('div[role="button"], button'));
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
          console.log("🔄 Found Switch prompt. Waiting for confirmation dialog...");
          await sleep(2500);

          // Click modal confirmation Switch button
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
            console.log("✅ Profile switch confirmed! Waiting for Page reload...");
            await sleep(8000);
          }
        }

        // 2. Locate Facebook Post Composer
        console.log("✍️ Locating Facebook Post Composer...");
        let composerOpened = false;

        for (let attempt = 0; attempt < 3; attempt++) {
          composerOpened = await page.evaluate(() => {
            const allButtons = Array.from(document.querySelectorAll('div[role="button"], span'));
            const trigger = allButtons.find(b => {
              const t = (b.innerText || b.getAttribute('aria-label') || '').trim();
              return (
                t.includes("What's on your mind") ||
                t.includes("Create a post") ||
                t.includes("Create a public post") ||
                t.includes("Write something") ||
                t.includes("মনে কী আছে?") ||
                t.includes("কিছু লিখুন") ||
                t.includes("পোস্ট লিখুন")
              );
            });
            if (trigger) {
              trigger.click();
              return true;
            }
            return false;
          });

          if (composerOpened) {
            console.log("🎯 Successfully clicked composer trigger!");
            break;
          }
          await sleep(2000);
        }

        if (!composerOpened) {
          const checkStatus = await page.evaluate(() => {
            const body = document.body ? document.body.innerText : "";
            const isJoinNeeded = Array.from(document.querySelectorAll('div[role="button"], span, button')).some(b => {
              const t = (b.innerText || '').toLowerCase().trim();
              return t === 'join group' || t === 'গ্রুপে যোগ দিন' || t === 'join';
            });
            return {
              isJoinNeeded,
              isRestricted: body.includes("You can't post to this group") || body.includes("আপনার পোস্ট করার অনুমতি নেই")
            };
          });

          if (checkStatus.isJoinNeeded) {
            throw new Error(`এই ফেসবুক আইডিতে গ্রুপের মেম্বারশিপ নেই (Must join "${grp.groupName || 'the group'}" on Facebook first)`);
          }
          if (checkStatus.isRestricted) {
            throw new Error(`এই গ্রুপে পোস্ট করার অনুমতি অ্যাডমিন বন্ধ রেখেছে (Posting restricted by group admin)`);
          }
          throw new Error(`গ্রুপে পোস্ট লেখার বক্স পাওয়া যায়নি। ফেসবুকের সঠিক গ্রুপ লিংক দিন (Invalid URL: ${groupUrl})`);
        }

        await sleep(2500);

        // 3. Attach media image/file if available
        if (localMediaFile && fs.existsSync(localMediaFile)) {
          const isVideo = /\.(mp4|mov|webm|avi|mkv)$/i.test(localMediaFile);
          console.log(`📷 Attaching ${isVideo ? "video" : "image"} to post dialog...`);
          try {
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

            const fileInput = await page.$('div[role="dialog"] input[type="file"]');
            if (fileInput) {
              await fileInput.uploadFile(localMediaFile);
              const waitSec = isVideo ? 12 : 5;
              console.log(`✅ Media file attached! Waiting ${waitSec}s for Facebook preview...`);
              await sleep(waitSec * 1000);
            } else {
              console.warn("⚠️ File input inside dialog not found, proceeding with text.");
            }
          } catch (mErr) {
            console.warn("⚠️ Media attachment warning:", mErr.message);
          }
        }

        // 4. Locate text input area inside the popup dialog
        console.log("📝 Typing post content...");
        const textBoxSelector = 'div[role="dialog"] div[role="textbox"]';
        await page.waitForSelector(textBoxSelector, { timeout: 15000 });
        await page.click(textBoxSelector);
        await sleep(500);

        // Human-like typing with random jitter
        await page.type(textBoxSelector, postMessage, { delay: 25 });
        await sleep(1500);

        // Click outside text area to dismiss hashtag/mention autocompletes
        const dismissTagPopup = await page.$('div[role="dialog"] h2, div[role="dialog"] span');
        if (dismissTagPopup) {
          try { await dismissTagPopup.click(); } catch (_) {}
          await sleep(800);
        }

        // 5. Multi-step Native Submission Wizard (Handles Text, Image, Video, Reel)
        console.log("🚀 Submitting post via multi-step wizard...");
        for (let step = 1; step <= 5; step++) {
          await sleep(2500);

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

            // Filter ONLY visible on-screen elements (ignores off-screen animated dialogs where rect.x < 0)
            const visibleButtons = allButtons.filter(b => {
              const r = b.getBoundingClientRect();
              return r.x >= 0 && r.y >= 0 && r.width >= 30 && r.height >= 20 && (r.x + r.width) <= window.innerWidth;
            });

            // Check post/publish first
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
                disabled: target.getAttribute('aria-disabled') === 'true' || target.disabled === true
              };
            }
            return null;
          });

          if (!buttonInfo) {
            console.log(`Step ${step}: No visible Next/Post button found. Dialog may already be submitted and closed.`);
            break;
          }

          if (buttonInfo.disabled) {
            console.log(`Step ${step}: Button '${buttonInfo.text}' is disabled (media processing), waiting 5s...`);
            await sleep(5000);
            continue;
          }

          console.log(`Step ${step}: Clicking visible ${buttonInfo.type} button ('${buttonInfo.text}') at (${buttonInfo.x}, ${buttonInfo.y})...`);
          await page.mouse.click(buttonInfo.x, buttonInfo.y);
          await sleep(3500);

          if (buttonInfo.type === 'publish') {
            console.log("🎉 Final publish button clicked!");
            break;
          }
        }

        // Dismiss any "Not now" upsell dialogs
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
              if (rect.x >= 0 && rect.y >= 0) {
                return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
              }
            }
            return null;
          });
          if (notNowInfo) {
            await page.mouse.click(notNowInfo.x, notNowInfo.y);
            console.log("Dismissed Facebook upsell modal (Not now)");
            break;
          }
        }

        // Wait for post upload & dialog close
        await sleep(8000);

        let commentLog = null;
        // 6. Optional: 1st Comment Pin Automation
        if (config.ctaPin && config.ctaPin.enabled && config.ctaPin.commentText) {
          const ctaDelay = Math.max(2, Number(config.ctaPin.delaySeconds) || 5);
          console.log(`\n💬 [CTA 1st Comment Automation] Active! Waiting ${ctaDelay}s pacing delay...`);
          await sleep(ctaDelay * 1000);

          try {
            console.log("🔍 Locating comment box for the newly published post...");
            let commentInputFound = false;

            for (let attempt = 1; attempt <= 3; attempt++) {
              // 1. Locate and scroll the comment box into view
              const foundBox = await page.evaluate(() => {
                const textboxes = Array.from(document.querySelectorAll('div[role="textbox"][contenteditable="true"]'));
                const commentBox = textboxes.find((el) => {
                  const label = (el.getAttribute("aria-label") || el.getAttribute("data-placeholder") || "").toLowerCase();
                  return label.includes("comment") || label.includes("মন্তব্য") || label.includes("write");
                });

                if (commentBox) {
                  commentBox.scrollIntoView({ behavior: "smooth", block: "center" });
                  return {
                    found: true,
                    ariaLabel: commentBox.getAttribute("aria-label"),
                  };
                }

                // Fallback: look for "Comment" action button under post to trigger the box
                const buttons = Array.from(document.querySelectorAll('div[role="button"], button'));
                const cBtn = buttons.find((btn) => {
                  const t = (btn.getAttribute("aria-label") || btn.innerText || "").toLowerCase();
                  return t === "leave a comment" || t === "comment" || t === "মন্তব্য";
                });
                if (cBtn) {
                  cBtn.scrollIntoView({ behavior: "smooth", block: "center" });
                  cBtn.click();
                  return { found: false, clickedActionBtn: true };
                }

                return { found: false };
              });

              if (foundBox.clickedActionBtn) {
                await sleep(2000);
                continue;
              }

              if (foundBox.found) {
                await sleep(1500);
                const selector = 'div[role="textbox"][contenteditable="true"][aria-label*="Comment"], div[role="textbox"][contenteditable="true"][aria-label*="মন্তব্য"], div[role="textbox"][contenteditable="true"]';
                await page.waitForSelector(selector, { timeout: 8000 });
                await page.click(selector);
                await sleep(600);

                // Type the CTA comment text line by line to preserve Shift+Enter formatting
                const commentText = config.ctaPin.commentText;
                console.log(`✍️ Typing CTA comment (${commentText.length} characters)...`);
                const lines = commentText.split("\n");
                for (let li = 0; li < lines.length; li++) {
                  if (lines[li].length > 0) {
                    await page.keyboard.type(lines[li], { delay: 20 });
                  }
                  if (li < lines.length - 1) {
                    await page.keyboard.down("Shift");
                    await page.keyboard.press("Enter");
                    await page.keyboard.up("Shift");
                    await sleep(250);
                  }
                }

                await sleep(1000);
                console.log("📨 Submitting comment (pressing Enter)...");
                await page.keyboard.press("Enter");
                await sleep(6000);

                // Verify comment in DOM
                const isVerified = await page.evaluate((sample) => {
                  const nodes = Array.from(document.querySelectorAll('div[dir="auto"], span[dir="auto"]'));
                  return nodes.some((n) => n.innerText && n.innerText.includes(sample));
                }, commentText.slice(0, 20));

                commentInputFound = true;
                commentLog = isVerified ? "Comment submitted & verified" : "Comment submitted";
                console.log(`🎉 [CTA] First comment submitted successfully! (Verified: ${isVerified})`);

                // Handle Auto-Pin if requested
                if (config.ctaPin.autoPin) {
                  console.log("📌 Auto-pin enabled. Locating comment menu options...");
                  try {
                    await sleep(2000);
                    const menuClicked = await page.evaluate(() => {
                      const menuBtns = Array.from(
                        document.querySelectorAll(
                          'div[aria-label*="More" i], div[aria-label*="আরও" i], div[aria-label*="Comment options" i], div[aria-label*="মন্তব্য" i], div[aria-haspopup="menu"]'
                        )
                      );
                      for (const btn of menuBtns) {
                        const r = btn.getBoundingClientRect();
                        if (r.y >= 0 && r.y <= window.innerHeight && r.width > 10) {
                          btn.click();
                          return true;
                        }
                      }
                      return false;
                    });

                    if (menuClicked) {
                      await sleep(1500);
                      const pinClicked = await page.evaluate(() => {
                        const menuItems = Array.from(document.querySelectorAll('div[role="menuitem"], span, div'));
                        const pinItem = menuItems.find((el) => {
                          const t = (el.innerText || "").toLowerCase();
                          return t.includes("pin comment") || t.includes("মন্তব্য পিন") || t.includes("pin this comment");
                        });
                        if (pinItem) {
                          pinItem.click();
                          return true;
                        }
                        return false;
                      });

                      if (pinClicked) {
                        await sleep(2000);
                        console.log("📌 [CTA] Comment pinned to top successfully!");
                        commentLog = "Comment submitted & pinned";
                      } else {
                        console.log("ℹ️ Pin option not present in menu (leaving comment unpinned).");
                      }
                    }
                  } catch (pinErr) {
                    console.warn("⚠️ Pinning comment skipped:", pinErr.message);
                  }
                }
                break;
              } else {
                console.log(`Attempt ${attempt}: Scrolling timeline down to find comment box...`);
                await page.evaluate(() => window.scrollBy({ top: 600, behavior: "smooth" }));
                await sleep(2500);
              }
            }

            if (!commentInputFound) {
              console.warn("⚠️ Could not locate comment box on the timeline.");
              commentLog = "Could not find comment box";
            }
          } catch (ctaErr) {
            console.error("⚠️ CTA comment automation error:", ctaErr.message);
            commentLog = `Failed: ${ctaErr.message}`;
          }
        }

        results.push({
          groupId: grp.groupId,
          groupName: grp.groupName,
          status: "Success",
          commentStatus: commentLog,
          timestamp: new Date().toISOString(),
        });

        console.log(`🎉 [SUCCESS] Post published to ${grp.groupName || grp.groupId}!`);
      } catch (grpErr) {
        console.error(`⚠️ Failed to post to group ${grp.groupId}: ${grpErr.message}`);
        results.push({
          groupId: grp.groupId,
          groupName: grp.groupName,
          status: "Failed",
          error: grpErr.message,
          timestamp: new Date().toISOString(),
        });
      }

      // Anti-Spam Pacing Delay between groups (unless it's the last one)
      if (i < groups.length - 1) {
        const jitter = Math.floor(Math.random() * 10) - 5;
        const totalDelay = Math.max(15, delaySeconds + jitter);
        console.log(`⏳ Anti-Spam Pacing: Waiting ${totalDelay} seconds before next group...\n`);
        await sleep(totalDelay * 1000);
      }
    }
  } catch (err) {
    console.error("❌ Automation execution encountered an error:", err);
  } finally {
    console.log("\n==========================================================");
    console.log("🏁 Batch Automation Complete!");
    const successCount = results.filter((r) => r.status === "Success").length;
    const failedCount = results.filter((r) => r.status === "Failed").length;
    console.log(`📊 Total: ${results.length} | Success: ${successCount} | Failed: ${failedCount}`);
    console.log("==========================================================");
    try {
      await browser.close();
    } catch (_) {}

    if (localMediaFile && localMediaFile.includes("upload-") && fs.existsSync(localMediaFile)) {
      try {
        fs.unlinkSync(localMediaFile);
      } catch (_) {}
    }

    const overallSuccess = successCount > 0;
    const output = {
      jobId: config.jobId,
      success: overallSuccess,
      results,
      summary: { total: results.length, success: successCount, failed: failedCount },
    };

    if (config.jobId) {
      const statusFile = path.join(__dirname, "temp", `${config.jobId}-status.json`);
      try {
        fs.writeFileSync(statusFile, JSON.stringify(output, null, 2), "utf8");
      } catch (fErr) {
        console.error("Could not write status file:", fErr);
      }
    }

    return output;
  }
}

// CLI Execution support
if (require.main === module) {
  const configFile = process.argv[2];
  let config = {};

  if (configFile && fs.existsSync(configFile)) {
    config = JSON.parse(fs.readFileSync(configFile, "utf8"));
  } else {
    // Demo configuration
    config = {
      accountName: "Rasidul Islam Sajib",
      cookieString: process.env.FB_COOKIE || "",
      groups: [
        {
          groupId: "Evergreen Bangladesh",
          groupName: "Evergreen Bangladesh",
        },
      ],
      postMessage: "ঈদ স্পেশাল প্রিমিয়াম কালেকশন - অর্ডার করতে ইনবক্স করুন।\n\nপ্রিমিয়াম কোয়ালিটির পাঞ্জাবি ও শার্ট কালেকশন এখন বিশেষ ডিসকাউন্টে পাওয়া যাচ্ছে। সরাসরি ক্যাশ অন ডেলিভারি সুবিধা।",
      delaySeconds: 30,
      headless: false, // Visible for demo
    };
  }

  runFacebookGroupBot(config)
    .then((res) => {
      try {
        fs.writeFileSync(
          path.join(__dirname, "last_bot_run.json"),
          JSON.stringify(res, null, 2),
          "utf8"
        );
      } catch (_) {}
      process.exit(res && res.success ? 0 : 1);
    })
    .catch((err) => {
      console.error("Fatal error:", err);
      process.exit(1);
    });
}

module.exports = { runFacebookGroupBot, parseCookies };
