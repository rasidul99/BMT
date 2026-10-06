"use client"

import React, { useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAssetLibrary, LibraryAsset } from "../../../../../hooks/useAssetLibrary"
import { AssetLibraryPickerModal } from "../../../../../components/post-scheduler/AssetLibraryPickerModal"
import {
  Sparkles,
  Wand2,
  FolderPlus,
  CalendarClock,
  Copy,
  Check,
  Download,
  Key,
  ChevronRight,
  TrendingUp,
  Zap,
  Heart,
  ShieldCheck,
  Smile,
  BookOpen,
  Film,
  Smartphone,
  Vote,
  FileText,
  ImageIcon,
  Video,
  Edit3,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Share2,
  Award,
  UploadCloud,
  X,
  Trash2,
  Eye,
  Loader2,
} from "lucide-react"

export type SchedulerCompatibleFormat = "Text" | "Image" | "Video" | "Reel" | "Story" | "Poll" | "Post" | "Group Share"

interface VariationItem {
  id: string
  tone: "Curiosity" | "Urgency" | "Emotional" | "Social Proof" | "Storytelling" | "Humorous"
  hookScore: number // 80 - 99
  headline: string
  body: string
  hashtags: string
  cta: string
  format: SchedulerCompatibleFormat
  language: "Bengali" | "English" | "Banglish"
  isEdited?: boolean
}

