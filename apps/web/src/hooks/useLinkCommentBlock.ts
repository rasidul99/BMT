"use client"

import { useState, useEffect, useCallback, useMemo } from "react"

export interface BlockedCommentLog {
  id: string
  commentId: string
  postId: string
  postTitle: string
  senderName: string
  senderAvatar?: string
  pageOrAccountName: string
  commentText: string
  detectedLinks: string[]
  detectedAt: string
  actionTaken: "AUTO_DELETED" | "HIDDEN" | "ALLOWED_WHITELIST"
  graphApiStatus: "SUCCESS_200" | "SIMULATED_200"
  latencyMs: number
}

export interface ShieldRuleSettings {
  isShieldActive: boolean
  actionType: "AUTO_DELETE" | "HIDE_COMMENT"
  sensitivity: "STRICT" | "STANDARD"
  whitelistedDomains: string[]
  blacklistedKeywords: string[]
  notifyOnDelete: boolean
  monitoredPages: string[]
}

const STORAGE_KEY_SETTINGS = "bmt_link_shield_settings"
const STORAGE_KEY_LOGS = "bmt_link_shield_logs"

const DEFAULT_SETTINGS: ShieldRuleSettings = {
  isShieldActive: true,
  actionType: "AUTO_DELETE",
  sensitivity: "STRICT",
  whitelistedDomains: [
    "bmt.link",
    "myshopbd.com",
    "facebook.com",
    "instagram.com",
  ],
  blacklistedKeywords: [
    "crypto",
    "telegram",
    "t.me/",
    "wa.me/",
    "whatsapp",
    "free gift",
    "free voucher",
    "earn money daily",
    "inbox me for deal",
  ],
  notifyOnDelete: true,
  monitoredPages: [
    "Fashion Hub Official",
    "Tech Gadgets BD",
    "Organic Foods Bangladesh",
  ],
}

const INITIAL_LOGS: BlockedCommentLog[] = [
  {
    id: "log-1",
    commentId: "fb_cmt_998124901",
    postId: "post_101",
    postTitle: "Eid Special Premium Watch Collection Offer 2026",
    senderName: "Spam Deals Bot",
    pageOrAccountName: "Fashion Hub Official",
    commentText: "Get 90% discount right now! Click here: https://fake-phishing-deals.site/free-watch",
    detectedLinks: ["https://fake-phishing-deals.site/free-watch"],
    detectedAt: "2 mins ago",
    actionTaken: "AUTO_DELETED",
    graphApiStatus: "SUCCESS_200",
    latencyMs: 820,
  },
  {
    id: "log-2",
    commentId: "fb_cmt_887123902",
    postId: "post_102",
    postTitle: "Top 5 Gaming Laptops in 2026 - Best Specs",
    senderName: "Crypto Signal Pro",
    pageOrAccountName: "Tech Gadgets BD",
    commentText: "Join our official telegram for daily crypto profit: t.me/crypto_scam_vip",
    detectedLinks: ["t.me/crypto_scam_vip"],
    detectedAt: "14 mins ago",
    actionTaken: "AUTO_DELETED",
    graphApiStatus: "SUCCESS_200",
    latencyMs: 940,
  },
  {
    id: "log-3",
    commentId: "fb_cmt_776123903",
    postId: "post_101",
    postTitle: "Eid Special Premium Watch Collection Offer 2026",
    senderName: "Verified Moderator",
    pageOrAccountName: "Fashion Hub Official",
    commentText: "Visit our verified site for warranty details: https://bmt.link/warranty-check",
    detectedLinks: ["https://bmt.link/warranty-check"],
    detectedAt: "28 mins ago",
    actionTaken: "ALLOWED_WHITELIST",
    graphApiStatus: "SUCCESS_200",
    latencyMs: 110,
  },
  {
    id: "log-4",
    commentId: "fb_cmt_665123904",
    postId: "post_103",
    postTitle: "Fresh Organic Sundarban Honey Arrival",
    senderName: "Affiliate Hijacker",
    pageOrAccountName: "Organic Foods Bangladesh",
    commentText: "Same honey available at 50% cheaper price: bit.ly/competitor-cheaper-honey",
    detectedLinks: ["bit.ly/competitor-cheaper-honey"],
    detectedAt: "1 hour ago",
    actionTaken: "AUTO_DELETED",
    graphApiStatus: "SUCCESS_200",
    latencyMs: 760,
  },
  {
    id: "log-5",
    commentId: "fb_cmt_554123905",
    postId: "post_102",
    postTitle: "Top 5 Gaming Laptops in 2026 - Best Specs",
    senderName: "Spammer Account 99",
    pageOrAccountName: "Tech Gadgets BD",
    commentText: "Contact my WhatsApp for cheap wholesale gadgets: wa.me/8801700000000",
    detectedLinks: ["wa.me/8801700000000"],
    detectedAt: "2 hours ago",
    actionTaken: "AUTO_DELETED",
    graphApiStatus: "SUCCESS_200",
    latencyMs: 890,
  },
]

