"use client"

import { useState, useEffect, useCallback, useMemo } from "react"

export type ConversationCategory = "Sales Conversion" | "Lead Conversion" | "Visit Conversion"
export type OperatingMode = "MANUAL" | "AUTO"
export type ProductStockStatus = "IN_STOCK" | "LIMITED_STOCK" | "OUT_OF_STOCK"

export interface TrainedProduct {
  id: string
  name: string
  keywords: string
  regularPrice: string
  offerPrice: string
  stockStatus: ProductStockStatus
  stockQuantityText: string
  variantsAndContents: string
  whyGoodFeatures: string
  warrantyInfo: string
  isDefaultProduct?: boolean
  assignedChannelKey?: string
}

export interface StoreKnowledgeProfile {
  storeName: string
  deliveryPolicy: string
  deliveryTime: string
  showroomAddress: string
  helplineNumber: string
  customAiPrompt: string
}

export interface ChatMessage {
  id: string
  sender: "CUSTOMER" | "PAGE" | "AI_ASSISTANT"
  text: string
  timestamp: string
  status: "SENT" | "DELIVERED" | "PENDING_APPROVAL"
  graphApiStatus?: "SUCCESS_200"
}

export interface InboxConversation {
  id: string
  customerName: string
  customerAvatar?: string
  pageName: string
  platform: "Facebook Marketplace" | "Facebook Page" | "Messenger"
  category: ConversationCategory
  unreadCount: number
  lastMessageText: string
  lastMessageTime: string
  status: "WAITING_REPLY" | "REPLIED" | "FOLLOW_UP_SCHEDULED"
  aiSuggestions: string[]
  messages: ChatMessage[]
}

export interface MessageTemplate {
  id: string
  title: string
  category: ConversationCategory | "General"
  content: string
  tags: string[]
}

export interface InboxAutomationSettings {
  isRunning: boolean
  mode: OperatingMode
  activeCategory: ConversationCategory
  humanDelaySeconds: number
  autoFollowUpEnabled: boolean
  fallbackMessageId: string
  monitoredPages: string[]
}

const STORAGE_KEY_CONVERSATIONS = "bmt_inbox_conversations_v5"
const STORAGE_KEY_SETTINGS = "bmt_inbox_settings_v2"
const STORAGE_KEY_TEMPLATES = "bmt_inbox_templates_v2"
const STORAGE_KEY_PRODUCTS = "bmt_inbox_trained_products_v2"
const STORAGE_KEY_STORE_PROFILE = "bmt_inbox_store_profile_v1"

const sanitizeText = (text: string): string => {
  return text
    .replace(
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{25A0}-\u{25FF}\u{2B50}\u{2713}\u{2714}\u{2705}]/gu,
      ""
    )
    .replace(/\s+/g, " ")
    .trim()
}

export const DEFAULT_STORE_PROFILE: StoreKnowledgeProfile = {
  storeName: "Test Next Official Store",
  deliveryPolicy:
    "সারাদেশে ফ্রি ক্যাশ অন হোম ডেলিভারি (১ টাকাও অগ্রিম দিতে হবে না, প্রোডাক্ট হাতে পেয়ে চেক করে পেমেন্ট)",
  deliveryTime: "ঢাকায় ২৪ ঘণ্টা এবং ঢাকার বাইরে ৪৮-৭২ ঘণ্টার মধ্যে হোম ডেলিভারি",
  showroomAddress: "শপ #৪০৮, লেভেল ৪, যমুনা ফিউচার পার্ক, ঢাকা (সকাল ১০টা - রাত ৮টা)",
  helplineNumber: "01700-000000",
  customAiPrompt:
    "সবসময় ভদ্রভাবে সালাম দিয়ে কাস্টমারের প্রশ্নের টু-দ্য-পয়েন্ট উত্তর দেবে এবং অর্ডার কনফার্ম করতে নাম, পূর্ণ ঠিকানা ও মোবাইল নম্বর চাইবে।",
}

export const DEFAULT_TRAINED_PRODUCTS: TrainedProduct[] = [
  {
    id: "prod-1",
    name: "Premium Smart Watch Ultra X9",
    keywords: "watch, smart watch, ultra, x9, ultra x9, ঘড়ি, স্মার্ট ওয়াচ, ওয়াচ, ঘড়ি",
    regularPrice: "৩,৯৯০ টাকা",
    offerPrice: "২,৪৯০ টাকা",
    stockStatus: "IN_STOCK",
    stockQuantityText: "হ্যাঁ, আমাদের কাছে পর্যাপ্ত রেডি স্টক এভেইলেবল আছে",
    variantsAndContents:
      "কালার: ব্ল্যাক, সিলভার ও টাইটানিয়াম অরেঞ্জ | বক্সে থাকছে: ১টি স্মার্ট ওয়াচ, ২টি প্রিমিয়াম স্ট্র্যাপ (চেইন ও সিলিকন), ওয়্যারলেস ম্যাগনেটিক চার্জার ও ওয়ারেন্টি কার্ড",
    whyGoodFeatures:
      "এতে রয়েছে Super AMOLED HD ডিসপ্লে, ১০০% ওয়াটারপ্রুফ (IP68), সরাসরি ব্লুটুথ কলিং ও বাংলা নোটিফিকেশন, হার্ট-রেট মনিটর এবং এক চার্জে ৫-৭ দিন দীর্ঘ ব্যাটারি ব্যাকআপ",
    warrantyInfo: "১ বছরের অফিসিয়াল ব্র্যান্ড ওয়ারেন্টি এবং ৭ দিনের ইনস্ট্যান্ট রিপ্লেসমেন্ট গ্যারান্টি",
    isDefaultProduct: true,
  },
  {
    id: "prod-2",
    name: "ANC Pro Wireless Earbuds",
    keywords: "earbuds, airpods, headphone, ইয়ারবাড, এয়ারপড, হেডফোন, ইয়ারবাড",
    regularPrice: "২,২০০ টাকা",
    offerPrice: "১,৩৯০ টাকা",
    stockStatus: "IN_STOCK",
    stockQuantityText: "রেডি স্টকে আছে",
    variantsAndContents:
      "কালার: ম্যাট ব্ল্যাক ও গ্লসি হোয়াইট | বক্সে থাকছে: চার্জিং কেস, ২টি ইয়ারবাড, টাইপ-সি ফাস্ট চার্জিং ক্যাবল ও এক্সট্রা ইয়ার-টিপস",
    whyGoodFeatures:
      "Active Noise Cancellation (ANC), ডিপ বেস সাউন্ড কোয়ালিটি, গেমিং লো-ল্যাটেন্সি মোড এবং টানা ৩০ ঘণ্টা চার্জিং কেস ব্যাকআপ",
    warrantyInfo: "৬ মাসের অফিসিয়াল ওয়ারেন্টি",
    isDefaultProduct: false,
  },
]

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: "tpl-1",
    title: "Watch Pricing & Discount Offer",
    category: "Sales Conversion",
    content:
      "আসসালামু আলাইকুম! প্রিমিয়াম ওয়াচটির অফার মূল্য ২,৪৯০ টাকা (৪০% ছাড় চলছে, সারাদেশে ফ্রি ক্যাশ অন হোম ডেলিভারি)। অর্ডার কনফার্ম করতে আপনার নাম, পূর্ণ ঠিকানা ও মোবাইল নম্বর দিন।",
    tags: ["Sales", "Watch", "Discount"],
  },
  {
    id: "tpl-2",
    title: "Showroom Location & Visiting Hours",
    category: "Visit Conversion",
    content:
      "ধন্যবাদ! আমাদের শোরুমের ঠিকানা: শপ #৪০৮, লেভেল ৪, যমুনা ফিউচার পার্ক, ঢাকা। শোরুম প্রতিদিন সকাল ১০টা থেকে রাত ৮টা পর্যন্ত খোলা থাকে। ভিজিট ম্যাপ: https://bmt.link/location",
    tags: ["Visit", "Address", "Showroom"],
  },
  {
    id: "tpl-3",
    title: "1-Year Official Warranty Policy",
    category: "Lead Conversion",
    content:
      "জি, প্রতিটি প্রোডাক্টের সাথে ১ বছরের অফিসিয়াল ব্র্যান্ড ওয়ারেন্টি এবং ৭ দিনের রিপ্লেসমেন্ট গ্যারান্টি কার্ড দেওয়া হয়। যেকোনো তথ্যের জন্য আমাদের হেল্পলাইনে কল করুন: 01700000000।",
    tags: ["Warranty", "Lead", "Guarantee"],
  },
  {
    id: "tpl-4",
    title: "AI Unknown Fallback Motivation",
    category: "General",
    content:
      "ধন্যবাদ আপনার বার্তার জন্য! আমাদের স্পেশাল প্রতিনিধি দ্রুতই বিস্তারিত জানাচ্ছেন। ইতিমধ্যে আমাদের বর্তমান অফার ক্যাটালগ দেখতে পারেন: https://bmt.link/catalog",
    tags: ["Fallback", "General", "AI Motivation"],
  },
]

