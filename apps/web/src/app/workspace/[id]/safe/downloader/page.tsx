"use client"

import React, { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAssetLibrary } from "../../../../../hooks/useAssetLibrary"

interface DownloadedMediaResult {
  id: string
  title: string
  platform: "Facebook" | "YouTube" | "TikTok"
  format: "1080p Video (MP4)" | "Audio (MP3)"
  fileSize: string
  previewUrl: string
  downloadUrl: string
}

export default function SafeDownloaderPage() {
  const router = useRouter()
  const params = useParams()
  const workspaceId = params?.id || "workspace-1"

  const [videoUrl, setVideoUrl] = useState("")
  const [downloadFormat, setDownloadFormat] = useState<"1080p Video (MP4)" | "Audio (MP3)">("1080p Video (MP4)")
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadedResult, setDownloadedResult] = useState<DownloadedMediaResult | null>(null)

  const handleStartDownload = () => {
    if (!videoUrl) return alert("Please enter a valid public video URL.")
    setIsProcessing(true)
    setDownloadedResult(null)

    setTimeout(() => {
      let platform: "Facebook" | "YouTube" | "TikTok" = "Facebook"
      if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) platform = "YouTube"
      else if (videoUrl.includes("tiktok.com")) platform = "TikTok"

      setDownloadedResult({
        id: `dl-${Date.now()}`,
        title: `${platform} Viral Marketing Video HD 1080p`,
        platform: platform,
        format: downloadFormat,
        fileSize: downloadFormat.includes("Video") ? "34.8 MB" : "4.2 MB",
        previewUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop",
        downloadUrl: "#",
      })
      setIsProcessing(false)
    }, 1200)
  }

  const { addAsset } = useAssetLibrary()

  const handleSaveDirectlyToLibrary = () => {
    if (downloadedResult) {
      addAsset({
        title: downloadedResult.title,
        type: downloadedResult.format.includes("Audio") ? "Text" : "Video",
        folder: "Videos & Reels",
        url: downloadedResult.previewUrl,
        tags: ["downloaded", downloadedResult.platform.toLowerCase(), "media"],
        size: downloadedResult.fileSize,
      })
    }
    router.push(`/workspace/${workspaceId}/safe/library`)
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight">Public Media Downloader & Audio Extractor</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Download 1080p videos or extract MP3 audio from public Facebook, YouTube, and TikTok posts directly into SHOPE Library.
        </p>
      </div>

      {/* Input Form Card */}
      <div className="border bg-card p-5 rounded-xl space-y-4 shadow-sm text-xs">
        <h2 className="font-extrabold text-sm border-b pb-2">Downloader Inputs</h2>

        <div>
          <label className="font-bold block mb-1">Public Video URL (FB, YouTube, TikTok) *</label>
          <input
            type="url"
            required
            placeholder="e.g. https://www.facebook.com/watch/?v=109823487123"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-background"
          />
        </div>

        <div>
          <label className="font-bold block mb-1">Download Format</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDownloadFormat("1080p Video (MP4)")}
              className={`py-2 rounded-lg border font-bold ${
                downloadFormat === "1080p Video (MP4)" ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "hover:bg-muted"
              }`}
            >
              🎬 1080p HD Video (MP4)
            </button>

            <button
              type="button"
              onClick={() => setDownloadFormat("Audio (MP3)")}
              className={`py-2 rounded-lg border font-bold ${
                downloadFormat === "Audio (MP3)" ? "bg-purple-600 text-white border-purple-600 shadow-sm" : "hover:bg-muted"
              }`}
            >
              🎵 Extract MP3 Audio
            </button>
          </div>
        </div>

        <button
          onClick={handleStartDownload}
          disabled={isProcessing}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold py-2.5 rounded-lg shadow-sm transition text-xs flex items-center justify-center space-x-2"
        >
          <span>{isProcessing ? "Extracting Public Media File..." : "📥 Download & Extract Media"}</span>
        </button>
      </div>

      {/* Extracted Download Result */}
      {downloadedResult && (
        <div className="border bg-card p-5 rounded-xl space-y-4 shadow-sm text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">✓ Extracted Result Ready</h2>
            <span className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold px-2.5 py-0.5 rounded text-[10px]">
              Platform: {downloadedResult.platform}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="w-36 h-24 rounded-lg overflow-hidden border bg-muted flex-shrink-0">
              <img src={downloadedResult.previewUrl} alt="Thumbnail" className="w-full h-full object-cover" />
            </div>

            <div className="space-y-1.5 flex-1 text-center sm:text-left">
              <h3 className="font-extrabold text-sm text-foreground">{downloadedResult.title}</h3>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-muted-foreground text-[11px]">
                <span>Format: <strong className="text-foreground">{downloadedResult.format}</strong></span>
                <span>•</span>
                <span>Size: <strong className="text-foreground">{downloadedResult.fileSize}</strong></span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t flex flex-col sm:flex-row items-center justify-end gap-2">
            <button
              onClick={handleSaveDirectlyToLibrary}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg shadow-sm"
            >
              📁 Save Directly to SHOPE Asset Library
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
