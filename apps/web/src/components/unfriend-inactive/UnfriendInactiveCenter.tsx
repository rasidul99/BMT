"use client"

import React, { useState } from "react"
import {
  UserMinus,
  Users,
  ShieldCheck,
  ShieldAlert,
  Play,
  Pause,
  Square,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Star,
  StarOff,
  Sliders,
  FileSpreadsheet,
  Trash2,
  Info,
  Layers,
  ArrowUpDown,
  Lock,
  Ghost,
  UserX,
  UserCheck,
  Scan,
} from "lucide-react"
import {
  useUnfriendInactive,
  InactiveFriend,
  UnfriendSettings,
  UnfriendAuditLog,
} from "../../hooks/useUnfriendInactive"

interface Props {
  currentMode: "SAFE" | "ADVANCED"
}

export function UnfriendInactiveCenter({ currentMode }: Props) {
  const {
    isLoaded,
    friends,
    settings,
    logs,
    metrics,
    runnerState,
    selectedAccountId,
    setSelectedAccountId,
    isScanning,
    runInactivityScan,
    toggleWhitelist,
    toggleQueueFriend,
    queueAllInactive,
    unfriendSingle,
    startCleanupRunner,
    pauseCleanupRunner,
    stopCleanupRunner,
    saveSettings,
    accounts,
  } = useUnfriendInactive()

  const [activeTab, setActiveTab] = useState<"detected" | "whitelisted" | "unfriended" | "settings" | "logs">("detected")
  const [inactivityFilter, setInactivityFilter] = useState<string>("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [logSearch, setLogSearch] = useState("")

  // Notification toast
  const [notification, setNotification] = useState<string | null>(null)
  const triggerNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  // Filtered friends
  const filteredFriends = friends.filter(f => {
    if (f.status === "Unfriended") return false
    if (selectedAccountId !== "All" && f.accountId !== selectedAccountId) return false
    if (inactivityFilter === "90" && f.daysInactive < 90) return false
    if (inactivityFilter === "180" && f.daysInactive < 180) return false
    if (inactivityFilter === "deactivated" && f.inactivityReason !== "Deactivated Profile") return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return f.name.toLowerCase().includes(q) || f.accountName.toLowerCase().includes(q)
    }
    return true
  })

  // Whitelisted friends
  const whitelistedFriends = friends.filter(f => f.isWhitelisted)

  // Unfriended archive
  const unfriendedFriends = friends.filter(f => f.status === "Unfriended")

  // Filtered logs
  const filteredLogs = logs.filter(l => {
    if (!logSearch.trim()) return true
    const q = logSearch.toLowerCase()
    return (
      l.targetFriendName.toLowerCase().includes(q) ||
      l.accountName.toLowerCase().includes(q) ||
      l.inactivityReason.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q)
    )
  })

  // CSV Exporters
  const exportInactiveToCSV = () => {
    const headers = ["Friend Name,Connected Account,Proxy,Days Inactive,Inactivity Reason,Engagement Score,Whitelisted,Status\n"]
    const rows = filteredFriends.map(f =>
      `"${f.name}","${f.accountName}","${f.proxyIp}","${f.daysInactive}","${f.inactivityReason}","${f.engagementScore}%","${f.isWhitelisted ? "Yes" : "No"}","${f.status}"`
    )
    const blob = new Blob([headers.concat(rows).join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `bmt_inactive_friends_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    triggerNotification("Exported Inactive Friends to CSV successfully!")
  }

  const exportAuditLogsToCSV = () => {
    const headers = ["Timestamp,Account Name,Proxy,Unfriended Friend,Days Inactive,Inactivity Reason,Status,Details\n"]
    const rows = logs.map(l =>
      `"${l.timestamp}","${l.accountName}","${l.proxyIp}","${l.targetFriendName}","${l.daysInactive}","${l.inactivityReason}","${l.status}","${l.details.replace(/"/g, '""')}"`
    )
    const blob = new Blob([headers.concat(rows).join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `bmt_unfriend_audit_logs_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    triggerNotification("Exported Unfriend Audit Ledger to CSV successfully!")
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-red-600" />
        Loading Inactive Friends Engine...
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl text-white ${currentMode === "SAFE" ? "bg-red-600 shadow-red-500/20" : "bg-orange-600 shadow-orange-500/20"} shadow-md`}>
              <UserMinus className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                Unfriend Inactive Users
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  currentMode === "SAFE" ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300" : "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300"
                }`}>
                  Module 15 • {currentMode}
                </span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Scan connected marketing accounts, detect ghost & inactive friends, protect VIP contacts, and execute safe anti-ban cleanups.
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportInactiveToCSV}
            className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
            title="Download Inactive Friends as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          {runnerState.isRunning ? (
            <>
              {runnerState.isPaused ? (
                <button
                  onClick={startCleanupRunner}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  Resume
                </button>
              ) : (
                <button
                  onClick={pauseCleanupRunner}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Pause className="w-3.5 h-3.5" />
                  Pause
                </button>
              )}
              <button
                onClick={stopCleanupRunner}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Square className="w-3.5 h-3.5" />
                Stop
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                startCleanupRunner()
                triggerNotification("Launched Inactive Friends Cleanup Runner!")
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-xs shadow-red-500/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Start Cleanup ({metrics.queuedForUnfriend} Queued)
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Detected Inactive</span>
            <Ghost className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-foreground">{metrics.totalDetected}</div>
          <div className="text-[11px] text-red-600 dark:text-red-400 font-medium mt-1">
            {metrics.over180DaysCount} friends inactive 180+ days
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Queued for Removal</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-foreground">{metrics.queuedForUnfriend}</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Daily limit: {settings.dailyUnfriendLimit} / account
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Unfriended Cleaned</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-foreground">{metrics.totalUnfriended}</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            Slots freed for targeted buyer leads
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">VIP Whitelist Protected</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-black text-foreground">{metrics.whitelistedCount}</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Protected from bulk removal
          </div>
        </div>
      </div>

      {/* Strategic Algorithm Optimization Banner */}
      <div className="border border-red-200 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/20 p-4 rounded-xl text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-red-800 dark:text-red-300">
          <Info className="w-4 h-4 shrink-0 text-red-600" />
          <span>Facebook Algorithm & 5,000 Friends Optimization Weapon</span>
        </div>
        <p className="text-red-700/90 dark:text-red-300/80 leading-relaxed">
          <strong>Why Inactive Cleanup is Critical:</strong> When your marketing account shares a post, Facebook tests initial reach on a random 5%–10% sample of friends. If that sample consists of inactive ghost accounts (0 engagement in 90+ days or deactivated profiles), initial engagement is zero, and Facebook's algorithm suppresses the post. Cleaning dead friends increases organic reach by <strong>300%–500%</strong> and frees capacity toward the 5,000 friend ceiling.
        </p>
      </div>

      {/* Live Cleanup Runner Status Box */}
      {runnerState.isRunning && (
        <div className="bg-card border border-red-300 dark:border-red-900/60 p-4 rounded-xl shadow-sm space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span>{runnerState.currentStepLabel}</span>
            </div>
            <span className="font-mono text-muted-foreground font-bold">
              {runnerState.totalUnfriendedInSession} Processed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-muted/40 p-2.5 rounded-lg border border-border">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Current Profile Being Removed</span>
              <span className="font-bold text-foreground">{runnerState.activeFriendName || "Selecting..."}</span>
            </div>
            <div className="bg-muted/40 p-2.5 rounded-lg border border-border">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Operating Account & Proxy</span>
              <span className="font-bold text-foreground">{runnerState.activeAccountName} ({runnerState.activeProxy})</span>
            </div>
          </div>

          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-red-600 rounded-full transition-all duration-300"
              style={{ width: `${runnerState.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border space-x-1 overflow-x-auto text-xs font-medium no-scrollbar">
        <button
          onClick={() => setActiveTab("detected")}
          className={`px-3.5 py-2.5 border-b-2 font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === "detected"
              ? "border-red-600 text-red-600 dark:text-red-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Ghost className="w-3.5 h-3.5" />
          <span>Detected Inactive ({filteredFriends.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("whitelisted")}
          className={`px-3.5 py-2.5 border-b-2 font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === "whitelisted"
              ? "border-red-600 text-red-600 dark:text-red-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>VIP Whitelist ({whitelistedFriends.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("unfriended")}
          className={`px-3.5 py-2.5 border-b-2 font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === "unfriended"
              ? "border-red-600 text-red-600 dark:text-red-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Unfriended Archive ({unfriendedFriends.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`px-3.5 py-2.5 border-b-2 font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === "settings"
              ? "border-red-600 text-red-600 dark:text-red-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Cleanup Settings & Anti-Ban</span>
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          className={`px-3.5 py-2.5 border-b-2 font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === "logs"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          <span>Audit Ledger (CSV)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
            {logs.length}
          </span>
        </button>
      </div>

      {/* TAB 1: Detected Inactive Friends */}
      {activeTab === "detected" && (
        <div className="space-y-4">
          {/* Controls & Filter Bar */}
          <div className="bg-card border border-border p-4 rounded-xl shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                {/* Search */}
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by friend or account..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600"
                  />
                </div>

                {/* Account selector */}
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none"
                >
                  <option value="All">All Marketing Accounts</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>

                {/* Inactivity Threshold Filter */}
                <select
                  value={inactivityFilter}
                  onChange={(e) => setInactivityFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none"
                >
                  <option value="All">All Inactivity Durations</option>
                  <option value="90">90+ Days Inactive</option>
                  <option value="180">180+ Days Inactive</option>
                  <option value="deactivated">Deactivated Profiles Only</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => runInactivityScan()}
                  disabled={isScanning}
                  className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-lg text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Scan className={`w-3.5 h-3.5 text-blue-600 ${isScanning ? "animate-spin" : ""}`} />
                  <span>{isScanning ? "Scanning Account..." : "Scan Friends"}</span>
                </button>

                <button
                  onClick={() => {
                    const detectedIds = filteredFriends.filter(f => f.status === "Detected").map(f => f.id)
                    queueAllInactive(detectedIds)
                    triggerNotification(`Queued ${detectedIds.length} inactive friends for cleanup!`)
                  }}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Queue Filtered ({filteredFriends.filter(f => f.status === "Detected").length})
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="p-3 w-10">Queue</th>
                  <th className="p-3">Friend Name</th>
                  <th className="p-3">Marketing Account</th>
                  <th className="p-3">Inactivity Reason</th>
                  <th className="p-3">Days Inactive</th>
                  <th className="p-3">Engagement</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredFriends.map((friend) => {
                  const isQueued = friend.status === "Queued" || friend.status === "Unfriending"
                  return (
                    <tr
                      key={friend.id}
                      className={`hover:bg-muted/30 transition ${
                        isQueued ? "bg-red-50/15 dark:bg-red-950/15" : ""
                      }`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isQueued}
                          disabled={friend.isWhitelisted}
                          onChange={() => toggleQueueFriend(friend.id)}
                          className="rounded border-border text-red-600"
                        />
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={friend.avatarUrl}
                            alt={friend.name}
                            className="w-8 h-8 rounded-full object-cover border border-border"
                          />
                          <div>
                            <div className="font-bold text-foreground flex items-center gap-1.5">
                              <span>{friend.name}</span>
                              {friend.isWhitelisted && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold">
                                  VIP Whitelisted
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              Last interaction: {friend.lastInteractionDate}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 font-medium text-foreground">
                        {friend.accountName}
                      </td>

                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          friend.inactivityReason === "Deactivated Profile"
                            ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                            : friend.daysInactive >= 180
                            ? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {friend.inactivityReason}
                        </span>
                      </td>

                      <td className="p-3 font-mono font-bold text-red-600 dark:text-red-400">
                        {friend.daysInactive} days
                      </td>

                      <td className="p-3 font-mono text-muted-foreground">
                        {friend.engagementScore}%
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              toggleWhitelist(friend.id)
                              triggerNotification(
                                friend.isWhitelisted
                                  ? `Removed ${friend.name} from VIP Whitelist`
                                  : `Added ${friend.name} to VIP Whitelist!`
                              )
                            }}
                            className={`p-1.5 rounded-lg border transition ${
                              friend.isWhitelisted
                                ? "border-amber-300 bg-amber-50 text-amber-600 dark:bg-amber-950/40"
                                : "border-border text-muted-foreground hover:text-amber-500"
                            }`}
                            title={friend.isWhitelisted ? "Remove from VIP Whitelist" : "Protect with VIP Whitelist"}
                          >
                            <Star className={`w-3.5 h-3.5 ${friend.isWhitelisted ? "fill-amber-500" : ""}`} />
                          </button>

                          <button
                            onClick={() => {
                              unfriendSingle(friend.id)
                              triggerNotification(`Unfriended ${friend.name} successfully!`)
                            }}
                            className="px-2.5 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded font-semibold text-xs transition"
                          >
                            Unfriend
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredFriends.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No inactive friends found matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: VIP Whitelist */}
      {activeTab === "whitelisted" && (
        <div className="space-y-4">
          <div className="bg-card border border-border p-4 rounded-xl shadow-xs space-y-1">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              VIP Protected Whitelist
            </h3>
            <p className="text-xs text-muted-foreground">
              Friends added to the whitelist are permanently protected from all bulk unfriend operations. Perfect for family, close business partners, or high-value clients.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {whitelistedFriends.map(friend => (
              <div key={friend.id} className="bg-card border border-amber-200 dark:border-amber-900/60 p-4 rounded-xl shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img src={friend.avatarUrl} alt={friend.name} className="w-9 h-9 rounded-full object-cover border border-amber-300" />
                  <div>
                    <span className="font-bold text-xs text-foreground block">{friend.name}</span>
                    <span className="text-[10px] text-muted-foreground">{friend.accountName}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    toggleWhitelist(friend.id)
                    triggerNotification(`Removed ${friend.name} from VIP Whitelist`)
                  }}
                  className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                  title="Remove from Whitelist"
                >
                  <StarOff className="w-4 h-4" />
                </button>
              </div>
            ))}
            {whitelistedFriends.length === 0 && (
              <div className="col-span-3 p-8 text-center text-muted-foreground bg-card border border-border rounded-xl">
                No friends whitelisted yet. Star any friend in the "Detected Inactive" tab to protect them.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Unfriended Archive */}
      {activeTab === "unfriended" && (
        <div className="space-y-4">
          <div className="bg-card border border-border p-4 rounded-xl shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Unfriended Archive & Freed Capacity
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                History of all inactive profiles removed across connected marketing accounts.
              </p>
            </div>

            <button
              onClick={exportAuditLogsToCSV}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Download Unfriend Report (.CSV)
            </button>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="p-3">Removed Friend</th>
                  <th className="p-3">Marketing Account</th>
                  <th className="p-3">Proxy Session</th>
                  <th className="p-3">Inactivity Reason</th>
                  <th className="p-3">Unfriended At</th>
                  <th className="p-3 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {unfriendedFriends.map(friend => (
                  <tr key={friend.id} className="hover:bg-muted/30 transition">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <img src={friend.avatarUrl} alt={friend.name} className="w-7 h-7 rounded-full object-cover" />
                        <span className="font-bold text-foreground">{friend.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-foreground font-medium">{friend.accountName}</td>
                    <td className="p-3 font-mono text-muted-foreground text-[11px]">{friend.proxyIp}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-semibold">
                        {friend.inactivityReason}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{friend.unfriendedAt}</td>
                    <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      Cleaned ✓
                    </td>
                  </tr>
                ))}
                {unfriendedFriends.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                      No friends unfriended yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Safety & Limits */}
      {activeTab === "settings" && (
        <div className="bg-card border border-border p-6 rounded-xl shadow-xs space-y-6 max-w-4xl">
          <div>
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Sliders className="w-4 h-4 text-red-600" />
              Anti-Ban Pacing & Safety Settings
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Prevent Meta rate-limiting and account checkpointing by pacing unfriend actions with randomized intervals.
            </p>
          </div>

          <div className="space-y-4 border-t border-border pt-4">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              1. Daily Removal Limit
            </h4>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Daily Maximum Unfriends / Account</span>
                <span className="font-mono text-red-600 font-bold">{settings.dailyUnfriendLimit} friends/day</span>
              </label>
              <input
                type="range"
                min={10}
                max={60}
                step={5}
                value={settings.dailyUnfriendLimit}
                onChange={(e) => saveSettings({ ...settings, dailyUnfriendLimit: Number(e.target.value) })}
                className="w-full accent-red-600"
              />
              <p className="text-[11px] text-muted-foreground">
                Recommended: 25–35 per day. Facebook flags sudden drops of 100+ friends within hours.
              </p>
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              2. Anti-Detection Delay Profiles
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => saveSettings({ ...settings, delaySpeed: "safe_slow" })}
                className={`p-3.5 rounded-xl border text-left space-y-1 transition ${
                  settings.delaySpeed === "safe_slow"
                    ? "border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20"
                    : "border-border hover:border-border/80"
                }`}
              >
                <div className="font-bold text-xs text-foreground flex items-center justify-between">
                  <span>🐢 Ultra Safe (45–90s)</span>
                  {settings.delaySpeed === "safe_slow" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <div className="text-[11px] text-muted-foreground">45s–90s random delay per unfriend. Best for sensitive accounts.</div>
              </button>

              <button
                type="button"
                onClick={() => saveSettings({ ...settings, delaySpeed: "normal" })}
                className={`p-3.5 rounded-xl border text-left space-y-1 transition ${
                  settings.delaySpeed === "normal"
                    ? "border-blue-600 bg-blue-50/30 dark:bg-blue-950/20"
                    : "border-border hover:border-border/80"
                }`}
              >
                <div className="font-bold text-xs text-foreground flex items-center justify-between">
                  <span>⚖️ Moderate (20–45s)</span>
                  {settings.delaySpeed === "normal" && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                </div>
                <div className="text-[11px] text-muted-foreground">20s–45s random delay. Recommended for daily agency operation.</div>
              </button>

              <button
                type="button"
                onClick={() => saveSettings({ ...settings, delaySpeed: "demo_fast" })}
                className={`p-3.5 rounded-xl border text-left space-y-1 transition ${
                  settings.delaySpeed === "demo_fast"
                    ? "border-purple-600 bg-purple-50/30 dark:bg-purple-950/20"
                    : "border-border hover:border-border/80"
                }`}
              >
                <div className="font-bold text-xs text-foreground flex items-center justify-between">
                  <span>⚡ Demo Fast (3–8s)</span>
                  {settings.delaySpeed === "demo_fast" && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
                </div>
                <div className="text-[11px] text-muted-foreground">Rapid testing speed. Ideal for testing UI and live progress bar.</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Audit Ledger */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          <div className="bg-card border border-border p-4 rounded-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search unfriend records..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none"
              />
            </div>

            <button
              onClick={exportAuditLogsToCSV}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Download Audit Ledger (.CSV)
            </button>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Target Friend</th>
                  <th className="p-3">Operating Account</th>
                  <th className="p-3">Inactivity Reason</th>
                  <th className="p-3">Execution Details</th>
                  <th className="p-3 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-[11px]">
                {filteredLogs.map(lg => (
                  <tr key={lg.id} className="hover:bg-muted/30 transition">
                    <td className="p-3 text-muted-foreground whitespace-nowrap">{lg.timestamp}</td>
                    <td className="p-3 font-sans font-bold text-foreground">{lg.targetFriendName}</td>
                    <td className="p-3 font-sans">
                      <span className="font-semibold block">{lg.accountName}</span>
                      <span className="text-[10px] text-muted-foreground">{lg.proxyIp}</span>
                    </td>
                    <td className="p-3 font-sans">
                      <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-semibold">
                        {lg.inactivityReason}
                      </span>
                    </td>
                    <td className="p-3 font-sans text-muted-foreground max-w-xs truncate" title={lg.details}>
                      {lg.details}
                    </td>
                    <td className="p-3 text-right font-sans font-bold text-emerald-600 dark:text-emerald-400">
                      {lg.status} ✓
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground font-sans">
                      No logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
