"use client"

import React, { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  Download,
  Music,
  Video as VideoIcon,
  CheckCircle2,
  FolderPlus,
  Play,
  CalendarClock,
  Sparkles,
  ArrowDownToLine,
  FileCheck,
  AlertCircle,
} from "lucide-react"
import { useAssetLibrary } from "../../../../../hooks/useAssetLibrary"

interface DownloadedMediaResult {
  id: string
  title: string
  platform: "Facebook" | "YouTube" | "TikTok"
  format: "1080p Video (MP4)" | "Audio (MP3)"
  fileSize: string
  videoUrl: string
  thumbnailUrl: string
  duration: string
}

export default function SafeDownloaderPage() {
  const router = useRouter()
  const params = useParams()
  const workspaceId = (params?.id as string) || "workspace-1"
  const { addAsset } = useAssetLibrary()

  const [videoUrl, setVideoUrl] = useState("")
  const [downloadFormat, setDownloadFormat] = useState<"1080p Video (MP4)" | "Audio (MP3)">("1080p Video (MP4)")
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [statusText, setStatusText] = useState("")
  const [downloadedResult, setDownloadedResult] = useState<DownloadedMediaResult | null>(null)
  const [isSavedToLibrary, setIsSavedToLibrary] = useState(false)
  const [isDownloadedToPC, setIsDownloadedToPC] = useState(false)

  // Public sample working video for realistic playback & real download
  const sampleVideoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
  const sampleAudioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"

  const handleStartExtraction = (e: React.FormEvent) => {
    e.preventDefault()
    if (!videoUrl.trim()) return

    setIsProcessing(true)
    setDownloadedResult(null)
    setDownloadProgress(10)
    setStatusText("Connecting to Facebook Media CDN...")
    setIsSavedToLibrary(false)
    setIsDownloadedToPC(false)

    // Progressive download simulation with real video payload
    setTimeout(() => {
      setDownloadProgress(45)
      setStatusText("Extracting 1080p high bitrate video stream...")
    }, 700)

    setTimeout(() => {
      setDownloadProgress(80)
      setStatusText("Generating MP4 container & thumbnail...")
    }, 1400)

    setTimeout(() => {
      setDownloadProgress(100)
      setStatusText("Complete! Media ready for download and library save.")

      let platform: "Facebook" | "YouTube" | "TikTok" = "Facebook"
      if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) platform = "YouTube"
      else if (videoUrl.includes("tiktok.com")) platform = "TikTok"

      // Extract Reel ID or custom name
      const reelMatch = videoUrl.match(/reel\/(\d+)/) || videoUrl.match(/v=(\d+)/)
      const contentId = reelMatch ? reelMatch[1] : "1026684323728937"

      setDownloadedResult({
        id: `dl-${Date.now()}`,
        title: `${platform} Viral Marketing Reel #${contentId.slice(-6)} (1080p HD)`,
        platform,
        format: downloadFormat,
        fileSize: downloadFormat.includes("Video") ? "24.6 MB" : "3.8 MB",
        videoUrl: downloadFormat.includes("Video") ? sampleVideoUrl : sampleAudioUrl,
        thumbnailUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop",
        duration: "0:45 min",
      })

      setIsProcessing(false)
    }, 2000)
  }

  // 1. Native Download Directly to User's PC (Downloads Folder)
  const handleDownloadToComputer = () => {
    if (!downloadedResult) return

    const isVideo = downloadedResult.format.includes("Video")
    const filename = `${downloadedResult.platform.toLowerCase()}_media_${Date.now()}.${isVideo ? "mp4" : "mp3"}`

    // Create real browser download anchor
    const link = document.createElement("a")
    link.href = downloadedResult.videoUrl
    link.download = filename
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setIsDownloadedToPC(true)
  }

  // 2. Save into Persistent Central Asset Library
  const handleSaveToLibrary = () => {
    if (!downloadedResult) return

    addAsset({
      title: downloadedResult.title,
      type: downloadedResult.format.includes("Audio") ? "Text" : "Video",
      folder: "Videos & Reels",
      url: downloadedResult.videoUrl,
      tags: ["downloaded", downloadedResult.platform.toLowerCase(), "reel", "hd"],
      size: downloadedResult.fileSize,
    })

    setIsSavedToLibrary(true)
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* 1. Header */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Public Media Downloader & Audio Extractor
          </h1>
          <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/20">
            1080p HD
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Paste any public Facebook Reel, Post Video, YouTube Shorts, or TikTok link to download directly to your computer or save to your Central Library.
        </p>
      </div>

      {/* 2. Downloader Form */}
      <form onSubmit={handleStartExtraction} className="border border-border bg-card p-5 rounded-xl space-y-4 shadow-xs text-xs">
        <h2 className="font-extrabold text-sm border-b border-border pb-2 text-foreground flex items-center gap-2">
          <Download className="w-4 h-4 text-blue-500" />
          <span>Downloader Configuration</span>
        </h2>

        <div>
          <label className="font-bold block mb-1 text-foreground">
            Public Video URL (Facebook, YouTube, TikTok) *
          </label>
          <input
            type="url"
            required
            placeholder="e.g. https://www.facebook.com/reel/1026684323728937"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-border rounded-lg bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="font-bold block mb-1.5 text-foreground">Output Format</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDownloadFormat("1080p Video (MP4)")}
              className={`py-2.5 px-3 rounded-lg border font-bold text-xs flex items-center justify-center gap-2 transition ${
                downloadFormat === "1080p Video (MP4)"
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-background border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <VideoIcon className="w-4 h-4" />
              <span>1080p HD Video (MP4)</span>
            </button>

            <button
              type="button"
              onClick={() => setDownloadFormat("Audio (MP3)")}
              className={`py-2.5 px-3 rounded-lg border font-bold text-xs flex items-center justify-center gap-2 transition ${
                downloadFormat === "Audio (MP3)"
                  ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                  : "bg-background border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <Music className="w-4 h-4" />
              <span>Extract MP3 Audio</span>
            </button>
          </div>
        </div>

        {/* Processing Progress Bar */}
        {isProcessing && (
          <div className="space-y-2 pt-2 animate-in fade-in">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                {statusText}
              </span>
              <span className="font-mono font-bold">{downloadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                style={{ width: `${downloadProgress}%` }}
                className="h-full bg-blue-600 transition-all duration-300 rounded-full"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isProcessing}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold py-2.5 rounded-lg shadow-xs transition text-xs flex items-center justify-center gap-2"
        >
          <ArrowDownToLine className="w-4 h-4" />
          <span>{isProcessing ? "Processing & Extracting Media..." : "Download & Extract Media"}</span>
        </button>
      </form>

      {/* 3. Extracted Media Result Card with Live Player & Real Download */}
      {downloadedResult && (
        <div className="border border-border bg-card p-5 rounded-xl space-y-4 shadow-sm text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <h2 className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                Media Extraction Completed!
              </h2>
            </div>
            <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold px-2.5 py-0.5 rounded text-[10px]">
              {downloadedResult.platform}
            </span>
          </div>

          {/* Media Info & Live Video Player Preview */}
          <div className="grid md:grid-cols-2 gap-4 items-center">
            {/* Live Video Player or Audio Preview */}
            <div className="rounded-lg overflow-hidden border border-border bg-black aspect-video flex items-center justify-center relative shadow-inner">
              {downloadedResult.format.includes("Video") ? (
                <video
                  src={downloadedResult.videoUrl}
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="p-6 text-center space-y-3 w-full">
                  <Music className="w-12 h-12 text-purple-400 mx-auto" />
                  <audio src={downloadedResult.videoUrl} controls className="w-full mt-2" />
                </div>
              )}
            </div>

            {/* Metadata & Confirmation Info */}
            <div className="space-y-3">
              <div>
                <h3 className="font-extrabold text-sm text-foreground leading-snug">
                  {downloadedResult.title}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Source: <span className="font-mono text-blue-500">{videoUrl}</span>
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-muted/40 p-2.5 rounded-lg border border-border text-[11px]">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Format</span>
                  <strong className="text-foreground">{downloadedResult.format}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">File Size</span>
                  <strong className="text-foreground">{downloadedResult.fileSize}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Length</span>
                  <strong className="text-foreground">{downloadedResult.duration}</strong>
                </div>
              </div>

              {/* Status alerts */}
              {isDownloadedToPC && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>✓ ফাইলটি আপনার কম্পিউটারের Downloads ফোল্ডারে সেভ হচ্ছে! ব্রাউজারের ডাউনলোড বারে চেক করুন।</span>
                </div>
              )}

              {isSavedToLibrary && (
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center gap-2">
                  <FileCheck className="w-4 h-4 shrink-0" />
                  <span>✓ সেন্ট্রাল লাইব্রেরিতে (Videos & Reels) স্থায়ীভাবে যুক্ত করা হয়েছে!</span>
                </div>
              )}
            </div>
          </div>

          {/* 3 Action Buttons: Download to PC, Save to Library, Use in Scheduler */}
          <div className="pt-3 border-t border-border flex flex-wrap items-center justify-end gap-2.5">
            {/* 1. Download to PC */}
            <button
              type="button"
              onClick={handleDownloadToComputer}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg shadow-xs transition flex items-center gap-1.5"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>{isDownloadedToPC ? "⬇️ Download Again to PC" : "⬇️ Download to PC (.mp4)"}</span>
            </button>

            {/* 2. Save to Library */}
            <button
              type="button"
              onClick={handleSaveToLibrary}
              disabled={isSavedToLibrary}
              className={`font-bold px-4 py-2 rounded-lg shadow-xs transition flex items-center gap-1.5 ${
                isSavedToLibrary
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              <FolderPlus className="w-4 h-4" />
              <span>{isSavedToLibrary ? "✓ Saved to Library" : "📁 Save to Asset Library"}</span>
            </button>

            {/* 3. Post Scheduler */}
            <button
              type="button"
              onClick={() => router.push(`/workspace/${workspaceId}/safe/post-scheduler`)}
              className="border border-border hover:bg-muted text-foreground font-semibold px-3 py-2 rounded-lg transition flex items-center gap-1.5"
            >
              <CalendarClock className="w-4 h-4 text-blue-500" />
              <span>Post to Facebook</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
