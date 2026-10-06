"use client"

import React, { useState, useEffect, useRef } from "react"
import { useSearchParams, useParams } from "next/navigation"
import { env } from "../../../../../lib/env"
import { initializeTokenFromEnv, autoRefreshTokenIfNeeded } from "../../../../../lib/fb-token-manager"
import { getPublishToken, initializeDefaultPages, FacebookPageEntry, updatePageToken } from "../../../../../lib/fb-page-registry"
import { useFacebookAccounts } from "../../../../../hooks/useFacebookAccounts"
import { AssetLibraryPickerModal } from "../../../../../components/post-scheduler/AssetLibraryPickerModal"
import { ContentCalendarView, CalendarEventItem } from "../../../../../components/post-scheduler/ContentCalendarView"
import { LibraryAsset, useAssetLibrary } from "../../../../../hooks/useAssetLibrary"
import { useClickableCards, ClickableCard } from "../../../../../hooks/useClickableCards"
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
  Key,
  Shuffle,
  RotateCcw,
  X,
  Check,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  Zap,
  Bot,
  Upload,
  HardDrive,
  Globe,
  FolderPlus,
  UploadCloud,
} from "lucide-react"
import { useCtaPinTemplates } from "../../../../../hooks/useCtaPinTemplates"

interface QueueJob {
  id: string
  variationTitle: string
  accountName: string
  delayMinutes: number
  scheduledFor: string
  status: "Pending" | "Processing" | "Posted" | "Failed"
  engine?: "bot" | "graph_api"
  retryCount: number
  maxRetries: number
  lastError?: string
  executeAtTimestamp?: number
  createdAtTimestamp?: number
  scheduleType?: "SpecificTime" | "Immediate"
  postFormat?: "Text" | "Image" | "Video" | "Reel" | "Story" | "Poll"
  description?: string
  mediaUrl?: string
  videoTitle?: string
  hashtags?: string
  cta?: string
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
  const params = useParams()
  const workspaceId = (params?.id as string) || "workspace-1"
  const searchParams = useSearchParams()
  const libraryAssetId = searchParams.get("libraryAssetId")
  const clickableCardId = searchParams.get("clickableCardId")

  const { getCard, isLoaded: isCardsLoaded } = useClickableCards(workspaceId)
  const { assets: libraryAssets } = useAssetLibrary()
  const [loadedCard, setLoadedCard] = useState<ClickableCard | null>(null)

  // Master Post Form State
  const [postFormat, setPostFormat] = useState<"Text" | "Image" | "Video" | "Reel" | "Story" | "Poll">("Image")
  const [title, setTitle] = useState("Eid Special Premium Watch Collection Offer 2026")
  const [description, setDescription] = useState(
    "ঈদ অফারে পাচ্ছেন প্রিমিয়াম ওয়াচ কালেকশনে ৪০% পর্যন্ত ছাড়! স্টক সীমিত। অর্ডার করতে এখনই নিচের লিংকে ভিসিট করুন।"
  )
  const [hashtags, setHashtags] = useState("#EidSale #FashionBD #WatchOffer #SpecialDiscount")
  const [emoji, setEmoji] = useState("")
  const [cta, setCta] = useState("Order Now: https://bmt.link/eid-watch-sale")
  const [mediaUrl, setMediaUrl] = useState(
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop"
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

  // Active Publishing Engine: Puppeteer Bot (Token-Free Automation) vs Meta Graph API
  const [publishEngine, setPublishEngine] = useState<"bot" | "graph_api">("bot")

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
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop"
  )

  // Local Media Upload State
  const [mediaSourceType, setMediaSourceType] = useState<"local" | "url">("local")
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{ name: string; size: string } | null>(null)
  const localFileInputRef = useRef<HTMLInputElement>(null)

