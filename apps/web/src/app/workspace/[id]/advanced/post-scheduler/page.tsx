"use client"

import React, { useState } from "react"
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Zap,
  Sun,
  Moon,
  Send,
  CheckCircle2,
  Check,
  Bot,
  Users,
  FileText,
  Pin,
  TrendingUp,
  Globe,
  Sliders,
} from "lucide-react"

export default function AdvancedPostSchedulerPage() {
  const [postType, setPostType] = useState("Post Text/Media")
  const [targetType, setTargetType] = useState("BOTH")
  const [hookTone, setHookTone] = useState("Curiosity")
  const [targetCountry, setTargetCountry] = useState("USA")
  const [category, setCategory] = useState("E-Commerce")
  const [masterText, setMasterText] = useState("")
  const [ctaCommentLink, setCtaCommentLink] = useState("")
  const [aiScore, setAiScore] = useState<number | null>(null)
  const [scheduleMode, setScheduleMode] = useState<"Immediate" | "SpecificTime">("SpecificTime")
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const [scheduledDateTime, setScheduledDateTime] = useState<string>(() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 30)
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    const hours = String(now.getHours()).padStart(2, "0")
    const minutes = String(now.getMinutes()).padStart(2, "0")
    return `${year}-${month}-${day}T${hours}:${minutes}`
  })

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const getFormattedSelectedTime = () => {
    if (!scheduledDateTime) return "Select Time"
    try {
      const dt = new Date(scheduledDateTime)
      return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
    } catch {
      return "12:45 PM"
    }
  }

  const setQuickPreset = (preset: "1h" | "tomorrow_morning" | "tomorrow_evening") => {
    const target = new Date()
    if (preset === "1h") {
      target.setHours(target.getHours() + 1)
    } else if (preset === "tomorrow_morning") {
      target.setDate(target.getDate() + 1)
      target.setHours(10, 0, 0, 0)
    } else if (preset === "tomorrow_evening") {
      target.setDate(target.getDate() + 1)
      target.setHours(19, 30, 0, 0)
    }
    const year = target.getFullYear()
    const month = String(target.getMonth() + 1).padStart(2, "0")
    const day = String(target.getDate()).padStart(2, "0")
    const hours = String(target.getHours()).padStart(2, "0")
    const minutes = String(target.getMinutes()).padStart(2, "0")
    setScheduledDateTime(`${year}-${month}-${day}T${hours}:${minutes}`)
  }

  const handleAnalyzeViralScore = () => {
    const score = Math.floor(Math.random() * 11) + 88
    setAiScore(score)
    showToast(`AI Viral Score: ${score}/100 analyzed with high emotion match.`)
  }

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault()
    showToast(
      `Master Post Scheduled for ${
        scheduleMode === "SpecificTime" ? getFormattedSelectedTime() : "Immediate Queue"
      } with ${hookTone} AI Variations and 10-50s random delays!`
    )
  }

  return (
    <div className="max-w-4xl space-y-6 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-blue-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Upload Post Scheduler & AI Engine
            </h1>
            <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800">
              ADVANCED ENGINE
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Create Master Posts with AI Variations, Photo Rotation, Randomized Delays (10-50s), CTA Pin Commenting, and AI Viral Score Analysis.
          </p>
        </div>
      </div>

      {/* Executive Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Target Destination</span>
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-base font-bold text-foreground truncate">
              {targetType === "BOTH" ? "IDs & Pages" : targetType === "ID_ONLY" ? "IDs Only" : "Pages Only"}
            </span>
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
              Active Sync
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Post Format</span>
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-base font-bold text-foreground truncate">
              {postType.replace("Post ", "")}
            </span>
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
              Media Ready
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>AI Variation</span>
            <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-base font-bold text-foreground">
              {hookTone}
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground">
              Behavior Sync
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Queue Mode</span>
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-base font-bold text-foreground">
              10-50s Delays
            </span>
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
              Anti-Ban
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSchedule} className="border border-border bg-card p-5 sm:p-6 rounded-xl space-y-6 shadow-xs">
        {/* 1. Target Selection & Post Type */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Target Destination</span>
            </label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="w-full border border-border rounded-lg p-2.5 text-xs bg-background text-foreground focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition min-h-[38px]"
            >
              <option value="BOTH">All Connected FB IDs & Pages (Both)</option>
              <option value="ID_ONLY">Facebook IDs Only</option>
              <option value="PAGE_ONLY">Facebook Pages Only</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Post Format</span>
            </label>
            <select
              value={postType}
              onChange={(e) => setPostType(e.target.value)}
              className="w-full border border-border rounded-lg p-2.5 text-xs bg-background text-foreground focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition min-h-[38px]"
            >
              <option value="Post Text/Media">Post Text / Video / Photo</option>
              <option value="Post Story">Post Story</option>
              <option value="Post Reels">Post Reels</option>
              <option value="Post Poll">Post Poll</option>
            </select>
          </div>
        </div>

        {/* 2. Master Post Editor */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Master Post Content (10+ Photos / Video / Text)</span>
          </label>
          <textarea
            rows={4}
            required
            placeholder="Title + Description + Hashtag (Master copy for AI variation engine)..."
            value={masterText}
            onChange={(e) => setMasterText(e.target.value)}
            className="w-full border border-border rounded-lg p-3 text-xs bg-background text-foreground focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition leading-relaxed"
          />
        </div>

        {/* 3. AI Variation Engine Controls */}
        <div className="border border-blue-500/20 bg-blue-50/20 dark:bg-blue-950/10 p-4 rounded-xl space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center space-x-2">
            <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>AI Variation & Human Behavior Engine</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center space-x-1">
                <Globe className="w-3 h-3 text-blue-500" />
                <span>Target Country</span>
              </label>
              <select
                value={targetCountry}
                onChange={(e) => setTargetCountry(e.target.value)}
                className="w-full border border-border rounded-lg p-2 text-xs bg-background text-foreground focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition min-h-[36px]"
              >
                <option value="USA">United States (USA)</option>
                <option value="BD">Bangladesh (BD)</option>
                <option value="UK">United Kingdom (UK)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center space-x-1">
                <Sliders className="w-3 h-3 text-blue-500" />
                <span>Category</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-border rounded-lg p-2 text-xs bg-background text-foreground focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition min-h-[36px]"
              >
                <option value="E-Commerce">E-Commerce</option>
                <option value="Entertainment">Entertainment</option>
                <option value="News">News</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-blue-500" />
                <span>AI Hook Tone</span>
              </label>
              <select
                value={hookTone}
                onChange={(e) => setHookTone(e.target.value)}
                className="w-full border border-border rounded-lg p-2 text-xs bg-background text-foreground focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition min-h-[36px]"
              >
                <option value="Curiosity">Curiosity (কৌতূহল)</option>
                <option value="Emotional">Emotional (আবেগীয়)</option>
                <option value="Shock">Shock (হতবাক করা)</option>
                <option value="Question">Question (প্রশ্নবোধক)</option>
              </select>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            AI will generate distinct Titles, Descriptions, Hashtags, and CTAs for each account while rotating 10 uploaded photos 1-by-1 to simulate natural human activity.
          </p>
        </div>

        {/* 4. CTA Pin Commenting */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center space-x-1.5">
            <Pin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>CTA Pin Comment (Auto-pinned post publishing)</span>
          </label>
          <input
            type="text"
            placeholder="প্রয়োজনীয় তথ্যের ভিডিও বিস্তারিত জানতে লিংকে ক্লিক করুন: https://yourlink.com"
            value={ctaCommentLink}
            onChange={(e) => setCtaCommentLink(e.target.value)}
            className="w-full border border-border rounded-lg p-2.5 text-xs bg-background text-foreground focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition min-h-[38px]"
          />
        </div>

        {/* 4.5 Target Schedule Time Picker Card */}
        <div className="border border-border bg-card p-4 rounded-xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <h2 className="font-bold text-xs flex items-center space-x-2 uppercase tracking-wider text-foreground">
              <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Schedule Target Time & Delay Engine</span>
            </h2>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              Active
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-foreground block mb-2">Publish Schedule Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setScheduleMode("SpecificTime")}
                  className={`py-2 px-3 rounded-lg border font-semibold text-xs transition flex items-center justify-center space-x-1.5 min-h-[38px] ${
                    scheduleMode === "SpecificTime"
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Specific Time ({getFormattedSelectedTime()})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleMode("Immediate")}
                  className={`py-2 px-3 rounded-lg border font-semibold text-xs transition flex items-center justify-center space-x-1.5 min-h-[38px] ${
                    scheduleMode === "Immediate"
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Immediate Queue</span>
                </button>
              </div>
            </div>

            {scheduleMode === "SpecificTime" && (
              <div className="p-3.5 border border-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-xs text-blue-700 dark:text-blue-400 block">
                    Select Target Date & Time
                  </label>
                  <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 rounded-full">
                    {getFormattedSelectedTime()} Selected
                  </span>
                </div>

                <input
                  type="datetime-local"
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs font-semibold text-foreground focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer min-h-[38px]"
                />

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-muted-foreground mr-1">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => setQuickPreset("1h")}
                    className="text-[10px] bg-card hover:bg-muted px-2.5 py-1 rounded-md border border-border font-semibold text-foreground flex items-center space-x-1 transition min-h-[28px]"
                  >
                    <Zap className="w-3 h-3 text-blue-500" />
                    <span>In 1 Hr</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickPreset("tomorrow_morning")}
                    className="text-[10px] bg-card hover:bg-muted px-2.5 py-1 rounded-md border border-border font-semibold text-foreground flex items-center space-x-1 transition min-h-[28px]"
                  >
                    <Sun className="w-3 h-3 text-blue-500" />
                    <span>Tomorrow 10 AM</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickPreset("tomorrow_evening")}
                    className="text-[10px] bg-card hover:bg-muted px-2.5 py-1 rounded-md border border-border font-semibold text-foreground flex items-center space-x-1 transition min-h-[28px]"
                  >
                    <Moon className="w-3 h-3 text-blue-500" />
                    <span>Tomorrow 7:30 PM</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 5. AI Viral Score & Schedule Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={handleAnalyzeViralScore}
            className="w-full sm:w-auto bg-card hover:bg-muted border border-border text-foreground text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xs transition flex items-center justify-center space-x-1.5 min-h-[40px]"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Check AI Viral Score</span>
          </button>

          <button
            type="submit"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg text-xs shadow-xs transition flex items-center justify-center space-x-1.5 min-h-[40px]"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Schedule Master Post (Auto-Delays 10-50s)</span>
          </button>
        </div>
      </form>

      {/* AI Viral Score Result */}
      {aiScore !== null && (
        <div className="border border-border bg-card p-5 sm:p-6 rounded-xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>AI Viral Score Result</span>
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {aiScore} / 100
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 text-xs text-muted-foreground pt-1">
            <div className="flex items-center space-x-1.5 p-2 rounded-lg bg-muted/40 border border-border">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Emotion Power: <strong className="text-foreground">High</strong></span>
            </div>
            <div className="flex items-center space-x-1.5 p-2 rounded-lg bg-muted/40 border border-border">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Hook Strength: <strong className="text-foreground">Strong ({hookTone})</strong></span>
            </div>
            <div className="flex items-center space-x-1.5 p-2 rounded-lg bg-muted/40 border border-border">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Trending Match: <strong className="text-foreground">95%</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
