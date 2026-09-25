"use client"

import React, { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  FolderOpen,
  FolderPlus,
  Trash2,
  Plus,
  Smartphone,
  Monitor,
  Eye,
  EyeOff,
  ShoppingBag,
  DollarSign,
  Globe,
  Radio,
  Share2,
  CheckCircle2,
  Link2,
  Upload,
  Truck,
  ShieldCheck,
  Lock,
  X,
  Flame,
  ClipboardList,
  Send,
  AlertCircle,
} from "lucide-react"
import { useAssetLibrary } from "../../../../../hooks/useAssetLibrary"
import { useLandingPages, LandingPageProject, DropdownOption, SectionVisibility } from "../../../../../hooks/useLandingPages"

export default function SafeLandingPageBuilderPage() {
  const router = useRouter()
  const params = useParams()
  const workspaceId = (params?.id as string) || "workspace-1"

  const { addAsset, assets: libraryAssets } = useAssetLibrary()
  const { pages, createPage, deletePage } = useLandingPages(workspaceId)

  // Section Visibility State (Show / Hide controls for all elements)
  const [visibleSections, setVisibleSections] = useState<SectionVisibility>({
    announcementBar: true,
    categoryBadge: true,
    headline: true,
    subheadline: true,
    heroImage: true,
    features: true,
    pricingBadge: true,
    variantsDropdown: true,
    checkoutForm: true,
    trustBadges: true,
    adSlot: true,
  })

  const toggleSection = (section: keyof SectionVisibility) => {
    setVisibleSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Mobile Studio responsive tab state (< lg screens)
  const [mobileStudioTab, setMobileStudioTab] = useState<"editor" | "preview">("editor")

  // Editor states
  const [announcementBar, setAnnouncementBar] = useState("সীমিত সময়ের ধামাকা অফার • সারাদেশে ক্যাশ অন হোম ডেলিভারি ফ্রি!")
  const [category, setCategory] = useState<LandingPageProject["category"]>("E-Commerce & Gadgets")
  const [pageTitle, setPageTitle] = useState("Eid Special Premium Watch Landing Page")
  const [headline, setHeadline] = useState("ঈদের সেরা ধামাকা অফারে কিনুন অরিজিনাল আল্ট্রা স্মার্ট ওয়াচ!")
  const [subheadline, setSubheadline] = useState("অরিজিনাল অ্যামোলেড ডিসপ্লে, ব্লুটুথ কলিং ও ১ বছরের অফিসিয়াল ব্র্যান্ড ওয়ারেন্টি সহ। স্টক সীমিত!")
  const [heroImage, setHeroImage] = useState("https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop")
  const [features, setFeatures] = useState<string[]>([
    "অরিজিনাল ২.০২ ইঞ্চি সুপার অ্যামোলেড কালার ডিসপ্লে",
    "হাই-ডেফিনিশন ব্লুটুথ কলিং ও লাউড স্পিকার",
    "এক চার্জে টানা ৫ থেকে ৭ দিন ব্যাটারি ব্যাকআপ",
    "১ বছরের অফিসিয়াল ব্র্যান্ড রিপ্লেসমেন্ট ওয়ারেন্টি",
  ])
  const [productPrice, setProductPrice] = useState("২,৪৯০ টাকা (রেগুলার ৩,৯৯০ টাকা)")
  const [ctaText, setCtaText] = useState("এখনই ক্যাশ অন ডেলিভারিতে অর্ডার করুন")
  const [ctaAction, setCtaAction] = useState<"Order Form" | "WhatsApp Checkout">("Order Form")
  const [whatsappNumber, setWhatsappNumber] = useState("01700000000")

  // Client Specification: Interactive Offer Dropdown options
  const [dropdownTitle, setDropdownTitle] = useState("প্যাকেজ ও কালার ভ্যারিয়েন্ট বেছে নিন (Select Variant):")
  const [dropdownOptions, setDropdownOptions] = useState<DropdownOption[]>([
    { label: "1x Ultra Smart Watch - Jet Black (Silver Bezel)", price: "২,৪৯০ টাকা" },
    { label: "1x Ultra Smart Watch - Ocean Orange (Sport Loop)", price: "২,৪৯০ টাকা" },
    { label: "2x Combo Pack (Black + Orange) - স্পেশাল গিফট প্যাক", price: "৪,৫০০ টাকা (Save ৫০০৳)" },
  ])

  // Client Specification: Monetization Ad Slot
  const [adEnabled, setAdEnabled] = useState(true)
  const [adType, setAdType] = useState<"Banner Image" | "Custom HTML / AdSense">("Banner Image")
  const [adImageUrl, setAdImageUrl] = useState("https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop")
  const [adTargetUrl, setAdTargetUrl] = useState("https://bmt.cards/eid-mega-offer")
  const [adHtmlSnippet, setAdHtmlSnippet] = useState("<div style='background:#fef3c7;padding:12px;border-radius:8px;font-weight:bold;'>Google AdSense 728x90 Banner Slot</div>")

  // Preview & modal states
  const [previewDevice, setPreviewDevice] = useState<"Desktop" | "Mobile">("Desktop")
  const [selectedPreviewOptionIdx, setSelectedPreviewOptionIdx] = useState(0)
  const [activePublishedPage, setActivePublishedPage] = useState<LandingPageProject | null>(null)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [showAssetPicker, setShowAssetPicker] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)

  // Direct PC Upload ref
  const localImageInputRef = React.useRef<HTMLInputElement | null>(null)
  const handleDirectImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return
    const file = e.target.files[0]
    showToast("Uploading hero image...")
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      })
      if (res.ok) {
        const data = await res.json()
        setHeroImage(data.url)
        showToast("Hero image uploaded from PC!")
      } else {
        const localPreview = URL.createObjectURL(file)
        setHeroImage(localPreview)
        showToast("Hero image loaded from PC!")
      }
    } catch {
      const localPreview = URL.createObjectURL(file)
      setHeroImage(localPreview)
      showToast("Hero image loaded from PC!")
    }
  }

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  // Feature Bullet Points handlers
  const handleAddFeature = () => {
    setFeatures([...features, "নতুন বিশেষ সুবিধা বা অফার"])
  }
  const handleRemoveFeature = (index: number) => {
    if (features.length <= 1) return
    setFeatures(features.filter((_, i) => i !== index))
  }
  const handleFeatureChange = (index: number, val: string) => {
    const next = [...features]
    next[index] = val
    setFeatures(next)
  }

  // Add new dropdown option
  const handleAddDropdownOption = () => {
    setDropdownOptions([...dropdownOptions, { label: "New Package Option", price: productPrice }])
  }

  // Remove dropdown option
  const handleRemoveDropdownOption = (index: number) => {
    if (dropdownOptions.length <= 1) {
      showToast("At least one package option is required!", "error")
      return
    }
    setDropdownOptions(dropdownOptions.filter((_, i) => i !== index))
  }

  // Publish Page Handler
  const handlePublishLandingPage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pageTitle.trim() || !headline.trim()) {
      showToast("Project Name and Main Headline are required!", "error")
      return
    }

    const newPage = createPage({
      title: pageTitle.trim(),
      category,
      announcementBar: announcementBar.trim(),
      headline: headline.trim(),
      subheadline: subheadline.trim(),
      heroImage: heroImage.trim() || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop",
      features: features.map((f) => f.trim()).filter(Boolean),
      productPrice: productPrice.trim(),
      ctaText: ctaText.trim(),
      ctaAction,
      whatsappNumber: whatsappNumber.trim(),
      dropdownTitle: dropdownTitle.trim(),
      dropdownOptions,
      adSlot: {
        enabled: adEnabled,
        adType,
        adImageUrl: adImageUrl.trim(),
        adTargetUrl: adTargetUrl.trim(),
        adHtmlSnippet: adHtmlSnippet.trim(),
      },
      visibleSections,
      status: "Published",
      workspaceId,
    })

    setActivePublishedPage(newPage)
    showToast("Smart Landing Page Published Successfully!")
  }

  // Copy Link
  const handleCopyLink = (slug: string) => {
    const fullUrl = `${window.location.origin}/p/${slug}`
    navigator.clipboard.writeText(fullUrl)
    setCopiedSlug(slug)
    showToast("Landing page URL copied to clipboard!")
    setTimeout(() => setCopiedSlug(null), 2500)
  }

  // Save to Central Asset Library (Module 3)
  const handleSaveToLibrary = (page: LandingPageProject) => {
    addAsset({
      title: `${page.title} (Landing Page)`,
      type: "Link",
      folder: "Link Cards",
      url: page.heroImage,
      targetUrl: `${window.location.origin}/p/${page.slug}`,
      tags: ["landing-page", page.category.toLowerCase().replace(/[^a-z0-9]+/g, "-"), "offer"],
      size: "2.1 MB (Landing Page)",
    })
    showToast("Landing page link saved to Central Asset Library!")
  }

  // Pick Image from Asset Library
  const handlePickAsset = (url?: string) => {
    if (url) {
      setHeroImage(url)
      setShowAssetPicker(false)
      showToast("Image selected from Asset Library!", "success")
    }
  }

  return (
    <div className="space-y-6 max-w-7xl pb-24">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Smart Landing Page Builder
            </h1>
            <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-500/20">
              Interactive Dropdown & ADS Ready
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-2xl">
            Build high-converting offer landing pages based on client categories. Features interactive variant dropdowns and Monetization Ad Slots.
          </p>
        </div>

        {/* Device Preview Toggle */}
        <div className="flex items-center space-x-1.5 bg-muted p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setPreviewDevice("Desktop")}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              previewDevice === "Desktop"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setPreviewDevice("Mobile")}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              previewDevice === "Mobile"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
        </div>
      </div>

      {/* 2. Success Banner when Published */}
      {activePublishedPage && (
        <div className="p-4 border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl space-y-3 animate-in fade-in duration-200 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 dark:border-blue-900/30 pb-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="font-extrabold text-foreground text-sm">
                Landing Page Published & Active on Subdomain!
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveToLibrary(activePublishedPage)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-xs"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Save to Library</span>
              </button>
              <button
                type="button"
                onClick={() => router.push(`/workspace/${workspaceId}/safe/clickable-image`)}
                className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Create Clickable Card →</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-lg border border-border">
            <div className="space-y-0.5 truncate">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Public Live Page Link:
              </span>
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 truncate block">
                {typeof window !== "undefined" ? `${window.location.origin}/p/${activePublishedPage.slug}` : `/p/${activePublishedPage.slug}`}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleCopyLink(activePublishedPage.slug)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-xs text-xs"
              >
                {copiedSlug === activePublishedPage.slug ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSlug === activePublishedPage.slug ? "Copied" : "Copy URL"}</span>
              </button>
              <a
                href={`/p/${activePublishedPage.slug}`}
                target="_blank"
                rel="noreferrer"
                className="bg-muted hover:bg-muted/80 text-foreground font-bold px-3 py-1.5 rounded-lg border border-border transition flex items-center gap-1.5 text-xs shadow-xs"
              >
                <span>Open Live Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Studio Responsive Navigation Switcher (< lg screens) */}
      <div className="lg:hidden flex items-center bg-muted/60 p-1 rounded-xl border border-border">
        <button
          type="button"
          onClick={() => setMobileStudioTab("editor")}
          className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            mobileStudioTab === "editor"
              ? "bg-card text-foreground shadow-xs border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>1. Edit Offer Form</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileStudioTab("preview")}
          className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            mobileStudioTab === "preview"
              ? "bg-card text-foreground shadow-xs border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>2. Live Preview Viewport</span>
        </button>
      </div>

      {/* 3. Studio Main Grid: Controls & Device Preview */}
      <div className="grid gap-6 lg:grid-cols-12 text-xs items-start">
        {/* Editor Controls (7 cols) */}
        <div
          className={`lg:col-span-7 space-y-4 border border-border bg-card p-4 sm:p-5 rounded-xl shadow-xs ${
            mobileStudioTab === "editor" ? "block" : "hidden lg:block"
          }`}
        >
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <h2 className="font-extrabold text-sm text-foreground">Landing Page Editor</h2>
            </div>
            <span className="text-[11px] text-muted-foreground">Smart Offer Controls</span>
          </div>

          <form onSubmit={handlePublishLandingPage} className="space-y-4">
            {/* ================= STEP 1: TOP BAR & BRANDING ================= */}
            <div className="border border-border bg-muted/20 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">1</span>
                  <h3 className="font-extrabold text-xs text-foreground">Top Announcement Bar & Branding</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleSection("announcementBar")}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                      visibleSections.announcementBar
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300 dark:border-blue-700"
                        : "bg-muted text-muted-foreground border border-border opacity-70"
                    }`}
                    title={visibleSections.announcementBar ? "Click to hide announcement bar" : "Click to show announcement bar"}
                  >
                    {visibleSections.announcementBar ? <Eye className="w-3 h-3 text-blue-600" /> : <EyeOff className="w-3 h-3" />}
                    <span>Announcement</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSection("categoryBadge")}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                      visibleSections.categoryBadge
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300 dark:border-blue-700"
                        : "bg-muted text-muted-foreground border border-border opacity-70"
                    }`}
                    title={visibleSections.categoryBadge ? "Click to hide branding badge" : "Click to show branding badge"}
                  >
                    {visibleSections.categoryBadge ? <Eye className="w-3 h-3 text-blue-600" /> : <EyeOff className="w-3 h-3" />}
                    <span>Branding</span>
                  </button>
                </div>
              </div>

              {/* Announcement Bar Text */}
              <div>
                <label className="font-bold text-foreground block mb-1">
                  Top Announcement Bar (Urgency Hook)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="সীমিত সময়ের ধামাকা অফার • সারাদেশে ক্যাশ অন হোম ডেলিভারি ফ্রি!"
                    value={announcementBar}
                    onChange={(e) => setAnnouncementBar(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-border rounded-lg bg-background text-foreground text-xs focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                  <Radio className="w-3.5 h-3.5 text-blue-500 absolute left-2.5 top-2.5 animate-pulse" />
                </div>
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="font-bold text-foreground block mb-1">
                  Client Category (Select Industry / Offer Template) *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-xs font-semibold focus:ring-1 focus:ring-blue-500"
                >
                  <option value="E-Commerce & Gadgets">E-Commerce & Gadgets (Physical Products, Watches, Electronics)</option>
                  <option value="Health & Beauty">Health & Beauty (Cosmetics, Herbal, Skincare)</option>
                  <option value="Courses & Education">Courses & Education (Digital Courses, Webinars, E-books)</option>
                  <option value="Affiliate Offers">Affiliate Offers (CPA Networks, High-Payout Lead Magnets)</option>
                  <option value="Services & Real Estate">Services & Real Estate (Agencies, Consultations, Properties)</option>
                </select>
              </div>

              {/* Project Name / Internal Title */}
              <div>
                <label className="font-bold text-foreground block mb-1">
                  Project Name / Internal Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Eid Special Premium Watch Landing Page"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* ================= STEP 2: HOOK, MEDIA & HIGHLIGHTS ================= */}
            <div className="border border-border bg-muted/20 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">2</span>
                  <h3 className="font-extrabold text-xs text-foreground">Offer Hook, Product Media & Highlights</h3>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => toggleSection("headline")}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                      visibleSections.headline
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300 dark:border-blue-700"
                        : "bg-muted text-muted-foreground border border-border opacity-70"
                    }`}
                    title={visibleSections.headline ? "Click to hide headline" : "Click to show headline"}
                  >
                    {visibleSections.headline ? <Eye className="w-3 h-3 text-blue-600" /> : <EyeOff className="w-3 h-3" />}
                    <span>Headline</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSection("subheadline")}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                      visibleSections.subheadline
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300 dark:border-blue-700"
                        : "bg-muted text-muted-foreground border border-border opacity-70"
                    }`}
                    title={visibleSections.subheadline ? "Click to hide description" : "Click to show description"}
                  >
                    {visibleSections.subheadline ? <Eye className="w-3 h-3 text-blue-600" /> : <EyeOff className="w-3 h-3" />}
                    <span>Description</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSection("heroImage")}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                      visibleSections.heroImage
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300 dark:border-blue-700"
                        : "bg-muted text-muted-foreground border border-border opacity-70"
                    }`}
                    title={visibleSections.heroImage ? "Click to hide photo" : "Click to show photo"}
                  >
                    {visibleSections.heroImage ? <Eye className="w-3 h-3 text-blue-600" /> : <EyeOff className="w-3 h-3" />}
                    <span>Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSection("features")}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                      visibleSections.features
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300 dark:border-blue-700"
                        : "bg-muted text-muted-foreground border border-border opacity-70"
                    }`}
                    title={visibleSections.features ? "Click to hide features list" : "Click to show features list"}
                  >
                    {visibleSections.features ? <Eye className="w-3 h-3 text-blue-600" /> : <EyeOff className="w-3 h-3" />}
                    <span>Features</span>
                  </button>
                </div>
              </div>

              {/* Main Headline */}
              <div>
                <label className="font-bold text-foreground block mb-1">
                  Main Headline (High-Converting Hook) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ঈদের সেরা ধামাকা অফারে কিনুন অরিজিনাল ওয়াচ!"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-xs font-bold focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Sub-Headline */}
              <div>
                <label className="font-bold text-foreground block mb-1">
                  Sub-Headline / Offer Description *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="ফ্রি হোম ডেলিভারি ও ১ বছরের ব্র্যান্ড ওয়ারেন্টি সহ।"
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-xs focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Hero Image + Direct PC Upload + Asset Library */}
              <div>
                <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                  <label className="font-bold text-foreground">
                    Hero Image / Product Photo *
                  </label>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => localImageInputRef.current?.click()}
                      className="flex-1 sm:flex-none justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 px-2.5 py-1 rounded-lg border border-blue-500/20 font-bold text-[11px] flex items-center gap-1 transition"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload from PC</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAssetPicker(true)}
                      className="flex-1 sm:flex-none justify-center text-foreground hover:bg-muted px-2.5 py-1 rounded-lg border border-border font-bold text-[11px] flex items-center gap-1 transition"
                    >
                      <FolderOpen className="w-3 h-3 text-amber-500" />
                      <span>Pick from Library</span>
                    </button>
                  </div>
                </div>

                <input
                  ref={localImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleDirectImageUpload}
                />

                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="https://images.unsplash.com/... or /uploads/..."
                    value={heroImage}
                    onChange={(e) => setHeroImage(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background text-foreground text-xs focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                  <Globe className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Key Highlights / Feature Bullet Points */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-foreground block text-[11px]">
                    Product Highlights (কী কী সুবিধা পাবেন - বুলেট পয়েন্ট)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-bold text-[11px] flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Bullet Point</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <input
                        type="text"
                        value={feat}
                        onChange={(e) => handleFeatureChange(fIdx, e.target.value)}
                        placeholder="Feature advantage e.g. ১ বছরের ওয়ারেন্টি"
                        className="flex-1 px-2.5 py-1.5 border border-border rounded-lg bg-background text-foreground text-xs"
                      />
                      {features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(fIdx)}
                          className="p-1 text-muted-foreground hover:text-destructive transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ================= STEP 3: PRICING & PACKAGE VARIANTS ================= */}
            <div className="border border-blue-500/30 bg-blue-500/5 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">3</span>
                  <h3 className="font-extrabold text-xs text-foreground">Pricing & Package Variants (ভ্যারিয়েন্ট ড্রপডাউন)</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleSection("pricingBadge")}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                      visibleSections.pricingBadge
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300 dark:border-blue-700"
                        : "bg-muted text-muted-foreground border border-border opacity-70"
                    }`}
                    title={visibleSections.pricingBadge ? "Click to hide price badge" : "Click to show price badge"}
                  >
                    {visibleSections.pricingBadge ? <Eye className="w-3 h-3 text-blue-600" /> : <EyeOff className="w-3 h-3" />}
                    <span>Price</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSection("variantsDropdown")}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                      visibleSections.variantsDropdown
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300 dark:border-blue-700"
                        : "bg-muted text-muted-foreground border border-border opacity-70"
                    }`}
                    title={visibleSections.variantsDropdown ? "Click to hide variant dropdown" : "Click to show variant dropdown"}
                  >
                    {visibleSections.variantsDropdown ? <Eye className="w-3 h-3 text-blue-600" /> : <EyeOff className="w-3 h-3" />}
                    <span>Variants</span>
                  </button>
                </div>
              </div>

              {/* Base Price Tag */}
              <div>
                <label className="font-bold text-foreground block mb-1">
                  Base Price Tag / Offer Badge
                </label>
                <input
                  type="text"
                  placeholder="২,৪৯০ টাকা (রেগুলার ৩,৯৯০ টাকা)"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-xs font-bold text-blue-600 dark:text-blue-400"
                />
              </div>

              {/* Interactive Offer Dropdown Builder */}
              <div className="space-y-2 pt-1 border-t border-blue-500/20">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-foreground text-[11px]">
                    Dropdown Selector Label
                  </label>
                  <button
                    type="button"
                    onClick={handleAddDropdownOption}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 py-0.5 rounded text-[10px] flex items-center gap-1 transition"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>Add Variant</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={dropdownTitle}
                  onChange={(e) => setDropdownTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border border-border rounded-lg bg-background text-foreground text-xs"
                />

                <div className="space-y-1.5 pt-1">
                  {dropdownOptions.map((opt, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-card p-2 rounded-lg border border-border">
                      <input
                        type="text"
                        placeholder="Option Name (e.g. 1x Watch - Black)"
                        value={opt.label}
                        onChange={(e) => {
                          const next = [...dropdownOptions]
                          next[idx].label = e.target.value
                          setDropdownOptions(next)
                        }}
                        className="w-full sm:flex-1 px-2.5 py-1.5 border border-border rounded bg-background text-foreground text-xs"
                      />
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          placeholder="Price"
                          value={opt.price}
                          onChange={(e) => {
                            const next = [...dropdownOptions]
                            next[idx].price = e.target.value
                            setDropdownOptions(next)
                          }}
                          className="flex-1 sm:w-32 px-2.5 py-1.5 border border-border rounded bg-background text-foreground text-xs font-semibold text-blue-600 dark:text-blue-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveDropdownOption(idx)}
                          className="p-1.5 text-muted-foreground hover:text-destructive transition shrink-0"
                          title="Remove option"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ================= STEP 4: CALL TO ACTION & CHECKOUT ================= */}
            <div className="border border-border bg-muted/20 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">4</span>
                  <h3 className="font-extrabold text-xs text-foreground">Call To Action & Checkout Setup</h3>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSection("checkoutForm")}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                    visibleSections.checkoutForm
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300 dark:border-blue-700"
                      : "bg-muted text-muted-foreground border border-border opacity-70"
                  }`}
                  title={visibleSections.checkoutForm ? "Click to hide checkout form" : "Click to show checkout form"}
                >
                  {visibleSections.checkoutForm ? <Eye className="w-3 h-3 text-blue-600" /> : <EyeOff className="w-3 h-3" />}
                  <span>COD Form</span>
                </button>
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">
                  CTA Button Label
                </label>
                <input
                  type="text"
                  placeholder="এখনই ক্যাশ অন ডেলিভারিতে অর্ডার করুন"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-bold text-foreground block mb-1">
                    Checkout Mode
                  </label>
                  <select
                    value={ctaAction}
                    onChange={(e) => setCtaAction(e.target.value as any)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-xs font-semibold"
                  >
                    <option value="Order Form">1-Click COD Order Form (Recommended)</option>
                    <option value="WhatsApp Checkout">Direct WhatsApp Checkout</option>
                  </select>
                </div>

                {ctaAction === "WhatsApp Checkout" && (
                  <div>
                    <label className="font-bold text-foreground block mb-1">
                      WhatsApp Number
                    </label>
                    <input
                      type="text"
                      placeholder="01700000000"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-xs font-mono"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ================= STEP 5: TRUST BADGES & ADS ================= */}
            <div className="border border-amber-500/30 bg-amber-500/5 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">5</span>
                  <h3 className="font-extrabold text-xs text-foreground">Trust Guarantees & Monetization Ads</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSection("trustBadges")}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                      visibleSections.trustBadges
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-300 dark:border-purple-700"
                        : "bg-muted text-muted-foreground border border-border opacity-70"
                    }`}
                    title={visibleSections.trustBadges ? "Click to hide trust badges" : "Click to show trust badges"}
                  >
                    {visibleSections.trustBadges ? <Eye className="w-3 h-3 text-blue-600" /> : <EyeOff className="w-3 h-3" />}
                    <span>Trust Badges</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSection("adSlot")}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                      visibleSections.adSlot
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                        : "bg-muted text-muted-foreground border border-border opacity-70"
                    }`}
                    title={visibleSections.adSlot ? "Click to hide ad slot" : "Click to show ad slot"}
                  >
                    {visibleSections.adSlot ? <Eye className="w-3 h-3 text-blue-600" /> : <EyeOff className="w-3 h-3" />}
                    <span>Ad Slot</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-muted-foreground">Configure monetization ads</span>
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs text-foreground">
                  <input
                    type="checkbox"
                    checked={adEnabled}
                    onChange={(e) => setAdEnabled(e.target.checked)}
                    className="rounded border-border text-blue-600 focus:ring-blue-500"
                  />
                  <span>Enable Ads</span>
                </label>
              </div>

              {adEnabled && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={adType === "Banner Image"}
                        onChange={() => setAdType("Banner Image")}
                      />
                      <span>Banner Image Ad</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={adType === "Custom HTML / AdSense"}
                        onChange={() => setAdType("Custom HTML / AdSense")}
                      />
                      <span>Google AdSense / HTML Code</span>
                    </label>
                  </div>

                  {adType === "Banner Image" ? (
                    <div className="space-y-2">
                      <div>
                        <label className="text-muted-foreground block text-[11px] mb-1">
                          Ad Banner Image URL
                        </label>
                        <input
                          type="url"
                          value={adImageUrl}
                          onChange={(e) => setAdImageUrl(e.target.value)}
                          className="w-full px-3 py-1.5 border border-border rounded-lg bg-background text-foreground text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-muted-foreground block text-[11px] mb-1">
                          Ad Destination / Affiliate Link
                        </label>
                        <input
                          type="url"
                          value={adTargetUrl}
                          onChange={(e) => setAdTargetUrl(e.target.value)}
                          className="w-full px-3 py-1.5 border border-border rounded-lg bg-background text-foreground text-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-muted-foreground block text-[11px] mb-1">
                        Paste AdSense Script or Custom HTML Banner Code
                      </label>
                      <textarea
                        rows={2}
                        value={adHtmlSnippet}
                        onChange={(e) => setAdHtmlSnippet(e.target.value)}
                        className="w-full px-3 py-1.5 border border-border rounded-lg bg-background text-foreground font-mono text-[11px]"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl shadow-xs transition flex items-center justify-center gap-2 text-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Publish Smart Landing Page to BMT Subdomain</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileStudioTab("preview")}
                className="lg:hidden w-full bg-muted hover:bg-muted/80 text-foreground font-bold py-2.5 rounded-xl border border-border transition flex items-center justify-center gap-1.5 text-xs"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-500" />
                <span>Switch to Live Preview Viewport</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>

        {/* Live Device Preview (5 cols) - EXACT 1-TO-1 VISUAL SERIAL ALIGNMENT */}
        <div
          className={`lg:col-span-5 border border-border bg-card p-4 sm:p-5 rounded-xl space-y-4 shadow-xs flex flex-col items-center ${
            mobileStudioTab === "preview" ? "block" : "hidden lg:block"
          }`}
        >
          {/* Mobile Back-to-Edit Bar (< lg screens) */}
          <div className="lg:hidden w-full flex items-center justify-between pb-2 border-b border-border">
            <button
              type="button"
              onClick={() => setMobileStudioTab("editor")}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Edit Form</span>
            </button>
            <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">
              Live Preview Mode
            </span>
          </div>

          <div className="w-full flex items-center justify-between border-b border-border pb-3">
            <h2 className="font-extrabold text-sm text-foreground">
              Live {previewDevice} Viewport
            </h2>
            <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setPreviewDevice("Desktop")}
                className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition ${
                  previewDevice === "Desktop" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                <Monitor className="w-3 h-3" />
                <span>Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("Mobile")}
                className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition ${
                  previewDevice === "Mobile" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span>Mobile</span>
              </button>
            </div>
          </div>

          {/* Quick Visibility Toolbar */}
          <div className="w-full bg-muted/40 p-2.5 rounded-xl border border-border space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
              <span className="flex items-center gap-1.5 text-foreground">
                <Eye className="w-3.5 h-3.5 text-blue-500" />
                <span>Section Show/Hide Controls:</span>
              </span>
              <span className="text-[10px] text-muted-foreground">Click chips to toggle</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {[
                { key: "announcementBar", label: "Announcement" },
                { key: "categoryBadge", label: "Branding" },
                { key: "headline", label: "Headline" },
                { key: "subheadline", label: "Description" },
                { key: "heroImage", label: "Photo" },
                { key: "features", label: "Highlights" },
                { key: "pricingBadge", label: "Price" },
                { key: "variantsDropdown", label: "Variants" },
                { key: "checkoutForm", label: "COD Form" },
                { key: "trustBadges", label: "Trust Badges" },
                { key: "adSlot", label: "Ad Slot" },
              ].map(({ key, label }) => {
                const isVisible = visibleSections[key as keyof SectionVisibility]
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleSection(key as keyof SectionVisibility)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                      isVisible
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-muted text-muted-foreground line-through opacity-60 border border-border"
                    }`}
                    title={isVisible ? `Click to hide ${label}` : `Click to show ${label}`}
                  >
                    {isVisible ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Device Mockup Frame */}
          <div
            className={`border rounded-2xl overflow-hidden bg-background shadow-xl transition-all duration-300 ${
              previewDevice === "Mobile"
                ? "max-w-[340px] w-full border-4 border-slate-700 mx-auto"
                : "w-full border border-border"
            }`}
          >
            {/* 1. Top Announcement Bar */}
            {visibleSections.announcementBar && (
              <div className="bg-blue-600 text-white p-2.5 text-center space-y-0.5 shadow-xs">
                <span className="font-bold text-xs block leading-tight">{announcementBar}</span>
              </div>
            )}

            {/* Content Body Preview */}
            <div className="p-4 space-y-3.5 text-left">
              {/* 2. Category & Branding */}
              {visibleSections.categoryBadge && (
                <div className="flex items-center justify-between">
                  <span className="bg-blue-600/10 text-blue-600 dark:text-blue-400 font-bold text-[10px] px-2 py-0.5 rounded border border-blue-500/20">
                    {category}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold truncate max-w-[160px]">
                    {pageTitle}
                  </span>
                </div>
              )}

              {/* 3. Headline & Sub-headline */}
              {(visibleSections.headline || visibleSections.subheadline) && (
                <div className="space-y-1">
                  {visibleSections.headline && (
                    <h3 className="font-extrabold text-sm text-foreground leading-snug">{headline}</h3>
                  )}
                  {visibleSections.subheadline && (
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{subheadline}</p>
                  )}
                </div>
              )}

              {/* 4. Product Hero Banner */}
              {visibleSections.heroImage && (
                <div className="aspect-[16/9] rounded-xl overflow-hidden bg-muted border border-border shadow-xs relative">
                  <img
                    src={heroImage}
                    alt={headline}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 bg-black/75 backdrop-blur text-white font-bold text-[9px] px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-blue-400" />
                    <span>100% Original Product</span>
                  </span>
                </div>
              )}

              {/* 5. Key Highlights / Bullet Points */}
              {visibleSections.features && features.length > 0 && (
                <div className="bg-muted/40 p-2.5 rounded-lg border border-border space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Key Features & Advantages:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                    {features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-foreground font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <span className="leading-tight">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Pricing & Savings Badge */}
              {visibleSections.pricingBadge && (
                <div className="flex items-center justify-between p-2.5 border border-emerald-500/30 bg-emerald-500/10 rounded-xl">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">Special Offer Price</span>
                    <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      {dropdownOptions[selectedPreviewOptionIdx]?.price || productPrice}
                    </div>
                  </div>
                  <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-200" />
                    <span>স্টক সীমিত</span>
                  </span>
                </div>
              )}

              {/* 7. Interactive Dropdown */}
              {visibleSections.variantsDropdown && dropdownOptions.length > 0 && (
                <div className="space-y-1 bg-muted/40 p-2.5 rounded-lg border border-border">
                  <span className="text-[10px] font-bold text-foreground block">
                    {dropdownTitle}
                  </span>
                  <select
                    value={selectedPreviewOptionIdx}
                    onChange={(e) => setSelectedPreviewOptionIdx(Number(e.target.value))}
                    className="w-full p-1.5 border border-border rounded bg-background text-foreground text-xs font-semibold cursor-pointer"
                  >
                    {dropdownOptions.map((opt, i) => (
                      <option key={i} value={i}>
                        {opt.label} ({opt.price})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 8. Real 1-Click COD Checkout Box Mockup */}
              {visibleSections.checkoutForm && (
                <div className="border border-blue-500/30 bg-blue-500/5 p-3 rounded-xl space-y-2">
                  <span className="font-extrabold text-[11px] text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>১-ক্লিক ক্যাশ অন ডেলিভারি অর্ডার ফরম</span>
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <input
                      type="text"
                      placeholder="আপনার সম্পূর্ণ নাম"
                      disabled
                      className="w-full p-1.5 border border-border rounded bg-background/80 text-[11px] text-muted-foreground"
                    />
                    <input
                      type="text"
                      placeholder="আপনার সচল মোবাইল নম্বর (017...)"
                      disabled
                      className="w-full p-1.5 border border-border rounded bg-background/80 text-[11px] text-muted-foreground"
                    />
                    <input
                      type="text"
                      placeholder="সম্পূর্ণ ডেলিভারি ঠিকানা (জেলা ও থানা সহ)"
                      disabled
                      className="w-full p-1.5 border border-border rounded bg-background/80 text-[11px] text-muted-foreground"
                    />
                  </div>

                  <button
                    type="button"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 rounded-xl shadow-xs text-xs transition flex items-center justify-center gap-1.5 mt-2"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{ctaText}</span>
                  </button>
                  <span className="text-[9px] text-center text-muted-foreground flex items-center justify-center gap-1">
                    <Lock className="w-2.5 h-2.5 text-muted-foreground" />
                    <span>১০০% নিরাপদ ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে টাকা পরিশোধ)</span>
                  </span>
                </div>
              )}

              {/* 9. Trust Badges Row */}
              {visibleSections.trustBadges && (
                <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
                  <div className="bg-muted/40 p-1.5 rounded-lg border border-border flex flex-col items-center">
                    <Truck className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[9px] font-bold text-foreground mt-0.5">হোম ডেলিভারি</span>
                    <span className="text-[8px] text-muted-foreground">সারা দেশে</span>
                  </div>
                  <div className="bg-muted/40 p-1.5 rounded-lg border border-border flex flex-col items-center">
                    <DollarSign className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="text-[9px] font-bold text-foreground mt-0.5">ক্যাশ অন ডেলিভারি</span>
                    <span className="text-[8px] text-muted-foreground">হাতে পেয়ে পেমেন্ট</span>
                  </div>
                  <div className="bg-muted/40 p-1.5 rounded-lg border border-border flex flex-col items-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="text-[9px] font-bold text-foreground mt-0.5">ওয়ারেন্টি গ্যারান্টি</span>
                    <span className="text-[8px] text-muted-foreground">১০০% অরিজিনাল</span>
                  </div>
                </div>
              )}

              {/* 10. Working Ad Slot */}
              {visibleSections.adSlot && adEnabled && (
                <div className="border border-blue-200 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20 p-2 rounded-lg text-left space-y-1">
                  <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase block">
                    Sponsored Ad Slot
                  </span>
                  {adType === "Banner Image" && adImageUrl ? (
                    <div className="h-16 rounded overflow-hidden bg-black/20">
                      <img src={adImageUrl} alt="Ad" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="text-[10px] text-muted-foreground font-mono bg-background p-1 rounded">
                      [Google AdSense Banner Slot]
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Published Landing Pages Management Table */}
      <div className="border border-border bg-card p-5 rounded-xl space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h2 className="font-extrabold text-sm text-foreground">
              Published Landing Pages ({pages.length})
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live projects with visitor traffic metrics, order conversions, and ad slots.
            </p>
          </div>
        </div>

        {pages.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-border rounded-lg text-muted-foreground text-xs">
            No landing pages created yet. Use the editor above to publish your first smart offer page!
          </div>
        ) : (
          <>
            {/* Mobile Cards List (< md screens) */}
            <div className="md:hidden space-y-3">
              {pages.map((p) => (
                <div key={p.id} className="p-3.5 bg-muted/20 border border-border rounded-xl space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-12 rounded-lg overflow-hidden bg-muted border border-border shrink-0">
                      <img src={p.heroImage} alt={p.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-foreground text-xs line-clamp-1">{p.title}</h4>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold block">
                        {p.category}
                      </span>
                      <a
                        href={`/p/${p.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline truncate block font-mono text-[10px] mt-0.5"
                      >
                        /p/{p.slug}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border text-[10px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold px-1.5 py-0.5 rounded flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {p.viewsCount || 0}
                      </span>
                      <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold px-1.5 py-0.5 rounded flex items-center">
                        <ShoppingBag className="w-3 h-3 mr-1" />
                        {p.ordersCount || 0}
                      </span>
                      {p.adSlot?.enabled && (
                        <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold px-1.5 py-0.5 rounded">
                          ADS
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(p.slug)}
                        className="p-1.5 border border-border hover:bg-muted text-foreground rounded-lg transition"
                        title="Copy Public Link"
                      >
                        {copiedSlug === p.slug ? <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                      </button>

                      <a
                        href={`/p/${p.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 border border-border hover:bg-muted text-foreground rounded-lg transition"
                        title="Open Live Landing Page"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleSaveToLibrary(p)}
                        className="p-1.5 border border-border hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg transition"
                        title="Save Link Card to Asset Library"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete landing page "${p.title}"?`)) {
                            deletePage(p.id)
                            showToast("Page deleted.", "info")
                          }
                        }}
                        className="p-1.5 border border-border hover:bg-destructive/10 text-destructive rounded-lg transition"
                        title="Delete Page"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= md screens) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-[10px] font-bold">
                    <th className="py-2.5 px-3">Project & Category</th>
                    <th className="py-2.5 px-3">Public Subdomain Link</th>
                    <th className="py-2.5 px-3 text-center">Traffic & Orders</th>
                    <th className="py-2.5 px-3 text-center">ADS Slot</th>
                    <th className="py-2.5 px-3">Created</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pages.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/40 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-9 rounded-md overflow-hidden bg-muted border border-border shrink-0">
                            <img src={p.heroImage} alt={p.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-foreground line-clamp-1 max-w-xs">{p.title}</h4>
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold block">
                              {p.category}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <a
                          href={`/p/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline max-w-xs truncate block font-mono text-[11px]"
                        >
                          /p/{p.slug}
                        </a>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold px-2 py-0.5 rounded text-[10px] flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            {p.viewsCount || 0}
                          </span>
                          <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold px-2 py-0.5 rounded text-[10px] flex items-center">
                            <ShoppingBag className="w-3 h-3 mr-1" />
                            {p.ordersCount || 0}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {p.adSlot?.enabled ? (
                          <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>ADS Active</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[10px]">Disabled</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-muted-foreground text-[11px]">
                        {p.createdAt}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyLink(p.slug)}
                            className="p-1.5 border border-border hover:bg-muted text-foreground rounded-lg transition"
                            title="Copy Public Link"
                          >
                            {copiedSlug === p.slug ? <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                          </button>

                          <a
                            href={`/p/${p.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 border border-border hover:bg-muted text-foreground rounded-lg transition"
                            title="Open Live Landing Page"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                          </a>

                          <button
                            type="button"
                            onClick={() => handleSaveToLibrary(p)}
                            className="p-1.5 border border-border hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg transition"
                            title="Save Link Card to Asset Library"
                          >
                            <FolderPlus className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete landing page "${p.title}"?`)) {
                                deletePage(p.id)
                                showToast("Page deleted.")
                              }
                            }}
                            className="p-1.5 border border-border hover:bg-destructive/10 text-destructive rounded-lg transition"
                            title="Delete Page"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* 5. Modal: Pick Hero Image from Central Asset Library */}
      {showAssetPicker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-2xl rounded-xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-blue-500" />
                <h3 className="font-extrabold text-sm text-foreground">
                  Pick Hero Image from Central Asset Library (Module 3)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAssetPicker(false)}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
              {libraryAssets
                .filter((item) => item.type === "Image" || item.type === "Link")
                .map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handlePickAsset(item.url)}
                    className="border border-border hover:border-blue-500 rounded-lg overflow-hidden cursor-pointer group bg-muted/20 transition p-2 space-y-1.5"
                  >
                    <div className="h-28 rounded overflow-hidden bg-black/20">
                      <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    </div>
                    <h5 className="font-bold text-[11px] text-foreground truncate">{item.title}</h5>
                    <span className="text-[10px] text-muted-foreground block">{item.folder}</span>
                  </div>
                ))}
            </div>

            <div className="border-t border-border pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAssetPicker(false)}
                className="bg-muted hover:bg-muted/80 text-foreground font-semibold px-4 py-2 rounded-lg text-xs transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