const INITIAL_CONVERSATIONS: InboxConversation[] = [
  {
    id: "fb-live-rasidul-islam-sajib",
    customerName: "Rasidul Islam Sajib",
    pageName: "Test Next",
    platform: "Facebook Page",
    category: "Sales Conversion",
    unreadCount: 0,
    lastMessageText:
      'আসসালামু আলাইকুম Rasidul Islam Sajib! জি, আমাদের "Premium Smart Watch Ultra X9" বর্তমানে স্টকে এভেইলেবল আছে (স্পেশাল অফার প্রাইজ মাত্র ২,৪৯০ টাকা, রেগুলার প্রাইজ ৩,৯৯০ টাকা)। সারাদেশে ফ্রি ক্যাশ অন হোম ডেলিভারি। অর্ডার কনফার্ম করতে আপনার নাম, পূর্ণ ঠিকানা ও মোবাইল নম্বর দিন।',
    lastMessageTime: "11:22",
    status: "REPLIED",
    aiSuggestions: [
      'আসসালামু আলাইকুম Rasidul Islam Sajib! জি, আমাদের "Premium Smart Watch Ultra X9" বর্তমানে স্টকে এভেইলেবল আছে (স্পেশাল অফার প্রাইজ মাত্র ২,৪৯০ টাকা, রেগুলার প্রাইজ ৩,৯৯০ টাকা)। সারাদেশে ফ্রি ক্যাশ অন হোম ডেলিভারি। অর্ডার কনফার্ম করতে আপনার নাম, পূর্ণ ঠিকানা ও মোবাইল নম্বর দিন।',
    ],
    messages: [
      {
        id: "m-live-0-reply",
        sender: "AI_ASSISTANT",
        text: "আসসালামু আলাইকুম! আমাদের প্রিমিয়াম ওয়াচটির রেগুলার মূল্য ৩,৯৯০ টাকা, তবে ঈদ ধামাকা অফারে পাচ্ছেন মাত্র ২,৪৯০ টাকায় (সারাদেশে ফ্রি ক্যাশ অন ডেলিভারি)! অর্ডার করতে এখনই আপনার নাম, পূর্ণ ঠিকানা ও মোবাইল নম্বর দিন।",
        timestamp: "Today",
        status: "SENT",
        graphApiStatus: "SUCCESS_200",
      },
      {
        id: "m-live-1",
        sender: "CUSTOMER",
        text: "ভাইয়া দাম কত?",
        timestamp: "00:15",
        status: "DELIVERED",
      },
      {
        id: "m-live-2",
        sender: "AI_ASSISTANT",
        text: "আসসালামু আলাইকুম Rasidul Islam Sajib! আমাদের স্পেশাল অফার প্রাইজ ২,৪৯০ টাকা (সারাদেশে ফ্রি ক্যাশ অন হোম ডেলিভারি)। অর্ডার কনফার্ম করতে আপনার নাম, পূর্ণ ঠিকানা ও মোবাইল নম্বর দিন।",
        timestamp: "00:15",
        status: "SENT",
        graphApiStatus: "SUCCESS_200",
      },
      {
        id: "m-live-3",
        sender: "CUSTOMER",
        text: "Premium Smart Watch Ultra X9\neta ki ache?",
        timestamp: "10:17",
        status: "DELIVERED",
      },
      {
        id: "m-live-4",
        sender: "CUSTOMER",
        text: "Premium Smart Watch Ultra X9\neta ki ache?",
        timestamp: "11:22",
        status: "DELIVERED",
      },
      {
        id: "m-live-5",
        sender: "AI_ASSISTANT",
        text: 'আসসালামু আলাইকুম Rasidul Islam Sajib! জি, আমাদের "Premium Smart Watch Ultra X9" বর্তমানে স্টকে এভেইলেবল আছে (স্পেশাল অফার প্রাইজ মাত্র ২,৪৯০ টাকা, রেগুলার প্রাইজ ৩,৯৯০ টাকা)। সারাদেশে ফ্রি ক্যাশ অন হোম ডেলিভারি। অর্ডার কনফার্ম করতে আপনার নাম, পূর্ণ ঠিকানা ও মোবাইল নম্বর দিন।',
        timestamp: "11:22",
        status: "SENT",
        graphApiStatus: "SUCCESS_200",
      },
    ],
  },
]

