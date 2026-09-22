"use client"

import React, { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAssetLibrary } from "../../../../../hooks/useAssetLibrary"

export default function SafeClickableImagePage() {
  const router = useRouter()
  const params = useParams()
  const workspaceId = params?.id || "workspace-1"

  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1542744094-3a3172720a8a?w=600&auto=format&fit=crop")
  const [targetLink, setTargetLink] = useState("https://bmt.link/eid-mega-offer")
  const [cardTitle, setCardTitle] = useState("Eid Mega Sale 2026 - Up to 50% Off!")
  const [generatedCardUrl, setGeneratedCardUrl] = useState<string | null>(null)

  const { addAsset } = useAssetLibrary()
  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleGenerateClickableCard = () => {
    const slug = cardTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    setGeneratedCardUrl(`https://bmt.cards/${slug}`)
  }

  const handleSaveToLibrary = () => {
    addAsset({
      title: cardTitle || "Custom Clickable Card",
      type: "Link",
      folder: "Link Cards",
      url: imageUrl,
      targetUrl: generatedCardUrl || targetLink,
      tags: ["clickable-card", "facebook", "redirect"],
      size: "1.8 MB",
    })
    setSavedSuccess(true)
    setTimeout(() => {
      router.push(`/workspace/${workspaceId}/safe/library`)
    }, 1200)
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight">Clickable Image Generator</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Attach custom links to high-resolution product images to generate shareable clickable card links for Facebook comments and captions.
        </p>
      </div>

      {generatedCardUrl && (
        <div className="p-4 border rounded-xl bg-emerald-500/10 border-emerald-500/30 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">✓ Clickable Image Card Link Ready!</span>
            <button
              onClick={handleSaveToLibrary}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3 py-1 rounded shadow-sm"
            >
              📁 Save to SHOPE Library
            </button>
          </div>
          <div className="flex items-center space-x-2 font-mono font-bold text-foreground">
            <span>Card Link:</span>
            <span className="text-blue-600 underline">{generatedCardUrl}</span>
          </div>
        </div>
      )}

      {/* Main Grid: Form & Preview */}
      <div className="grid gap-6 md:grid-cols-2 text-xs">
        {/* Input Form */}
        <div className="border bg-card p-5 rounded-xl space-y-4 shadow-sm">
          <h2 className="font-extrabold text-sm border-b pb-2">Card Configuration</h2>

          <div>
            <label className="font-bold block mb-1">Card Title *</label>
            <input
              type="text"
              value={cardTitle}
              onChange={(e) => setCardTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            />
          </div>

          <div>
            <label className="font-bold block mb-1">Image URL (Upload or S3/R2 Link) *</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            />
          </div>

          <div>
            <label className="font-bold block mb-1">Destination Target Link *</label>
            <input
              type="url"
              value={targetLink}
              onChange={(e) => setTargetLink(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            />
          </div>

          <button
            onClick={handleGenerateClickableCard}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 rounded-lg shadow-sm transition"
          >
            🖼️ Generate Clickable Image Card
          </button>
        </div>

        {/* Live Card Preview */}
        <div className="border bg-card p-5 rounded-xl space-y-3 shadow-sm flex flex-col justify-between">
          <h2 className="font-extrabold text-sm border-b pb-2">Facebook Share Preview</h2>

          <div className="border rounded-xl overflow-hidden bg-background shadow-md group">
            <div className="h-48 bg-muted overflow-hidden">
              <img src={imageUrl} alt={cardTitle} className="w-full h-full object-cover group-hover:scale-105 transition" />
            </div>
            <div className="p-3.5 space-y-1 bg-card border-t">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">BMT.CARDS</span>
              <h3 className="font-extrabold text-xs text-foreground">{cardTitle}</h3>
              <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold truncate">{targetLink}</p>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground italic text-center">
            Clicking this image card on Facebook will instantly redirect users to your destination link.
          </p>
        </div>
      </div>
    </div>
  )
}
