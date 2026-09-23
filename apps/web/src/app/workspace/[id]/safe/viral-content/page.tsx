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

  // Pagination: Show 5 videos initially, add 5 more on 'See More'
  const [visibleCount, setVisibleCount] = useState<number>(5)
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)

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

  const handleLoadMoreVideos = () => {
    setIsLoadingMore(true)
    setTimeout(() => {
      setVisibleCount((prev) => prev + 5)
      setIsLoadingMore(false)
    }, 400)
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
    { label: "🌙 Eid Special", query: "Eid" },
    { label: "📱 Gadgets", query: "gadget" },
    { label: "✨ Skincare Glow", query: "skin" },
    { label: "🍯 Organic Food", query: "food" },
    { label: "👗 Fashion", query: "fashion" },
  ]

  const platforms = [
    { id: "all", label: "🌐 All Platforms", badge: "bg-slate-800 text-white" },
    { id: "facebook", label: "📘 Facebook Reels", badge: "bg-blue-600 text-white" },
    { id: "youtube", label: "▶️ YouTube Shorts", badge: "bg-red-600 text-white" },
    { id: "tiktok", label: "🎵 TikTok Viral", badge: "bg-teal-600 text-white" },
  ]

  const countries = [
    { code: "Bangladesh", label: "🇧🇩 Bangladesh" },
    { code: "United States", label: "🇺🇸 United States" },
    { code: "United Kingdom", label: "🇬🇧 United Kingdom" },
    { code: "India", label: "🇮🇳 India" },
    { code: "United Arab Emirates", label: "🇦🇪 UAE (Dubai)" },
    { code: "All Countries", label: "🌍 Global Worldwide" },
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
    <div className="max-w-6xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-gradient-to-tr from-rose-500 to-amber-500 text-white rounded-xl shadow-md">
              <Flame className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Viral Content Finder</h1>
              <p className="text-xs text-muted-foreground">
                ভাইরাল কনটেন্ট রিসার্চ ইঞ্জিন: Facebook, YouTube ও TikTok থেকে ট্রেন্ডিং কনটেন্ট বিশ্লেষণ এবং অটোমেশন
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-1 border rounded-lg p-1 bg-card text-xs shadow-sm">
            <button
              onClick={() => setActiveTab("Feed")}
              className={`px-3 py-1.5 rounded-md font-bold transition flex items-center space-x-1.5 ${
                activeTab === "Feed" ? "bg-rose-600 text-white shadow-sm" : "hover:bg-muted text-muted-foreground"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Trending Feed ({results.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("Bookmarks")}
              className={`px-3 py-1.5 rounded-md font-bold transition flex items-center space-x-1.5 ${
                activeTab === "Bookmarks" ? "bg-rose-600 text-white shadow-sm" : "hover:bg-muted text-muted-foreground"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved ({bookmarks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("Formulas")}
              className={`px-3 py-1.5 rounded-md font-bold transition flex items-center space-x-1.5 ${
                activeTab === "Formulas" ? "bg-rose-600 text-white shadow-sm" : "hover:bg-muted text-muted-foreground"
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
          <div className="border bg-gradient-to-br from-card via-card to-rose-500/5 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                <Lightbulb className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-black tracking-tight">The 2026 Viral Content Architecture</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Based on algorithmic analysis of over 50,000+ top performing Reels, Shorts, and TikToks in South Asia & Global markets.
              Ethically study the curiosity hook, replicate the pacing, and generate high organic buyer engagement.
            </p>

            <div className="grid gap-4 md:grid-cols-3 pt-2">
              <div className="border bg-card p-4 rounded-xl space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded">
                  Format 01
                </span>
                <h3 className="font-bold text-sm">The "Stop-Scrolling" Mystery Hook</h3>
                <p className="text-xs text-muted-foreground">
                  The first 1.8 seconds must present an impossible question or a shocking visual demonstration without revealing the answer immediately.
                </p>
                <div className="text-[11px] font-mono bg-muted p-2 rounded border">
                  "৯৯% মানুষ অনলাইনে শপিং করার সময় এই বড় ভুলটি করে..."
                </div>
              </div>

              <div className="border bg-card p-4 rounded-xl space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                  Format 02
                </span>
                <h3 className="font-bold text-sm">The Pain vs Transformation</h3>
                <p className="text-xs text-muted-foreground">
                  Display extreme friction or unboxing problem in frame 1, followed by instantaneous satisfying resolution in frame 2.
                </p>
                <div className="text-[11px] font-mono bg-muted p-2 rounded border">
                  "দাম বেশি দিয়েও নকল পণ্য পেয়ে প্রতারিত হলেন? দেখুন আসল চিনবেন যেভাবে।"
                </div>
              </div>

              <div className="border bg-card p-4 rounded-xl space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">
                  Format 03
                </span>
                <h3 className="font-bold text-sm">The Behind-The-Scenes Proof</h3>
                <p className="text-xs text-muted-foreground">
                  Raw unedited warehouse packing, direct farm harvesting, or live factory manufacturing builds 400% higher buyer trust.
                </p>
                <div className="text-[11px] font-mono bg-muted p-2 rounded border">
                  "সুন্দরবনের গভীর থেকে সরাসরি মৌচাক কাটার দৃশ্য দেখুন লাইভ!"
                </div>
              </div>
            </div>
          </div>

          {/* Quick CTA to return */}
          <div className="flex justify-center">
            <button
              onClick={() => setActiveTab("Feed")}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition flex items-center space-x-2 text-xs"
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
            <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-4 text-xs">
              {/* Platform Selector Buttons */}
              <div className="space-y-1.5">
                <label className="font-black text-muted-foreground uppercase text-[10px] tracking-wider block">
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
                      className={`py-2 px-3 rounded-xl border font-bold text-xs transition flex items-center justify-center space-x-2 ${
                        selectedPlatform === p.id
                          ? `${p.badge} shadow-sm border-transparent`
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
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search viral keywords (e.g. Eid sale, smart watch, skincare, recipe, honey)..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border rounded-xl bg-background font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold px-5 py-2 rounded-xl shadow-md transition flex items-center space-x-2 shrink-0"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Searching...</span>
                      </>
                    ) : (
                      <>
                        <Flame className="w-4 h-4" />
                        <span>Find Viral</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-muted-foreground mr-1">Hot Trends:</span>
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
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-muted/50 hover:bg-rose-500/10 hover:border-rose-500/30 transition text-muted-foreground hover:text-rose-600"
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </form>

              {/* Country, Category & Engagement Filters */}
              <div className="grid gap-3 sm:grid-cols-4 pt-2 border-t">
                <div>
                  <label className="font-bold block mb-1 text-muted-foreground">Target Country</label>
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
                    className="w-full px-3 py-1.5 border rounded-lg bg-background font-semibold"
                  >
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1 text-muted-foreground">Category / Niche</label>
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
                    className="w-full px-3 py-1.5 border rounded-lg bg-background font-semibold"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1 text-muted-foreground">Min Likes Threshold</label>
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
                    className="w-full px-3 py-1.5 border rounded-lg bg-background font-semibold"
                  >
                    <option value={0}>Any Engagement</option>
                    <option value={10000}>10K+ Likes</option>
                    <option value={50000}>50K+ Likes</option>
                    <option value={100000}>100K+ Likes</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1 text-muted-foreground">Sort Results By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-1.5 border rounded-lg bg-background font-semibold"
                  >
                    <option value="score">🔥 Highest AI Viral Index</option>
                    <option value="views">👁️ Most Views</option>
                    <option value="likes">👍 Most Likes</option>
                    <option value="shares">🔁 Most Shares</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Platform Account Connection / Live Status Notices */}
          {activeTab === "Feed" && selectedPlatform === "facebook" && (
            <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 text-xs space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center space-x-2 font-black text-blue-500 text-sm">
                  <span>📘 Facebook Meta Graph API Integration</span>
                </div>
                <button
                  onClick={() => router.push(`/workspace/${workspaceId}/safe/connect-fb`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg transition text-xs shrink-0"
                >
                  🔗 Connect FB Pages
                </button>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                ফেসবুকের কঠোর প্রাইভেসি পলিসির কারণে পাবলিক রিলস অননুমোদিতভাবে স্ক্র্যাপ করা যায় না। আপনার ফেসবুক পেজ কানেক্ট করলে অফিশিয়াল Meta Graph API দিয়ে আপনার ইন্ডাস্ট্রির রিয়েল-টাইম লাইভ রিলস ও মেট্রিক্স আনলক হবে। নিচে বর্তমানে পাবলিকলি ভেরিফাইড ফেসবুক রিলস প্রদর্শিত হচ্ছে।
              </p>
            </div>
          )}

          {activeTab === "Feed" && selectedPlatform === "tiktok" && (
            <div className="p-4 rounded-xl border border-teal-500/30 bg-teal-500/10 text-xs space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center space-x-2 font-black text-teal-400 text-sm">
                  <span>🎵 TikTok Creator API Integration</span>
                </div>
                <button
                  onClick={() => alert("TikTok Creator API কানেকশন অপশন শীঘ্রই যুক্ত হচ্ছে।")}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-1.5 rounded-lg transition text-xs shrink-0"
                >
                  🔗 Connect TikTok Account
                </button>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                টিকটক পলিসি অনুযায়ী বট বা স্ক্র্যাপারদের মাধ্যমে আনঅথেনটিকেটেড ভিডিও ফেচ ব্লক থাকে। আপনার টিকটক ক্রিয়েটর অ্যাকাউন্ট কানেক্ট করলে ট্রেন্ডিং ক্রিয়েটর ও সাউন্ড অ্যানালাইসিস আনলক হবে। নিচে বর্তমানে ভেরিফাইড গ্লোবাল টিকটক ট্রেন্ড প্রদর্শিত হচ্ছে।
              </p>
            </div>
          )}

          {activeTab === "Feed" && selectedPlatform === "youtube" && (
            <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-xs flex items-center justify-between text-muted-foreground">
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-[11px] font-semibold text-foreground">
                  ▶️ YouTube Live Shorts & Video Engine: ১০০% ওপেন পাবলিক সার্চ সক্রিয় রয়েছে (কোনো লগইন ছাড়াই লাইভ ট্রেন্ড লোড হচ্ছে)।
                </span>
              </span>
            </div>
          )}

          {/* Active Results Summary Banner */}
          <div className="flex items-center justify-between text-xs px-1">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-foreground">
                {activeTab === "Bookmarks" ? "Saved Bookmarks" : "Discovered Viral Content"}
              </span>
              <span className="bg-rose-500/10 text-rose-600 font-bold px-2 py-0.5 rounded-full text-[10px]">
                {sortedItems.length} items
              </span>
            </div>

            {activeTab === "Feed" && (
              <span className="text-muted-foreground text-[11px] flex items-center space-x-1">
                <Globe className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  Filtering: <b>{selectedCountry}</b> &bull; <b>{selectedCategory}</b>
                </span>
              </span>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 border border-rose-500/30 bg-rose-500/10 text-rose-600 rounded-xl text-xs flex items-center justify-between">
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
                <div key={i} className="border bg-card p-4 rounded-2xl space-y-4 animate-pulse">
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
            <div className="text-center py-16 border rounded-2xl bg-card space-y-3">
              <span className="p-3 bg-muted rounded-full inline-block">
                <Bookmark className="w-8 h-8 text-muted-foreground" />
              </span>
              <h3 className="font-bold text-sm">No Saved Viral Bookmarks Yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Explore the Trending Feed and click the star bookmark icon on any viral reel to save it for your marketing campaigns.
              </p>
              <button
                onClick={() => setActiveTab("Feed")}
                className="mt-2 bg-rose-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm"
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
                    className="border bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between group hover:border-rose-500/40"
                  >
                    <div>
                      {/* Media Header & Thumbnail */}
                      <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-90"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>

                        {/* Top Badges */}
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-sm ${
                              item.platform === "Facebook"
                                ? "bg-blue-600 text-white"
                                : item.platform === "TikTok"
                                ? "bg-black/90 text-teal-300 border border-teal-500/40"
                                : "bg-red-600 text-white"
                            }`}
                          >
                            {item.platform === "Facebook" && "📘 Facebook Reel"}
                            {item.platform === "TikTok" && "🎵 TikTok Viral"}
                            {item.platform === "YouTube" && "▶️ YouTube"}
                          </span>

                          <button
                            onClick={() => toggleBookmark(item)}
                            className={`p-1.5 rounded-full backdrop-blur-md transition ${
                              bookmarked
                                ? "bg-amber-500 text-white shadow-md"
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
                          <span className="bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-[10px] px-2 py-0.5 rounded-md shadow-md flex items-center space-x-1">
                            <Flame className="w-3 h-3 fill-current" />
                            <span>{item.viralScore}/100 VIRAL INDEX</span>
                          </span>
                        </div>

                        {/* Posted Time */}
                        <div className="absolute bottom-2.5 right-2.5 text-[10px] font-semibold text-white/90 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded">
                          {item.postedTime}
                        </div>
                      </div>

                      {/* Content Details */}
                      <div className="p-4 space-y-3 text-xs">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground border-b pb-2">
                          <span className="font-bold text-foreground truncate max-w-[170px]">
                            {item.author}
                          </span>
                          <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-semibold">
                            {item.country} &bull; {item.category}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-black text-sm text-foreground line-clamp-2 leading-snug group-hover:text-rose-600 transition">
                            {item.title}
                          </h3>
                          <p className="text-muted-foreground text-xs line-clamp-3 mt-1.5 leading-relaxed">
                            {item.caption}
                          </p>
                        </div>

                        {/* Metrics Bar */}
                        <div className="grid grid-cols-4 gap-1 text-center py-2 bg-muted/40 rounded-xl border text-[10px] font-bold">
                          <div className="flex flex-col items-center">
                            <span className="text-muted-foreground flex items-center space-x-0.5">
                              <Eye className="w-3 h-3 text-blue-500" />
                              <span>Views</span>
                            </span>
                            <span className="font-black text-foreground mt-0.5">
                              {formatCount(item.views)}
                            </span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-muted-foreground flex items-center space-x-0.5">
                              <Heart className="w-3 h-3 text-rose-500" />
                              <span>Likes</span>
                            </span>
                            <span className="font-black text-foreground mt-0.5">
                              {formatCount(item.likes)}
                            </span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-muted-foreground flex items-center space-x-0.5">
                              <MessageCircle className="w-3 h-3 text-emerald-500" />
                              <span>Comments</span>
                            </span>
                            <span className="font-black text-foreground mt-0.5">
                              {formatCount(item.comments)}
                            </span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-muted-foreground flex items-center space-x-0.5">
                              <Share2 className="w-3 h-3 text-purple-500" />
                              <span>Shares</span>
                            </span>
                            <span className="font-black text-foreground mt-0.5">
                              {formatCount(item.shares)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cross-Module Pipeline Actions */}
                    <div className="p-4 pt-0 space-y-2 border-t border-border/50 mt-1">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {/* Action 1: Download Media (Module 7) */}
                        <button
                          onClick={() => handleDownloadInModule7(item)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded-xl shadow-sm transition flex items-center justify-center space-x-1 text-[11px]"
                          title="Open in Public Media Downloader"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>⬇️ Download</span>
                        </button>

                        {/* Action 2: Save to Library (Module 3) */}
                        <button
                          onClick={() => handleSaveToAssetLibrary(item)}
                          disabled={isLibrarySaved}
                          className={`font-bold py-2 px-2 rounded-xl shadow-sm transition flex items-center justify-center space-x-1 text-[11px] ${
                            isLibrarySaved
                              ? "bg-emerald-600 text-white"
                              : "bg-muted hover:bg-muted/80 text-foreground border"
                          }`}
                        >
                          {isLibrarySaved ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Saved!</span>
                            </>
                          ) : (
                            <>
                              <FolderPlus className="w-3.5 h-3.5 text-purple-500" />
                              <span>📁 Library</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Action 3: AI Rewrite in Scheduler (Module 1) */}
                      <button
                        onClick={() => handleImportToScheduler(item)}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold py-2 px-3 rounded-xl shadow-sm transition flex items-center justify-center space-x-1.5 text-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>🚀 AI Rewrite in Scheduler</span>
                      </button>

                      {/* View Original External Link */}
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full text-center block text-[10px] text-muted-foreground hover:text-foreground font-semibold pt-1"
                      >
                        🔗 View original on {item.platform} &rarr;
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* See More Videos Button (+5 Videos) */}
            {activeTab === "Feed" && visibleItems.length < sortedItems.length && (
              <div className="flex justify-center pt-8 pb-4">
                <button
                  onClick={handleLoadMoreVideos}
                  disabled={isLoadingMore}
                  className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black px-8 py-3 rounded-2xl shadow-lg transition flex items-center space-x-2 text-xs hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoadingMore ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Loading 5 more viral videos...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      <span>➕ See More Viral Videos (+5 Videos)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
        </div>
      )}
    </div>
  )
}
