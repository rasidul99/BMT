"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  TrendingUp,
  Flame,
  Sparkles,
  Download,
  Bookmark,
  BookmarkCheck,
  Share2,
  Heart,
  MessageCircle,
  Eye,
  ExternalLink,
  Search,
  SlidersHorizontal,
  Globe,
  RefreshCw,
  CheckCircle2,
  FolderPlus,
  Play,
  Film,
  BookOpen,
  Lightbulb,
  ArrowRight,
  Filter,
  PlusCircle,
  X,
} from "lucide-react"
import { useViralResearch, ViralContentItem } from "../../../../../hooks/useViralResearch"
import { useAssetLibrary } from "../../../../../hooks/useAssetLibrary"

export default function SafeViralContentPage() {
  const router = useRouter()
  const params = useParams()
  const workspaceId = (params?.id as string) || "workspace-1"

  const {
    results,
    bookmarks,
    isLoading,
    error,
    searchViralContent,
    loadMoreViralContent,
    toggleBookmark,
    isBookmarked,
  } = useViralResearch()

  const { addAsset } = useAssetLibrary()

  // Tab State
  const [activeTab, setActiveTab] = useState<"Feed" | "Bookmarks" | "Formulas">("Feed")

  // Filter State
  const [selectedPlatform, setSelectedPlatform] = useState<"all" | "facebook" | "youtube" | "tiktok">("all")
  const [selectedCountry, setSelectedCountry] = useState<string>("Bangladesh")
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories")
  const [searchKeyword, setSearchKeyword] = useState<string>("")
  const [minLikesFilter, setMinLikesFilter] = useState<number>(0)
  const [sortBy, setSortBy] = useState<"score" | "views" | "likes" | "shares">("score")

  // In-Card Video Player State
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)

  // Helper to generate platform-specific embed iframe URLs
  const getEmbedUrl = (item: ViralContentItem) => {
    if (item.platform === "Facebook" || item.url.includes("facebook.com")) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(item.url)}&show_text=false&autoplay=true`
    }
    if (item.platform === "TikTok" || item.url.includes("tiktok.com")) {
      const match = item.url.match(/video\/(\d+)/)
      const tiktokId = match ? match[1] : "6718335390845095173"
      return `https://www.tiktok.com/embed/v2/${tiktokId}`
    }
    // YouTube
    const match = item.url.match(/(?:v=|\/embed\/|\/watch\?v=|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/)
    const ytId = match ? match[1] : "ugqmPWp8bzc"
    return `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`
  }

  // Pagination: Show 5 videos initially, add 5 more on 'See More'
  const [visibleCount, setVisibleCount] = useState<number>(5)
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const [showTikTokModal, setShowTikTokModal] = useState<boolean>(false)

  // Feedback State for Library saves
  const [savedLibraryIds, setSavedLibraryIds] = useState<Record<string, boolean>>({})

  // Initial load
  useEffect(() => {
    searchViralContent({
      platform: "all",
      country: "Bangladesh",
      category: "All Categories",
      keyword: "",
      minLikes: 0,
    })
  }, [])

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setVisibleCount(5)
    searchViralContent({
      platform: selectedPlatform,
      country: selectedCountry,
      category: selectedCategory,
      keyword: searchKeyword,
      minLikes: minLikesFilter,
    })
  }

  // Continuous progressive loading: Always appends 5 new videos and keeps the button active
  const handleLoadMoreVideos = async () => {
    setIsLoadingMore(true)
    try {
      if (visibleCount + 5 <= results.length) {
        setVisibleCount((prev) => prev + 5)
      } else {
        await loadMoreViralContent(
          {
            platform: selectedPlatform,
            country: selectedCountry,
            category: selectedCategory,
            keyword: searchKeyword,
            minLikes: minLikesFilter,
          },
          5
        )
        setVisibleCount((prev) => prev + 5)
      }
    } catch (e) {
      console.warn("Error loading more videos:", e)
      setVisibleCount((prev) => prev + 5)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handleSaveToAssetLibrary = (item: ViralContentItem) => {
    addAsset({
      title: item.title,
      type: "Video",
      folder: "Videos & Reels",
      content: item.caption,
      url: item.thumbnailUrl,
      videoUrl: item.url,
      thumbnailUrl: item.thumbnailUrl,
      tags: [item.platform.toLowerCase(), item.category.toLowerCase().replace(/\s+/g, "-"), "viral"],
      size: "Viral Stream",
    })

    setSavedLibraryIds((prev) => ({ ...prev, [item.id]: true }))
    setTimeout(() => {
      setSavedLibraryIds((prev) => ({ ...prev, [item.id]: false }))
    }, 3500)
  }

  const handleImportToScheduler = (item: ViralContentItem) => {
    const encodedContent = encodeURIComponent(item.caption)
    const encodedTitle = encodeURIComponent(item.title)
    const encodedMedia = encodeURIComponent(item.thumbnailUrl)
    router.push(
      `/workspace/${workspaceId}/safe/post-scheduler?importedContent=${encodedContent}&importedTitle=${encodedTitle}&importedMedia=${encodedMedia}&importedFormat=Video`
    )
  }

  const handleDownloadInModule7 = (item: ViralContentItem) => {
    const encodedUrl = encodeURIComponent(item.url)
    router.push(`/workspace/${workspaceId}/safe/downloader?url=${encodedUrl}`)
  }

  // Format large numbers (e.g. 1250000 -> 1.2M)
  const formatCount = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
    if (num >= 1000) return (num / 1000).toFixed(1) + "K"
    return num.toLocaleString()
  }

  // Sorting
  const sortedItems = [...(activeTab === "Bookmarks" ? bookmarks : results)].sort((a, b) => {
    if (sortBy === "score") return b.viralScore - a.viralScore
    if (sortBy === "views") return b.views - a.views
    if (sortBy === "likes") return b.likes - a.likes
    if (sortBy === "shares") return b.shares - a.shares
    return 0
  })

  // Visible items for progressive 'See More' loading
  const visibleItems = activeTab === "Bookmarks" ? sortedItems : sortedItems.slice(0, visibleCount)

  // Quick preset keywords
  const presetKeywords = [
    { label: "Eid Special", query: "Eid" },
    { label: "Gadgets", query: "gadget" },
    { label: "Skincare Glow", query: "skin" },
    { label: "Organic Food", query: "food" },
    { label: "Fashion", query: "fashion" },
  ]

  const platforms = [
    { id: "all", label: "All Platforms" },
    { id: "facebook", label: "Facebook Reels" },
    { id: "youtube", label: "YouTube Shorts" },
    { id: "tiktok", label: "TikTok Viral" },
  ]

  const countries = [
    { code: "Bangladesh", label: "Bangladesh" },
    { code: "United States", label: "United States" },
    { code: "United Kingdom", label: "United Kingdom" },
    { code: "India", label: "India" },
    { code: "United Arab Emirates", label: "UAE (Dubai)" },
    { code: "All Countries", label: "Global Worldwide" },
  ]

  const categories = [
    "All Categories",
    "Fashion & Apparel",
    "Tech & Gadgets",
    "Health & Beauty",
    "Food & Cooking",
    "Digital Products",
    "Real Estate",
  ]

  return (
    <div className="max-w-6xl space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">Viral Content Finder</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                ভাইরাল কনটেন্ট রিসার্চ ইঞ্জিন: Facebook, YouTube ও TikTok থেকে ট্রেন্ডিং কনটেন্ট বিশ্লেষণ এবং অটোমেশন
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-nowrap">
          <div className="flex items-center space-x-1 border border-border rounded-lg p-1 bg-card text-xs shadow-xs">
            <button
              onClick={() => setActiveTab("Feed")}
              className={`px-3.5 py-1.5 rounded-md font-semibold transition flex items-center space-x-1.5 shrink-0 ${
                activeTab === "Feed" ? "bg-blue-600 text-white shadow-xs" : "hover:bg-muted text-muted-foreground"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Trending Feed ({results.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("Bookmarks")}
              className={`px-3.5 py-1.5 rounded-md font-semibold transition flex items-center space-x-1.5 shrink-0 ${
                activeTab === "Bookmarks" ? "bg-blue-600 text-white shadow-xs" : "hover:bg-muted text-muted-foreground"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved ({bookmarks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("Formulas")}
              className={`px-3.5 py-1.5 rounded-md font-semibold transition flex items-center space-x-1.5 shrink-0 ${
                activeTab === "Formulas" ? "bg-blue-600 text-white shadow-xs" : "hover:bg-muted text-muted-foreground"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Viral Blueprint</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === "Formulas" ? (
        /* Blueprint & Formulas Tab */
        <div className="space-y-6">
          <div className="border border-border bg-card p-6 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 rounded-lg">
                <Lightbulb className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold tracking-tight text-foreground">The 2026 Viral Content Architecture</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Based on algorithmic analysis of over 50,000+ top performing Reels, Shorts, and TikToks in South Asia & Global markets.
              Ethically study the curiosity hook, replicate the pacing, and generate high organic buyer engagement.
            </p>

            <div className="grid gap-4 md:grid-cols-3 pt-2">
              <div className="border border-border bg-card p-4 rounded-xl space-y-2 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-200/50">
                  Format 01
                </span>
                <h3 className="font-bold text-sm text-foreground">The "Stop-Scrolling" Mystery Hook</h3>
                <p className="text-xs text-muted-foreground">
                  The first 1.8 seconds must present an impossible question or a shocking visual demonstration without revealing the answer immediately.
                </p>
                <div className="text-[11px] font-mono bg-muted p-2 rounded border border-border">
                  "৯৯% মানুষ অনলাইনে শপিং করার সময় এই বড় ভুলটি করে..."
                </div>
              </div>

              <div className="border border-border bg-card p-4 rounded-xl space-y-2 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-200/50">
                  Format 02
                </span>
                <h3 className="font-bold text-sm text-foreground">The Pain vs Transformation</h3>
                <p className="text-xs text-muted-foreground">
                  Display extreme friction or unboxing problem in frame 1, followed by instantaneous satisfying resolution in frame 2.
                </p>
                <div className="text-[11px] font-mono bg-muted p-2 rounded border border-border">
                  "দাম বেশি দিয়েও নকল পণ্য পেয়ে প্রতারিত হলেন? দেখুন আসল চিনবেন যেভাবে।"
                </div>
              </div>

              <div className="border border-border bg-card p-4 rounded-xl space-y-2 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-200/50">
                  Format 03
                </span>
                <h3 className="font-bold text-sm text-foreground">The Behind-The-Scenes Proof</h3>
                <p className="text-xs text-muted-foreground">
                  Raw unedited warehouse packing, direct farm harvesting, or live factory manufacturing builds 400% higher buyer trust.
                </p>
                <div className="text-[11px] font-mono bg-muted p-2 rounded border border-border">
                  "সুন্দরবনের গভীর থেকে সরাসরি মৌচাক কাটার দৃশ্য দেখুন লাইভ!"
                </div>
              </div>
            </div>
          </div>

          {/* Quick CTA to return */}
          <div className="flex justify-center">
            <button
              onClick={() => setActiveTab("Feed")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-xs transition flex items-center space-x-2 text-xs"
            >
              <span>Explore Live Trending Feed</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Search & Feed / Bookmarks Area */
        <div className="space-y-6">
          {/* Search & Filter Studio Bar (Feed only) */}
          {activeTab === "Feed" && (
            <div className="border border-border bg-card p-5 rounded-2xl shadow-xs space-y-4 text-xs">
              {/* Platform Selector Buttons */}
              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider block">
                  Select Social Platform
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {platforms.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedPlatform(p.id as any)
                        setVisibleCount(5)
                        searchViralContent({
                          platform: p.id as any,
                          country: selectedCountry,
                          category: selectedCategory,
                          keyword: searchKeyword,
                          minLikes: minLikesFilter,
                        })
                      }}
                      className={`py-2 px-3 rounded-xl border font-semibold text-xs transition flex items-center justify-center space-x-2 min-h-[38px] ${
                        selectedPlatform === p.id
                          ? "bg-blue-600 text-white shadow-xs border-blue-600"
                          : "bg-background hover:bg-muted text-foreground border-border"
                      }`}
                    >
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Keyword Search & Presets */}
              <form onSubmit={handleSearch} className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search viral keywords (e.g. Eid sale, smart watch, skincare, recipe, honey)..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-border rounded-xl bg-background font-medium text-xs sm:text-sm min-h-[40px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl shadow-xs transition flex items-center space-x-2 shrink-0 min-h-[40px]"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Searching...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Find Viral</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-semibold text-muted-foreground mr-1">Hot Trends:</span>
                  {presetKeywords.map((tag) => (
                    <button
                      key={tag.query}
                      type="button"
                      onClick={() => {
                        setSearchKeyword(tag.query)
                        searchViralContent({
                          platform: selectedPlatform,
                          country: selectedCountry,
                          category: selectedCategory,
                          keyword: tag.query,
                          minLikes: minLikesFilter,
                        })
                      }}
                      className="text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-border bg-muted/30 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:border-blue-800 dark:hover:text-blue-300 transition text-muted-foreground"
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </form>

              {/* Country, Category & Engagement Filters */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-2 border-t border-border">
                <div>
                  <label className="font-semibold block mb-1 text-muted-foreground">Target Country</label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => {
                      setSelectedCountry(e.target.value)
                      searchViralContent({
                        platform: selectedPlatform,
                        country: e.target.value,
                        category: selectedCategory,
                        keyword: searchKeyword,
                        minLikes: minLikesFilter,
                      })
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background font-medium text-xs min-h-[38px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  >
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-muted-foreground">Category / Niche</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value)
                      searchViralContent({
                        platform: selectedPlatform,
                        country: selectedCountry,
                        category: e.target.value,
                        keyword: searchKeyword,
                        minLikes: minLikesFilter,
                      })
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background font-medium text-xs min-h-[38px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-muted-foreground">Min Likes Threshold</label>
                  <select
                    value={minLikesFilter}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setMinLikesFilter(val)
                      searchViralContent({
                        platform: selectedPlatform,
                        country: selectedCountry,
                        category: selectedCategory,
                        keyword: searchKeyword,
                        minLikes: val,
                      })
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background font-medium text-xs min-h-[38px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  >
                    <option value={0}>Any Engagement</option>
                    <option value={10000}>10K+ Likes</option>
                    <option value={50000}>50K+ Likes</option>
                    <option value={100000}>100K+ Likes</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-muted-foreground">Sort Results By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background font-medium text-xs min-h-[38px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  >
                    <option value="score">Highest AI Viral Index</option>
                    <option value="views">Most Views</option>
                    <option value="likes">Most Likes</option>
                    <option value="shares">Most Shares</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Platform Account Connection / Live Status Notices */}
          {activeTab === "Feed" && selectedPlatform === "facebook" && (
            <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 text-xs space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center space-x-2 font-bold text-blue-600 dark:text-blue-400 text-sm">
                  <Film className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Facebook Meta Graph API Integration</span>
                </div>
                <button
                  onClick={() => router.push(`/workspace/${workspaceId}/safe/connect-accounts`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3.5 py-1.5 rounded-lg transition text-xs shrink-0 shadow-xs"
                >
                  Connect FB Pages
                </button>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                ফেসবুকের কঠোর প্রাইভেসি পলিসির কারণে পাবলিক রিলস অননুমোদিতভাবে স্ক্র্যাপ করা যায় না। আপনার ফেসবুক পেজ কানেক্ট করলে অফিশিয়াল Meta Graph API দিয়ে আপনার ইন্ডাস্ট্রির রিয়েল-টাইম লাইভ রিলস ও মেট্রিক্স আনলক হবে। নিচে বর্তমানে পাবলিকলি ভেরিফাইড ফেসবুক রিলস প্রদর্শিত হচ্ছে।
              </p>
            </div>
          )}

          {activeTab === "Feed" && selectedPlatform === "tiktok" && (
            <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 text-xs space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center space-x-2 font-bold text-blue-600 dark:text-blue-400 text-sm">
                  <Film className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>TikTok Creator API Integration</span>
                </div>
                <button
                  onClick={() => setShowTikTokModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3.5 py-1.5 rounded-lg transition text-xs shrink-0 shadow-xs"
                >
                  Connect TikTok Account
                </button>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                টিকটক পলিসি অনুযায়ী বট বা স্ক্র্যাপারদের মাধ্যমে আনঅথেনটিকেটেড ভিডিও ফেচ ব্লক থাকে। আপনার টিকটক ক্রিয়েটর অ্যাকাউন্ট কানেক্ট করলে ট্রেন্ডিং ক্রিয়েটর ও সাউন্ড অ্যানালাইসিস আনলক হবে। নিচে বর্তমানে ভেরিফাইড গ্লোবাল টিকটক ট্রেন্ড প্রদর্শিত হচ্ছে।
              </p>
            </div>
          )}

          {activeTab === "Feed" && selectedPlatform === "youtube" && (
            <div className="p-3 rounded-xl border border-border bg-card text-xs flex items-center justify-between text-muted-foreground shadow-xs">
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                <span className="text-[11px] font-medium text-foreground flex items-center space-x-1.5">
                  <Film className="w-3.5 h-3.5 text-blue-600 inline" />
                  <span>YouTube Live Shorts & Video Engine: ১০০% ওপেন পাবলিক সার্চ সক্রিয় রয়েছে (কোনো লগইন ছাড়াই লাইভ ট্রেন্ড লোড হচ্ছে)।</span>
                </span>
              </span>
            </div>
          )}

          {/* Active Results Summary Banner */}
          <div className="flex items-center justify-between text-xs px-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-foreground">
                {activeTab === "Bookmarks" ? "Saved Bookmarks" : "Discovered Viral Content"}
              </span>
              <span className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 font-bold px-2 py-0.5 rounded-full text-[10px]">
                {sortedItems.length} items
              </span>
            </div>

            {activeTab === "Feed" && (
              <span className="text-muted-foreground text-[11px] flex items-center space-x-1">
                <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>
                  Filtering: <b>{selectedCountry}</b> &bull; <b>{selectedCategory}</b>
                </span>
              </span>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 border border-red-200 bg-red-50 text-red-700 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-300 rounded-xl text-xs flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => handleSearch()}
                className="font-bold underline hover:no-underline ml-2"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-border bg-card p-4 rounded-2xl space-y-4 animate-pulse">
                  <div className="w-full h-44 bg-muted rounded-xl"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          )}

          {/* Empty Bookmarks State */}
          {!isLoading && activeTab === "Bookmarks" && bookmarks.length === 0 && (
            <div className="text-center py-16 border border-border rounded-2xl bg-card space-y-3 shadow-xs">
              <span className="p-3 bg-muted rounded-full inline-block">
                <Bookmark className="w-8 h-8 text-muted-foreground" />
              </span>
              <h3 className="font-bold text-sm text-foreground">No Saved Viral Bookmarks Yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Explore the Trending Feed and click the bookmark icon on any viral reel to save it for your marketing campaigns.
              </p>
              <button
                onClick={() => setActiveTab("Feed")}
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-xs transition"
              >
                Browse Trending Feed
              </button>
            </div>
          )}

          {/* Viral Items Grid */}
          {!isLoading && sortedItems.length > 0 && (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visibleItems.map((item) => {
                const bookmarked = isBookmarked(item.id)
                const isLibrarySaved = !!savedLibraryIds[item.id]

                return (
                  <div
                    key={item.id}
                    className="border border-border bg-card rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group hover:border-blue-500/40"
                  >
                    <div>
                      {/* Media Header & Thumbnail / In-Card Player */}
                      <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                        {playingVideoId === item.id ? (
                          <div className="relative w-full h-full bg-black">
                            <iframe
                              src={getEmbedUrl(item)}
                              title={item.title}
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />
                            {/* Floating Close Player Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setPlayingVideoId(null)
                              }}
                              className="absolute top-2 right-2 z-30 bg-black/80 hover:bg-blue-600 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg backdrop-blur-md transition flex items-center space-x-1 shadow-xl border border-white/10"
                              title="Close In-Card Player"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Close</span>
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => setPlayingVideoId(item.id)}
                            className="relative w-full h-full cursor-pointer group/player select-none"
                          >
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover/player:scale-105 transition duration-300 opacity-90"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40"></div>

                            {/* Centered Glowing Play Icon */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-600 group-hover/player:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover/player:scale-110 transition duration-300 ring-4 ring-white/30">
                                <Play className="w-6 h-6 fill-white translate-x-0.5" />
                              </div>
                              <span className="mt-2 text-[10px] font-bold text-white bg-slate-900/80 px-2.5 py-0.5 rounded-full backdrop-blur-md shadow tracking-wide group-hover/player:bg-blue-600 transition duration-300 flex items-center space-x-1">
                                <Play className="w-2.5 h-2.5 fill-white inline" />
                                <span>Play in App</span>
                              </span>
                            </div>

                            {/* Top Badges */}
                            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs bg-slate-900/80 text-white backdrop-blur-md border border-white/10">
                                {item.platform === "Facebook" && "Facebook Reel"}
                                {item.platform === "TikTok" && "TikTok Viral"}
                                {item.platform === "YouTube" && "YouTube Shorts"}
                              </span>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleBookmark(item)
                                }}
                                className={`p-1.5 rounded-full backdrop-blur-md transition pointer-events-auto ${
                                  bookmarked
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "bg-black/40 text-white/80 hover:bg-black/70 hover:text-white"
                                }`}
                                title={bookmarked ? "Remove Bookmark" : "Save to Bookmarks"}
                              >
                                {bookmarked ? (
                                  <BookmarkCheck className="w-4 h-4" />
                                ) : (
                                  <Bookmark className="w-4 h-4" />
                                )}
                              </button>
                            </div>

                            {/* AI Viral Index Badge */}
                            <div className="absolute bottom-2.5 left-2.5 flex items-center space-x-1.5">
                              <span className="bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-md shadow-xs flex items-center space-x-1">
                                <Sparkles className="w-3 h-3" />
                                <span>{item.viralScore}/100 VIRAL INDEX</span>
                              </span>
                            </div>

                            {/* Posted Time */}
                            <div className="absolute bottom-2.5 right-2.5 text-[10px] font-medium text-white/90 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded">
                              {item.postedTime}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content Details */}
                      <div className="p-4 space-y-3 text-xs">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground border-b border-border pb-2">
                          <span className="font-bold text-foreground truncate max-w-[170px]">
                            {item.author}
                          </span>
                          <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-semibold text-muted-foreground">
                            {item.country} &bull; {item.category}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-bold text-sm text-foreground line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                            {item.title}
                          </h3>
                          <p className="text-muted-foreground text-xs line-clamp-3 mt-1.5 leading-relaxed">
                            {item.caption}
                          </p>
                        </div>

                        {/* Metrics Bar */}
                        <div className="grid grid-cols-4 gap-1 text-center py-2 bg-muted/40 rounded-xl border border-border text-[10px] font-semibold">
                          <div className="flex flex-col items-center">
                            <span className="text-muted-foreground flex items-center space-x-0.5">
                              <Eye className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              <span>Views</span>
                            </span>
                            <span className="font-bold text-foreground mt-0.5">
                              {formatCount(item.views)}
                            </span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-muted-foreground flex items-center space-x-0.5">
                              <Heart className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              <span>Likes</span>
                            </span>
                            <span className="font-bold text-foreground mt-0.5">
                              {formatCount(item.likes)}
                            </span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-muted-foreground flex items-center space-x-0.5">
                              <MessageCircle className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              <span>Comments</span>
                            </span>
                            <span className="font-bold text-foreground mt-0.5">
                              {formatCount(item.comments)}
                            </span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-muted-foreground flex items-center space-x-0.5">
                              <Share2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              <span>Shares</span>
                            </span>
                            <span className="font-bold text-foreground mt-0.5">
                              {formatCount(item.shares)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cross-Module Pipeline Actions */}
                    <div className="p-4 pt-0 space-y-2 border-t border-border mt-1">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {/* Action 1: Download Media (Module 7) */}
                        <button
                          onClick={() => handleDownloadInModule7(item)}
                          className="bg-background hover:bg-muted border border-border text-foreground font-semibold py-2 px-2.5 rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5 text-[11px] min-h-[36px]"
                          title="Open in Public Media Downloader"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Download</span>
                        </button>

                        {/* Action 2: Save to Library (Module 3) */}
                        <button
                          onClick={() => handleSaveToAssetLibrary(item)}
                          disabled={isLibrarySaved}
                          className={`font-semibold py-2 px-2.5 rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5 text-[11px] min-h-[36px] ${
                            isLibrarySaved
                              ? "bg-blue-600 text-white"
                              : "bg-background hover:bg-muted text-foreground border border-border"
                          }`}
                        >
                          {isLibrarySaved ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Saved!</span>
                            </>
                          ) : (
                            <>
                              <FolderPlus className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>Library</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Action 3: AI Rewrite in Scheduler (Module 1) */}
                      <button
                        onClick={() => handleImportToScheduler(item)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5 text-xs min-h-[36px]"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Rewrite in Scheduler</span>
                      </button>

                      {/* View Original External Link */}
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full text-center py-2 px-3 rounded-xl bg-background hover:bg-muted text-[11px] text-foreground font-semibold border border-border hover:border-blue-500/50 transition flex items-center justify-center space-x-1.5 group/link shadow-xs min-h-[36px]"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover/link:text-blue-600 transition" />
                        <span>View Original on {item.platform}</span>
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* See More Videos Button (+5 Videos) - Always visible so user can continuously add 5 more videos */}
            {activeTab === "Feed" && sortedItems.length > 0 && (
              <div className="flex justify-center pt-8 pb-4">
                <button
                  onClick={handleLoadMoreVideos}
                  disabled={isLoadingMore}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-8 py-3 rounded-xl shadow-xs transition flex items-center space-x-2 text-xs cursor-pointer min-h-[44px]"
                >
                  {isLoadingMore ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Adding 5 more viral videos...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      <span>See More Viral Videos (+5 Videos)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
        </div>
      )}
      {/* TikTok Integration Modal */}
      {showTikTokModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <span className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 rounded-lg">
                  <Film className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-sm text-foreground">TikTok Creator API Integration</h3>
              </div>
              <button
                onClick={() => setShowTikTokModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold">
                Status: TikTok Business & Creator Login API
              </div>
              <p>
                BMT মূলত <b>ফেসবুক মার্কেটিং ও অটোমেশন (Meta Graph API)</b> প্ল্যাটফর্ম। ফেসবুক পেজ কানেকশন মডিউলটি এখনই সক্রিয় ও প্রস্তুত রয়েছে।
              </p>
              <p>
                টিকটকের পলিসি অনুযায়ী বট বা থার্ড-পার্টি স্ক্র্যাপিং কঠোরভাবে নিষিদ্ধ। টিকটক ডেভেলপার অ্যাপ অনুমোদন সম্পন্ন হওয়ার পর পরবর্তী ফেজে সরাসরি টিকটক অ্যাকাউন্ট অথেন্টিকেশন যুক্ত করা হবে।
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowTikTokModal(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition shadow-xs min-h-[36px]"
              >
                ঠিক আছে, বুঝতে পেরেছি
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
