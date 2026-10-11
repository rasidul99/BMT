"use client"

import React, { useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Compass,
  Search,
  Users,
  MessageSquare,
  Sparkles,
  Download,
  FileSpreadsheet,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  BookmarkCheck,
  Bookmark,
  Plus,
  Trash2,
  Filter,
  Globe,
  Flame,
  Zap,
  BarChart3,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Layers,
  ArrowRight,
  TrendingUp,
  Clock,
  X,
} from "lucide-react"
import {
  useGroupHunter,
  FacebookActiveGroup,
  MessengerGroupLink,
} from "../../hooks/useGroupHunter"

interface GroupHunterCenterProps {
  currentMode: "SAFE" | "ADVANCED"
}

export function GroupHunterCenter({ currentMode }: GroupHunterCenterProps) {
  const params = useParams()
  const router = useRouter()
  const workspaceId = (params?.id as string) || "workspace-1"

  const {
    isLoaded,
    fbGroups,
    msgrGroups,
    isScanning,
    sessionInfo,
    scanState,
    metrics,
    triggerScan,
    huntGroupsByKeyword,
    joinLiveGroup,
    updateCookieAndConnect,
    saveGroupToPostGroup,
    addCustomFbGroup,
    addCustomMsgrGroup,
    deleteFbGroup,
    deleteMsgrGroup,
  } = useGroupHunter()

  const [activeTab, setActiveTab] = useState<"FB" | "MESSENGER" | "SAVED">("FB")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Live Facebook Keyword Hunter State
  const [liveKeyword, setLiveKeyword] = useState("")
  const [showCookieBox, setShowCookieBox] = useState(false)
  const [cookieInput, setCookieInput] = useState("")
  const [isSavingCookie, setIsSavingCookie] = useState(false)
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null)

  // FB Filters
  const [fbSearch, setFbSearch] = useState("")
  const [fbCountry, setFbCountry] = useState("All")
  const [fbCategory, setFbCategory] = useState("All")
  const [fbMinScore, setFbMinScore] = useState<number>(0)
  const [fbAutoApproveOnly, setFbAutoApproveOnly] = useState(false)

  // Messenger Filters
  const [msgrSearch, setMsgrSearch] = useState("")
  const [msgrCountry, setMsgrCountry] = useState("All")
  const [msgrCategory, setMsgrCategory] = useState("All")
  const [msgrStatusFilter, setMsgrStatusFilter] = useState("All")

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newFbName, setNewFbName] = useState("")
  const [newFbUrl, setNewFbUrl] = useState("")
  const [newFbCountry, setNewFbCountry] = useState("Bangladesh")
  const [newFbCategory, setNewFbCategory] = useState<FacebookActiveGroup["category"]>("Fashion & Lifestyle")
  const [newFbNiche, setNewFbNiche] = useState("")
  const [newFbMembers, setNewFbMembers] = useState(50000)

  // Notification Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleLiveKeywordHunt = async (customKeyword?: string) => {
    const query = (customKeyword !== undefined ? customKeyword : liveKeyword || fbSearch).trim()
    setActiveTab("FB")
    showToast(
      query
        ? `🔍 Real Facebook-এ "${query}" লিখে লাইভ গ্রুপ খোঁজা শুরু হয়েছে...`
        : `🔍 Real Facebook থেকে আপনার গ্রুপ ও পেজ স্ক্যান শুরু হয়েছে...`
    )
    await huntGroupsByKeyword(query, fbCountry, fbCategory)
  }

  const handleJoinOnLiveFb = async (grp: FacebookActiveGroup) => {
    setJoiningGroupId(grp.id)
    showToast(`🚀 Real Facebook-এ "${grp.name.slice(0, 28)}..." গ্রুপে Join রিকোয়েস্ট পাঠানো হচ্ছে...`)
    const res = await joinLiveGroup(grp.id)
    if (res?.success) {
      showToast(`✅ Bot launched to join "${grp.name.slice(0, 28)}..." on live Facebook!`)
    } else {
      showToast(`⚠️ ${res?.error || "Could not launch join bot"}`)
    }
    setTimeout(() => setJoiningGroupId(null), 3000)
  }

  const handleConnectCookie = async () => {
    if (!cookieInput.trim()) return
    setIsSavingCookie(true)
    const res = await updateCookieAndConnect(cookieInput.trim())
    setIsSavingCookie(false)
    if (res?.success) {
      setCookieInput("")
      setShowCookieBox(false)
      showToast(`✅ Connected to Real FB ID (${res.cUser}) & started live group hunt!`)
    } else {
      showToast(`❌ ${res?.error || "Invalid Facebook Cookie"}`)
    }
  }

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
      showToast("Link copied to clipboard!")
    }
  }

  // 1. Export FB Groups CSV
  const handleExportFbCSV = () => {
    const headers = [
      "Group Name",
      "URL",
      "Country",
      "Category",
      "Niche",
      "Total Members",
      "Est. Active Members",
      "Daily Posts",
      "Auto Approval",
      "Activity Score",
      "Engagement Prediction (%)",
      "Saved to Post Group",
    ]

    const rows = filteredFbGroups.map((g) => [
      `"${g.name.replace(/"/g, '""')}"`,
      `"${g.url}"`,
      `"${g.country}"`,
      `"${g.category}"`,
      `"${g.niche.replace(/"/g, '""')}"`,
      g.memberCount,
      g.activeMembersEst,
      g.dailyPostFrequency,
      g.autoApproval ? "Yes" : "No",
      g.activityScore,
      `${g.engagementPrediction}%`,
      g.isSavedToPostGroup ? "Yes" : "No",
    ])

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `bmt_fb_active_groups_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast(`Exported ${filteredFbGroups.length} active FB groups to CSV!`)
  }

  // 2. Export FB Groups Excel (.xls)
  const handleExportFbExcel = () => {
    const headers = [
      "Group Name",
      "Facebook URL",
      "Country",
      "Category",
      "Niche Details",
      "Total Members",
      "Estimated Active Members",
      "Daily Post Velocity",
      "Auto Approval Status",
      "Activity Score",
      "Engagement Rate",
    ]

    const rows = filteredFbGroups.map(
      (g) =>
        `<tr>
          <td>${g.name}</td>
          <td><a href="${g.url}">${g.url}</a></td>
          <td>${g.country}</td>
          <td>${g.category}</td>
          <td>${g.niche}</td>
          <td>${g.memberCount.toLocaleString()}</td>
          <td>${g.activeMembersEst.toLocaleString()}</td>
          <td>${g.dailyPostFrequency}/day</td>
          <td>${g.autoApproval ? "Auto-Approval Active" : "Admin Review"}</td>
          <td><b>${g.activityScore}/100</b></td>
          <td>${g.engagementPrediction}%</td>
        </tr>`
    )

    const tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"/></head>
      <body>
        <table border="1">
          <thead>
            <tr style="background-color: #2563eb; color: white; font-weight: bold;">
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
    link.setAttribute("download", `bmt_fb_active_groups_${Date.now()}.xls`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast(`Exported ${filteredFbGroups.length} groups to Excel (.xls)!`)
  }

  // 3. Export Messenger Groups CSV
  const handleExportMsgrCSV = () => {
    const headers = [
      "Community Group Name",
      "Invite URL",
      "Country",
      "Category",
      "Niche",
      "Members",
      "Max Capacity",
      "Messages Last 24h",
      "Active Chatters",
      "Last Message",
      "Activity Score",
      "Status",
    ]

    const rows = filteredMsgrGroups.map((m) => [
      `"${m.name.replace(/"/g, '""')}"`,
      `"${m.inviteUrl}"`,
      `"${m.country}"`,
      `"${m.category}"`,
      `"${m.niche.replace(/"/g, '""')}"`,
      m.memberCount,
      m.maxCapacity,
      m.messagesLast24h,
      m.activeChatters,
      `"${m.lastMessageTime}"`,
      m.activityScore,
      `"${m.status}"`,
    ])

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `bmt_messenger_community_links_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast(`Exported ${filteredMsgrGroups.length} Messenger groups to CSV!`)
  }

  // 4. Export Messenger Groups Excel (.xls)
  const handleExportMsgrExcel = () => {
    const headers = [
      "Community Name",
      "Messenger Invite Link",
      "Country",
      "Category",
      "Current Members",
      "Max Capacity",
      "Messages (Last 24h)",
      "Active Chatters",
      "Last Message Recency",
      "Activity Score",
      "Status",
    ]

    const rows = filteredMsgrGroups.map(
      (m) =>
        `<tr>
          <td>${m.name}</td>
          <td><a href="${m.inviteUrl}">${m.inviteUrl}</a></td>
          <td>${m.country}</td>
          <td>${m.category}</td>
          <td>${m.memberCount}</td>
          <td>${m.maxCapacity}</td>
          <td>${m.messagesLast24h}</td>
          <td>${m.activeChatters}</td>
          <td>${m.lastMessageTime}</td>
          <td><b>${m.activityScore}/100</b></td>
          <td>${m.status}</td>
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
    link.setAttribute("download", `bmt_messenger_community_links_${Date.now()}.xls`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast(`Exported ${filteredMsgrGroups.length} Messenger groups to Excel (.xls)!`)
  }

  // Filtered FB Groups
  const filteredFbGroups = useMemo(() => {
    return fbGroups.filter((g) => {
      if (fbSearch && !g.name.toLowerCase().includes(fbSearch.toLowerCase()) && !g.niche.toLowerCase().includes(fbSearch.toLowerCase())) {
        return false
      }
      if (fbCountry !== "All" && g.country !== fbCountry) return false
      if (fbCategory !== "All" && g.category !== fbCategory) return false
      if (fbMinScore > 0 && g.activityScore < fbMinScore) return false
      if (fbAutoApproveOnly && !g.autoApproval) return false
      return true
    })
  }, [fbGroups, fbSearch, fbCountry, fbCategory, fbMinScore, fbAutoApproveOnly])

  // Filtered Messenger Groups
  const filteredMsgrGroups = useMemo(() => {
    return msgrGroups.filter((m) => {
      if (msgrSearch && !m.name.toLowerCase().includes(msgrSearch.toLowerCase()) && !m.niche.toLowerCase().includes(msgrSearch.toLowerCase())) {
        return false
      }
      if (msgrCountry !== "All" && m.country !== msgrCountry) return false
      if (msgrCategory !== "All" && m.category !== msgrCategory) return false
      if (msgrStatusFilter !== "All" && m.status !== msgrStatusFilter) return false
      return true
    })
  }, [msgrGroups, msgrSearch, msgrCountry, msgrCategory, msgrStatusFilter])

  // Saved Groups for Module 12 Bridge
  const savedForPostGroups = useMemo(() => {
    return fbGroups.filter((g) => g.isSavedToPostGroup)
  }, [fbGroups])

  const handleSaveToPostGroup = (group: FacebookActiveGroup) => {
    saveGroupToPostGroup(group)
    showToast(`"${group.name.slice(0, 30)}..." saved to Module 12 Post A Group!`)
  }

  const handleCreateCustomGroup = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFbName.trim() || !newFbUrl.trim()) return

    addCustomFbGroup({
      name: newFbName.trim(),
      url: newFbUrl.trim(),
      country: newFbCountry,
      category: newFbCategory,
      niche: newFbNiche.trim() || "General Business & Marketplace",
      memberCount: Number(newFbMembers) || 10000,
      activeMembersEst: Math.round((Number(newFbMembers) || 10000) * 0.12),
      dailyPostFrequency: 25,
      autoApproval: true,
      activityScore: 82,
      engagementPrediction: 80,
    })

    setNewFbName("")
    setNewFbUrl("")
    setNewFbNiche("")
    setIsAddModalOpen(false)
    showToast("New active group added successfully!")
  }

  const navigateToModule12 = () => {
    const basePath = currentMode === "SAFE" ? "safe" : "advanced"
    router.push(`/workspace/${workspaceId}/${basePath}/group-poster`)
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
              <Compass className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              FB Data Collector & Group Hunter
            </h1>
            <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800">
              {currentMode} ENGINE
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
            Audit-grade discovery engine for public auto-approval Facebook groups and Messenger communities.
            Filter by activity score, track 24h chatter velocity, and export verified datasets directly into Module 12 (Post A Group).
          </p>
        </div>

        {/* Global Action / Export Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition min-h-[36px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Group</span>
          </button>

          {activeTab === "FB" ? (
            <>
              <button
                onClick={handleExportFbCSV}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-card hover:bg-muted border border-border text-foreground transition shadow-xs min-h-[36px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={handleExportFbExcel}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-card hover:bg-muted border border-border text-foreground transition shadow-xs min-h-[36px]"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel (.xls)</span>
              </button>
            </>
          ) : activeTab === "MESSENGER" ? (
            <>
              <button
                onClick={handleExportMsgrCSV}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-card hover:bg-muted border border-border text-foreground transition shadow-xs min-h-[36px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={handleExportMsgrExcel}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-card hover:bg-muted border border-border text-foreground transition shadow-xs min-h-[36px]"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel (.xls)</span>
              </button>
            </>
          ) : (
            <button
              onClick={navigateToModule12}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs min-h-[36px]"
            >
              <span>Launch Module 12</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* REAL FACEBOOK PERSONAL ID + LIVE KEYWORD GROUP HUNTER     */}
      {/* ======================================================== */}
      <div className="border-2 border-blue-500/30 bg-gradient-to-r from-blue-950/20 via-card to-indigo-950/20 p-4 sm:p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-border/70 pb-3.5">
          <div className="flex items-center flex-wrap gap-2.5">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{sessionInfo.hasCookie ? "REAL FB CONNECTED" : "COOKIE REQUIRED"}</span>
            </span>
            <span className="text-xs sm:text-sm font-black text-foreground">
              {sessionInfo.accountName || "Rasidul Islam Sajib — Personal ID (61560588090925)"}
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
              ID: {sessionInfo.cUserId || "61560588090925"}
            </span>
            {scanState.keyword && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                Last Live Search: &ldquo;{scanState.keyword}&rdquo; ({scanState.lastDiscoveredCount || fbGroups.length} groups)
              </span>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => handleLiveKeywordHunt("My Joined Groups")}
              disabled={isScanning}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
              <span>Sync My Joined FB Groups</span>
            </button>
            <button
              onClick={() => setShowCookieBox(!showCookieBox)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-card hover:bg-muted border border-border text-foreground transition"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>{showCookieBox ? "Hide Cookie Box" : "Reconnect FB Cookie"}</span>
            </button>
          </div>
        </div>

        {/* Inline Cookie Reconnect Bar */}
        {showCookieBox && (
          <div className="p-3.5 rounded-xl bg-muted/60 border border-border space-y-2 text-xs">
            <p className="font-bold text-foreground">
              Update Real Facebook Session Cookie (`c_user` & `xs`) for Live Group Hunting:
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Paste full Facebook cookie string (c_user=...; xs=...) or JSON array..."
                value={cookieInput}
                onChange={(e) => setCookieInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border bg-background text-xs font-mono"
              />
              <button
                onClick={handleConnectCookie}
                disabled={isSavingCookie || !cookieInput.trim()}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition disabled:opacity-50 shrink-0"
              >
                {isSavingCookie ? "Connecting..." : "Save & Connect Real FB"}
              </button>
            </div>
          </div>
        )}

        {/* Prominent Live Keyword Search Box */}
        <div className="space-y-2.5">
          <label className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>
              লাইভ ফেসবুক গ্রুপ হান্টার (যেকোনো কি-ওয়ার্ড লিখে সার্চ দিন — বট সরাসরি Real Facebook থেকে লাইভ গ্রুপ খুঁজে আনবে):
            </span>
          </label>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleLiveKeywordHunt(liveKeyword)
            }}
            className="flex flex-col sm:flex-row gap-2.5"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-blue-500" />
              <input
                type="text"
                placeholder="যেকোনো কি-ওয়ার্ড লিখুন (যেমন: Buy Sell Bangladesh, Ecommerce BD, Fashion Group, Real Estate Dhaka)..."
                value={liveKeyword}
                onChange={(e) => setLiveKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-blue-500/40 focus:border-blue-600 bg-background text-xs sm:text-sm font-semibold text-foreground outline-none transition"
              />
            </div>
            <button
              type="submit"
              disabled={isScanning}
              className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm shadow-md transition disabled:opacity-50 shrink-0 min-h-[42px]"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} />
              <span>
                {isScanning ? "Hunting Live on Facebook..." : "🔍 Hunt Live FB Groups"}
              </span>
            </button>
          </form>

          {/* Quick 1-Click Keyword Pills */}
          <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
            <span className="text-[11px] font-bold text-muted-foreground mr-1">
              Quick Live Hunt:
            </span>
            {[
              "Buy Sell Bangladesh",
              "Ecommerce Bangladesh",
              "Wholesale Market BD",
              "Online Shopping Dhaka",
              "Fashion & Boutique BD",
              "Gadgets & Electronics BD",
            ].map((kw) => (
              <button
                key={kw}
                type="button"
                disabled={isScanning}
                onClick={() => {
                  setLiveKeyword(kw)
                  handleLiveKeywordHunt(kw)
                }}
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-card hover:bg-blue-600 hover:text-white border border-border transition disabled:opacity-50"
              >
                🔍 {kw}
              </button>
            ))}
          </div>
        </div>

        {/* Live Scan Progress & Status Bar */}
        {(isScanning || scanState.currentStepLabel) && (
          <div className="p-3 rounded-xl bg-background/90 border border-blue-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 font-bold text-foreground">
                <Zap className={`w-4 h-4 text-blue-500 ${isScanning ? "animate-bounce" : ""}`} />
                <span>{scanState.currentStepLabel || "Ready to hunt live Facebook groups."}</span>
              </div>
              <span className="text-[11px] font-black text-blue-600 dark:text-blue-400">
                {scanState.progress || 0}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-500"
                style={{ width: `${Math.max(5, scanState.progress || 0)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Executive Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Discovered FB Groups</span>
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">
              {metrics.totalFbGroups}
            </span>
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
              100% Auto-Approval
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>High-Activity FB Groups</span>
            <Flame className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">
              {metrics.highScoreFbGroups}
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground">
              Score 85+ / 100
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Messenger Communities</span>
            <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">
              {metrics.totalMsgrGroups}
            </span>
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
              {metrics.activeMsgrGroups} Active Now
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Queued for Post A Group</span>
            <BookmarkCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">
              {metrics.savedToPostGroupCount}
            </span>
            <button
              onClick={() => setActiveTab("SAVED")}
              className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              <span>View Bridge</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex items-center space-x-2 border-b border-border pb-2 overflow-x-auto no-scrollbar flex-nowrap shrink-0">
        <button
          onClick={() => setActiveTab("FB")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs transition whitespace-nowrap shrink-0 min-h-[38px] ${
            activeTab === "FB"
              ? "bg-blue-600 text-white shadow-xs font-semibold"
              : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground font-medium"
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Facebook Active Groups ({fbGroups.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("MESSENGER")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs transition whitespace-nowrap shrink-0 min-h-[38px] ${
            activeTab === "MESSENGER"
              ? "bg-blue-600 text-white shadow-xs font-semibold"
              : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground font-medium"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Messenger Group Links ({msgrGroups.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("SAVED")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs transition whitespace-nowrap shrink-0 min-h-[38px] ${
            activeTab === "SAVED"
              ? "bg-blue-600 text-white shadow-xs font-semibold"
              : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground font-medium"
          }`}
        >
          <BookmarkCheck className="w-3.5 h-3.5" />
          <span>Saved to Post A Group ({savedForPostGroups.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: FACEBOOK ACTIVE GROUP FINDER                      */}
      {/* ======================================================== */}
      {activeTab === "FB" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="border border-border bg-card p-4 rounded-xl space-y-3 shadow-sm text-xs">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-blue-500" />
                <h3 className="font-extrabold text-foreground">Table Filter & Score Thresholds</h3>
              </div>
              <button
                onClick={() => handleLiveKeywordHunt(fbSearch || liveKeyword)}
                disabled={isScanning}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
                <span>{isScanning ? "Scanning Live FB Groups..." : "Scan Active FB Groups"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Search */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground">Filter Loaded Groups / Keyword</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Filter list or press Enter to hunt..."
                    value={fbSearch}
                    onChange={(e) => setFbSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && fbSearch.trim()) {
                        handleLiveKeywordHunt(fbSearch.trim())
                      }
                    }}
                    className="w-full pl-8 pr-3 py-1.5 border rounded-lg bg-background text-xs"
                  />
                </div>
              </div>

              {/* Target Country */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground">Target Country</label>
                <select
                  value={fbCountry}
                  onChange={(e) => setFbCountry(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs"
                >
                  <option value="All">All Countries</option>
                  <option value="Bangladesh">Bangladesh (BD)</option>
                  <option value="USA">United States (USA)</option>
                  <option value="UK">United Kingdom (UK)</option>
                </select>
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground">Niche Category</label>
                <select
                  value={fbCategory}
                  onChange={(e) => setFbCategory(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs"
                >
                  <option value="All">All Categories</option>
                  <option value="Fashion & Lifestyle">Fashion & Lifestyle</option>
                  <option value="E-Commerce & Digital">E-Commerce & Digital</option>
                  <option value="Smart Gadgets & Tech">Smart Gadgets & Tech</option>
                  <option value="Food & Organic">Food & Organic</option>
                  <option value="Buy & Sell Market">Buy & Sell Market</option>
                  <option value="Affiliate & Deals">Affiliate & Deals</option>
                </select>
              </div>

              {/* Activity Score Threshold */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground">Activity Score Filter</label>
                <div className="flex items-center space-x-1.5">
                  {[0, 70, 80, 90].map((score) => (
                    <button
                      key={score}
                      onClick={() => setFbMinScore(score)}
                      className={`flex-1 py-1 rounded border font-extrabold text-[11px] transition ${
                        fbMinScore === score
                          ? "bg-blue-600 text-white border-blue-600"
                          : "hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {score === 0 ? "All" : `${score}+`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Auto-Approval Toggle */}
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="auto-approve-toggle"
                checked={fbAutoApproveOnly}
                onChange={(e) => setFbAutoApproveOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600"
              />
              <label htmlFor="auto-approve-toggle" className="text-xs text-muted-foreground cursor-pointer font-medium">
                Show only 100% Public Auto-Approval Groups (Skip Admin Approval)
              </label>
            </div>
          </div>

          {/* FB Groups Results List */}
          <div className="border border-border bg-card rounded-xl shadow-sm overflow-hidden text-xs">
            <div className="p-3 bg-muted/40 border-b border-border flex items-center justify-between font-bold text-foreground">
              <span>Hunted Public Groups ({filteredFbGroups.length})</span>
              <span className="text-[11px] text-muted-foreground font-normal">
                Real calculated activity scores & post frequency
              </span>
            </div>

            {filteredFbGroups.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <Compass className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
                <p className="font-bold text-foreground">No local groups match &ldquo;{fbSearch}&rdquo;</p>
                <p className="text-muted-foreground text-xs">
                  Click below to hunt live Facebook groups for this keyword directly from your connected Facebook ID!
                </p>
                {fbSearch.trim() && (
                  <button
                    onClick={() => {
                      const q = fbSearch.trim()
                      setFbSearch("")
                      setLiveKeyword(q)
                      handleLiveKeywordHunt(q)
                    }}
                    disabled={isScanning}
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>🔍 Hunt &ldquo;{fbSearch}&rdquo; on Live Facebook</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredFbGroups.map((grp) => (
                  <div
                    key={grp.id}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/30 transition"
                  >
                    {/* Left: Info */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <a
                          href={grp.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-black text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                        >
                          <span>{grp.name}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        {(grp.isLiveHunted || grp.isLiveExtracted) && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>LIVE FB</span>
                          </span>
                        )}
                        {grp.autoApproval && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Auto-Approval</span>
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                          {grp.country}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                          {grp.category}
                        </span>
                      </div>

                      <p className="text-[11px] text-muted-foreground">
                        <strong className="text-foreground">Niche:</strong> {grp.niche}
                      </p>

                      <div className="flex items-center flex-wrap gap-3 text-[11px] text-muted-foreground pt-0.5">
                        <span>
                          Total Members:{" "}
                          <strong className="text-foreground font-black">
                            {grp.memberCount.toLocaleString()}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Active Members (Est.):{" "}
                          <strong className="text-blue-600 dark:text-blue-400 font-black">
                            {grp.activeMembersEst.toLocaleString()}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Daily Post Frequency:{" "}
                          <strong className="text-foreground font-black">
                            {grp.dailyPostFrequency} posts/day
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Middle: Scores */}
                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="p-2 border rounded-xl bg-card text-center min-w-[90px] shadow-xs">
                        <span className="text-[9px] font-black text-muted-foreground block uppercase tracking-wider">
                          Activity Score
                        </span>
                        <span className="text-base font-black text-foreground">
                          {grp.activityScore} / 100
                        </span>
                      </div>

                      <div className="p-2 border rounded-xl bg-card text-center min-w-[90px] shadow-xs">
                        <span className="text-[9px] font-black text-muted-foreground block uppercase tracking-wider">
                          Engagement
                        </span>
                        <span className="text-base font-black text-blue-600 dark:text-blue-400">
                          {grp.engagementPrediction}%
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center flex-wrap gap-2 shrink-0">
                      <button
                        onClick={() => handleCopy(grp.url, grp.id)}
                        title="Copy Facebook Group URL"
                        className="p-2 rounded-lg border bg-background hover:bg-muted transition text-muted-foreground hover:text-foreground min-h-[36px] min-w-[36px] flex items-center justify-center"
                      >
                        {copiedId === grp.id ? (
                          <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      {grp.joinStatus === "JOINED" ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-2 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 min-h-[36px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Joined</span>
                        </span>
                      ) : grp.joinStatus === "REQUESTED" ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-2 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 min-h-[36px]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Requested</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleJoinOnLiveFb(grp)}
                          disabled={joiningGroupId === grp.id}
                          className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs min-h-[36px] disabled:opacity-50"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>{joiningGroupId === grp.id ? "Joining..." : "Join on Live FB"}</span>
                        </button>
                      )}

                      {grp.isSavedToPostGroup ? (
                        <button
                          disabled
                          className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-muted text-muted-foreground border border-border cursor-default min-h-[36px]"
                        >
                          <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Saved</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSaveToPostGroup(grp)}
                          className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs min-h-[36px]"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>Save to Post A Group</span>
                        </button>
                      )}

                      <button
                        onClick={() => deleteFbGroup(grp.id)}
                        title="Delete Group"
                        className="p-2 rounded-lg border bg-background hover:bg-red-500/10 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
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
      {/* TAB 2: MESSENGER GROUP LINK FINDER                      */}
      {/* ======================================================== */}
      {activeTab === "MESSENGER" && (
        <div className="space-y-4">
          {/* Messenger Filters */}
          <div className="border border-border bg-card p-4 rounded-xl space-y-3 shadow-xs text-xs">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-foreground">
                  Messenger Community Group Hunter (m.me/j/...)
                </h3>
              </div>
              <button
                onClick={() => triggerScan("MESSENGER")}
                disabled={isScanning}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-xs disabled:opacity-50 min-h-[36px]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
                <span>{isScanning ? "Scanning Messenger Links..." : "Scan Messenger Groups"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Search */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Community Keyword</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by community name..."
                    value={msgrSearch}
                    onChange={(e) => setMsgrSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border rounded-lg bg-background text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition min-h-[36px]"
                  />
                </div>
              </div>

              {/* Country */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Country</label>
                <select
                  value={msgrCountry}
                  onChange={(e) => setMsgrCountry(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition min-h-[36px]"
                >
                  <option value="All">All Countries</option>
                  <option value="Bangladesh">Bangladesh (BD)</option>
                  <option value="USA">United States (USA)</option>
                  <option value="UK">United Kingdom (UK)</option>
                </select>
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Community Category</label>
                <select
                  value={msgrCategory}
                  onChange={(e) => setMsgrCategory(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition min-h-[36px]"
                >
                  <option value="All">All Categories</option>
                  <option value="Buy & Sell Community">Buy & Sell Community</option>
                  <option value="DropShipping & E-Com">DropShipping & E-Com</option>
                  <option value="Resellers Wholesale">Resellers Wholesale</option>
                  <option value="Gadget Hunters">Gadget Hunters</option>
                  <option value="Affiliate Marketing">Affiliate Marketing</option>
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Capacity / Status</label>
                <select
                  value={msgrStatusFilter}
                  onChange={(e) => setMsgrStatusFilter(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition min-h-[36px]"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="High Activity">High Activity</option>
                  <option value="Almost Full">Almost Full (240+)</option>
                  <option value="Full">Full (250/250)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Messenger Results List */}
          <div className="border border-border bg-card rounded-xl shadow-xs overflow-hidden text-xs">
            <div className="p-3 bg-muted/40 border-b border-border flex items-center justify-between font-bold text-foreground">
              <span>Discovered Messenger Communities ({filteredMsgrGroups.length})</span>
              <span className="text-[11px] text-muted-foreground font-normal">
                Direct invite links, 24h message velocity, and member counts
              </span>
            </div>

            {filteredMsgrGroups.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
                <p className="font-bold text-foreground">No Messenger links found</p>
                <p className="text-muted-foreground text-xs">
                  Adjust your search or country criteria to discover more community links.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredMsgrGroups.map((msg) => {
                  const capacityPercent = Math.round((msg.memberCount / msg.maxCapacity) * 100)
                  return (
                    <div
                      key={msg.id}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/30 transition"
                    >
                      {/* Left: Info */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="font-black text-sm text-foreground">
                            {msg.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              msg.status === "Almost Full"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                : msg.status === "Full"
                                ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                                : "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                            }`}
                          >
                            {msg.status}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                            {msg.country}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                            {msg.category}
                          </span>
                        </div>

                        <p className="text-[11px] text-muted-foreground">
                          <strong className="text-foreground">Invite URL:</strong>{" "}
                          <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px] text-blue-600 dark:text-blue-400">
                            {msg.inviteUrl}
                          </code>
                        </p>

                        <div className="flex items-center flex-wrap gap-3 text-[11px] text-muted-foreground pt-0.5">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span>Last message: <strong className="text-foreground">{msg.lastMessageTime}</strong></span>
                          </span>
                          <span>•</span>
                          <span>
                            24h Messages: <strong className="text-foreground font-black">{msg.messagesLast24h}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Active Chatters: <strong className="text-blue-600 dark:text-blue-400 font-black">{msg.activeChatters}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Middle: Capacity Progress & Activity Score */}
                      <div className="flex items-center space-x-4 shrink-0">
                        {/* Capacity gauge */}
                        <div className="w-28 space-y-1">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-muted-foreground">Capacity</span>
                            <span className="text-foreground">
                              {msg.memberCount} / {msg.maxCapacity}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                capacityPercent >= 98
                                  ? "bg-red-500"
                                  : capacityPercent >= 90
                                  ? "bg-amber-500"
                                  : "bg-blue-600"
                              }`}
                              style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Activity Score */}
                        <div className="p-2 border rounded-xl bg-card text-center min-w-[85px] shadow-xs">
                          <span className="text-[9px] font-black text-muted-foreground block uppercase tracking-wider">
                            Chat Velocity
                          </span>
                          <span className="text-base font-black text-foreground">
                            {msg.activityScore} / 100
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => handleCopy(msg.inviteUrl, msg.id)}
                          title="Copy Invite URL"
                          className="p-2 rounded-lg border bg-background hover:bg-muted transition text-muted-foreground hover:text-foreground min-h-[36px] min-w-[36px] flex items-center justify-center"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        <a
                          href={msg.inviteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs min-h-[36px]"
                        >
                          <span>Join in Messenger</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        <button
                          onClick={() => deleteMsgrGroup(msg.id)}
                          title="Delete Community Link"
                          className="p-2 rounded-lg border bg-background hover:bg-red-500/10 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: SAVED TO POST A GROUP (MODULE 12 BRIDGE)          */}
      {/* ======================================================== */}
      {activeTab === "SAVED" && (
        <div className="space-y-4">
          <div className="border border-blue-500/20 bg-blue-500/5 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <BookmarkCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-sm text-foreground">
                  Module 12 Integration Bridge Active
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                These hunted public groups have been directly synced into Module 12 (Post A Group) storage key (
                <code className="text-[10px] font-mono">bmt_saved_custom_groups</code>). You can post multi-account campaigns directly to them!
              </p>
            </div>

            <button
              onClick={navigateToModule12}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition shadow-xs shrink-0 min-h-[36px]"
            >
              <span>Go to Module 12 (Post A Group)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="border border-border bg-card rounded-xl shadow-xs overflow-hidden text-xs">
            <div className="p-3 bg-muted/40 border-b border-border flex items-center justify-between font-bold text-foreground">
              <span>Groups Queued for Posting ({savedForPostGroups.length})</span>
              <span className="text-[11px] text-muted-foreground font-normal">
                Synced and ready for multi-account publishing
              </span>
            </div>

            {savedForPostGroups.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bookmark className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
                <p className="font-bold text-foreground">No groups saved yet</p>
                <p className="text-muted-foreground text-xs">
                  Go to the &quot;Facebook Active Groups&quot; tab and click &quot;Save to Post A Group&quot; on any group.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {savedForPostGroups.map((grp) => (
                  <div
                    key={grp.id}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/30 transition"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2">
                        <a
                          href={grp.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-black text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                        >
                          <span>{grp.name}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          Auto-Approval
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-[11px] text-muted-foreground">
                        <span>Members: {grp.memberCount.toLocaleString()}</span>
                        <span>•</span>
                        <span>Category: {grp.category}</span>
                        <span>•</span>
                        <span>Activity Score: {grp.activityScore}/100</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCopy(grp.url, grp.id)}
                        className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-muted flex items-center space-x-1.5 transition min-h-[36px]"
                      >
                        {copiedId === grp.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Link</span>
                          </>
                        )}
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
      {/* MODAL: ADD CUSTOM FB GROUP                               */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-base text-foreground">Add Custom Facebook Group</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomGroup} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Group Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BD Digital Marketers & Entrepreneurs"
                  value={newFbName}
                  onChange={(e) => setNewFbName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition min-h-[38px]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Group URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://facebook.com/groups/..."
                  value={newFbUrl}
                  onChange={(e) => setNewFbUrl(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition min-h-[38px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Country</label>
                  <select
                    value={newFbCountry}
                    onChange={(e) => setNewFbCountry(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition min-h-[38px]"
                  >
                    <option value="Bangladesh">Bangladesh</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Category</label>
                  <select
                    value={newFbCategory}
                    onChange={(e) => setNewFbCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition min-h-[38px]"
                  >
                    <option value="Fashion & Lifestyle">Fashion & Lifestyle</option>
                    <option value="E-Commerce & Digital">E-Commerce & Digital</option>
                    <option value="Smart Gadgets & Tech">Smart Gadgets & Tech</option>
                    <option value="Food & Organic">Food & Organic</option>
                    <option value="Buy & Sell Market">Buy & Sell Market</option>
                    <option value="Affiliate & Deals">Affiliate & Deals</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Niche Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Dropshipping, Clothing"
                    value={newFbNiche}
                    onChange={(e) => setNewFbNiche(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition min-h-[38px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Approx. Member Count</label>
                  <input
                    type="number"
                    min="100"
                    value={newFbMembers}
                    onChange={(e) => setNewFbMembers(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition min-h-[38px]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border hover:bg-muted font-semibold text-xs min-h-[38px] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition min-h-[38px]"
                >
                  Save Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
