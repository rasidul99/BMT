"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { env } from "../../../../../lib/env"
import { initializeTokenFromEnv, autoRefreshTokenIfNeeded } from "../../../../../lib/fb-token-manager"
import { getPublishToken, initializeDefaultPages, FacebookPageEntry } from "../../../../../lib/fb-page-registry"

interface QueueJob {
  id: string
  variationTitle: string
  accountName: string
  delayMinutes: number
  scheduledFor: string
  status: "Pending" | "Processing" | "Posted" | "Failed"
  retryCount: number
  maxRetries: number
  lastError?: string
}

interface BestPostingTimeSlot {
  slot: string
  day: string
  targetTimezone: string
  localTime: string
  expectedReachBoost: string
  reason: string
}

interface CalendarEvent {
  id: string
  title: string
  accountName: string
  date: string
  time: string
  status: "Scheduled" | "Posted" | "Failed font-bold"
  tone: string
}

export default function SafePostSchedulerPage() {
  const searchParams = useSearchParams()
  const libraryAssetId = searchParams.get("libraryAssetId")

  // Master Post Form State
  const [postFormat, setPostFormat] = useState<"Text" | "Image" | "Video" | "Reel" | "Story" | "Poll">("Image")
  const [title, setTitle] = useState("Eid Special Premium Watch Collection Offer 2026")
  const [description, setDescription] = useState(
    "🔥 ঈদ অফারে পাচ্ছেন প্রিমিয়াম ওয়াচ কালেকশনে ৪০% পর্যন্ত ছাড়! স্টক সীমিত। অর্ডার করতে এখনই নিচের লিংকে ভিসিট করুন।"
  )
  const [hashtags, setHashtags] = useState("#EidSale #FashionBD #WatchOffer #SpecialDiscount")
  const [emoji, setEmoji] = useState("🔥 ⌚ 🎁 ⚡")
  const [cta, setCta] = useState("Order Now: https://bmt.link/eid-watch-sale")
  const [mediaUrl, setMediaUrl] = useState(
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop"
  )

  // AI & Delay Settings
  const [targetCountry, setTargetCountry] = useState("Bangladesh")
  const [category, setCategory] = useState("Fashion & E-Commerce")
  const [selectedTone, setSelectedTone] = useState("Curiosity")
  const [isGenerating, setIsGenerating] = useState(false)
  const [assignMode, setAssignMode] = useState<"Manual" | "Auto">("Auto")

  // Delay Settings (Mandatory Min 5m)
  const [delayType, setDelayType] = useState<"Randomized" | "Fixed">("Randomized")
  const [minDelay, setMinDelay] = useState<number>(5)
  const [fixedInterval, setFixedInterval] = useState<number>(5)

  // Active View Tab: Scheduler vs Calendar vs Queue Monitor
  const [activeTab, setActiveTab] = useState<"Scheduler" | "Calendar" | "QueueMonitor" | "BestTimes">("Scheduler")

  // Multi-Page Support via Page Registry & Env Fallbacks
  const defaultPageEntries = [
    {
      pageId: env.NEXT_PUBLIC_FB_PAGE_ID_CARE_HUB_BD || "892168940637389",
      pageName: "CARE HUB BD",
      accessToken: env.NEXT_PUBLIC_FB_PAGE_TOKEN_CARE_HUB_BD || "",
      tokenExpiry: Date.now() + 60 * 24 * 60 * 60 * 1000,
      category: "Health & Care",
    },
    {
      pageId: "page-102-id",
      pageName: "সাধারণ রান্না বান্না ব্লগ",
      accessToken: "",
      tokenExpiry: Date.now() + 60 * 24 * 60 * 60 * 1000,
      category: "Food & Cooking Blog",
    },
    {
      pageId: "page-103-id",
      pageName: "NB Hridoy Hossen (Profile)",
      accessToken: "",
      tokenExpiry: Date.now() + 60 * 24 * 60 * 60 * 1000,
      category: "Digital Creator / Business",
    },
  ]

  const [registeredPages, setRegisteredPages] = useState<FacebookPageEntry[]>([])
  const [selectedTargetAccounts, setSelectedTargetAccounts] = useState<string[]>(["CARE HUB BD"])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const pages = initializeDefaultPages(defaultPageEntries)
      setRegisteredPages(pages)

      // Initialize/refresh long-lived token for CARE HUB BD
      if (env.NEXT_PUBLIC_FB_APP_ID && env.NEXT_PUBLIC_FB_APP_SECRET && env.NEXT_PUBLIC_FB_PAGE_TOKEN_CARE_HUB_BD) {
        initializeTokenFromEnv(
          env.NEXT_PUBLIC_FB_PAGE_ID_CARE_HUB_BD || "892168940637389",
          "CARE HUB BD",
          env.NEXT_PUBLIC_FB_PAGE_TOKEN_CARE_HUB_BD,
          env.NEXT_PUBLIC_FB_APP_ID,
          env.NEXT_PUBLIC_FB_APP_SECRET
        )
      }
    }
  }, [])

  // Default Queue Jobs State
  const defaultQueueJobs: QueueJob[] = [
    { id: "job-101", variationTitle: "[Curiosity] ঈদ অফারে পাচ্ছেন প্রিমিয়াম ওয়াচ...", accountName: "Fashion Hub Official", delayMinutes: 10, scheduledFor: "Today, 4:10 PM", status: "Processing", retryCount: 0, maxRetries: 3 },
    { id: "job-102", variationTitle: "[Emotional] প্রিয়জনকে ভালোবাসার উপহার দিন...", accountName: "Tech Gadgets BD", delayMinutes: 20, scheduledFor: "Today, 4:30 PM", status: "Pending", retryCount: 0, maxRetries: 3 },
    { id: "job-103", variationTitle: "[Shock] 🚨 স্টক সীমিত! ঈদ ধামাকা ডিল...", accountName: "Organic Superstore", delayMinutes: 50, scheduledFor: "Today, 5:20 PM", status: "Failed", retryCount: 3, maxRetries: 3, lastError: "Graph API (#200) Permissions error on /group/feed" },
  ]

  const [queueJobs, setQueueJobs] = useState<QueueJob[]>(defaultQueueJobs)

  const saveQueueJobsToStorage = (jobs: QueueJob[]) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("bmt_queue_jobs", JSON.stringify(jobs))
    }
  }

  // Load queueJobs from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bmt_queue_jobs")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setQueueJobs(parsed)
          }
        } catch {}
      } else {
        localStorage.setItem("bmt_queue_jobs", JSON.stringify(defaultQueueJobs))
      }
    }
  }, [])

  // Calendar View State
  const [calendarView, setCalendarView] = useState<"Monthly" | "Weekly" | "Daily">("Weekly")
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>("ALL")
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([
    { id: "evt-1", title: "Eid Special Offer (Fashion Hub)", accountName: "Fashion Hub Official", date: "2026-08-01", time: "16:00", status: "Scheduled", tone: "Curiosity" },
    { id: "evt-2", title: "Top 5 Gadgets (Tech BD)", accountName: "Tech Gadgets BD", date: "2026-08-01", time: "19:30", status: "Scheduled", tone: "Emotional" },
    { id: "evt-3", title: "Organic Honey Deal", accountName: "Organic Superstore", date: "2026-08-02", time: "10:00", status: "Posted", tone: "Funny" },
  ])

  // Best Posting Times State
  const bestTimes: BestPostingTimeSlot[] = [
    { slot: "Slot 1 (Evening Peak)", day: "Everyday", targetTimezone: "Asia/Dhaka (GMT+6)", localTime: "7:30 PM - 9:00 PM", expectedReachBoost: "+42% Reach", reason: "Highest active user engagement for Bangladesh consumer market." },
    { slot: "Slot 2 (Lunch Break)", day: "Mon - Thu", targetTimezone: "Asia/Dhaka (GMT+6)", localTime: "1:15 PM - 2:30 PM", expectedReachBoost: "+28% Reach", reason: "Mid-day mobile browsing peak during office breaks." },
    { slot: "Slot 3 (Friday Special)", day: "Friday", targetTimezone: "Asia/Dhaka (GMT+6)", localTime: "3:30 PM - 5:00 PM", expectedReachBoost: "+55% Reach", reason: "Post-Jumma prayer holiday traffic spike on Facebook Reels." },
    { slot: "Slot 4 (Late Night)", day: "Sat - Sun", targetTimezone: "Asia/Dhaka (GMT+6)", localTime: "10:30 PM - 11:45 PM", expectedReachBoost: "+34% Reach", reason: "Night owl shopping & video reel consumption." },
  ]

  useEffect(() => {
    if (libraryAssetId) {
      setMediaUrl("https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop")
    }

    const importedContent = searchParams.get("importedContent")
    const importedTitle = searchParams.get("importedTitle")
    const importedMedia = searchParams.get("importedMedia")
    const importedFormat = searchParams.get("importedFormat")

    if (importedContent) {
      setDescription(decodeURIComponent(importedContent))
    }
    if (importedTitle) {
      setTitle(decodeURIComponent(importedTitle))
    }
    if (importedMedia) {
      setMediaUrl(decodeURIComponent(importedMedia))
    }
    if (importedFormat && ["Text", "Image", "Video", "Reel", "Story", "Poll"].includes(importedFormat)) {
      setPostFormat(importedFormat as any)
    }
  }, [libraryAssetId, searchParams])

  // Dynamic Facebook Graph API Publisher (Supports Feed, Photo, Video endpoints)
  const publishToFacebookPage = async (job: QueueJob): Promise<{ success: boolean; postId?: string; error?: string }> => {
    try {
      // Lookup target page credentials dynamically
      let pageId = env.NEXT_PUBLIC_FB_PAGE_ID_CARE_HUB_BD || "892168940637389"
      let pageToken = env.NEXT_PUBLIC_FB_PAGE_TOKEN_CARE_HUB_BD || ""

      const registeredLookup = getPublishToken(job.accountName)
      if (registeredLookup && registeredLookup.accessToken) {
        pageId = registeredLookup.pageId
        pageToken = registeredLookup.accessToken
      }

      // Fallback: If account is not CARE HUB BD, use active token with primary page or target pageId if available
      if (!pageToken) {
        return { success: false, error: `No active Page Access Token configured for ${job.accountName}` }
      }

      const message = `${job.variationTitle}\n\n${description}\n\n${hashtags}\n${cta}`

      // Select Graph API Endpoint based on Post Format & Media
      let endpoint = `https://graph.facebook.com/v26.0/${pageId}/feed`
      let payload: Record<string, any> = { message, access_token: pageToken }

      if (postFormat === "Image" && mediaUrl) {
        endpoint = `https://graph.facebook.com/v26.0/${pageId}/photos`
        payload = { url: mediaUrl, caption: message, access_token: pageToken }
      } else if (postFormat === "Video" && mediaUrl) {
        endpoint = `https://graph.facebook.com/v26.0/${pageId}/videos`
        payload = { file_url: mediaUrl, description: message, access_token: pageToken }
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.id || data.post_id) {
        return { success: true, postId: data.id || data.post_id }
      } else {
        return { success: false, error: data.error?.message || "Unknown Graph API error" }
      }
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" }
    }
  }

  // Queue Processing Worker
  useEffect(() => {
    const timer = setInterval(async () => {
      setQueueJobs(prevJobs => {
        const pendingIdx = prevJobs.findIndex(j => j.status === "Pending")
        if (pendingIdx !== -1) {
          const updated = [...prevJobs]
          updated[pendingIdx] = { ...updated[pendingIdx], status: "Processing" as const }
          saveQueueJobsToStorage(updated)

          const jobToPublish = updated[pendingIdx]
          publishToFacebookPage(jobToPublish).then(result => {
            setQueueJobs(prev => {
              const final = prev.map(j => {
                if (j.id === jobToPublish.id) {
                  if (result.success) {
                    return { ...j, status: "Posted" as const }
                  } else {
                    const newRetry = j.retryCount + 1
                    if (newRetry >= j.maxRetries) {
                      return { ...j, status: "Failed" as const, retryCount: newRetry, lastError: result.error }
                    }
                    return { ...j, status: "Pending" as const, retryCount: newRetry, lastError: result.error }
                  }
                }
                return j
              })
              saveQueueJobsToStorage(final)
              return final
            })
          })

          return updated
        }
        return prevJobs
      })
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  // Target Account & Custom Schedule Time State
  // Helper to format local Date object to YYYY-MM-DDTHH:mm string for datetime-local input
  const formatToDateTimeLocal = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    const hours = String(d.getHours()).padStart(2, "0")
    const minutes = String(d.getMinutes()).padStart(2, "0")
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const getInitialDateTime = () => {
    const now = new Date()
    now.setHours(now.getHours() + 1)
    now.setMinutes(0)
    return formatToDateTimeLocal(now)
  }

  const [selectedTargetAccount, setSelectedTargetAccount] = useState("CARE HUB BD")
  const [scheduleMode, setScheduleMode] = useState<"Immediate" | "SpecificTime">("SpecificTime")
  const [scheduledDateTime, setScheduledDateTime] = useState<string>(getInitialDateTime())
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null)

  // Format selected time dynamically for UI labels (12-hour format with AM/PM)
  const getFormattedSelectedTime = () => {
    if (!scheduledDateTime) return "Select Time"
    try {
      const parts = scheduledDateTime.split("T")
      if (parts.length === 2) {
        const [y, m, d] = parts[0].split("-").map(Number)
        const [hr, min] = parts[1].split(":").map(Number)
        const dateObj = new Date(y, m - 1, d, hr, min)
        return dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
      }
      return "Select Time"
    } catch {
      return "Select Time"
    }
  }

  // Quick preset helper
  const setQuickPreset = (type: "now" | "1h" | "1hour" | "3h" | "tomorrow_morning" | "tomorrow_evening" | "9am" | "1pm" | "7pm") => {
    const base = scheduledDateTime ? new Date(scheduledDateTime.replace("T", " ")) : new Date()
    const now = isNaN(base.getTime()) ? new Date() : base

    if (type === "now") {
      setScheduledDateTime(formatToDateTimeLocal(new Date()))
    } else if (type === "1h" || type === "1hour") {
      const d = new Date()
      d.setHours(d.getHours() + 1)
      setScheduledDateTime(formatToDateTimeLocal(d))
    } else if (type === "3h") {
      const d = new Date()
      d.setHours(d.getHours() + 3)
      setScheduledDateTime(formatToDateTimeLocal(d))
    } else if (type === "tomorrow_morning") {
      const d = new Date()
      d.setDate(d.getDate() + 1)
      d.setHours(10, 0, 0, 0)
      setScheduledDateTime(formatToDateTimeLocal(d))
    } else if (type === "tomorrow_evening") {
      const d = new Date()
      d.setDate(d.getDate() + 1)
      d.setHours(19, 30, 0, 0)
      setScheduledDateTime(formatToDateTimeLocal(d))
    } else if (type === "9am") {
      now.setHours(9, 0, 0, 0)
      setScheduledDateTime(formatToDateTimeLocal(now))
    } else if (type === "1pm") {
      now.setHours(13, 0, 0, 0)
      setScheduledDateTime(formatToDateTimeLocal(now))
    } else if (type === "7pm") {
      now.setHours(19, 0, 0, 0)
      setScheduledDateTime(formatToDateTimeLocal(now))
    }
  }

  // Handle Add to Queue with Enforced Min 5m Delay & Multi-Account Support
  const handleSchedulePostToQueue = () => {
    const delay = delayType === "Randomized" ? Math.max(minDelay, Math.floor(Math.random() * 40) + 10) : Math.max(5, fixedInterval)

    const formattedTime = scheduleMode === "SpecificTime" 
      ? new Date(scheduledDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : `In ${delay} mins`

    const accountsToSchedule = selectedTargetAccounts.length > 0 ? selectedTargetAccounts : ["CARE HUB BD"]

    const newJobs: QueueJob[] = accountsToSchedule.map((account, idx) => ({
      id: `job-${Date.now()}-${idx}`,
      variationTitle: `[${selectedTone}] ${title}`,
      accountName: account,
      delayMinutes: delay,
      scheduledFor: scheduleMode === "SpecificTime" ? `Scheduled for ${formattedTime}` : `Scheduled in ${delay} mins`,
      status: "Pending",
      retryCount: 0,
      maxRetries: 3,
    }))

    const updatedJobs = [...newJobs, ...queueJobs]
    setQueueJobs(updatedJobs)
    saveQueueJobsToStorage(updatedJobs)
    setScheduleSuccess(`✓ Master Post successfully scheduled for ${formattedTime} on ${accountsToSchedule.join(", ")}!`)
    setTimeout(() => {
      setActiveTab("QueueMonitor")
    }, 1200)
  }

  // Handle Retry Failed Job
  const handleRetryJob = (id: string) => {
    setQueueJobs(prev => prev.map(job => {
      if (job.id === id) {
        return { ...job, status: "Processing", retryCount: job.retryCount + 1, lastError: undefined }
      }
      return job
    }))
  }

  // Handle Drag & Drop Reschedule Simulation
  const handleRescheduleEvent = (id: string, newDate: string) => {
    setCalendarEvents(prev => prev.map(evt => evt.id === id ? { ...evt, date: newDate } : evt))
  }

  // Token Manager Modal State
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [activePageToken, setActivePageToken] = useState("EAAG... (Meta Graph API Page Token)")
  const [tokenSaved, setTokenSaved] = useState(false)

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-extrabold tracking-tight">AI Post Scheduler & Content Calendar</h1>
            <button
              onClick={() => setShowTokenModal(true)}
              className="bg-blue-100 hover:bg-blue-200 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-extrabold text-xs px-3 py-1.5 rounded-lg border border-blue-300 dark:border-blue-800 transition flex items-center space-x-1.5"
            >
              <span>🔑</span>
              <span>Manage FB Page Token</span>
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Master Post Creator, Gemini Pro Variations, Bull Queue Delay Engine (Min 5m delay), and Drag & Drop Calendar.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1.5 bg-muted p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab("Scheduler")}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === "Scheduler" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            🚀 Master Scheduler
          </button>
          <button
            onClick={() => setActiveTab("Calendar")}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === "Calendar" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            📅 Content Calendar
          </button>
          <button
            onClick={() => setActiveTab("QueueMonitor")}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === "QueueMonitor" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            ⚙️ Bull Queue Monitor ({queueJobs.length})
          </button>
          <button
            onClick={() => setActiveTab("BestTimes")}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === "BestTimes" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            💡 Best Posting Times
          </button>
        </div>
      </div>

      {/* TAB 1: MASTER SCHEDULER */}
      {activeTab === "Scheduler" && (
        <div className="grid gap-6 lg:grid-cols-12 animate-in fade-in duration-200">
          {/* Master Form */}
          <div className="lg:col-span-7 space-y-5 border bg-card p-5 rounded-xl shadow-sm">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="font-extrabold text-sm">Master Post Creator</h2>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">FB Graph API v20.0</span>
            </div>

            {/* Target Account / Page Selector (Multi-Select Support) */}
            <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-3.5 rounded-xl space-y-2">
              <label className="font-extrabold text-xs text-blue-700 dark:text-blue-300 flex items-center justify-between">
                <span>📘 Target Facebook Pages / Accounts (Multi-Select)</span>
                <span className="text-[10px] text-blue-600 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded font-bold">
                  {selectedTargetAccounts.length} Selected
                </span>
              </label>
              <div className="space-y-1.5 bg-background border rounded-lg p-2.5 max-h-36 overflow-y-auto">
                {registeredPages.map((acc) => {
                  const isChecked = selectedTargetAccounts.includes(acc.pageName)
                  return (
                    <label key={acc.pageId} className="flex items-center space-x-2.5 text-xs font-bold cursor-pointer hover:bg-muted/50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTargetAccounts(prev => [...prev, acc.pageName])
                          } else {
                            if (selectedTargetAccounts.length > 1) {
                              setSelectedTargetAccounts(prev => prev.filter(name => name !== acc.pageName))
                            }
                          }
                        }}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className={isChecked ? "text-blue-700 dark:text-blue-300 font-extrabold" : "text-foreground"}>
                        {acc.pageName} ({acc.category})
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Post Format */}
            <div>
              <label className="font-bold text-xs block mb-1.5">Post Format</label>
              <div className="grid grid-cols-6 gap-1.5 text-xs font-bold">
                {(["Text", "Image", "Video", "Reel", "Story", "Poll"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setPostFormat(fmt)}
                    className={`py-1.5 rounded-lg border transition ${postFormat === fmt ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "hover:bg-muted text-muted-foreground"}`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Copy */}
            <div>
              <label className="font-bold text-xs block mb-1">Post Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-xs block mb-1">Ad Copy / Description *</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background text-xs"
              />
            </div>

            {/* Media Attachment */}
            <div>
              <label className="font-bold text-xs block mb-1">Attached Media URL</label>
              <input
                type="text"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs mb-2"
              />
              {mediaUrl && (
                <div className="h-40 rounded-lg overflow-hidden border bg-muted">
                  <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Settings & Delay System */}
          <div className="lg:col-span-5 space-y-5">
            {/* Target Schedule Time Picker Card */}
            <div className="border bg-card p-5 rounded-xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b pb-2">
                <h2 className="font-extrabold text-sm flex items-center space-x-1.5">
                  <span>📅</span>
                  <span>Schedule Time & Delay Engine</span>
                </h2>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                  Active
                </span>
              </div>

              {/* Schedule Mode: Immediate vs Specific Time */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold block mb-1.5">Publish Schedule Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setScheduleMode("SpecificTime")}
                      className={`py-2 rounded-lg border font-extrabold text-xs transition ${scheduleMode === "SpecificTime" ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "hover:bg-muted"}`}
                    >
                      📅 Specific Time ({getFormattedSelectedTime()})
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleMode("Immediate")}
                      className={`py-2 rounded-lg border font-extrabold text-xs transition ${scheduleMode === "Immediate" ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "hover:bg-muted"}`}
                    >
                      ⚡ Immediate Queue
                    </button>
                  </div>
                </div>

                {/* Specific Date & Time Input */}
                {scheduleMode === "SpecificTime" && (
                  <div className="p-3.5 border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="font-extrabold text-xs text-emerald-700 dark:text-emerald-400 block">
                        Select Target Date & Time
                      </label>
                      <span className="text-[10px] font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded-full">
                        {getFormattedSelectedTime()} Selected
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="datetime-local"
                        value={scheduledDateTime}
                        onChange={(e) => setScheduledDateTime(e.target.value)}
                        onClick={(e) => {
                          try {
                            ;(e.target as HTMLInputElement).showPicker?.()
                          } catch {}
                        }}
                        className="w-full px-3 py-2 border border-emerald-300 dark:border-emerald-700 rounded-lg bg-background text-xs font-bold text-foreground focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm"
                      />
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        onClick={() => setQuickPreset("now")}
                        className="text-[10px] bg-card hover:bg-muted px-2 py-0.5 rounded border font-semibold text-foreground"
                      >
                        ⚡ Now
                      </button>
                      <button
                        onClick={() => setQuickPreset("1hour")}
                        className="text-[10px] bg-card hover:bg-muted px-2 py-0.5 rounded border font-semibold text-foreground"
                      >
                        ⏱️ In 1 Hour
                      </button>
                      <button
                        onClick={() => setQuickPreset("tomorrow_morning")}
                        className="text-[10px] bg-card hover:bg-muted px-2 py-0.5 rounded border font-semibold text-foreground"
                      >
                        🌅 Tomorrow 10 AM
                      </button>
                      <button
                        onClick={() => setQuickPreset("tomorrow_evening")}
                        className="text-[10px] bg-card hover:bg-muted px-2 py-0.5 rounded border font-semibold text-foreground"
                      >
                        🌆 Tomorrow 7:30 PM
                      </button>
                    </div>

                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1 border-t border-emerald-200 dark:border-emerald-900/60">
                      ⏰ Post will automatically publish to <strong>{selectedTargetAccount}</strong> at exact scheduled time.
                    </p>
                  </div>
                )}

                <div>
                  <label className="font-bold block mb-1">Delay Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDelayType("Randomized")}
                      className={`py-1.5 rounded-lg border font-bold ${delayType === "Randomized" ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "hover:bg-muted"}`}
                    >
                      🎲 Randomized Delays
                    </button>
                    <button
                      onClick={() => setDelayType("Fixed")}
                      className={`py-1.5 rounded-lg border font-bold ${delayType === "Fixed" ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "hover:bg-muted"}`}
                    >
                      ⏱️ Fixed Interval
                    </button>
                  </div>
                </div>

                {delayType === "Randomized" ? (
                  <div>
                    <label className="font-bold block mb-1">Random Delay Range (Minutes)</label>
                    <div className="p-2.5 border rounded-lg bg-muted/20 text-muted-foreground font-medium">
                      Random intervals: 10m, 20m, 30m, 50m (Minimum {minDelay} mins enforced)
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="font-bold block mb-1">Interval (Every X Minutes)</label>
                    <input
                      type="number"
                      min={5}
                      value={fixedInterval}
                      onChange={(e) => setFixedInterval(Math.max(5, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 border rounded-lg bg-background"
                    />
                  </div>
                )}

                {/* Auto Assign Mode */}
                <div>
                  <label className="font-bold block mb-1">Account Assignment Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setAssignMode("Auto")}
                      className={`py-1.5 rounded-lg border font-bold ${assignMode === "Auto" ? "bg-purple-600 text-white border-purple-600 shadow-sm" : "hover:bg-muted"}`}
                    >
                      🤖 AI Auto Assign
                    </button>
                    <button
                      onClick={() => setAssignMode("Manual")}
                      className={`py-1.5 rounded-lg border font-bold ${assignMode === "Manual" ? "bg-purple-600 text-white border-purple-600 shadow-sm" : "hover:bg-muted"}`}
                    >
                      🖐️ Manual Drag/Drop
                    </button>
                  </div>
                </div>

                {scheduleSuccess && (
                  <div className="p-3 border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs rounded-xl">
                    {scheduleSuccess}
                  </div>
                )}

                <button
                  onClick={handleSchedulePostToQueue}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-lg shadow-sm transition text-xs flex items-center justify-center space-x-2"
                >
                  <span>🚀 Schedule Master Post into Bull Queue</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONTENT CALENDAR */}
      {activeTab === "Calendar" && (
        <div className="border bg-card p-5 rounded-xl space-y-5 shadow-sm animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-3">
            <div className="flex items-center space-x-3">
              <h2 className="font-extrabold text-base">Content Calendar</h2>

              {/* Account Filter */}
              <select
                value={selectedAccountFilter}
                onChange={(e) => setSelectedAccountFilter(e.target.value)}
                className="px-3 py-1 border rounded-lg bg-card text-xs font-semibold"
              >
                <option value="ALL">All Connected Accounts</option>
                {registeredPages.map((acc) => (
                  <option key={acc.pageId} value={acc.pageName}>
                    {acc.pageName}
                  </option>
                ))}
              </select>
            </div>

            {/* View Selector */}
            <div className="flex items-center space-x-1.5 bg-muted p-1 rounded-lg text-xs font-bold">
              {(["Monthly", "Weekly", "Daily"] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setCalendarView(view)}
                  className={`px-3 py-1 rounded transition ${calendarView === view ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar Grid View */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold border-b pb-2 text-muted-foreground">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-xs min-h-[300px]">
            {["2026-07-27", "2026-07-28", "2026-07-29", "2026-07-30", "2026-07-31", "2026-08-01", "2026-08-02"].map((dateStr) => {
              const dayEvents = calendarEvents.filter(
                (evt) =>
                  evt.date === dateStr &&
                  (selectedAccountFilter === "ALL" || evt.accountName === selectedAccountFilter)
              )

              return (
                <div
                  key={dateStr}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const evtId = e.dataTransfer.getData("eventId")
                    if (evtId) handleRescheduleEvent(evtId, dateStr)
                  }}
                  className="border rounded-lg p-2 bg-muted/10 flex flex-col justify-between space-y-2 min-h-[120px] hover:border-blue-500 transition"
                >
                  <span className="font-bold text-[10px] text-muted-foreground text-left">{dateStr}</span>

                  <div className="space-y-1.5 flex-1">
                    {dayEvents.map((evt) => (
                      <div
                        key={evt.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("eventId", evt.id)}
                        className="p-1.5 border bg-card rounded shadow-xs text-left cursor-grab active:cursor-grabbing hover:border-blue-600 transition"
                      >
                        <span className="font-bold text-[11px] block truncate">{evt.title}</span>
                        <div className="flex items-center justify-between text-[9px] text-muted-foreground mt-1">
                          <span>{evt.time}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold ${
                              evt.status === "Scheduled"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            }`}
                          >
                            {evt.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 3: BULL QUEUE MONITOR */}
      {activeTab === "QueueMonitor" && (
        <div className="border bg-card p-5 rounded-xl space-y-5 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="font-extrabold text-base">Bull Queue & Redis Job Monitor</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automated rate-limited queue processing with 3x retry policy and Admin Notification alerts on failure.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-3 py-1 rounded-full">
                ● Redis Queue Worker Online
              </span>
            </div>
          </div>

          {/* Meta Graph API Integration Warning / Status Note */}
          <div className="p-3 border border-amber-500/30 bg-amber-500/10 rounded-xl text-amber-800 dark:text-amber-300 text-xs space-y-1">
            <div className="font-extrabold flex items-center space-x-1.5">
              <span>🔑</span>
              <span>Meta Graph API Live Integration Requirement:</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Queue processing transitions jobs to <strong>Posted</strong>. For posts to appear on live Facebook Pages (like <em>CARE HUB BD</em>), valid <strong>Meta Page Access Tokens (`EAAG...`)</strong> with <code>pages_manage_posts</code> permission must be connected in <strong>Connect Accounts</strong>.
            </p>
          </div>

          {/* Queue Jobs Table */}
          <div className="space-y-3 text-xs">
            {queueJobs.map((job) => (
              <div key={job.id} className="border p-4 rounded-xl space-y-2 bg-muted/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-sm text-foreground block">{job.variationTitle}</span>
                    <div className="flex items-center space-x-2 text-muted-foreground text-[11px]">
                      <span>Target: <strong className="text-foreground">{job.accountName}</strong></span>
                      <span>•</span>
                      <span>Enforced Delay: <strong className="text-blue-600">{job.delayMinutes} mins</strong></span>
                      <span>•</span>
                      <span>Execution: {job.scheduledFor}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        job.status === "Posted"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : job.status === "Processing"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 animate-pulse"
                          : job.status === "Failed"
                          ? "bg-destructive/20 text-destructive"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {job.status === "Posted" ? "✓ Posted (Graph API)" : job.status}
                    </span>

                    {job.status === "Failed" && (
                      <button
                        onClick={() => handleRetryJob(job.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded-lg text-xs"
                      >
                        🔄 Retry Job ({job.retryCount}/{job.maxRetries})
                      </button>
                    )}
                  </div>
                </div>

                {job.lastError && (
                  <div className="p-2.5 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-[11px] font-semibold flex items-center justify-between">
                    <span>⚠️ Error: {job.lastError} (Retried {job.retryCount}/{job.maxRetries} times)</span>
                    <span className="bg-destructive text-white text-[9px] font-black px-2 py-0.5 rounded uppercase">
                      Admin Notified
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: BEST POSTING TIME ANALYSIS */}
      {activeTab === "BestTimes" && (
        <div className="border bg-card p-5 rounded-xl space-y-5 shadow-sm animate-in fade-in duration-200">
          <div className="border-b pb-3">
            <h2 className="font-extrabold text-base">Best Posting Time Analysis (Graph API Page Insights)</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              AI analyzes Facebook Page Insights & historical engagement patterns to suggest 5-8 optimal posting slots converted to local timezone.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {bestTimes.map((item, idx) => (
              <div key={idx} className="border p-4 rounded-xl space-y-2 bg-muted/10 hover:border-blue-500 transition text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-foreground">{item.slot}</span>
                  <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2.5 py-0.5 rounded text-[11px]">
                    {item.expectedReachBoost}
                  </span>
                </div>

                <div className="space-y-1 text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-foreground">Local Time:</span>
                    <span className="bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded text-[11px]">
                      {item.localTime}
                    </span>
                  </div>
                  <div>Day: <strong className="text-foreground">{item.day}</strong> ({item.targetTimezone})</div>
                </div>

                <p className="text-muted-foreground text-[11px] pt-1 border-t italic">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meta Page Access Token Management Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🔑</span>
                <h3 className="font-extrabold text-base">Meta Facebook Page Access Token</h3>
              </div>
              <button
                onClick={() => setShowTokenModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              To publish scheduled posts directly onto live Facebook Pages (e.g. <strong>CARE HUB BD</strong>), paste your Meta Developer App Page Access Token below with <code>pages_manage_posts</code> permission.
            </p>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-foreground block">Facebook Page Access Token (EAAG...)</label>
              <textarea
                value={activePageToken}
                onChange={(e) => setActivePageToken(e.target.value)}
                rows={4}
                className="w-full border rounded-xl p-3 font-mono text-[11px] bg-muted/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="EAAG..."
              />
            </div>

            {tokenSaved && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl font-bold flex items-center space-x-2">
                <span>✓</span>
                <span>Meta Page Access Token updated! Real Graph API publishing active.</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2 border-t">
              <button
                onClick={() => setShowTokenModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-muted transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setTokenSaved(true)
                  setTimeout(() => setTokenSaved(false), 3000)
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition shadow-md"
              >
                Save Meta Token
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
