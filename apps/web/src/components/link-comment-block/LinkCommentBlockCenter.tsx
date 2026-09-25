"use client"

import React, { useState, useMemo } from "react"
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
  RotateCcw,
  Globe,
  Sliders,
  Sparkles,
  Layers,
  Lock,
  Clock,
  Send,
  EyeOff,
} from "lucide-react"
import {
  useLinkCommentBlock,
  BlockedCommentLog,
} from "../../hooks/useLinkCommentBlock"

interface LinkCommentBlockCenterProps {
  currentMode: "SAFE" | "ADVANCED"
}

export function LinkCommentBlockCenter({ currentMode }: LinkCommentBlockCenterProps) {
  const {
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
  } = useLinkCommentBlock()

  const [activeTab, setActiveTab] = useState<"LOGS" | "RULES" | "PAGES">("LOGS")
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState<"ALL" | "AUTO_DELETED" | "HIDDEN" | "ALLOWED_WHITELIST">("ALL")
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Whitelist / Blacklist inputs
  const [newDomain, setNewDomain] = useState("")
  const [newKeyword, setNewKeyword] = useState("")
  const [newPage, setNewPage] = useState("")

  // Simulation Modal
  const [isSimModalOpen, setIsSimModalOpen] = useState(false)
  const [simSender, setSimSender] = useState("Spam Bot 2026")
  const [simPage, setSimPage] = useState("Fashion Hub Official")
  const [simPost, setSimPost] = useState("Eid Special Premium Watch Collection Offer 2026")
  const [simComment, setSimComment] = useState("Claim free watch here: https://phishing-site.xyz/free-gift")
  const [simResult, setSimResult] = useState<{
    detectedLinks: string[]
    action: string
    reason: string
  } | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
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
      "Graph API Status",
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

  const handleRunSimulation = (e: React.FormEvent) => {
    e.preventDefault()
    if (!simComment.trim()) return

    const result = processIncomingComment(
      simComment.trim(),
      simSender.trim() || "Spam Bot",
      simPost.trim() || "Promotional Post",
      simPage
    )

    setSimResult(result)
    if (result.action === "AUTO_DELETED") {
      showToast("Intercepted! Link comment was automatically DELETED via Graph API.")
    } else if (result.action === "HIDDEN") {
      showToast("Intercepted! Link comment was HIDDEN via Graph API.")
    } else if (result.action === "ALLOWED_WHITELIST") {
      showToast("Allowed! Link matched Whitelisted Domain.")
    } else {
      showToast("Clean comment! No link or spam detected.")
    }
  }

  const quickPresets = [
    {
      label: "Phishing Scam Link",
      comment: "Huge 80% discount here: https://phishing-offer-scam.xyz/claim-now",
    },
    {
      label: "Telegram Group Invite",
      comment: "Join our official VIP channel for daily signals: t.me/crypto_vip_daily",
    },
    {
      label: "WhatsApp Number Link",
      comment: "Inbox me for wholesale prices: wa.me/8801811223344",
    },
    {
      label: "Whitelisted Safe Domain",
      comment: "Please check official product specifications here: https://bmt.link/spec",
    },
  ]

  return (
    <div className="space-y-6 pb-20">
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
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Link Comment Block Shield
            </h1>
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
              {currentMode} PROTECTION
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-2xl">
            Real-time automated comment interceptor. Detects spam links, phishing URLs, and competitor hijacking on your connected
            Facebook Pages & Accounts, and instantly deletes them via official Graph API (<code>DELETE /&#123;comment-id&#125;</code>).
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => {
              setSimResult(null)
              setIsSimModalOpen(true)
            }}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs min-h-[36px]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Test Comment Simulator</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-background hover:bg-muted border border-border text-foreground transition shadow-xs min-h-[36px]"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-background hover:bg-muted border border-border text-foreground transition shadow-xs min-h-[36px]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Top Executive Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Shield Status */}
        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Shield Status</span>
            <Shield className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  settings.isShieldActive ? "bg-blue-600 animate-pulse" : "bg-muted-foreground"
                }`}
              />
              <span className="text-base font-bold text-foreground">
                {settings.isShieldActive ? "24/7 ACTIVE" : "PAUSED"}
              </span>
            </div>
            <button
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

        {/* Deleted Links */}
        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Auto-Deleted Comments</span>
            <Trash2 className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-foreground">
              {metrics.totalDeleted}
            </span>
            <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
              100% Graph API Verified
            </span>
          </div>
        </div>

        {/* Whitelist Allowed */}
        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Whitelisted Safe Passes</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {metrics.totalAllowed}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground">
              {settings.whitelistedDomains.length} Domains Active
            </span>
          </div>
        </div>

        {/* Average Latency */}
        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Average Deletion Latency</span>
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-foreground">
              {metrics.avgLatencyMs} ms
            </span>
            <span className="text-[10px] font-medium text-muted-foreground">
              &lt; 1.0s Speed
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-border pb-2 overflow-x-auto no-scrollbar flex-nowrap">
        <button
          onClick={() => setActiveTab("LOGS")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap ${
            activeTab === "LOGS"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Incident Ledger & Audit Logs ({logs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("RULES")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap ${
            activeTab === "RULES"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Whitelist & Shield Rules</span>
        </button>

        <button
          onClick={() => setActiveTab("PAGES")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap ${
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
      {/* TAB 1: INCIDENT LEDGER & AUDIT LOGS                      */}
      {/* ======================================================== */}
      {activeTab === "LOGS" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="border border-border bg-card p-4 rounded-xl space-y-3 shadow-xs text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search */}
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

              {/* Action Filter */}
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

          {/* Incident Table / List */}
          <div className="border border-border bg-card rounded-xl shadow-xs overflow-hidden text-xs">
            <div className="p-3 bg-muted/40 border-b border-border flex items-center justify-between font-semibold text-foreground">
              <span>Intercepted Comment Incidents ({filteredLogs.length})</span>
              <span className="text-[11px] text-muted-foreground font-normal">
                Real-time Graph API webhook interception feed
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
                    {/* Left: Info */}
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
                            ? "Auto Deleted (Graph API)"
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

                      {/* Comment text */}
                      <p className="text-[11px] text-muted-foreground bg-muted/20 p-2 rounded-lg font-mono">
                        "{log.commentText}"
                      </p>

                      {/* Detected Links */}
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
                        <span>Post: <strong className="text-foreground">{log.postTitle}</strong></span>
                      </div>
                    </div>

                    {/* Middle: Latency & Graph API Status */}
                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="p-2 border rounded-xl bg-card text-center min-w-[85px] shadow-xs">
                        <span className="text-[9px] font-semibold text-muted-foreground block uppercase tracking-wider">
                          Graph API
                        </span>
                        <span className="text-xs font-bold text-foreground">
                          {log.graphApiStatus}
                        </span>
                      </div>

                      <div className="p-2 border rounded-xl bg-card text-center min-w-[75px] shadow-xs">
                        <span className="text-[9px] font-semibold text-muted-foreground block uppercase tracking-wider">
                          Latency
                        </span>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                          {log.latencyMs}ms
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center space-x-2 shrink-0">
                      {log.actionTaken !== "ALLOWED_WHITELIST" && log.detectedLinks[0] && (
                        <button
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
          {/* Allowed Whitelist Domains */}
          <div className="border border-border bg-card p-5 rounded-xl space-y-4 shadow-xs">
            <div className="flex items-center space-x-2 border-b border-border pb-3">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <div>
                <h3 className="font-bold text-sm text-foreground">Allowed Whitelist Domains</h3>
                <p className="text-[11px] text-muted-foreground">
                  Comments containing these domains will NEVER be deleted (your own website, affiliate links, etc.)
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
                    onClick={() => removeWhitelistedDomain(dom)}
                    className="hover:text-rose-500 transition ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Blacklisted Keywords */}
          <div className="border border-border bg-card p-5 rounded-xl space-y-4 shadow-xs">
            <div className="flex items-center space-x-2 border-b border-border pb-3">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <div>
                <h3 className="font-bold text-sm text-foreground">High-Risk Phishing Keywords</h3>
                <p className="text-[11px] text-muted-foreground">
                  Any comment containing these keywords will be immediately intercepted and deleted.
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
                    onClick={() => removeBlacklistedKeyword(kw)}
                    className="hover:text-foreground transition ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Interception Action & Sensitivity Settings */}
          <div className="border border-border bg-card p-5 rounded-xl space-y-4 shadow-xs md:col-span-2">
            <h3 className="font-bold text-sm border-b border-border pb-2 text-foreground">
              Shield Behavior &amp; Graph API Action
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
                    Permanent Delete (DELETE /&#123;comment-id&#125; - Recommended)
                  </option>
                  <option value="HIDE_COMMENT">
                    Hide Comment (POST /&#123;comment-id&#125;?is_hidden=true)
                  </option>
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Permanent deletion completely removes the spam comment from Facebook servers.
                </p>
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
                  <option value="STRICT">Strict (All URLs, Raw Domains .com, .xyz, Shortlinks)</option>
                  <option value="STANDARD">Standard (Only explicit http://, https://, www URLs)</option>
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Strict mode prevents spammers from evading detection using disguised shortlinks like <code>bit.ly</code> or <code>t.me</code>.
                </p>
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
                All posts made on these connected accounts will be monitored 24/7 via real-time Webhook subscriptions.
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
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                    <span>Webhook Active (24/7)</span>
                  </span>
                </div>

                <button
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
      {/* SIMULATE TEST COMMENT MODAL                              */}
      {/* ======================================================== */}
      {isSimModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-foreground">
                  Simulate Live Comment Interception
                </h3>
              </div>
              <button
                onClick={() => setIsSimModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground block">
                Quick Test Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickPresets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setSimComment(p.comment)}
                    className="px-2.5 py-1 rounded-lg border text-[11px] font-semibold hover:bg-muted text-foreground transition"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleRunSimulation} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Sender Name</label>
                <input
                  type="text"
                  value={simSender}
                  onChange={(e) => setSimSender(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Comment Body</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Type any comment containing a link..."
                  value={simComment}
                  onChange={(e) => setSimComment(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              {simResult && (
                <div
                  className={`p-3 rounded-xl border space-y-1 ${
                    simResult.action === "AUTO_DELETED"
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                      : simResult.action === "HIDDEN"
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                      : simResult.action === "ALLOWED_WHITELIST"
                      ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
                      : "bg-muted border text-foreground"
                  }`}
                >
                  <div className="font-bold text-xs flex items-center space-x-1.5">
                    {simResult.action === "AUTO_DELETED" && <Trash2 className="w-4 h-4" />}
                    {simResult.action === "ALLOWED_WHITELIST" && <ShieldCheck className="w-4 h-4" />}
                    <span>Result: {simResult.action}</span>
                  </div>
                  <p className="text-[11px] font-medium">{simResult.reason}</p>
                  {simResult.detectedLinks.length > 0 && (
                    <div className="text-[10px] pt-1">
                      Detected: <b>{simResult.detectedLinks.join(", ")}</b>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 border-t border-border flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsSimModalOpen(false)}
                  className="px-4 py-2 rounded-lg border hover:bg-muted font-semibold text-xs transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition min-h-[36px]"
                >
                  Intercept Comment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