const DEFAULT_SETTINGS: InboxAutomationSettings = {
  isRunning: true,
  mode: "AUTO",
  activeCategory: "Sales Conversion",
  humanDelaySeconds: 4,
  autoFollowUpEnabled: true,
  fallbackMessageId: "tpl-4",
  monitoredPages: ["Test Next", "CARE HUB BD"],
}

function getHumanAddress(customerName: string) {
  const raw = (customerName || "").trim()
  const lower = raw.toLowerCase()
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
  ]
  const isFemale = femaleHints.some((h) => lower.includes(h))
  const honorific = isFemale ? "আপু" : "ভাইয়া"

  const tokens = raw
    .split(/\s+/)
    .map((t) => t.replace(/[^a-zA-Z\u0980-\u09FF]/g, ""))
    .filter((t) => t.length >= 2 && !/^(md|mst|mohammad|muhammad|al|sk|sheikh)$/i.test(t))

  const shortName = tokens[0] || ""
  return {
    honorific,
    shortName,
    firstTurnAddress: shortName ? `${shortName} ${honorific}` : honorific,
  }
}

function toBanglaDigits(num: number): string {
  const map = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"]
  return String(num).replace(/\d/g, (d) => map[Number(d)] || d)
}

function buildStoreProductListStatement(products: TrainedProduct[], honorific: string): string {
  const inStockList = products.filter((p) => p.stockStatus !== "OUT_OF_STOCK")
  const list = inStockList.length > 0 ? inStockList : products

  if (list.length === 1) {
    const p = list[0]
    return `আমাদের কাছে একটি প্রোডাক্ট আছে — "${p.name}" (অফার প্রাইজ: ${p.offerPrice}${
      p.regularPrice ? `, রেগুলার প্রাইজ: ${p.regularPrice}` : ""
    })। আপনি কি এটি নিতে চান ${honorific}?`
  }

  const numberedItems = list
    .map((p, idx) => `${toBanglaDigits(idx + 1)}. ${p.name} (অফার প্রাইজ: ${p.offerPrice})`)
    .join(" ")
  return `আমাদের কাছে ${toBanglaDigits(list.length)}টি প্রোডাক্ট আছে — ${numberedItems}। আপনি কোনটা নিতে চান ${honorific}?`
}

