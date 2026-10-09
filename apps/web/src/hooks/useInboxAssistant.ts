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

const STORAGE_KEY_CONVERSATIONS = "bmt_inbox_conversations_v4"
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
    unreadCount: 1,
    lastMessageText: "Premium Smart Watch Ultra X9 — eta ki ache?",
    lastMessageTime: "10:17",
    status: "WAITING_REPLY",
    aiSuggestions: [
      'আসসালামু আলাইকুম Rasidul Islam Sajib! জি, আমাদের "Premium Smart Watch Ultra X9" বর্তমানে স্টকে এভেইলেবল আছে (স্পেশাল অফার প্রাইজ মাত্র ২,৪৯০ টাকা, রেগুলার প্রাইজ ৩,৯৯০ টাকা)। সারাদেশে ফ্রি ক্যাশ অন হোম ডেলিভারি। অর্ডার কনফার্ম করতে আপনার নাম, পূর্ণ ঠিকানা ও মোবাইল নম্বর দিন।',
    ],
    messages: [
      {
        id: "m-live-0-reply",
        sender: "AI_ASSISTANT",
        text: "আসসালামু আলাইকুম! আমাদের প্রিমিয়াম ওয়াচটির রেগুলার মূল্য ৩,৯৯০ টাকা, তবে ঈদ ধামাকা অফারে পাচ্ছেন মাত্র ২,৪৯০ টাকায় (সারাদেশে ফ্রি ক্যাশ অন ডেলিভারি)! অর্ডার করতে এখনই আপনার নাম, পূর্ণ ঠিকানা ও মোবাইল নম্বর দিন।",
        timestamp: "Yesterday",
        status: "SENT",
        graphApiStatus: "SUCCESS_200",
      },
      {
        id: "m-live-1",
        sender: "CUSTOMER",
        text: "ভাইয়া দাম কত?",
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

export function generatePreviewTrainedAnswer(
  rawMsg: string,
  customerName: string,
  products: TrainedProduct[],
  storeProfile: StoreKnowledgeProfile
): string {
  const lower = (rawMsg || "").trim().toLowerCase()
  const cleanName = customerName || "স্যার"

  const phoneMatch = rawMsg.match(/(?:\+?88)?01[3-9]\d{8}/)
  if (phoneMatch) {
    return `অসংখ্য ধন্যবাদ ${cleanName}! আপনার মোবাইল নম্বর (${phoneMatch[0]}) ও অর্ডারের তথ্য আমরা পেয়েছি। আমাদের প্রতিনিধি খুব দ্রুত কল করে আপনার অর্ডারটি কনফার্ম করবেন। (${storeProfile.deliveryTime})। জরুরি প্রয়োজনে কল করুন: ${storeProfile.helplineNumber}।`
  }

  let matchedProduct: TrainedProduct | null = null
  for (const prod of products) {
    const nameTokens = [prod.name || ""]
      .concat((prod.keywords || "").split(","))
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k.length >= 2)
    if (nameTokens.some((tok) => lower.includes(tok))) {
      matchedProduct = prod
      break
    }
  }

  const primaryProduct =
    matchedProduct || products.find((p) => p.isDefaultProduct) || products[0] || DEFAULT_TRAINED_PRODUCTS[0]

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
      lower.includes("list"))

  if (asksAllProductsCatalog) {
    const productLines = products
      .map((p, idx) => {
        const stBadge =
          p.stockStatus === "OUT_OF_STOCK"
            ? "(স্টক আউট)"
            : p.stockStatus === "LIMITED_STOCK"
            ? "(সীমিত স্টক)"
            : "(স্টকে আছে)"
        return `${idx + 1}. ${p.name} — অফার প্রাইজ: ${p.offerPrice} ${stBadge}`
      })
      .join(" | ")
    return `আসসালামু আলাইকুম ${cleanName}! আমাদের বর্তমান প্রোডাক্টসমূহ: ${productLines}। ${storeProfile.deliveryPolicy}। আপনি কোন প্রোডাক্টটি সম্পর্কে বিস্তারিত জানতে বা অর্ডার করতে চান?`
  }

  if (primaryProduct.stockStatus === "OUT_OF_STOCK") {
    const alternative = products.find((p) => p.id !== primaryProduct.id && p.stockStatus !== "OUT_OF_STOCK")
    return `আসসালামু আলাইকুম ${cleanName}! দুঃখিত, আমাদের "${primaryProduct.name}" প্রোডাক্টটি বর্তমানে স্টক আউট (Out of Stock) রয়েছে।${
      alternative
        ? ` তবে আমাদের "${alternative.name}" বর্তমানে স্টকে আছে (অফার প্রাইজ: ${alternative.offerPrice}, ${alternative.whyGoodFeatures})। আপনি চাইলে এটি অর্ডার করতে পারেন!`
        : ` নতুন স্টক আসা মাত্র আমরা আপনাকে জানাবো। যেকোনো তথ্যের জন্য কল করুন: ${storeProfile.helplineNumber}।`
    }`
  }

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
    lower.includes("pp")

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
    lower.includes("ache")

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
    lower.includes("ki ki ache")

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
    lower.includes("kemon")

  const asksWarranty =
    lower.includes("ওয়ারেন্টি") ||
    lower.includes("ওয়ারেন্টি") ||
    lower.includes("গ্যারান্টি") ||
    lower.includes("নষ্ট হলে") ||
    lower.includes("রিপ্লেস") ||
    lower.includes("warranty") ||
    lower.includes("guarantee")

  const asksDelivery =
    lower.includes("ডেলিভারি") ||
    lower.includes("চার্জ") ||
    lower.includes("কুরিয়ার") ||
    lower.includes("কুরিয়ার") ||
    lower.includes("কতদিন") ||
    lower.includes("ক্যাশ অন") ||
    lower.includes("delivery") ||
    lower.includes("courier")

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
    lower.includes("address")

  const parts = [`আসসালামু আলাইকুম ${cleanName}!`]
  const hasSpecificIntent =
    asksPrice ||
    asksStock ||
    asksVariants ||
    asksWhyGood ||
    asksWarranty ||
    asksDelivery ||
    asksLocation

  if (asksStock) {
    parts.push(
      primaryProduct.stockStatus === "LIMITED_STOCK"
        ? `জি, আমাদের "${primaryProduct.name}" বর্তমানে সীমিত স্টকে (Limited Stock) এভেইলেবল আছে (${primaryProduct.stockQuantityText || "দ্রুত অর্ডার করুন"})।`
        : `জি, আমাদের "${primaryProduct.name}" বর্তমানে স্টকে এভেইলেবল আছে (${primaryProduct.stockQuantityText || "রেডি স্টক"})।`
    )
  }

  if (asksPrice) {
    parts.push(
      primaryProduct.regularPrice
        ? `"${primaryProduct.name}"-এর রেগুলার প্রাইজ ${primaryProduct.regularPrice}, তবে বর্তমানে স্পেশাল অফার প্রাইজ মাত্র ${primaryProduct.offerPrice}!`
        : `"${primaryProduct.name}"-এর স্পেশাল অফার প্রাইজ মাত্র ${primaryProduct.offerPrice}!`
    )
  }

  if (asksVariants && primaryProduct.variantsAndContents) {
    parts.push(`যা যা থাকছে: ${primaryProduct.variantsAndContents}।`)
  }

  if (asksWhyGood && primaryProduct.whyGoodFeatures) {
    parts.push(`কেন এটি সেরা: ${primaryProduct.whyGoodFeatures}।`)
  }

  if (asksWarranty && primaryProduct.warrantyInfo) {
    parts.push(`ওয়ারেন্টি সুবিধা: ${primaryProduct.warrantyInfo}।`)
  }

  if (asksDelivery) {
    parts.push(`ডেলিভারি তথ্য: ${storeProfile.deliveryPolicy} (${storeProfile.deliveryTime})।`)
  }

  if (asksLocation) {
    parts.push(`আমাদের শোরুমের ঠিকানা: ${storeProfile.showroomAddress}। হেল্পলাইন: ${storeProfile.helplineNumber}।`)
  }

  if (!hasSpecificIntent) {
    parts.push(
      `আমাদের "${primaryProduct.name}" বর্তমানে স্টকে আছে। স্পেশাল অফার প্রাইজ মাত্র ${primaryProduct.offerPrice}${
        primaryProduct.regularPrice ? ` (রেগুলার প্রাইজ ${primaryProduct.regularPrice})` : ""
      }। বিশেষত্ব: ${primaryProduct.whyGoodFeatures}।`
    )
  } else if (!asksDelivery && !asksLocation) {
    parts.push(`${storeProfile.deliveryPolicy}।`)
  }

  if (!asksLocation) {
    parts.push(`অর্ডার কনফার্ম করতে আপনার নাম, পূর্ণ ঠিকানা ও মোবাইল নম্বর দিন।`)
  }

  return parts.join(" ")
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
      storeProfile
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
          if (cleanIncomingMsgs.length < cleanExistingMsgs.length) {
            // Preserve earlier thread history and append any newly detected messages
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
