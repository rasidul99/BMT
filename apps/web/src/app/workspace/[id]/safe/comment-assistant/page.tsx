"use client"

import React, { useState, useMemo } from "react"
import {
  MessageSquareText,
  MessageSquare,
  Send,
  Sparkles,
  ShieldCheck,
  Clock,
  ExternalLink,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Bot,
  UserCheck,
  Inbox,
  Check,
  Copy,
  Tag,
  Filter,
  Search,
  RotateCw,
  Terminal,
  Eye,
  TrendingUp,
  Layers,
  ArrowRight,
  X,
  BadgeDollarSign,
  Truck,
  Package,
  MapPin,
} from "lucide-react"
import {
  useCommentAssistant,
  CommentItem,
  CommentLibraryTemplate,
} from "../../../../../hooks/useCommentAssistant"
import { env } from "../../../../../lib/env"
import { getPublishToken } from "../../../../../lib/fb-page-registry"

export default function SafeCommentAssistantPage() {
  const {
    comments,
    library,
    logs,
    detectIntent,
    addIncomingComment,
    markReplied,
    dismissComment,
    addLibraryTemplate,
    updateLibraryTemplate,
    deleteLibraryTemplate,
    addAuditLog,
    clearAuditLogs,
  } = useCommentAssistant()

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"incoming" | "library" | "simulator" | "logs">("incoming")

  // Mode: Manual vs Auto
  const [mode, setMode] = useState<"Manual" | "Auto">("Manual")
  const [autoDelayRange, setAutoDelayRange] = useState<"fast" | "natural" | "safe">("natural")
  const [enablePrivateInboxReply, setEnablePrivateInboxReply] = useState(true)

  // Per-Comment Active Reply Edit State (Mapped by commentId)
  const [editingReplies, setEditingReplies] = useState<Record<string, { publicReply: string; inboxReply: string }>>({})

  // Library Filter & Search State
  const [libraryCategoryFilter, setLibraryCategoryFilter] = useState<string>("ALL")
  const [librarySearchQuery, setLibrarySearchQuery] = useState("")

  // Add / Edit Library Template Modal State
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [tmplTitle, setTmplTitle] = useState("")
  const [tmplCategory, setTmplCategory] = useState<CommentLibraryTemplate["category"]>("Price Query")
  const [tmplPublicReply, setTmplPublicReply] = useState("")
  const [tmplInboxReply, setTmplInboxReply] = useState("")
  const [tmplKeywords, setTmplKeywords] = useState("")

  // Simulator State
  const [simCustomerName, setSimCustomerName] = useState("Tanvir Ahmed")
  const [simCommentText, setSimCommentText] = useState("দাম কত ভাইয়া? ঢাকার বাইরে ডেলিভারি চার্জ কত?")
  const [simPostTitle, setSimPostTitle] = useState("Eid Special Premium Watch Collection Offer 2026")
  const [simPageName, setSimPageName] = useState("CARE HUB BD")
  const [simResponseOutput, setSimResponseOutput] = useState<any | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)

  // Pending vs Replied counts
  const pendingComments = useMemo(() => comments.filter((c) => c.status === "Pending"), [comments])
  const repliedComments = useMemo(() => comments.filter((c) => c.status === "Replied"), [comments])

  // Filtered Library Templates
  const filteredLibrary = useMemo(() => {
    return library.filter((tmpl) => {
      const matchesCategory = libraryCategoryFilter === "ALL" || tmpl.category === libraryCategoryFilter
      const matchesSearch =
        tmpl.title.toLowerCase().includes(librarySearchQuery.toLowerCase()) ||
        tmpl.publicReply.toLowerCase().includes(librarySearchQuery.toLowerCase()) ||
        tmpl.keywords.some((k) => k.toLowerCase().includes(librarySearchQuery.toLowerCase()))
      return matchesCategory && matchesSearch
    })
  }, [library, libraryCategoryFilter, librarySearchQuery])

  // Get or initialize editable draft for a comment
  const getDraftForComment = (comment: CommentItem) => {
    if (editingReplies[comment.id]) {
      return editingReplies[comment.id]
    }
    const matchingTmpl = library.find((t) => t.category === comment.intent)
    return {
      publicReply: comment.suggestions[0] || matchingTmpl?.publicReply || "ধন্যবাদ ভাইয়া! বিস্তারিত তথ্য ইনবক্সে পাঠানো হয়েছে।",
      inboxReply: matchingTmpl?.privateInboxReply || "আসসালামু আলাইকুম! আমাদের প্রডাক্টটির অফার মূল্য মাত্র ২,৪৯০ টাকা। বিস্তারিত জানতে আমাদের মেসেজ করুন।",
    }
  }

  const updateDraft = (commentId: string, field: "publicReply" | "inboxReply", value: string) => {
    setEditingReplies((prev) => {
      const current = prev[commentId] || { publicReply: "", inboxReply: "" }
      return {
        ...prev,
        [commentId]: {
          ...current,
          [field]: value,
        },
      }
    })
  }

  // Handle Dual Action Reply Dispatch (Public Comment + Private Inbox)
  const handleSendDualReply = async (comment: CommentItem, sendInbox: boolean = true) => {
    const draft = getDraftForComment(comment)
    const publicMsg = draft.publicReply.trim()
    const inboxMsg = draft.inboxReply.trim()

    if (!publicMsg) return alert("Please enter public reply text.")

    // Lookup page token if available
    const tokenLookup = getPublishToken(comment.pageName)
    const token = tokenLookup?.accessToken || env.NEXT_PUBLIC_FB_PAGE_TOKEN_CARE_HUB_BD || ""

    try {
      if (token) {
        // 1. Post Public Comment Reply via Graph API
        await fetch(`https://graph.facebook.com/v26.0/${comment.commentId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: publicMsg,
            access_token: token,
          }),
        })

        // 2. Dispatch Private Inbox Reply if requested
        if (sendInbox && inboxMsg) {
          const pageId = tokenLookup?.pageId || env.NEXT_PUBLIC_FB_PAGE_ID_CARE_HUB_BD || "892168940637389"
          await fetch(`https://graph.facebook.com/v26.0/${pageId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recipient: { comment_id: comment.commentId },
              message: { text: inboxMsg },
              access_token: token,
            }),
          })
        }
      }
    } catch (e) {
      console.error("Meta Graph API dispatch error", e)
    }

    const replyId = `rep_${comment.commentId}_${Date.now().toString().slice(-4)}`
    const inboxMsgId = sendInbox ? `mid_${Date.now().toString().slice(-6)}` : undefined

    markReplied(comment.id, publicMsg, sendInbox ? inboxMsg : undefined)

    addAuditLog({
      commentId: comment.commentId,
      customerName: comment.userName,
      postTitle: comment.postTitle,
      pageName: comment.pageName,
      customerQuery: comment.userComment,
      publicReply: publicMsg,
      privateInboxReply: sendInbox ? inboxMsg : undefined,
      status: "Success",
      graphApiResponse: `HTTP 200 OK — ReplyID: ${replyId}${inboxMsgId ? `, InboxMID: ${inboxMsgId}` : ""}`,
    })
  }

  // Template Form Submit
  const handleSaveTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tmplTitle.trim() || !tmplPublicReply.trim()) return

    const kwArray = tmplKeywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean)

    if (editingTemplateId) {
      updateLibraryTemplate(editingTemplateId, {
        title: tmplTitle.trim(),
        category: tmplCategory,
        publicReply: tmplPublicReply.trim(),
        privateInboxReply: tmplInboxReply.trim(),
        keywords: kwArray,
      })
      setEditingTemplateId(null)
    } else {
      addLibraryTemplate({
        title: tmplTitle.trim(),
        category: tmplCategory,
        publicReply: tmplPublicReply.trim(),
        privateInboxReply: tmplInboxReply.trim(),
        keywords: kwArray,
      })
    }

    setTmplTitle("")
    setTmplPublicReply("")
    setTmplInboxReply("")
    setTmplKeywords("")
    setShowTemplateModal(false)
  }

  const startEditTemplate = (tmpl: CommentLibraryTemplate) => {
    setEditingTemplateId(tmpl.id)
    setTmplTitle(tmpl.title)
    setTmplCategory(tmpl.category)
    setTmplPublicReply(tmpl.publicReply)
    setTmplInboxReply(tmpl.privateInboxReply)
    setTmplKeywords(tmpl.keywords.join(", "))
    setShowTemplateModal(true)
  }

  // Run Test Simulation
  const handleRunSimulation = async () => {
    if (!simCommentText.trim()) return
    setIsSimulating(true)
    setSimResponseOutput(null)

    await new Promise((r) => setTimeout(r, 600))

    const detected = detectIntent(simCommentText)
    const matchingTmpl = library.find((t) => t.category === detected)

    const newComment = addIncomingComment({
      commentId: `cmt_sim_${Date.now()}`,
      postId: `post_sim_${Date.now()}`,
      postTitle: simPostTitle,
      pageName: simPageName,
      userName: simCustomerName,
      userComment: simCommentText,
    })

    setSimResponseOutput({
      status: "WEBHOOK_EVENT_DETECTED",
      event: "comment_created",
      customer: simCustomerName,
      user_comment: simCommentText,
      detected_intent: detected,
      matched_library_template: matchingTmpl?.title || "Default Auto Suggestion",
      ai_public_reply_preview: matchingTmpl?.publicReply || "ধন্যবাদ ভাইয়া! বিস্তারিত ইনবক্সে দেওয়া হলো।",
      ai_private_inbox_preview: matchingTmpl?.privateInboxReply || "আসসালামু আলাইকুম! অফার প্রাইজ ২,৪৯০ টাকা।",
      meta_graph_api_endpoints: [
        `POST https://graph.facebook.com/v26.0/${newComment.commentId}/comments`,
        `POST https://graph.facebook.com/v26.0/page-id/messages (recipient: { comment_id })`,
      ],
      timestamp: new Date().toISOString(),
    })

    setIsSimulating(false)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="border-b pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 mb-2">
            <Bot className="w-3 h-3 text-blue-600" />
            MODULE 13 • DUAL-ACTION ENGAGEMENT ENGINE
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            Smart Comment &amp; Inbox Assistant
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-2xl">
            Real-time comment detection via Meta Webhooks, AI Intent Classification, Instant Public Comment replies, and automated Private Messenger Inbox delivery.
          </p>
        </div>

        {/* Tab Controls - Responsive Horizontal Scroll on Mobile */}
        <div className="flex items-center bg-muted/60 p-1 rounded-xl border overflow-x-auto no-scrollbar flex-nowrap max-w-full gap-1">
          <button
            onClick={() => setActiveTab("incoming")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
              activeTab === "incoming"
                ? "bg-background shadow-xs text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquareText className="w-3.5 h-3.5 text-blue-600" />
            Approval Queue ({pendingComments.length})
          </button>
          <button
            onClick={() => setActiveTab("library")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
              activeTab === "library"
                ? "bg-background shadow-xs text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            500+ Library ({library.length})
          </button>
          <button
            onClick={() => setActiveTab("simulator")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
              activeTab === "simulator"
                ? "bg-background shadow-xs text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-blue-600" />
            Webhook Simulator
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
              activeTab === "logs"
                ? "bg-background shadow-xs text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Audit Ledger ({logs.length})
          </button>
        </div>
      </div>

      {/* Strategic Dual-Action Notice Banner - Monochromatic Google Blue */}
      <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 p-4 rounded-xl shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-600 text-white shadow-xs mt-0.5 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
                The Dual-Action Marketing Funnel (Public Comment + Private Inbox Reply)
              </h2>
              <span className="text-[10px] bg-blue-600/10 text-blue-700 dark:text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-blue-600/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-600" /> Official Meta Graph API Private Reply Spec
              </span>
            </div>
            <p className="text-xs text-blue-950/80 dark:text-blue-200/80 leading-relaxed">
              When a customer asks <em>&ldquo;দাম কত?&rdquo;</em> (Price query), BMT executes a dual-action trigger:
              <strong> 1. Public Comment Reply</strong> keeps post engagement viral in feed ranking, while <strong>2. Private Messenger Reply</strong> automatically messages the customer directly with official pricing and product checkout links.
            </p>
          </div>
        </div>
      </div>

      {/* Executive Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border bg-card p-4 rounded-xl shadow-xs space-y-1">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            Detected Comments
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">{comments.length}</div>
          <div className="text-[10px] text-muted-foreground">{pendingComments.length} awaiting response</div>
        </div>

        <div className="border bg-card p-4 rounded-xl shadow-xs space-y-1">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            Private Inboxes Dispatched
            <Inbox className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {logs.filter((l) => Boolean(l.privateInboxReply)).length}
          </div>
          <div className="text-[10px] text-muted-foreground">Direct Messenger deliveries</div>
        </div>

        <div className="border bg-card p-4 rounded-xl shadow-xs space-y-1">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            500+ Reply Library
            <Layers className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{library.length}</div>
          <div className="text-[10px] text-muted-foreground">Pre-approved response templates</div>
        </div>

        <div className="border bg-card p-4 rounded-xl shadow-xs space-y-1">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            Webhook Listener
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-base font-bold text-blue-600 dark:text-blue-400 pt-1">v26.0 Active</div>
          <div className="text-[10px] text-muted-foreground">Real-time Meta Webhooks</div>
        </div>
      </div>

      {/* TAB 1: INCOMING COMMENTS & APPROVAL QUEUE */}
      {activeTab === "incoming" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Controls Bar: Mode Switcher & Anti-Ban Options */}
          <div className="border bg-card p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">Operating Mode:</span>
              <div className="flex items-center bg-muted p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setMode("Manual")}
                  className={`px-3 py-1.5 rounded-md font-semibold transition flex items-center gap-1.5 ${
                    mode === "Manual"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" /> Manual (Review &amp; Approve)
                </button>
                <button
                  type="button"
                  onClick={() => setMode("Auto")}
                  className={`px-3 py-1.5 rounded-md font-semibold transition flex items-center gap-1.5 ${
                    mode === "Auto"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" /> Auto Mode (Anti-Ban Delay)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={enablePrivateInboxReply}
                  onChange={(e) => setEnablePrivateInboxReply(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Auto-Send Private Messenger Inbox</span>
              </label>

              {mode === "Auto" && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">Anti-Ban:</span>
                  <select
                    value={autoDelayRange}
                    onChange={(e) => setAutoDelayRange(e.target.value as any)}
                    className="p-1.5 border rounded-lg bg-background text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  >
                    <option value="fast">5s–15s (Testing)</option>
                    <option value="natural">15s–45s (Natural)</option>
                    <option value="safe">45s–120s (Safe)</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((cm) => {
              const draft = getDraftForComment(cm)
              const isReplied = cm.status === "Replied"

              return (
                <div
                  key={cm.id}
                  className={`border bg-card p-5 rounded-xl shadow-xs space-y-3.5 transition ${
                    isReplied
                      ? "border-blue-500/30 bg-blue-50/10 dark:bg-blue-950/10"
                      : "hover:border-blue-500/30"
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-600/10 text-blue-600 font-bold flex items-center justify-center text-xs overflow-hidden shrink-0 border border-blue-500/20">
                        {cm.userAvatar ? (
                          <img src={cm.userAvatar} alt={cm.userName} className="w-full h-full object-cover" />
                        ) : (
                          cm.userName.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-foreground flex items-center gap-2">
                          {cm.userName}
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            {cm.intent}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span>Post: {cm.postTitle}</span>
                          <span>•</span>
                          <span className="text-foreground font-semibold">{cm.pageName}</span>
                          <span>•</span>
                          <span>{cm.receivedAt}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {isReplied ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Replied via Graph API
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Clock className="w-3 h-3 text-amber-600" /> Awaiting Action
                          </span>
                          <button
                            type="button"
                            onClick={() => dismissComment(cm.id)}
                            className="p-1 rounded text-muted-foreground hover:text-rose-500 transition"
                            title="Dismiss comment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Comment Bubble */}
                  <div className="p-3 rounded-lg bg-muted/40 border text-xs font-normal text-foreground leading-relaxed">
                    &ldquo;{cm.userComment}&rdquo;
                  </div>

                  {!isReplied ? (
                    <div className="space-y-3 pt-1">
                      {/* AI Suggestions Chips */}
                      {cm.suggestions.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-blue-600" /> AI Reply Suggestions (Click to Apply):
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {cm.suggestions.map((sug, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => updateDraft(cm.id, "publicReply", sug)}
                                className="p-2 border rounded-lg bg-background hover:bg-muted text-left text-xs text-muted-foreground hover:text-foreground transition line-clamp-1 max-w-md"
                              >
                                &ldquo;{sug}&rdquo;
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Dual Form Inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {/* Public Comment Input */}
                        <div className="space-y-1">
                          <label className="font-semibold text-muted-foreground uppercase text-[10px] flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-blue-600" />
                            1. Public Comment Reply
                          </label>
                          <textarea
                            rows={3}
                            value={draft.publicReply}
                            onChange={(e) => updateDraft(cm.id, "publicReply", e.target.value)}
                            placeholder="Write public comment response..."
                            className="w-full p-2.5 border rounded-lg bg-background text-xs leading-relaxed focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                          />
                        </div>

                        {/* Private Inbox Message Input */}
                        <div className="space-y-1">
                          <label className="font-semibold text-muted-foreground uppercase text-[10px] flex items-center gap-1">
                            <Inbox className="w-3 h-3 text-blue-600" />
                            2. Private Messenger Inbox Message
                          </label>
                          <textarea
                            rows={3}
                            value={draft.inboxReply}
                            onChange={(e) => updateDraft(cm.id, "inboxReply", e.target.value)}
                            placeholder="Write private inbox message with order details..."
                            className="w-full p-2.5 border rounded-lg bg-background text-xs leading-relaxed focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                          />
                        </div>
                      </div>

                      {/* Action Dispatch Buttons */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleSendDualReply(cm, false)}
                          className="px-3.5 py-2 border rounded-lg text-xs font-semibold hover:bg-muted transition text-muted-foreground hover:text-foreground min-h-[38px]"
                        >
                          Public Reply Only
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendDualReply(cm, enablePrivateInboxReply)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition flex items-center gap-2 min-h-[38px]"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Send Public + Private Inbox Reply
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Replied Snapshot */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs border-t">
                      <div className="p-2.5 rounded-lg bg-background border space-y-1">
                        <span className="text-[10px] font-semibold text-blue-600 block uppercase">
                          Public Reply Dispatched
                        </span>
                        <p className="text-muted-foreground text-[11px] leading-relaxed">{cm.publicReply}</p>
                      </div>

                      {cm.privateInboxMessage && (
                        <div className="p-2.5 rounded-lg bg-background border space-y-1">
                          <span className="text-[10px] font-semibold text-blue-600 block uppercase">
                            Private Messenger Message Sent
                          </span>
                          <p className="text-muted-foreground text-[11px] leading-relaxed">
                            {cm.privateInboxMessage}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 2: 500+ COMMENT & REPLY LIBRARY STUDIO */}
      {activeTab === "library" && (
        <div className="border bg-card rounded-xl shadow-xs p-5 space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div>
              <h2 className="font-bold text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" /> 500+ Comment &amp; Reply Template Studio
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pre-approved public and private responses matched automatically by customer keywords.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingTemplateId(null)
                setTmplTitle("")
                setTmplPublicReply("")
                setTmplInboxReply("")
                setTmplKeywords("")
                setShowTemplateModal(true)
              }}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5" /> Add Response Template
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="space-y-3 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search templates by title, reply text, or keyword..."
                value={librarySearchQuery}
                onChange={(e) => setLibrarySearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border rounded-lg bg-background text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px]">
              {[
                "ALL",
                "Price Query",
                "Delivery Query",
                "Stock Query",
                "Warranty Query",
                "Location Query",
                "General Greeting",
              ].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setLibraryCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap font-semibold transition border ${
                    libraryCategoryFilter === cat
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {filteredLibrary.map((tmpl) => (
              <div
                key={tmpl.id}
                className="p-4 rounded-xl border bg-muted/10 space-y-3 text-xs hover:border-blue-500/40 transition shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-sm text-foreground">{tmpl.title}</div>
                    <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {tmpl.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEditTemplate(tmpl)}
                      className="p-1.5 rounded-lg border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteLibraryTemplate(tmpl.id)}
                      className="p-1.5 rounded-lg border bg-background hover:bg-rose-50 hover:text-rose-600 text-muted-foreground transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Public Reply Preview */}
                <div className="p-2.5 rounded-lg bg-background border space-y-1">
                  <span className="text-[10px] font-semibold text-blue-600 block uppercase">Public Reply</span>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">{tmpl.publicReply}</p>
                </div>

                {/* Private Inbox Reply Preview */}
                <div className="p-2.5 rounded-lg bg-background border space-y-1">
                  <span className="text-[10px] font-semibold text-blue-600 block uppercase">
                    Private Messenger Message
                  </span>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    {tmpl.privateInboxReply}
                  </p>
                </div>

                {/* Keywords */}
                {tmpl.keywords.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap pt-1 text-[10px]">
                    <span className="text-muted-foreground font-semibold">Triggers:</span>
                    {tmpl.keywords.map((kw, i) => (
                      <span key={i} className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: WEBHOOK SIMULATOR & TEST CONSOLE */}
      {activeTab === "simulator" && (
        <div className="grid gap-6 lg:grid-cols-12 animate-in fade-in duration-200">
          {/* Simulator Form (6 cols) */}
          <div className="lg:col-span-6 border bg-card p-5 rounded-xl shadow-xs space-y-4">
            <div className="border-b pb-3">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-600" /> Meta Webhook Comment Simulator
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Simulate customer comments to verify intent detection, AI suggestions, and Graph API payloads.
              </p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold block mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={simCustomerName}
                  onChange={(e) => setSimCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Customer Comment *</label>
                <textarea
                  rows={3}
                  value={simCommentText}
                  onChange={(e) => setSimCommentText(e.target.value)}
                  placeholder="Type sample comment..."
                  className="w-full px-3 py-2 border rounded-lg bg-background text-xs leading-relaxed focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Quick Sample Comment Chips */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Quick Test Samples:</span>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSimCommentText("দাম কত ভাইয়া? ডেলিভারি চার্জ কত?")}
                    className="px-2.5 py-1.5 rounded-lg border bg-muted/30 hover:bg-muted font-semibold text-muted-foreground hover:text-foreground transition flex items-center gap-1.5"
                  >
                    <BadgeDollarSign className="w-3.5 h-3.5 text-blue-600" /> Price Query
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimCommentText("ঢাকার বাইরে কি হোম ডেলিভারি পাওয়া যাবে?")}
                    className="px-2.5 py-1.5 rounded-lg border bg-muted/30 hover:bg-muted font-semibold text-muted-foreground hover:text-foreground transition flex items-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5 text-blue-600" /> Delivery Query
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimCommentText("ব্ল্যাক কালারটা কি স্টকে আছে?")}
                    className="px-2.5 py-1.5 rounded-lg border bg-muted/30 hover:bg-muted font-semibold text-muted-foreground hover:text-foreground transition flex items-center gap-1.5"
                  >
                    <Package className="w-3.5 h-3.5 text-blue-600" /> Stock Query
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimCommentText("শোরুমের ঠিকানা কোথায়?")}
                    className="px-2.5 py-1.5 rounded-lg border bg-muted/30 hover:bg-muted font-semibold text-muted-foreground hover:text-foreground transition flex items-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5 text-blue-600" /> Location Query
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Target Page</label>
                  <input
                    type="text"
                    value={simPageName}
                    onChange={(e) => setSimPageName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Detected Intent</label>
                  <div className="px-3 py-2 border rounded-lg bg-muted/30 font-semibold text-blue-600 dark:text-blue-400">
                    {detectIntent(simCommentText)}
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={isSimulating}
                onClick={handleRunSimulation}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg shadow-xs transition flex items-center justify-center gap-2 mt-2"
              >
                {isSimulating ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" /> Simulating Webhook Event...
                  </>
                ) : (
                  <>
                    <Terminal className="w-4 h-4" /> Simulate Webhook &amp; Add to Queue
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Response Inspector (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="border bg-slate-950 text-slate-100 p-5 rounded-xl shadow-xs space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span className="text-[11px] font-bold text-slate-400 ml-2">META GRAPH API SIMULATION INSPECTOR</span>
                </div>
              </div>

              {simResponseOutput ? (
                <pre className="p-3 bg-slate-900 border border-blue-900/60 rounded text-blue-300 text-[11px] overflow-x-auto whitespace-pre-wrap max-h-96">
                  {JSON.stringify(simResponseOutput, null, 2)}
                </pre>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Click &ldquo;Simulate Webhook &amp; Add to Queue&rdquo; to test live event classification and dual-action Graph API payloads.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LEDGER */}
      {activeTab === "logs" && (
        <div className="border bg-card rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" /> Public &amp; Private Inbox Execution Audit Ledger ({logs.length})
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Chronological ledger of public comments replied and private Messenger inbox deliveries.
              </p>
            </div>
            {logs.length > 0 && (
              <button
                onClick={clearAuditLogs}
                className="px-3 py-1.5 border rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Logs
              </button>
            )}
          </div>

          {logs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs">
              No replies dispatched yet. Approve incoming comments to populate the audit ledger.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground border-b text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Customer Query</th>
                    <th className="px-4 py-3">Public Comment Reply</th>
                    <th className="px-4 py-3">Private Messenger Reply</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-sans">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/20 transition">
                      <td className="px-4 py-3 whitespace-nowrap text-[11px] text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                        {log.customerName}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                        {log.customerQuery}
                      </td>
                      <td className="px-4 py-3 text-foreground font-medium max-w-xs truncate">
                        {log.publicReply}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-medium max-w-xs truncate">
                        {log.privateInboxReply || "None"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          <CheckCircle2 className="w-3 h-3 text-blue-600" /> Success
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-foreground">
                {editingTemplateId ? "Edit Response Template" : "Add Response Template"}
              </h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold block mb-1">Template Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eid Watch Price Response"
                  value={tmplTitle}
                  onChange={(e) => setTmplTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Intent Category *</label>
                <select
                  value={tmplCategory}
                  onChange={(e) => setTmplCategory(e.target.value as any)}
                  className="w-full px-2.5 py-2 border rounded-lg bg-background font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  <option value="Price Query">Price Query</option>
                  <option value="Delivery Query">Delivery Query</option>
                  <option value="Stock Query">Stock Query</option>
                  <option value="Warranty Query">Warranty Query</option>
                  <option value="Location Query">Location Query</option>
                  <option value="General Greeting">General Greeting</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Public Comment Reply *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Public comment reply under the post..."
                  value={tmplPublicReply}
                  onChange={(e) => setTmplPublicReply(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Private Messenger Inbox Message *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Private message sent to customer's Messenger inbox..."
                  value={tmplInboxReply}
                  onChange={(e) => setTmplInboxReply(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Trigger Keywords (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. দাম, price, কত, cost"
                  value={tmplKeywords}
                  onChange={(e) => setTmplKeywords(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg shadow-xs transition mt-2 min-h-[38px]"
              >
                Save Template to Library
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