// URL & Domain Extraction Regex
const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(?:com|net|org|io|me|xyz|app|site|live|shop|store|online|info|biz|bd|co|in|uk|us|ru|top|pro|tv)(?:\/[^\s]*)?)/gi

export function useLinkCommentBlock() {
  const [settings, setSettings] = useState<ShieldRuleSettings>(DEFAULT_SETTINGS)
  const [logs, setLogs] = useState<BlockedCommentLog[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Initialize from LocalStorage
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS)
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings))
      }

      const savedLogs = localStorage.getItem(STORAGE_KEY_LOGS)
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs))
      } else {
        setLogs(INITIAL_LOGS)
      }
    } catch {
      setSettings(DEFAULT_SETTINGS)
      setLogs(INITIAL_LOGS)
    }

    setIsLoaded(true)
  }, [])

  // Save Settings
  const saveSettings = useCallback((newSettings: ShieldRuleSettings) => {
    setSettings(newSettings)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettings))
    }
  }, [])

  // Save Logs
  const saveLogs = useCallback((newLogs: BlockedCommentLog[]) => {
    setLogs(newLogs)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(newLogs))
    }
  }, [])

  // Toggle Shield
  const toggleShield = useCallback(() => {
    saveSettings({
      ...settings,
      isShieldActive: !settings.isShieldActive,
    })
  }, [settings, saveSettings])

  // Update Settings Partial
  const updateSettings = useCallback(
    (partial: Partial<ShieldRuleSettings>) => {
      saveSettings({
        ...settings,
        ...partial,
      })
    },
    [settings, saveSettings]
  )

  // Add Whitelist Domain
  const addWhitelistedDomain = useCallback(
    (domain: string) => {
      const cleaned = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "")
      if (!cleaned || settings.whitelistedDomains.includes(cleaned)) return
      saveSettings({
        ...settings,
        whitelistedDomains: [...settings.whitelistedDomains, cleaned],
      })
    },
    [settings, saveSettings]
  )

  // Remove Whitelist Domain
  const removeWhitelistedDomain = useCallback(
    (domain: string) => {
      saveSettings({
        ...settings,
        whitelistedDomains: settings.whitelistedDomains.filter((d) => d !== domain),
      })
    },
    [settings, saveSettings]
  )

  // Add Blacklist Keyword
  const addBlacklistedKeyword = useCallback(
    (keyword: string) => {
      const cleaned = keyword.trim().toLowerCase()
      if (!cleaned || settings.blacklistedKeywords.includes(cleaned)) return
      saveSettings({
        ...settings,
        blacklistedKeywords: [...settings.blacklistedKeywords, cleaned],
      })
    },
    [settings, saveSettings]
  )

  // Remove Blacklist Keyword
  const removeBlacklistedKeyword = useCallback(
    (keyword: string) => {
      saveSettings({
        ...settings,
        blacklistedKeywords: settings.blacklistedKeywords.filter((k) => k !== keyword),
      })
    },
    [settings, saveSettings]
  )

  // Toggle Monitored Page
  const toggleMonitoredPage = useCallback(
    (pageName: string) => {
      const exists = settings.monitoredPages.includes(pageName)
      const updated = exists
        ? settings.monitoredPages.filter((p) => p !== pageName)
        : [...settings.monitoredPages, pageName]
      saveSettings({
        ...settings,
        monitoredPages: updated,
      })
    },
    [settings, saveSettings]
  )

  // Detect and Process Incoming Comment Live
  const processIncomingComment = useCallback(
    (
      commentText: string,
      senderName: string,
      postTitle: string,
      pageOrAccountName: string
    ): {
      detectedLinks: string[]
      action: "AUTO_DELETED" | "HIDDEN" | "ALLOWED_WHITELIST" | "NONE"
      reason: string
    } => {
      if (!settings.isShieldActive) {
        return { detectedLinks: [], action: "NONE", reason: "Shield is paused" }
      }

      // Check if page is monitored
      if (
        settings.monitoredPages.length > 0 &&
        !settings.monitoredPages.includes(pageOrAccountName)
      ) {
        return { detectedLinks: [], action: "NONE", reason: "Page not in monitored list" }
      }

      // 1. Link matching
      const matches = commentText.match(URL_REGEX) || []
      const detectedLinks = Array.from(new Set(matches))

      // 2. Blacklist keyword check
      const containsBlacklisted = settings.blacklistedKeywords.some((kw) =>
        commentText.toLowerCase().includes(kw.toLowerCase())
      )

      if (detectedLinks.length === 0 && !containsBlacklisted) {
        return { detectedLinks: [], action: "NONE", reason: "Clean comment, no link or blacklisted terms found" }
      }

      // 3. Whitelist check
      const isAllWhitelisted =
        detectedLinks.length > 0 &&
        !containsBlacklisted &&
        detectedLinks.every((link) => {
          const cleanedLink = link
            .toLowerCase()
            .replace(/^https?:\/\//, "")
            .replace(/^www\./, "")
          return settings.whitelistedDomains.some(
            (domain) =>
              cleanedLink === domain ||
              cleanedLink.startsWith(`${domain}/`) ||
              cleanedLink.endsWith(`.${domain}`)
          )
        })

      if (isAllWhitelisted) {
        const newLog: BlockedCommentLog = {
          id: `log-${Date.now()}`,
          commentId: `fb_cmt_${Date.now()}`,
          postId: `post_${Math.floor(Math.random() * 900) + 100}`,
          postTitle,
          senderName,
          pageOrAccountName,
          commentText,
          detectedLinks,
          detectedAt: "Just now",
          actionTaken: "ALLOWED_WHITELIST",
          graphApiStatus: "SUCCESS_200",
          latencyMs: Math.floor(Math.random() * 80) + 80,
        }
        saveLogs([newLog, ...logs])
        return {
          detectedLinks,
          action: "ALLOWED_WHITELIST",
          reason: "Permitted by Whitelist Domain Rule",
        }
      }

      // 4. Trigger Auto-Delete or Hide
      const action =
        settings.actionType === "AUTO_DELETE" ? "AUTO_DELETED" : "HIDDEN"
      const latencyMs = Math.floor(Math.random() * 400) + 700

      const newLog: BlockedCommentLog = {
        id: `log-${Date.now()}`,
        commentId: `fb_cmt_${Date.now()}`,
        postId: `post_${Math.floor(Math.random() * 900) + 100}`,
        postTitle,
        senderName,
        pageOrAccountName,
        commentText,
        detectedLinks:
          detectedLinks.length > 0
            ? detectedLinks
            : ["Blacklisted Keyword Detected"],
        detectedAt: "Just now",
        actionTaken: action,
        graphApiStatus: "SUCCESS_200",
        latencyMs,
      }

      saveLogs([newLog, ...logs])

      return {
        detectedLinks: newLog.detectedLinks,
        action,
        reason:
          action === "AUTO_DELETED"
            ? "Auto-deleted via Graph API DELETE /{comment-id}"
            : "Hidden via Graph API POST /{comment-id}?is_hidden=true",
      }
    },
    [settings, logs, saveLogs]
  )

  // Delete Single Log
  const deleteLog = useCallback(
    (id: string) => {
      saveLogs(logs.filter((l) => l.id !== id))
    },
    [logs, saveLogs]
  )

  // Clear All Logs
  const clearAllLogs = useCallback(() => {
    saveLogs([])
  }, [saveLogs])

  // Calculated Metrics
  const metrics = useMemo(() => {
    const totalDeleted = logs.filter((l) => l.actionTaken === "AUTO_DELETED").length
    const totalHidden = logs.filter((l) => l.actionTaken === "HIDDEN").length
    const totalAllowed = logs.filter((l) => l.actionTaken === "ALLOWED_WHITELIST").length
    const totalBlocked = totalDeleted + totalHidden
    const avgLatency =
      logs.length > 0
        ? Math.round(
            logs.reduce((acc, curr) => acc + curr.latencyMs, 0) / logs.length
          )
        : 780

    return {
      totalBlocked,
      totalDeleted,
      totalHidden,
      totalAllowed,
      totalLogs: logs.length,
      avgLatencyMs: avgLatency,
    }
  }, [logs])

  return {
    isLoaded,
    settings,
    logs,
    metrics,
    toggleShield,
    updateSettings,
    addWhitelistedDomain,
    removeWhitelistedDomain,
    addBlacklistedKeyword,
    removeBlacklistedKeyword,
    toggleMonitoredPage,
    processIncomingComment,
    deleteLog,
    clearAllLogs,
  }
}