function extractUnmatchedProductQuery(rawMsg: string): string | null {
  const asksAvailability =
    /\b(ache|ase|acche|asce|pawa|paoya|available|thakbe|thake|bikri|sell|আছে|পাওয়া|পাওয়া|থাকবে|থাকে|বিক্রি)\b/i.test(
      rawMsg
    )
  if (!asksAvailability) return null

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
    "কালার", "রঙ", "সাইজ", "বক্স", "বক্সে", "সাথে", "বেল্ট", "স্ট্র্যাপ", "বিক্রি", "করেন", "ছবি", "ভিডিও", "শোরুম", "দোকান", "কোথায়", "কোথায়",
  ])

  const tokens = (rawMsg || "")
    .replace(/[?!.,।'"()[\]{}:;]+/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !fillerWords.has(t.toLowerCase()))

  if (tokens.length === 0 || tokens.length > 4) return null
  const candidate = tokens.join(" ")
  if (candidate.length < 2 || candidate.length > 35) return null
  return candidate
}

export function generatePreviewTrainedAnswer(
  rawMsg: string,
  customerName: string,
  products: TrainedProduct[],
  storeProfile: StoreKnowledgeProfile,
  conversationHistory: ChatMessage[] = []
): string {
  const cleanRaw = (rawMsg || "").trim()
  const lower = cleanRaw.toLowerCase()
  const { honorific, firstTurnAddress } = getHumanAddress(customerName)

  const historyList = Array.isArray(conversationHistory) ? conversationHistory : []
  let lastCustomerStartIdx = historyList.length
  for (let i = historyList.length - 1; i >= 0; i--) {
    if (historyList[i].sender === "CUSTOMER") {
      lastCustomerStartIdx = i
    } else if (lastCustomerStartIdx < historyList.length) {
      break
    }
  }
  const priorMessages = historyList.slice(0, lastCustomerStartIdx)
  const allAiMessages = historyList.filter((m) => m.sender === "AI_ASSISTANT" || m.sender === "PAGE")
  const priorAiMessages = priorMessages.filter((m) => m.sender === "AI_ASSISTANT" || m.sender === "PAGE")
  const hasAlreadyGreeted = allAiMessages.length > 0
  const turnIndex = Math.max(priorAiMessages.length, allAiMessages.length)
  const lastAiText = priorAiMessages.length > 0 ? priorAiMessages[priorAiMessages.length - 1].text || "" : ""
  const recentlyAskedOrderInfo =
    lastAiText.includes("নাম, পূর্ণ ঠিকানা") ||
    lastAiText.includes("নাম, ঠিকানা ও মোবাইল") ||
    lastAiText.includes("মোবাইল নম্বর")
  const alreadyMentionedPrice = priorAiMessages.some(
    (m) => (m.text || "").includes("টাকা") || (m.text || "").includes("প্রাইজ")
  )

  const followUpOpeners = [`জি ${honorific},`, `হ্যাঁ ${honorific},`, `অবশ্যই ${honorific},`, `${honorific},`]
  const naturalOpener = hasAlreadyGreeted
    ? followUpOpeners[turnIndex % followUpOpeners.length]
    : `আসসালামু আলাইকুম ${firstTurnAddress}!`

  const phoneMatch = cleanRaw.match(/(?:\+?88)?01[3-9]\d{8}/)
  if (phoneMatch) {
    return `অসংখ্য ধন্যবাদ ${firstTurnAddress}! আপনার মোবাইল নম্বর (${phoneMatch[0]}) ও অর্ডারের তথ্য আমরা নোট করে নিয়েছি। আমাদের প্রতিনিধি খুব দ্রুত কল করে অর্ডারটি কনফার্ম করবেন। (${storeProfile.deliveryTime})। 😊`
  }

  function findProductInText(searchStr: string): TrainedProduct | null {
    const sLower = (searchStr || "").toLowerCase()
    for (const prod of products) {
      const nameTokens = [prod.name || ""]
        .concat((prod.keywords || "").split(","))
        .map((k) => k.trim().toLowerCase())
        .filter((k) => k.length >= 2)
      if (nameTokens.some((tok) => sLower.includes(tok))) {
        return prod
      }
    }
    return null
  }

  const matchedInCurrentMsg = findProductInText(cleanRaw)
  let matchedProduct = matchedInCurrentMsg
  if (!matchedProduct && historyList.length > 0) {
    for (let i = historyList.length - 1; i >= 0; i--) {
      const found = findProductInText(historyList[i].text || "")
      if (found) {
        matchedProduct = found
        break
      }
    }
  }

  const primaryProduct =
    matchedProduct || products.find((p) => p.isDefaultProduct) || products[0] || DEFAULT_TRAINED_PRODUCTS[0]

  const numberSelectionMatch = cleanRaw.match(
    /^(?:([1-9])|([১-৯])|(প্রথমটা|প্রথম|first)|(দ্বিতীয়টা|দ্বিতীয়টা|second)|(তৃতীয়টা|তৃতীয়টা|third))(?:\s*(?:number|নম্বর|নাম্বার)?(?:\s*ta|\s*টা)?)?\s*[.?!]*$/i
  )
  if (numberSelectionMatch) {
    let idx = 0
    if (numberSelectionMatch[1]) idx = parseInt(numberSelectionMatch[1], 10) - 1
    else if (numberSelectionMatch[2]) idx = "১২৩৪৫৬৭৮৯".indexOf(numberSelectionMatch[2])
    else if (numberSelectionMatch[3]) idx = 0
    else if (numberSelectionMatch[4]) idx = 1
    else if (numberSelectionMatch[5]) idx = 2

    const chosenProd = products[idx]
    if (chosenProd) {
      return `দারুণ পছন্দ ${honorific}! আমাদের "${chosenProd.name}"-এর স্পেশাল অফার প্রাইজ মাত্র ${chosenProd.offerPrice}${
        chosenProd.regularPrice ? ` (রেগুলার প্রাইজ ${chosenProd.regularPrice})` : ""
      }। বিশেষত্ব: ${chosenProd.whyGoodFeatures}। অর্ডারটি কনফার্ম করতে আপনার নাম, পূর্ণ ঠিকানা ও মোবাইল নম্বরটি দিন প্লিজ। 😊`
    }
  }

  const hasSalam = /\b(salam|assalamu|slm|সালাম|আসসালামু)\b/i.test(lower)
  const isPureGreeting =
    /^(hi+|hello+|hlw+|hey+|salam|assalamu alaikum|slm|হাই|হ্যালো|সালাম|আসসালামু আলাইকুম|ভাইয়া|ভাইয়া|ভাই|কেউ আছেন|আছেন)\s*[?!.]*$/i.test(
      cleanRaw
    )
  const isPureAck =
    /^(ok+|okay|accha|acha|hmm+|hm+|thanks|thank you|tnx|dhonnobad|আচ্ছা|ঠিক আছে|ওকে|হুম|ধন্যবাদ|পরে জানাবো|দেখি)\s*[?!.👍😊]*$/i.test(
      cleanRaw
    )

  if (isPureGreeting) {
    return hasSalam
      ? `ওয়ালাইকুম আসসালাম ${firstTurnAddress}! কেমন আছেন? জি বলুন, আপনাকে কীভাবে সহযোগিতা করতে পারি? 😊`
      : `হ্যালো ${firstTurnAddress}! কেমন আছেন? জি বলুন, আমাদের কোন প্রোডাক্টটি সম্পর্কে জানতে চাচ্ছেন? 😊`
  }

  if (isPureAck) {
    return `অসংখ্য ধন্যবাদ ${honorific}! আপনার সুবিধামতো যেকোনো সময় নাম, ঠিকানা ও মোবাইল নম্বর দিলেই আমরা অর্ডারটি প্রসেস করে দেবো। যেকোনো প্রয়োজনে নক দেবেন। 😊`
  }

  const mentionsBoxOrColorWords =
    /\b(box|বক্স|বক্সে|sathe|সাথে|color|colour|কালার|রঙ|strap|belt|বেল্ট|স্ট্র্যাপ|size|সাইজ)\b/i.test(lower)

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
          lower.includes("কী কী আছে"))))

  if (asksAllProductsCatalog) {
    return `জি ${honorific}, ${buildStoreProductListStatement(products, honorific)}`
  }

  if (!matchedInCurrentMsg) {
    const unmatchedItem = extractUnmatchedProductQuery(cleanRaw)
    if (unmatchedItem) {
      return `না ${honorific}, আমাদের কাছে ${unmatchedItem} নেই। ${buildStoreProductListStatement(
        products,
        honorific
      )}`
    }
  }

  if (primaryProduct.stockStatus === "OUT_OF_STOCK") {
    const alternative = products.find((p) => p.id !== primaryProduct.id && p.stockStatus !== "OUT_OF_STOCK")
    return `${naturalOpener} দুঃখিত, আমাদের "${primaryProduct.name}" প্রোডাক্টটি এই মুহূর্তে স্টক আউট হয়ে গেছে।${
      alternative
        ? ` তবে আমাদের "${alternative.name}" এখন রেডি স্টকে আছে (অফার প্রাইজ: ${alternative.offerPrice})। আপনি চাইলে এটি দেখতে পারেন!`
        : ` নতুন স্টক আসা মাত্রই আমরা আপনাকে জানাবো ইনশাআল্লাহ।`
    }`
  }

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
    lower.includes("কালকে পাব")

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
    lower.includes("check kore")

  const asksSuitabilityKids =
    lower.includes("baccha") ||
    lower.includes("chutto") ||
    lower.includes("choto") ||
    lower.includes("kids") ||
    lower.includes("baby") ||
    lower.includes("boyos") ||
    lower.includes("বাচ্চা") ||
    lower.includes("ছোট") ||
    lower.includes("বয়স")

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
    lower.includes("গিফট")

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
    lower.includes("লাস্ট প্রাইজ")

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
    /\b(koto|pp)\b/i.test(lower)

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
    /\b(ache|ase)\b/i.test(lower)

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
      lower.includes("sathe ki"))

  const asksWaterproof =
    lower.includes("waterproof") ||
    lower.includes("water") ||
    lower.includes("pani") ||
    lower.includes("vije") ||
    lower.includes("ওয়াটারপ্রুফ") ||
    lower.includes("পানি") ||
    lower.includes("ভিজে")

  const asksBattery =
    lower.includes("battery") ||
    lower.includes("charge") ||
    lower.includes("backup") ||
    lower.includes("ব্যাটারি") ||
    lower.includes("চার্জ") ||
    lower.includes("ব্যাকআপ")

  const asksCallingOrConnect =
    lower.includes("call") ||
    lower.includes("kotha bola") ||
    lower.includes("bluetooth") ||
    lower.includes("connect") ||
    lower.includes("android") ||
    lower.includes("iphone") ||
    lower.includes("কল করা") ||
    lower.includes("কথা বলা") ||
    lower.includes("কানেক্ট")

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
    lower.includes("kemon")

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
    lower.includes("replace")

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
    lower.includes("address")

  const asksPhotoOrVideo =
    lower.includes("chobi") ||
    lower.includes("pic") ||
    lower.includes("photo") ||
    lower.includes("video") ||
    lower.includes("ছবি") ||
    lower.includes("পিক") ||
    lower.includes("ভিডিও")

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
    lower.includes("কিভাবে অর্ডার")

  const asksDeclineOrLater =
    lower.includes("ekhon nibo na") ||
    lower.includes("ekhn nibo na") ||
    lower.includes("akhon nibo na") ||
    lower.includes("nibo na") ||
    lower.includes("nebo na") ||
    lower.includes("lagbe na") ||
    lower.includes("dorkar nai") ||
    lower.includes("pore nibo") ||
    lower.includes("pore janabo") ||
    lower.includes("pore dekhi") ||
    lower.includes("chinta kore") ||
    lower.includes("vebe dekhi") ||
    lower.includes("bhebe dekhi") ||
    lower.includes("taka nai") ||
    lower.includes("budget nai") ||
    lower.includes("এখন নিবো না") ||
    lower.includes("এখন নিব না") ||
    lower.includes("নিবো না") ||
    lower.includes("নিব না") ||
    lower.includes("লাগবে না") ||
    lower.includes("দরকার নেই") ||
    lower.includes("পরে নিবো") ||
    lower.includes("পরে নিব") ||
    lower.includes("পরে জানাবো") ||
    lower.includes("ভেবে দেখি") ||
    /\b(not now|maybe later|dont want|don't want|no need)\b/i.test(lower)

  if (asksDeclineOrLater) {
    return `আচ্ছা ${honorific}, কোনো সমস্যা নেই! 😊 আপনার যখন সুবিধা হয় বা প্রয়োজন পড়ে, তখনই আমাদের নক দিয়েন। ভালো থাকবেন!`
  }

  const asksIfAiOrBot =
    /\b(ai|bot|robot|chatgpt|gpt|auto reply|autoreply)\b/i.test(lower) ||
    lower.includes("tumi ki ai") ||
    lower.includes("apni ki ai") ||
    lower.includes("tumi ke") ||
    lower.includes("apni ke") ||
    lower.includes("manush naki") ||
    lower.includes("তুমি কি এআই") ||
    lower.includes("আপনি কি এআই") ||
    lower.includes("রোবট") ||
    lower.includes("বট নাকি") ||
    lower.includes("মানুষ নাকি") ||
    lower.includes("অটো রিপ্লাই") ||
    lower.includes("তুমি কে") ||
    lower.includes("আপনি কে")

  if (asksIfAiOrBot) {
    return `না ${honorific}, আমি পেজের কাস্টমার সাপোর্ট মডারেটর বলছি! 😊 আপনার মেসেজের দ্রুত রিপ্লাই দেওয়ার চেষ্টা করছি। কোনো বিষয়ে জানার থাকলে নির্দ্বিধায় বলতে পারেন ${honorific}।`
  }

  const asksWellBeing =
    lower.includes("kemon achen") ||
    lower.includes("kemon asen") ||
    lower.includes("kmn achen") ||
    lower.includes("kmn asen") ||
    lower.includes("kemon acho") ||
    lower.includes("ki khobor") ||
    lower.includes("ki obostha") ||
    lower.includes("কেমন আছেন") ||
    lower.includes("কেমন আছো") ||
    lower.includes("কি খবর") ||
    lower.includes("কী খবর") ||
    lower.includes("কি অবস্থা") ||
    /\b(how are you|whats up|what's up)\b/i.test(lower)

  if (asksWellBeing) {
    return `আলহামদুলিল্লাহ ${honorific}, ভালো আছি! আপনি কেমন আছেন? আমাদের কোনো প্রোডাক্ট সম্পর্কে কিছু জানার থাকলে বলুন ${honorific}। 😊`
  }

  const mentionsCustomerArea =
    /\b(dhaka|dhakay|mirpur|uttara|dhanmondi|mohammadpur|banani|gulshan|badda|jatrabari|savar|gazipur|narayanganj|chittagong|ctg|sylhet|rajshahi|khulna|barisal|rangpur|comilla|cumilla|bogra|mymensingh|ঢাকা|ঢাকায়|মিরপুর|উত্তরা|ধানমন্ডি|চট্টগ্রাম|সিলেট|রাজশাহী|খুলনা|গাজীপুর|নারায়ণগঞ্জ)\b/i.test(
      lower
    )

  const replySegments: string[] = []
  let followUpQuestion = ""

  if (asksSuitabilityGeneral) {
    if (asksSuitabilityKids) {
      replySegments.push(
        `অবশ্যই ব্যবহার করতে পারবে! এটার সাথে অ্যাডজাস্টেবল নরম সিলিকন স্ট্র্যাপ দেওয়া থাকে, তাই ছোট বা বড় যে কারো হাতেই খুব সুন্দরভাবে ফিট হয়। আর ঘড়িটা বেশ হালকা ও আরামদায়ক হওয়ায় ছোট বাচ্চারাও খুব সহজে পরতে পারবে। 😊`
      )
    } else if (lower.includes("meye") || lower.includes("মেয়ে") || lower.includes("gift") || lower.includes("গিফট")) {
      replySegments.push(
        `ছেলে-মেয়ে উভয়েই এটি খুব সুন্দরভাবে পরতে পারবেন এবং প্রিমিয়াম বক্স প্যাকেজিং থাকায় গিফট দেওয়ার জন্যও এটি একদম পারফেক্ট! 👌`
      )
    } else {
      replySegments.push(
        `এটি যেকোনো বয়সের মানুষ খুব আরামে ব্যবহার করতে পারবেন, কারণ সাথে অ্যাডজাস্টেবল স্ট্র্যাপ দেওয়া আছে যা যেকোনো হাতে সুন্দরভাবে ফিট হয়।`
      )
    }
  }

  if (asksDeliveryTime) {
    replySegments.push(
      `এখন অর্ডার কনফার্ম করলে ${storeProfile.deliveryTime} ইনশাআল্লাহ। আর ডেলিভারি ম্যানের সামনে প্রোডাক্ট হাতে পেয়ে চেক করে এরপর পেমেন্ট করতে পারবেন।`
    )
    if (!mentionsCustomerArea) {
      followUpQuestion = `আপনি কি ঢাকার ভেতরে নিবেন নাকি ঢাকার বাইরে ${honorific}?`
    }
  }

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
      )
    } else {
      replySegments.push(`${storeProfile.deliveryPolicy} (${storeProfile.deliveryTime})।`)
    }
  }

  if (asksBargain) {
    replySegments.push(
      `এটার রেগুলার প্রাইজ তো ${primaryProduct.regularPrice || "৩,৯৯০ টাকা"}, আমরা অলরেডি ডিসকাউন্ট দিয়ে একদম স্পেশাল অফার প্রাইজে মাত্র ${primaryProduct.offerPrice}-এ দিচ্ছি, সাথে ফ্রি হোম ডেলিভারিও থাকছে! প্রোডাক্টটা হাতে পেলেই কোয়ালিটি দেখে আপনার ভালো লাগবে ইনশাআল্লাহ। 😊`
    )
  } else if (asksPrice && !asksStock) {
    replySegments.push(
      primaryProduct.regularPrice
        ? `"${primaryProduct.name}"-এর রেগুলার প্রাইজ ${primaryProduct.regularPrice}, তবে এখন অফারে পাচ্ছেন মাত্র ${primaryProduct.offerPrice}-এ (সাথে সারাদেশে ফ্রি হোম ডেলিভারি)!`
        : `"${primaryProduct.name}"-এর স্পেশাল অফার প্রাইজ পরবে মাত্র ${primaryProduct.offerPrice} (ফ্রি হোম ডেলিভারি)!`
    )
  }

  if (asksStock) {
    const stockNote =
      primaryProduct.stockStatus === "LIMITED_STOCK"
        ? `হ্যাঁ, আমাদের "${primaryProduct.name}" এখন সীমিত স্টকে এভেইলেবল আছে।`
        : `হ্যাঁ, আমাদের "${primaryProduct.name}" এখন রেডি স্টকে আছে।`
    const priceAddon = !alreadyMentionedPrice
      ? ` স্পেশাল অফার প্রাইজ মাত্র ${primaryProduct.offerPrice}${
          primaryProduct.regularPrice ? ` (রেগুলার প্রাইজ ${primaryProduct.regularPrice})` : ""
        }।`
      : ""
    replySegments.push(`${stockNote}${priceAddon}`)
    if (!followUpQuestion) {
      followUpQuestion = `আপনি কি অর্ডার করতে চাচ্ছেন ${honorific}?`
    }
  }

  if (asksVariants && primaryProduct.variantsAndContents) {
    replySegments.push(`${primaryProduct.variantsAndContents}।`)
    if (!followUpQuestion) {
      followUpQuestion = `আপনি কোন কালারটি নিতে চাচ্ছেন ${honorific}?`
    }
  }

  if (asksWhyGood) {
    if (asksWaterproof && !asksBattery && !asksCallingOrConnect) {
      replySegments.push(
        `এটি ১০০% IP68 ওয়াটারপ্রুফ! তাই হাত ধোয়া, বৃষ্টি বা ঘামের পানিতে কোনো সমস্যাই হবে না ইনশাআল্লাহ।`
      )
    } else if (asksBattery && !asksWaterproof && !asksCallingOrConnect) {
      replySegments.push(
        `এটার ব্যাটারি ব্যাকআপ খুবই ভালো — একবার ফুল চার্জ দিলে রেগুলার ইউজে ৫-৭ দিন অনায়াসে চলে যাবে, আর সাথে ওয়্যারলেস ম্যাগনেটিক চার্জারও থাকছে।`
      )
    } else if (asksCallingOrConnect && !asksWaterproof && !asksBattery) {
      replySegments.push(
        `যেকোনো Android বা iPhone-এর সাথে ব্লুটুথ দিয়ে কানেক্ট করে ঘড়ি থেকেই সরাসরি কল রিসিভ ও কথা বলা যাবে, এবং সব নোটিফিকেশনও দেখা যাবে! 🔥`
      )
    } else if (primaryProduct.whyGoodFeatures) {
      replySegments.push(
        `নিশ্চিন্তে নিতে পারেন! ${primaryProduct.whyGoodFeatures}। তাছাড়া ডেলিভারি ম্যানের সামনে চেক করে নেওয়ার সুবিধা তো থাকছেই।`
      )
    }
  }

  if (asksWarranty && primaryProduct.warrantyInfo) {
    replySegments.push(
      `এই প্রোডাক্টের সাথে পাচ্ছেন ${primaryProduct.warrantyInfo}। তাই যেকোনো সমস্যা হলে সরাসরি আমাদের থেকে রিপ্লেসমেন্ট সুবিধা পাবেন।`
    )
  }

  if (asksPhotoOrVideo) {
    replySegments.push(
      `পোস্টে দেওয়া ছবিগুলো আমাদের নিজেদের প্রোডাক্টেরই রিয়েল ছবি! আর সবচেয়ে বড় সুবিধা হলো ডেলিভারি ম্যানের সামনে বক্স খুলে ঘড়িটি নিজের হাতে দেখে ও চেক করে তারপর টাকা দিতে পারবেন। 😊`
    )
  }

  if (asksLocation) {
    replySegments.push(
      `আমাদের শোরুমের ঠিকানা: ${storeProfile.showroomAddress}। আপনি চাইলে সরাসরি শোরুমে এসেও দেখে নিতে পারেন, অথবা বাসায় বসে ক্যাশ অন ডেলিভারিতেও অর্ডার করতে পারেন (হেল্পলাইন: ${storeProfile.helplineNumber})।`
    )
  }

  if (asksHowToOrder) {
    replySegments.push(
      `অর্ডার করার জন্য শুধু আপনার নাম, সম্পূর্ণ ঠিকানা (থানা ও জেলাসহ) এবং সচল মোবাইল নম্বরটি এখানে লিখে দিন — আমরা এখনই আপনার অর্ডারটি কনফার্ম করে দিচ্ছি! 😊`
    )
  }

  if (replySegments.length === 0 && mentionsCustomerArea) {
    replySegments.push(
      `ওখানে আমাদের দ্রুত হোম ডেলিভারি সার্ভিস চালু আছে (${storeProfile.deliveryTime})! অর্ডারটি বুক করে পাঠানোর জন্য আপনার নাম, সম্পূর্ণ ঠিকানা ও মোবাইল নম্বরটি একটু লিখে দিন প্লিজ। 😊`
    )
  }

  if (replySegments.length === 0) {
    if (!hasAlreadyGreeted) {
      replySegments.push(
        `${buildStoreProductListStatement(catalog)}। আমাদের প্রোডাক্ট বা ডেলিভারি সম্পর্কে কিছু জানতে চাইলে নির্দ্বিধায় বলুন ${honorific}! 😊`
      )
    } else {
      return `জি ${honorific}, বলুন কীভাবে আপনাকে সাহায্য করতে পারি? কোনো প্রোডাক্টের ব্যাপারে জানতে চাইলে বা অর্ডার করতে চাইলে নির্দ্বিধায় বলতে পারেন। 😊`
    }
  } else {
    if (followUpQuestion) {
      replySegments.push(followUpQuestion)
    } else if (
      !recentlyAskedOrderInfo &&
      !asksLocation &&
      !asksSuitabilityGeneral &&
      !asksHowToOrder &&
      (asksPrice || asksBargain)
    ) {
      replySegments.push(`অর্ডার করতে চাইলে আপনার নাম, পূর্ণ ঠিকানা ও মোবাইল নম্বরটি দিন প্লিজ। 😊`)
    }
  }

  return `${naturalOpener} ${replySegments.join(" ")}`.replace(/\s+/g, " ").trim()
}

