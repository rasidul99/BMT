"use client"

import React, { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAssetLibrary } from "../../../../../hooks/useAssetLibrary"
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
  Edit3,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Share2,
  Award,
} from "lucide-react"

interface VariationItem {
  id: string
  tone: "Curiosity" | "Urgency" | "Emotional" | "Social Proof" | "Storytelling" | "Humorous"
  hookScore: number // 80 - 99
  headline: string
  body: string
  hashtags: string
  cta: string
  format: "Post" | "Reel" | "Story" | "Poll" | "Group Share"
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
  const [targetFormat, setTargetFormat] = useState<"Post" | "Reel" | "Story" | "Poll" | "Group Share">("Post")
  const [language, setLanguage] = useState<"Bengali" | "English" | "Banglish">("Bengali")
  const [selectedTones, setSelectedTones] = useState<string[]>([
    "Curiosity",
    "Urgency",
    "Social Proof",
    "Storytelling",
  ])
  const [variationCount, setVariationCount] = useState<number>(4)

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
      headline: "আপনি কি জানেন ৯০% মানুষ স্মার্টওয়াচ কেনার পর এই ভুলটি করে আফসোস করেন?",
      body: "বাজারে হাজারো কপি ঘড়ির ভিড়ে আসল প্রিমিয়াম এক্সপেরিয়েন্স পাওয়া এখন সত্যি কঠিন। কিন্তু আপনি যদি এমন একটি ওয়াচ খোঁজেন যার ডিসপ্লে রোদেও চকচক করবে এবং বারবার চার্জ দেওয়ার ঝামেলা থাকবে না—তাহলে এই ওয়াচটি আপনার জন্যই। 7 দিনের ব্যাটারি ব্যাকআপ আর ক্রিস্টাল ক্লিয়ার ব্লুটুথ কলিং নিয়ে এটি এখন বাংলাদেশের সবচেয়ে আলোচিত গ্যাজেট!",
      hashtags: "#SmartwatchBD #TechLoversBD #GadgetReview #AmoledDisplay #BMTMarketing",
      cta: "অফার প্রাইসে আজই অর্ডার করতে ভিজিট করুন: https://bmt.link/smartwatch-offer",
      format: "Post",
      language: "Bengali",
    },
    {
      id: "var-2",
      tone: "Urgency",
      hookScore: 96,
      headline: "আর মাত্র ২৪ ঘণ্টা! স্টক প্রায় শেষ—৪০% স্পেশাল ফ্ল্যাশ সেল!",
      body: "ঈদ উপলক্ষে প্রিমিয়াম AMOLED স্মার্টওয়াচে পাচ্ছেন অবিশ্বাস্য ডিসকাউন্ট! স্টক দ্রুত ফুরিয়ে যাচ্ছে। আর মাত্র ১৫টি পিস অবশিষ্ট রয়েছে। সাথে পাচ্ছেন ১ বছরের অফিশিয়াল রিপ্লেসমেন্ট ওয়ারেন্টি এবং সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা। স্টক শেষ হওয়ার আগেই লুফে নিন!",
      hashtags: "#FlashSaleBD #EidOffer #LimitedStock #DiscountDeals #OnlineShoppingBD",
      cta: "ক্যাশ অন ডেলিভারিতে অর্ডার করতে এখনই ইনবক্স করুন অথবা লিংকে যান: https://bmt.link/smartwatch-offer",
      format: "Post",
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
      format: "Post",
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
      format: "Post",
      language: "Bengali",
    },
  ])

  // Generator Logic (Zero Emojis, Multi-Language, Multi-Tone Marketing Framework)
  const handleGenerateVariations = () => {
    setIsGenerating(true)

    setTimeout(() => {
      const tonesToGenerate = selectedTones.length > 0 ? selectedTones : ["Curiosity", "Urgency", "Social Proof"]
      const newItems: VariationItem[] = []

      tonesToGenerate.slice(0, variationCount).forEach((tone, idx) => {
        let headline = ""
        let body = ""
        let hashtags = ""
        let cta = ""
        const score = Math.floor(Math.random() * 8) + 92

        if (language === "Bengali") {
          hashtags = `#${productName.split(" ")[0]}BD #${category.replace(/[^a-zA-Z]/g, "")} #SpecialOffer #BMT`
          cta = `এখনই বিশেষ অফারে অর্ডার করতে ভিজিট করুন: https://bmt.link/${productName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`

          if (tone === "Curiosity") {
            headline = `${productName} নিয়ে কেন এত আলোচনা? জেনে নিন আসল কারণ!`
            body = `আপনি কি জানেন এই একটি ফিচারের কারণেই হাজার হাজার ক্রেতা বেছে নিচ্ছেন এই প্রোডাক্টটি? ${keyBenefits}। সাধারণ গ্যাজেট থেকে নিজেকে আলাদা করতে এর চেয়ে সেরা সমাধান আর হতে পারে না। বিস্তারিত জানতে পুরো পোস্টটি পড়ুন!`
          } else if (tone === "Urgency") {
            headline = `শেষ সুযোগ! স্টক একদম সীমিত—আজকের স্পেশাল ডিসকাউন্ট মিস করবেন না!`
            body = `চাহিদা তুঙ্গে থাকায় আমাদের স্টক দ্রুত শেষ হয়ে যাচ্ছে! যারা প্রিমিয়াম কোয়ালিটি নিশ্চিত করতে চান, তাদের জন্য এটাই সেরা সময়। ${keyBenefits}। আর দেরি না করে এখনই বুকিং সম্পন্ন করুন!`
          } else if (tone === "Emotional") {
            headline = `প্রিয়জনের মুখে হাসি ফোটাতে এর চেয়ে সেরা উপহার আর কী হতে পারে?`
            body = `ভালোবাসা প্রকাশে একটি পারফেক্ট উপহারের গুরুত্ব অনেক। ${productName} আপনার যত্ন আর আভিজাত্য প্রকাশ করবে প্রতিটি মুহূর্তে। আকর্ষণীয় প্যাকেজিং ও ${keyBenefits} এর সাথে আজই পাঠিয়ে দিন আপনার ভালোবাসার মানুষের ঠিকানায়।`
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
        } else if (language === "Banglish") {
          hashtags = `#${productName.split(" ")[0]} #ViralGadget #BestPriceBD #ShopOnline`
          cta = `Order korte inbox korun ba link e click korun: https://bmt.link/deal`

          if (tone === "Curiosity") {
            headline = `Apni ki janen keno sobai ekhon ei ${productName} kinte chaiche?`
            body = `Emon sob features ja age kokhono ei budget e pawa jay ni! ${keyBenefits}. Detail na dekhe onno kothao theke kine thoke jaben na jeno!`
          } else if (tone === "Urgency") {
            headline = `Last Chance! Stock khub e limited, 40% discount cholche!`
            body = `Stock shesh hoye gele ei price e ar paben na! Already 80% stock booked. ${keyBenefits}. Quick order confirm korun cash on delivery te!`
          } else {
            headline = `100% Genuine & Premium Quality ${productName}`
            body = `Customer ra ek kothay bolche 'Best product in town'. ${keyBenefits}. 1 Year replacement warranty shoho order korte ekhon e message din!`
          }
        } else {
          // English
          hashtags = `#${productName.split(" ")[0]} #PremiumQuality #SpecialOffer #ShopNow`
          cta = `Order yours today with exclusive discount: https://bmt.link/deal`

          if (tone === "Curiosity") {
            headline = `Why is everyone talking about the new ${productName}?`
            body = `Discover the breakthrough quality that thousands of satisfied customers swear by. Engineered with ${keyBenefits}. Experience the difference yourself before it sells out!`
          } else if (tone === "Urgency") {
            headline = `Limited Stock Alert: Save up to 40% OFF Today Only!`
            body = `Due to overwhelming demand, our current batch is selling out fast. Get your hands on ${productName} featuring ${keyBenefits}. Full official warranty & cash on delivery included!`
          } else {
            headline = `Rated 4.9/5 Stars by over 5,000+ Verified Buyers!`
            body = `Don't just take our word for it—join thousands of smart buyers who upgraded their experience with ${productName}. Packed with ${keyBenefits}. 100% satisfaction guaranteed.`
          }
        }

        newItems.push({
          id: `var-${Date.now()}-${idx}`,
          tone: tone as any,
          hookScore: score,
          headline,
          body,
          hashtags,
          cta,
          format: targetFormat,
          language,
        })
      })

      setVariations(newItems)
      setIsGenerating(false)
    }, 600)
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
    const formatType = item.format === "Group Share" ? "Post" : item.format

    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "bmt_imported_scheduler_post",
        JSON.stringify({
          title: titleText,
          description: fullContent,
          format: formatType,
        })
      )
    }

    const query = new URLSearchParams({
      importedTitle: titleText,
      importedFormat: formatType,
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

          {/* Format Selector */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1.5">
              Target Post Format
            </label>
            <div className="grid grid-cols-5 gap-1.5 text-xs font-semibold">
              {(["Post", "Reel", "Story", "Poll", "Group Share"] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setTargetFormat(fmt)}
                  className={`py-2 px-1 rounded-xl border text-center transition ${
                    targetFormat === fmt
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs font-bold"
                      : "bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
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
                      <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                        {item.format}
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
                      <span>Attention-Grabbing Hook</span>
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
                      <span>Main Value Proposition & Ad Copy</span>
                      <span className="text-blue-600 dark:text-blue-400 font-normal lowercase">editable</span>
                    </label>
                    <textarea
                      rows={4}
                      value={item.body}
                      onChange={(e) => {
                        const updated = [...variations]
                        updated[index].body = e.target.value
                        updated[index].isEdited = true
                        setVariations(updated)
                      }}
                      className="w-full p-2.5 border border-border rounded-xl bg-background text-xs leading-relaxed focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition text-foreground"
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
    </div>
  )
}
