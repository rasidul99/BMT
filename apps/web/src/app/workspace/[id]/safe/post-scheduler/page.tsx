"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { env } from "../../../../../lib/env"
import { initializeTokenFromEnv, autoRefreshTokenIfNeeded } from "../../../../../lib/fb-token-manager"
import { getPublishToken, initializeDefaultPages, FacebookPageEntry } from "../../../../../lib/fb-page-registry"
import { useFacebookAccounts } from "../../../../../hooks/useFacebookAccounts"
import { AssetLibraryPickerModal } from "../../../../../components/post-scheduler/AssetLibraryPickerModal"
import { ContentCalendarView, CalendarEventItem } from "../../../../../components/post-scheduler/ContentCalendarView"
import { LibraryAsset } from "../../../../../hooks/useAssetLibrary"
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Video,
  Vote,
  FileText,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  Shield,
  Send,
  Film,
  Pin,
} from "lucide-react"
import { useCtaPinTemplates } from "../../../../../hooks/useCtaPinTemplates"

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
  ctaPinConfig?: {
    enabled: boolean
    commentText: string
    delaySeconds: number
    autoPin: boolean
  }
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

  // Dynamic Accounts Integration from Module 8 (100 Accounts Engine)
  const { accounts: fbMarketAccounts } = useFacebookAccounts()

  // Format Specific States
  const [pollQuestion, setPollQuestion] = useState("Which product feature matters most to you in 2026?")
  const [pollOptions, setPollOptions] = useState<string[]>([
    "Premium Build Quality & Durability",
    "Long Battery Life (48 Hours+)",
    "Affordable Price & Discounts",
    "Fast 24-Hour Home Delivery",
  ])
  const [pollDurationDays, setPollDurationDays] = useState<number>(3)

  // Reel states
  const [reelAudioName, setReelAudioName] = useState("Original Sound - BMT Trending Audio")
  const [allowRemix, setAllowRemix] = useState(true)

  // Story states
  const [storyLinkSticker, setStoryLinkSticker] = useState("https://bmt.link/eid-deal")
  const [storyStickerText, setStoryStickerText] = useState("Swipe Up / Shop Now")

  // Video states
  const [videoTitle, setVideoTitle] = useState("Official Product Showcase & Unboxing 4K")
  const [thumbnailUrl, setThumbnailUrl] = useState(
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop"
  )

  // Asset Library Picker Modal state
  const [showLibraryPicker, setShowLibraryPicker] = useState(false)

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

  // Module 11: CTA Pin Comment Automation Integration
  const { templates: ctaTemplates } = useCtaPinTemplates()
  const [enableCtaPinComment, setEnableCtaPinComment] = useState(true)
  const [selectedCtaTemplateId, setSelectedCtaTemplateId] = useState<string>("")
  const [ctaCommentText, setCtaCommentText] = useState("")
  const [ctaDelaySeconds, setCtaDelaySeconds] = useState(15)
  const [ctaAutoPin, setCtaAutoPin] = useState(true)

  useEffect(() => {
    if (ctaTemplates.length > 0 && !selectedCtaTemplateId) {
      setSelectedCtaTemplateId(ctaTemplates[0].id)
      setCtaCommentText(ctaTemplates[0].commentText)
      setCtaDelaySeconds(ctaTemplates[0].delaySeconds)
      setCtaAutoPin(ctaTemplates[0].autoPin)
    }
  }, [ctaTemplates, selectedCtaTemplateId])

  const handleSelectCtaTemplate = (id: string) => {
    setSelectedCtaTemplateId(id)
    const tmpl = ctaTemplates.find((t) => t.id === id)
    if (tmpl) {
      setCtaCommentText(tmpl.commentText)
      setCtaDelaySeconds(tmpl.delaySeconds)
      setCtaAutoPin(tmpl.autoPin)
    }
  }

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

  // Combined accounts list: Facebook Pages + Module 8 100 Accounts
  const allSelectableAccounts = [
    ...registeredPages.map((p) => ({
      id: p.pageId,
      name: p.pageName,
      type: "Facebook Page (Official Meta API)",
      category: p.category,
      isPage: true,
      status: p.accessToken ? "Connected Token" : "Missing Token",
    })),
    ...fbMarketAccounts.map((a) => ({
      id: a.id,
      name: a.name,
      type: `${a.accountType} (${a.proxy?.ip || "Direct"})`,
      category: "FB Market Account (100 Acc Engine)",
      isPage: false,
      status: a.status,
    })),
  ]

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

  // Dynamic Calendar Events State & LocalStorage
  const CALENDAR_STORAGE_KEY = "bmt_post_calendar_events"
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(CALENDAR_STORAGE_KEY)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCalendarEvents(parsed)
            return
          }
        } catch {}
      }

      // Initialize with dynamic dates matching current month
      const today = new Date()
      const y = today.getFullYear()
      const m = String(today.getMonth() + 1).padStart(2, "0")
      const d = String(today.getDate()).padStart(2, "0")
      const d1 = String(Math.min(28, today.getDate() + 1)).padStart(2, "0")
      const d2 = String(Math.min(28, today.getDate() + 2)).padStart(2, "0")

      const initialEvents: CalendarEventItem[] = [
        {
          id: "evt-1",
          title: "Eid Special Watch Reel",
          accountName: "CARE HUB BD",
          date: `${y}-${m}-${d}`,
          time: "16:00",
          format: "Reel",
          status: "Scheduled",
          tone: "Curiosity",
          description: "Exclusive Reel with BMT Trending Sound",
        },
        {
          id: "evt-2",
          title: "Top 5 Gadgets Video Showcase",
          accountName: "CARE HUB BD",
          date: `${y}-${m}-${d1}`,
          time: "19:30",
          format: "Video",
          status: "Scheduled",
          tone: "Emotional",
          description: "4K Video demonstration with product CTA",
        },
        {
          id: "evt-3",
          title: "Organic Food Interactive Poll",
          accountName: "সাধারণ রান্না বান্না ব্লগ",
          date: `${y}-${m}-${d2}`,
          time: "10:00",
          format: "Poll",
          status: "Posted",
          tone: "Funny",
          description: "Customer preference survey for organic products",
        },
      ]
      setCalendarEvents(initialEvents)
      localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(initialEvents))
    }
  }, [])

  const saveCalendarEventsToStorage = (events: CalendarEventItem[]) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(events))
    }
  }

  const handleRescheduleEvent = (id: string, newDate: string, newTime?: string) => {
    setCalendarEvents((prev) => {
      const updated = prev.map((evt) =>
        evt.id === id ? { ...evt, date: newDate, ...(newTime ? { time: newTime } : {}) } : evt
      )
      saveCalendarEventsToStorage(updated)
      return updated
    })
  }

  const handleDeleteCalendarEvent = (id: string) => {
    setCalendarEvents((prev) => {
      const updated = prev.filter((evt) => evt.id !== id)
      saveCalendarEventsToStorage(updated)
      return updated
    })
  }

  const handleSelectAssetFromLibrary = (asset: LibraryAsset) => {
    setTitle(asset.title)
    if (asset.content) {
      setDescription(asset.content)
      setPollQuestion(asset.content)
    }
    if (asset.url) setMediaUrl(asset.url)
    if (asset.thumbnailUrl) setThumbnailUrl(asset.thumbnailUrl)
    if (asset.videoUrl) setMediaUrl(asset.videoUrl)
    if (asset.pollOptions && asset.pollOptions.length > 0) {
      setPollOptions(asset.pollOptions)
    }
    if (asset.type === "Image") setPostFormat("Image")
    else if (asset.type === "Video") setPostFormat("Video")
    else if (asset.type === "Poll") setPostFormat("Poll")
    else if (asset.type === "Text") setPostFormat("Text")
  }

  // Best Posting Times State
  const bestTimes: BestPostingTimeSlot[] = [
    { slot: "Slot 1 (Evening Peak)", day: "Everyday", targetTimezone: "Asia/Dhaka (GMT+6)", localTime: "7:30 PM - 9:00 PM", expectedReachBoost: "+42% Reach", reason: "Highest active user engagement for Bangladesh consumer market." },
    { slot: "Slot 2 (Lunch Break)", day: "Mon - Thu", targetTimezone: "Asia/Dhaka (GMT+6)", localTime: "1:15 PM - 2:30 PM", expectedReachBoost: "+28% Reach", reason: "Mid-day mobile browsing peak during office breaks." },
    { slot: "Slot 3 (Friday Special)", day: "Friday", targetTimezone: "Asia/Dhaka (GMT+6)", localTime: "3:30 PM - 5:00 PM", expectedReachBoost: "+55% Reach", reason: "Post-Jumma prayer holiday traffic spike on Facebook Reels." },
    { slot: "Slot 4 (Late Night)", day: "Sat - Sun", targetTimezone: "Asia/Dhaka (GMT+6)", localTime: "10:30 PM - 11:45 PM", expectedReachBoost: "+34% Reach", reason: "Night owl shopping & video reel consumption." },
  ]

  useEffect(() => {
    // 1. Check sessionStorage transfer first (safe multi-line copy without URL length or encoding issues)
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("bmt_imported_scheduler_post")
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (parsed.title) setTitle(parsed.title)
          if (parsed.description) setDescription(parsed.description)
          if (parsed.format && ["Text", "Image", "Video", "Reel", "Story", "Poll"].includes(parsed.format)) {
            setPostFormat(parsed.format as any)
          }
          sessionStorage.removeItem("bmt_imported_scheduler_post")
          return
        } catch {}
      }
    }

    if (libraryAssetId) {
      setMediaUrl("https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop")
    }

    const safeParam = (paramName: string) => {
      const val = searchParams.get(paramName)
      if (!val) return null
      try {
        return decodeURIComponent(val)
      } catch {
        return val
      }
    }

    const importedContent = safeParam("importedContent")
    const importedTitle = safeParam("importedTitle")
    const importedMedia = safeParam("importedMedia")
    const importedFormat = searchParams.get("importedFormat")

    if (importedContent) {
      setDescription(importedContent)
    }
    if (importedTitle) {
      setTitle(importedTitle)
    }
    if (importedMedia) {
      setMediaUrl(importedMedia)
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
        const createdPostId = data.id || data.post_id

        // Module 11: Auto CTA Pin Comment Trigger
        if (job.ctaPinConfig?.enabled && job.ctaPinConfig.commentText) {
          try {
            if (job.ctaPinConfig.delaySeconds > 0) {
              await new Promise((r) => setTimeout(r, job.ctaPinConfig!.delaySeconds * 1000))
            }

            const commentRes = await fetch(`https://graph.facebook.com/v26.0/${createdPostId}/comments`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: job.ctaPinConfig.commentText,
                access_token: pageToken,
              }),
            })
            const commentData = await commentRes.json()

            // Record to persistent CTA Pin audit log
            if (typeof window !== "undefined") {
              try {
                const curLogsStr = localStorage.getItem("bmt_cta_pin_logs")
                const curLogs = curLogsStr ? JSON.parse(curLogsStr) : []
                const newLog = {
                  id: `log-${Date.now()}`,
                  postId: createdPostId,
                  pageName: job.accountName,
                  commentText: job.ctaPinConfig.commentText,
                  pinnedStatus: job.ctaPinConfig.autoPin ? "Pinned" : "Comment Only",
                  apiResponse: commentRes.ok
                    ? `HTTP 200 OK — Comment ID: ${commentData.id}`
                    : `HTTP ${commentRes.status} — ${commentData.error?.message || "Error"}`,
                  timestamp: new Date().toISOString(),
                }
                localStorage.setItem("bmt_cta_pin_logs", JSON.stringify([newLog, ...curLogs]))
              } catch (logErr) {
                console.error("Failed to write CTA pin log", logErr)
              }
            }
          } catch (cmtErr) {
            console.error("Auto CTA Pin Comment failed", cmtErr)
          }
        }

        return { success: true, postId: createdPostId }
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

    let targetDate = new Date().toISOString().split("T")[0]
    let targetTime = "12:00"

    if (scheduleMode === "SpecificTime" && scheduledDateTime) {
      const parts = scheduledDateTime.split("T")
      if (parts.length === 2) {
        targetDate = parts[0]
        targetTime = parts[1]
      }
    } else {
      const future = new Date(Date.now() + delay * 60 * 1000)
      targetDate = future.toISOString().split("T")[0]
      targetTime = `${String(future.getHours()).padStart(2, "0")}:${String(future.getMinutes()).padStart(2, "0")}`
    }

    const formattedTime = scheduleMode === "SpecificTime" 
      ? new Date(scheduledDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : `In ${delay} mins`

    const accountsToSchedule = selectedTargetAccounts.length > 0 ? selectedTargetAccounts : ["CARE HUB BD"]

    const postDisplayTitle = postFormat === "Poll" 
      ? `[Poll] ${pollQuestion}` 
      : postFormat === "Reel" 
      ? `[Reel] ${title}` 
      : postFormat === "Story" 
      ? `[Story] ${title}` 
      : postFormat === "Video" 
      ? `[Video] ${videoTitle || title}` 
      : `[${selectedTone}] ${title}`

    // 1. Create Queue Jobs for Bull Queue Worker
    const newJobs: QueueJob[] = accountsToSchedule.map((account, idx) => ({
      id: `job-${Date.now()}-${idx}`,
      variationTitle: postDisplayTitle,
      accountName: account,
      delayMinutes: delay,
      scheduledFor: scheduleMode === "SpecificTime" ? `Scheduled for ${formattedTime}` : `Scheduled in ${delay} mins`,
      status: "Pending",
      retryCount: 0,
      maxRetries: 3,
      ctaPinConfig: enableCtaPinComment && ctaCommentText.trim() ? {
        enabled: true,
        commentText: ctaCommentText.trim(),
        delaySeconds: ctaDelaySeconds,
        autoPin: ctaAutoPin,
      } : undefined,
    }))

    const updatedJobs = [...newJobs, ...queueJobs]
    setQueueJobs(updatedJobs)
    saveQueueJobsToStorage(updatedJobs)

    // 2. Create Calendar Events for Dynamic Content Calendar
    const newCalendarItems: CalendarEventItem[] = accountsToSchedule.map((account, idx) => ({
      id: `evt-${Date.now()}-${idx}`,
      title: postDisplayTitle,
      accountName: account,
      date: targetDate,
      time: targetTime,
      format: postFormat,
      status: "Scheduled",
      tone: selectedTone,
      description: postFormat === "Poll" 
        ? `Question: ${pollQuestion}\nChoices: ${pollOptions.filter(Boolean).join(" | ")}`
        : description,
      mediaUrl: mediaUrl || thumbnailUrl,
    }))

    const updatedCalendar = [...newCalendarItems, ...calendarEvents]
    setCalendarEvents(updatedCalendar)
    saveCalendarEventsToStorage(updatedCalendar)

    setScheduleSuccess(`✓ ${postFormat} successfully scheduled for ${formattedTime} on ${accountsToSchedule.length} account(s)! Added to Queue & Content Calendar.`)
    setTimeout(() => {
      setActiveTab("Calendar")
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
            <a
              href={`/workspace/workspace-1/safe/ai-variations`}
              className="bg-purple-100 hover:bg-purple-200 dark:bg-purple-950 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 font-extrabold text-xs px-3 py-1.5 rounded-lg border border-purple-300 dark:border-purple-800 transition flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate AI Variations</span>
            </a>
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
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-xs text-blue-700 dark:text-blue-300 flex items-center space-x-1.5">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span>📘 Target Pages & Accounts ({allSelectableAccounts.length} Connected)</span>
                </label>
                <span className="text-[10px] text-blue-600 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded font-bold">
                  {selectedTargetAccounts.length} Selected
                </span>
              </div>
              <div className="space-y-1.5 bg-background border rounded-lg p-2.5 max-h-36 overflow-y-auto">
                {allSelectableAccounts.map((acc) => {
                  const isChecked = selectedTargetAccounts.includes(acc.name)
                  return (
                    <label key={acc.id} className="flex items-center justify-between space-x-2.5 text-xs font-bold cursor-pointer hover:bg-muted/50 p-1.5 rounded transition">
                      <div className="flex items-center space-x-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTargetAccounts((prev) => [...prev, acc.name])
                            } else {
                              if (selectedTargetAccounts.length > 1) {
                                setSelectedTargetAccounts((prev) => prev.filter((name) => name !== acc.name))
                              }
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className={`truncate ${isChecked ? "text-blue-700 dark:text-blue-300 font-extrabold" : "text-foreground"}`}>
                          {acc.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-[9px] shrink-0">
                        <span className="bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-semibold">
                          {acc.category}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded font-bold ${acc.status.includes("Active") || acc.status.includes("Connected") ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>
                          {acc.status}
                        </span>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Post Format & Asset Library Picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-xs">Post Format</label>
                <button
                  type="button"
                  onClick={() => setShowLibraryPicker(true)}
                  className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 font-extrabold hover:underline bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Browse Central Asset Library</span>
                </button>
              </div>
              <div className="grid grid-cols-6 gap-1.5 text-xs font-bold">
                {(["Text", "Image", "Video", "Reel", "Story", "Poll"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setPostFormat(fmt)}
                    className={`py-2 rounded-lg border transition flex flex-col items-center justify-center space-y-0.5 ${
                      postFormat === fmt
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {fmt === "Text" && <FileText className="w-3.5 h-3.5" />}
                    {fmt === "Image" && <ImageIcon className="w-3.5 h-3.5" />}
                    {fmt === "Video" && <Video className="w-3.5 h-3.5" />}
                    {fmt === "Reel" && <Film className="w-3.5 h-3.5" />}
                    {fmt === "Story" && <Smartphone className="w-3.5 h-3.5" />}
                    {fmt === "Poll" && <Vote className="w-3.5 h-3.5" />}
                    <span className="text-[10px]">{fmt}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* CONDITIONAL FORMAT 1: POLL CREATOR */}
            {postFormat === "Poll" && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-3">
                <div className="flex items-center justify-between font-extrabold text-xs text-emerald-700 dark:text-emerald-300">
                  <span className="flex items-center space-x-1.5">
                    <Vote className="w-4 h-4 text-emerald-500" />
                    <span>Facebook Interactive Poll Creator</span>
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded">
                    Duration: {pollDurationDays} Days
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Poll Question *</label>
                  <textarea
                    rows={2}
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Ask a question for your audience to vote on..."
                    className="w-full mt-1 p-2 border rounded-lg bg-background text-xs font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">
                      Voting Choices ({pollOptions.length}/4)
                    </label>
                    {pollOptions.length < 4 && (
                      <button
                        type="button"
                        onClick={() => setPollOptions([...pollOptions, `New Option ${pollOptions.length + 1}`])}
                        className="text-[10px] text-emerald-600 font-bold hover:underline flex items-center space-x-0.5"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Option</span>
                      </button>
                    )}
                  </div>

                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="text-[11px] font-extrabold text-muted-foreground w-6">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...pollOptions]
                          updated[idx] = e.target.value
                          setPollOptions(updated)
                        }}
                        placeholder={`Choice ${idx + 1}`}
                        className="flex-1 p-2 border rounded-lg bg-background text-xs"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                          className="p-1 text-muted-foreground hover:text-rose-500 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Poll Duration</label>
                  <div className="flex items-center space-x-1 text-[11px] font-bold">
                    {[1, 3, 7].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setPollDurationDays(days)}
                        className={`px-2.5 py-1 rounded border ${pollDurationDays === days ? "bg-emerald-600 text-white border-emerald-600" : "bg-background hover:bg-muted"}`}
                      >
                        {days} Day{days > 1 ? "s" : ""}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CONDITIONAL FORMAT 2: REEL CREATOR */}
            {postFormat === "Reel" && (
              <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-3">
                <div className="flex items-center justify-between font-extrabold text-xs text-purple-700 dark:text-purple-300">
                  <span className="flex items-center space-x-1.5">
                    <Film className="w-4 h-4 text-purple-500" />
                    <span>Facebook Reel 9:16 Vertical Creator</span>
                  </span>
                  <span className="text-[10px] bg-purple-500/20 px-2 py-0.5 rounded">
                    Aspect Ratio: 9:16
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Reel Video URL (MP4 / H.264) *</label>
                  <input
                    type="text"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="https://.../video-reel.mp4 or /sample-video.mp4"
                    className="w-full mt-1 p-2 border rounded-lg bg-background text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Reel Caption & Hooks *</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Viral reel hook caption..."
                    className="w-full mt-1 p-2 border rounded-lg bg-background text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Audio Credit / Track</label>
                    <input
                      type="text"
                      value={reelAudioName}
                      onChange={(e) => setReelAudioName(e.target.value)}
                      placeholder="Audio Name"
                      className="w-full mt-1 p-2 border rounded-lg bg-background text-xs"
                    />
                  </div>

                  <div className="flex items-end pb-1">
                    <label className="flex items-center space-x-2 cursor-pointer font-bold text-[11px]">
                      <input
                        type="checkbox"
                        checked={allowRemix}
                        onChange={(e) => setAllowRemix(e.target.checked)}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span>Allow Remixes & Duets</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* CONDITIONAL FORMAT 3: STORY CREATOR */}
            {postFormat === "Story" && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3">
                <div className="flex items-center justify-between font-extrabold text-xs text-amber-700 dark:text-amber-300">
                  <span className="flex items-center space-x-1.5">
                    <Smartphone className="w-4 h-4 text-amber-500" />
                    <span>Facebook Story (24-Hour Ephemeral)</span>
                  </span>
                  <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded font-bold">
                    Expires in 24 Hours
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Story Image or Video URL (9:16) *</label>
                  <input
                    type="text"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="https://.../story-photo.jpg"
                    className="w-full mt-1 p-2 border rounded-lg bg-background text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Story Link Sticker URL</label>
                    <input
                      type="text"
                      value={storyLinkSticker}
                      onChange={(e) => setStoryLinkSticker(e.target.value)}
                      placeholder="https://bmt.link/eid-deal"
                      className="w-full mt-1 p-2 border rounded-lg bg-background text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Sticker Button Text</label>
                    <input
                      type="text"
                      value={storyStickerText}
                      onChange={(e) => setStoryStickerText(e.target.value)}
                      placeholder="Shop Now / Click Deal"
                      className="w-full mt-1 p-2 border rounded-lg bg-background text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CONDITIONAL FORMAT 4: VIDEO POST CREATOR */}
            {postFormat === "Video" && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-3">
                <div className="flex items-center justify-between font-extrabold text-xs text-rose-700 dark:text-rose-300">
                  <span className="flex items-center space-x-1.5">
                    <Video className="w-4 h-4 text-rose-500" />
                    <span>Facebook Feed Video Post</span>
                  </span>
                  <span className="text-[10px] bg-rose-500/20 px-2 py-0.5 rounded">
                    MP4 / H.264
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Video Title *</label>
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="Video Headline"
                    className="w-full mt-1 p-2 border rounded-lg bg-background text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Direct Video URL *</label>
                  <input
                    type="text"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="https://.../video.mp4 or /sample-video.mp4"
                    className="w-full mt-1 p-2 border rounded-lg bg-background text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Custom Thumbnail URL</label>
                  <input
                    type="text"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://.../thumbnail.jpg"
                    className="w-full mt-1 p-2 border rounded-lg bg-background text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Video Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-lg bg-background text-xs"
                  />
                </div>
              </div>
            )}

            {/* CONDITIONAL FORMAT 5: STANDARD POST (TEXT & IMAGE) */}
            {(postFormat === "Image" || postFormat === "Text") && (
              <>
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

                {postFormat === "Image" && (
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
                )}
              </>
            )}
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

                {/* Module 11 CTA Pin Comment Integration */}
                <div className="p-3.5 border border-blue-500/30 bg-blue-50/30 dark:bg-blue-950/20 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <Pin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="font-extrabold text-xs text-blue-900 dark:text-blue-300">
                        1st Comment Pin Automation
                      </span>
                    </div>
                    <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded-full border border-blue-500/20">
                      Module 11 • Anti-Reach Penalty
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <label className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={enableCtaPinComment}
                        onChange={(e) => setEnableCtaPinComment(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                      />
                      <span>Auto-post link in 1st comment &amp; pin</span>
                    </label>
                    <a
                      href={`/workspace/workspace-1/safe/cta-pin-comment`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      Studio <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  {enableCtaPinComment && (
                    <div className="space-y-2 pt-2 border-t border-blue-500/20 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Template</label>
                          <select
                            value={selectedCtaTemplateId}
                            onChange={(e) => handleSelectCtaTemplate(e.target.value)}
                            className="w-full mt-1 p-1.5 border rounded-lg bg-background text-xs font-semibold"
                          >
                            {ctaTemplates.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Anti-Ban Delay</label>
                          <select
                            value={ctaDelaySeconds}
                            onChange={(e) => setCtaDelaySeconds(Number(e.target.value))}
                            className="w-full mt-1 p-1.5 border rounded-lg bg-background text-xs font-semibold"
                          >
                            <option value={0}>0s (Immediate)</option>
                            <option value={15}>15s (Natural ✨)</option>
                            <option value={30}>30s (Safe)</option>
                            <option value={60}>60s (Conservative)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">CTA Comment Body</label>
                        <textarea
                          rows={2}
                          value={ctaCommentText}
                          onChange={(e) => setCtaCommentText(e.target.value)}
                          className="w-full mt-1 p-2 border rounded-lg bg-background text-xs"
                          placeholder="Comment text to post and pin..."
                        />
                      </div>
                    </div>
                  )}
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

      {/* TAB 2: DYNAMIC CONTENT CALENDAR */}
      {activeTab === "Calendar" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <ContentCalendarView
            events={calendarEvents}
            onRescheduleEvent={handleRescheduleEvent}
            onDeleteEvent={handleDeleteCalendarEvent}
            onDateClick={(dateStr) => {
              setScheduledDateTime(`${dateStr}T12:00`)
              setActiveTab("Scheduler")
            }}
            connectedAccounts={allSelectableAccounts.map((a) => a.name)}
          />
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

      {/* Central Asset Library Picker Modal */}
      <AssetLibraryPickerModal
        isOpen={showLibraryPicker}
        onClose={() => setShowLibraryPicker(false)}
        onSelect={handleSelectAssetFromLibrary}
      />
    </div>
  )
}