export function useInboxAssistant() {
  const [conversations, setConversations] = useState<InboxConversation[]>([])
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [products, setProducts] = useState<TrainedProduct[]>(DEFAULT_TRAINED_PRODUCTS)
  const [storeProfile, setStoreProfile] = useState<StoreKnowledgeProfile>(DEFAULT_STORE_PROFILE)
  const [settings, setSettings] = useState<InboxAutomationSettings>(DEFAULT_SETTINGS)
  const [selectedConvId, setSelectedConvId] = useState<string>("fb-live-rasidul-islam-sajib")
  const [isLoaded, setIsLoaded] = useState(false)

  const syncRuntimeToBot = useCallback(
    (payload: {
      mode?: OperatingMode
      isRunning?: boolean
      templates?: MessageTemplate[]
      products?: TrainedProduct[]
      storeProfile?: StoreKnowledgeProfile
    }) => {
      fetch("/api/facebook-bot/inbox-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_RUNTIME",
          ...payload,
        }),
      }).catch(() => {})
    },
    []
  )

  useEffect(() => {
    if (typeof window === "undefined") return

    let loadedProducts = DEFAULT_TRAINED_PRODUCTS
    let loadedStoreProfile = DEFAULT_STORE_PROFILE
    let loadedTemplates = DEFAULT_TEMPLATES
    let loadedSettings = DEFAULT_SETTINGS

    try {
      const savedConvs = localStorage.getItem(STORAGE_KEY_CONVERSATIONS)
      if (savedConvs) {
        const parsed = JSON.parse(savedConvs)
        setConversations(Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CONVERSATIONS)
      } else {
        setConversations(INITIAL_CONVERSATIONS)
      }

      const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS)
      if (savedSettings) {
        loadedSettings = JSON.parse(savedSettings)
        setSettings(loadedSettings)
      }

      const savedTemplates = localStorage.getItem(STORAGE_KEY_TEMPLATES)
      if (savedTemplates) {
        loadedTemplates = JSON.parse(savedTemplates)
        setTemplates(loadedTemplates)
      } else {
        setTemplates(DEFAULT_TEMPLATES)
      }

      const savedProducts = localStorage.getItem(STORAGE_KEY_PRODUCTS)
      if (savedProducts) {
        const parsed = JSON.parse(savedProducts)
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedProducts = parsed
        }
      }
      setProducts(loadedProducts)

      const savedProfile = localStorage.getItem(STORAGE_KEY_STORE_PROFILE)
      if (savedProfile) {
        loadedStoreProfile = { ...DEFAULT_STORE_PROFILE, ...JSON.parse(savedProfile) }
      }
      setStoreProfile(loadedStoreProfile)
    } catch {
      setConversations(INITIAL_CONVERSATIONS)
      setSettings(DEFAULT_SETTINGS)
      setTemplates(DEFAULT_TEMPLATES)
      setProducts(DEFAULT_TRAINED_PRODUCTS)
      setStoreProfile(DEFAULT_STORE_PROFILE)
    }

    setIsLoaded(true)
    syncRuntimeToBot({
      mode: loadedSettings.mode,
      isRunning: loadedSettings.isRunning,
      templates: loadedTemplates,
      products: loadedProducts,
      storeProfile: loadedStoreProfile,
    })
  }, [syncRuntimeToBot])

  const saveConversations = useCallback((newConvs: InboxConversation[]) => {
    setConversations(newConvs)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(newConvs))
    }
  }, [])

  const saveSettings = useCallback((newSettings: InboxAutomationSettings) => {
    setSettings(newSettings)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettings))
    }
  }, [])

  const saveTemplates = useCallback((newTemplates: MessageTemplate[]) => {
    setTemplates(newTemplates)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(newTemplates))
    }
  }, [])

  const saveProducts = useCallback(
    (nextProducts: TrainedProduct[]) => {
      setProducts(nextProducts)
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(nextProducts))
      }
      syncRuntimeToBot({ products: nextProducts })
    },
    [syncRuntimeToBot]
  )

  const saveStoreProfile = useCallback(
    (nextProfile: StoreKnowledgeProfile) => {
      setStoreProfile(nextProfile)
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_STORE_PROFILE, JSON.stringify(nextProfile))
      }
      syncRuntimeToBot({ storeProfile: nextProfile })
    },
    [syncRuntimeToBot]
  )

  const addProduct = useCallback(
    (prod: Omit<TrainedProduct, "id">) => {
      const created: TrainedProduct = {
        ...prod,
        id: `prod-${Date.now()}`,
        isDefaultProduct: products.length === 0 ? true : Boolean(prod.isDefaultProduct),
      }
      const next = created.isDefaultProduct
        ? [created, ...products.map((p) => ({ ...p, isDefaultProduct: false }))]
        : [...products, created]
      saveProducts(next)
      return created
    },
    [products, saveProducts]
  )

  const updateProduct = useCallback(
    (id: string, partial: Partial<TrainedProduct>) => {
      const next = products.map((p) => {
        if (p.id === id) {
          return { ...p, ...partial }
        }
        if (partial.isDefaultProduct) {
          return { ...p, isDefaultProduct: false }
        }
        return p
      })
      saveProducts(next)
    },
    [products, saveProducts]
  )

  const deleteProduct = useCallback(
    (id: string) => {
      const remaining = products.filter((p) => p.id !== id)
      if (remaining.length > 0 && !remaining.some((p) => p.isDefaultProduct)) {
        remaining[0].isDefaultProduct = true
      }
      saveProducts(remaining)
    },
    [products, saveProducts]
  )

  const selectedConversation = useMemo(() => {
    const conv = conversations.find((c) => c.id === selectedConvId) || conversations[0] || null
    if (!conv) return null

    // Find the latest customer message in this conversation to compute live trained AI suggestions
    const customerMsgs = conv.messages.filter((m) => m.sender === "CUSTOMER")
    const latestCustomerText =
      customerMsgs.length > 0
        ? customerMsgs[customerMsgs.length - 1].text
        : conv.lastMessageText || ""

    const dynamicAiReply = generatePreviewTrainedAnswer(
      latestCustomerText,
      conv.customerName,
      products,
      storeProfile,
      conv.messages
    )

    const mergedSuggestions = Array.from(
      new Set([dynamicAiReply, ...(conv.aiSuggestions || [])].filter(Boolean))
    ).slice(0, 2)

    return {
      ...conv,
      aiSuggestions: mergedSuggestions,
    }
  }, [conversations, selectedConvId, products, storeProfile])

  const syncLiveConversations = useCallback((incoming: InboxConversation[]) => {
    if (!Array.isArray(incoming) || incoming.length === 0) return
    setConversations((prev) => {
      const existingByCustomer = new Map<string, InboxConversation>()
      prev.forEach((existing) => {
        existingByCustomer.set(existing.customerName.toLowerCase(), existing)
      })

      const mergedMap = new Map<string, InboxConversation>()
      incoming.forEach((inc) => {
        const key = inc.customerName.toLowerCase()
        const existing = existingByCustomer.get(key)
        const cleanIncomingMsgs = (inc.messages || []).filter(
          (m) => m.text && m.text.trim() !== "প্রোডাক্ট সম্পর্কে বিস্তারিত জানতে চাই"
        )

        if (existing) {
          const cleanExistingMsgs = (existing.messages || []).filter(
            (m) => m.text && m.text.trim() !== "প্রোডাক্ট সম্পর্কে বিস্তারিত জানতে চাই"
          )

          let finalMessages = cleanIncomingMsgs
          // Only fallback to merging with existing if incoming is a 1-line sidebar preview AND existing has both CUSTOMER and AI_ASSISTANT bubbles
          const existingHasCustomer = cleanExistingMsgs.some((m) => m.sender === "CUSTOMER")
          if (cleanIncomingMsgs.length <= 1 && cleanExistingMsgs.length > 1 && existingHasCustomer) {
            const seenNorm = new Set(
              cleanExistingMsgs.map((m) => `${m.sender}:${m.text.replace(/\s+/g, " ").trim()}`)
            )
            const appended = [...cleanExistingMsgs]
            for (const msg of cleanIncomingMsgs) {
              const normKey = `${msg.sender}:${msg.text.replace(/\s+/g, " ").trim()}`
              if (!seenNorm.has(normKey)) {
                appended.push(msg)
                seenNorm.add(normKey)
              }
            }
            finalMessages = appended
          }

          mergedMap.set(key, {
            ...existing,
            ...inc,
            messages: finalMessages.length > 0 ? finalMessages : existing.messages,
          })
        } else {
          mergedMap.set(key, {
            ...inc,
            messages: cleanIncomingMsgs.length > 0 ? cleanIncomingMsgs : inc.messages,
          })
        }
      })

      prev.forEach((existing) => {
        const key = existing.customerName.toLowerCase()
        if (!mergedMap.has(key)) {
          mergedMap.set(key, existing)
        }
      })

      const next = Array.from(mergedMap.values())
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(next))
      }
      return next
    })
  }, [])

  const sendReply = useCallback(
    async (convId: string, replyText: string, senderType: "PAGE" | "AI_ASSISTANT" = "PAGE") => {
      let targetCustomerName = ""
      const updated = conversations.map((conv) => {
        if (conv.id === convId) {
          targetCustomerName = conv.customerName
          const newMsg: ChatMessage = {
            id: `m-${Date.now()}`,
            sender: senderType,
            text: replyText,
            timestamp: "Sending to Messenger...",
            status: "PENDING_APPROVAL",
          }

          return {
            ...conv,
            unreadCount: 0,
            status: "WAITING_REPLY" as const,
            lastMessageText: replyText,
            lastMessageTime: "Queueing...",
            messages: [...conv.messages, newMsg],
          }
        }
        return conv
      })

      saveConversations(updated)

      if (targetCustomerName) {
        try {
          await fetch("/api/facebook-bot/inbox-assistant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "SEND_REPLY",
              customerName: targetCustomerName,
              replyText,
            }),
          })
        } catch {}
      }
    },
    [conversations, saveConversations]
  )

  const toggleRunning = useCallback(() => {
    const nextRunning = !settings.isRunning
    const next = { ...settings, isRunning: nextRunning }
    saveSettings(next)
    syncRuntimeToBot({ isRunning: nextRunning })
  }, [settings, saveSettings, syncRuntimeToBot])

  const setOperatingMode = useCallback(
    (mode: OperatingMode) => {
      const next = { ...settings, mode }
      saveSettings(next)
      syncRuntimeToBot({ mode })
    },
    [settings, saveSettings, syncRuntimeToBot]
  )

  const setCategoryStyle = useCallback(
    (category: ConversationCategory) => {
      saveSettings({
        ...settings,
        activeCategory: category,
      })
    },
    [settings, saveSettings]
  )

  const updateHumanDelay = useCallback(
    (seconds: number) => {
      saveSettings({
        ...settings,
        humanDelaySeconds: seconds,
      })
    },
    [settings, saveSettings]
  )

  const addTemplate = useCallback(
    (template: Omit<MessageTemplate, "id">) => {
      const newTpl: MessageTemplate = {
        ...template,
        title: sanitizeText(template.title),
        content: sanitizeText(template.content),
        id: `tpl-${Date.now()}`,
      }
      const next = [...templates, newTpl]
      saveTemplates(next)
      syncRuntimeToBot({ templates: next })
    },
    [templates, saveTemplates, syncRuntimeToBot]
  )

  const deleteTemplate = useCallback(
    (id: string) => {
      const next = templates.filter((t) => t.id !== id)
      saveTemplates(next)
      syncRuntimeToBot({ templates: next })
    },
    [templates, saveTemplates, syncRuntimeToBot]
  )

  const metrics = useMemo(() => {
    const totalConvs = conversations.length
    const waitingReply = conversations.filter((c) => c.status === "WAITING_REPLY").length
    const totalReplied = conversations.filter((c) => c.status === "REPLIED").length
    const autoRepliedCount = conversations.reduce((acc, c) => {
      return acc + c.messages.filter((m) => m.sender === "AI_ASSISTANT").length
    }, 0)

    return {
      totalConvs,
      waitingReply,
      totalReplied,
      autoRepliedCount,
      avgResponseTime: `< ${settings.humanDelaySeconds || 4} sec`,
    }
  }, [conversations, settings.humanDelaySeconds])

  return {
    isLoaded,
    conversations,
    selectedConversation,
    setSelectedConvId,
    templates,
    products,
    storeProfile,
    settings,
    metrics,
    sendReply,
    syncLiveConversations,
    toggleRunning,
    setOperatingMode,
    setCategoryStyle,
    updateHumanDelay,
    addTemplate,
    deleteTemplate,
    addProduct,
    updateProduct,
    deleteProduct,
    saveStoreProfile,
  }
}
