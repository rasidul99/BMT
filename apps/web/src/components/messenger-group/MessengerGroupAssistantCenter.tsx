"use client"

import React, { useState, useMemo, useEffect } from "react"
import {
  MessageCircle,
  Users,
  Send,
  Sparkles,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Plus,
  Trash2,
  ExternalLink,
  Zap,
  Globe,
  X,
  UserPlus,
  RefreshCw,
  ShieldCheck,
  Link2,
} from "lucide-react"
import {
  useMessengerGroupAssistant,
  MessengerGroup,
} from "../../hooks/useMessengerGroupAssistant"

interface MessengerGroupAssistantCenterProps {
  currentMode: "SAFE" | "ADVANCED"
}

export function MessengerGroupAssistantCenter({ currentMode }: MessengerGroupAssistantCenterProps) {
  const {
    isLoaded,
    isSyncing,
    sessionInfo,
    connectedAccounts,
    groups,
    campaigns,
    activeRunningId,
    metrics,
    syncLiveGroups,
    addGroup,
    deleteGroup,
    addFollowersToGroup,
    launchCampaign,
    updateCookieAndRetry,
  } = useMessengerGroupAssistant()

  const [activeTab, setActiveTab] = useState<"CAMPAIGN" | "GROUPS" | "LEDGER">("CAMPAIGN")
  const [selectedAccountIndex, setSelectedAccountIndex] = useState<number>(0)
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [masterMessage, setMasterMessage] = useState(
    "🔥 আসসালামু আলাইকুম! আমাদের নতুন প্রোডাক্টের স্পেশাল ডিসকাউন্ট অফার চলছে। অর্ডার বা বিস্তারিত জানতে এখনই এখানে রিপ্লাই দিন!"
  )
  const [campaignTitle, setCampaignTitle] = useState("Live Messenger Group Offer Broadcast")
  const [messagesPerAccount, setMessagesPerAccount] = useState<number>(3)
  const [delayMinutes, setDelayMinutes] = useState<number>(1)
  const [aiVariantEnabled, setAiVariantEnabled] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [quickCookieInput, setQuickCookieInput] = useState("")
  const [isSavingCookie, setIsSavingCookie] = useState(false)

  // Add / Connect Group Modal State
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupThreadUrl, setNewGroupThreadUrl] = useState("")
  const [newGroupCategory, setNewGroupCategory] =
    useState<MessengerGroup["category"]>("Resellers Wholesale")
  const [newGroupAccountId, setNewGroupAccountId] = useState("61595136714776")
  const [initialFollowersToAdd, setInitialFollowersToAdd] = useState(25)
  const [openLiveComposer, setOpenLiveComposer] = useState(false)

  // Follower Invite Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [targetInviteGroup, setTargetInviteGroup] = useState<MessengerGroup | null>(null)
  const [followersCountToAdd, setFollowersCountToAdd] = useState(30)

  const selectedAccount = connectedAccounts[selectedAccountIndex] || connectedAccounts[0]

  // Auto-select first live group when loaded
  useEffect(() => {
    if (groups.length > 0 && selectedGroupIds.length === 0) {
      setSelectedGroupIds([groups[0].id])
    }
  }, [groups, selectedGroupIds.length])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4500)
  }

  // Toggle group selection
  const toggleSelectGroup = (id: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((gId) => gId !== id) : [...prev, id]
    )
  }

  const selectAllGroups = () => {
    if (selectedGroupIds.length === groups.length) {
      setSelectedGroupIds([])
    } else {
      setSelectedGroupIds(groups.map((g) => g.id))
    }
  }

  // Handle Sync Live Messenger Groups
  const handleSyncLiveGroups = async () => {
    if (!selectedAccount) return
    showToast(`🔄 Syncing live Messenger groups & chats for "${selectedAccount.name}"...`)
    const res = await syncLiveGroups(selectedAccount)
    if (res?.message) {
      showToast(res.message)
    }
  }

  // Handle Launch Live Campaign
  const handleStartCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedGroupIds.length === 0) {
      showToast("⚠️ কমপক্ষে ১টি মেসেঞ্জার গ্রুপ বা চ্যাট সিলেক্ট করুন!")
      return
    }
    if (!masterMessage.trim()) {
      showToast("⚠️ মেসেজ খালি রাখা যাবে না!")
      return
    }

    const res = await launchCampaign(
      campaignTitle,
      masterMessage.trim(),
      selectedGroupIds,
      messagesPerAccount,
      delayMinutes,
      aiVariantEnabled
    )

    if (res?.success) {
      showToast(
        `🚀 Live Messenger Campaign পাঠানোর কাজ শুরু হয়েছে (${selectedGroupIds.length}টি গ্রুপ/থ্রেডে)!`
      )
    } else {
      showToast(`⚠️ Campaign পাঠাতে সমস্যা হয়েছে: ${res?.error || "Unknown error"}`)
    }
  }

  // Handle Add / Connect Real Group Submit
  const handleCreateGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim()) return

    const ownerAcc =
      connectedAccounts.find((a) => a.id === newGroupAccountId) || connectedAccounts[0]

    await addGroup({
      name: newGroupName.trim(),
      threadUrlOrId: newGroupThreadUrl.trim(),
      assignedAccountId: ownerAcc.id,
      assignedAccountName: ownerAcc.name,
      sourceType: ownerAcc.sourceType,
      memberCount: Number(initialFollowersToAdd) || 25,
      category: newGroupCategory,
      openLiveComposer,
    })

    setNewGroupName("")
    setNewGroupThreadUrl("")
    setIsAddGroupModalOpen(false)
    showToast(
      openLiveComposer
        ? `✅ "${newGroupName}" যুক্ত হয়েছে এবং লাইভ মেসেঞ্জারে নিউ গ্রুপ কম্পোজার ওপেন করা হচ্ছে!`
        : `✅ "${newGroupName}" রিয়েল মেসেঞ্জার গ্রুপ ডিরেক্টরিতে যুক্ত হয়েছে!`
    )
  }

  // Handle Invite Followers Submit
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetInviteGroup) return

    await addFollowersToGroup(targetInviteGroup.id, Number(followersCountToAdd))
    setIsInviteModalOpen(false)
    showToast(`✅ "${targetInviteGroup.name}" গ্রুপে ${followersCountToAdd} জন ফলোয়ার যুক্ত করা হয়েছে!`)
  }

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Group Name",
      "Thread ID",
      "Assigned Account",
      "Members Count",
      "Max Capacity",
      "Category",
      "Status",
    ]

    const rows = groups.map((g) => [
      `"${g.name.replace(/"/g, '""')}"`,
      `"${g.threadId}"`,
      `"${g.assignedAccountName.replace(/"/g, '""')}"`,
      g.memberCount,
      g.maxCapacity,
      `"${g.category}"`,
      `"${g.status}"`,
    ])

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `bmt_messenger_groups_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast(`Exported ${groups.length} Messenger groups to CSV!`)
  }

  // Export Excel (.xls)
  const handleExportExcel = () => {
    const headers = [
      "Group Name",
      "Thread ID",
      "Assigned Account Owner",
      "Members",
      "Capacity",
      "Category",
      "Status",
    ]

    const rows = groups.map(
      (g) =>
        `<tr>
          <td><b>${g.name}</b></td>
          <td>${g.threadId}</td>
          <td>${g.assignedAccountName}</td>
          <td>${g.memberCount}</td>
          <td>${g.maxCapacity}</td>
          <td>${g.category}</td>
          <td>${g.status}</td>
        </tr>`
    )

    const tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"/></head>
      <body>
        <table border="1">
          <thead>
            <tr style="background-color: #0284c7; color: white; font-weight: bold;">
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
    link.setAttribute("download", `bmt_messenger_groups_${Date.now()}.xls`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast(`Exported ${groups.length} Messenger groups to Excel (.xls)!`)
  }

  // Active Campaign Data
  const activeCampaign = useMemo(() => {
    return campaigns.find((c) => c.id === activeRunningId) || campaigns[0] || null
  }, [campaigns, activeRunningId])

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-bold border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center flex-wrap gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-blue-600 flex items-center justify-center text-white shadow-sm">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              AI Messenger Group Assistant
            </h1>
            <span
              className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full border ${
                currentMode === "SAFE"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
              }`}
            >
              {currentMode} LIVE ENGINE
            </span>
            {sessionInfo.hasCookie && (
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                24/7 Real FB Session Connected (ID: {sessionInfo.cUserId})
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-2xl">
            আপনার কানেক্টেড রিয়েল ফেসবুক অ্যাকাউন্ট ও পেজের মেসেঞ্জার গ্রুপ/থ্রেড সিঙ্ক করুন, নতুন মেসেঞ্জার গ্রুপ যুক্ত করুন এবং এক ক্লিকেই লাইভ মেসেঞ্জারে বাল্ক মেসেজ পাঠান।
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setIsAddGroupModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Connect / Create Live Group</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-muted hover:bg-muted/80 border text-foreground transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-sky-500" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Real Facebook Account Switcher & Live Sync Bar */}
      <div className="border border-sky-500/30 bg-sky-500/5 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-sky-600/15 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-foreground text-sm flex items-center gap-2">
              <span>Real Facebook Account & Live Messenger Sync</span>
              {sessionInfo.is24x7BotActive ? (
                <span className="px-2 py-0.5 text-[10px] rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black">
                  24/7 Messenger Engine Active
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black">
                  ⚠️ Waiting for Facebook Login / Cookie
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              যেকোনো রিয়েল ফেসবুক আইডি বা পেজ সিলেক্ট করে <strong>Sync Live Messenger Groups</strong> বাটনে ক্লিক করলেই আসল মেসেঞ্জার থ্রেড ও গ্রুপ চলে আসবে।
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <select
            value={selectedAccountIndex}
            onChange={(e) => setSelectedAccountIndex(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-border bg-background text-xs font-bold text-foreground"
          >
            {connectedAccounts.map((acc, idx) => (
              <option key={acc.id} value={idx}>
                {acc.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleSyncLiveGroups}
            disabled={isSyncing}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-extrabold text-xs transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Syncing Messenger..." : "Sync Live Messenger Groups"}</span>
          </button>
        </div>
      </div>

      {/* Live Session Reconnect Alert Bar when Facebook Cookie Logged Out */}
      {!sessionInfo.is24x7BotActive && (
        <div className="border-2 border-amber-500/40 bg-amber-500/10 rounded-2xl p-4 flex flex-col gap-3 text-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <div className="font-black text-amber-600 dark:text-amber-400 text-sm">
                ⚠️ ফেসবুক ব্রাউজার সেশন লগ-আউট হয়ে আছে — তাই মেসেজটি পেন্ডিং কিউতে অপেক্ষা করছে!
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                আপনার ডেস্কটপে ওপেন থাকা <strong>Bot Chrome Window</strong>-তে ফেসবুকে লগইন করুন, অথবা নিচে নতুন <strong>Facebook Cookie (`c_user=...; xs=...`)</strong> পেস্ট করে বাটনে ক্লিক করুন — সাথে সাথেই আপনার মেসেজটি রিয়েল মেসেঞ্জারে সেন্ড হয়ে যাবে!
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={quickCookieInput}
              onChange={(e) => setQuickCookieInput(e.target.value)}
              placeholder="Paste fresh Facebook Cookie (c_user=...; xs=...) or Page Access Token (EAA...)"
              className="flex-1 px-3 py-2 rounded-xl border border-amber-500/30 bg-background text-xs font-mono text-foreground"
            />
            <button
              type="button"
              disabled={isSavingCookie || !quickCookieInput.trim()}
              onClick={async () => {
                setIsSavingCookie(true)
                try {
                  const trimmed = quickCookieInput.trim()
                  const isToken = trimmed.startsWith("EAA") && !trimmed.includes("c_user=")
                  const res = await updateCookieAndRetry(
                    isToken ? "" : trimmed,
                    isToken ? trimmed : undefined
                  )
                  if (res?.success) {
                    setQuickCookieInput("")
                    showToast(res.message || "✅ Cookie saved! Delivering queued Messenger messages...")
                  }
                } finally {
                  setIsSavingCookie(false)
                }
              }}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-black text-xs transition shrink-0 shadow-sm"
            >
              {isSavingCookie ? "Connecting..." : "🔑 Connect & Send Queued Message Now"}
            </button>
          </div>
        </div>
      )}

      {/* Executive Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border border-border bg-card p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Connected Live Groups / Chats</span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">{metrics.totalGroups}</span>
            <span className="text-[10px] font-bold text-emerald-500">Live Messenger Linked</span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Total Group Audience</span>
            <Globe className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {metrics.totalMembers.toLocaleString()}
            </span>
            <span className="text-[10px] font-bold text-emerald-500">Members Reached</span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Live Delivered Messages</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {metrics.totalDelivered}
            </span>
            <span className="text-[10px] font-bold text-emerald-500">Real Messenger Sent</span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Engine Queue Status</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {!sessionInfo.is24x7BotActive
                ? "Needs Login"
                : metrics.activeCampaignsCount > 0
                ? "Sending Live"
                : "Ready"}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground">
              {sessionInfo.is24x7BotActive ? "24/7 Bot Connected" : "⚠️ Waiting for FB Login / Cookie"}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("CAMPAIGN")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === "CAMPAIGN"
              ? "bg-sky-600 text-white shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Bulk Campaign Dispatcher</span>
        </button>

        <button
          onClick={() => setActiveTab("GROUPS")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === "GROUPS"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Connected Groups Directory ({groups.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("LEDGER")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === "LEDGER"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Live Delivery Logs ({campaigns.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: BULK CAMPAIGN DISPATCHER & AI VARIANT ENGINE      */}
      {/* ======================================================== */}
      {activeTab === "CAMPAIGN" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
          {/* Left Column: Group Selection (5 cols) */}
          <div className="lg:col-span-5 border border-border bg-card p-4 rounded-2xl shadow-sm space-y-3 flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div>
                <h3 className="font-extrabold text-foreground text-sm">
                  Select Live Messenger Groups / Threads
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  {selectedGroupIds.length} of {groups.length} selected for live delivery
                </span>
              </div>
              <button
                type="button"
                onClick={selectAllGroups}
                className="text-[11px] text-sky-600 dark:text-sky-400 font-bold hover:underline"
              >
                {selectedGroupIds.length === groups.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            {groups.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground space-y-2">
                <p>এখনও কোনো মেসেঞ্জার গ্রুপ বা থ্রেড যুক্ত করা হয়নি।</p>
                <button
                  type="button"
                  onClick={handleSyncLiveGroups}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 text-white font-bold text-xs"
                >
                  🔄 Sync Live Messenger Now
                </button>
              </div>
            ) : (
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[430px] pr-1">
                {groups.map((grp) => {
                  const isChecked = selectedGroupIds.includes(grp.id)
                  return (
                    <div
                      key={grp.id}
                      onClick={() => toggleSelectGroup(grp.id)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? "bg-sky-500/10 border-sky-500/50"
                          : "hover:bg-muted/30 border-border"
                      }`}
                    >
                      <div className="space-y-1 pr-2">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-3.5 h-3.5 rounded text-sky-600"
                          />
                          <span className="font-bold text-foreground">{grp.name}</span>
                          {grp.isLiveMessengerThread && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-black border border-emerald-500/30">
                              LIVE FB
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Channel: <strong>{grp.assignedAccountName}</strong> • {grp.category}
                        </div>
                        {grp.lastMessagePreview && (
                          <div className="text-[10px] text-muted-foreground truncate max-w-[260px]">
                            Last: &ldquo;{grp.lastMessagePreview}&rdquo;
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-black text-sky-600 dark:text-sky-400 block">
                          {grp.memberCount} / {grp.maxCapacity}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-semibold">
                          {grp.lastMessageSent || "Active"}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right Column: Campaign Settings & Composer (7 cols) */}
          <div className="lg:col-span-7 border border-border bg-card p-5 rounded-2xl shadow-sm space-y-4">
            <div className="border-b border-border pb-3">
              <h3 className="font-extrabold text-foreground text-sm">
                Live Messenger Group Broadcast Composer
              </h3>
              <p className="text-[11px] text-muted-foreground">
                এখানে যে মেসেজটি লিখবেন সেটি সরাসরি আপনার সিলেক্ট করা রিয়েল মেসেঞ্জার গ্রুপ/চ্যাটে চলে যাবে।
              </p>
            </div>

            <form onSubmit={handleStartCampaign} className="space-y-4">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Campaign Title</label>
                <input
                  type="text"
                  required
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-foreground">
                    Message to Send on Live Messenger
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    {masterMessage.length} characters
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={masterMessage}
                  onChange={(e) => setMasterMessage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-background text-xs"
                />
              </div>

              {/* AI Variant Messaging Toggle */}
              <div className="p-3.5 border border-sky-500/30 bg-sky-500/5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-sky-500" />
                    <div>
                      <span className="font-extrabold text-foreground block">
                        AI High-CTA Bangla Variant Messaging (Optional)
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        অন রাখলে একাধিক গ্রুপে মেসেজ পাঠানোর সময় স্প্যাম এড়াতে হালকা ভ্যারিয়েশন যুক্ত করবে, অফ রাখলে আপনার লেখা হুবহু মেসেজ পাঠাবে।
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={aiVariantEnabled}
                    onChange={(e) => setAiVariantEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-sky-600"
                  />
                </div>
              </div>

              {/* Multi-Account Distribution & Delay Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Messages per Account</label>
                  <select
                    value={messagesPerAccount}
                    onChange={(e) => setMessagesPerAccount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs"
                  >
                    <option value={1}>1 message per ID</option>
                    <option value={3}>3 messages per ID</option>
                    <option value={5}>5 messages per ID</option>
                    <option value={10}>10 messages per ID (High volume)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">Anti-Ban Delay Interval</label>
                  <select
                    value={delayMinutes}
                    onChange={(e) => setDelayMinutes(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs"
                  >
                    <option value={1}>Instant / 3s Safe Human Delay</option>
                    <option value={2}>2 minutes delay (Recommended for 10+ groups)</option>
                    <option value={5}>5 minutes delay (Extra Safe)</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={activeRunningId !== null}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-xs transition flex items-center justify-center space-x-2"
              >
                <span>
                  {activeRunningId !== null
                    ? "📤 Sending Live on Facebook Messenger..."
                    : `🚀 Send Live Message to ${selectedGroupIds.length} Selected Group(s) / Thread(s)`}
                </span>
              </button>
            </form>

            {/* Active Execution Progress Indicator */}
            {activeCampaign && (
              <div className="p-4 border border-border bg-muted/20 rounded-xl space-y-2.5 mt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-foreground">
                    Live Batch: {activeCampaign.title}
                  </span>
                  <span className="font-black text-sky-600 dark:text-sky-400">
                    {activeCampaign.sentCount} / {activeCampaign.totalTarget} (
                    {activeCampaign.progressPercent}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-sky-600 transition-all duration-300"
                    style={{ width: `${activeCampaign.progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>
                    Status: <strong className="text-foreground">{activeCampaign.status}</strong> •
                    Real Facebook Messenger Delivery
                  </span>
                  <span>Started: {activeCampaign.startedAt}</span>
                </div>

                {/* Live per-group delivery status */}
                <div className="space-y-1.5 pt-1">
                  {activeCampaign.logs.map((log) => (
                    <div
                      key={log.id}
                      className="px-3 py-2 rounded-lg bg-background border border-border flex items-center justify-between text-[11px]"
                    >
                      <div className="truncate pr-3">
                        <span className="font-bold text-foreground">{log.groupName}</span>
                        <span className="text-muted-foreground ml-2">
                          — &ldquo;{log.sentMessageText}&rdquo;
                        </span>
                      </div>
                      <span
                        className={`font-black shrink-0 ${
                          log.status === "DELIVERED_200"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : log.status === "FAILED"
                            ? "text-rose-500"
                            : "text-amber-500"
                        }`}
                      >
                        {log.status === "DELIVERED_200"
                          ? `✅ LIVE SENT (${log.sentAt})`
                          : log.status === "FAILED"
                          ? "❌ FAILED"
                          : "⏳ SENDING..."}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: CONNECTED GROUPS DIRECTORY                        */}
      {/* ======================================================== */}
      {activeTab === "GROUPS" && (
        <div className="border border-border bg-card rounded-2xl shadow-sm overflow-hidden text-xs">
          <div className="p-3.5 bg-muted/40 border-b border-border flex items-center justify-between font-bold text-foreground">
            <span>Connected Live Messenger Groups & Threads ({groups.length})</span>
            <span className="text-[11px] text-muted-foreground font-normal">
              Synced with your real Facebook Accounts & Pages
            </span>
          </div>

          <div className="divide-y divide-border">
            {groups.map((grp) => {
              const capacityPercent = Math.round((grp.memberCount / grp.maxCapacity) * 100)
              const cleanTid = String(grp.threadId || "").startsWith("live_thread_")
                ? ""
                : grp.threadId
              const messengerHref = cleanTid
                ? `https://www.facebook.com/messages/t/${cleanTid}`
                : "https://www.facebook.com/messages/t/"

              return (
                <div
                  key={grp.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/30 transition"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-black text-sm text-foreground">{grp.name}</span>
                      {grp.isLiveMessengerThread && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          LIVE MESSENGER
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          grp.status === "Almost Full"
                            ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                            : "bg-sky-500/10 text-sky-600 border border-sky-500/20"
                        }`}
                      >
                        {grp.status}
                      </span>
                    </div>

                    <div className="flex items-center flex-wrap gap-3 text-[11px] text-muted-foreground">
                      <span>
                        Owner Account:{" "}
                        <strong className="text-foreground">{grp.assignedAccountName}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Thread ID: <code className="text-[10px] font-mono">{grp.threadId}</code>
                      </span>
                      <span>•</span>
                      <span>Category: {grp.category}</span>
                    </div>
                  </div>

                  {/* Middle: Capacity */}
                  <div className="w-32 space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-muted-foreground">Members</span>
                      <span className="text-foreground">
                        {grp.memberCount} / {grp.maxCapacity}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full ${
                          capacityPercent >= 95 ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${capacityPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <a
                      href={messengerHref}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold hover:bg-muted text-sky-600 dark:text-sky-400 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in FB</span>
                    </a>

                    <button
                      onClick={() => {
                        setTargetInviteGroup(grp)
                        setIsInviteModalOpen(true)
                      }}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border text-xs font-bold hover:bg-muted text-foreground transition"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-blue-500" />
                      <span>Add Followers</span>
                    </button>

                    <button
                      onClick={() => deleteGroup(grp.id)}
                      className="p-1.5 rounded-lg border hover:bg-rose-500/10 text-rose-500 transition"
                      title="Remove group"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: CAMPAIGN AUDIT LEDGER                             */}
      {/* ======================================================== */}
      {activeTab === "LEDGER" && (
        <div className="border border-border bg-card rounded-2xl shadow-sm overflow-hidden text-xs">
          <div className="p-3.5 bg-muted/40 border-b border-border flex items-center justify-between font-bold text-foreground">
            <span>Messenger Group Campaign History ({campaigns.length})</span>
            <span className="text-[11px] text-muted-foreground font-normal">
              Live Facebook Messenger Delivery Audit Logs
            </span>
          </div>

          {campaigns.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              এখনও কোনো ক্যাম্পেইন পাঠানো হয়নি। প্রথম ট্যাব থেকে গ্রুপ সিলেক্ট করে মেসেজ পাঠান!
            </div>
          ) : (
            <div className="divide-y divide-border">
              {campaigns.map((camp) => (
                <div key={camp.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-black text-sm text-foreground block">{camp.title}</span>
                      <span className="text-[10px] text-muted-foreground">
                        Delivered {camp.sentCount} of {camp.totalTarget} messages • Started:{" "}
                        {camp.startedAt}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        camp.status === "Completed"
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                          : "bg-sky-500/10 text-sky-600 border border-sky-500/20"
                      }`}
                    >
                      {camp.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {camp.logs.map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 bg-muted/20 rounded-xl flex items-center justify-between text-[11px]"
                      >
                        <div className="space-y-0.5 flex-1 pr-3">
                          <span className="font-bold text-foreground">{log.groupName}</span>
                          <p className="text-muted-foreground truncate">
                            &ldquo;{log.sentMessageText}&rdquo;
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className={`font-black block ${
                              log.status === "DELIVERED_200"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : log.status === "FAILED"
                                ? "text-rose-500"
                                : "text-amber-500"
                            }`}
                          >
                            {log.status === "DELIVERED_200" ? "✅ DELIVERED ON FB" : log.status}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{log.sentAt}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONNECT OR CREATE REAL MESSENGER GROUP            */}
      {/* ======================================================== */}
      {isAddGroupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-sky-500" />
                <h3 className="font-black text-base text-foreground">
                  Connect or Create Live Messenger Group
                </h3>
              </div>
              <button
                onClick={() => setIsAddGroupModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGroupSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="font-bold text-foreground">
                  Messenger Group / Chat Exact Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rasidul Islam Sajib or VIP Resellers Group"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-sky-500" />
                  <span>Messenger Group Link or Thread ID (Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://www.facebook.com/messages/t/789123456..."
                  value={newGroupThreadUrl}
                  onChange={(e) => setNewGroupThreadUrl(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs font-mono"
                />
                <p className="text-[10px] text-muted-foreground">
                  আপনার মেসেঞ্জার গ্রুপের লিংক (`facebook.com/messages/t/...`) পেস্ট করলে বট সরাসরি সেই লিংকে গিয়ে মেসেজ পাঠাবে।
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Group Category</label>
                  <select
                    value={newGroupCategory}
                    onChange={(e) => setNewGroupCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs"
                  >
                    <option value="Resellers Wholesale">Resellers Wholesale</option>
                    <option value="E-Commerce Buyers">E-Commerce Buyers</option>
                    <option value="Gadget Hunters">Gadget Hunters</option>
                    <option value="Organic Food">Organic Food</option>
                    <option value="General VIP">General VIP</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">Connected Facebook Account</label>
                  <select
                    value={newGroupAccountId}
                    onChange={(e) => setNewGroupAccountId(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs"
                  >
                    {connectedAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 border border-sky-500/20 bg-sky-500/5 rounded-xl space-y-2">
                <label className="font-bold text-foreground flex items-center space-x-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-sky-500" />
                  <span>Initial Members / Followers Count</span>
                </label>
                <input
                  type="number"
                  min="2"
                  max="250"
                  value={initialFollowersToAdd}
                  onChange={(e) => setInitialFollowersToAdd(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs"
                />
                <label className="flex items-center space-x-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={openLiveComposer}
                    onChange={(e) => setOpenLiveComposer(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-sky-600"
                  />
                  <span className="text-[11px] font-semibold text-foreground">
                    🌐 Open Live Facebook Messenger (`messages/new`) to create a brand new group chat
                  </span>
                </label>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddGroupModalOpen(false)}
                  className="px-4 py-2 rounded-lg border hover:bg-muted font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition"
                >
                  Save & Connect Live Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: INVITE FOLLOWERS TO EXISTING GROUP                */}
      {/* ======================================================== */}
      {isInviteModalOpen && targetInviteGroup && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-blue-500" />
                <h3 className="font-black text-base text-foreground">Add Followers to Group</h3>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-3.5">
              <div className="p-3 bg-muted/20 rounded-xl space-y-1">
                <span className="font-bold text-foreground block">{targetInviteGroup.name}</span>
                <span className="text-[11px] text-muted-foreground">
                  Current Capacity:{" "}
                  <strong>
                    {targetInviteGroup.memberCount} / {targetInviteGroup.maxCapacity}
                  </strong>
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Number of Followers to Add</label>
                <input
                  type="number"
                  min="1"
                  max={Math.max(1, targetInviteGroup.maxCapacity - targetInviteGroup.memberCount)}
                  value={followersCountToAdd}
                  onChange={(e) => setFollowersCountToAdd(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs"
                />
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-lg border hover:bg-muted font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
                >
                  Add Followers Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
