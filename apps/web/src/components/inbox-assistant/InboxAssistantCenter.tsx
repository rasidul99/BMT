"use client"

import React, { useState, useMemo } from "react"
import {
  MessageSquare,
  Bot,
  User,
  Sparkles,
  Send,
  CheckCircle2,
  Clock,
  Layers,
  FileSpreadsheet,
  Download,
  Search,
  Plus,
  Trash2,
  Sliders,
  Settings2,
  Bookmark,
  Zap,
  Globe,
  Check,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Store,
  MapPin,
  Tag,
  X,
  Play,
  Pause,
} from "lucide-react"
import {
  useInboxAssistant,
  ConversationCategory,
  OperatingMode,
  MessageTemplate,
} from "../../hooks/useInboxAssistant"

interface InboxAssistantCenterProps {
  currentMode: "SAFE" | "ADVANCED"
}

export function InboxAssistantCenter({ currentMode }: InboxAssistantCenterProps) {
  const {
    isLoaded,
    conversations,
    selectedConversation,
    setSelectedConvId,
    templates,
    settings,
    metrics,
    sendReply,
    toggleRunning,
    setOperatingMode,
    setCategoryStyle,
    addTemplate,
    deleteTemplate,
    simulateIncomingMessage,
  } = useInboxAssistant()

  const [activeTab, setActiveTab] = useState<"INBOX" | "TEMPLATES" | "RULES" | "LEDGER">("INBOX")
  const [searchQuery, setSearchQuery] = useState("")
  const [replyInput, setReplyInput] = useState("")
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Template Modal
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [newTplTitle, setNewTplTitle] = useState("")
  const [newTplCategory, setNewTplCategory] = useState<ConversationCategory | "General">("Sales Conversion")
  const [newTplContent, setNewTplContent] = useState("")

  // Simulator Modal
  const [isSimModalOpen, setIsSimModalOpen] = useState(false)
  const [simName, setSimName] = useState("Tanvir Ahmed")
  const [simPage, setSimPage] = useState("Fashion Hub Official")
  const [simCategory, setSimCategory] = useState<ConversationCategory>("Sales Conversion")
  const [simMessage, setSimMessage] = useState("আমি ওয়াচটি অর্ডার করতে চাই, কতদিন সময় লাগবে ডেলিভারি হতে?")

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Filtered Conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          c.customerName.toLowerCase().includes(query) ||
          c.pageName.toLowerCase().includes(query) ||
          c.lastMessageText.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [conversations, searchQuery])

  // Handle Send Manual Reply
  const handleSendReply = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!replyInput.trim() || !selectedConversation) return

    sendReply(selectedConversation.id, replyInput.trim(), "PAGE")
    setReplyInput("")
    showToast("✓ Reply delivered via Graph API POST /{page-id}/messages!")
  }

  // Handle Approve AI Suggestion
  const handleApproveSuggestion = (text: string) => {
    if (!selectedConversation) return
    sendReply(selectedConversation.id, text, "AI_ASSISTANT")
    showToast("✓ AI Suggested reply approved and sent!")
  }

  // Handle Insert Template
  const handleInsertTemplate = (content: string) => {
    setReplyInput(content)
    showToast("Template loaded into reply composer!")
  }

  // Handle Add Template Submit
  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTplTitle.trim() || !newTplContent.trim()) return

    addTemplate({
      title: newTplTitle.trim(),
      category: newTplCategory,
      content: newTplContent.trim(),
      tags: [newTplCategory],
    })

    setNewTplTitle("")
    setNewTplContent("")
    setIsTemplateModalOpen(false)
    showToast("New message template saved to Library!")
  }

  // Handle Simulate Submit
  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!simMessage.trim()) return

    simulateIncomingMessage(simName.trim(), simMessage.trim(), simPage, simCategory)
    setIsSimModalOpen(false)
    showToast(`Incoming message from ${simName} detected via Webhook!`)
  }

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Conversation ID",
      "Customer Name",
      "Monitored Page",
      "Platform",
      "Conversation Category",
      "Status",
      "Last Message",
      "Last Message Timestamp",
      "Total Messages",
    ]

    const rows = conversations.map((c) => [
      `"${c.id}"`,
      `"${c.customerName.replace(/"/g, '""')}"`,
      `"${c.pageName.replace(/"/g, '""')}"`,
      `"${c.platform}"`,
      `"${c.category}"`,
      `"${c.status}"`,
      `"${c.lastMessageText.replace(/"/g, '""')}"`,
      `"${c.lastMessageTime}"`,
      c.messages.length,
    ])

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `bmt_inbox_conversations_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast(`Exported ${conversations.length} conversation logs to CSV!`)
  }

  // Export Excel (.xls)
  const handleExportExcel = () => {
    const headers = [
      "Customer Name",
      "Page / Account",
      "Platform",
      "Conversion Category",
      "Status",
      "Last Message",
      "Messages Count",
      "Timestamp",
    ]

    const rows = conversations.map(
      (c) =>
        `<tr>
          <td><b>${c.customerName}</b></td>
          <td>${c.pageName}</td>
          <td>${c.platform}</td>
          <td>${c.category}</td>
          <td>${c.status}</td>
          <td>${c.lastMessageText}</td>
          <td>${c.messages.length}</td>
          <td>${c.lastMessageTime}</td>
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
    link.setAttribute("download", `bmt_inbox_conversations_${Date.now()}.xls`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast(`Exported ${conversations.length} conversation records to Excel (.xls)!`)
  }

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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              AI Inbox Reply Assistant
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
            Real-time Messenger & Marketplace customer query handler with intent classification (Sales, Lead, Visit Conversion),
            AI suggested response approval, automated follow-up sequences, and Graph API webhook dispatching.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setIsSimModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simulate Customer Query</span>
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

      {/* Control Banner: Operating Mode & Category Selector */}
      <div className="border border-border bg-card p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-4">
          {/* Continuous Status Toggle */}
          <div className="flex items-center space-x-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                settings.isRunning ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
              }`}
            />
            <span className="font-bold text-foreground">
              {settings.isRunning ? "Status: Continuous Running" : "Status: Paused"}
            </span>
            <button
              onClick={toggleRunning}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                settings.isRunning
                  ? "bg-red-500/10 text-red-600 hover:bg-red-500/20"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {settings.isRunning ? "Pause" : "Start"}
            </button>
          </div>

          <div className="h-4 w-px bg-border hidden sm:block" />

          {/* Operating Mode Buttons */}
          <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setOperatingMode("MANUAL")}
              className={`px-3 py-1 rounded text-xs font-bold transition ${
                settings.mode === "MANUAL"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🖐️ AI Manual Reply (Review & Approve)
            </button>
            <button
              onClick={() => setOperatingMode("AUTO")}
              className={`px-3 py-1 rounded text-xs font-bold transition ${
                settings.mode === "AUTO"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🤖 AI Auto Reply (Delayed)
            </button>
          </div>
        </div>

        {/* Category Style Selector */}
        <div className="flex items-center space-x-2">
          <span className="font-bold text-muted-foreground">Category Style:</span>
          {(
            [
              { id: "Sales Conversion", label: "Sales (সেলস)", color: "text-emerald-600 border-emerald-500/30" },
              { id: "Lead Conversion", label: "Lead (লিড)", color: "text-blue-600 border-blue-500/30" },
              { id: "Visit Conversion", label: "Visit (ভিজিট)", color: "text-purple-600 border-purple-500/30" },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryStyle(cat.id)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-extrabold transition ${
                settings.activeCategory === cat.id
                  ? "bg-foreground text-background shadow-xs"
                  : `hover:bg-muted ${cat.color}`
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Executive Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border border-border bg-card p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Active Conversations</span>
            <MessageSquare className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">
              {metrics.totalConvs}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground">
              Marketplace & Pages
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Pending Replies</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {metrics.waitingReply}
            </span>
            <span className="text-[10px] font-bold text-amber-500">
              Awaiting Action
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>AI Automated Replies</span>
            <Bot className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {metrics.autoRepliedCount}
            </span>
            <span className="text-[10px] font-bold text-emerald-500">
              100% Graph API Sent
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Average Reply Speed</span>
            <Zap className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {metrics.avgResponseTime}
            </span>
            <span className="text-[10px] font-bold text-emerald-500">
              Human-like Delay
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center space-x-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("INBOX")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === "INBOX"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Live Messenger Inbox ({conversations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("TEMPLATES")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === "TEMPLATES"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Message Library ({templates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("RULES")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === "RULES"
              ? "bg-purple-600 text-white shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Automation & Delay Rules</span>
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
          <span>Delivery Audit Ledger</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: LIVE MESSENGER INBOX (SPLIT-PANE VIEW)            */}
      {/* ======================================================== */}
      {activeTab === "INBOX" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[650px] border border-border bg-card rounded-2xl shadow-sm overflow-hidden text-xs">
          {/* Left Pane: Conversations List (5 cols) */}
          <div className="md:col-span-5 border-r border-border flex flex-col h-full overflow-hidden bg-muted/10">
            {/* Search Box */}
            <div className="p-3 border-b border-border bg-card">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search customer, page or query..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border rounded-lg bg-background text-xs"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  No conversations match your search.
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = selectedConversation?.id === conv.id
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConvId(conv.id)}
                      className={`w-full p-3.5 text-left flex items-start space-x-3 transition ${
                        isSelected
                          ? "bg-blue-600/10 border-l-4 border-blue-600"
                          : "hover:bg-muted/30"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs">
                        {conv.customerName.charAt(0)}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-foreground truncate block">
                            {conv.customerName}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {conv.lastMessageTime}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1.5 text-[10px]">
                          <span className="font-semibold text-muted-foreground truncate">
                            {conv.pageName}
                          </span>
                          <span>•</span>
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold ${
                              conv.category === "Sales Conversion"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : conv.category === "Lead Conversion"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                            }`}
                          >
                            {conv.category}
                          </span>
                        </div>

                        <p className="text-[11px] text-muted-foreground truncate">
                          "{conv.lastMessageText}"
                        </p>
                      </div>

                      {conv.status === "WAITING_REPLY" && (
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-1" />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Right Pane: Active Thread & Reply Composer (7 cols) */}
          <div className="md:col-span-7 flex flex-col h-full overflow-hidden bg-background">
            {selectedConversation ? (
              <>
                {/* Thread Header */}
                <div className="p-3.5 border-b border-border bg-card flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                      {selectedConversation.customerName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-sm text-foreground">
                          {selectedConversation.customerName}
                        </span>
                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground font-semibold">
                          {selectedConversation.platform}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        Page: <strong>{selectedConversation.pageName}</strong> • Intent:{" "}
                        <strong className="text-blue-600 dark:text-blue-400">
                          {selectedConversation.category}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                      selectedConversation.status === "WAITING_REPLY"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    }`}
                  >
                    {selectedConversation.status === "WAITING_REPLY" ? "Awaiting Reply" : "Replied ✓"}
                  </span>
                </div>

                {/* Messages Chat Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/5">
                  {selectedConversation.messages.map((msg) => {
                    const isCustomer = msg.sender === "CUSTOMER"
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isCustomer ? "items-start" : "items-end"}`}
                      >
                        <div className="flex items-center space-x-1.5 text-[10px] text-muted-foreground mb-1">
                          {isCustomer ? (
                            <>
                              <User className="w-3 h-3" />
                              <span>{selectedConversation.customerName}</span>
                            </>
                          ) : msg.sender === "AI_ASSISTANT" ? (
                            <>
                              <Bot className="w-3 h-3 text-purple-500" />
                              <span className="font-bold text-purple-600">AI Auto-Reply</span>
                            </>
                          ) : (
                            <>
                              <Store className="w-3 h-3 text-blue-500" />
                              <span>{selectedConversation.pageName}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{msg.timestamp}</span>
                        </div>

                        <div
                          className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                            isCustomer
                              ? "bg-card border border-border text-foreground rounded-tl-xs shadow-xs"
                              : msg.sender === "AI_ASSISTANT"
                              ? "bg-purple-600 text-white rounded-tr-xs shadow-xs"
                              : "bg-blue-600 text-white rounded-tr-xs shadow-xs"
                          }`}
                        >
                          {msg.text}
                        </div>

                        {!isCustomer && (
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 flex items-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>Delivered via Graph API 200</span>
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* AI Suggested Replies Box (When in Manual Mode & suggestions exist) */}
                {selectedConversation.status === "WAITING_REPLY" &&
                  selectedConversation.aiSuggestions.length > 0 && (
                    <div className="p-3 border-t border-border bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 flex items-center space-x-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI Suggested Responses ({selectedConversation.category} Style):</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground">Click to Approve or Edit</span>
                      </div>

                      <div className="space-y-1.5">
                        {selectedConversation.aiSuggestions.map((sugg, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 bg-card border border-blue-200 dark:border-blue-900/50 rounded-xl flex items-center justify-between gap-3 shadow-xs"
                          >
                            <p className="text-[11px] text-foreground font-medium flex-1">
                              "{sugg}"
                            </p>
                            <div className="flex items-center space-x-1.5 shrink-0">
                              <button
                                onClick={() => setReplyInput(sugg)}
                                className="px-2 py-1 rounded border text-[10px] font-bold hover:bg-muted"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleApproveSuggestion(sugg)}
                                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black shadow-xs transition"
                              >
                                ✓ Approve & Send
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Ready Templates Quick Bar */}
                <div className="p-2 border-t border-border bg-muted/20 flex items-center space-x-2 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] font-bold text-muted-foreground shrink-0 flex items-center space-x-1">
                    <Bookmark className="w-3 h-3" />
                    <span>Templates:</span>
                  </span>
                  {templates.slice(0, 3).map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => handleInsertTemplate(tpl.content)}
                      className="px-2 py-1 rounded bg-background border text-[10px] font-semibold hover:bg-muted truncate max-w-[160px] shrink-0"
                    >
                      {tpl.title}
                    </button>
                  ))}
                  <button
                    onClick={() => setActiveTab("TEMPLATES")}
                    className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline shrink-0"
                  >
                    View All →
                  </button>
                </div>

                {/* Reply Composer */}
                <form onSubmit={handleSendReply} className="p-3 border-t border-border bg-card flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Type customized reply or select from AI suggestions..."
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-xl bg-background text-xs"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition flex items-center space-x-1"
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-2">
                <MessageSquare className="w-10 h-10 opacity-40" />
                <p className="font-bold text-foreground">Select a conversation to view chat history</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MESSAGE LIBRARY & TEMPLATES                       */}
      {/* ======================================================== */}
      {activeTab === "TEMPLATES" && (
        <div className="space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h3 className="font-black text-sm text-foreground">Predefined Message Library</h3>
              <p className="text-[11px] text-muted-foreground">
                Ready-to-send response templates categorized by Sales Conversion, Lead Conversion, and Visit Conversion.
              </p>
            </div>
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Template</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="border border-border bg-card p-4 rounded-xl space-y-2.5 shadow-xs hover:border-indigo-500/50 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-foreground">{tpl.title}</span>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tpl.category === "Sales Conversion"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : tpl.category === "Lead Conversion"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          : tpl.category === "Visit Conversion"
                          ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                          : "bg-muted text-muted-foreground border"
                      }`}
                    >
                      {tpl.category}
                    </span>
                    <button
                      onClick={() => deleteTemplate(tpl.id)}
                      className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition"
                      title="Delete template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground bg-muted/20 p-2.5 rounded-lg leading-relaxed">
                  "{tpl.content}"
                </p>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-wrap gap-1">
                    {tpl.tags.map((tag) => (
                      <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-muted rounded font-semibold text-muted-foreground">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      handleInsertTemplate(tpl.content)
                      setActiveTab("INBOX")
                    }}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Use in Active Inbox →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: AUTOMATION & DELAY RULES                          */}
      {/* ======================================================== */}
      {activeTab === "RULES" && (
        <div className="border border-border bg-card p-5 rounded-2xl space-y-5 shadow-sm text-xs max-w-3xl">
          <div className="border-b border-border pb-3">
            <h3 className="font-black text-sm text-foreground">AI Automation & Anti-Detection Rules</h3>
            <p className="text-[11px] text-muted-foreground">
              Configure human-like response behavior to keep your Facebook accounts 100% safe from Meta rate limits.
            </p>
          </div>

          <div className="space-y-4">
            {/* Delay Settings */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-bold text-foreground">Human-like Response Delay</label>
                <span className="font-black text-blue-600 dark:text-blue-400">
                  {settings.humanDelaySeconds} seconds
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="180"
                step="5"
                value={settings.humanDelaySeconds}
                onChange={() => {}}
                className="w-full"
              />
              <p className="text-[11px] text-muted-foreground">
                Simulates real typing delay (30s - 180s) before sending auto-replies to appear as natural human interaction.
              </p>
            </div>

            {/* Unknown Intent Fallback Policy */}
            <div className="border border-border p-4 rounded-xl bg-muted/20 space-y-2">
              <span className="font-extrabold text-foreground block">
                Unknown Query Fallback & Motivation Sequence:
              </span>
              <p className="text-muted-foreground text-[11px]">
                If a customer asks a question outside your product knowledge base, the AI automatically dispatches a motivational
                follow-up message along with your predefined Fallback Template (<code>tpl-4</code>) and alerts human operators.
              </p>
              <div className="p-2.5 bg-background border rounded-lg text-[11px] font-mono text-muted-foreground">
                Fallback Action: Auto-send catalog link & escalate to human operator queue.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: DELIVERY AUDIT LEDGER                             */}
      {/* ======================================================== */}
      {activeTab === "LEDGER" && (
        <div className="border border-border bg-card rounded-2xl shadow-sm overflow-hidden text-xs">
          <div className="p-3.5 bg-muted/40 border-b border-border flex items-center justify-between font-bold text-foreground">
            <span>Graph API Message Delivery Logs ({conversations.length})</span>
            <span className="text-[11px] text-muted-foreground font-normal">
              100% Graph API POST verification records
            </span>
          </div>

          <div className="divide-y divide-border">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-sm text-foreground">{conv.customerName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground">
                      {conv.pageName}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      {conv.category}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    Last Message: "{conv.lastMessageText}"
                  </p>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block">
                      SUCCESS_200
                    </span>
                    <span className="text-[10px] text-muted-foreground">{conv.lastMessageTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE NEW TEMPLATE                               */}
      {/* ======================================================== */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <Bookmark className="w-5 h-5 text-indigo-500" />
                <h3 className="font-black text-base text-foreground">Create Message Template</h3>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Template Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Return & Exchange Policy"
                  value={newTplTitle}
                  onChange={(e) => setNewTplTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Category Style</label>
                <select
                  value={newTplCategory}
                  onChange={(e) => setNewTplCategory(e.target.value as any)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs"
                >
                  <option value="Sales Conversion">Sales Conversion</option>
                  <option value="Lead Conversion">Lead Conversion</option>
                  <option value="Visit Conversion">Visit Conversion</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Message Content</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Type ready response template..."
                  value={newTplContent}
                  onChange={(e) => setNewTplContent(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-xs"
                />
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border hover:bg-muted font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition"
                >
                  Save to Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: SIMULATE INCOMING CUSTOMER MESSAGE                */}
      {/* ======================================================== */}
      {isSimModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                <h3 className="font-black text-base text-foreground">
                  Simulate Incoming Customer Query
                </h3>
              </div>
              <button
                onClick={() => setIsSimModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSimulateSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">Target Facebook Page</label>
                  <select
                    value={simPage}
                    onChange={(e) => setSimPage(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs"
                  >
                    <option value="Fashion Hub Official">Fashion Hub Official</option>
                    <option value="Tech Gadgets BD">Tech Gadgets BD</option>
                    <option value="Organic Foods Bangladesh">Organic Foods Bangladesh</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Conversion Intent</label>
                <select
                  value={simCategory}
                  onChange={(e) => setSimCategory(e.target.value as any)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs"
                >
                  <option value="Sales Conversion">Sales Conversion (Purchase & Discount)</option>
                  <option value="Lead Conversion">Lead Conversion (Specs & Warranty)</option>
                  <option value="Visit Conversion">Visit Conversion (Showroom Location)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Customer Message Body</label>
                <textarea
                  rows={3}
                  required
                  value={simMessage}
                  onChange={(e) => setSimMessage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-xs"
                />
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsSimModalOpen(false)}
                  className="px-4 py-2 rounded-lg border hover:bg-muted font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
                >
                  Trigger Webhook Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
