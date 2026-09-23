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
  ShoppingBag,
  DollarSign,
  Globe,
  Radio,
  Share2,
  CheckCircle2,
  Link2,
} from "lucide-react"
import { useAssetLibrary } from "../../../../../hooks/useAssetLibrary"
import { useLandingPages, LandingPageProject, DropdownOption } from "../../../../../hooks/useLandingPages"

export default function SafeLandingPageBuilderPage() {
  const router = useRouter()
  const params = useParams()
  const workspaceId = (params?.id as string) || "workspace-1"

  const { addAsset, assets: libraryAssets } = useAssetLibrary()
  const { pages, createPage, deletePage } = useLandingPages(workspaceId)

  // Editor states
  const [category, setCategory] = useState<LandingPageProject["category"]>("E-Commerce & Gadgets")
  const [pageTitle, setPageTitle] = useState("Eid Special Premium Watch Landing Page")
  const [headline, setHeadline] = useState("ঈদের সেরা ধামাকা অফারে কিনুন অরিজিনাল আল্ট্রা স্মার্ট ওয়াচ!")
  const [subheadline, setSubheadline] = useState("অরিজিনাল অ্যামোলেড ডিসপ্লে, ব্লুটুথ কলিং ও ১ বছরের অফিসিয়াল ব্র্যান্ড ওয়ারেন্টি সহ। স্টক সীমিত!")
  const [heroImage, setHeroImage] = useState("https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop")
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
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  // Add new dropdown option
  const handleAddDropdownOption = () => {
    setDropdownOptions([...dropdownOptions, { label: "New Package Option", price: productPrice }])
  }

  // Remove dropdown option
  const handleRemoveDropdownOption = (index: number) => {
    if (dropdownOptions.length <= 1) {
      showToast("⚠️ At least one package option is required!")
      return
    }
    setDropdownOptions(dropdownOptions.filter((_, i) => i !== index))
  }

  // Publish Page Handler
  const handlePublishLandingPage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pageTitle.trim() || !headline.trim()) {
      showToast("⚠️ Project Name and Main Headline are required!")
      return
    }

    const newPage = createPage({
      title: pageTitle.trim(),
      category,
      headline: headline.trim(),
      subheadline: subheadline.trim(),
      heroImage: heroImage.trim() || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop",
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
      status: "Published",
      workspaceId,
    })

    setActivePublishedPage(newPage)
    showToast("✓ Smart Landing Page Published Successfully!")
  }

  // Copy Link
  const handleCopyLink = (slug: string) => {
    const fullUrl = `${window.location.origin}/p/${slug}`
    navigator.clipboard.writeText(fullUrl)
    setCopiedSlug(slug)
    showToast("✓ Landing page URL copied to clipboard!")
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
    showToast("✓ Landing page link saved to Central Asset Library!")
  }

  // Pick Image from Asset Library
  const handlePickAsset = (url?: string) => {
    if (url) {
      setHeroImage(url)
      setShowAssetPicker(false)
      showToast("✓ Image selected from Asset Library!")
    }
  }

  return (
    <div className="space-y-6 max-w-7xl">
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
            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
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
        <div className="p-4 border border-emerald-500/30 bg-emerald-500/10 rounded-xl space-y-3 animate-in fade-in duration-200 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
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
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-xs"
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
                {copiedSlug === activePublishedPage.slug ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSlug === activePublishedPage.slug ? "Copied!" : "Copy URL"}</span>
              </button>
              <a
                href={`/p/${activePublishedPage.slug}`}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 text-xs shadow-xs"
              >
                <span>Open Live Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 3. Studio Main Grid: Controls & Device Preview */}
      <div className="grid gap-6 lg:grid-cols-12 text-xs items-start">
        {/* Editor Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4 border border-border bg-card p-5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <h2 className="font-extrabold text-sm text-foreground">Landing Page Editor</h2>
            </div>
            <span className="text-[11px] text-muted-foreground">Smart Offer Controls</span>
          </div>

          <form onSubmit={handlePublishLandingPage} className="space-y-4">
            {/* CLIENT SPECIFICATION: Category Dropdown */}
            <div>
              <label className="font-bold text-foreground block mb-1">
                Client Category (Select Industry / Offer Template) *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-xs font-semibold focus:ring-1 focus:ring-blue-500"
              >
                <option value="E-Commerce & Gadgets">🛍️ E-Commerce & Gadgets (Physical Products, Watches, Electronics)</option>
                <option value="Health & Beauty">🌿 Health & Beauty (Cosmetics, Herbal, Skincare)</option>
                <option value="Courses & Education">🎓 Courses & Education (Digital Courses, Webinars, E-books)</option>
                <option value="Affiliate Offers">🔥 Affiliate Offers (CPA Networks, High-Payout Lead Magnets)</option>
                <option value="Services & Real Estate">🏢 Services & Real Estate (Agencies, Consultations, Properties)</option>
              </select>
            </div>

            {/* Project Name */}
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
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-xs focus:ring-1 focus:ring-blue-500"
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

            {/* Hero Image + Asset Library Picker */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-foreground">
                  Hero Image / Product Photo URL *
                </label>
                <button
                  type="button"
                  onClick={() => setShowAssetPicker(true)}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-bold text-[11px] flex items-center gap-1"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Pick from Asset Library</span>
                </button>
              </div>
              <input
                type="url"
                required
                placeholder="https://images.unsplash.com/..."
                value={heroImage}
                onChange={(e) => setHeroImage(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Price Tag & CTA button */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-foreground block mb-1">
                  Base Price Tag / Offer Badge
                </label>
                <input
                  type="text"
                  placeholder="২,৪৯০ টাকা (রেগুলার ৩,৯৯০ টাকা)"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">
                  CTA Button Label
                </label>
                <input
                  type="text"
                  placeholder="এখনই অর্ডার কনফার্ম করুন"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-xs"
                />
              </div>
            </div>

            {/* CLIENT SPECIFICATION: Interactive Offer Dropdown Builder */}
            <div className="border border-blue-500/30 bg-blue-500/5 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-blue-500" />
                  <span className="font-extrabold text-sm text-foreground">
                    Interactive Offer Dropdown (ড্রপডাউন কনফিগারেশন)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddDropdownOption}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded-md text-[11px] flex items-center gap-1 transition shadow-xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Option</span>
                </button>
              </div>

              <div>
                <label className="text-muted-foreground block text-[11px] mb-1 font-semibold">
                  Dropdown Label on Landing Page
                </label>
                <input
                  type="text"
                  value={dropdownTitle}
                  onChange={(e) => setDropdownTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border border-border rounded-lg bg-background text-foreground text-xs"
                />
              </div>

              <div className="space-y-2">
                {dropdownOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-card p-2 rounded-lg border border-border">
                    <input
                      type="text"
                      placeholder="Option Name (e.g. 1x Watch - Black)"
                      value={opt.label}
                      onChange={(e) => {
                        const next = [...dropdownOptions]
                        next[idx].label = e.target.value
                        setDropdownOptions(next)
                      }}
                      className="flex-1 px-2.5 py-1.5 border border-border rounded bg-background text-foreground text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Price (২,৪৯০ টাকা)"
                      value={opt.price}
                      onChange={(e) => {
                        const next = [...dropdownOptions]
                        next[idx].price = e.target.value
                        setDropdownOptions(next)
                      }}
                      className="w-32 px-2.5 py-1.5 border border-border rounded bg-background text-foreground text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveDropdownOption(idx)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition"
                      title="Remove option"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* CLIENT SPECIFICATION: Monetization Ad Slot */}
            <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-500" />
                  <span className="font-extrabold text-sm text-foreground">
                    Monetization Ad Slot (বিজ্ঞাপন স্লট)
                  </span>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs text-foreground">
                  <input
                    type="checkbox"
                    checked={adEnabled}
                    onChange={(e) => setAdEnabled(e.target.checked)}
                    className="rounded border-border text-amber-600 focus:ring-amber-500"
                  />
                  <span>Enable ADS</span>
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

            {/* Publish Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl shadow-xs transition flex items-center justify-center gap-2 text-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>🚀 Publish Smart Landing Page to BMT Subdomain</span>
            </button>
          </form>
        </div>

        {/* Live Device Preview (5 cols) */}
        <div className="lg:col-span-5 border border-border bg-card p-5 rounded-xl space-y-4 shadow-xs flex flex-col items-center">
          <div className="w-full flex items-center justify-between border-b border-border pb-3">
            <h2 className="font-extrabold text-sm text-foreground">
              Live {previewDevice} Viewport
            </h2>
            <span className="bg-muted text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded">
              Interactive Preview
            </span>
          </div>

          {/* Device Mockup Frame */}
          <div
            className={`border rounded-2xl overflow-hidden bg-background shadow-xl transition-all duration-300 ${
              previewDevice === "Mobile"
                ? "w-[330px] border-4 border-slate-700"
                : "w-full border border-border"
            }`}
          >
            {/* Top Bar */}
            <div className="bg-blue-600 text-white p-3 text-center space-y-0.5 shadow-xs">
              <span className="font-black text-xs block truncate">{pageTitle}</span>
              <span className="text-[10px] opacity-90 block">সারা দেশে ক্যাশ অন হোম ডেলিভারি ফ্রি</span>
            </div>

            {/* Content Body Preview */}
            <div className="p-4 space-y-3.5 text-center">
              <div className="aspect-[16/9] rounded-xl overflow-hidden bg-muted border border-border shadow-xs">
                <img
                  src={heroImage}
                  alt="Hero Banner"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-1">
                <span className="bg-blue-600/10 text-blue-600 dark:text-blue-400 font-bold text-[10px] px-2 py-0.5 rounded">
                  {category}
                </span>
                <h3 className="font-black text-sm text-foreground leading-snug">{headline}</h3>
                <p className="text-[11px] text-muted-foreground leading-tight">{subheadline}</p>
              </div>

              <div className="p-2 border border-emerald-500/30 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
                {dropdownOptions[selectedPreviewOptionIdx]?.price || productPrice}
              </div>

              {/* Working Dropdown in Preview */}
              {dropdownOptions.length > 0 && (
                <div className="space-y-1 text-left bg-muted/40 p-2.5 rounded-lg border border-border">
                  <span className="text-[10px] font-bold text-foreground block">
                    {dropdownTitle}
                  </span>
                  <select
                    value={selectedPreviewOptionIdx}
                    onChange={(e) => setSelectedPreviewOptionIdx(Number(e.target.value))}
                    className="w-full p-1.5 border border-border rounded bg-background text-foreground text-xs font-medium cursor-pointer"
                  >
                    {dropdownOptions.map((opt, i) => (
                      <option key={i} value={i}>
                        {opt.label} ({opt.price})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Working Ad Slot in Preview */}
              {adEnabled && (
                <div className="border border-amber-500/30 bg-amber-500/10 p-2 rounded-lg text-left space-y-1">
                  <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase block">
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

              {/* CTA Button */}
              <button
                type="button"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-xl shadow-md text-xs transition"
              >
                {ctaText}
              </button>
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
          <div className="overflow-x-auto">
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
                        <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold px-2 py-0.5 rounded text-[10px]">
                          👁️ {p.viewsCount || 0}
                        </span>
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded text-[10px]">
                          🛒 {p.ordersCount || 0}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      {p.adSlot?.enabled ? (
                        <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold px-2 py-0.5 rounded text-[10px]">
                          ✓ ADS Active
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
                          {copiedSlug === p.slug ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
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
                              showToast("✓ Page deleted.")
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
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
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
