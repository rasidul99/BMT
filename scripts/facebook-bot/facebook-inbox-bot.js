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
 * Helper to extract a friendly Bangladeshi human address ("ভাইয়া" / "আপু" or "<FirstName> ভাইয়া")
 * Real humans in Messenger never repeat the full 3-word Facebook profile name on every message!
 */
function getHumanAddress(customerName) {
  const raw = (customerName || "").trim();
  const lower = raw.toLowerCase();
  const femaleHints = [
    "akter",
    "begum",
    "khatun",
    "jahan",
    "sultana",
    "parvin",
    "nusrat",
    "farzana",
    "tania",
    "sadia",
    "mim",
    "sumaiya",
    "jannat",
    "fatema",
    "sharmin",
    "tasnim",
    "rubina",
    "salma",
    "mst",
    "আক্তার",
    "বেগম",
    "খাতুন",
    "জাহান",
    "সুলতানা",
    "নুসরাত",
    "ফারজানা",
    "তানিয়া",
    "সাদিয়া",
    "মিম",
    "সুমাইয়া",
    "জান্নাত",
    "ফাতেমা",
  ];
  const isFemale = femaleHints.some((h) => lower.includes(h));
  const honorific = isFemale ? "আপু" : "ভাইয়া";

  const tokens = raw
    .split(/\s+/)
    .map((t) => t.replace(/[^a-zA-Z\u0980-\u09FF]/g, ""))
    .filter((t) => t.length >= 2 && !/^(md|mst|mohammad|muhammad|al|sk|sheikh)$/i.test(t));

  const shortName = tokens[0] || "";
  return {
    honorific,
    shortName,
    firstTurnAddress: shortName ? `${shortName} ${honorific}` : honorific,
  };
}

function toBanglaDigits(num) {
  const map = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/\d/g, (d) => map[Number(d)] || d);
}

function buildStoreProductListStatement(products, honorific) {
  const inStockList = products.filter((p) => p.stockStatus !== "OUT_OF_STOCK");
  const list = inStockList.length > 0 ? inStockList : products;

  if (list.length === 1) {
    const p = list[0];
    return `আমাদের কাছে একটি প্রোডাক্ট আছে — "${p.name}" (অফার প্রাইজ: ${p.offerPrice}${
      p.regularPrice ? `, রেগুলার প্রাইজ: ${p.regularPrice}` : ""
    })। আপনি কি এটি নিতে চান ${honorific}?`;
  }

  const numberedItems = list
    .map((p, idx) => `${toBanglaDigits(idx + 1)}. ${p.name} (অফার প্রাইজ: ${p.offerPrice})`)
    .join(" ");
  return `আমাদের কাছে ${toBanglaDigits(list.length)}টি প্রোডাক্ট আছে — ${numberedItems}। আপনি কোনটা নিতে চান ${honorific}?`;
}

