"use client"

import React, { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  FolderPlus,
  CalendarClock,
  Sparkles,
  MousePointerClick,
  Trash2,
  FolderOpen,
  Globe,
  Image as ImageIcon,
  Share2,
  Info,
  CheckCircle2,
  Upload,
} from "lucide-react"
import { useAssetLibrary } from "../../../../../hooks/useAssetLibrary"
import { useClickableCards, ClickableCard } from "../../../../../hooks/useClickableCards"

export default function SafeClickableImagePage() {
  const router = useRouter()
  const params = useParams()
  const workspaceId = (params?.id as string) || "workspace-1"

  const { addAsset, assets: libraryAssets } = useAssetLibrary()
  const { cards, createCard, deleteCard } = useClickableCards(workspaceId)

  // Form states
  const [destinationUrl, setDestinationUrl] = useState("https://bmt.cards/eid-mega-offer")
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1542744094-3a3172720a8a?w=800&auto=format&fit=crop")
  const [cardTitle, setCardTitle] = useState("Eid Mega Sale 2026 - Up to 50% Off Top Gadgets!")
  const [cardDescription, setCardDescription] = useState("Order original tech accessories & smartwatches with instant home delivery across BD.")
  const [displayDomain, setDisplayDomain] = useState("bmt.cards")
  const [postCaption, setPostCaption] = useState("🔥 আজকের ধামাকা অফার! নিচের ছবিতে ক্লিক করে সরাসরি স্পেশাল ৫০% ডিসকাউন্ট লুফে নিন!")

  // Generated state & toast
  const [activeCreatedCard, setActiveCreatedCard] = useState<ClickableCard | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [savedToLibId, setSavedToLibId] = useState<string | null>(null)
  const [showAssetPicker, setShowAssetPicker] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  // Generate Card Handler
  const handleGenerateClickableCard = (e: React.FormEvent) => {
    e.preventDefault()
    if (!destinationUrl.trim() || !cardTitle.trim()) {
      showToast("⚠️ Destination URL and Card Title are required!")
      return
    }

    const newCard = createCard({
      title: cardTitle.trim(),
      description: cardDescription.trim(),
      imageUrl: imageUrl.trim() || "https://images.unsplash.com/photo-1542744094-3a3172720a8a?w=800&auto=format&fit=crop",
      destinationUrl: destinationUrl.trim(),
      displayDomain: displayDomain.trim() || "bmt.cards",
      workspaceId,
    })

    setActiveCreatedCard(newCard)
    showToast("✓ Clickable Image Card created successfully!")
  }

  // Copy shareable link
  const handleCopyLink = (card: ClickableCard) => {
    const fullLink = `${window.location.origin}/c/${card.id}`
    navigator.clipboard.writeText(fullLink)
    setCopiedId(card.id)
    showToast("✓ Shareable link copied to clipboard!")
    setTimeout(() => setCopiedId(null), 2500)
  }

  // Save Card to Central Asset Library (Module 3)
  const handleSaveToLibrary = (card: ClickableCard) => {
    addAsset({
      title: card.title,
      type: "Link",
      folder: "Link Cards",
      url: card.imageUrl,
      targetUrl: `${window.location.origin}/c/${card.id}`,
      tags: ["clickable-image", "facebook", "redirect", card.displayDomain],
      size: "1.8 MB (Clickable Card)",
    })
    setSavedToLibId(card.id)
    showToast("✓ Saved to Central Asset Library (Link Cards)!")
  }

  // Pick Image from Asset Library
  const handlePickAsset = (assetUrl?: string) => {
    if (assetUrl) {
      setImageUrl(assetUrl)
      setShowAssetPicker(false)
      showToast("✓ Image selected from Asset Library!")
    }
  }

  // Upload Image from PC
  const localFileInputRef = React.useRef<HTMLInputElement | null>(null)
  const handleDirectLocalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return
    const file = e.target.files[0]
    showToast("⏳ Uploading image to storage...")

    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setImageUrl(data.url)
        showToast("✓ Image uploaded from PC successfully!")
      } else {
        const localPreview = URL.createObjectURL(file)
        setImageUrl(localPreview)
        showToast("✓ Image loaded from PC!")
      }
    } catch (err) {
      const localPreview = URL.createObjectURL(file)
      setImageUrl(localPreview)
      showToast("✓ Image loaded from PC!")
    }
  }

  return (
    <div className="max-w-6xl space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Header */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Clickable Image Generator
          </h1>
          <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-500/20">
            OpenGraph Redirect Engine
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 max-w-2xl">
          Create shareable Facebook post and comment links with high-resolution image preview cards. When users click or tap the photo on Facebook, they are immediately redirected to your landing page or offer link.
        </p>
      </div>

      {/* 2. Success Banner when Card is Generated */}
      {activeCreatedCard && (
        <div className="p-4 border border-emerald-500/30 bg-emerald-500/10 rounded-xl space-y-3 animate-in fade-in duration-200 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                Clickable Image Link Generated & Ready to Share!
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveToLibrary(activeCreatedCard)}
                className={`font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-xs ${
                  savedToLibId === activeCreatedCard.id
                    ? "bg-muted text-muted-foreground"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>{savedToLibId === activeCreatedCard.id ? "✓ Saved to Library" : "📁 Save to Library"}</span>
              </button>
              <button
                type="button"
                onClick={() => router.push(`/workspace/${workspaceId}/safe/post-scheduler?clickableCardId=${activeCreatedCard.id}`)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-xs"
              >
                <CalendarClock className="w-3.5 h-3.5" />
                <span>Post Scheduler →</span>
              </button>
            </div>
          </div>

          {/* Shareable Link Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-lg border border-border">
            <div className="space-y-0.5 truncate">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Shareable Facebook Link:
              </span>
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 truncate block">
                {typeof window !== "undefined" ? `${window.location.origin}/c/${activeCreatedCard.id}` : `/c/${activeCreatedCard.id}`}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleCopyLink(activeCreatedCard)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-xs text-xs"
              >
                {copiedId === activeCreatedCard.id ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === activeCreatedCard.id ? "Copied!" : "Copy Link"}</span>
              </button>
              <a
                href={`/c/${activeCreatedCard.id}`}
                target="_blank"
                rel="noreferrer"
                className="border border-border hover:bg-muted text-foreground font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 text-xs"
              >
                <span>Test Redirect</span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 3. Studio Main Grid: Form & Pixel-Perfect Live Facebook Preview */}
      <div className="grid gap-6 lg:grid-cols-12 text-xs items-start">
        {/* Left Column: Configuration Form (7 cols) */}
        <div className="lg:col-span-7 border border-border bg-card p-5 rounded-xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <h2 className="font-extrabold text-sm text-foreground">Card Configuration</h2>
            </div>
            <span className="text-[11px] text-muted-foreground font-medium">Step 1 of 2</span>
          </div>

          <form onSubmit={handleGenerateClickableCard} className="space-y-4">
            {/* Target Destination Link */}
            <div>
              <label className="font-bold text-foreground block mb-1">
                Destination Target Link (Where visitors go when clicking) *
              </label>
              <div className="relative">
                <input
                  type="url"
                  required
                  placeholder="https://yourwebsite.com/special-offer or https://wa.me/..."
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background text-foreground text-xs focus:ring-1 focus:ring-blue-500"
                />
                <Globe className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Enter your website, landing page, WhatsApp link, or affiliate store URL.
              </p>
            </div>

            {/* Image URL, Asset Library Picker & Direct PC Upload */}
            <div>
              <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                <label className="font-bold text-foreground">
                  Card Banner Image *
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => localFileInputRef.current?.click()}
                    className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-500/20 font-bold text-[11px] flex items-center gap-1 transition"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload from PC</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAssetPicker(true)}
                    className="text-foreground hover:bg-muted px-2 py-0.5 rounded border border-border font-bold text-[11px] flex items-center gap-1 transition"
                  >
                    <FolderOpen className="w-3 h-3 text-amber-500" />
                    <span>Pick from Library</span>
                  </button>
                </div>
              </div>

              <input
                ref={localFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleDirectLocalUpload}
              />

              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Paste image URL (https://...) or choose from PC / Library"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background text-foreground text-xs focus:ring-1 focus:ring-blue-500 font-mono"
                />
                <ImageIcon className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Supports local PC upload, Asset Library photos (/uploads/...), or direct web image URLs.
              </p>
            </div>

            {/* Card Headline / Title */}
            <div>
              <label className="font-bold text-foreground block mb-1">
                Card Title (Bold headline on Facebook) *
              </label>
              <input
                type="text"
                required
                maxLength={80}
                placeholder="Eid Mega Sale 2026 - Up to 50% Off Top Gadgets!"
                value={cardTitle}
                onChange={(e) => setCardTitle(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-xs focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[10px] text-muted-foreground text-right block mt-0.5">
                {cardTitle.length}/80 characters
              </span>
            </div>

            {/* Card Description */}
            <div>
              <label className="font-bold text-foreground block mb-1">
                Card Description (Subtitle caption on Facebook)
              </label>
              <textarea
                rows={2}
                maxLength={160}
                placeholder="Order original tech accessories with fast home delivery across BD."
                value={cardDescription}
                onChange={(e) => setCardDescription(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-xs focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Display Domain */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-foreground block mb-1">
                  Display Domain / Brand Badge
                </label>
                <input
                  type="text"
                  placeholder="bmt.cards"
                  value={displayDomain}
                  onChange={(e) => setDisplayDomain(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">
                  Simulated Post Caption
                </label>
                <input
                  type="text"
                  placeholder="Caption text above the card..."
                  value={postCaption}
                  onChange={(e) => setPostCaption(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-xs"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 rounded-lg shadow-xs transition flex items-center justify-center gap-2 text-xs"
            >
              <Link2 className="w-4 h-4" />
              <span>Generate Clickable Image Card</span>
            </button>
          </form>
        </div>

        {/* Right Column: Live Facebook Feed Post Card Preview (5 cols) */}
        <div className="lg:col-span-5 border border-border bg-card p-5 rounded-xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="font-extrabold text-sm text-foreground">Live Facebook Feed Preview</h2>
            <span className="bg-muted text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded">
              Interactive Mockup
            </span>
          </div>

          {/* Facebook Post Frame */}
          <div className="border border-border/80 rounded-xl bg-card overflow-hidden shadow-md">
            {/* FB Header */}
            <div className="p-3 flex items-center justify-between border-b border-border/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-xs shadow-xs">
                  BMT
                </div>
                <div>
                  <h4 className="font-bold text-xs text-foreground leading-none">
                    BMT Marketing Page
                  </h4>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <span>Sponsored</span>
                    <span>•</span>
                    <Globe className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
              <span className="text-muted-foreground text-sm font-bold">•••</span>
            </div>

            {/* FB Post Caption */}
            <div className="p-3 text-xs text-foreground font-medium">
              {postCaption || "Tap the image card below to learn more!"}
            </div>

            {/* The Clickable Image Card (1.91:1 standard aspect ratio) */}
            <div
              onClick={() => showToast("ℹ️ On Facebook, clicking this card will instantly open your destination link!")}
              className="group cursor-pointer border-y border-border/60 bg-muted/40 transition"
              title="Click preview card"
            >
              <div className="aspect-[1.91/1] overflow-hidden bg-black/40 relative">
                <img
                  src={imageUrl}
                  alt={cardTitle}
                  className="w-full h-full object-cover group-hover:scale-102 transition duration-200"
                />
                <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 bg-black/80 backdrop-blur text-white text-[10px] font-bold px-3 py-1 rounded-full shadow transition flex items-center gap-1.5">
                    <MousePointerClick className="w-3 h-3 text-blue-400" />
                    <span>Clickable Area (Redirects)</span>
                  </span>
                </div>
              </div>

              {/* FB Card Metadata Footer */}
              <div className="p-3 bg-muted/30 border-t border-border/40 space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider font-mono block">
                  {displayDomain.toUpperCase() || "BMT.CARDS"}
                </span>
                <h3 className="font-extrabold text-xs text-foreground line-clamp-1 group-hover:text-blue-500 transition">
                  {cardTitle || "Your Clickable Card Headline Here"}
                </h3>
                <p className="text-[11px] text-muted-foreground line-clamp-1">
                  {cardDescription || "Card description snippet will display here."}
                </p>
              </div>
            </div>

            {/* FB Reaction Footer Bar */}
            <div className="p-2.5 flex items-center justify-between text-muted-foreground text-[11px] border-t border-border/40 font-semibold">
              <span className="flex items-center gap-1 hover:text-foreground cursor-pointer">
                👍 42 Likes
              </span>
              <span className="flex items-center gap-1 hover:text-foreground cursor-pointer">
                💬 18 Comments
              </span>
              <span className="flex items-center gap-1 hover:text-foreground cursor-pointer">
                ↗️ Share
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/15 flex items-start gap-2 text-[11px] text-muted-foreground">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p>
              When you paste this generated link in Facebook posts, comments, or Messenger chats, Facebook will automatically render this full-width interactive image card!
            </p>
          </div>
        </div>
      </div>

      {/* 4. Active Clickable Cards & Analytics Table */}
      <div className="border border-border bg-card p-5 rounded-xl space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h2 className="font-extrabold text-sm text-foreground">
              Active Clickable Image Cards ({cards.length})
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track real-time click volume, copy shareable links, and sync with your Asset Library.
            </p>
          </div>
        </div>

        {cards.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-border rounded-lg text-muted-foreground text-xs">
            No clickable image cards created yet. Fill out the form above to generate your first card!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase text-[10px] font-bold">
                  <th className="py-2.5 px-3">Card & Image Preview</th>
                  <th className="py-2.5 px-3">Target Destination</th>
                  <th className="py-2.5 px-3 text-center">Total Clicks</th>
                  <th className="py-2.5 px-3">Created</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cards.map((card) => (
                  <tr key={card.id} className="hover:bg-muted/40 transition">
                    {/* Preview + Title */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-9 rounded-md overflow-hidden bg-muted border border-border shrink-0">
                          <img src={card.imageUrl} alt={card.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-foreground line-clamp-1 max-w-xs">{card.title}</h4>
                          <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                            {card.displayDomain}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Destination */}
                    <td className="py-3 px-3">
                      <a
                        href={card.destinationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline max-w-xs truncate block font-mono text-[11px]"
                      >
                        {card.destinationUrl}
                      </a>
                    </td>

                    {/* Live Clicks */}
                    <td className="py-3 px-3 text-center">
                      <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded text-[11px]">
                        {card.clickCount || 0} Clicks
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="py-3 px-3 text-muted-foreground text-[11px]">
                      {card.createdAt}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Copy Link */}
                        <button
                          type="button"
                          onClick={() => handleCopyLink(card)}
                          className="p-1.5 border border-border hover:bg-muted text-foreground rounded-lg transition"
                          title="Copy Shareable Link"
                        >
                          {copiedId === card.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                        </button>

                        {/* Test Redirect in new tab */}
                        <a
                          href={`/c/${card.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 border border-border hover:bg-muted text-foreground rounded-lg transition"
                          title="Test Redirect"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                        </a>

                        {/* Save to Asset Library */}
                        <button
                          type="button"
                          onClick={() => handleSaveToLibrary(card)}
                          className="p-1.5 border border-border hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg transition"
                          title="Save to Asset Library (Module 3)"
                        >
                          <FolderPlus className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Card */}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete card "${card.title}"?`)) {
                              deleteCard(card.id)
                              showToast("✓ Card removed.")
                            }
                          }}
                          className="p-1.5 border border-border hover:bg-destructive/10 text-destructive rounded-lg transition"
                          title="Delete Card"
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

      {/* 5. Modal: Pick from Central Asset Library */}
      {showAssetPicker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-2xl rounded-xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-blue-500" />
                <h3 className="font-extrabold text-sm text-foreground">
                  Pick Image from Central Asset Library (Module 3)
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
