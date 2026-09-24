"use client"

import React, { useState, useMemo } from "react"
import {
  MessageCircle,
  Users,
  Send,
  Sparkles,
  Bot,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Plus,
  Trash2,
  Sliders,
  Check,
  AlertCircle,
  Layers,
  Search,
  ExternalLink,
  Zap,
  Globe,
  X,
  Play,
  UserPlus,
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
    groups,
    campaigns,
    activeRunningId,
    metrics,
    addGroup,
    addFollowersToGroup,
    launchCampaign,
  } = useMessengerGroupAssistant()

  const [activeTab, setActiveTab] = useState<"CAMPAIGN" | "GROUPS" | "LEDGER">("CAMPAIGN")
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [masterMessage, setMasterMessage] = useState(
    "🔥 আসসালামু আলাইকুম মেম্বার্স! আমাদের আজকের স্পেশাল হোলসেল লট এসে গেছে। যারা সরাসরি বাল্ক নিতে চান ইনবক্স করুন।"
  )
  const [campaignTitle, setCampaignTitle] = useState("Weekly Wholesale Flash Announcement")
  const [messagesPerAccount, setMessagesPerAccount] = useState<number>(3)
  const [delayMinutes, setDelayMinutes] = useState<number>(2)
  const [aiVariantEnabled, setAiVariantEnabled] = useState<boolean>(true)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Add Group Modal State
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupCategory, setNewGroupCategory] = useState<MessengerGroup["category"]>("Resellers Wholesale")
  const [newGroupAccount, setNewGroupAccount] = useState("Farhan Ahmed (Business)")
  const [newGroupMembers, setNewGroupMembers] = useState(150)
  const [initialFollowersToAdd, setInitialFollowersToAdd] = useState(25)

  // Follower Invite Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [targetInviteGroup, setTargetInviteGroup] = useState<MessengerGroup | null>(null)
  const [followersCountToAdd, setFollowersCountToAdd] = useState(30)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
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

  // Handle Launch Campaign
  const handleStartCampaign = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedGroupIds.length === 0) {
      showToast("⚠️ Please select at least one Messenger group!")
      return
    }
    if (!masterMessage.trim()) {
      showToast("⚠️ Message cannot be empty!")
      return
    }

    launchCampaign(
      campaignTitle,
      masterMessage.trim(),
      selectedGroupIds,
      messagesPerAccount,
      delayMinutes,
      aiVariantEnabled
    )

    showToast(`🚀 Campaign dispatched across ${selectedGroupIds.length} Messenger groups!`)
  }

  // Handle Add Group Submit
  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim()) return

    addGroup({
      name: newGroupName.trim(),
      threadId: `m_thread_${Date.now()}`,
      assignedAccountId: "acc-101",
      assignedAccountName: newGroupAccount,
      memberCount: Number(newGroupMembers) + Number(initialFollowersToAdd),
      maxCapacity: 250,
      category: newGroupCategory,
      lastMessageSent: "Just now",
    })

    setNewGroupName("")
    setIsAddGroupModalOpen(false)
    showToast(`Created new group and added ${initialFollowersToAdd} followers from connected accounts!`)
  }

  // Handle Invite Followers Submit
  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetInviteGroup) return

    addFollowersToGroup(targetInviteGroup.id, Number(followersCountToAdd))
    setIsInviteModalOpen(false)
    showToast(`Added ${followersCountToAdd} followers to "${targetInviteGroup.name}"!`)
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

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n")
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
          <div className="flex items-center space-x-2">
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
              {currentMode} ENGINE
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-2xl">
            Orchestrate multi-account bulk messaging across your connected Facebook Messenger Groups.
            Features AI high-CTA variant generation, anti-spam delay scheduling, and follower invitation into community groups.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setIsAddGroupModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-muted hover:bg-muted/80 border text-foreground transition"
          >
            <Plus className="w-3.5 h-3.5 text-blue-500" />
            <span>Create Group & Add Followers</span>
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
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Executive Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border border-border bg-card p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Connected Messenger Groups</span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">
              {metrics.totalGroups}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground">
              Across All IDs
            </span>
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
            <span className="text-[10px] font-bold text-emerald-500">
              Members Reached
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Delivered Messages</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {metrics.totalDelivered}
            </span>
            <span className="text-[10px] font-bold text-emerald-500">
              100% Graph API Sent
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Queue Status</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {metrics.activeCampaignsCount > 0 ? "Active" : "Idle"}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground">
              Anti-Ban Delay Ready
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
          <span>Campaign Audit Logs ({campaigns.length})</span>
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
                <h3 className="font-extrabold text-foreground text-sm">Select Target Groups</h3>
                <span className="text-[11px] text-muted-foreground">
                  {selectedGroupIds.length} of {groups.length} groups selected
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

            <div className="space-y-2 flex-1 overflow-y-auto max-h-[420px] pr-1">
              {groups.map((grp) => {
                const isChecked = selectedGroupIds.includes(grp.id)
                return (
                  <div
                    key={grp.id}
                    onClick={() => toggleSelectGroup(grp.id)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      isChecked
                        ? "bg-sky-500/10 border-sky-500/40"
                        : "hover:bg-muted/30 border-border"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-foreground">{grp.name}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Account: <strong>{grp.assignedAccountName}</strong> • {grp.category}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-black text-sky-600 dark:text-sky-400 block">
                        {grp.memberCount} / {grp.maxCapacity}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-semibold">Members</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column: Campaign Settings & Composer (7 cols) */}
          <div className="lg:col-span-7 border border-border bg-card p-5 rounded-2xl shadow-sm space-y-4">
            <div className="border-b border-border pb-3">
              <h3 className="font-extrabold text-foreground text-sm">
                Message Composer & Distribution Settings
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Configure your master message, AI CTA variation parameters, and account rotation.
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
                  <label className="font-bold text-foreground">Master Message Content</label>
                  <span className="text-[10px] text-muted-foreground">
                    {masterMessage.length} characters
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={masterMessage}
                  onChange={(e) => setMasterMessage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-background text-xs font-mono"
                />
              </div>

              {/* AI Variant Messaging Toggle */}
              <div className="p-3.5 border border-sky-500/30 bg-sky-500/5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-sky-500" />
                    <div>
                      <span className="font-extrabold text-foreground block">
                        AI High-CTA Variant Messaging
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        AI rewrites a unique, high-converting CTA variation for each group to prevent spam flags.
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
                    <option value={1}>1 minute delay (Fast)</option>
                    <option value={2}>2 minutes delay (Recommended)</option>
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
                    ? "Dispatching Messenger Group Campaign..."
                    : `🚀 Launch Campaign to ${selectedGroupIds.length} Groups`}
                </span>
              </button>
            </form>

            {/* Active Execution Progress Indicator */}
            {activeCampaign && (
              <div className="p-4 border border-border bg-muted/20 rounded-xl space-y-2 mt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-foreground">
                    Active Batch: {activeCampaign.title}
                  </span>
                  <span className="font-black text-sky-600 dark:text-sky-400">
                    {activeCampaign.sentCount} / {activeCampaign.totalTarget} ({activeCampaign.progressPercent}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-sky-600 transition-all duration-300"
                    style={{ width: `${activeCampaign.progressPercent}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground block">
                  Status: <strong>{activeCampaign.status}</strong> • Rotating connected IDs with {delayMinutes}m delay
                </span>
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
            <span>Messenger Groups Directory ({groups.length})</span>
            <span className="text-[11px] text-muted-foreground font-normal">
              Organized by owning Facebook Accounts & Pages
            </span>
          </div>

          <div className="divide-y divide-border">
            {groups.map((grp) => {
              const capacityPercent = Math.round((grp.memberCount / grp.maxCapacity) * 100)
              return (
                <div
                  key={grp.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/30 transition"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-sm text-foreground">{grp.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          grp.status === "Almost Full"
                            ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                        }`}
                      >
                        {grp.status}
                      </span>
                    </div>

                    <div className="flex items-center flex-wrap gap-3 text-[11px] text-muted-foreground">
                      <span>Owner Account: <strong className="text-foreground">{grp.assignedAccountName}</strong></span>
                      <span>•</span>
                      <span>Thread ID: <code className="text-[10px] font-mono">{grp.threadId}</code></span>
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
              100% Graph API Verified delivery logs
            </span>
          </div>

          {campaigns.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No campaigns launched yet. Create and dispatch a campaign from the first tab!
            </div>
          ) : (
            <div className="divide-y divide-border">
              {campaigns.map((camp) => (
                <div key={camp.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-black text-sm text-foreground block">{camp.title}</span>
                      <span className="text-[10px] text-muted-foreground">
                        Sent {camp.sentCount} of {camp.totalTarget} messages • Started: {camp.startedAt}
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
                          <p className="text-muted-foreground truncate">"{log.sentMessageText}"</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-black text-emerald-600 dark:text-emerald-400 block">
                            {log.status}
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
      {/* MODAL: CREATE GROUP & ADD FOLLOWERS                      */}
      {/* ======================================================== */}
      {isAddGroupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-sky-500" />
                <h3 className="font-black text-base text-foreground">
                  Create Messenger Group & Add Followers
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
                <label className="font-bold text-foreground">New Group Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BD Wholesale Buyers & Resellers Hub"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs"
                />
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
                  <label className="font-bold text-foreground">Creator Account</label>
                  <select
                    value={newGroupAccount}
                    onChange={(e) => setNewGroupAccount(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs"
                  >
                    <option value="Farhan Ahmed (Business)">Farhan Ahmed (Business)</option>
                    <option value="Sarah Jenkins (E-Com)">Sarah Jenkins (E-Com)</option>
                    <option value="Tanvir Rahman (Local Sales)">Tanvir Rahman (Local Sales)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 border border-sky-500/20 bg-sky-500/5 rounded-xl space-y-2">
                <label className="font-bold text-foreground flex items-center space-x-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-sky-500" />
                  <span>Auto-Add Followers from Connected Account</span>
                </label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={initialFollowersToAdd}
                  onChange={(e) => setInitialFollowersToAdd(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  The system will automatically invite this number of your active friends/followers into the new group.
                </p>
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
                  Create & Populate Group
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
                <h3 className="font-black text-base text-foreground">
                  Add Followers to Group
                </h3>
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
                  Current Capacity: <strong>{targetInviteGroup.memberCount} / {targetInviteGroup.maxCapacity}</strong>
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Number of Followers to Add</label>
                <input
                  type="number"
                  min="1"
                  max={targetInviteGroup.maxCapacity - targetInviteGroup.memberCount}
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
