"use client"

import React, { useState, useMemo, useEffect } from "react"
import {
  ShieldAlert,
  ShieldCheck,
  Shield,
  Zap,
  Trash2,
  ExternalLink,
  Plus,
  X,
  Search,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  Play,
  Globe,
  Sliders,
  Layers,
  Clock,
  RefreshCw,
  User,
  Users,
  Terminal,
} from "lucide-react"
import {
  useLinkCommentBlock,
  ShieldMonitoredPost,
} from "../../hooks/useLinkCommentBlock"
import { useFacebookAccounts } from "../../hooks/useFacebookAccounts"
import { getPageRegistry } from "../../lib/fb-page-registry"

interface LinkCommentBlockCenterProps {
  currentMode: "SAFE" | "ADVANCED"
}

export function LinkCommentBlockCenter({ currentMode }: LinkCommentBlockCenterProps) {
  const {
    settings,
    logs,
    shieldPosts,
    metrics,
    toggleShield,
    updateSettings,
    addWhitelistedDomain,
    removeWhitelistedDomain,
    addBlacklistedKeyword,
    removeBlacklistedKeyword,
    toggleMonitoredPage,
    addShieldPost,
    updateShieldPost,
    deleteShieldPost,
    prependLiveIncidents,
    deleteLog,
    clearAllLogs,
  } = useLinkCommentBlock()

  const { accounts: fleetAccounts } = useFacebookAccounts()

  const [activeTab, setActiveTab] = useState<"POSTS" | "LOGS" | "RULES" | "PAGES">("POSTS")
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState<"ALL" | "AUTO_DELETED" | "HIDDEN" | "ALLOWED_WHITELIST">("ALL")
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Whitelist / Blacklist inputs
  const [newDomain, setNewDomain] = useState("")
  const [newKeyword, setNewKeyword] = useState("")
  const [newPage, setNewPage] = useState("")

  // "+ Add Facebook Post to Shield" Modal State
  const [showAddPostModal, setShowAddPostModal] = useState(false)
  const [postSourceTab, setPostSourceTab] = useState<"Personal ID" | "Page" | "Group">("Page")
  const [selectedTargetId, setSelectedTargetId] = useState("61595136714776")
  const [selectedTargetName, setSelectedTargetName] = useState("Test Next")
  const [postUrlInput, setPostUrlInput] = useState("")
  const [postTitleInput, setPostTitleInput] = useState("")
  const [postThumbnailPreview, setPostThumbnailPreview] = useState("")
  const [isFetchingPreview, setIsFetchingPreview] = useState(false)
  const [postActionType, setPostActionType] = useState<"AUTO_DELETE" | "HIDE_COMMENT">("AUTO_DELETE")

  // Live Facebook Shield Bot Watcher State
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [activeJobPostTitle, setActiveJobPostTitle] = useState<string>("")
  const [watcherStatus, setWatcherStatus] = useState<string>("IDLE")
  const [watcherError, setWatcherError] = useState<string | null>(null)
  const [watcherCheckCount, setWatcherCheckCount] = useState<number>(0)
  const [watcherLogs, setWatcherLogs] = useState<string>("")
  const [showTerminalLogs, setShowTerminalLogs] = useState<boolean>(false)
  const [isStartingBot, setIsStartingBot] = useState<boolean>(false)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Dynamic options for ID / Page / Group selector
  const sourceTargets = useMemo(() => {
    const personalIds: { id: string; name: string; sub: string }[] = [
      { id: "acc-rasidul", name: "Rasidul (Personal ID)", sub: "UID: 100099128374 (Active)" },
    ]
    const pages: { id: string; name: string; sub: string }[] = [
      { id: "61595136714776", name: "Test Next", sub: "Page ID: 61595136714776 (Connected)" },
      { id: "892168940637389", name: "CARE HUB BD", sub: "Page ID: 892168940637389 (Official)" },
    ]
    const groups: { id: string; name: string; sub: string }[] = []

    const registeredPages = getPageRegistry()
    registeredPages.forEach((entry) => {
      if (!pages.some((p) => p.id === entry.pageId || p.name.toLowerCase() === entry.pageName.toLowerCase())) {
        pages.push({
          id: entry.pageId,
          name: entry.pageName,
          sub: `Page ID: ${entry.pageId}`,
        })
      }
    })

    fleetAccounts.forEach((acc) => {
      if (!personalIds.some((p) => p.name.toLowerCase() === acc.name.toLowerCase())) {
        personalIds.push({
          id: acc.id,
          name: acc.name,
          sub: `UID: ${acc.cUser || acc.id} (${acc.status})`,
        })
      }
      if (acc.connectedPages) {
        acc.connectedPages.forEach((pg) => {
          if (!pages.some((p) => p.id === pg.pageId || p.name.toLowerCase() === pg.pageName.toLowerCase())) {
            pages.push({
              id: pg.pageId,
              name: pg.pageName,
              sub: `Page ID: ${pg.pageId}`,
            })
          }
        })
      }
      if (acc.joinedGroups) {
        acc.joinedGroups.forEach((grp) => {
          if (!groups.some((g) => g.id === grp.groupId || g.name.toLowerCase() === grp.groupName.toLowerCase())) {
            groups.push({
              id: grp.groupId,
              name: grp.groupName,
              sub: `Group (${acc.name})`,
            })
          }
        })
      }
    })

    if (groups.length === 0) {
      groups.push(
        { id: "grp-bd-ecommerce", name: "BD E-Commerce Entrepreneurs", sub: "Facebook Group" },
        { id: "grp-dhaka-marketplace", name: "Dhaka Online Marketplace", sub: "Facebook Group" }
      )
    }

    return {
      "Personal ID": personalIds,
      Page: pages,
      Group: groups,
    }
  }, [fleetAccounts])

  // Auto-fetch real Facebook post thumbnail & title when URL is pasted in modal
  useEffect(() => {
    const trimmed = postUrlInput.trim()
    if (!showAddPostModal || !trimmed.startsWith("http")) return

    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        setIsFetchingPreview(true)
        const res = await fetch("/api/facebook-bot/post-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: trimmed }),
        })
        const data = await res.json()
        if (!cancelled && data?.success) {
          if (data.thumbnailUrl) setPostThumbnailPreview(data.thumbnailUrl)
          if (data.postTitle) {
            setPostTitleInput((prev) => (!prev.trim() ? data.postTitle : prev))
          }
        }
      } catch {
      } finally {
        if (!cancelled) setIsFetchingPreview(false)
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [postUrlInput, showAddPostModal])

  // Poll active live Facebook Link Shield Bot job
  useEffect(() => {
    if (!activeJobId) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/facebook-bot/link-shield?jobId=${encodeURIComponent(activeJobId)}`)
        const data = await res.json()
        if (data?.success) {
          setWatcherStatus(data.status || "WATCHING")
          setWatcherCheckCount(data.checkCount || 0)
          if (data.error) setWatcherError(data.error)
          if (data.logs) setWatcherLogs(data.logs)
          if (Array.isArray(data.incidents) && data.incidents.length > 0) {
            prependLiveIncidents(data.incidents)
          }
        }
      } catch {}
    }, 3000)

    return () => clearInterval(interval)
  }, [activeJobId, prependLiveIncidents])

  // Launch Live Facebook Link Shield Bot for a specific post
  const handleStartLiveShield = async (post: ShieldMonitoredPost) => {
    setIsStartingBot(true)
    setWatcherError(null)
    setActiveJobPostTitle(post.postTitle)
    setWatcherStatus("STARTING")
    showToast(`Launching Live Facebook Link Shield Bot on "${post.postTitle}" (${post.targetName})...`)

    let resolvedCookie = ""
    try {
      const accWithCookie = fleetAccounts.find(
        (a) => a.cookieString && a.cookieString.includes("c_user=") && a.cookieString.includes("xs=")
      )
      if (accWithCookie?.cookieString) {
        resolvedCookie = accWithCookie.cookieString
      }
    } catch {}

    try {
      const res = await fetch("/api/facebook-bot/link-shield", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postUrl: post.postUrl,
          postTitle: post.postTitle,
          sourceType: post.sourceType,
          targetId: post.targetId,
          targetName: post.targetName,
          cookieString: resolvedCookie || undefined,
          actionType: post.actionType || settings.actionType,
          sensitivity: settings.sensitivity,
          whitelistedDomains: settings.whitelistedDomains,
          blacklistedKeywords: settings.blacklistedKeywords,
          checkIntervalSeconds: 10,
          maxChecks: 50,
          headless: false,
        }),
      })
      const data = await res.json()
      if (data?.success && data.jobId) {
        setActiveJobId(data.jobId)
        setWatcherStatus("WATCHING")
        updateShieldPost(post.id, { watcherJobId: data.jobId, watcherStatus: "WATCHING" })
        showToast(`Live Facebook Link Shield active on "${post.postTitle}"!`)
      } else {
        setWatcherStatus("ERROR")
        setWatcherError(data?.error || "Failed to start Live Link Shield Bot")
      }
    } catch (err: any) {
      setWatcherStatus("ERROR")
      setWatcherError(err.message || "Network error launching bot")
    } finally {
      setIsStartingBot(false)
    }
  }

  const handleSaveAndStartShieldPost = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanUrl = postUrlInput.trim()
    if (!cleanUrl) return alert("অনুগ্রহ করে আপনার আসল ফেসবুক পোস্টের লিংক (URL) পেস্ট করুন।")

    let finalThumb = postThumbnailPreview
    let finalTitle = postTitleInput.trim()

    if (!finalThumb && cleanUrl.startsWith("http")) {
      try {
        setIsFetchingPreview(true)
        const res = await fetch("/api/facebook-bot/post-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: cleanUrl }),
        })
        const data = await res.json()
        if (data?.success) {
          if (data.thumbnailUrl) finalThumb = data.thumbnailUrl
          if (data.postTitle && !finalTitle) finalTitle = data.postTitle
        }
      } catch {
      } finally {
        setIsFetchingPreview(false)
      }
    }

    const created = addShieldPost({
      postUrl: cleanUrl,
      postTitle: finalTitle || `${selectedTargetName} — Protected Facebook Post`,
      postThumbnail: finalThumb || undefined,
      sourceType: postSourceTab,
      targetId: selectedTargetId,
      targetName: selectedTargetName,
      actionType: postActionType,
    })

    setShowAddPostModal(false)
    setPostUrlInput("")
    setPostTitleInput("")
    setPostThumbnailPreview("")
    setActiveTab("POSTS")

    if (created) {
      await handleStartLiveShield(created)
    }
  }

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter !== "ALL" && log.actionTaken !== actionFilter) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchSender = log.senderName.toLowerCase().includes(query)
        const matchPost = log.postTitle.toLowerCase().includes(query)
        const matchPage = log.pageOrAccountName.toLowerCase().includes(query)
        const matchComment = log.commentText.toLowerCase().includes(query)
        const matchLink = log.detectedLinks.some((l) => l.toLowerCase().includes(query))
        return matchSender || matchPost || matchPage || matchComment || matchLink
      }
      return true
    })
  }, [logs, actionFilter, searchQuery])

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Comment ID",
      "Sender Name",
      "Facebook Page / Account",
      "Post Title",
      "Comment Content",
      "Detected Link(s)",
      "Action Taken",
      "Status",
      "Latency (ms)",
      "Detected At",
    ]

    const rows = filteredLogs.map((l) => [
      `"${l.commentId}"`,
      `"${l.senderName.replace(/"/g, '""')}"`,
      `"${l.pageOrAccountName.replace(/"/g, '""')}"`,
      `"${l.postTitle.replace(/"/g, '""')}"`,
      `"${l.commentText.replace(/"/g, '""')}"`,
      `"${l.detectedLinks.join("; ")}"`,
      `"${l.actionTaken}"`,
      `"${l.graphApiStatus}"`,
      l.latencyMs,
      `"${l.detectedAt}"`,
    ])

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `bmt_link_shield_audit_logs_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast(`Exported ${filteredLogs.length} incident records to CSV!`)
  }

  // Export Excel (.xls)
  const handleExportExcel = () => {
    const headers = [
      "Comment ID",
      "Sender Name",
      "Monitored Page",
      "Post Title",
      "Comment Text",
      "Detected Link",
      "Action Taken",
      "Latency (ms)",
      "Timestamp",
    ]

    const rows = filteredLogs.map(
      (l) =>
        `<tr>
          <td>${l.commentId}</td>
          <td><b>${l.senderName}</b></td>
          <td>${l.pageOrAccountName}</td>
          <td>${l.postTitle}</td>
          <td>${l.commentText}</td>
          <td style="color: #dc2626;"><b>${l.detectedLinks.join(", ")}</b></td>
          <td><b>${l.actionTaken}</b></td>
          <td>${l.latencyMs}ms</td>
          <td>${l.detectedAt}</td>
        </tr>`
    )

    const tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"/></head>
      <body>
        <table border="1">
          <thead>
            <tr style="background-color: #dc2626; color: white; font-weight: bold;">
              ${headers.map((h) => `<th>${h}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${rows.join("")}
          </tbody>
        </table>
      </body>
      </html>
    `

    const blob = new Blob([tableHtml], { type: "application/vnd.ms-excel;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `bmt_link_shield_audit_logs_${Date.now()}.xls`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast(`Exported ${filteredLogs.length} incident records to Excel (.xls)!`)
  }

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDomain.trim()) return
    addWhitelistedDomain(newDomain)
    showToast(`Added "${newDomain.trim()}" to Whitelist Domains!`)
    setNewDomain("")
  }

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyword.trim()) return
    addBlacklistedKeyword(newKeyword)
    showToast(`Added "${newKeyword.trim()}" to Blacklist Keywords!`)
    setNewKeyword("")
  }

  const handleAddPage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPage.trim()) return
    toggleMonitoredPage(newPage.trim())
    showToast(`Added "${newPage.trim()}" to Monitored Pages!`)
    setNewPage("")
  }

  return (
    <div className="space-y-5 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-xs">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Link Comment Block Shield
            </h1>
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
              LIVE FACEBOOK BOT ({currentMode})
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            সরাসরি আপনার আসল ফেসবুক পোস্ট মনিটর করে অন্য ইউজারদের কমেন্টে থাকা স্প্যাম লিংক, ফিশিং URL বা ব্ল্যাকলিস্টেড কীওয়ার্ড অটোমেটিক <b>Delete</b> বা <b>Hide</b> করে (ওনার/Author এবং Whitelist ডোমেইন বাদে)।
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            data-testid="open-add-shield-post-btn"
            onClick={() => setShowAddPostModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Post to Shield</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-background hover:bg-muted border border-border text-foreground transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-background hover:bg-muted border border-border text-foreground transition shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Live Bot Status Banner */}
      {activeJobId && (
        <div
          className={`p-3 rounded-xl border flex flex-col gap-2 text-xs ${
            watcherStatus === "AUTH_ERROR" || watcherStatus === "ERROR"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-bold">
              {watcherStatus === "AUTH_ERROR" || watcherStatus === "ERROR" ? (
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
              )}
              <span>
                {watcherStatus === "AUTH_ERROR" || watcherStatus === "ERROR"
                  ? watcherError || "Live Shield Bot encountered an error"
                  : `🛡️ Live Facebook Link Shield Watching "${activeJobPostTitle}" — Scan #${watcherCheckCount} (Job: ${activeJobId})`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTerminalLogs((v) => !v)}
                className="px-2.5 py-1 rounded-lg border bg-background/80 text-foreground font-semibold hover:bg-background transition flex items-center gap-1"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>{showTerminalLogs ? "Hide Live Logs" : "View Live Logs"}</span>
              </button>
            </div>
          </div>

          {showTerminalLogs && watcherLogs && (
            <pre className="p-3 rounded-lg bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48 leading-relaxed border border-slate-800">
              {watcherLogs}
            </pre>
          )}
        </div>
      )}

      {/* Top Executive Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border border-border bg-card p-3.5 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Shield Status</span>
            <Shield className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  settings.isShieldActive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                }`}
              />
              <span className="text-base font-bold text-foreground">
                {settings.isShieldActive ? "24/7 ACTIVE" : "PAUSED"}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleShield}
              className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition border ${
                settings.isShieldActive
                  ? "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {settings.isShieldActive ? "Pause" : "Activate"}
            </button>
          </div>
        </div>

        <div className="border border-border bg-card p-3.5 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Protected Posts</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-foreground">{shieldPosts.length}</span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Live Browser Bot Ready
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-3.5 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Auto-Deleted / Hidden</span>
            <Trash2 className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-foreground">{metrics.totalBlocked}</span>
            <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
              Spam Links Removed
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-3.5 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Whitelisted Safe Passes</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {metrics.totalAllowed}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground">
              {settings.whitelistedDomains.length} Safe Domains
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-border pb-2 overflow-x-auto no-scrollbar flex-nowrap">
        <button
          type="button"
          data-testid="tab-shield-posts"
          onClick={() => setActiveTab("POSTS")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === "POSTS"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:text-foreground"
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Protected Facebook Posts ({shieldPosts.length})</span>
        </button>

        <button
          type="button"
          data-testid="tab-shield-logs"
          onClick={() => setActiveTab("LOGS")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === "LOGS"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Incident Ledger &amp; Audit Logs ({logs.length})</span>
        </button>

        <button
          type="button"
          data-testid="tab-shield-rules"
          onClick={() => setActiveTab("RULES")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === "RULES"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Whitelist &amp; Shield Rules</span>
        </button>

        <button
          type="button"
          data-testid="tab-shield-pages"
          onClick={() => setActiveTab("PAGES")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === "PAGES"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Monitored FB Pages ({settings.monitoredPages.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 0: PROTECTED FACEBOOK POSTS (LIVE SHIELD)            */}
      {/* ======================================================== */}
      {activeTab === "POSTS" && (
        <div className="border border-border bg-card rounded-xl shadow-xs overflow-hidden text-xs">
          <div className="p-3.5 bg-muted/40 border-b border-border flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-foreground">
                Live Protected Facebook Posts ({shieldPosts.length})
              </h3>
              <p className="text-[11px] text-muted-foreground">
                যেকোনো পোস্টের পাশে <b>▶ Watch &amp; Block Live</b> বাটনে ক্লিক করলে বট সরাসরি আপনার আসল ফেসবুক পোস্ট ওপেন করে অন্যদের লিংক কমেন্ট অটোমেটিক ডিলিট/হাইড করবে।
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddPostModal(true)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Facebook Post</span>
            </button>
          </div>

          {shieldPosts.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <Shield className="w-10 h-10 text-blue-600 mx-auto opacity-75" />
              <div className="space-y-1">
                <p className="font-bold text-sm text-foreground">
                  এখনো কোনো ফেসবুক পোস্ট শিল্ডে যুক্ত করা হয়নি
                </p>
                <p className="text-muted-foreground text-xs max-w-md mx-auto">
                  আপনার আসল ফেসবুক পোস্টের লিংক যুক্ত করে লাইভ লিংক ব্লক শিল্ড চালু করতে নিচের বাটনে ক্লিক করুন।
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPostModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Post to Shield</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-[10px] font-bold uppercase text-muted-foreground">
                    <th className="py-2.5 px-4">Facebook Post &amp; Link</th>
                    <th className="py-2.5 px-4">Channel / Account</th>
                    <th className="py-2.5 px-4">Link Action</th>
                    <th className="py-2.5 px-4">Protection Rules</th>
                    <th className="py-2.5 px-4 text-right">Live Facebook Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {shieldPosts.map((post) => {
                    const isWatchingThis =
                      activeJobId && post.watcherJobId === activeJobId && watcherStatus === "WATCHING"
                    return (
                      <tr key={post.id} className="hover:bg-muted/20 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {post.postThumbnail ? (
                              <img
                                src={post.postThumbnail}
                                alt={post.postTitle}
                                className="w-10 h-10 rounded-lg object-cover border shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                                <Shield className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-bold text-foreground truncate max-w-[260px]">
                                {post.postTitle}
                              </div>
                              <a
                                href={post.postUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-blue-500 hover:underline inline-flex items-center gap-1 truncate max-w-[260px]"
                              >
                                <span className="truncate">{post.postUrl}</span>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <span>{post.sourceType.toUpperCase()}</span>
                          </div>
                          <div className="font-semibold text-foreground mt-0.5">{post.targetName}</div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              post.actionType === "AUTO_DELETE"
                                ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            }`}
                          >
                            {post.actionType === "AUTO_DELETE"
                              ? "Auto-Delete Links"
                              : "Hide Link Comments"}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-[11px] text-muted-foreground">
                          <div>Owner/Author Links: <b className="text-emerald-500">Ignored (Safe)</b></div>
                          <div>Whitelist Domains: <b>{settings.whitelistedDomains.slice(0, 3).join(", ")}</b></div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              data-testid="start-live-shield-btn"
                              disabled={isStartingBot}
                              onClick={() => handleStartLiveShield(post)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white transition inline-flex items-center gap-1.5 cursor-pointer ${
                                isWatchingThis
                                  ? "bg-emerald-600 hover:bg-emerald-500"
                                  : "bg-rose-600 hover:bg-rose-500"
                              }`}
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>{isWatchingThis ? "Watching Live..." : "Watch & Block Live"}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteShieldPost(post.id)}
                              className="p-1.5 rounded-lg border hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition"
                              title="Remove post from shield"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: INCIDENT LEDGER & AUDIT LOGS                      */}
      {/* ======================================================== */}
      {activeTab === "LOGS" && (
        <div className="space-y-4">
          <div className="border border-border bg-card p-4 rounded-xl space-y-3 shadow-xs text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by sender, post, or detected URL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border rounded-lg bg-background text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {(
                  [
                    { id: "ALL", label: "All" },
                    { id: "AUTO_DELETED", label: "Auto-Deleted" },
                    { id: "ALLOWED_WHITELIST", label: "Whitelisted" },
                    { id: "HIDDEN", label: "Hidden" },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setActionFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap ${
                      actionFilter === f.id
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}

                {logs.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllLogs}
                    className="p-1.5 rounded-lg border hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 transition shrink-0"
                    title="Clear All Incident Logs"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="border border-border bg-card rounded-xl shadow-xs overflow-hidden text-xs">
            <div className="p-3 bg-muted/40 border-b border-border flex items-center justify-between font-semibold text-foreground">
              <span>Intercepted Comment Incidents ({filteredLogs.length})</span>
              <span className="text-[11px] text-muted-foreground font-normal">
                Real-time live Facebook comment link interception feed
              </span>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <ShieldCheck className="w-10 h-10 text-blue-600 mx-auto opacity-70" />
                <p className="font-semibold text-foreground">No incidents found</p>
                <p className="text-muted-foreground text-xs">
                  Your monitored posts are clean, or no comments match your search criteria.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/30 transition"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-bold text-sm text-foreground">{log.senderName}</span>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            log.actionTaken === "AUTO_DELETED"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                              : log.actionTaken === "HIDDEN"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                          }`}
                        >
                          {log.actionTaken === "AUTO_DELETED"
                            ? "Auto Deleted on Facebook"
                            : log.actionTaken === "HIDDEN"
                            ? "Hidden from Public"
                            : "Whitelisted Safe Pass"}
                        </span>

                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border">
                          {log.pageOrAccountName}
                        </span>

                        <span className="text-[10px] text-muted-foreground flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{log.detectedAt}</span>
                        </span>
                      </div>

                      <p className="text-[11px] text-muted-foreground bg-muted/20 p-2 rounded-lg font-mono">
                        &ldquo;{log.commentText}&rdquo;
                      </p>

                      <div className="flex items-center flex-wrap gap-2 text-[10px] pt-0.5">
                        <span className="font-semibold text-foreground">Detected Link:</span>
                        {log.detectedLinks.map((link, idx) => (
                          <span
                            key={idx}
                            className={`px-1.5 py-0.5 rounded font-mono font-medium ${
                              log.actionTaken === "ALLOWED_WHITELIST"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {link}
                          </span>
                        ))}
                      </div>

                      <div className="text-[10px] text-muted-foreground">
                        <span>
                          Post: <strong className="text-foreground">{log.postTitle}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="p-2 border rounded-xl bg-card text-center min-w-[75px] shadow-xs">
                        <span className="text-[9px] font-semibold text-muted-foreground block uppercase tracking-wider">
                          Latency
                        </span>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                          {log.latencyMs}ms
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {log.actionTaken !== "ALLOWED_WHITELIST" && log.detectedLinks[0] && (
                        <button
                          type="button"
                          onClick={() => {
                            addWhitelistedDomain(log.detectedLinks[0])
                            showToast(`Added ${log.detectedLinks[0]} to Whitelisted Domains!`)
                          }}
                          title="Add this domain to Whitelist"
                          className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold bg-background hover:bg-muted transition text-foreground min-h-[32px]"
                        >
                          + Whitelist
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => deleteLog(log.id)}
                        className="p-1.5 rounded-lg border hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 transition"
                        title="Delete this record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: WHITELIST & RULES ENGINE                          */}
      {/* ======================================================== */}
      {activeTab === "RULES" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="border border-border bg-card p-5 rounded-xl space-y-4 shadow-xs">
            <div className="flex items-center space-x-2 border-b border-border pb-3">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <div>
                <h3 className="font-bold text-sm text-foreground">Allowed Whitelist Domains</h3>
                <p className="text-[11px] text-muted-foreground">
                  এই ডোমেইনগুলোর লিংক কমেন্টে থাকলে বট কখনোই ডিলিট করবে না (যেমন আপনার নিজের ওয়েবসাইট)।
                </p>
              </div>
            </div>

            <form onSubmit={handleAddDomain} className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="e.g. yourshop.com, bmt.link"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="flex-1 px-3 py-1.5 border rounded-lg bg-background text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-xs min-h-[34px]"
              >
                + Add Domain
              </button>
            </form>

            <div className="flex flex-wrap gap-2 pt-2">
              {settings.whitelistedDomains.map((dom) => (
                <span
                  key={dom}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                >
                  <Globe className="w-3 h-3" />
                  <span>{dom}</span>
                  <button
                    type="button"
                    onClick={() => removeWhitelistedDomain(dom)}
                    className="hover:text-rose-500 transition ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="border border-border bg-card p-5 rounded-xl space-y-4 shadow-xs">
            <div className="flex items-center space-x-2 border-b border-border pb-3">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <div>
                <h3 className="font-bold text-sm text-foreground">High-Risk Phishing Keywords</h3>
                <p className="text-[11px] text-muted-foreground">
                  অন্য কারো কমেন্টে এই শব্দগুলো থাকলে সাথে সাথে কমেন্ট ডিলিট বা হাইড করে দেওয়া হবে।
                </p>
              </div>
            </div>

            <form onSubmit={handleAddKeyword} className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="e.g. crypto, t.me/, whatsapp scam"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                className="flex-1 px-3 py-1.5 border rounded-lg bg-background text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-xs min-h-[34px]"
              >
                + Add Keyword
              </button>
            </form>

            <div className="flex flex-wrap gap-2 pt-2">
              {settings.blacklistedKeywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                >
                  <span>{kw}</span>
                  <button
                    type="button"
                    onClick={() => removeBlacklistedKeyword(kw)}
                    className="hover:text-foreground transition ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="border border-border bg-card p-5 rounded-xl space-y-4 shadow-xs md:col-span-2">
            <h3 className="font-bold text-sm border-b border-border pb-2 text-foreground">
              Shield Behavior &amp; Live Facebook Action
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Action Upon Link Detection</label>
                <select
                  value={settings.actionType}
                  onChange={(e) =>
                    updateSettings({ actionType: e.target.value as "AUTO_DELETE" | "HIDE_COMMENT" })
                  }
                  className="w-full px-3 py-2 border rounded-lg bg-background text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium"
                >
                  <option value="AUTO_DELETE">
                    Permanent Delete on Facebook (Recommended)
                  </option>
                  <option value="HIDE_COMMENT">
                    Hide Comment from Public on Facebook
                  </option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Detection Sensitivity</label>
                <select
                  value={settings.sensitivity}
                  onChange={(e) =>
                    updateSettings({ sensitivity: e.target.value as "STRICT" | "STANDARD" })
                  }
                  className="w-full px-3 py-2 border rounded-lg bg-background text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium"
                >
                  <option value="STRICT">
                    Strict (All URLs, Raw Domains .com, .xyz, Shortlinks bit.ly, t.me)
                  </option>
                  <option value="STANDARD">
                    Standard (Only explicit http://, https://, www URLs)
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: MONITORED FB PAGES                                */}
      {/* ======================================================== */}
      {activeTab === "PAGES" && (
        <div className="border border-border bg-card p-5 rounded-xl space-y-4 shadow-xs text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h3 className="font-bold text-sm text-foreground">Monitored Facebook Pages &amp; Profiles</h3>
              <p className="text-[11px] text-muted-foreground">
                Protected Facebook Pages &amp; Personal IDs connected to Link Comment Block Shield.
              </p>
            </div>

            <form onSubmit={handleAddPage} className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Add page name..."
                value={newPage}
                onChange={(e) => setNewPage(e.target.value)}
                className="px-3 py-1.5 border rounded-lg bg-background text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-xs min-h-[34px]"
              >
                + Add Page
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {settings.monitoredPages.map((pageName) => (
              <div
                key={pageName}
                className="p-3.5 border border-border rounded-xl bg-muted/20 flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-sm text-foreground block">{pageName}</span>
                  <span className="text-[10px] text-emerald-500 font-semibold flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Link Shield Active</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => toggleMonitoredPage(pageName)}
                  className="p-1.5 rounded-lg border hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition"
                  title="Remove from monitoring"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADD FACEBOOK POST TO SHIELD MODAL                        */}
      {/* ======================================================== */}
      {showAddPostModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <div>
                  <h3 className="font-bold text-sm text-foreground">
                    Add Real Facebook Post to Link Shield
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    সরাসরি ফেসবুক পোস্টে অন্যদের লিংক কমেন্ট অটো-ডিলিট বা হাইড করুন
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPostModal(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAndStartShieldPost} className="space-y-3.5 text-xs">
              {/* Step 1: Channel */}
              <div className="space-y-1.5">
                <label className="font-bold text-[11px] uppercase text-muted-foreground">
                  1. Select Channel *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: "Personal ID", label: `ID (${sourceTargets["Personal ID"].length})`, icon: User },
                      { id: "Page", label: `Page (${sourceTargets.Page.length})`, icon: Globe },
                      { id: "Group", label: `Group (${sourceTargets.Group.length})`, icon: Users },
                    ] as const
                  ).map((tab) => {
                    const Icon = tab.icon
                    const isSelected = postSourceTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setPostSourceTab(tab.id)
                          const first = sourceTargets[tab.id][0]
                          if (first) {
                            setSelectedTargetId(first.id)
                            setSelectedTargetName(first.name)
                          }
                        }}
                        className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-500 shadow-xs"
                            : "bg-muted/30 text-muted-foreground hover:text-foreground border-border"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Step 2: Select Specific ID / Page / Group */}
              <div className="space-y-1.5">
                <label className="font-bold text-[11px] uppercase text-muted-foreground">
                  2. Select {postSourceTab} *
                </label>
                <select
                  value={selectedTargetId}
                  onChange={(e) => {
                    const val = e.target.value
                    setSelectedTargetId(val)
                    const found = sourceTargets[postSourceTab].find((item) => item.id === val)
                    if (found) setSelectedTargetName(found.name)
                  }}
                  className="w-full px-3 py-2 border rounded-xl bg-background text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {sourceTargets[postSourceTab].map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} — {item.sub}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: Facebook Post URL */}
              <div className="space-y-1.5">
                <label className="font-bold text-[11px] uppercase text-muted-foreground">
                  3. Facebook Post Link (URL) &amp; Label *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="url"
                    required
                    data-testid="shield-post-url-input"
                    placeholder="https://www.facebook.com/share/p/..."
                    value={postUrlInput}
                    onChange={(e) => setPostUrlInput(e.target.value)}
                    className="sm:col-span-2 px-3 py-2 border rounded-xl bg-background text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Post label (optional)"
                    value={postTitleInput}
                    onChange={(e) => setPostTitleInput(e.target.value)}
                    className="px-3 py-2 border rounded-xl bg-background text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {(isFetchingPreview || postThumbnailPreview) && (
                  <div className="p-2.5 rounded-xl border bg-muted/20 flex items-center gap-3">
                    {isFetchingPreview ? (
                      <>
                        <RefreshCw className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
                        <span className="text-[11px] text-muted-foreground">
                          Fetching real Facebook post image &amp; title...
                        </span>
                      </>
                    ) : (
                      <>
                        <img
                          src={postThumbnailPreview}
                          alt="Preview"
                          className="w-10 h-10 rounded-lg object-cover border shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-foreground truncate">
                            {postTitleInput || "Facebook Post"}
                          </div>
                          <div className="text-[10px] text-emerald-500 font-semibold">
                            ✓ Real Facebook Post Loaded
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Step 4: Action Type */}
              <div className="space-y-1.5">
                <label className="font-bold text-[11px] uppercase text-muted-foreground">
                  4. Action When Another User Posts a Link *
                </label>
                <select
                  value={postActionType}
                  onChange={(e) =>
                    setPostActionType(e.target.value as "AUTO_DELETE" | "HIDE_COMMENT")
                  }
                  className="w-full px-3 py-2 border rounded-xl bg-background text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="AUTO_DELETE">
                    Auto-Delete Comment from Facebook Post (Recommended)
                  </option>
                  <option value="HIDE_COMMENT">
                    Hide Comment from Public on Facebook Post
                  </option>
                </select>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPostModal(false)}
                  className="px-3.5 py-2 rounded-xl border hover:bg-muted font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="save-shield-post-btn"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Save &amp; Watch Live on Facebook</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