function extractUnmatchedProductQuery(rawMsg) {
  const asksAvailability =
    /\b(ache|ase|acche|asce|pawa|paoya|available|thakbe|thake|bikri|sell|আছে|পাওয়া|পাওয়া|থাকবে|থাকে|বিক্রি)\b/i.test(
      rawMsg
    );
  if (!asksAvailability) return null;

  const fillerWords = new Set([
    "apnader", "apnar", "tomader", "toder", "amader", "kache", "kacche", "kase", "kashe",
    "ki", "ke", "kono", "kon", "r", "ar", "aro", "o", "ba", "ebong",
    "ache", "ase", "acche", "asce", "pawa", "paoya", "jabe", "jay", "jai", "thakbe", "thake",
    "naki", "na", "nai", "nei", "ni", "hobe", "hoy", "koren", "korben", "bikri", "sell",
    "vai", "vaia", "vaiya", "bhaiya", "bhai", "apu", "apuni", "sir", "bro", "brother", "boss",
    "hi", "hello", "hlw", "hey", "salam", "assalamu", "alaikum", "slm",
    "eta", "eita", "ei", "ota", "oita", "oi", "ta", "ti", "gulo", "gula", "tar", "tir",
    "product", "products", "item", "jinish", "mal", "stock", "available", "ready",
    "original", "real", "valo", "kom", "dam", "price", "koto", "taka", "tk", "offer", "discount",
    "delivery", "charge", "courier", "cash", "on", "advance", "warranty", "guarantee",
    "color", "colour", "size", "variant", "box", "boxe", "sathe", "strap", "belt", "waterproof", "battery",
    "ekhon", "ajke", "kalke", "order", "dile", "korle", "kobe", "kokhon", "pabo", "diben",
    "chutto", "choto", "boro", "baccha", "bacchara", "kids", "baby", "meye", "meyera", "chele", "chelera",
    "use", "korte", "porte", "parbe", "parbo", "fit", "hat", "hate", "gift", "chobi", "pic", "photo", "video",
    "showroom", "dokan", "office", "location", "address", "kothay",
    "আপনাদের", "আপনার", "তোমাদের", "কাছে", "কি", "কী", "কোনো", "কোন", "আর", "আরো",
    "আছে", "পাওয়া", "পাওয়া", "যাবে", "যায়", "যায়", "থাকবে", "থাকে", "নাকি", "না", "নেই", "নাই",
    "ভাইয়া", "ভাইয়া", "ভাই", "আপু", "স্যার", "হ্যালো", "হাই", "সালাম", "আসসালামু", "আলাইকুম",
    "এটা", "এইটা", "এই", "ওটা", "ওইটা", "টা", "টি", "গুলো", "প্রোডাক্ট", "পণ্য", "আইটেম", "স্টক", "স্টকে", "এভেইলেবল", "রেডি",
    "দাম", "মূল্য", "কত", "টাকা", "প্রাইজ", "অফার", "ডিসকাউন্ট", "ডেলিভারি", "চার্জ", "ওয়ারেন্টি", "ওয়ারেন্টি", "গ্যারান্টি",
    "কালার", "রঙ", "সাইজ", "বক্স", "বক্সে", "সাথে", "বেল্ট", "স্ট্র্যাপ", "বিক্রি", "করেন", "ছবি", "ভিডিও", "শোরুম", "দোকান", "কোথায়", "কোথায়"
  ]);

  const tokens = (rawMsg || "")
    .replace(/[?!.,।'"()[\]{}:;]+/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !fillerWords.has(t.toLowerCase()));

  if (tokens.length === 0 || tokens.length > 4) return null;
  const candidate = tokens.join(" ");
  if (candidate.length < 2 || candidate.length > 35) return null;
  return candidate;
}

/**
 * Context-Aware, Humanized Multi-Intent Conversational AI Engine (Banglish + Bangla + English)
 * - Remembers the full conversation history (`conversationHistory`)
 * - Greets ONLY on the first turn (or when customer says Salam/Hello), never repeating "আসসালামু আলাইকুম <Full Name>!" on follow-up questions
 * - Remembers which product was discussed earlier in the chat when the customer asks follow-up questions
 * - Detects when a customer asks for an item NOT in our store (e.g. "apnader kache ki 7up ache?") and replies:
 *   "না ভাইয়া, আমাদের কাছে 7up নেই। আমাদের কাছে ... আছে।"
 * - Detects when a customer asks what products we have ("apnader kacche r ki ki ache?") and lists 1 or N products clearly asking which one they want.
 */
function generateTrainedAiResponse(text, customerName, runtime = {}, channelContext = {}, conversationHistory = []) {
  const rawMsg = (text || "").trim();
  const lower = rawMsg.toLowerCase();
  const { honorific, firstTurnAddress } = getHumanAddress(customerName);

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

  // Analyze conversation history for context awareness
  const historyList = Array.isArray(conversationHistory) ? conversationHistory : [];
  let lastCustomerStartIdx = historyList.length;
  for (let i = historyList.length - 1; i >= 0; i--) {
    if (historyList[i].sender === "CUSTOMER") {
      lastCustomerStartIdx = i;
    } else if (lastCustomerStartIdx < historyList.length) {
      break;
    }
  }
  const priorMessages = historyList.slice(0, lastCustomerStartIdx);
  const allAiMessages = historyList.filter((m) => m.sender === "AI_ASSISTANT" || m.sender === "PAGE");
  const priorAiMessages = priorMessages.filter((m) => m.sender === "AI_ASSISTANT" || m.sender === "PAGE");
  const hasAlreadyGreeted = allAiMessages.length > 0;
  const turnIndex = Math.max(priorAiMessages.length, allAiMessages.length);
  const lastAiText = priorAiMessages.length > 0 ? priorAiMessages[priorAiMessages.length - 1].text || "" : "";
  const recentlyAskedOrderInfo =
    lastAiText.includes("নাম, পূর্ণ ঠিকানা") ||
    lastAiText.includes("নাম, ঠিকানা ও মোবাইল") ||
    lastAiText.includes("মোবাইল নম্বর");
  const alreadyMentionedPrice = priorAiMessages.some(
    (m) => (m.text || "").includes("টাকা") || (m.text || "").includes("প্রাইজ")
  );

  const followUpOpeners = [
    `জি ${honorific},`,
    `হ্যাঁ ${honorific},`,
    `অবশ্যই ${honorific},`,
    `${honorific},`,
  ];
  const naturalOpener = hasAlreadyGreeted
    ? followUpOpeners[turnIndex % followUpOpeners.length]
    : `আসসালামু আলাইকুম ${firstTurnAddress}!`;

  // 1. Check if customer provided a Bangladeshi phone number (01xxxxxxxxx) to confirm an order
  const phoneMatch = rawMsg.match(/(?:\+?88)?01[3-9]\d{8}/);
  if (phoneMatch) {
    const orderReply = `অসংখ্য ধন্যবাদ ${firstTurnAddress}! আপনার মোবাইল নম্বর (${phoneMatch[0]}) ও অর্ডারের তথ্য আমরা নোট করে নিয়েছি। আমাদের প্রতিনিধি খুব দ্রুত কল করে অর্ডারটি কনফার্ম করবেন। (${storeProfile.deliveryTime})। 😊`;
    return {
      category: "Sales Conversion",
      suggestions: [orderReply],
    };
  }

  // 2. Match product from current message OR remember from earlier messages in the conversation!
  function findProductInText(searchStr) {
    const sLower = (searchStr || "").toLowerCase();
    for (const prod of products) {
      const nameTokens = [prod.name || ""]
        .concat((prod.keywords || "").split(","))
        .map((k) => k.trim().toLowerCase())
        .filter((k) => k.length >= 2);
      if (nameTokens.some((tok) => sLower.includes(tok))) {
        return prod;
      }
    }
    return null;
  }

  const matchedInCurrentMsg = findProductInText(rawMsg);
  let matchedProduct = matchedInCurrentMsg;
  if (!matchedProduct && historyList.length > 0) {
    for (let i = historyList.length - 1; i >= 0; i--) {
      const found = findProductInText(historyList[i].text || "");
      if (found) {
        matchedProduct = found;
        break;
      }
    }
  }

  const primaryProduct =
    matchedProduct || products.find((p) => p.isDefaultProduct) || products[0] || DEFAULT_PRODUCTS[0];

  // Check if customer selected a numbered product from our catalog list ("1", "2", "১", "২", "প্রথমটা", "দ্বিতীয়টা")
  const numberSelectionMatch = rawMsg.match(
    /^(?:([1-9])|([১-৯])|(প্রথমটা|প্রথম|first)|(দ্বিতীয়টা|দ্বিতীয়টা|second)|(তৃতীয়টা|তৃতীয়টা|third))(?:\s*(?:number|নম্বর|নাম্বার)?(?:\s*ta|\s*টা)?)?\s*[.?!]*$/i
  );
  if (numberSelectionMatch) {
    let idx = 0;
    if (numberSelectionMatch[1]) idx = parseInt(numberSelectionMatch[1], 10) - 1;
    else if (numberSelectionMatch[2]) idx = "১২৩৪৫৬৭৮৯".indexOf(numberSelectionMatch[2]);
    else if (numberSelectionMatch[3]) idx = 0;
    else if (numberSelectionMatch[4]) idx = 1;
    else if (numberSelectionMatch[5]) idx = 2;

    const chosenProd = products[idx];
    if (chosenProd) {
      const chosenReply = `দারুণ পছন্দ ${honorific}! আমাদের "${chosenProd.name}"-এর স্পেশাল অফার প্রাইজ মাত্র ${chosenProd.offerPrice}${
        chosenProd.regularPrice ? ` (রেগুলার প্রাইজ ${chosenProd.regularPrice})` : ""
      }। বিশেষত্ব: ${chosenProd.whyGoodFeatures}। অর্ডারটি কনফার্ম করতে আপনার নাম, পূর্ণ ঠিকানা ও মোবাইল নম্বরটি দিন প্লিজ। 😊`;
      return {
        category: "Sales Conversion",
        suggestions: [chosenReply],
      };
    }
  }

  // 3. Comprehensive Banglish + Bangla + English Conversational Intent Detection
  const hasSalam =
    /\b(salam|assalamu|slm|সালাম|আসসালামু)\b/i.test(lower);
  const isPureGreeting =
    /^(hi+|hello+|hlw+|hey+|salam|assalamu alaikum|slm|হাই|হ্যালো|সালাম|আসসালামু আলাইকুম|ভাইয়া|ভাইয়া|ভাই|কেউ আছেন|আছেন)\s*[?!.]*$/i.test(
      rawMsg
    );
  const isPureAck =
    /^(ok+|okay|accha|acha|hmm+|hm+|thanks|thank you|tnx|dhonnobad|আচ্ছা|ঠিক আছে|ওকে|হুম|ধন্যবাদ|পরে জানাবো|দেখি)\s*[?!.👍😊]*$/i.test(
      rawMsg
    );

  const mentionsBoxOrColorWords =
    /\b(box|বক্স|বক্সে|sathe|সাথে|color|colour|কালার|রঙ|strap|belt|বেল্ট|স্ট্র্যাপ|size|সাইজ)\b/i.test(lower);

  const asksAllProductsCatalog =
    !matchedInCurrentMsg &&
    (lower.includes("কি কি প্রোডাক্ট") ||
      lower.includes("কী কী প্রোডাক্ট") ||
      lower.includes("কি কি পণ্য") ||
      lower.includes("কি কি পাওয়া যায়") ||
      lower.includes("কি কি পাওয়া যায়") ||
      lower.includes("সব প্রোডাক্ট") ||
      lower.includes("ক্যাটালগ") ||
      lower.includes("আর কি কি") ||
      lower.includes("আর কী কী") ||
      lower.includes("আর কি আছে") ||
      lower.includes("আপনাদের কাছে কি") ||
      lower.includes("আপনাদের কাছে কী") ||
      lower.includes("কয়টা প্রোডাক্ট") ||
      lower.includes("ki ki product") ||
      lower.includes("koyta product") ||
      lower.includes("r ki ki") ||
      lower.includes("ar ki ki") ||
      lower.includes("r ki ache") ||
      lower.includes("ar ki ache") ||
      lower.includes("r ki ase") ||
      lower.includes("ar ki ase") ||
      lower.includes("ki ki pawa jay") ||
      lower.includes("all product") ||
      lower.includes("catalog") ||
      (!mentionsBoxOrColorWords &&
        (lower.includes("ki ki ache") ||
          lower.includes("ki ki ase") ||
          lower.includes("কি কি আছে") ||
          lower.includes("কী কী আছে"))));

  // Delivery Timing ("ekhon order dile kobe pabo?", "koto din lagbe?", "kokhon pabo?", "ajke dile kal pabo?")
  const asksDeliveryTime =
    lower.includes("kobe pabo") ||
    lower.includes("kokhon pabo") ||
    lower.includes("kobe diben") ||
    lower.includes("koto din") ||
    lower.includes("kotodin") ||
    lower.includes("order dile kobe") ||
    lower.includes("ajke dile") ||
    lower.includes("kal pabo") ||
    lower.includes("time koto") ||
    lower.includes("কবে পাব") ||
    lower.includes("কখন পাব") ||
    lower.includes("কতদিন") ||
    lower.includes("কত দিন") ||
    lower.includes("আজকে অর্ডার") ||
    lower.includes("কালকে পাব");

  // Delivery Charge / Advance / Cash on Delivery ("delivery charge koto", "advance dite hobe naki", "bkash", "check kore")
  const asksDeliveryOrPayment =
    lower.includes("ডেলিভারি") ||
    lower.includes("চার্জ") ||
    lower.includes("কুরিয়ার") ||
    lower.includes("কুরিয়ার") ||
    lower.includes("ক্যাশ অন") ||
    lower.includes("অগ্রিম") ||
    lower.includes("এডভান্স") ||
    lower.includes("চেক করে") ||
    lower.includes("delivery") ||
    lower.includes("courier") ||
    lower.includes("charge") ||
    lower.includes("advance") ||
    lower.includes("adv ") ||
    lower.includes("bkash") ||
    lower.includes("nagad") ||
    lower.includes("cash on") ||
    lower.includes("age taka") ||
    lower.includes("check kore");

  // Suitability / Kids / Age / Gender / Wrist Fit / Gift ("eta ki chutto bacchara use korte parbe?", "meyera porte parbe?", "hat e fit hobe?")
  const asksSuitabilityKids =
    lower.includes("baccha") ||
    lower.includes("chutto") ||
    lower.includes("choto") ||
    lower.includes("kids") ||
    lower.includes("baby") ||
    lower.includes("boyos") ||
    lower.includes("বাচ্চা") ||
    lower.includes("ছোট") ||
    lower.includes("বয়স");

  const asksSuitabilityGeneral =
    asksSuitabilityKids ||
    lower.includes("use korte parbe") ||
    lower.includes("use kora jabe") ||
    lower.includes("porte parbe") ||
    lower.includes("pora jabe") ||
    lower.includes("hat e") ||
    lower.includes("hate fit") ||
    lower.includes("meye") ||
    lower.includes("chele") ||
    lower.includes("gift") ||
    lower.includes("ইউজ করতে পারবে") ||
    lower.includes("ব্যবহার করতে পারবে") ||
    lower.includes("পরতে পারবে") ||
    lower.includes("হাতে ফিট") ||
    lower.includes("মেয়েরা") ||
    lower.includes("ছেলেরা") ||
    lower.includes("গিফট");

  // Bargaining / Discount ("kom rakhen", "komaia rakhen", "discount den", "kom hobe")
  const asksBargain =
    lower.includes("kom rakhen") ||
    lower.includes("komaia") ||
    lower.includes("komano") ||
    lower.includes("kom hobe") ||
    lower.includes("koto rakhben") ||
    lower.includes("last price") ||
    lower.includes("fixed price") ||
    lower.includes("discount") ||
    lower.includes("কম রাখেন") ||
    lower.includes("কমান") ||
    lower.includes("কম হবে") ||
    lower.includes("ডিসকাউন্ট") ||
    lower.includes("লাস্ট প্রাইজ");

  // Price Inquiry ("dam koto", "price koto", "koto taka", "pp")
  const asksPrice =
    asksBargain ||
    lower.includes("দাম") ||
    lower.includes("মূল্য") ||
    lower.includes("কত টাকা") ||
    lower.includes("প্রাইজ") ||
    lower.includes("অফার") ||
    lower.includes("price") ||
    lower.includes("rate") ||
    lower.includes("cost") ||
    lower.includes("dam") ||
    lower.includes("taka") ||
    /\b(koto|pp)\b/i.test(lower);

  // Stock / Availability ("eta ki ache?", "stock ache?", "pawa jabe?")
  const asksStock =
    lower.includes("স্টক") ||
    lower.includes("পাওয়া যাবে") ||
    lower.includes("পাওয়া যাবে") ||
    lower.includes("আছে নাকি") ||
    lower.includes("আছে কি") ||
    lower.includes("এটা কি আছে") ||
    lower.includes("এভেইলেবল") ||
    lower.includes("নাকি নাই") ||
    lower.includes("stock") ||
    lower.includes("available") ||
    lower.includes("pawa jabe") ||
    /\b(ache|ase)\b/i.test(lower);

  // Variants / Colors / Box Contents / Straps ("color ki ki", "strap", "belt", "box e ki thakbe")
  const asksVariants =
    !asksAllProductsCatalog &&
    (lower.includes("কালার") ||
      lower.includes("রঙ") ||
      lower.includes("সাইজ") ||
      lower.includes("বক্সে") ||
      lower.includes("সাথে কি") ||
      lower.includes("ভ্যারিয়েন্ট") ||
      lower.includes("বেল্ট") ||
      lower.includes("স্ট্র্যাপ") ||
      lower.includes("color") ||
      lower.includes("colour") ||
      lower.includes("size") ||
      lower.includes("variant") ||
      lower.includes("strap") ||
      lower.includes("belt") ||
      lower.includes("box") ||
      lower.includes("sathe ki"));

  // Specific Feature Questions (Waterproof, Battery, Calling/Phone connection, Quality)
  const asksWaterproof =
    lower.includes("waterproof") ||
    lower.includes("water") ||
    lower.includes("pani") ||
    lower.includes("vije") ||
    lower.includes("ওয়াটারপ্রুফ") ||
    lower.includes("পানি") ||
    lower.includes("ভিজে");

  const asksBattery =
    lower.includes("battery") ||
    lower.includes("charge") ||
    lower.includes("backup") ||
    lower.includes("ব্যাটারি") ||
    lower.includes("চার্জ") ||
    lower.includes("ব্যাকআপ");

  const asksCallingOrConnect =
    lower.includes("call") ||
    lower.includes("kotha bola") ||
    lower.includes("bluetooth") ||
    lower.includes("connect") ||
    lower.includes("android") ||
    lower.includes("iphone") ||
    lower.includes("কল করা") ||
    lower.includes("কথা বলা") ||
    lower.includes("কানেক্ট");

  const asksWhyGood =
    asksWaterproof ||
    asksBattery ||
    asksCallingOrConnect ||
    lower.includes("কেন ভালো") ||
    lower.includes("কেন নিব") ||
    lower.includes("কোয়ালিটি") ||
    lower.includes("কোয়ালিটি") ||
    lower.includes("কেমন") ||
    lower.includes("ফিচার") ||
    lower.includes("সুবিধা") ||
    lower.includes("ভালো হবে") ||
    lower.includes("কাজ কি") ||
    lower.includes("বৈশিষ্ট্য") ||
    lower.includes("অরিজিনাল") ||
    lower.includes("টেকসই") ||
    lower.includes("quality") ||
    lower.includes("feature") ||
    lower.includes("benefit") ||
    lower.includes("details") ||
    lower.includes("original") ||
    lower.includes("valo hobe") ||
    lower.includes("tikbe") ||
    lower.includes("বিস্তারিত") ||
    lower.includes("keno valo") ||
    lower.includes("kemon");

  const asksWarranty =
    lower.includes("ওয়ারেন্টি") ||
    lower.includes("ওয়ারেন্টি") ||
    lower.includes("গ্যারান্টি") ||
    lower.includes("নষ্ট হলে") ||
    lower.includes("রিপ্লেস") ||
    lower.includes("সমস্যা হলে") ||
    lower.includes("warranty") ||
    lower.includes("guarantee") ||
    lower.includes("nosto hole") ||
    lower.includes("replace");

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
    lower.includes("dokan") ||
    lower.includes("office") ||
    lower.includes("kothay") ||
    lower.includes("address");

  const asksPhotoOrVideo =
    lower.includes("chobi") ||
    lower.includes("pic") ||
    lower.includes("photo") ||
    lower.includes("video") ||
    lower.includes("ছবি") ||
    lower.includes("পিক") ||
    lower.includes("ভিডিও");

  const asksHowToOrder =
    lower.includes("order korbo") ||
    lower.includes("kivabe nibo") ||
    lower.includes("kivabe order") ||
    lower.includes("nite chai") ||
    lower.includes("order dibo") ||
    lower.includes("নিতে চাই") ||
    lower.includes("অর্ডার করবো") ||
    lower.includes("অর্ডার করতে চাই") ||
    lower.includes("কিভাবে নিব") ||
    lower.includes("কিভাবে অর্ডার");

  const mentionsCustomerArea =
    /\b(dhaka|dhakay|mirpur|uttara|dhanmondi|mohammadpur|banani|gulshan|badda|jatrabari|savar|gazipur|narayanganj|chittagong|ctg|sylhet|rajshahi|khulna|barisal|rangpur|comilla|cumilla|bogra|mymensingh|ঢাকা|ঢাকায়|মিরপুর|উত্তরা|ধানমন্ডি|চট্টগ্রাম|সিলেট|রাজশাহী|খুলনা|গাজীপুর|নারায়ণগঞ্জ)\b/i.test(
      lower
    );

  // Human Conversational Intents: Declining / Postponing ("ekhon nibo na", "pore nibo", "lagbe na", "taka nai")
  const asksDeclineOrLater =
    lower.includes("nibo na") ||
    lower.includes("nebo na") ||
    lower.includes("lagbe na") ||
    lower.includes("chai na") ||
    lower.includes("order korbo na") ||
    lower.includes("pore nibo") ||
    lower.includes("pore nebo") ||
    lower.includes("pore janabo") ||
    lower.includes("chinta kore") ||
    lower.includes("vebe dekhi") ||
    lower.includes("taka nai") ||
    lower.includes("budget nai") ||
    lower.includes("samner mashe") ||
    lower.includes("নিবো না") ||
    lower.includes("নেবো না") ||
    lower.includes("লাগবে না") ||
    lower.includes("চাই না") ||
    lower.includes("পরে নিব") ||
    lower.includes("পরে জানাব") ||
    lower.includes("টাকা নেই") ||
    lower.includes("বাজেট নেই");

  // Human Conversational Intents: Asking if AI / Bot / Robot / Who is speaking ("tumi ki AI", "bot naki", "apni ke")
  const asksIfAiOrBot =
    /\b(ai|bot|robot|chatgpt|gpt|machine|auto\s*reply)\b/i.test(lower) ||
    lower.includes("tumi ke") ||
    lower.includes("apni ke") ||
    lower.includes("manush naki") ||
    lower.includes("apnar nam") ||
    lower.includes("tomar nam") ||
    lower.includes("tumar nam") ||
    lower.includes("ke bolchen") ||
    lower.includes("তুমি কি এআই") ||
    lower.includes("রোবট") ||
    lower.includes("বট নাকি") ||
    lower.includes("মানুষ নাকি") ||
    lower.includes("আপনি কে") ||
    lower.includes("আপনার নাম");

  // Human Conversational Intents: Small talk / Well-being ("kemon achen", "ki khobor")
  const asksWellBeing =
    lower.includes("kemon achen") ||
    lower.includes("kemon asen") ||
    lower.includes("kemon aso") ||
    lower.includes("ki khobor") ||
    lower.includes("ki obostha") ||
    lower.includes("khabar kheyechen") ||
    lower.includes("কেমন আছেন") ||
    lower.includes("কি খবর") ||
    lower.includes("কী খবর");

  // 4. Handle Pure Greeting ("Hi", "Hello", "Assalamu Alaikum", "ভাইয়া")
  if (isPureGreeting) {
    const reply = hasSalam
      ? `ওয়ালাইকুম আসসালাম ${firstTurnAddress}! কেমন আছেন? জি বলুন, আপনাকে কীভাবে সহযোগিতা করতে পারি? 😊`
      : `হ্যালো ${firstTurnAddress}! কেমন আছেন? জি বলুন, আমাদের কোন প্রোডাক্টটি সম্পর্কে জানতে চাচ্ছেন? 😊`;
    return {
      category: "Lead Conversion",
      suggestions: [reply],
      needsLlmBrain: false,
    };
  }

  // 4b. Handle Declining / Postponing ("ekhon nibo na", "pore nibo", "lagbe na")
  if (asksDeclineOrLater) {
    const reply = `আচ্ছা ${honorific}, কোনো সমস্যা নেই! 😊 আপনার যখন সুবিধা হয় বা প্রয়োজন পড়ে, তখনই আমাদের নক দিয়েন। ভালো থাকবেন!`;
    return {
      category: "Lead Conversion",
      suggestions: [reply],
      needsLlmBrain: false,
    };
  }

  // 4c. Handle "tumi ki AI" / "bot naki" / "apni ke"
  if (asksIfAiOrBot) {
    const reply = `না ${honorific}, আমি পেজের কাস্টমার সাপোর্ট মডারেটর বলছি! 😊 আপনার মেসেজের দ্রুত রিপ্লাই দেওয়ার চেষ্টা করছি। কোনো বিষয়ে জানার থাকলে নির্দ্বিধায় বলতে পারেন ${honorific}।`;
    return {
      category: "Lead Conversion",
      suggestions: [reply],
      needsLlmBrain: false,
    };
  }

  // 4d. Handle Small Talk ("kemon achen", "ki khobor")
  if (asksWellBeing) {
    const reply = `আলহামদুলিল্লাহ ${honorific}, ভালো আছি! আপনি কেমন আছেন? আমাদের কোনো প্রোডাক্ট সম্পর্কে কিছু জানার থাকলে বলুন ${honorific}। 😊`;
    return {
      category: "Lead Conversion",
      suggestions: [reply],
      needsLlmBrain: false,
    };
  }

  // 5. Handle Pure Acknowledgment ("Ok", "Accha", "Hmm", "Thanks")
  if (isPureAck) {
    const reply = `অসংখ্য ধন্যবাদ ${honorific}! যেকোনো প্রয়োজনে আমাদের নক দেবেন। ভালো থাকবেন! 😊`;
    return {
      category: "Lead Conversion",
      suggestions: [reply],
      needsLlmBrain: false,
    };
  }

  // 6. Handle Full Store Catalog Inquiry ("apnader kacche r ki ki ache?", "ki ki product ache?")
  if (asksAllProductsCatalog) {
    const catalogReply = `জি ${honorific}, ${buildStoreProductListStatement(products, honorific)}`;
    return {
      category: "Sales Conversion",
      suggestions: [catalogReply],
      needsLlmBrain: false,
    };
  }

  // 6b. Handle Unmatched Product Inquiry (e.g. "apnader kache ki 7up ache?")
  if (!matchedInCurrentMsg) {
    const unmatchedItem = extractUnmatchedProductQuery(rawMsg);
    if (unmatchedItem) {
      const notAvailableReply = `না ${honorific}, আমাদের কাছে ${unmatchedItem} নেই। ${buildStoreProductListStatement(
        products,
        honorific
      )}`;
      return {
        category: "Sales Conversion",
        suggestions: [notAvailableReply],
        needsLlmBrain: false,
      };
    }
  }

  // 7. Handle OUT_OF_STOCK product
  if (primaryProduct.stockStatus === "OUT_OF_STOCK") {
    const alternative = products.find((p) => p.id !== primaryProduct.id && p.stockStatus !== "OUT_OF_STOCK");
    const outReply = `${naturalOpener} দুঃখিত, আমাদের "${primaryProduct.name}" প্রোডাক্টটি এই মুহূর্তে স্টক আউট হয়ে গেছে।${
      alternative
        ? ` তবে আমাদের "${alternative.name}" এখন রেডি স্টকে আছে (অফার প্রাইজ: ${alternative.offerPrice})। আপনি চাইলে এটি দেখতে পারেন!`
        : ` নতুন স্টক আসা মাত্রই আমরা আপনাকে জানাবো ইনশাআল্লাহ।`
    }`;
    return {
      category: "Sales Conversion",
      suggestions: [outReply],
      needsLlmBrain: false,
    };
  }

  // 8. Build Contextual, Humanized Conversational Reply for Specific Intents
  const replySegments = [];
  let category = "Sales Conversion";
  let followUpQuestion = "";

  // Intent: Suitability (Kids / Small Wrists / Girls / Men / Gift / General Usage)
  if (asksSuitabilityGeneral) {
    if (asksSuitabilityKids) {
      replySegments.push(
        `অবশ্যই ব্যবহার করতে পারবে! এটার সাথে অ্যাডজাস্টেবল নরম সিলিকন স্ট্র্যাপ দেওয়া থাকে, তাই ছোট বা বড় যে কারো হাতেই খুব সুন্দরভাবে ফিট হয়। আর ঘড়িটা বেশ হালকা ও আরামদায়ক হওয়ায় ছোট বাচ্চারাও খুব সহজে পরতে পারবে। 😊`
      );
    } else if (lower.includes("meye") || lower.includes("মেয়ে") || lower.includes("gift") || lower.includes("গিফট")) {
      replySegments.push(
        `ছেলে-মেয়ে উভয়েই এটি খুব সুন্দরভাবে পরতে পারবেন এবং প্রিমিয়াম বক্স প্যাকেজিং থাকায় গিফট দেওয়ার জন্যও এটি একদম পারফেক্ট! 👌`
      );
    } else {
      replySegments.push(
        `এটি যেকোনো বয়সের মানুষ খুব আরামে ব্যবহার করতে পারবেন, কারণ সাথে অ্যাডজাস্টেবল স্ট্র্যাপ দেওয়া আছে যা যেকোনো হাতে সুন্দরভাবে ফিট হয়।`
      );
    }
    category = "Lead Conversion";
  }

  // Intent: Delivery Timing ("ekhon order dile kobe pabo?")
  if (asksDeliveryTime) {
    replySegments.push(
      `এখন অর্ডার কনফার্ম করলে ${storeProfile.deliveryTime} ইনশাআল্লাহ। আর ডেলিভারি ম্যানের সামনে প্রোডাক্ট হাতে পেয়ে চেক করে এরপর পেমেন্ট করতে পারবেন।`
    );
    if (!mentionsCustomerArea) {
      followUpQuestion = `আপনি কি ঢাকার ভেতরে নিবেন নাকি ঢাকার বাইরে ${honorific}?`;
    }
  }

  // Intent: Delivery Charge / Advance / Cash on Delivery
  if (asksDeliveryOrPayment && !asksDeliveryTime) {
    if (
      lower.includes("advance") ||
      lower.includes("bkash") ||
      lower.includes("age taka") ||
      lower.includes("অগ্রিম") ||
      lower.includes("এডভান্স")
    ) {
      replySegments.push(
        `না ${honorific}, কোনো অগ্রীম ১ টাকাও দিতে হবে না! ${storeProfile.deliveryPolicy}। প্রোডাক্ট আগে হাতে পাবেন, দেখে চেক করবেন, তারপর ডেলিভারি ম্যানকে পেমেন্ট করবেন। 👍`
      );
    } else {
      replySegments.push(`${storeProfile.deliveryPolicy} (${storeProfile.deliveryTime})।`);
    }
  }

  // Intent: Bargaining vs Price
  if (asksBargain) {
    replySegments.push(
      `এটার রেগুলার প্রাইজ তো ${primaryProduct.regularPrice || "৩,৯৯০ টাকা"}, আমরা অলরেডি ডিসকাউন্ট দিয়ে একদম স্পেশাল অফার প্রাইজে মাত্র ${primaryProduct.offerPrice}-এ দিচ্ছি, সাথে ফ্রি হোম ডেলিভারিও থাকছে! প্রোডাক্টটা হাতে পেলেই কোয়ালিটি দেখে আপনার ভালো লাগবে ইনশাআল্লাহ। 😊`
    );
  } else if (asksPrice && !asksStock) {
    replySegments.push(
      primaryProduct.regularPrice
        ? `"${primaryProduct.name}"-এর রেগুলার প্রাইজ ${primaryProduct.regularPrice}, তবে এখন অফারে পাচ্ছেন মাত্র ${primaryProduct.offerPrice}-এ (সাথে সারাদেশে ফ্রি হোম ডেলিভারি)!`
        : `"${primaryProduct.name}"-এর স্পেশাল অফার প্রাইজ পরবে মাত্র ${primaryProduct.offerPrice} (ফ্রি হোম ডেলিভারি)!`
    );
  }

  // Intent: Stock / Availability ("eta ki ache?")
  if (asksStock) {
    const stockNote =
      primaryProduct.stockStatus === "LIMITED_STOCK"
        ? `হ্যাঁ, আমাদের "${primaryProduct.name}" এখন সীমিত স্টকে এভেইলেবল আছে।`
        : `হ্যাঁ, আমাদের "${primaryProduct.name}" এখন রেডি স্টকে আছে।`;
    const priceAddon = !alreadyMentionedPrice
      ? ` স্পেশাল অফার প্রাইজ মাত্র ${primaryProduct.offerPrice}${
          primaryProduct.regularPrice ? ` (রেগুলার প্রাইজ ${primaryProduct.regularPrice})` : ""
        }।`
      : "";
    replySegments.push(`${stockNote}${priceAddon}`);
    if (!followUpQuestion) {
      followUpQuestion = `আপনি কি অর্ডার করতে চাচ্ছেন ${honorific}?`;
    }
  }

  // Intent: Variants / Colors / Box Contents / Straps
  if (asksVariants && primaryProduct.variantsAndContents) {
    replySegments.push(`${primaryProduct.variantsAndContents}।`);
    if (!followUpQuestion) {
      followUpQuestion = `আপনি কোন কালারটি নিতে চাচ্ছেন ${honorific}?`;
    }
  }

  // Intent: Specific Features (Waterproof / Battery / Calling / General Quality)
  if (asksWhyGood) {
    if (asksWaterproof && !asksBattery && !asksCallingOrConnect) {
      replySegments.push(
        `এটি ১০০% IP68 ওয়াটারপ্রুফ! তাই হাত ধোয়া, বৃষ্টি বা ঘামের পানিতে কোনো সমস্যাই হবে না ইনশাআল্লাহ।`
      );
    } else if (asksBattery && !asksWaterproof && !asksCallingOrConnect) {
      replySegments.push(
        `এটার ব্যাটারি ব্যাকআপ খুবই ভালো — একবার ফুল চার্জ দিলে রেগুলার ইউজে ৫-৭ দিন অনায়াসে চলে যাবে, আর সাথে ওয়্যারলেস ম্যাগনেটিক চার্জারও থাকছে।`
      );
    } else if (asksCallingOrConnect && !asksWaterproof && !asksBattery) {
      replySegments.push(
        `যেকোনো Android বা iPhone-এর সাথে ব্লুটুথ দিয়ে কানেক্ট করে ঘড়ি থেকেই সরাসরি কল রিসিভ ও কথা বলা যাবে, এবং সব নোটিফিকেশনও দেখা যাবে! 🔥`
      );
    } else if (primaryProduct.whyGoodFeatures) {
      replySegments.push(
        `নিশ্চিন্তে নিতে পারেন! ${primaryProduct.whyGoodFeatures}। তাছাড়া ডেলিভারি ম্যানের সামনে চেক করে নেওয়ার সুবিধা তো থাকছেই।`
      );
    }
    category = "Lead Conversion";
  }

  // Intent: Warranty / Guarantee
  if (asksWarranty && primaryProduct.warrantyInfo) {
    replySegments.push(
      `এই প্রোডাক্টের সাথে পাচ্ছেন ${primaryProduct.warrantyInfo}। তাই যেকোনো সমস্যা হলে সরাসরি আমাদের থেকে রিপ্লেসমেন্ট সুবিধা পাবেন।`
    );
    category = "Lead Conversion";
  }

  // Intent: Real Photo / Video
  if (asksPhotoOrVideo) {
    replySegments.push(
      `পোস্টে দেওয়া ছবিগুলো আমাদের নিজেদের প্রোডাক্টেরই রিয়েল ছবি! আর সবচেয়ে বড় সুবিধা হলো ডেলিভারি ম্যানের সামনে বক্স খুলে ঘড়িটি নিজের হাতে দেখে ও চেক করে তারপর টাকা দিতে পারবেন। 😊`
    );
  }

  // Intent: Showroom / Location
  if (asksLocation) {
    replySegments.push(
      `আমাদের শোরুমের ঠিকানা: ${storeProfile.showroomAddress}। আপনি চাইলে সরাসরি শোরুমে এসেও দেখে নিতে পারেন, অথবা বাসায় বসে ক্যাশ অন ডেলিভারিতেও অর্ডার করতে পারেন (হেল্পলাইন: ${storeProfile.helplineNumber})।`
    );
    category = "Visit Conversion";
  }

  // Intent: How to Order / "Nite chai"
  if (asksHowToOrder) {
    replySegments.push(
      `অর্ডার করার জন্য শুধু আপনার নাম, সম্পূর্ণ ঠিকানা (থানা ও জেলাসহ) এবং সচল মোবাইল নম্বরটি এখানে লিখে দিন — আমরা এখনই আপনার অর্ডারটি কনফার্ম করে দিচ্ছি! 😊`
    );
  }

  // Intent: Customer replied with their City/Area (e.g. "Dhakay", "Mirpur", "Chittagong")
  if (replySegments.length === 0 && mentionsCustomerArea) {
    replySegments.push(
      `ওখানে আমাদের দ্রুত হোম ডেলিভারি সার্ভিস চালু আছে (${storeProfile.deliveryTime})! অর্ডারটি বুক করে পাঠানোর জন্য আপনার নাম, সম্পূর্ণ ঠিকানা ও মোবাইল নম্বরটি একটু লিখে দিন প্লিজ। 😊`
    );
  }

  // 9. Open-ended message fallback (NEVER dump product feature/warranty template paragraphs!)
  let needsLlmBrain = false;
  if (replySegments.length === 0) {
    needsLlmBrain = true;
    if (!hasAlreadyGreeted && matchedInCurrentMsg) {
      replySegments.push(
        `জি, আমাদের "${primaryProduct.name}" এখন রেডি স্টকে আছে (অফার প্রাইজ: ${primaryProduct.offerPrice})। আপনি কি এটি সম্পর্কে কিছু জানতে চাচ্ছেন ${honorific}? 😊`
      );
    } else if (!hasAlreadyGreeted) {
      replySegments.push(`কেমন আছেন? জি বলুন, আপনাকে কীভাবে সহযোগিতা করতে পারি? 😊`);
    } else {
      replySegments.push(
        `বলুন, প্রোডাক্ট বা ডেলিভারি সম্পর্কে আর কোনো কিছু জানার থাকলে নির্দ্বিধায় বলতে পারেন! 😊`
      );
    }
  } else {
    if (followUpQuestion) {
      replySegments.push(followUpQuestion);
    } else if (
      !recentlyAskedOrderInfo &&
      !asksLocation &&
      !asksSuitabilityGeneral &&
      !asksHowToOrder &&
      (asksPrice || asksBargain)
    ) {
      replySegments.push(`অর্ডার করতে চাইলে আপনার নাম, পূর্ণ ঠিকানা ও মোবাইল নম্বরটি দিন প্লিজ। 😊`);
    }
  }

  const primaryReply = `${naturalOpener} ${replySegments.join(" ")}`.replace(/\s+/g, " ").trim();

  // Secondary alternative suggestion for the UI panel
  const secondaryReply = `জি ${honorific}, ${buildStoreProductListStatement(products, honorific)}`;

  return {
    category,
    suggestions: [primaryReply, secondaryReply],
    needsLlmBrain,
  };
}

/**
 * Live Generative LLM Conversational Brain for open-ended human messages in Messenger
 * Calls OpenAI-compatible endpoint with recent chat history + store knowledgebase so open-ended messages
 * get a genuinely human 1-2 sentence Bangladeshi Bangla reply.
 */
async function generateHumanLlmReply(rawMsg, customerName, runtime = {}, channelContext = {}, conversationHistory = [], fallbackReply = "") {
  try {
    const { honorific } = getHumanAddress(customerName);
    const allProducts =
      Array.isArray(runtime.products) && runtime.products.length > 0 ? runtime.products : DEFAULT_PRODUCTS;
    const storeProfile = { ...DEFAULT_STORE_PROFILE, ...(runtime.storeProfile || {}) };
    const productSummary = allProducts
      .map((p, i) => `${i + 1}. ${p.name} (অফার প্রাইজ: ${p.offerPrice}, স্টক: ${p.stockStatus})`)
      .join("; ");

    const recentHistory = (Array.isArray(conversationHistory) ? conversationHistory : [])
      .slice(-5)
      .map((m) => `${m.sender === "CUSTOMER" ? "Customer" : "Page Moderator"}: ${m.text}`)
      .join("\n");

    const systemPrompt = [
      `You are a real human customer support moderator of the Bangladeshi Facebook Page "${channelContext.name || storeProfile.storeName}".`,
      `Always reply in natural, warm, colloquial Bangladeshi Bangla in 1 to 2 short sentences maximum.`,
      `Address the customer as "${honorific}".`,
      `NEVER repeat "আসসালামু আলাইকুম" if the chat is already ongoing. NEVER dump long product specifications or warranty paragraphs unless the customer specifically asks for them.`,
      `If the customer says they won't buy now or don't want it (e.g. "ekhon nibo na", "lagbe na"), politely say "আচ্ছা ${honorific}, কোনো সমস্যা নেই! 😊 আপনার যখন সুবিধা হয় বা প্রয়োজন পড়ে তখন নক দিয়েন। ভালো থাকবেন!"`,
      `If the customer asks if you are AI/bot/robot (e.g. "tumi ki AI"), naturally say "না ${honorific}, আমি পেজের কাস্টমার সাপোর্ট মডারেটর বলছি 😊 আপনার মেসেজের দ্রুত রিপ্লাই দেওয়ার চেষ্টা করছি।"`,
      `Store Products: ${productSummary}. Delivery: ${storeProfile.deliveryTime}, ${storeProfile.deliveryPolicy}.`,
      `Output ONLY the final Bangla reply text without quotes or explanations.`,
    ].join(" ");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6500);
    const response = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: "openai-fast",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: recentHistory
              ? `Recent Chat History:\n${recentHistory}\n\nCustomer's Latest Message: ${rawMsg}`
              : `Customer's Message: ${rawMsg}`,
          },
        ],
      }),
    });
    clearTimeout(timer);

    if (response.ok) {
      const data = await response.json();
      const llmText = (data?.choices?.[0]?.message?.content || "").trim().replace(/^["']|["']$/g, "");
      if (llmText && llmText.length >= 4 && llmText.length <= 450) {
        return llmText;
      }
    }
  } catch (_) {}
  return fallbackReply;
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
    throw new Error("Could not find Messenger reply textbox on page.");
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

  // Click the Send button ONCE (never click twice, because once the textbox empties, the button changes to "Send a Like" 👍!)
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
      return (
        aria === "send" ||
        aria.includes("press enter to send") ||
        txt === "send"
      );
    });
    if (btns.length === 0) return false;
    const target = btns[btns.length - 1];
    target.click();
    return true;
  });

  if (!clickedSendBtn) {
    await page.keyboard.press("Enter");
  }

  await sleep(2000);
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

    async function checkIsLoggedOut() {
      const currentUrl = page.url() || "";
      if (
        currentUrl.includes("index.php?next=") ||
        currentUrl.includes("/login") ||
        currentUrl.includes("loginpage")
      ) {
        return true;
      }
      return await safeEvaluate(page, () => {
        const hasPass = Boolean(document.querySelector('input[type="password"], input[name="pass"]'));
        const bodyText = document.body ? document.body.innerText : "";
        return (
          hasPass ||
          (bodyText.includes("Create new account") && bodyText.includes("Forgotten password?")) ||
          (bodyText.includes("Use another profile") && bodyText.includes("Create new account")) ||
          bodyText.includes("Get started with\nbusiness tools from Meta")
        );
      });
    }

    async function extractActiveThreadChatBubbles(customerName, convId, fallbackTime) {
      try {
        await safeEvaluate(page, () => {
          const scrollables = Array.from(document.querySelectorAll("div")).filter((d) => {
            const st = window.getComputedStyle(d);
            const r = d.getBoundingClientRect();
            return (
              (st.overflowY === "auto" || st.overflowY === "scroll") &&
              d.scrollHeight > d.clientHeight + 20 &&
              r.x > 340 &&
              r.x < 720 &&
              r.width > 300
            );
          });
          scrollables.forEach((d) => {
            d.scrollTop = d.scrollHeight;
          });
        });

        await sleep(650);

        const rawBubbles = await safeEvaluate(
          page,
          (cName) => {
            const allEls = Array.from(document.querySelectorAll("div, span"));
            const timestamps = [];
            const collected = [];

            for (const el of allEls) {
              const r = el.getBoundingClientRect();
              if (r.x < 350 || r.right > 1045 || r.y < -600 || r.y > 750) continue;
              const text = (el.innerText || "").trim();
              if (!text || text.length > 950) continue;

              if (
                /^(?:(?:today|yesterday)\s*)?\d{1,2}:\d{2}(?:\s*[ap]m)?$/i.test(text) &&
                r.height <= 30
              ) {
                timestamps.push({ y: Math.round(r.y), text: text.replace(/\s+/g, " ") });
                continue;
              }

              const bg = window.getComputedStyle(el).backgroundColor;
              const isBluePageBubble =
                bg === "rgb(10, 124, 255)" ||
                bg === "rgb(0, 132, 255)" ||
                bg === "rgb(24, 119, 242)";
              const isGrayCustomerBubble =
                bg === "rgb(239, 239, 239)" ||
                bg === "rgb(240, 242, 245)" ||
                bg === "rgb(228, 230, 235)";

              if (!isBluePageBubble && !isGrayCustomerBubble) continue;
              if (r.width < 22 || r.height < 18 || r.height > 360) continue;

              const lowerT = text.toLowerCase();
              if (lowerT === (cName || "").toLowerCase() || lowerT === "aa" || text.includes("?? ?????")) continue;

              collected.push({
                sender: isBluePageBubble ? "AI_ASSISTANT" : "CUSTOMER",
                text: text.replace(/\n{2,}/g, "\n").trim(),
                x: Math.round(r.x),
                y: Math.round(r.y),
              });
            }

            collected.sort((a, b) => a.y - b.y);
            timestamps.sort((a, b) => a.y - b.y);

            const deduped = [];
            for (const item of collected) {
              const prev = deduped[deduped.length - 1];
              if (
                prev &&
                prev.sender === item.sender &&
                Math.abs(prev.y - item.y) < 20 &&
                (prev.text === item.text || prev.text.includes(item.text) || item.text.includes(prev.text))
              ) {
                if (item.text.length > prev.text.length) {
                  deduped[deduped.length - 1] = item;
                }
                continue;
              }
              deduped.push(item);
            }

            let currentTs = "Today";
            return deduped.slice(-14).map((b) => {
              for (const ts of timestamps) {
                if (ts.y <= b.y + 8) currentTs = ts.text;
              }
              return { ...b, timestamp: currentTs };
            });
          },
          customerName
        );

        if (!Array.isArray(rawBubbles) || rawBubbles.length === 0) return null;

        return rawBubbles.map((b, idx) => ({
          id: `${convId}-m-${idx + 1}`,
          sender: b.sender,
          text: b.text,
          timestamp: b.timestamp || fallbackTime || "Today",
          status: b.sender === "CUSTOMER" ? "DELIVERED" : "SENT",
          ...(b.sender === "AI_ASSISTANT" ? { graphApiStatus: "SUCCESS_200" } : {}),
        }));
      } catch (_) {
        return null;
      }
    }

    let lastKnownCookieStr = cookieString || "";

    async function waitUntilLoggedIn(currentCheck) {
      while (await checkIsLoggedOut()) {
        if (isSuperseded()) return false;
        const authErr =
          "❌ ফেসবুক সেশন কুকি লগ-আউট হয়ে গেছে, তাই মেসেঞ্জারে নতুন রিপ্লাই পাঠানো যায়নি! বটের ওপেন হওয়া Chrome উইন্ডোতে লগইন করুন অথবা ডানপাশের '🔑 Update FB Session Cookie' বাটনে ক্লিক করে নতুন কুকি দিন — কানেক্ট হওয়া মাত্রই মেসেঞ্জারে অটো-রিপ্লাই চলে যাবে।";
        console.error(authErr);
        updateStatus({
          status: "AUTH_ERROR",
          error: authErr,
          sourceType,
          targetId,
          targetName,
          checkCount: currentCheck,
          conversations: liveConversations,
        });

        await sleep(4000);

        // Check if active-session.json was updated with a new cookie from the UI
        if (fs.existsSync(sessionFilePath)) {
          try {
            const sess = JSON.parse(fs.readFileSync(sessionFilePath, "utf8"));
            if (sess.cookieString && sess.cookieString !== lastKnownCookieStr) {
              lastKnownCookieStr = sess.cookieString;
              const freshCookies = parseCookies(lastKnownCookieStr);
              if (targetId && /^\d+$/.test(targetId)) {
                freshCookies.push({
                  name: "i_user",
                  value: targetId,
                  domain: ".facebook.com",
                  path: "/",
                  secure: true,
                  sameSite: "Lax",
                });
              }
              await page.setCookie(...freshCookies);
              await page.goto("https://www.facebook.com/messages/t/", {
                waitUntil: "domcontentloaded",
                timeout: 45000,
              });
              await sleep(4000);
            }
          } catch (_) {}
        }
      }

      // User logged in inside the browser window or via cookie! Persist updated cookies to active-session.json
      try {
        const currentBrowserCookies = await page.cookies("https://www.facebook.com");
        const hasCUser = currentBrowserCookies.some((c) => c.name === "c_user");
        const hasXs = currentBrowserCookies.some((c) => c.name === "xs");
        if (hasCUser && hasXs) {
          const serialized = currentBrowserCookies.map((c) => `${c.name}=${c.value}`).join(";");
          lastKnownCookieStr = serialized;
          fs.writeFileSync(
            sessionFilePath,
            JSON.stringify(
              {
                accountName: targetName || "Main Facebook Profile",
                cookieString: serialized,
                updatedAt: new Date().toISOString(),
              },
              null,
              2
            ),
            "utf8"
          );
        }
      } catch (_) {}

      const curUrl = page.url() || "";
      if (!curUrl.includes("/messages") && !curUrl.includes("/latest/inbox")) {
        await page.goto("https://www.facebook.com/messages/t/", {
          waitUntil: "domcontentloaded",
          timeout: 45000,
        });
        await sleep(4000);
      }
      return true;
    }

    if (await checkIsLoggedOut()) {
      const ok = await waitUntilLoggedIn(0);
      if (!ok) {
        await browser.close();
        return;
      }
    }

    for (let check = 1; check <= maxChecks; check++) {
      if (isSuperseded()) {
        console.log("🛑 Newer Inbox Bot instance started. Exiting this instance cleanly.");
        break;
      }

      if (await checkIsLoggedOut()) {
        const ok = await waitUntilLoggedIn(check);
        if (!ok) break;
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

        const chanSlug = activeChanName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const convId = `fb-live-${chanSlug}-${lowerCustomer.replace(/[^a-z0-9]+/g, "-")}`;

        // Click the first/unread thread so we can read all real chat bubbles inside the right-hand Messenger pane!
        if (i === 0 || !th.isRepliedByPage) {
          try {
            await page.mouse.click(th.x, th.y);
            await sleep(1200);
          } catch (_) {}
        }

        const extractedBubbles =
          i === 0 || !th.isRepliedByPage
            ? await extractActiveThreadChatBubbles(th.customerName, convId, th.lastMessageTime)
            : null;

        // Combine consecutive trailing CUSTOMER bubbles so multi-line/multi-bubble queries (e.g. "Premium Smart Watch Ultra X9" + "eta ki ache?") are understood together!
        let fullCustomerQuery = th.cleanPreview;
        let isReplied =
          th.isRepliedByPage ||
          Boolean(lastBotSnippet && th.cleanPreview.startsWith(lastBotSnippet.slice(0, 25)));

        if (Array.isArray(extractedBubbles) && extractedBubbles.length > 0) {
          const lastBubble = extractedBubbles[extractedBubbles.length - 1];
          isReplied = lastBubble.sender === "AI_ASSISTANT";

          // Collect trailing customer bubbles (or last customer bubble group before AI reply)
          const trailingCustomerTexts = [];
          for (let bIdx = extractedBubbles.length - 1; bIdx >= 0; bIdx--) {
            if (extractedBubbles[bIdx].sender === "CUSTOMER") {
              trailingCustomerTexts.unshift(extractedBubbles[bIdx].text);
            } else if (trailingCustomerTexts.length > 0) {
              break;
            }
          }
          if (trailingCustomerTexts.length > 0) {
            fullCustomerQuery = trailingCustomerTexts.join("\n");
          }
        }

        const aiResult = generateTrainedAiResponse(
          fullCustomerQuery,
          th.customerName,
          runtime,
          currentActiveChannel,
          extractedBubbles || []
        );

        let lastText =
          Array.isArray(extractedBubbles) && extractedBubbles.length > 0
            ? extractedBubbles[extractedBubbles.length - 1].text
            : th.cleanPreview;

        const messages =
          Array.isArray(extractedBubbles) && extractedBubbles.length > 0
            ? extractedBubbles
            : [
                {
                  id: `${convId}-m1`,
                  sender: isReplied ? "AI_ASSISTANT" : "CUSTOMER",
                  text: th.cleanPreview,
                  timestamp: th.lastMessageTime,
                  status: isReplied ? "SENT" : "DELIVERED",
                  ...(isReplied ? { graphApiStatus: "SUCCESS_200" } : {}),
                },
              ];

        // 3. If AUTO mode is active and this customer is WAITING_REPLY, send trained AI auto-reply!
        const repliedStateFile = path.join(tempDir, "inbox-replied-state.json");
        let persistedRepliedState = {};
        try {
          if (fs.existsSync(repliedStateFile)) {
            persistedRepliedState = JSON.parse(fs.readFileSync(repliedStateFile, "utf8")) || {};
          }
        } catch (_) {}

        const normalizedQuery = fullCustomerQuery.trim().toLowerCase();
        const sig = `${customerChanKey}:::${normalizedQuery.slice(0, 120)}`;
        const alreadyRepliedPersisted = persistedRepliedState[customerChanKey] === normalizedQuery;

        if (
          isRunning &&
          currentMode === "AUTO" &&
          !isReplied &&
          !alreadyRepliedPersisted &&
          !autoRepliedSignatures.has(sig)
        ) {
          let autoReplyText = aiResult.suggestions[0];
          if (aiResult.needsLlmBrain) {
            autoReplyText = await generateHumanLlmReply(
              fullCustomerQuery,
              th.customerName,
              runtime,
              currentActiveChannel,
              extractedBubbles || [],
              autoReplyText
            );
            aiResult.suggestions[0] = autoReplyText;
          }

          console.log(
            `\n🤖 [TRAINED AI AUTO-REPLY | ${activeChanName}] Customer "${th.customerName}" asked: "${fullCustomerQuery.replace(/\n/g, " | ")}"`
          );
          console.log(`   💡 AI Answer: "${autoReplyText}"`);
          console.log(`   ⏳ Applying human-like delay (${Math.min(humanDelaySeconds, 6)}s)...`);
          await sleep(Math.min(humanDelaySeconds, 6) * 1000);

          if (isSuperseded()) {
            console.log("🛑 Superseded before sending auto-reply. Aborting duplicate send.");
            break;
          }

          try {
            await page.mouse.click(th.x, th.y);
            await sleep(1500);
            await sendTextInActiveThread(page, autoReplyText);

            autoRepliedSignatures.add(sig);
            persistedRepliedState[customerChanKey] = normalizedQuery;
            try {
              fs.writeFileSync(repliedStateFile, JSON.stringify(persistedRepliedState, null, 2), "utf8");
            } catch (_) {}

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
