/**
 * BMT 24/7 Live Facebook Messenger & Business Suite Inbox Assistant Bot
 * Now powered by the Customizable AI Product Knowledgebase & Multi-Intent Training Engine!
 * Answers customer questions about Price, Stock Status, Variants/What's Included,
 * Why the Product is Good (Features/Benefits), Warranty, Delivery, Showroom Location,
 * and Order Confirmation in real time on Live Facebook Messenger!
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

const DEFAULT_STORE_PROFILE = {
  storeName: "Test Next Official Store",
  deliveryPolicy: "সারাদেশে ফ্রি ক্যাশ অন হোম ডেলিভারি (প্রোডাক্ট হাতে পেয়ে চেক করে পেমেন্ট করার সুবিধা)",
  deliveryTime: "ঢাকায় ২৪ ঘণ্টা এবং ঢাকার বাইরে ৪৮-৭২ ঘণ্টার মধ্যে হোম ডেলিভারি",
  showroomAddress: "শপ #৪০৮, লেভেল ৪, যমুনা ফিউচার পার্ক, ঢাকা (সকাল ১০টা - রাত ৮টা)",
  helplineNumber: "01700-000000",
  customAiPrompt:
    "সবসময় ভদ্রভাবে কাস্টমারের প্রশ্নের সঠিক উত্তর দেবে এবং অর্ডার কনফার্ম করতে নাম, পূর্ণ ঠিকানা ও মোবাইল নম্বর চাইবে।",
};

const DEFAULT_PRODUCTS = [
  {
    id: "prod-1",
    name: "Premium Smart Watch Ultra",
    keywords: "watch, smart watch, ultra, ঘড়ি, স্মার্ট ওয়াচ, ওয়াচ, ঘড়ি",
    regularPrice: "৩,৯৯০ টাকা",
    offerPrice: "২,৪৯০ টাকা",
    stockStatus: "IN_STOCK",
    stockQuantityText: "হ্যাঁ, আমাদের কাছে পর্যাপ্ত স্টক এভেইলেবল আছে",
    variantsAndContents:
      "কালার: ব্ল্যাক, সিলভার ও টাইটানিয়াম অরেঞ্জ | বক্সে থাকছে: ১টি স্মার্ট ওয়াচ, ২টি প্রিমিয়াম স্ট্র্যাপ (চেইন ও সিলিকন), ওয়্যারলেস ম্যাগনেটিক চার্জার এবং ইউজার ম্যানুয়াল",
    whyGoodFeatures:
      "এতে রয়েছে Super AMOLED HD ডিসপ্লে, ১০০% ওয়াটারপ্রুফ (IP68), সরাসরি ব্লুটুথ কলিং ও মেসেজ নোটিফিকেশন, হার্ট-রেট মনিটর এবং এক চার্জে ৫-৭ দিন দীর্ঘ ব্যাটারি ব্যাকআপ",
    warrantyInfo: "১ বছরের অফিসিয়াল ব্র্যান্ড ওয়ারেন্টি এবং ৭ দিনের ইনস্ট্যান্ট রিপ্লেসমেন্ট গ্যারান্টি",
    isDefaultProduct: true,
  },
];

/**
 * Trained Multi-Intent Product AI Engine
 * Understands queries about:
 * - Product Catalog ("কি কি প্রোডাক্ট আছে?")
 * - Price / Discount ("দাম কত?", "অফার প্রাইজ কত?")
 * - Stock Status ("স্টক আছে নাকি নাই?", "পাওয়া যাবে?")
 * - Variants / Colors / Box Contents ("কি কি কালার আছে?", "বক্সে কি কি থাকবে?")
 * - Why Product is Good / Quality / Features ("কেন ভালো?", "কোয়ালিটি কেমন?", "ফিচার কি?")
 * - Warranty / Guarantee ("ওয়ারেন্টি আছে?")
 * - Delivery / Courier ("ডেলিভারি চার্জ কত?", "কতদিন লাগবে?")
 * - Showroom / Location ("শোরুম কোথায়?")
 * - Order Confirmation (Phone number / Address detection)
 */
