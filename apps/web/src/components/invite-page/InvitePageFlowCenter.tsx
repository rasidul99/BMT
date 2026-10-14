"use client"

import React, { useState } from "react"
import {
  UserPlus,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Sparkles,
  Play,
  Square,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Download,
  Flame,
  ArrowRight,
  Filter,
  Sliders,
  Check,
} from "lucide-react"
import { useInvitePageFlow } from "../../hooks/useInvitePageFlow"

interface InvitePageFlowCenterProps {
  currentMode: "SAFE" | "ADVANCED"
}

export function InvitePageFlowCenter({ currentMode }: InvitePageFlowCenterProps) {
  const {
    isLoaded,
    pages,
    metrics,
    campaignRunning,
    currentStepLabel,
    progress,
    recentInvites,
    auditLogs,
    startInviteCampaign,
    stopInviteCampaign,
    resetMetrics,
    refresh,
  } = useInvitePageFlow()

  const [selectedPageId, setSelectedPageId] = useState("61560588090925-my-page")
  const [inviteMode, setInviteMode] = useState<"INVITE_FRIENDS" | "INVITE_POST_REACTORS">("INVITE_FRIENDS")
  const [batchLimit, setBatchLimit] = useState(15)
  const [activeTab, setActiveTab] = useState<"STREAM" | "AUDIT" | "GROWTH">("STREAM")
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const selectedPage = pages.find((p) => p.id === selectedPageId) || pages[0]

  const handleStartCampaign = async () => {
    showToast(`🚀 "${selectedPage?.name || "Page"}"-এ ${batchLimit} জনের ইনভাইট ক্যাম্পেইন শুরু হচ্ছে...`)
    const res = await startInviteCampaign(selectedPageId, inviteMode, batchLimit)
    if (res?.success) {
      showToast(res.message || "Invite campaign running on live Facebook!")
    } else {
      showToast(res?.error || "Failed to start campaign")
    }
  }

  const handleStopCampaign = async () => {
    await stopInviteCampaign()
    showToast("ইনভাইট ক্যাম্পেইন থামানো হয়েছে।")
  }

  const handleExportCSV = () => {
    const headers = ["Recipient Name", "Target Page", "Status", "Invited At", "Estimated Conversion"]
    const rows = recentInvites.map((inv) => [
      `"${inv.recipientName.replace(/"/g, '""')}"`,
      `"${inv.pageName.replace(/"/g, '""')}"`,
      inv.status,
      `"${inv.invitedAt}"`,
      inv.conversionRate,
    ])

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `bmt_page_invites_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast(`Exported ${recentInvites.length} invites to CSV!`)
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-blue-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Invite Page Flow & Follower Growth
            </h1>
            <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800">
              {currentMode} MODE
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
            Automated organic follower growth engine for Facebook Pages. Converts connected ID friends and post engagers into page followers with human-like random delays, daily limits, and smart scheduling.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-card hover:bg-muted border border-border text-foreground transition shadow-xs min-h-[36px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={refresh}
            className="p-2 rounded-lg border bg-card hover:bg-muted text-foreground transition min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Refresh Live Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Executive Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Total Invites Sent</span>
            <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">{metrics.totalSent}</span>
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">All Pages</span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Follower Growth (Accepted)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">{metrics.totalAccepted}</span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              +{metrics.totalAccepted} Followers
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Pending Delivery</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">{metrics.totalPending}</span>
            <span className="text-[10px] font-semibold text-muted-foreground">In Review</span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Acceptance Rate</span>
            <Flame className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {metrics.conversionRate}%
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground">High Organic ROI</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CAMPAIGN CONTROLLER & TARGET PAGE SELECTOR                */}
      {/* ======================================================== */}
      <div className="border-2 border-blue-500/30 bg-gradient-to-r from-blue-950/20 via-card to-indigo-950/20 p-4 sm:p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-border/70 pb-3.5">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="font-extrabold text-sm text-foreground">
              Live Page Follower Invite Campaign Runner
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Anti-Ban Human Jitter Mode</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Target Page Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-foreground">Target Facebook Page</label>
            <select
              value={selectedPageId}
              onChange={(e) => setSelectedPageId(e.target.value)}
              disabled={campaignRunning}
              className="w-full px-3 py-2 rounded-xl border bg-background text-xs font-bold text-foreground outline-none"
            >
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.followers.toLocaleString()} Followers)
                </option>
              ))}
            </select>
            {selectedPage && (
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 px-1">
                <span>Category: {selectedPage.category}</span>
                <a
                  href={selectedPage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline inline-flex items-center space-x-0.5"
                >
                  <span>Open Page</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Invite Source Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-foreground">Invite Source Audience</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setInviteMode("INVITE_FRIENDS")}
                disabled={campaignRunning}
                className={`p-2.5 rounded-xl border text-left transition ${
                  inviteMode === "INVITE_FRIENDS"
                    ? "bg-blue-600 text-white border-blue-600 font-bold shadow-xs"
                    : "bg-background text-muted-foreground hover:bg-muted border-border font-medium"
                }`}
              >
                <div className="text-[11px] leading-tight">Friend Audience</div>
                <div className="text-[9px] opacity-80 mt-0.5">Connected ID Friends</div>
              </button>

              <button
                type="button"
                onClick={() => setInviteMode("INVITE_POST_REACTORS")}
                disabled={campaignRunning}
                className={`p-2.5 rounded-xl border text-left transition ${
                  inviteMode === "INVITE_POST_REACTORS"
                    ? "bg-blue-600 text-white border-blue-600 font-bold shadow-xs"
                    : "bg-background text-muted-foreground hover:bg-muted border-border font-medium"
                }`}
              >
                <div className="text-[11px] leading-tight">Post Engagers</div>
                <div className="text-[9px] opacity-80 mt-0.5">Likes & Reactions</div>
              </button>
            </div>
          </div>

          {/* Daily Limit & Trigger Button */}
          <div className="space-y-1.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-foreground">Batch Limit</label>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                {batchLimit} Invites (Safe Limit)
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              {[10, 15, 25, 35].map((lim) => (
                <button
                  key={lim}
                  type="button"
                  disabled={campaignRunning}
                  onClick={() => setBatchLimit(lim)}
                  className={`flex-1 py-1 rounded-lg border font-bold text-[11px] transition ${
                    batchLimit === lim
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {lim}
                </button>
              ))}
            </div>

            <div className="pt-1">
              {campaignRunning ? (
                <button
                  onClick={handleStopCampaign}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Stop Invite Runner</span>
                </button>
              ) : (
                <button
                  onClick={handleStartCampaign}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition min-h-[40px]"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>🚀 Start Live Page Invite Flow</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Runner Status & Progress Bar */}
        {(campaignRunning || currentStepLabel) && (
          <div className="p-3.5 rounded-xl bg-background/90 border border-blue-500/30 space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-foreground">
              <div className="flex items-center space-x-2">
                <Sparkles className={`w-4 h-4 text-blue-500 ${campaignRunning ? "animate-spin" : ""}`} />
                <span>{currentStepLabel}</span>
              </div>
              <span className="text-[11px] font-black text-blue-600 dark:text-blue-400">
                {progress}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-500"
                style={{ width: `${Math.max(5, progress)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* TABS: STREAM, AUDIT, GROWTH                              */}
      {/* ======================================================== */}
      <div className="flex items-center space-x-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("STREAM")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === "STREAM"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Recent Invites Stream ({recentInvites.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("AUDIT")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === "AUDIT"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Live Audit Ledger ({auditLogs.length})</span>
        </button>
      </div>

      {activeTab === "STREAM" && (
        <div className="border border-border bg-card rounded-xl shadow-xs overflow-hidden text-xs">
          <div className="p-3 bg-muted/40 border-b border-border flex items-center justify-between font-bold text-foreground">
            <span>Invite Delivery Stream</span>
            <span className="text-[11px] text-muted-foreground font-normal">
              Targeted Page Followers Funnel
            </span>
          </div>

          {recentInvites.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              কোনো ইনভাইট রেকর্ড পাওয়া যায়নি। উপরের "Start Live Page Invite Flow" বাটনে ক্লিক করে ইনভাইট পাঠানো শুরু করুন।
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentInvites.map((inv) => (
                <div key={inv.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-muted/20">
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-foreground block">{inv.recipientName}</span>
                    <span className="text-[11px] text-muted-foreground">
                      Target: <strong className="text-foreground">{inv.pageName}</strong> • {inv.invitedAt}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2.5">
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      Est. Conversion: <strong className="text-blue-600 dark:text-blue-400">{inv.conversionRate}</strong>
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        inv.status === "Accepted"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "AUDIT" && (
        <div className="border border-border bg-card rounded-xl shadow-xs overflow-hidden text-xs font-mono">
          <div className="p-3 bg-muted/40 border-b border-border flex items-center justify-between font-bold text-foreground font-sans">
            <span>Security & Human Emulation Ledger</span>
            <span className="text-[11px] text-muted-foreground font-normal">
              Proof of Compliance & Delays
            </span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground font-sans">কোনো অডিট লগ নেই।</div>
          ) : (
            <div className="divide-y divide-border">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 flex items-center justify-between gap-3 text-[11px]">
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground">{log.timestamp}</span>
                    <span className="text-foreground font-semibold">{log.action}</span>
                    <span className="text-muted-foreground">({log.targetPage})</span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="px-2 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">
                      {log.delayApplied}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {log.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
