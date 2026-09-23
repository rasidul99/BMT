"use client"

import React, { useState } from "react"
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
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
  Eye,
  Heart,
  ScrollText,
  Sliders,
  FileSpreadsheet,
  Plus,
  Trash2,
  Info,
  Layers,
  ArrowUpDown,
  Lock,
} from "lucide-react"
import {
  useFriendAutomation,
  TargetLead,
  IncomingFriendRequest,
  FriendAutomationSettings,
  FriendExecutionLog,
} from "../../hooks/useFriendAutomation"

interface Props {
  currentMode: "SAFE" | "ADVANCED"
}

export function FriendAutomationCenter({ currentMode }: Props) {
  const {
    isLoaded,
    leads,
    incoming,
    settings,
    logs,
    metrics,
    runnerState,
    selectedAccountIds,
    setSelectedAccountIds,
    saveSettings,
    toggleQueueLead,
    queueAllFiltered,
    addNewCustomLead,
    cancelSentRequest,
    acceptIncoming,
    rejectIncoming,
    batchAcceptQualified,
    startRunner,
    pauseRunner,
    stopRunner,
    accounts,
  } = useFriendAutomation()

  const [activeTab, setActiveTab] = useState<"leads" | "outgoing" | "incoming" | "sent" | "settings" | "logs">("leads")

  // Lead filters
  const [leadCountry, setLeadCountry] = useState("All")
  const [leadGender, setLeadGender] = useState("All")
  const [leadNiche, setLeadNiche] = useState("All")
  const [leadSearch, setLeadSearch] = useState("")

  // Add lead modal
  const [showAddLeadModal, setShowAddLeadModal] = useState(false)
  const [newLeadName, setNewLeadName] = useState("")
  const [newLeadUrl, setNewLeadUrl] = useState("")
  const [newLeadCountry, setNewLeadCountry] = useState("Bangladesh")
  const [newLeadCity, setNewLeadCity] = useState("Dhaka")
  const [newLeadGender, setNewLeadGender] = useState<"Female" | "Male">("Female")
  const [newLeadNiche, setNewLeadNiche] = useState<TargetLead["niche"]>("E-Commerce & Shopping")

  // Log search
  const [logSearch, setLogSearch] = useState("")

  // Notification badge
  const [notification, setNotification] = useState<string | null>(null)
  const triggerNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  // Filtered leads
  const filteredLeads = leads.filter(l => {
    if (leadCountry !== "All" && l.country !== leadCountry) return false
    if (leadGender !== "All" && l.gender !== leadGender) return false
    if (leadNiche !== "All" && l.niche !== leadNiche) return false
    if (leadSearch.trim()) {
      const q = leadSearch.toLowerCase()
      return l.name.toLowerCase().includes(q) || l.city.toLowerCase().includes(q)
    }
    return true
  })

  // Sent leads (pending or delivered)
  const sentLeads = leads.filter(l => l.status === "Sent" || l.status === "Accepted" || l.status === "Cancelled")

  // Filtered logs
  const filteredLogs = logs.filter(lg => {
    if (!logSearch.trim()) return true
    const q = logSearch.toLowerCase()
    return (
      lg.targetProfileName.toLowerCase().includes(q) ||
      lg.accountName.toLowerCase().includes(q) ||
      lg.action.toLowerCase().includes(q) ||
      lg.details.toLowerCase().includes(q)
    )
  })

  const handleCreateCustomLead = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLeadName.trim()) return

    addNewCustomLead({
      name: newLeadName.trim(),
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
      profileUrl: newLeadUrl.trim() || `https://facebook.com/${newLeadName.toLowerCase().replace(/\s+/g, ".")}`,
      country: newLeadCountry,
      city: newLeadCity,
      age: 25,
      gender: newLeadGender,
      niche: newLeadNiche,
      mutualFriends: Math.floor(Math.random() * 15) + 3,
      engagementScore: 88,
    })

    setShowAddLeadModal(false)
    setNewLeadName("")
    setNewLeadUrl("")
    triggerNotification(`Added lead "${newLeadName}" to target discovery database!`)
  }

  const exportLogsToCSV = () => {
    const headers = ["Timestamp,Account Name,Proxy,Target Profile,Action,Status,Details\n"]
    const rows = logs.map(l =>
      `"${l.timestamp}","${l.accountName}","${l.proxyIp}","${l.targetProfileName}","${l.action}","${l.status}","${l.details.replace(/"/g, '""')}"`
    )
    const blob = new Blob([headers.concat(rows).join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `bmt_friend_automation_logs_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    triggerNotification("Exported audit ledger to CSV successfully!")
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-blue-600" />
        Loading Friend Automation Engine...
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
            <div className={`p-2 rounded-xl text-white ${currentMode === "SAFE" ? "bg-blue-600 shadow-blue-500/20" : "bg-orange-600 shadow-orange-500/20"} shadow-md`}>
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                Friend Request & Auto-Accept Engine
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  currentMode === "SAFE" ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300" : "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300"
                }`}>
                  Module 14 • {currentMode}
                </span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Target audience profile discovery, automated friend requests, auto-accepting qualified leads, and human behavior simulation.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Launch / Stop Runner Buttons */}
        <div className="flex items-center gap-2">
          {runnerState.isRunning ? (
            <>
              {runnerState.isPaused ? (
                <button
                  onClick={startRunner}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  Resume
                </button>
              ) : (
                <button
                  onClick={pauseRunner}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Pause className="w-3.5 h-3.5" />
                  Pause
                </button>
              )}
              <button
                onClick={stopRunner}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Square className="w-3.5 h-3.5" />
                Stop
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setActiveTab("outgoing")
                startRunner()
                triggerNotification("Launched Friend Automation Engine with human simulation!")
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-xs shadow-blue-500/20"
            >
              <Play className="w-3.5 h-3.5" />
              Launch Automation ({metrics.queuedLeads} Queued)
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Target Leads</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-foreground">{metrics.totalLeads}</div>
          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1">
            {metrics.queuedLeads} currently in outgoing queue
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Requests Sent</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-foreground">{metrics.sentToday}</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Daily limit: {metrics.totalDailyCapacity} across {metrics.activeAccountsCount} accounts
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Incoming Requests</span>
            <UserPlus className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-foreground">{metrics.pendingIncoming}</div>
          <div className="text-[11px] text-purple-600 dark:text-purple-400 font-medium mt-1">
            {metrics.acceptedIncoming} auto-accepted today
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Anti-Ban Protection</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Human Simulation Active
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Profile View • Feed Scroll • Like
          </div>
        </div>
      </div>

      {/* Strategic Reality & Anti-Detection Banner */}
      <div className="border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/20 p-4 rounded-xl text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300">
          <Info className="w-4 h-4 shrink-0 text-blue-600" />
          <span>Meta Platform Architecture Reality & Anti-Ban Human Simulation Strategy</span>
        </div>
        <p className="text-blue-700/90 dark:text-blue-300/80 leading-relaxed">
          <strong>Official Meta Graph API Restriction:</strong> Meta strictly reserves friend request actions for authenticated personal browser sessions and provides no public Graph API endpoint to send friend requests. Professional growth marketers operate via <strong>Cookie Sessions + Residential 4G Proxies</strong> with genuine <strong>Human Behavior Simulation</strong> (Profile View 10–25s ➔ Timeline Scroll 15–35s ➔ Like Recent Post ➔ Randomized pause) to maintain 100% account safety and zero spam flags.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border space-x-1 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab("leads")}
          className={`px-4 py-2.5 border-b-2 font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === "leads"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          Target Audience & Lead Studio ({filteredLeads.length})
        </button>

        <button
          onClick={() => setActiveTab("outgoing")}
          className={`px-4 py-2.5 border-b-2 font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === "outgoing"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          Outgoing Request Runner
          {metrics.queuedLeads > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-600 text-white font-bold">
              {metrics.queuedLeads}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("incoming")}
          className={`px-4 py-2.5 border-b-2 font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === "incoming"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          Auto-Accept Engine ({metrics.pendingIncoming})
        </button>

        <button
          onClick={() => setActiveTab("sent")}
          className={`px-4 py-2.5 border-b-2 font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === "sent"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Sent Backlog & Cancel Manager ({sentLeads.length})
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2.5 border-b-2 font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === "settings"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Safety Limits & Delays
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2.5 border-b-2 font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === "logs"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Audit Ledger ({logs.length})
        </button>
      </div>

      {/* TAB 1: Target Audience Discovery & Lead Finder */}
      {activeTab === "leads" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-card border border-border p-4 rounded-xl shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                {/* Search */}
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name or city..."
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                {/* Country Filter */}
                <select
                  value={leadCountry}
                  onChange={(e) => setLeadCountry(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none"
                >
                  <option value="All">All Countries</option>
                  <option value="Bangladesh">Bangladesh</option>
                  <option value="USA">USA</option>
                  <option value="UK">UK</option>
                </select>

                {/* Gender Filter */}
                <select
                  value={leadGender}
                  onChange={(e) => setLeadGender(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none"
                >
                  <option value="All">All Genders</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>

                {/* Niche Filter */}
                <select
                  value={leadNiche}
                  onChange={(e) => setLeadNiche(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none"
                >
                  <option value="All">All Niches</option>
                  <option value="Online Business / Marketing">Online Business / Marketing</option>
                  <option value="E-Commerce & Shopping">E-Commerce & Shopping</option>
                  <option value="Fashion & Beauty">Fashion & Beauty</option>
                  <option value="Gadgets & Tech">Gadgets & Tech</option>
                  <option value="Freelancing & Remote Work">Freelancing & Remote Work</option>
                </select>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => {
                    const discoveredIds = filteredLeads.filter(l => l.status === "Discovered").map(l => l.id)
                    queueAllFiltered(discoveredIds)
                    triggerNotification(`Added ${discoveredIds.length} leads to Outgoing Queue!`)
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Queue Filtered ({filteredLeads.filter(l => l.status === "Discovered").length})
                </button>

                <button
                  onClick={() => setShowAddLeadModal(true)}
                  className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Custom Lead
                </button>
              </div>
            </div>
          </div>

          {/* Leads Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLeads.map((lead) => {
              const isQueued = lead.status === "Queued" || lead.status === "Simulating"
              const isSent = lead.status === "Sent"
              return (
                <div
                  key={lead.id}
                  className={`bg-card border rounded-xl p-4 shadow-xs transition flex flex-col justify-between ${
                    isQueued
                      ? "border-blue-500/50 bg-blue-50/10 dark:bg-blue-950/10"
                      : isSent
                      ? "border-emerald-500/50 bg-emerald-50/10 dark:bg-emerald-950/10 opacity-80"
                      : "border-border hover:border-border/80"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Avatar & Name */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={lead.avatarUrl}
                          alt={lead.name}
                          className="w-11 h-11 rounded-full object-cover border border-border"
                        />
                        <div>
                          <a
                            href={lead.profileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold text-xs text-foreground hover:text-blue-600 flex items-center gap-1 transition"
                          >
                            <span>{lead.name}</span>
                            <ExternalLink className="w-3 h-3 text-muted-foreground" />
                          </a>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <span>{lead.city}, {lead.country}</span>
                            <span>•</span>
                            <span>{lead.age}y, {lead.gender}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          lead.status === "Queued"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                            : lead.status === "Simulating"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 animate-pulse"
                            : lead.status === "Sent"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {lead.status}
                      </span>
                    </div>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-muted text-foreground font-medium">
                        🏷️ {lead.niche}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        👥 {lead.mutualFriends} mutuals
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                        ⚡ {lead.engagementScore}% Active
                      </span>
                    </div>
                  </div>

                  {/* Bottom Action */}
                  <div className="pt-3 border-t border-border mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      Added: {lead.addedAt}
                    </span>

                    {isSent ? (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Request Sent
                      </span>
                    ) : (
                      <button
                        onClick={() => toggleQueueLead(lead.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                          isQueued
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 hover:bg-amber-200"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        {isQueued ? (
                          <>
                            <UserX className="w-3 h-3" />
                            Remove from Queue
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3" />
                            Add to Outgoing Queue
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Outgoing Request Runner */}
      {activeTab === "outgoing" && (
        <div className="space-y-5">
          {/* Active Runner Control Panel */}
          <div className="bg-card border border-border p-5 rounded-xl shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${runnerState.isRunning ? "bg-emerald-500 animate-ping" : "bg-muted-foreground"}`} />
                  Live Human Behavior Simulation Runner
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Simulating realistic human clicks, feed scrolls, post likes, and residential proxy rotation to prevent Meta automated spam detection.
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                {!runnerState.isRunning ? (
                  <button
                    onClick={startRunner}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Start Queue Runner
                  </button>
                ) : (
                  <>
                    {runnerState.isPaused ? (
                      <button
                        onClick={startRunner}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Resume
                      </button>
                    ) : (
                      <button
                        onClick={pauseRunner}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        Pause
                      </button>
                    )}
                    <button
                      onClick={stopRunner}
                      className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Square className="w-3.5 h-3.5" />
                      Stop
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Runner Live Progress Card */}
            {runnerState.isRunning ? (
              <div className="bg-muted/40 p-4 rounded-xl border border-border space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Target Lead */}
                  <div className="bg-card p-3 rounded-lg border border-border space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Target Profile in Progress</span>
                    <div className="font-bold text-sm text-foreground flex items-center gap-2">
                      <span>{runnerState.activeLeadName || "Selecting next queued lead..."}</span>
                    </div>
                  </div>

                  {/* Rotating Account */}
                  <div className="bg-card p-3 rounded-lg border border-border space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Rotating Marketing Account</span>
                    <div className="font-bold text-sm text-foreground flex items-center gap-2">
                      <span>{runnerState.activeAccountName || "Selecting account..."}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-mono">
                        {runnerState.activeProxy || "103.145.23.11:8080"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step Pipeline Visualization */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      {runnerState.currentStepLabel}
                    </span>
                    <span className="font-mono text-muted-foreground font-semibold">
                      {runnerState.stepProgress}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 transition-all duration-300 rounded-full"
                      style={{ width: `${runnerState.stepProgress}%` }}
                    />
                  </div>

                  {/* Visual Step Pills */}
                  <div className="grid grid-cols-4 gap-2 pt-2 text-[11px] font-semibold text-center">
                    <div className={`p-2 rounded-lg border flex items-center justify-center gap-1.5 ${
                      runnerState.currentStep === "VIEWING_PROFILE"
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : runnerState.stepProgress > 25
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800"
                        : "bg-card text-muted-foreground border-border"
                    }`}>
                      <Eye className="w-3 h-3" />
                      <span>1. View Profile</span>
                    </div>

                    <div className={`p-2 rounded-lg border flex items-center justify-center gap-1.5 ${
                      runnerState.currentStep === "SCROLLING_FEED"
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : runnerState.stepProgress > 50
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800"
                        : "bg-card text-muted-foreground border-border"
                    }`}>
                      <ScrollText className="w-3 h-3" />
                      <span>2. Scroll Feed</span>
                    </div>

                    <div className={`p-2 rounded-lg border flex items-center justify-center gap-1.5 ${
                      runnerState.currentStep === "LIKING_POST"
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : runnerState.stepProgress > 75
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800"
                        : "bg-card text-muted-foreground border-border"
                    }`}>
                      <Heart className="w-3 h-3" />
                      <span>3. Like Post</span>
                    </div>

                    <div className={`p-2 rounded-lg border flex items-center justify-center gap-1.5 ${
                      runnerState.currentStep === "SENDING_REQUEST"
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : runnerState.stepProgress === 100
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800"
                        : "bg-card text-muted-foreground border-border"
                    }`}>
                      <UserPlus className="w-3 h-3" />
                      <span>4. Send Request</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-muted/20 border border-border border-dashed p-6 rounded-xl text-center space-y-2">
                <Clock className="w-8 h-8 mx-auto text-muted-foreground" />
                <div className="font-bold text-sm text-foreground">Automation Engine is Idle</div>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  {metrics.queuedLeads > 0
                    ? `You have ${metrics.queuedLeads} leads waiting in queue. Click "Start Queue Runner" to begin multi-account human simulation.`
                    : "No leads currently in queue. Go to the 'Target Audience & Lead Studio' tab to add leads into the queue."}
                </p>
              </div>
            )}
          </div>

          {/* Current Outgoing Queue Table */}
          <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Outgoing Queue ({metrics.queuedLeads} Leads Waiting)
              </h4>
              <span className="text-[11px] text-muted-foreground">
                Speed: <strong className="text-foreground">{settings.delaySpeed === "demo_fast" ? "Fast Demo (15-30s)" : settings.delaySpeed === "normal" ? "Normal (2-5m)" : "Conservative (5-10m)"}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="p-2.5">Queue #</th>
                    <th className="p-2.5">Target Lead</th>
                    <th className="p-2.5">Location & Niche</th>
                    <th className="p-2.5">Mutuals</th>
                    <th className="p-2.5">Assigned Marketing Account</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leads.filter(l => l.status === "Queued" || l.status === "Simulating").map((lead, idx) => (
                    <tr key={lead.id} className="hover:bg-muted/30 transition">
                      <td className="p-2.5 font-mono font-bold text-muted-foreground">#{idx + 1}</td>
                      <td className="p-2.5">
                        <div className="flex items-center gap-2">
                          <img src={lead.avatarUrl} alt={lead.name} className="w-7 h-7 rounded-full object-cover" />
                          <span className="font-bold text-foreground">{lead.name}</span>
                        </div>
                      </td>
                      <td className="p-2.5 text-muted-foreground">
                        {lead.city}, {lead.country} • <span className="text-foreground font-medium">{lead.niche}</span>
                      </td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                          {lead.mutualFriends}
                        </span>
                      </td>
                      <td className="p-2.5 text-muted-foreground">
                        {lead.assignedAccountName || "Auto-Rotating Round Robin"}
                      </td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          lead.status === "Simulating"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 animate-pulse"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => toggleQueueLead(lead.id)}
                          className="text-red-600 hover:text-red-700 font-semibold text-[11px]"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {leads.filter(l => l.status === "Queued" || l.status === "Simulating").length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-muted-foreground">
                        Queue is currently empty. Add leads from the "Target Audience & Lead Studio" tab.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Auto-Accept Engine */}
      {activeTab === "incoming" && (
        <div className="space-y-4">
          {/* Smart Auto-Accept Rules Box */}
          <div className="bg-card border border-border p-4 rounded-xl shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  Incoming Request Auto-Accept Smart Engine
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Automatically qualify and accept genuine incoming friend requests based on mutual connections and profile filters.
                </p>
              </div>

              <button
                onClick={() => {
                  const count = batchAcceptQualified()
                  triggerNotification(`Auto-accepted ${count} qualified incoming friend requests!`)
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Auto-Accept All Qualified Now
              </button>
            </div>

            {/* Config inline */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Minimum Mutual Friends</label>
                <select
                  value={settings.autoAcceptMinMutual}
                  onChange={(e) => saveSettings({ ...settings, autoAcceptMinMutual: Number(e.target.value) })}
                  className="w-full bg-background border border-border rounded-lg p-2 text-xs"
                >
                  <option value={1}>At least 1 mutual friend</option>
                  <option value={3}>At least 3 mutual friends (Recommended)</option>
                  <option value={5}>At least 5 mutual friends (Safe)</option>
                  <option value={10}>At least 10 mutual friends (High Trust)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Target Gender Filter</label>
                <select
                  value={settings.autoAcceptTargetGender}
                  onChange={(e) => saveSettings({ ...settings, autoAcceptTargetGender: e.target.value as any })}
                  className="w-full bg-background border border-border rounded-lg p-2 text-xs"
                >
                  <option value="All">Accept All Genders</option>
                  <option value="Female">Female Only</option>
                  <option value="Male">Male Only</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Auto-Reject Suspicious (0 Mutuals)</label>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="autoReject"
                    checked={settings.autoRejectZeroMutual}
                    onChange={(e) => saveSettings({ ...settings, autoRejectZeroMutual: e.target.checked })}
                    className="rounded border-border text-blue-600"
                  />
                  <label htmlFor="autoReject" className="text-xs text-foreground cursor-pointer">
                    Auto-reject 0 mutual profiles
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Incoming Requests List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incoming.map((req) => {
              const isQualified = req.mutualFriends >= settings.autoAcceptMinMutual && (settings.autoAcceptTargetGender === "All" || req.gender === settings.autoAcceptTargetGender)
              return (
                <div
                  key={req.id}
                  className={`bg-card border rounded-xl p-4 shadow-xs space-y-3 transition ${
                    req.status === "Accepted"
                      ? "border-emerald-500/50 bg-emerald-50/10 opacity-75"
                      : req.status === "Rejected"
                      ? "border-red-500/40 bg-red-50/10 opacity-60"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={req.avatarUrl} alt={req.name} className="w-11 h-11 rounded-full object-cover border border-border" />
                      <div>
                        <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                          <span>{req.name}</span>
                          <span className="text-[10px] text-muted-foreground">({req.age}y, {req.gender})</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {req.city}, {req.country} • <span className="font-semibold text-blue-600 dark:text-blue-400">{req.mutualFriends} mutual friends</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground/90 italic mt-1 line-clamp-1">
                          "{req.bio}"
                        </p>
                      </div>
                    </div>

                    {/* Badge */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      req.status === "Accepted"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : req.status === "Rejected"
                        ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                        : isQualified
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}>
                      {req.status === "Accepted" ? "Accepted ✓" : req.status === "Rejected" ? "Rejected ✕" : isQualified ? "Qualified Lead" : "Low Mutual"}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-[10px] text-muted-foreground">
                      Received {req.receivedAt}
                    </span>

                    {req.status === "Pending" ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            rejectIncoming(req.id)
                            triggerNotification(`Rejected friend request from ${req.name}`)
                          }}
                          className="px-2.5 py-1 text-muted-foreground hover:text-red-600 text-xs font-semibold"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => {
                            acceptIncoming(req.id)
                            triggerNotification(`Accepted friend request from ${req.name}!`)
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Accept Request
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-muted-foreground">
                        {req.status === "Accepted" ? `Accepted on ${req.acceptedAt}` : "Declined"}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 4: Sent Requests & Cancel Manager */}
      {activeTab === "sent" && (
        <div className="space-y-4">
          <div className="bg-card border border-border p-4 rounded-xl shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Sent Friend Requests Backlog & Cancellation Manager
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Facebook accounts accumulate spam penalty if too many sent requests remain pending for over 7–14 days. Cancelling stale requests keeps account trust high.
                </p>
              </div>

              <button
                onClick={() => {
                  const pendingSent = leads.filter(l => l.status === "Sent")
                  pendingSent.forEach(l => cancelSentRequest(l.id))
                  triggerNotification(`Cleaned up ${pendingSent.length} pending sent requests!`)
                }}
                className="px-3.5 py-1.5 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                Cancel All Pending Requests
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="p-3">Target Profile</th>
                  <th className="p-3">Dispatched Via Account</th>
                  <th className="p-3">Residential Proxy</th>
                  <th className="p-3">Sent At</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sentLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-muted/30 transition">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <img src={lead.avatarUrl} alt={lead.name} className="w-7 h-7 rounded-full object-cover" />
                        <div>
                          <span className="font-bold text-foreground block">{lead.name}</span>
                          <span className="text-[10px] text-muted-foreground">{lead.city}, {lead.country}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-medium text-foreground">
                      {lead.assignedAccountName || "Tariqul Islam (Dhaka Marketplace Lead)"}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-muted-foreground">
                      {lead.assignedProxy || "103.145.23.11:8080"}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {lead.sentAt || lead.addedAt}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        lead.status === "Sent"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                          : lead.status === "Accepted"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {lead.status === "Sent" ? "Pending Acceptance" : lead.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {lead.status === "Sent" && (
                        <button
                          onClick={() => {
                            cancelSentRequest(lead.id)
                            triggerNotification(`Cancelled pending request to ${lead.name}`)
                          }}
                          className="px-2.5 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded font-semibold text-xs transition"
                        >
                          Cancel Request
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {sentLeads.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                      No sent requests yet. Launch the queue runner to start sending.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Safety Limits & Multi-Account Settings */}
      {activeTab === "settings" && (
        <div className="bg-card border border-border p-6 rounded-xl shadow-xs space-y-6 max-w-4xl">
          <div>
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              Safety Limits & Anti-Detection Delay Engine
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tune daily account quotas, delay intervals, and simulated human interactions to match your account warming status.
            </p>
          </div>

          {/* Daily Limits */}
          <div className="space-y-4 border-t border-border pt-4">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              1. Daily Per-Account Quotas
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Daily Friend Request Limit / Account</span>
                  <span className="font-mono text-blue-600 font-bold">{settings.dailyLimitPerAccount} req/day</span>
                </label>
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={1}
                  value={settings.dailyLimitPerAccount}
                  onChange={(e) => saveSettings({ ...settings, dailyLimitPerAccount: Number(e.target.value) })}
                  className="w-full accent-blue-600"
                />
                <p className="text-[11px] text-muted-foreground">
                  Safe threshold: 10–15 for warming accounts; 20–25 for aged 1yr+ accounts.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Daily Auto-Accept Limit / Account</span>
                  <span className="font-mono text-emerald-600 font-bold">{settings.dailyAcceptLimitPerAccount} accepts/day</span>
                </label>
                <input
                  type="range"
                  min={10}
                  max={80}
                  step={5}
                  value={settings.dailyAcceptLimitPerAccount}
                  onChange={(e) => saveSettings({ ...settings, dailyAcceptLimitPerAccount: Number(e.target.value) })}
                  className="w-full accent-emerald-600"
                />
                <p className="text-[11px] text-muted-foreground">
                  Accepting requests carries lower risk than sending outgoing requests.
                </p>
              </div>
            </div>
          </div>

          {/* Delays */}
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
                  <span>🐢 Conservative (Safe)</span>
                  {settings.delaySpeed === "safe_slow" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <div className="text-[11px] text-muted-foreground">5 – 10 min random delays between requests. Best for new accounts.</div>
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
                  <span>⚖️ Moderate (Standard)</span>
                  {settings.delaySpeed === "normal" && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                </div>
                <div className="text-[11px] text-muted-foreground">2 – 5 min random delays. Recommended for warmed-up marketing IDs.</div>
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
                  <span>⚡ Demo / Fast Speed</span>
                  {settings.delaySpeed === "demo_fast" && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
                </div>
                <div className="text-[11px] text-muted-foreground">15 – 35s speed. Ideal for testing UI and watching execution live.</div>
              </button>
            </div>
          </div>

          {/* Human Behavior Toggles */}
          <div className="space-y-3 border-t border-border pt-4">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              3. Human-Like Behavior Simulation Steps
            </h4>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableProfileView}
                  onChange={(e) => saveSettings({ ...settings, enableProfileView: e.target.checked })}
                  className="rounded border-border text-blue-600"
                />
                <div>
                  <span className="font-bold text-foreground">Step 1: View Profile Page (10–25s)</span>
                  <p className="text-[11px] text-muted-foreground">Simulate opening profile tab and resting mouse pointer.</p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableScrollFeed}
                  onChange={(e) => saveSettings({ ...settings, enableScrollFeed: e.target.checked })}
                  className="rounded border-border text-blue-600"
                />
                <div>
                  <span className="font-bold text-foreground">Step 2: Scroll Timeline & Feed (15–35s)</span>
                  <p className="text-[11px] text-muted-foreground">Simulate natural downward scrolling with smooth easing.</p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableLikePost}
                  onChange={(e) => saveSettings({ ...settings, enableLikePost: e.target.checked })}
                  className="rounded border-border text-blue-600"
                />
                <div>
                  <span className="font-bold text-foreground">Step 3: Like Recent Post ({settings.likeProbability}% Probability)</span>
                  <p className="text-[11px] text-muted-foreground">Randomly likes a recent photo to appear 100% natural.</p>
                </div>
              </label>
            </div>
          </div>

          {/* Multi-Account Selector */}
          <div className="space-y-3 border-t border-border pt-4">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              4. Participating Marketing Accounts (from Facebook Market Module 8)
            </h4>
            <div className="space-y-2">
              {accounts.map(acc => {
                const isSelected = selectedAccountIds.includes(acc.id)
                return (
                  <label
                    key={acc.id}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition ${
                      isSelected ? "border-blue-600 bg-blue-50/20 dark:bg-blue-950/20" : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAccountIds([...selectedAccountIds, acc.id])
                          } else {
                            if (selectedAccountIds.length > 1) {
                              setSelectedAccountIds(selectedAccountIds.filter(id => id !== acc.id))
                            }
                          }
                        }}
                        className="rounded border-border text-blue-600"
                      />
                      <img src={acc.avatarUrl} alt={acc.name} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <span className="font-bold text-foreground block">{acc.name}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">UID: {acc.uid} • Proxy: {acc.proxy.ip}:{acc.proxy.port}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Active Proxy Shield
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: Execution Audit Ledger */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          <div className="bg-card border border-border p-4 rounded-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search audit records..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none"
              />
            </div>

            <button
              onClick={exportLogsToCSV}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export Audit Ledger (.CSV)
            </button>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target Profile</th>
                  <th className="p-3">Account & Proxy</th>
                  <th className="p-3">Execution Details</th>
                  <th className="p-3 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-[11px]">
                {filteredLogs.map((lg) => (
                  <tr key={lg.id} className="hover:bg-muted/30 transition">
                    <td className="p-3 text-muted-foreground whitespace-nowrap">{lg.timestamp}</td>
                    <td className="p-3">
                      <span className="font-sans font-bold px-2 py-0.5 rounded bg-muted text-foreground">
                        {lg.action}
                      </span>
                    </td>
                    <td className="p-3 font-sans font-bold text-foreground">
                      {lg.targetProfileName}
                    </td>
                    <td className="p-3">
                      <span className="font-sans font-medium text-foreground block">{lg.accountName}</span>
                      <span className="text-[10px] text-muted-foreground">{lg.proxyIp}</span>
                    </td>
                    <td className="p-3 font-sans text-muted-foreground max-w-xs truncate" title={lg.details}>
                      {lg.details}
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-sans font-bold text-emerald-600 dark:text-emerald-400">
                        {lg.status} ✓
                      </span>
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

      {/* Add Custom Lead Modal */}
      {showAddLeadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                Add Custom Facebook Target Profile
              </h3>
              <button
                onClick={() => setShowAddLeadModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomLead} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Target Profile Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sabina Yasmin"
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Facebook Profile URL</label>
                <input
                  type="text"
                  placeholder="e.g. https://facebook.com/sabina.yasmin"
                  value={newLeadUrl}
                  onChange={(e) => setNewLeadUrl(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Country</label>
                  <select
                    value={newLeadCountry}
                    onChange={(e) => setNewLeadCountry(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2 text-xs"
                  >
                    <option value="Bangladesh">Bangladesh</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">City</label>
                  <input
                    type="text"
                    value={newLeadCity}
                    onChange={(e) => setNewLeadCity(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Gender</label>
                  <select
                    value={newLeadGender}
                    onChange={(e) => setNewLeadGender(e.target.value as any)}
                    className="w-full bg-background border border-border rounded-lg p-2 text-xs"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Niche Category</label>
                  <select
                    value={newLeadNiche}
                    onChange={(e) => setNewLeadNiche(e.target.value as any)}
                    className="w-full bg-background border border-border rounded-lg p-2 text-xs"
                  >
                    <option value="Online Business / Marketing">Online Business / Marketing</option>
                    <option value="E-Commerce & Shopping">E-Commerce & Shopping</option>
                    <option value="Fashion & Beauty">Fashion & Beauty</option>
                    <option value="Gadgets & Tech">Gadgets & Tech</option>
                    <option value="Freelancing & Remote Work">Freelancing & Remote Work</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  Add Lead to Studio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