function generateTrainedAiResponse(text, customerName, runtime = {}, channelContext = {}) {
  const rawMsg = (text || "").trim();
  const lower = rawMsg.toLowerCase();
  const cleanName = customerName || "স্যার";

  const allProducts =
    Array.isArray(runtime.products) && runtime.products.length > 0
      ? runtime.products
      : DEFAULT_PRODUCTS;

  // Filter products relevant to this specific Page/ID channel (or Global "ALL" products)
  const channelKey = channelContext.key || "";
  const channelId = channelContext.id || "";
  const channelName = (channelContext.name || "").toLowerCase();
  const channelScopedProducts = allProducts.filter((p) => {
    if (!p.assignedChannelKey || p.assignedChannelKey === "ALL") return true;
    return (
      p.assignedChannelKey === channelKey ||
      p.assignedChannelKey.includes(channelId) ||
      (channelName && p.assignedChannelKey.toLowerCase().includes(channelName))
    );
  });
  const products = channelScopedProducts.length > 0 ? channelScopedProducts : allProducts;

  const storeProfile = {
    ...DEFAULT_STORE_PROFILE,
    ...(runtime.storeProfile || {}),
  };
  const templates = Array.isArray(runtime.templates) ? runtime.templates : [];

  // 1. Check if customer provided a phone number (01xxxxxxxxx) to confirm an order
  const phoneMatch = rawMsg.match(/(?:\+?88)?01[3-9]\d{8}/);
  if (phoneMatch) {
    const orderReply = `অসংখ্য ধন্যবাদ ${cleanName}! আপনার মোবাইল নম্বর (${phoneMatch[0]}) ও অর্ডারের তথ্য আমরা পেয়েছি। আমাদের প্রতিনিধি খুব দ্রুত কল করে আপনার অর্ডারটি কনফার্ম করবেন। (${storeProfile.deliveryTime})। জরুরি প্রয়োজনে কল করুন: ${storeProfile.helplineNumber}।`;
    return {
      category: "Sales Conversion",
      suggestions: [orderReply],
    };
  }

  // 2. Match specific product by name or keywords
  let matchedProduct = null;
  for (const prod of products) {
    const nameTokens = [prod.name || ""]
      .concat((prod.keywords || "").split(","))
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k.length >= 2);

    if (nameTokens.some((tok) => lower.includes(tok))) {
      matchedProduct = prod;
      break;
    }
  }

  const primaryProduct =
    matchedProduct || products.find((p) => p.isDefaultProduct) || products[0] || DEFAULT_PRODUCTS[0];

  // 3. Detect all customer intents in the message
  const asksAllProductsCatalog =
    !matchedProduct &&
    products.length > 1 &&
    (lower.includes("কি কি প্রোডাক্ট") ||
      lower.includes("কী কী প্রোডাক্ট") ||
      lower.includes("কি কি পণ্য") ||
      lower.includes("কি কি পাওয়া যায়") ||
      lower.includes("সব প্রোডাক্ট") ||
      lower.includes("ক্যাটালগ") ||
      lower.includes("all product") ||
      lower.includes("catalog") ||
      lower.includes("list"));

  const asksPrice =
    lower.includes("দাম") ||
    lower.includes("মূল্য") ||
    lower.includes("কত") ||
    lower.includes("টাকা") ||
    lower.includes("প্রাইজ") ||
    lower.includes("অফার") ||
    lower.includes("ডিসকাউন্ট") ||
    lower.includes("price") ||
    lower.includes("rate") ||
    lower.includes("cost") ||
    lower.includes("dam") ||
    lower.includes("koto") ||
    lower.includes("pp");

  const asksStock =
    lower.includes("স্টক") ||
    lower.includes("পাওয়া যাবে") ||
    lower.includes("পাওয়া যাবে") ||
    lower.includes("আছে নাকি") ||
    lower.includes("আছে কি") ||
    lower.includes("এভেইলেবল") ||
    lower.includes("নাকি নাই") ||
    lower.includes("stock") ||
    lower.includes("available") ||
    lower.includes("ache");

  const asksVariants =
    lower.includes("কি কি আছে") ||
    lower.includes("কী কী আছে") ||
    lower.includes("কালার") ||
    lower.includes("রঙ") ||
    lower.includes("সাইজ") ||
    lower.includes("বক্সে") ||
    lower.includes("সাথে কি") ||
    lower.includes("ভ্যারিয়েন্ট") ||
    lower.includes("color") ||
    lower.includes("colour") ||
    lower.includes("size") ||
    lower.includes("variant") ||
    lower.includes("ki ki ache");

  const asksWhyGood =
    lower.includes("কেন ভালো") ||
    lower.includes("কেন নিব") ||
    lower.includes("কোয়ালিটি") ||
    lower.includes("কোয়ালিটি") ||
    lower.includes("কেমন") ||
    lower.includes("ফিচার") ||
    lower.includes("সুবিধা") ||
    lower.includes("উপকারিতা") ||
    lower.includes("ভালো হবে") ||
    lower.includes("কাজ কি") ||
    lower.includes("বৈশিষ্ট্য") ||
    lower.includes("quality") ||
    lower.includes("feature") ||
    lower.includes("benefit") ||
    lower.includes("details") ||
    lower.includes("বিস্তারিত") ||
    lower.includes("keno valo") ||
    lower.includes("kemon");

  const asksWarranty =
    lower.includes("ওয়ারেন্টি") ||
    lower.includes("ওয়ারেন্টি") ||
    lower.includes("গ্যারান্টি") ||
    lower.includes("নষ্ট হলে") ||
    lower.includes("রিপ্লেস") ||
    lower.includes("warranty") ||
    lower.includes("guarantee");

  const asksDelivery =
    lower.includes("ডেলিভারি") ||
    lower.includes("চার্জ") ||
    lower.includes("কুরিয়ার") ||
    lower.includes("কুরিয়ার") ||
    lower.includes("কতদিন") ||
    lower.includes("ক্যাশ অন") ||
    lower.includes("delivery") ||
    lower.includes("courier");

  const asksLocation =
    lower.includes("লোকেশন") ||
    lower.includes("শোরুম") ||
    lower.includes("দোকান") ||
    lower.includes("কোথায়") ||
    lower.includes("কোথায়") ||
    lower.includes("অফিস") ||
    lower.includes("location") ||
    lower.includes("showroom") ||
    lower.includes("shop") ||
    lower.includes("address");

  // 4. If customer asks what products are available in the store
  if (asksAllProductsCatalog) {
    const productLines = products
      .map((p, idx) => {
        const stBadge =
          p.stockStatus === "OUT_OF_STOCK"
            ? "(স্টক আউট)"
            : p.stockStatus === "LIMITED_STOCK"
            ? "(সীমিত স্টক)"
            : "(স্টকে আছে)";
        return `${idx + 1}. ${p.name} — অফার প্রাইজ: ${p.offerPrice} ${stBadge}`;
      })
      .join(" | ");
    const catalogReply = `আসসালামু আলাইকুম ${cleanName}! আমাদের বর্তমান প্রোডাক্টসমূহ: ${productLines}। ${storeProfile.deliveryPolicy}। আপনি কোন প্রোডাক্টটি সম্পর্কে বিস্তারিত জানতে বা অর্ডার করতে চান?`;
    return {
      category: "Sales Conversion",
      suggestions: [catalogReply],
    };
  }

  // 5. Handle OUT_OF_STOCK product immediately if customer asks about it
  if (primaryProduct.stockStatus === "OUT_OF_STOCK") {
    const alternative = products.find((p) => p.id !== primaryProduct.id && p.stockStatus !== "OUT_OF_STOCK");
    const outReply = `আসসালামু আলাইকুম ${cleanName}! দুঃখিত, আমাদের "${primaryProduct.name}" প্রোডাক্টটি বর্তমানে স্টক আউট (Out of Stock) রয়েছে।${
      alternative
        ? ` তবে আমাদের "${alternative.name}" বর্তমানে স্টকে আছে (অফার প্রাইজ: ${alternative.offerPrice}, ${alternative.whyGoodFeatures})। আপনি চাইলে এটি অর্ডার করতে পারেন!`
        : ` নতুন স্টক আসা মাত্র আমরা আপনাকে জানাবো। যেকোনো তথ্যের জন্য কল করুন: ${storeProfile.helplineNumber}।`
    }`;
    return {
      category: "Sales Conversion",
      suggestions: [outReply],
    };
  }

  // 6. Compose dynamic response from the trained product fields based on detected intents
  const parts = [`আসসালামু আলাইকুম ${cleanName}!`];
  let category = "Sales Conversion";

  const hasSpecificIntent =
    asksPrice ||
    asksStock ||
    asksVariants ||
    asksWhyGood ||
    asksWarranty ||
    asksDelivery ||
    asksLocation;

  if (asksStock) {
    const stockMsg =
      primaryProduct.stockStatus === "LIMITED_STOCK"
        ? `জি, আমাদের "${primaryProduct.name}" বর্তমানে সীমিত স্টকে (Limited Stock) এভেইলেবল আছে (${primaryProduct.stockQuantityText || "দ্রুত অর্ডার করুন"})।`
        : `জি, আমাদের "${primaryProduct.name}" বর্তমানে স্টকে এভেইলেবল আছে (${primaryProduct.stockQuantityText || "রেডি স্টক"})।`;
    parts.push(stockMsg);
  }

  if (asksPrice) {
    const priceMsg = primaryProduct.regularPrice
      ? `"${primaryProduct.name}"-এর রেগুলার প্রাইজ ${primaryProduct.regularPrice}, তবে বর্তমানে স্পেশাল অফার প্রাইজ মাত্র ${primaryProduct.offerPrice}!`
      : `"${primaryProduct.name}"-এর স্পেশাল অফার প্রাইজ মাত্র ${primaryProduct.offerPrice}!`;
    parts.push(priceMsg);
  }

  if (asksVariants && primaryProduct.variantsAndContents) {
    parts.push(`যা যা থাকছে: ${primaryProduct.variantsAndContents}।`);
  }

  if (asksWhyGood && primaryProduct.whyGoodFeatures) {
    parts.push(`কেন এটি সেরা: ${primaryProduct.whyGoodFeatures}।`);
    category = "Lead Conversion";
  }

  if (asksWarranty && primaryProduct.warrantyInfo) {
    parts.push(`ওয়ারেন্টি সুবিধা: ${primaryProduct.warrantyInfo}।`);
    category = "Lead Conversion";
  }

  if (asksDelivery) {
    parts.push(`ডেলিভারি তথ্য: ${storeProfile.deliveryPolicy} (${storeProfile.deliveryTime})।`);
  }

  if (asksLocation) {
    parts.push(`আমাদের শোরুমের ঠিকানা: ${storeProfile.showroomAddress}। হেল্পলাইন: ${storeProfile.helplineNumber}।`);
    category = "Visit Conversion";
  }

  // If customer sent a general greeting ("হ্যালো", "Hi", "ভাইয়া") or general inquiry without specific keyword
  if (!hasSpecificIntent) {
    parts.push(
      `আমাদের "${primaryProduct.name}" বর্তমানে স্টকে আছে। স্পেশাল অফার প্রাইজ মাত্র ${primaryProduct.offerPrice}${
        primaryProduct.regularPrice ? ` (রেগুলার প্রাইজ ${primaryProduct.regularPrice})` : ""
      }। বিশেষত্ব: ${primaryProduct.whyGoodFeatures}।`
    );
  } else if (!asksDelivery && !asksLocation) {
    // Append concise delivery policy when answering price/stock/features
    parts.push(`${storeProfile.deliveryPolicy}।`);
  }

  if (!asksLocation) {
    parts.push(`অর্ডার কনফার্ম করতে আপনার নাম, পূর্ণ ঠিকানা ও মোবাইল নম্বর দিন।`);
  }

  const primaryReply = parts.join(" ");

  // Secondary suggestion (detailed product overview)
  const secondaryReply = `আসসালামু আলাইকুম ${cleanName}! "${primaryProduct.name}" — অফার মূল্য: ${primaryProduct.offerPrice}। ${primaryProduct.variantsAndContents}। বিশেষ সুবিধা: ${primaryProduct.whyGoodFeatures} (${primaryProduct.warrantyInfo})। অর্ডার করতে নাম, ঠিকানা ও ফোন নম্বর দিন।`;

  const suggestions = [primaryReply, secondaryReply];
  const matchingTpl = templates.find((t) => t.category === category);
  if (matchingTpl && matchingTpl.content && !suggestions.includes(matchingTpl.content)) {
    suggestions.push(matchingTpl.content);
  }

  return {
    category,
    suggestions: suggestions.slice(0, 2),
  };
}