  const handleLocalFileUpload = async (file: File) => {
    try {
      setIsUploadingMedia(true)
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (data.success && data.url) {
        setMediaUrl(data.url)
        setUploadedFileInfo({
          name: data.originalName || file.name,
          size: data.size || `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        })
      } else {
        alert("Upload failed: " + (data.error || "Unknown error"))
      }
    } catch (err: any) {
      console.error("Local file upload error:", err)
      alert("Error uploading file: " + err.message)
    } finally {
      setIsUploadingMedia(false)
    }
  }

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

  const handleReorderAccount = (index: number, direction: "up" | "down") => {
    const updated = [...selectedTargetAccounts]
    const targetIdx = direction === "up" ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= updated.length) return
    const temp = updated[index]
    updated[index] = updated[targetIdx]
    updated[targetIdx] = temp
    setSelectedTargetAccounts(updated)
  }

  // Module 11: CTA Pin Comment Automation Integration
  const { templates: ctaTemplates, addTemplate: addCtaTemplate } = useCtaPinTemplates()
  const [enableCtaPinComment, setEnableCtaPinComment] = useState(true)
  const [selectedCtaTemplateId, setSelectedCtaTemplateId] = useState<string>("")
  const [ctaCommentText, setCtaCommentText] = useState("")
  const [ctaDelaySeconds, setCtaDelaySeconds] = useState(15)
  const [ctaAutoPin, setCtaAutoPin] = useState(true)

  // Quick Template Modal State
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false)
  const [newTmplTitle, setNewTmplTitle] = useState("")
  const [newTmplLink, setNewTmplLink] = useState("")
  const [newTmplComment, setNewTmplComment] = useState("")
  const [newTmplDelay, setNewTmplDelay] = useState(15)

  useEffect(() => {
    if (ctaTemplates.length > 0 && !selectedCtaTemplateId) {
      setSelectedCtaTemplateId(ctaTemplates[0].id)
      setCtaCommentText(ctaTemplates[0].commentText)
      setCtaDelaySeconds(ctaTemplates[0].delaySeconds)
      setCtaAutoPin(ctaTemplates[0].autoPin)
    }
  }, [ctaTemplates, selectedCtaTemplateId])

  const handleSelectCtaTemplate = (id: string) => {
    if (id === "__NEW__") {
      setShowNewTemplateModal(true)
      return
    }
    setSelectedCtaTemplateId(id)
    const tmpl = ctaTemplates.find((t) => t.id === id)
    if (tmpl) {
      setCtaCommentText(tmpl.commentText)
      setCtaDelaySeconds(tmpl.delaySeconds)
      setCtaAutoPin(tmpl.autoPin)
    }
  }

  const handleCreateQuickTemplate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTmplTitle.trim() || !newTmplComment.trim()) return

    const created = addCtaTemplate({
      title: newTmplTitle.trim(),
      commentText: newTmplComment.trim(),
      linkUrl: newTmplLink.trim() || "https://bmt.link",
      assignedPage: selectedTargetAccounts[0] || "CARE HUB BD",
      autoPin: true,
      delaySeconds: newTmplDelay,
    })

    if (created) {
      setSelectedCtaTemplateId(created.id)
      setCtaCommentText(created.commentText)
      setCtaDelaySeconds(created.delaySeconds)
      setCtaAutoPin(created.autoPin)
    }

    setNewTmplTitle("")
    setNewTmplLink("")
    setNewTmplComment("")
    setShowNewTemplateModal(false)
  }

  // Synchronize Clickable Card when clickableCardId query param is present
  useEffect(() => {
    if (!clickableCardId) return

    let card = getCard(clickableCardId)
    if (!card && typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("bmt_clickable_cards")
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            card = parsed.find((c: ClickableCard) => c.id === clickableCardId)
          }
        }
      } catch {}
    }

    if (card) {
      setLoadedCard(card)
      setTitle(card.title || "")
      if (card.caption) {
        setDescription(card.caption)
      } else if (card.description) {
        setDescription(card.description)
      }
      if (card.imageUrl) {
        setMediaUrl(card.imageUrl)
      }
      setPostFormat("Image")
      const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/c/${card.id}` : `/c/${card.id}`
      setCta(`Special Link: ${shareUrl}`)
      setCtaCommentText(`👉 অফারটি পেতে সরাসরি এই লিংকে ক্লিক করুন: ${shareUrl}`)
    } else {
      // Fallback: fetch from /api/cards
      fetch("/api/cards")
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && Array.isArray(data.cards)) {
            const found = data.cards.find((c: ClickableCard) => c.id === clickableCardId)
            if (found) {
              setLoadedCard(found)
              setTitle(found.title || "")
              if (found.caption) {
                setDescription(found.caption)
              } else if (found.description) {
                setDescription(found.description)
              }
              if (found.imageUrl) {
                setMediaUrl(found.imageUrl)
              }
              setPostFormat("Image")
              const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/c/${found.id}` : `/c/${found.id}`
              setCta(`Special Link: ${shareUrl}`)
              setCtaCommentText(`👉 অফারটি পেতে সরাসরি এই লিংকে ক্লিক করুন: ${shareUrl}`)
            }
          }
        })
        .catch(() => {})
    }
  }, [clickableCardId, isCardsLoaded])

  // Synchronize Asset Library when libraryAssetId query param is present
  useEffect(() => {
    if (!libraryAssetId || clickableCardId) return
    const asset = libraryAssets.find((a) => a.id === libraryAssetId)
    if (asset) {
      setTitle(asset.title || "")
      if (asset.url) setMediaUrl(asset.url)
      if (asset.type === "Video") {
        setPostFormat("Video")
        setVideoTitle(asset.title)
      } else if (asset.type === "Image") {
        setPostFormat("Image")
      }
    }
  }, [libraryAssetId, libraryAssets, clickableCardId])

  useEffect(() => {
    if (typeof window !== "undefined") {
      let pages = initializeDefaultPages(defaultPageEntries)

      // 1. Sync connected client pages from localStorage ("bmt_connected_pages")
      try {
        const connectedJson = localStorage.getItem("bmt_connected_pages")
        if (connectedJson) {
          const parsed = JSON.parse(connectedJson)
          if (Array.isArray(parsed) && parsed.length > 0) {
            const mappedDynamic: FacebookPageEntry[] = parsed.map((item: any) => ({
              pageId: String(item.pageId || item.id),
              pageName: String(item.name || item.pageName),
              accessToken: item.accessToken || item.token || (item.name === "CARE HUB BD" ? (env.NEXT_PUBLIC_FB_PAGE_TOKEN_CARE_HUB_BD || "") : ""),
              tokenExpiry: Date.now() + 60 * 24 * 60 * 60 * 1000,
              category: item.category || "General Business",
              isActive: true,
            }))

            // Merge dynamic pages at the beginning of the list, avoiding duplicates by pageName
            const seen = new Set<string>()
            const combined: FacebookPageEntry[] = []

            for (const dp of mappedDynamic) {
              const key = dp.pageName.toLowerCase().trim()
              if (!seen.has(key)) {
                seen.add(key)
                combined.push(dp)
              }
            }

            for (const sp of pages) {
              const key = sp.pageName.toLowerCase().trim()
              if (!seen.has(key)) {
                seen.add(key)
                combined.push(sp)
              }
            }

            pages = combined
          }
        }
      } catch (err) {
        console.error("Error reading bmt_connected_pages in scheduler:", err)
      }

      setRegisteredPages(pages)

      // 2. Auto-select targeted page from URL query params (e.g. ?targetPage=Test%20Next or ?pageId=61595136714776)
      const targetParam = searchParams.get("targetPage") || searchParams.get("pageName") || searchParams.get("pageId")
      if (targetParam) {
        const found = pages.find(
          (p) =>
            p.pageName.toLowerCase().trim() === targetParam.toLowerCase().trim() ||
            p.pageId === targetParam
        )
        if (found) {
          setSelectedTargetAccounts([found.pageName])
        } else {
          setSelectedTargetAccounts([targetParam])
        }
      }

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
  }, [searchParams])

  // Combined accounts list: Facebook Pages + Module 8 100 Accounts
  const allSelectableAccounts = [
    ...registeredPages.map((p) => {
      const hasToken = Boolean(
        p.accessToken ||
        (p.pageName === "CARE HUB BD" && (env.NEXT_PUBLIC_FB_PAGE_TOKEN_CARE_HUB_BD || process.env.NEXT_PUBLIC_FB_PAGE_TOKEN_CARE_HUB_BD))
      )
      return {
        id: p.pageId,
        name: p.pageName,
        type: "Facebook Page (Official Meta API)",
        category: p.category,
        isPage: true,
        status: hasToken ? "Connected Token" : "Active (Token Linked)",
      }
    }),
    ...fbMarketAccounts.map((a) => ({
      id: a.id,
      name: a.name,
      type: `${a.accountType} (${a.proxy?.ip || "Direct"})`,
      category: "FB Market Account (100 Acc Engine)",
      isPage: false,
      status: a.status,
    })),
  ]

  // Real-time second ticker for Bull Queue progress bar & decreasing countdown
  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTimestamp(Date.now())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Helper to compute live progress percentage and decreasing countdown timer
  const getJobProgressData = (job: QueueJob, now: number) => {
    if (job.status === "Posted") {
      return {
        progressPercent: 100,
        remainingText: "Published to Meta Facebook",
        formattedCountdown: "00m:00s",
        statusText: "Completed (100%)",
        isDue: true,
        secondsLeft: 0,
      }
    }

    if (job.status === "Processing") {
      return {
        progressPercent: 92,
        remainingText: "Uploading to Meta Graph API...",
        formattedCountdown: "Live Upload",
        statusText: "Processing",
        isDue: true,
        secondsLeft: 0,
      }
    }

    if (job.status === "Failed") {
      return {
        progressPercent: 0,
        remainingText: "Execution Failed • Check Error Below",
        formattedCountdown: "Failed",
        statusText: "Failed",
        isDue: true,
        secondsLeft: 0,
      }
    }

    // Pending status
    const executeAt = job.executeAtTimestamp || (now + Math.max(1, job.delayMinutes || 5) * 60 * 1000)
    const createdAt = job.createdAtTimestamp || (executeAt - Math.max(1, job.delayMinutes || 5) * 60 * 1000)
    const totalDuration = Math.max(1000, executeAt - createdAt)
    const remainingMs = Math.max(0, executeAt - now)
    const elapsedMs = Math.max(0, totalDuration - remainingMs)
    const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalDuration) * 100)))

    const totalSec = Math.floor(remainingMs / 1000)
    const hrs = Math.floor(totalSec / 3600)
    const mins = Math.floor((totalSec % 3600) / 60)
    const secs = totalSec % 60

    let formattedCountdown = ""
    if (hrs > 0) {
      formattedCountdown = `${hrs}h ${String(mins).padStart(2, "0")}m:${String(secs).padStart(2, "0")}s`
    } else {
      formattedCountdown = `${String(mins).padStart(2, "0")}m:${String(secs).padStart(2, "0")}s`
    }

    return {
      progressPercent,
      remainingText: remainingMs === 0 ? "Due Now • Ready for Worker" : `${formattedCountdown} remaining`,
      formattedCountdown,
      statusText: remainingMs === 0 ? "Due Now" : `Pending (${progressPercent}%)`,
      isDue: remainingMs === 0,
      secondsLeft: totalSec,
    }
  }

  // Default Queue Jobs State - Empty by default so dummy demo accounts don't pollute user queue
  const defaultQueueJobs: QueueJob[] = []

  const [queueJobs, setQueueJobs] = useState<QueueJob[]>(defaultQueueJobs)

  const saveQueueJobsToStorage = (jobs: QueueJob[]) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("bmt_queue_jobs", JSON.stringify(jobs))
    }
  }

  // Load queueJobs from localStorage on mount & normalize timestamps
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bmt_queue_jobs")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) {
            // Filter out old dummy demo jobs so they don't pollute the user's active queue
            const realJobs = parsed.filter(
              (j: any) =>
                !["job-101", "job-102", "job-103"].includes(j.id) &&
                j.accountName !== "Fashion Hub Official" &&
                j.accountName !== "Tech Gadgets BD" &&
                j.accountName !== "Organic Superstore"
            )
            const normalized = realJobs.map((j: any) => ({
              ...j,
              // If stuck in "Processing" from an interrupted reload, reset to "Pending"
              status: j.status === "Processing" ? ("Pending" as const) : j.status,
              createdAtTimestamp:
                j.createdAtTimestamp ||
                (j.executeAtTimestamp
                  ? j.executeAtTimestamp - Math.max(1, j.delayMinutes || 5) * 60 * 1000
                  : Date.now() - 60000),
              executeAtTimestamp:
                j.executeAtTimestamp ||
                (j.status === "Pending"
                  ? Date.now() + Math.max(1, j.delayMinutes || 5) * 60 * 1000
                  : Date.now()),
            }))
            setQueueJobs(normalized)
            localStorage.setItem("bmt_queue_jobs", JSON.stringify(normalized))
            return
          }
        } catch {}
      }
      setQueueJobs([])
      localStorage.setItem("bmt_queue_jobs", JSON.stringify([]))
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
    setVideoTitle(asset.title)
    if (asset.content) {
      setDescription(asset.content)
      setPollQuestion(asset.content)
    }
    const finalVideoUrl = asset.videoUrl || (asset.type === "Video" ? asset.url : "") || ""
    if (finalVideoUrl) setMediaUrl(finalVideoUrl)
    else if (asset.url) setMediaUrl(asset.url)

    if (asset.thumbnailUrl) {
      setThumbnailUrl(asset.thumbnailUrl)
    } else if (asset.type === "Video" && asset.url && !asset.url.endsWith(".mp4")) {
      setThumbnailUrl(asset.url)
    }

    if (asset.pollOptions && asset.pollOptions.length > 0) {
      setPollOptions(asset.pollOptions)
    }
    if (asset.type === "Image") setPostFormat("Image")
    else if (asset.type === "Video") setPostFormat("Video")
    else if (asset.type === "Poll") setPostFormat("Poll")
    else if (asset.type === "Text") setPostFormat("Text")
    setShowLibraryPicker(false)
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

    const resolveFormat = (fmt?: string | null): "Text" | "Image" | "Video" | "Reel" | "Story" | "Poll" => {
      if (!fmt) return "Image"
      if (fmt === "Post" || fmt === "Group Share") return "Text"
      if (["Text", "Image", "Video", "Reel", "Story", "Poll"].includes(fmt)) return fmt as any
      return "Image"
    }

    if (importedContent) {
      setDescription(importedContent)
    }
    if (importedTitle) {
      setTitle(importedTitle)
    }
    if (importedMedia) {
      setMediaUrl(importedMedia)
    }
    if (importedFormat) {
      const resolved = resolveFormat(importedFormat)
      setPostFormat(resolved)

      if (resolved === "Poll" && importedContent) {
        const optionLines = importedContent.split("\n").filter((l) => l.trim().startsWith("#"))
        if (optionLines.length >= 2) {
          const parsedOpts = optionLines
            .map((l) => l.replace(/^#\d+\s+(?:Option\s+[A-D]:\s+|অপশন\s+[A-D]:\s+)?/i, "").trim())
            .filter(Boolean)
          if (parsedOpts.length >= 2) {
            setPollOptions(parsedOpts.slice(0, 4))
          }
        }
      }
    }

    // Also check sessionStorage fallback from AI Variations
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("bmt_imported_scheduler_post")
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (parsed.description) {
            setDescription(parsed.description)
          }
          if (parsed.title) {
            setTitle(parsed.title)
          }
          if (parsed.format) {
            const resolved = resolveFormat(parsed.format)
            setPostFormat(resolved)

            if (resolved === "Poll" && parsed.description) {
              const optionLines = parsed.description.split("\n").filter((l: string) => l.trim().startsWith("#"))
              if (optionLines.length >= 2) {
                const parsedOpts = optionLines
                  .map((l: string) => l.replace(/^#\d+\s+(?:Option\s+[A-D]:\s+|অপশন\s+[A-D]:\s+)?/i, "").trim())
                  .filter(Boolean)
                if (parsedOpts.length >= 2) {
                  setPollOptions(parsedOpts.slice(0, 4))
                }
              }
            }
          }
          if (parsed.mediaUrl) {
            setMediaUrl(parsed.mediaUrl)
          }
          sessionStorage.removeItem("bmt_imported_scheduler_post")
        } catch {}
      }
    }
  }, [libraryAssetId, searchParams])

  // Dynamic Multi-Engine Publisher: Puppeteer Headless Browser Bot or Meta Graph API
  const publishToFacebookPage = async (job: QueueJob): Promise<{ success: boolean; postId?: string; error?: string }> => {
    try {
      // Lookup target page credentials dynamically
      let pageId = job.accountName === "CARE HUB BD" ? (env.NEXT_PUBLIC_FB_PAGE_ID_CARE_HUB_BD || "892168940637389") : ""
      let pageToken = job.accountName === "CARE HUB BD" ? (env.NEXT_PUBLIC_FB_PAGE_TOKEN_CARE_HUB_BD || "") : ""

      const registeredLookup = getPublishToken(job.accountName)
      if (registeredLookup && registeredLookup.accessToken) {
        pageId = registeredLookup.pageId
        pageToken = registeredLookup.accessToken
      } else {
        let pagesList = registeredPages
        if (pagesList.length === 0 && typeof window !== "undefined") {
          try {
            const raw = localStorage.getItem("bmt_connected_pages")
            if (raw) pagesList = JSON.parse(raw)
          } catch {}
        }
        const found = pagesList.find((p) => p.pageName.toLowerCase().trim() === job.accountName.toLowerCase().trim())
        if (found) {
          pageId = found.pageId
          pageToken = found.accessToken || (job.accountName === "CARE HUB BD" ? (env.NEXT_PUBLIC_FB_PAGE_TOKEN_CARE_HUB_BD || "") : "")
        }
      }

      const actualDesc = job.description !== undefined ? job.description : description
      const actualFormat = job.postFormat || postFormat
      let actualMedia = job.mediaUrl !== undefined ? job.mediaUrl : mediaUrl
      if (actualFormat === "Text" || actualFormat === "Poll") {
        actualMedia = ""
      } else if (actualFormat === "Video" || actualFormat === "Reel") {
        if (!actualMedia || !actualMedia.match(/\.(mp4|mov|webm)/i)) {
          actualMedia = "/sample-video.mp4"
        }
      }

      let message = ""
      if (actualFormat === "Poll") {
        const questionText = (job.variationTitle || "").replace(/^\[.*?\]\s*/i, "").trim() || pollQuestion
        const optionsList = (pollOptions || []).filter(Boolean).map((opt, idx) => `${idx + 1}️⃣ ${opt}`).join("\n")
        message = `📊 [মতামত পোল / ভোট]\n${questionText}\n\n${optionsList}\n\n👉 আপনার পছন্দের অপশনটি কমেন্টে লিখে জানান বা ভোট দিন!\n\n${job.hashtags || hashtags || ""}`.trim()
      } else {
        const cleanTitle = (job.variationTitle || "").replace(/^\[.*?\]\s*/i, "").trim()
        const titlePart = cleanTitle ? `${cleanTitle}\n\n` : ""
        message = `${titlePart}${actualDesc}\n\n${job.hashtags || hashtags || ""}\n${job.cta || cta || ""}`.trim()
      }

      // =========================================================================
      // ENGINE 1: PUPPETEER BOT (DEFAULT - 100% TOKEN FREE BROWSER AUTOMATION)
      // Active for all accounts & pages when publishEngine === "bot" or token is missing
      // =========================================================================
      if (publishEngineRef.current === "bot" || !pageToken || !pageToken.startsWith("EAAG")) {
        try {
          const targetId = pageId || job.accountName
          const targetUrl = `https://www.facebook.com/${targetId}`

          const botRes = await fetch("/api/facebook-bot/launch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accountName: job.accountName,
              targetPage: targetId,
              targetPageName: job.accountName,
              targetUrl,
              postMessage: message,
              mediaUrl: actualMedia,
              delaySeconds: 15,
              headless: false, // Visible Chrome browser window so the user sees the bot working!
            }),
          })

          const botData = await botRes.json()
          if (botData.success) {
            return {
              success: true,
              postId: `bot-${botData.jobId}`,
              engine: "bot" as const,
            }
          } else {
            return {
              success: false,
              error: botData.error || "Puppeteer Bot failed to launch",
            }
          }
        } catch (botErr: any) {
          return {
            success: false,
            error: `Puppeteer Bot execution error: ${botErr.message}`,
          }
        }
      }

      // =========================================================================
      // ENGINE 2: OFFICIAL META GRAPH API (When token is available and selected)
      // =========================================================================
      if (!pageToken) {
        return {
          success: false,
          error: `Missing Meta Page Access Token (EAAG...) for '${job.accountName}'. Please connect with Page Token in Connect Accounts or switch to Puppeteer Bot Mode.`,
        }
      }

      let endpoint = `https://graph.facebook.com/v20.0/${pageId}/feed`
      let response: Response

      if (actualFormat === "Video" && actualMedia) {
        endpoint = `https://graph.facebook.com/v20.0/${pageId}/videos`
        try {
          const fd = new FormData()
          if (actualMedia.startsWith("/")) {
            const fileBlob = await fetch(actualMedia).then((r) => r.blob())
            fd.append("source", fileBlob, "video.mp4")
          } else {
            fd.append("file_url", actualMedia)
          }
          fd.append("title", job.videoTitle || job.variationTitle)
          fd.append("description", message)
          fd.append("access_token", pageToken)
          response = await fetch(endpoint, { method: "POST", body: fd })
        } catch {
          response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file_url: actualMedia,
              title: job.videoTitle || job.variationTitle,
              description: message,
              access_token: pageToken,
            }),
          })
        }
      } else if (actualFormat === "Image" && actualMedia) {
        endpoint = `https://graph.facebook.com/v20.0/${pageId}/photos`
        try {
          const fd = new FormData()
          if (actualMedia.startsWith("/")) {
            const fileBlob = await fetch(actualMedia).then((r) => r.blob())
            fd.append("source", fileBlob, "image.jpg")
          } else {
            fd.append("url", actualMedia)
          }
          fd.append("caption", message)
          fd.append("access_token", pageToken)
          response = await fetch(endpoint, { method: "POST", body: fd })
        } catch {
          response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: actualMedia, caption: message, access_token: pageToken }),
          })
        }
      } else {
        try {
          const fd = new FormData()
          fd.append("message", message)
          fd.append("access_token", pageToken)
          response = await fetch(endpoint, { method: "POST", body: fd })
        } catch {
          response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message, access_token: pageToken }),
          })
        }
      }

      const data = await response.json()

      if (data.id || data.post_id) {
        const createdPostId = data.id || data.post_id

        // Module 11: Auto CTA Pin Comment Trigger
        if (job.ctaPinConfig?.enabled && job.ctaPinConfig.commentText) {
          try {
            if (job.ctaPinConfig.delaySeconds > 0) {
              await new Promise((r) => setTimeout(r, job.ctaPinConfig!.delaySeconds * 1000))
            }

            const commentRes = await fetch(`https://graph.facebook.com/v20.0/${createdPostId}/comments`, {
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

        return { success: true, postId: createdPostId, engine: "graph_api" as const }
      } else {
        return { success: false, error: data.error?.message || "Unknown Graph API error" }
      }
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" }
    }
  }

  // Synchronous refs to prevent stale closure race conditions in async queue timers
  const isExecutingRef = useRef(false)
  const queueJobsRef = useRef(queueJobs)
  queueJobsRef.current = queueJobs
  const publishEngineRef = useRef(publishEngine)
  publishEngineRef.current = publishEngine

  // Queue Processing Worker - ONLY processes jobs when their scheduled execution time arrives!
  useEffect(() => {
    const timer = setInterval(async () => {
      if (isExecutingRef.current) return

      const now = Date.now()
      const currentJobs = queueJobsRef.current

      // 1. Self-healing: If any job is marked "Processing" but isExecutingRef is false,
      // it means an interrupted process or race condition left it stuck. Reset it immediately!
      const stuckJob = currentJobs.find((j) => j.status === "Processing")
      if (stuckJob) {
        console.warn(`[Queue Worker] Auto-healing stuck job "${stuckJob.id}". Resetting to Pending for immediate dispatch.`)
        setQueueJobs((prev) => {
          const healed = prev.map((j) =>
            j.id === stuckJob.id ? { ...j, status: "Pending" as const, executeAtTimestamp: now } : j
          )
          saveQueueJobsToStorage(healed)
          return healed
        })
        return
      }

      // 2. Find pending job that is strictly due for execution
      const dueJob = currentJobs.find(
        (j) => j.status === "Pending" && (j.executeAtTimestamp ? now >= j.executeAtTimestamp : false)
      )
      if (!dueJob) return

      // 3. Acquire mutex lock and set status to Processing
      isExecutingRef.current = true
      setQueueJobs((prev) => {
        const updated = prev.map((j) =>
          j.id === dueJob.id ? { ...j, status: "Processing" as const } : j
        )
        saveQueueJobsToStorage(updated)
        return updated
      })

      try {
        const result = await publishToFacebookPage(dueJob)
        setQueueJobs((prev) => {
          const final = prev.map((j) => {
            if (j.id === dueJob.id) {
              if (result.success) {
                return {
                  ...j,
                  status: "Posted" as const,
                  engine: (result as any).engine || "bot",
                  lastError: undefined,
                }
              } else {
                const newRetry = j.retryCount + 1
                if (newRetry >= j.maxRetries) {
                  return { ...j, status: "Failed" as const, retryCount: newRetry, lastError: result.error }
                }
                return {
                  ...j,
                  status: "Pending" as const,
                  retryCount: newRetry,
                  executeAtTimestamp: Date.now() + 2 * 60 * 1000, // 2-minute backoff delay before retry
                  lastError: result.error,
                }
              }
            }
            return j
          })
          saveQueueJobsToStorage(final)
          return final
        })
      } catch (execErr: any) {
        console.error("Queue execution error:", execErr)
        setQueueJobs((prev) => {
          const final = prev.map((j) =>
            j.id === dueJob.id
              ? {
                  ...j,
                  status: "Pending" as const,
                  retryCount: j.retryCount + 1,
                  executeAtTimestamp: Date.now() + 2 * 60 * 1000,
                  lastError: execErr.message || "Queue execution exception",
                }
              : j
          )
          saveQueueJobsToStorage(final)
          return final
        })
      } finally {
        isExecutingRef.current = false
      }
    }, 2500)

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
      ? (videoTitle || title) 
      : title

    const executeAtTimestamp = scheduleMode === "SpecificTime" && scheduledDateTime
      ? new Date(scheduledDateTime).getTime()
      : Date.now() + (delay * 60 * 1000)

    // 1. Create Queue Jobs for Bull Queue Worker
    const newJobs: QueueJob[] = accountsToSchedule.map((account, idx) => {
      const accountExecutionTime = scheduleMode === "SpecificTime"
        ? executeAtTimestamp + (idx * 5 * 60 * 1000)
        : Date.now() + ((idx + 1) * delay * 60 * 1000)

      return {
        id: `job-${Date.now()}-${idx}`,
        variationTitle: postDisplayTitle,
        accountName: account,
        delayMinutes: scheduleMode === "SpecificTime" ? 0 : delay * (idx + 1),
        scheduledFor: scheduleMode === "SpecificTime" ? `Scheduled for ${formattedTime}` : `Scheduled in ${delay * (idx + 1)} mins`,
        status: "Pending",
        retryCount: 0,
        maxRetries: 3,
        createdAtTimestamp: Date.now(),
        executeAtTimestamp: accountExecutionTime,
        scheduleType: scheduleMode,
        postFormat,
        description: postFormat === "Poll"
          ? `Question: ${pollQuestion}\nChoices: ${pollOptions.filter(Boolean).join(" | ")}`
          : description,
        mediaUrl: postFormat === "Text" || postFormat === "Poll"
          ? ""
          : (postFormat === "Video" || postFormat === "Reel")
          ? (mediaUrl && mediaUrl.match(/\.(mp4|mov|webm)/i) ? mediaUrl : "/sample-video.mp4")
          : mediaUrl,
        videoTitle,
        hashtags,
        cta,
        ctaPinConfig: enableCtaPinComment && ctaCommentText.trim() ? {
          enabled: true,
          commentText: ctaCommentText.trim(),
          delaySeconds: ctaDelaySeconds,
          autoPin: ctaAutoPin,
        } : undefined,
      }
    })

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

    setScheduleSuccess(`${postFormat} successfully scheduled for ${formattedTime} on ${accountsToSchedule.length} account(s)! Added to Queue & Content Calendar.`)
    setTimeout(() => {
      setActiveTab("Calendar")
    }, 1200)
  }

  const [runningJobId, setRunningJobId] = useState<string | null>(null)

  // Handle Force Run Job Immediately (Bypasses schedule time and stuck status)
  const handleForceRunJob = async (id: string) => {
    const targetJob = queueJobsRef.current.find((j) => j.id === id) || queueJobs.find((j) => j.id === id)
    if (!targetJob) return

    setRunningJobId(id)
    showToast("🚀 ফেসবুকে পোস্টিং রোবট সক্রিয় হচ্ছে...")
    isExecutingRef.current = true

    setQueueJobs((prev) => {
      const updated = prev.map((j) => (j.id === id ? { ...j, status: "Processing" as const, lastError: undefined } : j))
      saveQueueJobsToStorage(updated)
      return updated
    })

    try {
      const res = await publishToFacebookPage(targetJob)
      setQueueJobs((prev) => {
        const final = prev.map((j) => {
          if (j.id === id) {
            if (res.success) {
              return { ...j, status: "Posted" as const, engine: (res as any).engine || "bot", lastError: undefined }
            } else {
              return { ...j, status: "Failed" as const, retryCount: j.retryCount + 1, lastError: res.error }
            }
          }
          return j
        })
        saveQueueJobsToStorage(final)
        return final
      })
      if (res.success) {
        showToast("✅ ফেসবুকে সফলভাবে পোস্ট পাবলিশ হয়েছে!")
      } else {
        showToast(`⚠️ Publishing error: ${res.error || "Failed"}`)
      }
    } catch (e: any) {
      showToast(`⚠️ Exception: ${e.message}`)
    } finally {
      isExecutingRef.current = false
      setRunningJobId(null)
    }
  }

  // Handle Reset Stuck Processing Job back to Pending
  const handleResetJobToPending = (id: string) => {
    isExecutingRef.current = false
    setRunningJobId(null)
    // Delay 3 minutes so it doesn't immediately re-trigger in an unwanted loop, giving the user full control
    const futureTime = Date.now() + 3 * 60 * 1000
    setQueueJobs((prev) => {
      const updated = prev.map((j) =>
        j.id === id
          ? {
              ...j,
              status: "Pending" as const,
              executeAtTimestamp: futureTime,
              scheduledFor: "Scheduled in 3 mins",
              lastError: undefined,
            }
          : j
      )
      saveQueueJobsToStorage(updated)
      return updated
    })
    showToast("🔄 জব রিসেট করা হয়েছে (Pending)। আপনি চাইলে 'Force Run' এ ক্লিক করে এখনই পোস্ট করতে পারেন।")
  }

  // Handle Retry Failed Job
  const handleRetryJob = (id: string) => {
    handleForceRunJob(id)
  }

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur))
    }, 3000)
  }

  // Clear Confirmation Modal State
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false)

  // Handle Delete Single Queue Job
  const handleDeleteQueueJob = (id: string) => {
    const updated = queueJobs.filter(j => j.id !== id)
    setQueueJobs(updated)
    saveQueueJobsToStorage(updated)
    showToast("Job removed from queue")
  }

  // Handle Clear All Queue Jobs Confirmation
  const handleConfirmClearAll = () => {
    setQueueJobs([])
    saveQueueJobsToStorage([])
    setShowClearConfirmModal(false)
    showToast("All queue jobs cleared successfully")
  }

  // Token Manager Modal State
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [activePageToken, setActivePageToken] = useState("")
  const [tokenSaved, setTokenSaved] = useState(false)
  const [tokenTesting, setTokenTesting] = useState(false)
  const [tokenTestResult, setTokenTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Initialize activePageToken from registeredPages on mount or when pages update
  useEffect(() => {
    const careHubPage = registeredPages.find((p) => p.pageName === "CARE HUB BD")
    if (careHubPage && careHubPage.accessToken) {
      setActivePageToken(careHubPage.accessToken)
    } else if (env.NEXT_PUBLIC_FB_PAGE_TOKEN_CARE_HUB_BD) {
      setActivePageToken(env.NEXT_PUBLIC_FB_PAGE_TOKEN_CARE_HUB_BD)
    }
  }, [registeredPages])

  const handleTestToken = async () => {
    const trimmed = activePageToken.trim()
    if (!trimmed || trimmed.startsWith("EAAG...")) {
      setTokenTestResult({ success: false, message: "Please enter a valid Facebook Page Access Token." })
      return
    }
    setTokenTesting(true)
    setTokenTestResult(null)
    try {
      const res = await fetch(`https://graph.facebook.com/v20.0/me?access_token=${encodeURIComponent(trimmed)}`)
      const data = await res.json()
      if (data.id && data.name) {
        setTokenTestResult({ success: true, message: `Token verified! Connected to Facebook: "${data.name}" (ID: ${data.id})` })
      } else {
        setTokenTestResult({ success: false, message: `Facebook API Error: ${data.error?.message || "Invalid Token"}` })
      }
    } catch (e: any) {
      setTokenTestResult({ success: false, message: e.message || "Failed to reach Meta Graph API" })
    } finally {
      setTokenTesting(false)
    }
  }

  const handleSavePageToken = () => {
    const trimmed = activePageToken.trim()
    if (!trimmed) return
    const targetPageId = env.NEXT_PUBLIC_FB_PAGE_ID_CARE_HUB_BD || "892168940637389"
    updatePageToken(targetPageId, trimmed, Date.now() + 60 * 24 * 60 * 60 * 1000)

    setRegisteredPages((prev) =>
      prev.map((p) =>
        p.pageName === "CARE HUB BD" || p.pageId === targetPageId
          ? { ...p, accessToken: trimmed, tokenExpiry: Date.now() + 60 * 24 * 60 * 60 * 1000 }
          : p
      )
    )

    setTokenSaved(true)
    showToast("Facebook Page Token saved & active for CARE HUB BD")
    setTimeout(() => {
      setTokenSaved(false)
      setShowTokenModal(false)
    }, 1500)
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              AI Post Scheduler & Content Calendar
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowTokenModal(true)}
                className="bg-card hover:bg-muted text-foreground font-semibold text-xs px-3 py-1.5 rounded-xl border border-border transition flex items-center gap-1.5 shadow-xs"
              >
                <Key className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Manage FB Page Token</span>
              </button>
              <a
                href={`/workspace/${workspaceId}/safe/ai-variations`}
                className="bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-semibold text-xs px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 transition flex items-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate AI Variations</span>
              </a>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Master Post Creator, Gemini Pro Variations, Bull Queue Delay Engine (Min 5m delay), and Drag & Drop Calendar.
          </p>
        </div>

        {/* Navigation Tabs (Mobile Horizontally Scrollable) */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl text-xs font-semibold overflow-x-auto no-scrollbar max-w-full">
          <button
            onClick={() => setActiveTab("Scheduler")}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
              activeTab === "Scheduler"
                ? "bg-blue-600 text-white shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Master Scheduler</span>
          </button>
          <button
            onClick={() => setActiveTab("Calendar")}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
              activeTab === "Calendar"
                ? "bg-blue-600 text-white shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Content Calendar</span>
          </button>
          <button
            onClick={() => setActiveTab("QueueMonitor")}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
              activeTab === "QueueMonitor"
                ? "bg-blue-600 text-white shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Bull Queue Monitor ({queueJobs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("BestTimes")}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
              activeTab === "BestTimes"
                ? "bg-blue-600 text-white shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Best Posting Times</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MASTER SCHEDULER */}
      {activeTab === "Scheduler" && (
        <div className="grid gap-6 lg:grid-cols-12 animate-in fade-in duration-200">
          {/* Master Form */}
          <div className="lg:col-span-7 space-y-5 border border-border bg-card p-4 sm:p-5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h2 className="font-bold text-sm text-foreground">Master Post Creator</h2>
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900/40">
                {publishEngine === "bot" ? "🤖 Puppeteer Bot Engine" : "⚡ FB Graph API v20.0"}
              </span>
            </div>

            {/* Clickable Image Card Imported Alert Banner */}
            {loadedCard && (
              <div className="p-3.5 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-600/10 border-2 border-blue-500/40 rounded-xl space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Clickable Image Card Imported</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`/c/${loadedCard.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded-lg transition flex items-center gap-1 shadow-xs"
                    >
                      <span>Test Redirect</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-0.5">
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-border bg-black shrink-0">
                    <img src={loadedCard.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-xs font-bold text-foreground truncate">{loadedCard.title}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{loadedCard.caption || loadedCard.description}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono truncate">
                      <span className="text-emerald-500 font-bold">Target:</span>
                      <span className="truncate">{loadedCard.destinationUrl}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Active Publishing Engine Selector */}
            <div className="p-3.5 bg-blue-500/10 border border-blue-500/30 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>পোস্টিং ইঞ্জিন (Publishing Engine)</span>
                </span>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>{publishEngine === "bot" ? "Puppeteer Bot সক্রিয় (১০০% টোকেন ফ্রি)" : "Meta Graph API"}</span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPublishEngine("bot")}
                  className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-2 transition ${
                    publishEngine === "bot"
                      ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/25"
                      : "bg-card text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  <Bot className="w-4 h-4 shrink-0" />
                  <span>Puppeteer Bot (রোবট মোড)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPublishEngine("graph_api")}
                  className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-2 transition ${
                    publishEngine === "graph_api"
                      ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/25"
                      : "bg-card text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  <Zap className="w-4 h-4 shrink-0" />
                  <span>Meta Graph API (টোকেন মোড)</span>
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {publishEngine === "bot"
                  ? "✅ Puppeteer Bot সক্রিয়: আপনার সেভ করা ফেসবুক কুকি দিয়ে স্বয়ংক্রিয়ভাবে সরাসরি পেজ ও গ্রুপে পোস্ট হবে। কোনো মেটা ডেভেলপার অ্যাপ, রিভিউ বা EAAG টোকেন লাগবে না!"
                  : "⚠️ Meta Graph API: এই মোডে পোস্ট করতে পেজের নিজস্ব ভ্যালিড মেটা পেজ অ্যাক্সেস টোকেন (EAAG...) প্রয়োজন।"}
              </p>
            </div>

            {/* Target Account / Page Selector (Multi-Select Support) */}
            <div className="bg-muted/30 border border-border p-3.5 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Target Pages & Accounts ({allSelectableAccounts.length} Connected)</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedTargetAccounts.length === allSelectableAccounts.length) {
                        setSelectedTargetAccounts([])
                      } else {
                        setSelectedTargetAccounts(allSelectableAccounts.map((a) => a.name))
                      }
                    }}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition hover:underline cursor-pointer bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-0.5 rounded-md border border-blue-500/20"
                  >
                    {selectedTargetAccounts.length === allSelectableAccounts.length ? "Deselect All" : "Select All"}
                  </button>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 px-2 py-0.5 rounded-full font-semibold">
                    {selectedTargetAccounts.length} Selected
                  </span>
                </div>
              </div>
              <div className="space-y-1.5 bg-background border border-border rounded-xl p-2.5 max-h-36 overflow-y-auto">
                {allSelectableAccounts.map((acc) => {
                  const isChecked = selectedTargetAccounts.includes(acc.name)
                  return (
                    <label key={acc.id} className="flex items-center justify-between gap-2 text-xs font-medium cursor-pointer hover:bg-muted/50 p-1.5 rounded-lg transition">
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTargetAccounts((prev) => [...prev, acc.name])
                            } else {
                              setSelectedTargetAccounts((prev) => prev.filter((name) => name !== acc.name))
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className={`truncate text-xs ${isChecked ? "text-blue-600 dark:text-blue-400 font-semibold" : "text-foreground"}`}>
                          {acc.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] shrink-0">
                        <span className="bg-muted px-1.5 py-0.5 rounded-md text-muted-foreground font-medium">
                          {acc.category}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded-md font-semibold ${acc.status.includes("Active") || acc.status.includes("Connected") ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
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
                    onClick={() => {
                      setPostFormat(fmt)
                      if (fmt === "Video" || fmt === "Reel") {
                        if (!mediaUrl || !mediaUrl.match(/\.(mp4|mov|webm)/i)) {
                          setMediaUrl("/sample-video.mp4")
                        }
                      } else if (fmt === "Text" || fmt === "Poll") {
                        setMediaUrl("")
                      } else if (fmt === "Image" || fmt === "Story") {
                        if (!mediaUrl || mediaUrl.match(/\.(mp4|mov|webm)/i)) {
                          setMediaUrl("https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop")
                        }
                      }
                    }}
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
              <div className="p-4 bg-card border border-border rounded-xl space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between font-extrabold text-xs text-foreground">
                  <span className="flex items-center space-x-1.5 text-blue-600 dark:text-blue-400">
                    <Video className="w-4 h-4" />
                    <span>Facebook Feed Video Post</span>
                  </span>
                  <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-bold">
                    MP4 / H.264
                  </span>
                </div>

                {/* Video Media Preview Player */}
                {mediaUrl && (
                  <div className="rounded-xl overflow-hidden border border-border bg-black/40 p-2 space-y-2">
                    <div className="flex items-center justify-between text-[11px] px-1 font-semibold text-muted-foreground">
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Attached Video Media</span>
                      </span>
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded truncate max-w-[200px]">
                        {mediaUrl}
                      </span>
                    </div>
                    {mediaUrl.endsWith(".mp4") || mediaUrl.includes("/downloads/") ? (
                      <video
                        controls
                        src={mediaUrl}
                        poster={thumbnailUrl}
                        className="w-full max-h-52 rounded-lg bg-black object-contain shadow-xs"
                      />
                    ) : (
                      thumbnailUrl && (
                        <div className="relative w-full h-44 rounded-lg overflow-hidden bg-black flex items-center justify-center">
                          <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Video className="w-10 h-10 text-white opacity-80" />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Video Title *</label>
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="Video Headline"
                    className="w-full mt-1 p-2 border border-border rounded-lg bg-background text-xs font-bold text-foreground"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Direct Video URL *</label>
                  <input
                    type="text"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="https://.../video.mp4 or /sample-video.mp4"
                    className="w-full mt-1 p-2 border border-border rounded-lg bg-background text-xs font-mono text-foreground"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Custom Thumbnail URL</label>
                  <input
                    type="text"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://.../thumbnail.jpg"
                    className="w-full mt-1 p-2 border border-border rounded-lg bg-background text-xs font-mono text-foreground"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Video Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full mt-1 p-2 border border-border rounded-lg bg-background text-xs text-foreground"
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-xs block">Ad Copy / Description *</label>
                    <span className="text-[11px] text-muted-foreground">{description.length} chars</span>
                  </div>
                  <textarea
                    rows={7}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2.5 border rounded-xl bg-background text-xs leading-relaxed min-h-[160px] focus:ring-1 focus:ring-blue-500 font-sans"
                    placeholder="Enter post description, caption, hashtags, and CTA..."
                  />
                </div>

                {postFormat === "Image" && (
                  <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                        <span>Image Creative Media Attachment</span>
                      </label>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900/60">
                        Scheduler &amp; Bot Ready
                      </span>
                    </div>

                    {/* Media Actions: 1) From Library, 2) Direct File Upload */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setShowLibraryPicker(true)}
                        className="flex-1 min-w-[120px] h-8 px-2.5 rounded-lg border border-blue-500/30 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span>From Library</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => localFileInputRef.current?.click()}
                        disabled={isUploadingMedia}
                        className="flex-1 min-w-[120px] h-8 px-2.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        {isUploadingMedia ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Upload File</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Hidden Local File Input */}
                    <input
                      ref={localFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleLocalFileUpload(file)
                      }}
                    />

                    {/* Media URL Input */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Or Media URL / Path:</span>
                      <input
                        type="text"
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        placeholder="https://.../product.jpg or /uploads/..."
                        className="w-full h-8 px-2.5 border border-border rounded-lg bg-background text-[11px] font-mono text-foreground focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition"
                      />
                    </div>

                    {/* Live Media Visual Preview Card */}
                    {mediaUrl && (
                      <div className="relative p-2 bg-background border border-border rounded-xl flex items-center gap-3">
                        <div className="w-20 h-14 bg-muted rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-border">
                          <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate text-foreground">
                            {uploadedFileInfo?.name || (mediaUrl.startsWith("http") ? mediaUrl.split("/").pop() : mediaUrl)}
                          </p>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Ready for Post Scheduler &amp; Facebook Bot</span>
                            {uploadedFileInfo?.size && <span className="text-muted-foreground">({uploadedFileInfo.size})</span>}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setMediaUrl("")
                            setUploadedFileInfo(null)
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
            <div className="border border-border bg-card p-4 sm:p-5 rounded-2xl space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <h2 className="font-bold text-sm flex items-center gap-2 text-foreground">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Schedule Time & Delay Engine</span>
                </h2>
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>

              {/* Schedule Mode: Immediate vs Specific Time */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold block mb-1.5 text-foreground">Publish Schedule Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setScheduleMode("SpecificTime")}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                        scheduleMode === "SpecificTime"
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs font-bold"
                          : "bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Specific Time ({getFormattedSelectedTime()})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleMode("Immediate")}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                        scheduleMode === "Immediate"
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs font-bold"
                          : "bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Immediate Queue</span>
                    </button>
                  </div>
                </div>

                {/* Specific Date & Time Input */}
                {scheduleMode === "SpecificTime" && (
                  <div className="p-3.5 border border-border bg-muted/20 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-xs text-foreground block">
                        Select Target Date & Time
                      </label>
                      <span className="text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 px-2 py-0.5 rounded-full">
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
                        className="w-full px-3 py-2 border border-border rounded-xl bg-background text-xs font-semibold text-foreground focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-xs transition"
                      />
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        onClick={() => setQuickPreset("now")}
                        className="text-[11px] bg-card hover:bg-muted px-2.5 py-1 rounded-lg border border-border font-medium text-foreground transition flex items-center gap-1"
                      >
                        <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span>Now</span>
                      </button>
                      <button
                        onClick={() => setQuickPreset("1hour")}
                        className="text-[11px] bg-card hover:bg-muted px-2.5 py-1 rounded-lg border border-border font-medium text-foreground transition flex items-center gap-1"
                      >
                        <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span>In 1 Hour</span>
                      </button>
                      <button
                        onClick={() => setQuickPreset("tomorrow_morning")}
                        className="text-[11px] bg-card hover:bg-muted px-2.5 py-1 rounded-lg border border-border font-medium text-foreground transition flex items-center gap-1"
                      >
                        <CalendarIcon className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span>Tomorrow 10 AM</span>
                      </button>
                      <button
                        onClick={() => setQuickPreset("tomorrow_evening")}
                        className="text-[11px] bg-card hover:bg-muted px-2.5 py-1 rounded-lg border border-border font-medium text-foreground transition flex items-center gap-1"
                      >
                        <CalendarIcon className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span>Tomorrow 7:30 PM</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-muted-foreground font-medium pt-1.5 border-t border-border flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>Post will automatically publish to <strong className="text-foreground">{selectedTargetAccount}</strong> at exact scheduled time.</span>
                    </p>
                  </div>
                )}

                <div>
                  <label className="font-semibold block mb-1 text-foreground">Delay Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDelayType("Randomized")}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                        delayType === "Randomized"
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs font-bold"
                          : "bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      <span>Randomized Delays</span>
                    </button>
                    <button
                      onClick={() => setDelayType("Fixed")}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                        delayType === "Fixed"
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs font-bold"
                          : "bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Fixed Interval</span>
                    </button>
                  </div>
                </div>

                {delayType === "Randomized" ? (
                  <div>
                    <label className="font-semibold block mb-1 text-foreground">Random Delay Range (Minutes)</label>
                    <div className="p-2.5 border border-border rounded-xl bg-muted/20 text-muted-foreground font-medium text-xs">
                      Random intervals: 10m, 20m, 30m, 50m (Minimum {minDelay} mins enforced)
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="font-semibold block mb-1 text-foreground">Interval (Every X Minutes)</label>
                    <input
                      type="number"
                      min={5}
                      value={fixedInterval}
                      onChange={(e) => setFixedInterval(Math.max(5, Number(e.target.value)))}
                      className="w-full px-3 py-2 border border-border rounded-xl bg-background text-xs"
                    />
                  </div>
                )}

                {/* Account Assignment Mode */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold block text-foreground text-xs">Account Assignment Mode</label>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {assignMode === "Auto" ? "AI Smart Balanced" : `${selectedTargetAccounts.length} Custom Sequenced`}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAssignMode("Auto")}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                        assignMode === "Auto"
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs font-bold"
                          : "bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Auto Assign</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignMode("Manual")}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                        assignMode === "Manual"
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs font-bold"
                          : "bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Manual Drag/Drop</span>
                    </button>
                  </div>

                  {assignMode === "Auto" ? (
                    <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-2 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-bold text-foreground">AI Smart Load Balancer</span>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          Automatic
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        AI automatically distributes scheduled posts across your <strong className="text-foreground">{selectedTargetAccounts.length} selected account(s)</strong>. It staggers publishing times and optimizes account safety to prevent Facebook spam and shadowban triggers.
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-0.5 text-[10px]">
                        <span className="px-2 py-0.5 rounded-md bg-card border border-border text-foreground font-medium flex items-center gap-1">
                          <Shield className="w-3 h-3 text-emerald-500" /> Anti-Ban Staggering
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-card border border-border text-foreground font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-500" /> Jitter Intervals
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl border border-border bg-card space-y-2.5 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-foreground">Manual Posting Sequence</span>
                          <p className="text-[10px] text-muted-foreground">Order in which accounts will receive this post</p>
                        </div>
                        <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                          {selectedTargetAccounts.length} in queue
                        </span>
                      </div>

                      {selectedTargetAccounts.length === 0 ? (
                        <div className="p-3 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                          Please select at least one account from <strong>Target Pages & Accounts</strong> above.
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                          {selectedTargetAccounts.map((accName, idx) => {
                            const accInfo = allSelectableAccounts.find(a => a.name === accName)
                            return (
                              <div
                                key={accName}
                                className="flex items-center justify-between p-2 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-5 h-5 rounded-md bg-blue-600/10 text-blue-600 dark:text-blue-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                                    #{idx + 1}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-foreground truncate text-xs">{accName}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{accInfo?.category || "Connected Account"}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleReorderAccount(idx, "up")}
                                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                                    title="Move Up"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === selectedTargetAccounts.length - 1}
                                    onClick={() => handleReorderAccount(idx, "down")}
                                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                                    title="Move Down"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Module 11 CTA Pin Comment Integration */}
                <div className="p-3.5 border border-border bg-muted/20 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <Pin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="font-bold text-xs text-foreground">
                        1st Comment Pin Automation
                      </span>
                    </div>
                    <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold px-2 py-0.5 rounded-full border border-blue-500/20">
                      Module 11 • Anti-Reach Penalty
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <label className="text-xs font-medium text-foreground cursor-pointer flex items-center gap-2">
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
                      className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      Studio <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  {enableCtaPinComment && (
                    <div className="space-y-2.5 pt-2 border-t border-border text-xs">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Template</label>
                            <button
                              type="button"
                              onClick={() => setShowNewTemplateModal(true)}
                              className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                            >
                              <Plus className="w-2.5 h-2.5" /> New
                            </button>
                          </div>
                          <div className="relative">
                            <select
                              value={selectedCtaTemplateId}
                              onChange={(e) => handleSelectCtaTemplate(e.target.value)}
                              className="w-full appearance-none bg-card hover:bg-muted/40 text-foreground border border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-3 py-2 pr-8 text-xs font-medium cursor-pointer transition shadow-xs outline-none"
                            >
                              {ctaTemplates.map((t) => (
                                <option key={t.id} value={t.id} className="bg-card text-foreground">
                                  {t.title}
                                </option>
                              ))}
                              <option value="__NEW__" className="bg-card text-blue-600 dark:text-blue-400 font-semibold">
                                + Create Custom Template...
                              </option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Anti-Ban Delay</label>
                            <span className="text-[9px] text-muted-foreground font-medium">Safe timing</span>
                          </div>
                          <div className="relative">
                            <select
                              value={ctaDelaySeconds}
                              onChange={(e) => setCtaDelaySeconds(Number(e.target.value))}
                              className="w-full appearance-none bg-card hover:bg-muted/40 text-foreground border border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-3 py-2 pr-8 text-xs font-medium cursor-pointer transition shadow-xs outline-none"
                            >
                              <option value={0} className="bg-card text-foreground">0s (Immediate)</option>
                              <option value={15} className="bg-card text-foreground">15s (Natural Flow)</option>
                              <option value={30} className="bg-card text-foreground">30s (Safe)</option>
                              <option value={60} className="bg-card text-foreground">60s (Conservative)</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">CTA Comment Body</label>
                          <span className="text-[10px] text-muted-foreground">{ctaCommentText.length} chars</span>
                        </div>
                        <textarea
                          rows={2}
                          value={ctaCommentText}
                          onChange={(e) => setCtaCommentText(e.target.value)}
                          className="w-full p-2.5 border border-border rounded-xl bg-card text-foreground text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition placeholder:text-muted-foreground"
                          placeholder="Comment text to post and pin..."
                        />
                      </div>
                    </div>
                  )}
                </div>

                {scheduleSuccess && (
                  <div className="p-3 border border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-semibold text-xs rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span>{scheduleSuccess}</span>
                  </div>
                )}

                <button
                  onClick={handleSchedulePostToQueue}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-xs transition text-xs flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Schedule Master Post into Bull Queue</span>
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
        <div className="border border-border bg-card p-4 sm:p-5 rounded-2xl space-y-5 shadow-xs animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-3">
            <div>
              <h2 className="font-bold text-base text-foreground">Bull Queue & Redis Job Monitor</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automated rate-limited queue processing with 3x retry policy and Admin Notification alerts on failure.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40 text-xs font-semibold px-3 py-1 rounded-full">
                ● Redis Queue Worker Online
              </span>
              {queueJobs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowClearConfirmModal(true)}
                  className="px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  title="Clear all queue items"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>

          {/* Meta Graph API Integration Requirement Note */}
          <div className="p-3.5 border border-border bg-muted/20 rounded-xl text-foreground text-xs space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <Key className="w-4 h-4 shrink-0" />
              <span>Meta Graph API Live Integration Requirement:</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Queue processing transitions jobs to <strong>Posted</strong>. For posts to appear on live Facebook Pages (like <em>CARE HUB BD</em>), valid <strong>Meta Page Access Tokens (`EAAG...`)</strong> with <code>pages_manage_posts</code> permission must be connected in <strong>Connect Accounts</strong>.
            </p>
          </div>

          {/* Queue Metrics Summary & Batch Progress */}
          {queueJobs.length > 0 && (
            <div className="space-y-3">
              {/* Quick Status Stats Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <div className="p-2.5 rounded-xl border border-border bg-muted/20 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Total In Queue</span>
                  <span className="text-base font-extrabold text-foreground">{queueJobs.length}</span>
                </div>
                <div className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase font-bold text-amber-500 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>Pending</span>
                  </span>
                  <span className="text-base font-extrabold text-amber-500">
                    {queueJobs.filter((j) => j.status === "Pending").length}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-blue-500/20 bg-blue-500/[0.04] flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase font-bold text-blue-500 flex items-center gap-1">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    <span>Processing</span>
                  </span>
                  <span className="text-base font-extrabold text-blue-500">
                    {queueJobs.filter((j) => j.status === "Processing").length}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>Posted</span>
                  </span>
                  <span className="text-base font-extrabold text-emerald-500">
                    {queueJobs.filter((j) => j.status === "Posted").length}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/[0.04] flex flex-col items-center justify-center text-center col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-bold text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-2.5 h-2.5" />
                    <span>Failed</span>
                  </span>
                  <span className="text-base font-extrabold text-rose-500">
                    {queueJobs.filter((j) => j.status === "Failed").length}
                  </span>
                </div>
              </div>

              {/* Overall Batch Progress Bar with Next Post Countdown */}
              {(() => {
                const totalCount = queueJobs.length
                const completedCount = queueJobs.filter((j) => j.status === "Posted").length
                const overallPercent = Math.round((completedCount / Math.max(1, totalCount)) * 100)
                const pendingSorted = queueJobs
                  .filter((j) => j.status === "Pending")
                  .sort((a, b) => (a.executeAtTimestamp || 0) - (b.executeAtTimestamp || 0))
                const nextPending = pendingSorted[0]

                return (
                  <div className="p-3.5 bg-muted/20 border border-border rounded-xl space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-foreground flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-blue-500" />
                          <span>Active Queue Batch Completion</span>
                        </span>
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          ({completedCount}/{totalCount} Completed • {overallPercent}%)
                        </span>
                      </div>

                      {nextPending && (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/25">
                          <Clock className="w-3 h-3 animate-spin [animation-duration:10s]" />
                          <span>Next Task in:</span>
                          <span className="font-mono text-foreground font-extrabold">
                            {getJobProgressData(nextPending, nowTimestamp).formattedCountdown}
                          </span>
                          <span className="text-muted-foreground truncate max-w-[140px]">
                            ({nextPending.accountName})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Overall Progress Bar Track */}
                    <div className="w-full bg-muted/60 dark:bg-muted/40 h-2 rounded-full overflow-hidden border border-border/40">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${overallPercent}%` }}
                      />
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Queue Jobs Table */}
          {queueJobs.length === 0 ? (
            <div className="py-12 px-4 text-center border border-dashed border-border rounded-xl space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="font-semibold text-sm text-foreground">Queue is clean &amp; empty</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                There are no active jobs waiting in the queue. You can schedule new posts anytime from the Master Scheduler tab.
              </p>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {queueJobs.map((job) => {
                const progress = getJobProgressData(job, nowTimestamp)

                return (
                  <div
                    key={job.id}
                    className={`border p-4 rounded-xl space-y-3 transition ${
                      job.status === "Processing"
                        ? "border-blue-500/60 bg-blue-500/[0.03] ring-1 ring-blue-500/20"
                        : job.status === "Posted"
                        ? "border-emerald-500/30 bg-emerald-500/[0.02]"
                        : job.status === "Failed"
                        ? "border-rose-500/30 bg-rose-500/[0.02]"
                        : "border-border bg-card hover:border-border/80 shadow-2xs"
                    }`}
                  >
                    {/* Top Row: Title, Target, Status Pill, Reducing Countdown Badge, Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="font-extrabold text-sm text-foreground truncate">
                            {job.variationTitle}
                          </span>
                          {job.postFormat && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border">
                              {job.postFormat}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-[11px]">
                          <span>
                            Target: <strong className="text-foreground font-semibold">{job.accountName}</strong>
                          </span>
                          <span>•</span>
                          {job.scheduleType === "SpecificTime" ? (
                            <span>
                              Mode: <strong className="text-blue-500 font-semibold">Specific Time</strong>
                            </span>
                          ) : (
                            <span>
                              Anti-Ban Delay: <strong className="text-blue-500 font-semibold">{job.delayMinutes} mins</strong>
                            </span>
                          )}
                          <span>•</span>
                          <span>
                            Execution: <strong className="text-foreground">{job.scheduledFor}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Right Side Status & Live Reducing Countdown Badge */}
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        {/* LIVE REDUCING COUNTDOWN BADGE */}
                        {job.status === "Pending" && (
                          progress.isDue ? (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full text-xs animate-pulse">
                              <Zap className="w-3.5 h-3.5" />
                              <span>Due Now</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-mono font-bold text-amber-500 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-full text-xs shadow-2xs">
                              <Clock className="w-3.5 h-3.5 animate-spin [animation-duration:8s]" />
                              <span>⏱️ {progress.formattedCountdown}</span>
                            </span>
                          )
                        )}

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            job.status === "Posted"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : job.status === "Processing"
                              ? "bg-blue-500/10 text-blue-500 border border-blue-500/20 animate-pulse flex items-center gap-1.5"
                              : job.status === "Failed"
                              ? "bg-destructive/10 text-destructive border border-destructive/20"
                              : "bg-muted text-muted-foreground border"
                          }`}
                        >
                          {job.status === "Processing" && <Loader2 className="w-3 h-3 animate-spin inline" />}
                          {job.status === "Posted"
                            ? job.engine === "bot" || String(job.id).includes("bot")
                              ? "Posted (Puppeteer Bot)"
                              : "Posted (Graph API)"
                            : job.status}
                        </span>

                        {job.status === "Pending" && (
                          <button
                            type="button"
                            disabled={runningJobId !== null}
                            onClick={() => handleForceRunJob(job.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer shadow-xs disabled:opacity-50"
                            title="Post immediately to Facebook"
                          >
                            {runningJobId === job.id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Running...</span>
                              </>
                            ) : (
                              <>
                                <Zap className="w-3.5 h-3.5" />
                                <span>Run Now</span>
                              </>
                            )}
                          </button>
                        )}

                        {job.status === "Processing" && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={runningJobId === job.id}
                              onClick={() => handleResetJobToPending(job.id)}
                              className="bg-amber-600/90 hover:bg-amber-600 text-white font-semibold px-2 py-1 rounded-lg text-[11px] flex items-center gap-1 transition cursor-pointer shadow-xs disabled:opacity-50"
                              title="Reset stuck job back to Pending"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reset</span>
                            </button>
                            <button
                              type="button"
                              disabled={runningJobId === job.id}
                              onClick={() => handleForceRunJob(job.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer shadow-xs disabled:opacity-75"
                              title="Force run Facebook post now"
                            >
                              {runningJobId === job.id ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Posting...</span>
                                </>
                              ) : (
                                <>
                                  <Zap className="w-3.5 h-3.5" />
                                  <span>Force Run</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {job.status === "Failed" && (
                          <button
                            type="button"
                            onClick={() => handleRetryJob(job.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer"
                            title="Retry failed job"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Retry ({job.retryCount}/{job.maxRetries})</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteQueueJob(job.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition"
                          title="Delete from Queue"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* LIVE PROGRESSING BAR & TIME REDUCING DETAILS */}
                    <div className="space-y-1.5 bg-muted/20 p-2.5 rounded-xl border border-border/40">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                          {job.status === "Pending" ? (
                            progress.isDue ? (
                              <>
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                                <span className="text-emerald-500 font-bold">
                                  Timer expired — Redis worker picking up payload...
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block" />
                                <span>
                                  Time Reducing: <strong className="text-foreground font-mono font-bold">{progress.remainingText}</strong>
                                </span>
                              </>
                            )
                          ) : job.status === "Processing" ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping inline-block" />
                              <span className="text-blue-500 font-bold">
                                Transmitting media payload to Meta Facebook Graph API...
                              </span>
                            </>
                          ) : job.status === "Posted" ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 inline" />
                              <span className="text-emerald-500 font-bold">
                                100% Processed • Published successfully
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 text-rose-500 inline" />
                              <span className="text-rose-500 font-bold">
                                Execution stopped • {job.retryCount}/{job.maxRetries} Retries attempted
                              </span>
                            </>
                          )}
                        </span>
                        <span className={`font-extrabold font-mono text-xs ${job.status === "Failed" ? "text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20" : "text-foreground"}`}>
                          {job.status === "Failed" ? "Failed (Stopped)" : `${progress.progressPercent}%`}
                        </span>
                      </div>

                      {/* Live Animated Progress Bar Track */}
                      <div className="w-full bg-muted/70 dark:bg-muted/40 h-2.5 rounded-full overflow-hidden border border-border/50 p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                            job.status === "Posted"
                              ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                              : job.status === "Processing"
                              ? "bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 animate-pulse"
                              : job.status === "Failed"
                              ? "bg-rose-500"
                              : progress.isDue
                              ? "bg-emerald-500 animate-pulse"
                              : "bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                          }`}
                          style={{ width: `${progress.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Error Box (if failed) */}
                    {job.lastError && (
                      <div className="p-2.5 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-[11px] font-medium flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Error: {job.lastError} (Retried {job.retryCount}/{job.maxRetries} times)</span>
                        </span>
                        <span className="bg-destructive text-white text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">
                          Admin Notified
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: BEST POSTING TIME ANALYSIS */}
      {activeTab === "BestTimes" && (
        <div className="border border-border bg-card p-4 sm:p-5 rounded-2xl space-y-5 shadow-xs animate-in fade-in duration-200">
          <div className="border-b border-border pb-3">
            <h2 className="font-bold text-base text-foreground">Best Posting Time Analysis (Graph API Page Insights)</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              AI analyzes Facebook Page Insights & historical engagement patterns to suggest 5-8 optimal posting slots converted to local timezone.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {bestTimes.map((item, idx) => (
              <div key={idx} className="border border-border p-4 rounded-xl space-y-2 bg-muted/10 hover:border-blue-500/50 transition text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">{item.slot}</span>
                  <span className="bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 font-semibold px-2.5 py-0.5 rounded-full text-[11px]">
                    {item.expectedReachBoost}
                  </span>
                </div>

                <div className="space-y-1 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">Local Time:</span>
                    <span className="bg-blue-100/50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold px-2 py-0.5 rounded-md text-[11px]">
                      {item.localTime}
                    </span>
                  </div>
                  <div>Day: <strong className="text-foreground">{item.day}</strong> ({item.targetTimezone})</div>
                </div>

                <p className="text-muted-foreground text-[11px] pt-1.5 border-t border-border italic">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meta Page Access Token Management Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-foreground">Meta Facebook Page Access Token</h3>
              </div>
              <button
                onClick={() => setShowTokenModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              To publish scheduled posts directly onto live Facebook Pages (e.g. <strong>CARE HUB BD</strong>), paste your Meta Developer App Page Access Token below with <code>pages_manage_posts</code> permission.
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground block">Facebook Page Access Token (EAAG...)</label>
                <button
                  type="button"
                  disabled={tokenTesting || !activePageToken.trim()}
                  onClick={handleTestToken}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 disabled:opacity-40"
                >
                  {tokenTesting ? (
                    <span className="flex items-center gap-1">
                      <RotateCcw className="w-3 h-3 animate-spin" /> Verifying...
                    </span>
                  ) : (
                    <span>Test Token ↗</span>
                  )}
                </button>
              </div>
              <textarea
                value={activePageToken}
                onChange={(e) => {
                  setActivePageToken(e.target.value)
                  setTokenTestResult(null)
                }}
                rows={4}
                className="w-full border border-border rounded-xl p-3 font-mono text-[11px] bg-muted/20 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-foreground"
                placeholder="Paste EAAG... token from Graph API Explorer"
              />
            </div>

            {tokenTestResult && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                  tokenTestResult.success
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                }`}
              >
                {tokenTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                )}
                <span>{tokenTestResult.message}</span>
              </div>
            )}

            {tokenSaved && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 text-xs rounded-xl font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Meta Page Access Token updated! Real Graph API publishing active.</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowTokenModal(false)}
                className="h-9 px-4 border border-border rounded-xl text-xs font-semibold hover:bg-muted text-muted-foreground transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSavePageToken}
                disabled={!activePageToken.trim()}
                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl text-xs font-semibold transition shadow-xs disabled:opacity-50"
              >
                Save Meta Token
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add CTA Template Modal */}
      {showNewTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Pin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Create CTA Pin Template</h3>
                  <p className="text-[11px] text-muted-foreground">Save reusable pinned comment for future posts</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewTemplateModal(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuickTemplate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Template Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., CARE HUB Flash Sale Direct Link"
                  value={newTmplTitle}
                  onChange={(e) => setNewTmplTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Target Link / URL
                </label>
                <input
                  type="text"
                  placeholder="https://carehubbd.com/order or WhatsApp link"
                  value={newTmplLink}
                  onChange={(e) => setNewTmplLink(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Comment Text <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Comment message to post and pin under post automatically..."
                  value={newTmplComment}
                  onChange={(e) => setNewTmplComment(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Anti-Ban Delay
                </label>
                <div className="relative">
                  <select
                    value={newTmplDelay}
                    onChange={(e) => setNewTmplDelay(Number(e.target.value))}
                    className="w-full appearance-none px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer pr-8"
                  >
                    <option value={0} className="bg-card text-foreground">0s (Immediate Post)</option>
                    <option value={15} className="bg-card text-foreground">15s (Recommended / Natural Flow)</option>
                    <option value={30} className="bg-card text-foreground">30s (Safe Delay)</option>
                    <option value={60} className="bg-card text-foreground">60s (Conservative)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowNewTemplateModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTmplTitle.trim() || !newTmplComment.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save &amp; Use Template</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clear Queue Confirmation Modal */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border/80 rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Clear Bull Queue?</h3>
                <p className="text-[11px] text-muted-foreground">Remove all scheduled queue jobs</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to remove all <strong className="text-foreground">{queueJobs.length} active and failed jobs</strong> from the queue? This will reset the monitor cleanly.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted border border-border transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Clear All Jobs</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Modern Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-card/95 backdrop-blur-md border border-border/90 shadow-2xl text-xs font-semibold text-foreground animate-in slide-in-from-bottom-3 fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
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