export default function SafeAIVariationsPage() {
  const router = useRouter()
  const params = useParams()
  const workspaceId = (params?.id as string) || "workspace-1"
  const { addAsset } = useAssetLibrary()

  // Input Studio State
  const [productName, setProductName] = useState("Premium Wireless Smartwatch Pro (AMOLED)")
  const [keyBenefits, setKeyBenefits] = useState(
    "AMOLED Display, 7 Days Battery Life, Bluetooth Calling, 100+ Sports Modes, IP68 Waterproof, 1 Year Official Warranty"
  )
  const [category, setCategory] = useState("Gadgets & Electronics")
  const [targetFormat, setTargetFormat] = useState<SchedulerCompatibleFormat>("Image")
  const [language, setLanguage] = useState<"Bengali" | "English" | "Banglish">("Bengali")
  const [selectedTones, setSelectedTones] = useState<string[]>([
    "Curiosity",
    "Urgency",
    "Social Proof",
    "Storytelling",
  ])
  const [variationCount, setVariationCount] = useState<number>(4)
  const [mediaUrl, setMediaUrl] = useState(
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop"
  )

  // Media & Asset Library Integration State
  const [showLibraryPicker, setShowLibraryPicker] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Custom API Key Drawer
  const [showApiKeyDrawer, setShowApiKeyDrawer] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [apiKeySaved, setApiKeySaved] = useState(false)

  // Status & Feedback
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [savedToLibraryIds, setSavedToLibraryIds] = useState<string[]>([])
  const [bulkSaveNotice, setBulkSaveNotice] = useState<string | null>(null)

  // Generated Variations State (Zero Emojis)
  const [variations, setVariations] = useState<VariationItem[]>([
    {
      id: "var-1",
      tone: "Curiosity",
      hookScore: 98,
      headline: "কপি ঘড়ির ভিড়ে আসল প্রিমিয়াম এক্সপেরিয়েন্স! একবার স্ক্রিনে চোখ রাখুন:",
      body: "বাজারে হাজারো কপি ঘড়ির ভিড়ে আসল কোয়ালিটি চেনা এখন সত্যি কঠিন। কিন্তু এই স্মার্টওয়াচে আপনি পাচ্ছেন:\n\n✦ ক্রিস্টাল ক্লিয়ার AMOLED অলওয়েজ-অন ডিসপ্লে\n✦ টানা ৭ দিনের ব্যাটারি ব্যাকআপ\n✦ লাউড ও ক্লিয়ার ব্লুটুথ কলিং\n✦ ১০০+ স্পোর্টস ও প্রফেশনাল হেলথ ট্র্যাকার\n✦ ১ বছরের অফিশিয়াল রিপ্লেসমেন্ট ওয়ারেন্টি\n\nকোনো অগ্রিম পেমেন্ট ছাড়াই সারা দেশে ক্যাশ অন ডেলিভারিতে চেক করে রিসিভ করার সুযোগ!",
      hashtags: "#SmartwatchBD #TechLoversBD #GadgetReview #AmoledDisplay #PhotoPost",
      cta: "অফার প্রাইসে আজই অর্ডার করতে ভিজিট করুন: https://bmt.link/smartwatch-offer",
      format: "Image",
      language: "Bengali",
    },
    {
      id: "var-2",
      tone: "Urgency",
      hookScore: 96,
      headline: "আর মাত্র ২৪ ঘণ্টা! স্টক প্রায় শেষ—৪০% স্পেশাল ফ্ল্যাশ সেল!",
      body: "ছবিতে দেখতে পাচ্ছেন আমাদের প্রিমিয়াম AMOLED স্মার্টওয়াচের রিয়েল লুক। স্টক দ্রুত ফুরিয়ে যাচ্ছে। আর মাত্র ১৫টি পিস অবশিষ্ট রয়েছে!\n\n✦ সাথে পাচ্ছেন ১ বছরের অফিশিয়াল ওয়ারেন্টি\n✦ সারা বাংলাদেশে ফ্রি ক্যাশ অন ডেলিভারি\n✦ প্রোডাক্ট হাতে পেয়ে দেখে মূল্য পরিশোধের সুবিধা!",
      hashtags: "#FlashSaleBD #EidOffer #LimitedStock #DiscountDeals #OnlineShoppingBD",
      cta: "ক্যাশ অন ডেলিভারিতে অর্ডার করতে এখনই ইনবক্স করুন অথবা লিংকে যান: https://bmt.link/smartwatch-offer",
      format: "Image",
      language: "Bengali",
    },
    {
      id: "var-3",
      tone: "Social Proof",
      hookScore: 94,
      headline: "'এত কম দামে এমন প্রিমিয়াম AMOLED ডিসপ্লে সত্যি আশা করিনি!' - তানভীর ভাই (ধানমন্ডি)",
      body: "ইতিমধ্যেই ৫,০০০+ হ্যাপি কাস্টমার তাদের দৈনন্দিন লাইফস্টাইল আপগ্রেড করেছেন এই স্মার্টওয়াচ দিয়ে। ক্রিস্টাল ক্লিয়ার কলিং, নির্ভুল হার্ট-রেট মনিটর আর প্রিমিয়াম মেটাল ফিনিশ—সব মিলিয়ে এটি এই সিজনের সেরা বেস্টসেলার। গ্রাহকদের রিভিউ এবং আনবক্সিং ভিডিও দেখতে পেজে চোখ রাখুন!",
      hashtags: "#CustomerReview #VerifiedPurchase #HappyClients #BestGadgetBD #BDShoppers",
      cta: "হাজারো সন্তুষ্ট গ্রাহকের দলে যুক্ত হতে এখনই অর্ডার করুন: https://bmt.link/smartwatch-offer",
      format: "Image",
      language: "Bengali",
    },
    {
      id: "var-4",
      tone: "Storytelling",
      hookScore: 95,
      headline: "বাইক চালানোর সময় ফোন রিসিভ করতে গিয়ে রিয়াদ ভাই বড় বিপদে পড়তে যাচ্ছিলেন...",
      body: "হঠাৎ কল আসলে পকেট থেকে ফোন বের করা কতটা ঝুঁকিপূর্ণ তা আমরা অনেকেই জানি। কিন্তু স্মার্টওয়াচে সিঙ্গেল ট্যাপে কল রিসিভ এবং কথা বলার সুবিধা রিয়াদ ভাইয়ের প্রতিদিনের রাইডকে করে তুলেছে ১০০% নিরাপদ ও সহজ। টেকনোলজি যখন জীবনকে সহজ ও নিরাপদ করে, তখনই তা সার্থক!",
      hashtags: "#LifeStory #SmartLiving #SafetyFirst #BikerLifeBD #SmartGadgets",
      cta: "আপনার প্রতিদিনের জীবনকে আরও সহজ করতে আজই সংগ্রহ করুন: https://bmt.link/smartwatch-offer",
      format: "Image",
      language: "Bengali",
    },
  ])

  // Format-Specific High-Converting Content Generator
  const generateContentForFormat = (
    fmt: SchedulerCompatibleFormat,
    tone: string,
    lang: "Bengali" | "English" | "Banglish"
  ) => {
    const brandSlug = productName.toLowerCase().replace(/[^a-z0-9]/g, "-")

    // 1. REEL FORMAT (Viral Facebook Reel Caption & Post Hook)
    if (fmt === "Reel") {
      if (lang === "Bengali") {
        let hook = "আপনি কি জানেন স্মার্টওয়াচ কেনার পর ৯০% মানুষ কেন এই ভুলটি করে আফসোস করেন?"
        let body = `বাজারে সস্তা কপি ঘড়ির ভিড়ে আসল প্রিমিয়াম কোয়ালিটি কেমন হয়, তা রিল ভিডিওতে একবার চোখ রাখলেই বুঝতে পারবেন!\n\n✦ ক্রিস্টাল ক্লিয়ার AMOLED অলওয়েজ-অন ডিসপ্লে\n✦ টানা ৭ দিনের শক্তিশালী ব্যাটারি ব্যাকআপ\n✦ বাইকে বা জ্যামে সিঙ্গেল ট্যাপে ব্লুটুথ কলিং\n✦ সাথে থাকছে ১ বছরের অফিশিয়াল রিপ্লেসমেন্ট ওয়ারেন্টি!\n\nদেরি না করে ভিডিওটি শেষ পর্যন্ত দেখুন এবং নিজের পছন্দের কালারটি বুক করুন!`

        if (tone === "Urgency") {
          hook = "আর মাত্র ২৪ ঘণ্টা বাকি! স্টক দ্রুত শেষ হচ্ছে—৪০% স্পেশাল ফ্ল্যাশ সেল রিল!"
          body = `এমন অবিশ্বাস্য অফার এই সিজনে আর আসবে না! রিল ভিডিওতে দেখতে পাচ্ছেন প্রিমিয়াম AMOLED স্মার্টওয়াচের লাইভ লুক। আর মাত্র ১৫টি পিস অবশিষ্ট আছে।\n\nসারা বাংলাদেশে কোনো অগ্রিম টাকা ছাড়াই ক্যাশ অন ডেলিভারিতে চেক করে রিসিভ করার সুবর্ণ সুযোগ!`
        } else if (tone === "Social Proof") {
          hook = "'এত কম দামে এমন প্রিমিয়াম ডিসপ্লে সত্যি আশা করিনি!' - কাস্টমারদের রিঅ্যাকশন দেখুন"
          body = `ইতিমধ্যেই ৫,০০০+ সন্তুষ্ট ক্রেতা তাদের লাইফস্টাইল আপগ্রেড করেছেন এই স্মার্টওয়াচ দিয়ে। ক্রিস্টাল ক্লিয়ার ব্লুটুথ কলিং, নির্ভুল হেলথ ট্র্যাকার আর ওয়াটারপ্রুফ মেটাল বডি।\n\nগ্রাহকদের কেন এটি এত পছন্দ, তা ভিডিওতে একবার নিজের চোখেই দেখে নিন!`
        } else if (tone === "Storytelling") {
          hook = "বাইক চালানোর সময় ফোন রিসিভ করতে গিয়ে রিয়াদ ভাই বড় বিপদে পড়তে যাচ্ছিলেন... রিলটি দেখুন!"
          body = `ব্যস্ত রাস্তায় পকেট থেকে ফোন বের করা কতটা বিপজ্জনক তা আমরা সবাই জানি। কিন্তু স্মার্টওয়াচে এক ট্যাপে কল রিসিভ করার সুবিধা রিয়াদ ভাইয়ের প্রতিদিনের রাইডকে করেছে ১০০% নিরাপদ।\n\nটেকনোলজি যখন জীবনকে সহজ ও নিরাপদ করে, তখনই তা সেরা। ভিডিওটি দেখুন এবং অফার প্রাইসে আজই সংগ্রহ করুন!`
        } else if (tone === "Emotional") {
          hook = "প্রিয়জনের মুখে এমন প্রাণখোলা হাসি দেখতে কার না ভালো লাগে?"
          body = `উপহার হিসেবে একটি আকর্ষণীয় গ্যাজেটের গুরুত্ব অনেক। ভিডিওতে দেখুন এর প্রিমিয়াম গিফট বক্স আনবক্সিং এবং স্টাইলিশ ফিনিশ। ${keyBenefits} সহ আজই পাঠিয়ে দিন আপনার ভালোবাসার মানুষের ঠিকানায়!`
        }

        const hashtags = `#ReelsBD #TrendingReel #SmartwatchBD #ViralVideo #TechLoversBD #${productName.split(" ")[0]}BD`
        const cta = `অফার প্রাইসে আজই অর্ডার করতে ভিজিট করুন অথবা ইনবক্সে নক দিন: https://bmt.link/${brandSlug}`
        return { headline: hook, body, hashtags, cta }
      } else if (lang === "Banglish") {
        let hook = `Apni ki janen keno sobai ekhon ei ${productName} kinche? Ekbar reel ta dekhun!`
        let body = `Budget price e emon premium build and AMOLED display kokhono pawa jay ni!\n\n✦ 7 Days Battery Backup\n✦ Crystal Clear Bluetooth Calling\n✦ 1 Year Official Warranty\n\nCash on delivery te shara Bangladesh e delivery paben. Quick order confirm korun stock shesh hoyar agei!`
        if (tone === "Urgency") {
          hook = `Stock shob shesh! 40% Discount offer ar matro 24 ghonta!`
          body = `Reel e direct dekhe nin actual look! Matro 15 pcs baki ache. Stock shesh hole offer ar paben na. Cash on delivery te order korte message din!`
        }
        const hashtags = `#ReelsBD #BanglishReels #TrendingGadget #ViralReel`
        const cta = `Order korte inbox korun ba link e click korun: https://bmt.link/${brandSlug}`
        return { headline: hook, body, hashtags, cta }
      } else {
        let hook = `Why is everyone obsessed with the new ${productName}? Watch this reel to see why!`
        let body = `Stop scrolling! Experience the perfect balance of luxury craftsmanship and everyday utility.\n\n✦ Ultra-bright AMOLED display\n✦ 7-day battery life on a single charge\n✦ HD Bluetooth calling & health monitoring\n✦ 1-year official replacement warranty\n\nDon't miss out on our limited-time 40% discount!`
        if (tone === "Urgency") {
          hook = `Flash Sale Alert: Over 80% claimed! Only 15 units left!`
          body = `Watch the sleek unboxing in this reel. Once this batch sells out, regular pricing resumes. Cash on delivery & full official warranty included.`
        }
        const hashtags = `#TrendingReels #ViralVideo #GadgetShowcase #ProductReview`
        const cta = `Tap the link to order yours now: https://bmt.link/${brandSlug}`
        return { headline: hook, body, hashtags, cta }
      }
    }

    // 2. STORY FORMAT (24-Hour Ephemeral / Stickers / Flash Punchy Copy)
    if (fmt === "Story") {
      if (lang === "Bengali") {
        let sticker = `আর মাত্র ১৫টি পিস বাকি! ৪০% অফার দ্রুত শেষ হচ্ছে`
        if (tone === "Curiosity") sticker = `এই সিক্রেট গ্যাজেট ডিলটি অনেকেই জানেন না...`
        else if (tone === "Social Proof") sticker = `৫০০০+ হ্যাপি কাস্টমারের ভেরিফাইড রিভিউ`
        else if (tone === "Storytelling") sticker = `ব্যস্ত জীবনের জন্য ১০০% পারফেক্ট গ্যাজেট`

        const body = `ঈদ উপলক্ষে ${productName} পাচ্ছেন অবিশ্বাস্য বিশেষ ছাড়ে! ${keyBenefits}। শুধুমাত্র আজকের অর্ডারে সারা দেশে ফ্রি ক্যাশ অন ডেলিভারি!`
        const hashtags = `#DailyStory #StoryDeals #FlashOfferBD`
        const cta = `👉 Tap Link Sticker to Order: https://bmt.link/${brandSlug}`
        return { headline: sticker, body, hashtags, cta }
      } else if (lang === "Banglish") {
        const sticker = `Ajker moddhe order e 40% Discount!`
        const body = `${productName} ekhon available! ${keyBenefits}. Cash on delivery te nite swipe up ba sticker link e click korun!`
        const hashtags = `#DailyStory #BanglishStory #DealAlert`
        const cta = `👉 Tap Link Sticker: https://bmt.link/${brandSlug}`
        return { headline: sticker, body, hashtags, cta }
      } else {
        const sticker = `Over 5,000+ sold - Only 15 units left!`
        const body = `Special price drop on ${productName}! Packed with ${keyBenefits}. 100% money-back guarantee & free shipping.`
        const hashtags = `#DailyStory #FlashSale #LimitedDrop`
        const cta = `👉 Tap Link Sticker to Buy: https://bmt.link/${brandSlug}`
        return { headline: sticker, body, hashtags, cta }
      }
    }

    // 3. POLL FORMAT (Interactive Voting / Dilemma / Engagement Question)
    if (fmt === "Poll") {
      if (lang === "Bengali") {
        let q = ""
        if (tone === "Curiosity") q = `[POLL QUESTION] ${productName} কেনার ক্ষেত্রে আপনার কাছে কোন ফিচারটি সবচেয়ে বেশি গুরুত্বপূর্ণ?`
        else if (tone === "Urgency") q = `[VOTING] মাত্র ২৪ ঘণ্টার এই মেগা ডিলে আপনি সবার আগে কোনটি অর্ডার করবেন?`
        else if (tone === "Social Proof") q = `[COMMUNITY POLL] নতুন কোনো গ্যাজেট কেনার আগে আপনি কি কাস্টমার রিভিউ ও রেটিং দেখে সিদ্ধান্ত নেন?`
        else q = `[OPINION POLL] উপহার হিসেবে আপনার প্রিয়জনকে নিচের কোন ফিচারযুক্ত ওয়াচ দেওয়া সেরা?`

        const body = `#1 অপশন A: ক্রিস্টাল ক্লিয়ার ব্লুটুথ কলিং ও লাউডস্পিকার\n#2 অপশন B: ৭ দিনের দীর্ঘস্থায়ী ব্যাটারি ব্যাকআপ\n#3 অপশন C: প্রিমিয়াম AMOLED অলওয়েজ-অন ডিসপ্লে\n#4 অপশন D: ১০০+ স্পোর্টস ও প্রফেশনাল হেলথ ট্র্যাকিং মোড\n\n💬 নিচে আপনার অপশনে ভোট দিন এবং আপনার পছন্দের কারণটি কমেন্টে জানান!`
        const hashtags = `#PollBD #TechDebate #CustomerOpinion #CommunityPoll`
        const cta = `ভোট দিয়ে জয়ী হন বিশেষ ডিসকাউন্ট কুপন: https://bmt.link/${brandSlug}`
        return { headline: q, body, hashtags, cta }
      } else if (lang === "Banglish") {
        const q = `[POLL QUESTION] Gadget er moddhe apnar kache shobcheye important konta?`
        const body = `#1 Option A: Long Battery Life (7 Days+)\n#2 Option B: Crystal Clear Bluetooth Calling\n#3 Option C: AMOLED Display & Premium Look\n#4 Option D: Budget-Friendly Price\n\n💬 Apnar vote din ar comment e janan!`
        const hashtags = `#PollBD #BanglishPoll #TechDebate`
        const cta = `Vote diye jite nin exclusive coupon: https://bmt.link/${brandSlug}`
        return { headline: q, body, hashtags, cta }
      } else {
        const q = `[COMMUNITY POLL] What matters most when choosing your next ${productName}?`
        const body = `#1 Option A: Long-lasting Battery Life (7+ Days)\n#2 Option B: HD Bluetooth Calling & Clear Audio\n#3 Option C: AMOLED Display with Always-On Mode\n#4 Option D: Best Value for Money & Official Warranty\n\n💬 Cast your vote and drop your thoughts in the comments!`
        const hashtags = `#TechPoll #ProductDebate #ConsumerChoice`
        const cta = `Vote & unlock your secret promo code: https://bmt.link/${brandSlug}`
        return { headline: q, body, hashtags, cta }
      }
    }

    // 4. VIDEO FORMAT (High-Converting Facebook Video Post Caption & Hook)
    if (fmt === "Video") {
      if (lang === "Bengali") {
        let headline = `১৫ হাজার টাকার প্রিমিয়াম ফিচার এখন বাজেট প্রাইসেই! দেখুন এই ঘড়ির লাইভ টেস্ট ও আসল পারফরম্যান্স!`
        let body = `স্মার্টওয়াচ কেনার আগে ৯০% মানুষ যে ভুলটি করেন, তা থেকে বাঁচতে সম্পূর্ণ ভিডিও রিভিউটি এক নজরে দেখে নিন! এই ভিডিওতে আমরা সরাসরি টেস্ট করে দেখিয়েছি:\n\n✦ রোদের কড়া আলোতেও ক্রিস্টাল ক্লিয়ার AMOLED অলওয়েজ-অন ডিসপ্লে\n✦ টানা ৭ দিনের রিয়েল ব্যাটারি ব্যাকআপ টেস্ট\n✦ বাইক বা হাঁটার সময় ক্রিস্টাল ক্লিয়ার ব্লুটুথ কলিং ও মাইক কোয়ালিটি\n✦ প্রিমিয়াম মেটাল বিল্ড ও ১ বছরের অফিশিয়াল রিপ্লেসমেন্ট ওয়ারেন্টি\n\nকোনো রকম অগ্রিম পেমেন্ট ছাড়াই সারা দেশে ক্যাশ অন ডেলিভারিতে চেক করে রিসিভ করার সুযোগ! ভিডিওটি ভালো লাগলে শেয়ার করুন এবং অফার প্রাইসে আজই বুক করুন!`

        if (tone === "Urgency") {
          headline = `স্টক শেষ হওয়ার আগেই লাইভ ভিডিওতে দেখে নিন প্রোডাক্টটির আসল কোয়ালিটি ও পারফরম্যান্স!`
          body = `আমাদের মেগা ফ্ল্যাশ সেলে আর মাত্র ১৫টি পিস অবশিষ্ট আছে! যারা এখনো অর্ডার করেননি, তারা ভিডিওটি দেখে সরাসরি কোয়ালিটি নিশ্চিত করে নিতে পারেন।\n\n✦ ৪০% স্পেশাল ফ্ল্যাশ সেল ডিসকাউন্ট\n✦ সাথে থাকছে ১ বছরের অফিশিয়াল ওয়ারেন্টি\n✦ সারা বাংলাদেশে ফ্রি ক্যাশ অন ডেলিভারি সুবিধা\n✦ কোনো অগ্রিম চার্জ ছাড়াই পণ্য দেখে মূল্য পরিশোধের সুযোগ!\n\nদেরি না করে ভিডিওর অফার প্রাইসে আজই বুকিং সম্পন্ন করুন!`
        } else if (tone === "Social Proof") {
          headline = `'দাম অনুযায়ী কোয়ালিটি ১০০ তে ১০০!' - তানভীর ভাইয়ের ভিডিও রিভিউ দেখে সিদ্ধান্ত নিন`
          body = `৫,০০০+ কাস্টমারের মধ্যে ধানমন্ডির তানভীর ভাই গত ১ মাস ধরে এই ঘড়িটি ব্যবহার করছেন। তাঁর বাস্তব অভিজ্ঞতা ও আনবক্সিং ভিডিও আপনাদের সাথে শেয়ার করলাম।\n\nরোদে ডিসপ্লের উজ্জ্বলতা এবং একটানা ৭ দিনের ব্যাটারি লাইফ নিয়ে তানভীর ভাই দারুণ মুগ্ধ। আপনার গ্যাজেট কালেকশনে এমন একটি মাস্টারপিস যোগ করতে এখনই অর্ডার করুন!`
        } else if (tone === "Storytelling") {
          headline = `ব্যস্ত জীবনে একটি গ্যাজেট কীভাবে সময় ও নিরাপত্তা বাঁচাতে পারে? বাস্তব অভিজ্ঞতার ভিডিওটি দেখুন!`
          body = `আমাদের প্রতিদিনের কর্মব্যস্ত জীবনে ছোট ছোট বিষয়গুলো অনেক বড় পার্থক্য তৈরি করে। কল রিসিভ করা থেকে শুরু করে সারাদিনের হেলথ ও স্লিপ মনিটরিং—সবকিছু এক ট্যাপে নিয়ন্ত্রণ করুন।\n\nভিডিওতে দেখুন কীভাবে এই স্মার্টওয়াচটি দৈনন্দিন লাইফস্টাইলকে করে তোলে আরও সহজ ও স্মার্ট! ডেলিভারির সময় সম্পূর্ণ চেক করে নেওয়ার সুযোগ রয়েছে।`
        }

        const hashtags = `#VideoReviewBD #TechReview #GadgetReviewBD #UnboxingBD #BMTMarketing #${productName.split(" ")[0]}BD`
        const cta = `অফিশিয়াল ভিডিও দেখে নিশ্চিন্তে অর্ডার করতে ক্লিক করুন: https://bmt.link/${brandSlug}`
        return { headline, body, hashtags, cta }
      } else if (lang === "Banglish") {
        let headline = `[FULL VIDEO REVIEW] 15 Hajar Takar Feature Budget Price e? Live Test Dekhun!`
        let body = `Kono dhoroner fake kothay kan na diye direct video te dekhe nin product build quality kemon!\n\n✦ AMOLED Display in Direct Sunlight\n✦ HD Bluetooth Calling Sound Test\n✦ 7 Days Long Battery Backup\n✦ 1 Year Official Warranty\n\nCash on delivery te shara Bangladesh e delivery paben. Video ti valo lagle share korun!`
        if (tone === "Urgency") {
          headline = `Stock Shesh Hoyar Agei Live Video te Dekhe Nin Real Look!`
          body = `Flash Sale e matro 15 pcs baki ache! Video dekhe quick booking korun. 1 Year warranty & Cash on delivery available.`
        }
        const hashtags = `#VideoReviewBD #TechReview #BanglishPost #GadgetBD`
        const cta = `Video dekhe order korte click korun: https://bmt.link/${brandSlug}`
        return { headline, body, hashtags, cta }
      } else {
        let headline = `Watch Full Product Test: The Ultimate Flagship Experience on a Budget!`
        let body = `Before buying any gadget, seeing real-world performance is everything. In this video, we put the ${productName} through intensive battery, calling, and display tests:\n\n✦ Crystal-clear AMOLED display performance in outdoor daylight\n✦ Unmatched 7-day battery endurance under heavy usage\n✦ Crisp Bluetooth calling with noise cancellation\n✦ Full 1-year official replacement warranty\n\nWatch till the end and claim your 40% flash discount while stocks last!`
        if (tone === "Urgency") {
          headline = `Limited Batch Drop: Live Video Inspection Before Stock Runs Out!`
          body = `Due to extraordinary demand, only 15 units remain from this import batch. Watch the build quality test in our video and claim yours before midnight!`
        }
        const hashtags = `#ProductShowcase #FullVideoReview #TechUnboxing #GadgetTest`
        const cta = `Watch the full review and order here: https://bmt.link/${brandSlug}`
        return { headline, body, hashtags, cta }
      }
    }

    // 5. TEXT FORMAT (Text Status / Conversational Storytelling / Organic Engagement)
    if (fmt === "Text") {
      if (lang === "Bengali") {
        let headline = `আপনি কি জানেন বাজারে এত স্মার্টওয়াচের ভিড়ে ৯০% মানুষ কেন ভুল করে আফসোস করেন?`
        let body = `বাইক চালাতে গিয়ে অথবা গুরুত্বপূর্ণ মিটিংয়ে ব্যস্ত থাকার সময় বারবার পকেট থেকে ফোন বের করা কতটা বিরক্তিকর ও ঝুঁকিপূর্ণ তা আমরা সবাই বুঝি। অনেকেই ভাবেন একটি ভালো ব্র্যান্ডেড স্মার্টওয়াচ কিনতে বুঝি ১৫-২০ হাজার টাকা লাগবে। কিন্তু আসল সত্যিটা হলো, বাজেট ফ্রেন্ডলি দামেও যদি আপনি ${keyBenefits} পান—তাহলে বাড়তি টাকা খরচ করার কোনো প্রয়োজন নেই।\n\nআপনি যখন প্রথমবার এটি হাতে পরবেন, এর ডিসপ্লে আর প্রিমিয়াম মেটাল ফিনিশ যে কাউকেই ইমপ্রেস করবে। আপনার কি মনে হয়, দৈনন্দিন জীবনে একটি স্মার্টওয়াচ কতটা প্রয়োজনীয়? নিচে কমেন্টে আপনার মতামত জানান!`
        if (tone === "Urgency") {
          headline = `সতর্কবার্তা: প্রিমিয়াম ওয়াচের আজকের স্টক মাত্র আর ১৫টি পিস বাকি!`
          body = `আমরা আশা করিনি এত দ্রুত এই ব্যাচের স্টক শেষ হয়ে যাবে। যারা গত সপ্তাহে অর্ডার করতে পারেননি, তাদের জন্য আজই শেষ সুযোগ।\n\nসরাসরি ১ বছরের ওয়ারেন্টি এবং সারা দেশে কোনো অগ্রিম টাকা ছাড়াই ক্যাশ অন ডেলিভারি সুবিধা থাকছে। স্টক শূন্য হয়ে যাওয়ার পর আগের অফার প্রাইসে আর দেওয়া সম্ভব হবে না।`
        } else if (tone === "Social Proof") {
          headline = `'দাম অনুযায়ী কোয়ালিটি ১০০ তে ১০০!' - ধানমন্ডির তানভীর ভাইয়ের বাস্তব অভিজ্ঞতা`
          body = `তানভীর ভাই গত এক মাস ধরে ঘড়িটি ব্যবহার করছেন। তাঁর অভিজ্ঞতা:\n\n"প্রথমে একটু সংশয়ে ছিলাম, কিন্তু ডেলিভারি পাওয়ার পর দেখলাম ডিসপ্লে আর বিল্ড কোয়ালিটি অবিশ্বাস্য রকমের ভালো। বিশেষ করে ব্লুটুথ কলিং দিয়ে বাইকে কথা বলা খুবই আরামদায়ক।"\n\nইতিমধ্যেই সারা বাংলাদেশ থেকে ৫,০০০+ ক্রেতা যুক্ত হয়েছেন আমাদের হ্যাপি পরিবারে।`
        }
        const hashtags = `#TechDiscussion #OrganicPost #SmartLifeBD #StorytellingBD #BMTMarketing`
        const cta = `বিস্তারিত জানতে ইনবক্স করুন অথবা কমেন্টে জেনে নিন বিশেষ ছাড়ের তথ্য!`
        return { headline, body, hashtags, cta }
      } else if (lang === "Banglish") {
        const headline = `Apni ki janen keno sobai ekhon ei ${productName} kinte chaiche?`
        const body = `Emon sob features ja age kokhono ei budget e pawa jay ni! ${keyBenefits}. Koi ekta din use korlei bujhben daily life koto shohoj hoye jay. Apnar ki mone hoy? Comment e janan!`
        const hashtags = `#TextPost #OrganicBD #TechThought`
        const cta = `Jante message din ba comment e janan!`
        return { headline, body, hashtags, cta }
      } else {
        const headline = `Why 90% of buyers regret their smartwatch choice—and how to avoid it:`
        const body = `Most people overpay for brand logos while getting mediocre battery life. When you get ${keyBenefits} at a fraction of the flagship price, the math speaks for itself.\n\nCrafted for executives, riders, and daily creators who demand reliability without compromise. What feature matters most in your daily routine? Let us know below!`
        const hashtags = `#ProductThoughts #TechTalk #SmartLiving`
        const cta = `Send us a message to claim your exclusive member pricing!`
        return { headline, body, hashtags, cta }
      }
    }

    // 6. GROUP SHARE FORMAT (Community / Peer-to-Peer Review / Non-Salesy Anti-Spam)
    if (fmt === "Group Share") {
      if (lang === "Bengali") {
        let starter = ""
        if (tone === "Curiosity") starter = `গ্রুপের অভিজ্ঞ ভাইদের কাছে একটি সৎ পরামর্শ ও রিভিউ জানতে চাচ্ছি...`
        else if (tone === "Social Proof") starter = `সম্প্রতি এই প্রোডাক্টটি ডেলিভারি পেলাম। অনেস্ট কাস্টমার এক্সপেরিয়েন্স গ্রুপের সাথে শেয়ার করছি:`
        else if (tone === "Storytelling") starter = `একটি ছোট বাস্তব অভিজ্ঞতা গ্রুপের সবার সাথে শেয়ার না করে পারলাম না:`
        else starter = `গ্রুপ মেম্বারদের জন্য একটি ভেরিফাইড ভালো ডিল শেয়ার করলাম—প্রয়োজনে কাজে আসতে পারে:`

        const body = `মার্কেটে অনেক ফেক কপি থাকার কারণে বেশ চিন্তিত ছিলাম। কিন্তু ${keyBenefits} নিজের চোখে টেস্ট করার পর অভিজ্ঞতা খুবই পজিটিভ। কোনো ল্যাগ নেই এবং বিল্ড কোয়ালিটি প্রিমিয়াম। গ্রুপের কেউ কি ইতিমধ্যে এটি ব্যবহার করছেন? আপনাদের এক্সপেরিয়েন্স কেমন? কোনো প্রশ্ন থাকলে কমেন্টে বলতে পারেন!`
        const hashtags = `#GroupDiscussion #GadgetCommunity #RealExperience #UserReview`
        const cta = `গ্রুপের কারো প্রয়োজন হলে তাদের অফিশিয়াল পেইজের লিংক কমেন্টে দিয়ে দিচ্ছি, দেখে নিতে পারেন।`
        return { headline: starter, body, hashtags, cta }
      } else if (lang === "Banglish") {
        const starter = `Group er shobai kemon আছেন? Ekti honest experience share korchi:`
        const body = `Recently ${productName} ta use korchi. ${keyBenefits}. Experience ek kothay outstanding! Group e keu eta use korchen? Apnader review kemon?`
        const hashtags = `#GroupShare #HonestReview #CommunityPost`
        const cta = `Official link dorkar hole comment e die dischi check korte paren.`
        return { headline: starter, body, hashtags, cta }
      } else {
        const starter = `Quick community review & peer feedback for group members:`
        const body = `Recently got my hands on the ${productName}. Wanted to share my honest take: ${keyBenefits}. The build quality is impressive for the price. Anyone else in the group using this? Would love to hear your thoughts!`
        const hashtags = `#GroupDiscussion #PeerReview #ProductFeedback`
        const cta = `I can drop the verified page link in the comments if anyone is interested.`
        return { headline: starter, body, hashtags, cta }
      }
    }

    // 7. DEFAULT: IMAGE FORMAT (Photo Post with Clear Bullet Points & Visual Highlights)
    if (lang === "Bengali") {
      let headline = ""
      let body = ""
      if (tone === "Curiosity") {
        headline = `কপি ঘড়ির ভিড়ে আসল প্রিমিয়াম এক্সপেরিয়েন্স! একবার স্ক্রিনে চোখ রাখুন:`
        body = `বাজারে হাজারো কপি ঘড়ির ভিড়ে আসল কোয়ালিটি চেনা এখন সত্যি কঠিন। কিন্তু এই স্মার্টওয়াচে আপনি পাচ্ছেন:\n\n✦ ক্রিস্টাল ক্লিয়ার AMOLED অলওয়েজ-অন ডিসপ্লে\n✦ টানা ৭ দিনের ব্যাটারি ব্যাকআপ\n✦ লাউড ও ক্লিয়ার ব্লুটুথ কলিং\n✦ ১০০+ স্পোর্টস ও প্রফেশনাল হেলথ ট্র্যাকার\n✦ ১ বছরের অফিশিয়াল রিপ্লেসমেন্ট ওয়ারেন্টি\n\nকোনো অগ্রিম পেমেন্ট ছাড়াই সারা দেশে ক্যাশ অন ডেলিভারিতে চেক করে রিসিভ করার সুযোগ!`
      } else if (tone === "Urgency") {
        headline = `আর মাত্র ২৪ ঘণ্টা! স্টক প্রায় শেষ—৪০% স্পেশাল ফ্ল্যাশ সেল!`
        body = `ছবিতে দেখতে পাচ্ছেন আমাদের প্রিমিয়াম AMOLED স্মার্টওয়াচের রিয়েল লুক। স্টক দ্রুত ফুরিয়ে যাচ্ছে। আর মাত্র ১৫টি পিস অবশিষ্ট রয়েছে!\n\n✦ সাথে পাচ্ছেন ১ বছরের অফিশিয়াল ওয়ারেন্টি\n✦ সারা বাংলাদেশে ফ্রি ক্যাশ অন ডেলিভারি\n✦ প্রোডাক্ট হাতে পেয়ে দেখে মূল্য পরিশোধের সুবিধা!`
      } else if (tone === "Emotional") {
        headline = `প্রিয়জনের মুখে হাসি ফোটাতে এর চেয়ে সেরা উপহার আর কী হতে পারে?`
        body = `ভালোবাসা প্রকাশে একটি পারফেক্ট উপহারের গুরুত্ব অনেক। ${productName} আপনার যত্ন আর আভিজাত্য প্রকাশ করবে প্রতিটি মুহূর্তে। আকর্ষণীয় প্রিমিয়াম গিফট বক্স প্যাকেজিং ও ${keyBenefits} এর সাথে আজই পাঠিয়ে দিন আপনার ভালোবাসার মানুষের ঠিকানায়।`
      } else if (tone === "Social Proof") {
        headline = `'দাম অনুযায়ী কোয়ালিটি ১০০ তে ১০০!' - আমাদের ভেরিফায়েড কাস্টমারদের মতামত`
        body = `সারা বাংলাদেশ থেকে ইতিমধ্যে শত শত সন্তুষ্ট ক্রেতা ব্যবহার করছেন এবং সন্তুষ্টি প্রকাশ করেছেন। ${keyBenefits} যা প্রতিটি ইউজারকে মুগ্ধ করেছে। আপনিও কোনো রকম ঝুঁকি ছাড়াই ক্যাশ অন ডেলিভারিতে ট্রাই করতে পারেন!`
      } else if (tone === "Storytelling") {
        headline = `এক মাস আগে যখন আমরা এই প্রোডাক্টটি লঞ্চ করেছিলাম, তখন ভাবিনি এত সাড়া পাবো...`
        body = `আমাদের লক্ষ্য ছিল একটাই—সুলভ মূল্যে সর্বোচ্চ প্রিমিয়াম অভিজ্ঞতা প্রদান করা। ক্রেতাদের সরাসরি ফিডব্যাক ও ${keyBenefits} এর সমন্বয়ে এটি আজ বাংলাদেশের মার্কেটে অনন্য অবস্থান তৈরি করেছে। এই অনুপ্রেরণাদায়ক জার্নির অংশ হতে আপনাকে স্বাগতম!`
      } else {
        headline = `এই প্রোডাক্টটি থাকলে আপনার আর কী প্রয়োজন বলুন তো?`
        body = `যখন একটি গ্যাজেটেই পেয়ে যাচ্ছেন ${keyBenefits}—তখন অতিরিক্ত চিন্তা করার কোনো মানেই হয় না! ঝটপট নিয়ে নিন আর নিজের লাইফস্টাইলকে করে তুলুন এক ধাপ স্মার্ট ও রিল্যাক্সড!`
      }
      const hashtags = `#${productName.split(" ")[0]}BD #${category.replace(/[^a-zA-Z]/g, "")} #SpecialOffer #BMT`
      const cta = `এখনই বিশেষ অফারে অর্ডার করতে ভিজিট করুন: https://bmt.link/${brandSlug}`
      return { headline, body, hashtags, cta }
    } else if (lang === "Banglish") {
      let headline = `Apni ki janen keno sobai ekhon ei ${productName} kinte chaiche?`
      let body = `Emon sob features ja age kokhono ei budget e pawa jay ni! ${keyBenefits}. Detail na dekhe onno kothao theke kine thoke jaben na jeno!`
      if (tone === "Urgency") {
        headline = `Last Chance! Stock khub e limited, 40% discount cholche!`
        body = `Stock shesh hoye gele ei price e ar paben na! Already 80% stock booked. ${keyBenefits}. Quick order confirm korun cash on delivery te!`
      } else if (tone === "Social Proof") {
        headline = `100% Genuine & Premium Quality ${productName}`
        body = `Customer ra ek kothay bolche 'Best product in town'. ${keyBenefits}. 1 Year replacement warranty shoho order korte ekhon e message din!`
      }
      const hashtags = `#${productName.split(" ")[0]} #ViralGadget #BestPriceBD #ShopOnline`
      const cta = `Order korte inbox korun ba link e click korun: https://bmt.link/deal`
      return { headline, body, hashtags, cta }
    } else {
      let headline = `Why is everyone talking about the new ${productName}?`
      let body = `Discover the breakthrough quality that thousands of satisfied customers swear by. Engineered with ${keyBenefits}. Experience the difference yourself before it sells out!`
      if (tone === "Urgency") {
        headline = `Limited Stock Alert: Save up to 40% OFF Today Only!`
        body = `Due to overwhelming demand, our current batch is selling out fast. Get your hands on ${productName} featuring ${keyBenefits}. Full official warranty & cash on delivery included!`
      }
      const hashtags = `#${productName.split(" ")[0]} #PremiumQuality #SpecialOffer #ShopNow`
      const cta = `Order yours today with exclusive discount: https://bmt.link/deal`
      return { headline, body, hashtags, cta }
    }
  }

  // Generator Logic with optional format override
  const handleGenerateVariations = (formatOverride?: SchedulerCompatibleFormat) => {
    setIsGenerating(true)
    const activeFormat = formatOverride || targetFormat

    setTimeout(() => {
      const tonesToGenerate = selectedTones.length > 0 ? selectedTones : ["Curiosity", "Urgency", "Social Proof", "Storytelling"]
      const newItems: VariationItem[] = []

      tonesToGenerate.slice(0, variationCount).forEach((tone, idx) => {
        const content = generateContentForFormat(activeFormat, tone, language)
        const score = Math.floor(Math.random() * 8) + 92

        newItems.push({
          id: `var-${Date.now()}-${idx}`,
          tone: tone as any,
          hookScore: score,
          headline: content.headline,
          body: content.body,
          hashtags: content.hashtags,
          cta: content.cta,
          format: activeFormat,
          language,
        })
      })

      setVariations(newItems)
      setIsGenerating(false)
    }, 400)
  }

  // Instant Format Switcher that re-adapts variations
  const handleSelectFormat = (fmt: SchedulerCompatibleFormat) => {
    setTargetFormat(fmt)
    if (fmt === "Video" || fmt === "Reel") {
      if (!mediaUrl || !mediaUrl.match(/\.(mp4|mov|webm)/i)) {
        setMediaUrl("/sample-video.mp4")
      }
    } else if (fmt === "Text" || fmt === "Poll") {
      setMediaUrl("")
    } else if (fmt === "Image" || fmt === "Story") {
      if (!mediaUrl || mediaUrl.match(/\.(mp4|mov|webm)/i)) {
        setMediaUrl("https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop")
      }
    }
    handleGenerateVariations(fmt)
  }

  // Select item from Central Asset Library
  const handleSelectAssetFromLibrary = (asset: LibraryAsset) => {
    if (asset.title) setProductName(asset.title)
    if (asset.content) setKeyBenefits(asset.content)

    const media = asset.videoUrl || asset.url || asset.thumbnailUrl || ""
    if (media) setMediaUrl(media)

    if (asset.type === "Image") handleSelectFormat("Image")
    else if (asset.type === "Video") handleSelectFormat("Video")
    else if (asset.type === "Poll") handleSelectFormat("Poll")
    else if (asset.type === "Text") handleSelectFormat("Text")

    setShowLibraryPicker(false)
  }

  // Upload local image or video directly from computer
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (data.success && data.url) {
        setMediaUrl(data.url)
        if (file.type.startsWith("video/")) {
          if (targetFormat !== "Video" && targetFormat !== "Reel") {
            handleSelectFormat("Video")
          }
        } else if (file.type.startsWith("image/")) {
          if (targetFormat !== "Image" && targetFormat !== "Story") {
            handleSelectFormat("Image")
          }
        }
      } else {
        setUploadError(data.error || "Failed to upload file")
      }
    } catch (err: any) {
      setUploadError(err.message || "Upload failed")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // 1. Save Single Variation to Central Asset Library (Module 3)
  const handleSaveToLibrary = (item: VariationItem) => {
    const fullContent = `${item.headline}\n\n${item.body}\n\n${item.hashtags}\n${item.cta}`
    addAsset({
      title: `[${item.tone} AI Copy] ${productName.slice(0, 35)}...`,
      type: "Text",
      folder: "Captions & Copy",
      content: fullContent,
      tags: ["ai-generated", item.tone.toLowerCase(), item.language.toLowerCase(), "high-converting"],
    })

    setSavedToLibraryIds((prev) => [...prev, item.id])
    setTimeout(() => {
      setSavedToLibraryIds((prev) => prev.filter((id) => id !== item.id))
    }, 3000)
  }

  // 2. Bulk Save All to Central Library
  const handleBulkSaveToLibrary = () => {
    variations.forEach((item) => {
      const fullContent = `${item.headline}\n\n${item.body}\n\n${item.hashtags}\n${item.cta}`
      addAsset({
        title: `[${item.tone} AI Copy] ${productName.slice(0, 35)}...`,
        type: "Text",
        folder: "Captions & Copy",
        content: fullContent,
        tags: ["ai-generated", item.tone.toLowerCase(), item.language.toLowerCase(), "bulk-export"],
      })
    })

    setBulkSaveNotice(`Successfully saved all ${variations.length} variations to Central Asset Library!`)
    setTimeout(() => setBulkSaveNotice(null), 3500)
  }

  // 3. Dispatch to Post Scheduler (Module 9)
  const handleSendToScheduler = (item: VariationItem) => {
    const fullContent = `${item.headline}\n\n${item.body}\n\n${item.hashtags}\n${item.cta}`
    const titleText = `[${item.tone}] ${productName}`
    const formatType = item.format === "Group Share" || item.format === "Post" ? "Text" : item.format

    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "bmt_imported_scheduler_post",
        JSON.stringify({
          title: titleText,
          description: fullContent,
          format: formatType,
          mediaUrl: mediaUrl || undefined,
        })
      )
    }

    const query = new URLSearchParams({
      from: "ai-variations",
      importedTitle: titleText,
      importedFormat: formatType,
      ...(mediaUrl ? { importedMedia: mediaUrl } : {}),
    }).toString()

    router.push(`/workspace/${workspaceId}/safe/post-scheduler?${query}`)
  }

  // 4. Copy to Clipboard
  const handleCopyText = (item: VariationItem) => {
    const fullContent = `${item.headline}\n\n${item.body}\n\n${item.hashtags}\n${item.cta}`
    navigator.clipboard.writeText(fullContent)
    setCopiedId(item.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // 5. Export as CSV / Text
  const handleExportCSV = () => {
    const headers = "ID,Tone,HookScore,Headline,Body,Hashtags,CTA,Language,Format\n"
    const rows = variations
      .map(
        (v) =>
          `"${v.id}","${v.tone}","${v.hookScore}","${v.headline.replace(/"/g, '""')}","${v.body.replace(/"/g, '""')}","${v.hashtags.replace(/"/g, '""')}","${v.cta.replace(/"/g, '""')}","${v.language}","${v.format}"`
      )
      .join("\n")

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `bmt_ai_post_variations_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getToneIcon = (tone: string) => {
    switch (tone) {
      case "Curiosity":
        return <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
      case "Urgency":
        return <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
      case "Emotional":
        return <Heart className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
      case "Social Proof":
        return <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
      case "Storytelling":
        return <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
      default:
        return <Smile className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
    }
  }

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              AI Post Variation Generator
            </h1>
            <span className="text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-900/40">
              Module 10 • Multi-Tone Engine
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Transform a single product or idea into high-converting copy variations across 6 proven marketing tones.
            Directly connected to Central Asset Library and Post Scheduler.
          </p>
        </div>

        {/* Action Controls (Responsive on Mobile) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowApiKeyDrawer(!showApiKeyDrawer)}
            className="h-9 px-3 rounded-xl border border-border bg-card text-xs font-semibold hover:bg-muted text-foreground transition flex items-center gap-1.5 shadow-xs"
          >
            <Key className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{apiKey ? "API Key Configured" : "Custom AI Key (Optional)"}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="h-9 px-3 rounded-xl border border-border bg-card text-xs font-semibold hover:bg-muted text-foreground transition flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleBulkSaveToLibrary}
            className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Save All to Library</span>
          </button>
        </div>
      </div>

      {/* Bulk Save Feedback Toast */}
      {bulkSaveNotice && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>{bulkSaveNotice}</span>
        </div>
      )}

      {/* Optional Custom API Key Drawer */}
      {showApiKeyDrawer && (
        <div className="p-4 bg-muted/30 border border-border rounded-2xl space-y-2 text-xs animate-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Custom Gemini Pro / OpenAI API Key (Optional)</span>
            </span>
            <span className="text-[11px] text-muted-foreground">
              By default, the built-in High-Converting Copy Engine generates instant copy variations without requiring an external key.
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <input
              type="password"
              placeholder="Paste your Google Gemini API key or OpenRouter key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 h-9 px-3 border border-border rounded-xl bg-background font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition text-foreground"
            />
            <button
              onClick={() => {
                setApiKeySaved(true)
                setTimeout(() => setApiKeySaved(false), 2500)
              }}
              className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition"
            >
              {apiKeySaved ? "Saved!" : "Save Key"}
            </button>
          </div>
        </div>
      )}

      {/* MAIN TWO-COLUMN STUDIO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: INPUT STUDIO */}
        <div className="lg:col-span-5 space-y-4 border border-border bg-card p-4 sm:p-5 rounded-2xl shadow-xs h-fit">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <h2 className="font-bold text-sm flex items-center gap-1.5 text-foreground">
              <Wand2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Master Concept & Promotion Studio</span>
            </h2>
            <span className="text-[10px] font-semibold bg-muted px-2 py-0.5 rounded-md text-muted-foreground">
              Step 1 of 2
            </span>
          </div>

          {/* Product / Offer Title */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1">
              Product / Campaign Name *
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Premium Leather Handbag or Smart Earbuds"
              className="w-full h-10 px-3 border border-border rounded-xl bg-background text-xs font-semibold text-foreground focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition"
            />
          </div>

          {/* Key Selling Points / Features */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1">
              Key Features & Benefits (USPs) *
            </label>
            <textarea
              rows={3}
              value={keyBenefits}
              onChange={(e) => setKeyBenefits(e.target.value)}
              placeholder="List main specs, warranty, discount percentage, delivery terms..."
              className="w-full p-3 border border-border rounded-xl bg-background text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none leading-relaxed transition text-foreground"
            />
          </div>

          {/* Category & Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 border border-border rounded-xl bg-background text-xs font-semibold text-foreground focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition"
              >
                <option value="Gadgets & Electronics">Gadgets & Tech</option>
                <option value="Fashion & Lifestyle">Fashion & Apparel</option>
                <option value="Food & Groceries">Food & Boutique</option>
                <option value="Real Estate">Real Estate & Plots</option>
                <option value="Health & Beauty">Health & Cosmetics</option>
                <option value="Digital Services">Digital Agency & Services</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full h-10 px-3 border border-border rounded-xl bg-background text-xs font-semibold text-foreground focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition"
              >
                <option value="Bengali">বাংলা (Bangla Formal)</option>
                <option value="Banglish">Banglish (Social Media)</option>
                <option value="English">English (Global Copy)</option>
              </select>
            </div>
          </div>

          {/* Target Post Format (Unified 6 Formats matching Post Scheduler) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                Target Post Format ({targetFormat})
              </label>
              <button
                type="button"
                onClick={() => setShowLibraryPicker(true)}
                className="flex items-center space-x-1.5 text-xs text-blue-600 dark:text-blue-400 font-extrabold hover:underline bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-lg border border-blue-500/20 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Browse Asset Library</span>
              </button>
            </div>
            <div className="grid grid-cols-6 gap-1.5 text-xs font-bold">
              {(["Text", "Image", "Video", "Reel", "Story", "Poll"] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => handleSelectFormat(fmt)}
                  className={`py-2 px-1 rounded-xl border transition flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                    targetFormat === fmt
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {fmt === "Text" && <FileText className="w-3.5 h-3.5" />}
                  {fmt === "Image" && <ImageIcon className="w-3.5 h-3.5" />}
                  {fmt === "Video" && <Video className="w-3.5 h-3.5" />}
                  {fmt === "Reel" && <Film className="w-3.5 h-3.5" />}
                  {fmt === "Story" && <Smartphone className="w-3.5 h-3.5" />}
                  {fmt === "Poll" && <Vote className="w-3.5 h-3.5" />}
                  <span className="text-[10px]">{fmt}</span>
                </button>
              ))}
            </div>

            {/* Dynamic Format Guide Banner */}
            <div className="text-[11px] p-2.5 rounded-xl border border-blue-500/20 bg-blue-500/[0.04] text-foreground flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
              <div className="leading-snug">
                {targetFormat === "Text" && (
                  <span>
                    <strong>Text Status Mode:</strong> Generates high-converting conversational storytelling, organic questions, and relatable status updates (no photo required).
                  </span>
                )}
                {targetFormat === "Image" && (
                  <span>
                    <strong>Image Post Mode:</strong> Generates attention-grabbing visual headlines, bulleted feature highlights, and photo caption copy.
                  </span>
                )}
                {targetFormat === "Video" && (
                  <span>
                    <strong>Video Post Mode:</strong> Generates ready-to-post Facebook video captions, video teaser hooks, and purchase CTAs for your video post.
                  </span>
                )}
                {targetFormat === "Reel" && (
                  <span>
                    <strong>Reel Mode:</strong> Generates ready-to-post Facebook Reel captions, viral first-line hooks, and link-in-bio CTAs for your reel.
                  </span>
                )}
                {targetFormat === "Story" && (
                  <span>
                    <strong>Story Mode:</strong> Generates 24h flash sale sticker text, ultra-compact 2-line punchy copy, and tap-link sticker CTAs.
                  </span>
                )}
                {targetFormat === "Poll" && (
                  <span>
                    <strong>Poll Creator Mode:</strong> Generates engaging dilemma questions and 4 interactive voting choices for viral audience engagement.
                  </span>
                )}
                {targetFormat === "Group Share" && (
                  <span>
                    <strong>Group Share Mode:</strong> Generates non-salesy, peer-to-peer discussion copy designed to bypass Facebook Group spam filters.
                  </span>
                )}
                {targetFormat === "Post" && (
                  <span>
                    <strong>Feed Post Mode:</strong> Generates comprehensive sales copy with headlines, feature bullets, and direct purchase CTA.
                  </span>
                )}
              </div>
            </div>

            {/* Creative Media Attachment (Asset Library, Local Upload, Sample Video, URL) */}
            {targetFormat !== "Text" && targetFormat !== "Poll" && (
              <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                    {targetFormat === "Image" && <ImageIcon className="w-3.5 h-3.5 text-blue-500" />}
                    {targetFormat === "Video" && <Video className="w-3.5 h-3.5 text-rose-500" />}
                    {targetFormat === "Reel" && <Film className="w-3.5 h-3.5 text-purple-500" />}
                    {targetFormat === "Story" && <Smartphone className="w-3.5 h-3.5 text-amber-500" />}
                    <span>{targetFormat} Creative Media Attachment</span>
                  </label>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900/60">
                    Auto-forwards to Scheduler
                  </span>
                </div>

                {/* Media Actions: 1) Asset Library, 2) Direct File Upload, 3) Sample Video */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLibraryPicker(true)}
                    className="flex-1 min-w-[120px] h-8 px-2.5 rounded-lg border border-blue-500/30 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>From Library</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex-1 min-w-[120px] h-8 px-2.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Upload File</span>
                      </>
                    )}
                  </button>

                  {(targetFormat === "Video" || targetFormat === "Reel") && (
                    <button
                      type="button"
                      onClick={() => setMediaUrl("/sample-video.mp4")}
                      className="h-8 px-2.5 rounded-lg border border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>Sample Video</span>
                    </button>
                  )}
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={
                    targetFormat === "Video" || targetFormat === "Reel"
                      ? "video/mp4,video/webm,video/quicktime"
                      : "image/png,image/jpeg,image/webp,image/gif,video/mp4"
                  }
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {uploadError && (
                  <p className="text-[11px] text-rose-500 font-semibold">{uploadError}</p>
                )}

                {/* Media URL Input */}
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Or Media URL / Path:</span>
                  <input
                    type="text"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder={
                      targetFormat === "Image"
                        ? "https://.../product.jpg or /uploads/..."
                        : targetFormat === "Video" || targetFormat === "Reel"
                        ? "/sample-video.mp4 or https://.../video.mp4"
                        : "https://.../story-media.jpg"
                    }
                    className="w-full h-8 px-2.5 border border-border rounded-lg bg-background text-[11px] font-mono text-foreground focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition"
                  />
                </div>

                {/* Live Media Visual Preview */}
                {mediaUrl && (
                  <div className="relative p-2 bg-background border border-border rounded-xl flex items-center gap-3">
                    {mediaUrl.match(/\.(mp4|mov|webm)$/i) || mediaUrl.includes("sample-video") ? (
                      <div className="w-20 h-14 bg-black rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-border">
                        <video src={mediaUrl} className="w-full h-full object-cover" muted />
                      </div>
                    ) : (
                      <div className="w-20 h-14 bg-muted rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-border">
                        <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate text-foreground">
                        {mediaUrl.startsWith("http") ? mediaUrl.split("/").pop() : mediaUrl}
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ready for Post Scheduler & Facebook Bot</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMediaUrl("")}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Remove attachment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tones Selection (Multi-select) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase block">
              Desired Marketing Tones (Select to generate)
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { name: "Curiosity", desc: "High Click-Through Hook" },
                { name: "Urgency", desc: "FOMO & Limited Time" },
                { name: "Social Proof", desc: "Customer Review & Trust" },
                { name: "Storytelling", desc: "Relatable Case Study" },
                { name: "Emotional", desc: "Family & Care Appeal" },
                { name: "Humorous", desc: "Casual & Engaging" },
              ].map((t) => {
                const isChecked = selectedTones.includes(t.name)
                return (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => {
                      if (isChecked) {
                        if (selectedTones.length > 1) {
                          setSelectedTones(selectedTones.filter((s) => s !== t.name))
                        }
                      } else {
                        setSelectedTones([...selectedTones, t.name])
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                      isChecked
                        ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-foreground shadow-xs"
                        : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      {getToneIcon(t.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs block truncate">{t.name}</span>
                      <span className="text-[10px] text-muted-foreground block truncate">{t.desc}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Generation Action Button */}
          <button
            type="button"
            disabled={isGenerating || !productName.trim()}
            onClick={handleGenerateVariations}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 text-xs disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Crafting High-Converting Copy...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate {selectedTones.length} AI Post Variations</span>
              </>
            )}
          </button>
        </div>

        {/* RIGHT COLUMN: GENERATED VARIATIONS STREAM */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <div>
              <h2 className="font-bold text-sm text-foreground">
                High-Converting Variations ({variations.length})
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Click any variation to edit inline, save to Library, or send to Post Scheduler
              </p>
            </div>
            <span className="text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-900/40 w-fit">
              Avg. Hook Score: 95.8%
            </span>
          </div>

          {/* Variations List */}
          <div className="space-y-4">
            {variations.map((item, index) => {
              const isSaved = savedToLibraryIds.includes(item.id)
              const isCopied = copiedId === item.id

              return (
                <div
                  key={item.id}
                  className="border border-border hover:border-blue-500/50 bg-card rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs transition duration-200"
                >
                  {/* Card Top Meta */}
                  <div className="flex items-center justify-between border-b border-border pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-bold text-[10px]">
                        #{index + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold text-xs flex items-center gap-1 border border-blue-200 dark:border-blue-900/40">
                        {getToneIcon(item.tone)}
                        <span>{item.tone} Tone</span>
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          item.format === "Reel"
                            ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25"
                            : item.format === "Story"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25"
                            : item.format === "Poll"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                            : item.format === "Video"
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25"
                            : item.format === "Image"
                            ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25"
                            : item.format === "Group Share"
                            ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25"
                        }`}
                      >
                        {item.format === "Reel"
                          ? "Reel Script"
                          : item.format === "Story"
                          ? "24h Story"
                          : item.format === "Poll"
                          ? "Interactive Poll"
                          : item.format === "Video"
                          ? "Video Showcase"
                          : item.format === "Image"
                          ? "Image Post"
                          : item.format === "Group Share"
                          ? "Group Discussion"
                          : "Text Status"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900/40">
                        <Award className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Hook Score: {item.hookScore}/100</span>
                      </span>
                    </div>
                  </div>

                  {/* Headline / Hook */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center justify-between">
                      <span>
                        {item.format === "Reel"
                          ? "Reel Headline & Hook (Facebook Reel Hook)"
                          : item.format === "Story"
                          ? "Story Sticker Text & Hook"
                          : item.format === "Poll"
                          ? "Interactive Poll Question / Debate Hook"
                          : item.format === "Video"
                          ? "Video Headline & Hook (Facebook Post Hook)"
                          : item.format === "Image"
                          ? "Image Headline & Visual Focal Point"
                          : item.format === "Group Share"
                          ? "Community Discussion Starter"
                          : "Attention-Grabbing Hook"}
                      </span>
                      <span className="text-blue-600 dark:text-blue-400 font-normal lowercase">editable</span>
                    </label>
                    <textarea
                      rows={2}
                      value={item.headline}
                      onChange={(e) => {
                        const updated = [...variations]
                        updated[index].headline = e.target.value
                        updated[index].isEdited = true
                        setVariations(updated)
                      }}
                      className="w-full p-2.5 border border-border rounded-xl bg-background text-xs font-semibold leading-relaxed focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition text-foreground"
                    />
                  </div>

                  {/* Core Body Copy */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center justify-between">
                      <span>
                        {item.format === "Reel"
                          ? "Facebook Reel Caption & Ad Copy"
                          : item.format === "Story"
                          ? "Minimalist Story Caption (Fast-Reading)"
                          : item.format === "Poll"
                          ? "Voting Options & Engagement Call"
                          : item.format === "Video"
                          ? "Facebook Post Caption (Video Ad Copy)"
                          : item.format === "Image"
                          ? "Bullet Highlights & Product Ad Copy"
                          : item.format === "Group Share"
                          ? "Peer-to-Peer Community Post Body"
                          : "Main Value Proposition & Ad Copy"}
                      </span>
                      <span className="text-blue-600 dark:text-blue-400 font-normal lowercase">editable</span>
                    </label>
                    <textarea
                      rows={item.format === "Story" ? 2 : item.format === "Poll" ? 6 : 4}
                      value={item.body}
                      onChange={(e) => {
                        const updated = [...variations]
                        updated[index].body = e.target.value
                        updated[index].isEdited = true
                        setVariations(updated)
                      }}
                      className="w-full p-2.5 border border-border rounded-xl bg-background text-xs leading-relaxed focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition text-foreground font-mono"
                    />
                  </div>

                  {/* Hashtags & CTA Link */}
                  <div className="p-3 bg-muted/20 border border-border rounded-xl space-y-1 text-xs">
                    <p className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                      {item.hashtags}
                    </p>
                    <p className="text-[11px] font-medium text-foreground">
                      {item.cta}
                    </p>
                  </div>

                  {/* Bottom Action Bar (Responsive Mobile Alignment) */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                      <span>{item.body.split(/\s+/).length} words</span>
                      <span>•</span>
                      <span>{item.language}</span>
                      {item.isEdited && <span className="text-blue-600 dark:text-blue-400 font-semibold">• Edited</span>}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Copy Button */}
                      <button
                        type="button"
                        onClick={() => handleCopyText(item)}
                        className="h-9 px-3 border border-border rounded-xl hover:bg-muted text-xs font-semibold flex items-center gap-1.5 transition text-foreground"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span className="text-blue-600 dark:text-blue-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      {/* Save to Central Asset Library (Module 3) */}
                      <button
                        type="button"
                        onClick={() => handleSaveToLibrary(item)}
                        className={`h-9 px-3.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                          isSaved
                            ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/60"
                            : "bg-card border-border hover:bg-muted text-foreground"
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>Saved in Library!</span>
                          </>
                        ) : (
                          <>
                            <FolderPlus className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Save to Library</span>
                          </>
                        )}
                      </button>

                      {/* Send to Post Scheduler (Module 9) */}
                      <button
                        type="button"
                        onClick={() => handleSendToScheduler(item)}
                        className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
                      >
                        <CalendarClock className="w-3.5 h-3.5" />
                        <span>Schedule Post</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Central Asset Library Picker Modal */}
      <AssetLibraryPickerModal
        isOpen={showLibraryPicker}
        onClose={() => setShowLibraryPicker(false)}
        onSelect={handleSelectAssetFromLibrary}
      />
    </div>
  )
}