async function sendTextInActiveThread(page, replyText) {
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
    monitoredChannels = [],
    mode: initialMode = "AUTO",
    humanDelaySeconds = 4,
    templates = [],
    products = DEFAULT_PRODUCTS,
    storeProfile = DEFAULT_STORE_PROFILE,
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
    // Preserve existing trained products/storeProfile in runtimeSettingsFile if already saved from UI
    let existingRuntime = {};
    if (fs.existsSync(runtimeSettingsFile)) {
      try {
        existingRuntime = JSON.parse(fs.readFileSync(runtimeSettingsFile, "utf8"));
      } catch (_) {}
    }
    fs.writeFileSync(
      runtimeSettingsFile,
      JSON.stringify(
        {
          mode: initialMode,
          isRunning: true,
          templates:
            Array.isArray(existingRuntime.templates) && existingRuntime.templates.length > 0
              ? existingRuntime.templates
              : templates,
          products:
            Array.isArray(existingRuntime.products) && existingRuntime.products.length > 0
              ? existingRuntime.products
              : products,
          storeProfile: existingRuntime.storeProfile || storeProfile,
          monitoredChannels:
            Array.isArray(monitoredChannels) && monitoredChannels.length > 0
              ? monitoredChannels
              : existingRuntime.monitoredChannels || [],
        },
        null,
        2
      ),
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
    return { mode: initialMode, isRunning: true, templates, products, storeProfile, monitoredChannels };
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
  console.log("💬 BMT 24/7 Live Facebook Messenger AI Inbox Bot (100-Channel Ready)");
  console.log(`📌 Channel Mode: ${sourceType} — ${targetName} (${targetId || "Multi-Channel"})`);
  console.log(`🧠 Trained Products Loaded: ${(products || []).length}`);
  console.log(`🤖 Initial Mode: ${initialMode} | 24/7 Continuous Active Monitoring`);
  console.log("==========================================================\n");

  const autoRepliedSignatures = new Set();
  const lastBotRepliesByCustomer = new Map();
  const conversationsByChannel = new Map();
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

  const baseCookies = parseCookies(cookieString);
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

  async function applyChannelSessionCookies(channelObj) {
    const channelCookies =
      channelObj && channelObj.cookieString
        ? parseCookies(channelObj.cookieString)
        : baseCookies;

    const chanId = channelObj && channelObj.id ? String(channelObj.id).trim() : "";
    const isNumericPage = channelObj && channelObj.sourceType === "Page" && /^\d+$/.test(chanId);

    // Clear old i_user cookie first so Personal ID or new Page takes effect cleanly
    try {
      await page.deleteCookie({ name: "i_user", domain: ".facebook.com", path: "/" });
    } catch (_) {}

    const filteredCookies = channelCookies.filter((c) => c.name !== "i_user");
    if (isNumericPage) {
      filteredCookies.push({
        name: "i_user",
        value: chanId,
        domain: ".facebook.com",
        path: "/",
        httpOnly: false,
        secure: true,
        sameSite: "Lax",
      });
    }
    if (filteredCookies.length > 0) {
      await page.setCookie(...filteredCookies);
    }
  }

  // Initial channel setup
  let currentActiveChannel = {
    key: `${sourceType}::${targetId}::${targetName}`,
    sourceType: sourceType === "ALL" ? "Page" : sourceType,
    id: sourceType === "ALL" ? "61595136714776" : targetId,
    name: sourceType === "ALL" ? "Test Next" : targetName,
  };

  await applyChannelSessionCookies(currentActiveChannel);

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
      const trainedProductCount = Array.isArray(runtime.products) ? runtime.products.length : 1;

      // Multi-channel rotation when sourceType === "ALL"
      if (sourceType === "ALL") {
        const rawList = Array.isArray(runtime.monitoredChannels) && runtime.monitoredChannels.length > 0
          ? runtime.monitoredChannels
          : monitoredChannels;
        // Filter channels that have either a real numeric Page ID or Personal ID
        const rotatableChannels = rawList.filter(
          (ch) =>
            ch &&
            ch.enabled !== false &&
            (ch.sourceType === "Personal ID" || (ch.sourceType === "Page" && /^\d+$/.test(String(ch.id || "").trim())))
        );

        if (rotatableChannels.length > 0) {
          const nextChan = rotatableChannels[(check - 1) % rotatableChannels.length];
          if (nextChan && (nextChan.id !== currentActiveChannel.id || nextChan.sourceType !== currentActiveChannel.sourceType)) {
            console.log(
              `\n🔄 [100-Channel Multi-Bot Rotation] Switching active Messenger Inbox to: ${nextChan.sourceType} — "${nextChan.name}" (${nextChan.id})`
            );
            currentActiveChannel = nextChan;
            await applyChannelSessionCookies(currentActiveChannel);
            try {
              await page.goto(inboxUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
              await sleep(5500);
            } catch (rotErr) {
              console.warn("Channel rotation navigation warning:", rotErr.message);
            }
          }
        }
      }

      const activeChanName = currentActiveChannel.name || targetName;
      const activeChanSource = currentActiveChannel.sourceType || sourceType;

      console.log(
        `\n🔍 [24/7 Inbox Scan #${check}] Active Channel: ${activeChanName} (${
          sourceType === "ALL" ? "Multi-Channel 24/7 Rotation" : activeChanSource
        }) | Mode: ${currentMode} | Trained Products: ${trainedProductCount}`
      );

      // 1. Process any manual / approved replies queued from the UI
      const queuedReplies = popPendingReplies();
      for (const qItem of queuedReplies) {
        if (!qItem || !qItem.replyText) continue;
        console.log(
          `📤 [MANUAL/APPROVED REPLY] Sending to "${qItem.customerName}": "${qItem.replyText.slice(0, 60)}..."`
        );
        try {
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
          lastBotRepliesByCustomer.set((qItem.customerName || "").toLowerCase(), qItem.replyText.slice(0, 40));
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
              /^you:\s*/i.test(previewLine) || /^আপনি:\s*/i.test(previewLine);

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

      console.log(`📊 Found ${scannedThreads.length} live Messenger conversation(s) on "${activeChanName}".`);

      const updatedConversations = [];

      for (let i = 0; i < scannedThreads.length; i++) {
        const th = scannedThreads[i];
        const lowerCustomer = th.customerName.toLowerCase();
        const customerChanKey = `${activeChanName.toLowerCase()}:::${lowerCustomer}`;
        const lastBotSnippet =
          lastBotRepliesByCustomer.get(customerChanKey) || lastBotRepliesByCustomer.get(lowerCustomer);

        let isReplied =
          th.isRepliedByPage ||
          Boolean(lastBotSnippet && th.cleanPreview.startsWith(lastBotSnippet.slice(0, 25)));

        const aiResult = generateTrainedAiResponse(
          th.cleanPreview,
          th.customerName,
          runtime,
          currentActiveChannel
        );
        const chanSlug = activeChanName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const convId = `fb-live-${chanSlug}-${lowerCustomer.replace(/[^a-z0-9]+/g, "-")}`;

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
            text: "প্রোডাক্ট সম্পর্কে বিস্তারিত জানতে চাই",
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

        // 3. If AUTO mode is active and this customer is WAITING_REPLY, send trained AI auto-reply!
        const sig = `${activeChanName.toLowerCase()}:::${lowerCustomer}:::${th.cleanPreview.slice(0, 60).toLowerCase()}`;
        if (isRunning && currentMode === "AUTO" && !isReplied && !autoRepliedSignatures.has(sig)) {
          const autoReplyText = aiResult.suggestions[0];
          console.log(
            `\n🤖 [TRAINED AI AUTO-REPLY | ${activeChanName}] Customer "${th.customerName}" asked: "${th.cleanPreview}"`
          );
          console.log(`   💡 AI Answer: "${autoReplyText}"`);
          console.log(`   ⏳ Applying human-like delay (${Math.min(humanDelaySeconds, 6)}s)...`);
          await sleep(Math.min(humanDelaySeconds, 6) * 1000);

          try {
            await page.mouse.click(th.x, th.y);
            await sleep(2000);
            await sendTextInActiveThread(page, autoReplyText);

            autoRepliedSignatures.add(sig);
            lastBotRepliesByCustomer.set(customerChanKey, autoReplyText.slice(0, 40));
            lastBotRepliesByCustomer.set(lowerCustomer, autoReplyText.slice(0, 40));
            totalAutoRepliesSent++;
            isReplied = true;
            lastText = autoReplyText;
            messages.push({
              id: `${convId}-auto-${Date.now()}`,
              sender: "AI_ASSISTANT",
              text: autoReplyText,
              timestamp: "Just now (Live AI Sent)",
              status: "SENT",
              graphApiStatus: "SUCCESS_200",
            });
            console.log(
              `   ✅ [SUCCESS] Trained AI reply sent to ${th.customerName} on "${activeChanName}" Live Messenger!`
            );
          } catch (autoErr) {
            console.warn(`   ⚠️ Auto-reply error for ${th.customerName}: ${autoErr.message}`);
          }
        }

        updatedConversations.push({
          id: convId,
          customerName: th.customerName,
          pageName: activeChanName,
          platform: activeChanSource === "Page" ? "Facebook Page" : "Messenger",
          category: aiResult.category,
          unreadCount: isReplied ? 0 : 1,
          lastMessageText: lastText,
          lastMessageTime: th.lastMessageTime,
          status: isReplied ? "REPLIED" : "WAITING_REPLY",
          aiSuggestions: aiResult.suggestions,
          messages,
        });
      }

      if (updatedConversations.length > 0) {
        conversationsByChannel.set(activeChanName, updatedConversations);
        const merged = [];
        for (const list of conversationsByChannel.values()) {
          merged.push(...list);
        }
        liveConversations = merged;
      }

      updateStatus({
        status: "WATCHING",
        sourceType,
        targetId,
        targetName: sourceType === "ALL" ? `All Active Channels (Now: ${activeChanName})` : activeChanName,
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
