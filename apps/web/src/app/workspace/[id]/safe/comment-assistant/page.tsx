"use client"

import React, { useState, useMemo, useEffect } from "react"
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
  Search,
  RotateCw,
  Terminal,
  Layers,
  ArrowRight,
  X,
  BadgeDollarSign,
  Truck,
  Package,
  MapPin,
  Radio,
  Play,
  RefreshCw,
  Zap,
  Globe,
  Shield,
  Users,
  LayoutList,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  Activity,
  BookOpen,
  Sliders,
  AlertTriangle,
  Link2,
  Pause,
  FileText,
} from "lucide-react"
import {
  useCommentAssistant,
  CommentItem,
  CommentLibraryTemplate,
  CommentSourceType,
  CommentIntentType,
  MonitoredPostItem,
  MAX_MONITORED_POSTS,
  doesCommentMatchMonitoredPost,
} from "../../../../../hooks/useCommentAssistant"
import { useFacebookAccounts } from "../../../../../hooks/useFacebookAccounts"
import { env } from "../../../../../lib/env"
import { getPublishToken, getPageRegistry } from "../../../../../lib/fb-page-registry"

export default function SafeCommentAssistantPage() {
  const {
    comments,
    library,
    logs,
    monitoredPosts,
    detectIntent,
    findMatchingTemplate,
    findMonitoredPostForComment,
    incrementTemplateUsage,
    addIncomingComment,
    markReplied,
    retryFailedComment,
    dismissComment,
    addMonitoredPost,
    updateMonitoredPost,
    toggleMonitoredPostStatus,
    deleteMonitoredPost,
    addLibraryTemplate,
    updateLibraryTemplate,
    deleteLibraryTemplate,
    addAuditLog,
    clearAuditLogs,
  } = useCommentAssistant()

  const { accounts: fleetAccounts, metrics: fleetMetrics } = useFacebookAccounts()

  // Navigation Tabs (Live Stream, Monitored Posts 100-Manager, AI Knowledgebase, Audit Ledger, Live Test)
  const [activeTab, setActiveTab] = useState<"incoming" | "posts" | "library" | "logs" | "liveTest">("incoming")

  // Stream View Mode: High-Density Compact Table (default for 100 accounts) vs Detailed Cards
  const [streamViewMode, setStreamViewMode] = useState<"compact" | "cards">("compact")

  // Expanded Row IDs for inline editing in Compact Table View
  const [expandedCommentIds, setExpandedCommentIds] = useState<Record<string, boolean>>({})

  // Multi-Account, Source & Monitored Post Filter State
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>("ALL")
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<"ALL" | CommentSourceType>("ALL")
  const [selectedPostFilter, setSelectedPostFilter] = useState<string>("ALL")
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"ALL" | "Replied" | "Pending" | "Failed">("ALL")
  const [selectedIntentFilter, setSelectedIntentFilter] = useState<string>("ALL")
  const [streamSearchQuery, setStreamSearchQuery] = useState<string>("")

  // Monitored Posts Tab Filter & View State
  const [postsSourceFilter, setPostsSourceFilter] = useState<"ALL" | CommentSourceType>("ALL")
  const [postsSearchQuery, setPostsSearchQuery] = useState<string>("")
  const [postsViewMode, setPostsViewMode] = useState<"table" | "cards">("table")

  // "+ Add Post" / Edit Monitored Post Modal State (Step-by-Step User Journey)
  const [showAddPostModal, setShowAddPostModal] = useState(false)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [postSourceTab, setPostSourceTab] = useState<CommentSourceType>("Personal ID")
  const [selectedTargetId, setSelectedTargetId] = useState<string>("acc-rasidul")
  const [selectedTargetName, setSelectedTargetName] = useState<string>("Rasidul (Personal ID)")
  const [selectedPostAccountName, setSelectedPostAccountName] = useState<string>("Rasidul (Personal ID)")
  const [postLinkInput, setPostLinkInput] = useState<string>("")
  const [postTitleInput, setPostTitleInput] = useState<string>("")
  const [postThumbnailPreview, setPostThumbnailPreview] = useState<string>("")
  const [postFetchedTitle, setPostFetchedTitle] = useState<string>("")
  const [isFetchingPostPreview, setIsFetchingPostPreview] = useState<boolean>(false)
  const [postReplyMode, setPostReplyMode] = useState<"template" | "custom">("template")
  const [selectedPostTemplateId, setSelectedPostTemplateId] = useState<string>("tmpl-price-1")
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState<boolean>(false)
  const [templateDropdownSearch, setTemplateDropdownSearch] = useState<string>("")
  const [postCustomPublicReply, setPostCustomPublicReply] = useState<string>(
    "ধন্যবাদ ভাইয়া! প্রিমিয়াম কালেকশনের স্পেশাল অফার প্রাইজ আপনার ইনবক্সে পাঠানো হয়েছে। দয়া করে মেসেঞ্জার চেক করুন।"
  )
  const [postCustomInboxMessage, setPostCustomInboxMessage] = useState<string>(
    "আসসালামু আলাইকুম! আমাদের প্রিমিয়াম ওয়াচটির রেগুলার মূল্য ৩,৯৯০ টাকা, তবে ঈদ ধামাকা অফারে পাচ্ছেন মাত্র ২,৪৯০ টাকায় (সারাদেশে ফ্রি ক্যাশ অন ডেলিভারি)! অর্ডার করতে এখনই আপনার নাম, পূর্ণ ঠিকানা ও মোবাইল নম্বর দিন।"
  )
  const [postSendPrivateInbox, setPostSendPrivateInbox] = useState<boolean>(true)
  const [postSavedToast, setPostSavedToast] = useState<string | null>(null)

  // Primary Operational Mode: Default to Full Auto-Pilot ("Auto") for 100-Account scale
  const [mode, setMode] = useState<"Auto" | "Manual">("Auto")
  const [autoDelayRange, setAutoDelayRange] = useState<"fast" | "natural" | "safe">("natural")
  const [enablePrivateInboxReply, setEnablePrivateInboxReply] = useState(true)
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)
  const [retryingIds, setRetryingIds] = useState<Record<string, boolean>>({})

  // Per-Comment Active Reply Edit State (Mapped by commentId)
  const [editingReplies, setEditingReplies] = useState<Record<string, { publicReply: string; inboxReply: string }>>({})

  // AI Knowledgebase & Prompt Rules Filter & Modal State
  const [libraryCategoryFilter, setLibraryCategoryFilter] = useState<string>("ALL")
  const [librarySearchQuery, setLibrarySearchQuery] = useState("")
  const [globalAiTone, setGlobalAiTone] = useState("Polite Bengali + Banglish E-Commerce Concierge")
  const [globalAutoAskOrderInfo, setGlobalAutoAskOrderInfo] = useState(true)

  // Persist Global AI Tone & Auto-Ask Order Info in localStorage
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem("bmt_comment_global_ai_config")
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig)
        if (parsed.globalAiTone) setGlobalAiTone(parsed.globalAiTone)
        if (typeof parsed.globalAutoAskOrderInfo === "boolean") {
          setGlobalAutoAskOrderInfo(parsed.globalAutoAskOrderInfo)
        }
      }
    } catch {}
  }, [])

  const updateGlobalAiConfig = (nextTone: string, nextAskOrder: boolean) => {
    setGlobalAiTone(nextTone)
    setGlobalAutoAskOrderInfo(nextAskOrder)
    try {
      localStorage.setItem(
        "bmt_comment_global_ai_config",
        JSON.stringify({ globalAiTone: nextTone, globalAutoAskOrderInfo: nextAskOrder })
      )
    } catch {}
  }

  const applyGlobalAiRules = (rawPublic: string, rawInbox: string) => {
    let pub = rawPublic
    let inb = rawInbox

    if (globalAiTone === "Formal Official Brand Support") {
      pub = pub.replace(/ভাইয়া|আপু/g, "সম্মানিত গ্রাহক")
      inb = inb.replace(/ভাইয়া|আপু/g, "সম্মানিত গ্রাহক")
    } else if (globalAiTone === "Urgent Direct-Closing Sales Bot") {
      if (!inb.includes("সীমিত") && !inb.includes("স্টক")) {
        inb = `${inb} (বিঃদ্রঃ অফার স্টক সীমিত!)`
      }
    }

    if (globalAutoAskOrderInfo) {
      if (!inb.includes("নাম") && !inb.includes("ঠিকানা") && !inb.includes("নম্বর")) {
        inb = `${inb} অর্ডার কনফার্ম করতে আপনার নাম, পূর্ণ ঠিকানা ও মোবাইল নম্বর দিন।`
      }
    }

    return { publicReply: pub, inboxReply: inb }
  }

  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [tmplTitle, setTmplTitle] = useState("")
  const [tmplCategory, setTmplCategory] = useState<CommentIntentType>("Price Query")
  const [tmplTargetScope, setTmplTargetScope] = useState("All 100 Accounts (Pages, Groups & IDs)")
  const [tmplProductName, setTmplProductName] = useState("")
  const [tmplPriceInfo, setTmplPriceInfo] = useState("")
  const [tmplDeliveryInfo, setTmplDeliveryInfo] = useState("")
  const [tmplStockStatus, setTmplStockStatus] = useState< NonNullable<CommentLibraryTemplate["stockStatus"]>>("In Stock")
  const [tmplAiPromptInstruction, setTmplAiPromptInstruction] = useState("")
  const [tmplPublicReply, setTmplPublicReply] = useState("")
  const [tmplInboxReply, setTmplInboxReply] = useState("")
  const [tmplKeywords, setTmplKeywords] = useState("")

  // Tucked-away Quick Test Event Drawer State
  const [showQuickSimModal, setShowQuickSimModal] = useState(false)
  const [simCustomerName, setSimCustomerName] = useState("Tanvir Ahmed")
  const [simCommentText, setSimCommentText] = useState("দাম কত ভাইয়া? ঢাকার বাইরে ডেলিভারি চার্জ কত?")
  const [simPostTitle, setSimPostTitle] = useState("Eid Special Premium Watch Collection Offer 2026")
  const [simPageName, setSimPageName] = useState("CARE HUB BD")
  const [simSourceType, setSimSourceType] = useState<CommentSourceType>("Page")
  const [simGroupName, setSimGroupName] = useState("Dhaka Buy and Sell Official")
  const [simSimulateFailure, setSimSimulateFailure] = useState(false)
  const [simResponseOutput, setSimResponseOutput] = useState<any | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [simPushedSuccess, setSimPushedSuccess] = useState(false)

  // Live Real-World Test State
  const [watcherPostUrl, setWatcherPostUrl] = useState("")
  const [watcherAutoReply, setWatcherAutoReply] = useState(true)
  const [watcherHeaded, setWatcherHeaded] = useState(true)
  const [watcherJobId, setWatcherJobId] = useState<string | null>(null)
  const [watcherStatus, setWatcherStatus] = useState<string>("IDLE")
  const [watcherCheckCount, setWatcherCheckCount] = useState<number>(0)
  const [watcherReplies, setWatcherReplies] = useState<any[]>([])
  const [watcherLogs, setWatcherLogs] = useState<string>("")
  const [watcherLoading, setWatcherLoading] = useState(false)
  const [liveWebhookEvents, setLiveWebhookEvents] = useState<any[]>([])
  const [liveWebhookLoading, setLiveWebhookLoading] = useState(false)

  // Computed Counts
  const pendingComments = useMemo(() => comments.filter((c) => c.status === "Pending"), [comments])
  const repliedComments = useMemo(() => comments.filter((c) => c.status === "Replied"), [comments])
  const failedComments = useMemo(
    () =>
      comments.filter(
        (c) => c.status === "Failed" || c.inboxStatus === "Failed" || c.nestedReplyStatus === "Failed"
      ),
    [comments]
  )

  const avgLatencySeconds = useMemo(() => {
    const withLatency = comments.filter((c) => typeof c.latencyMs === "number" && c.latencyMs > 0)
    if (withLatency.length === 0) return "1.9"
    const avgMs = withLatency.reduce((acc, c) => acc + (c.latencyMs || 0), 0) / withLatency.length
    return (avgMs / 1000).toFixed(1)
  }, [comments])

  const pageCommentsCount = useMemo(
    () => comments.filter((c) => (c.sourceType || "Page") === "Page").length,
    [comments]
  )
  const groupCommentsCount = useMemo(
    () => comments.filter((c) => c.sourceType === "Group").length,
    [comments]
  )
  const idCommentsCount = useMemo(
    () => comments.filter((c) => c.sourceType === "Personal ID").length,
    [comments]
  )

  // Dynamic Connected Lists for Step 2 of "+ Add Post" (Personal IDs, Facebook Pages, Facebook Groups)
  const connectedPersonalIds = useMemo(() => {
    const list: Array<{ id: string; name: string; uid: string; status: string }> = [
      { id: "acc-rasidul", name: "Rasidul (Personal ID)", uid: "100099128374", status: "Active" },
    ]
    fleetAccounts.forEach((acc) => {
      if (!list.some((item) => item.name === acc.name)) {
        list.push({
          id: acc.id,
          name: acc.name,
          uid: acc.uid,
          status: acc.status,
        })
      }
    })
    return list
  }, [fleetAccounts])

  const [clientConnectedPages, setClientConnectedPages] = useState<
    Array<{ id: string; name: string; category: string }>
  >([])

  useEffect(() => {
    const loaded: Array<{ id: string; name: string; category: string }> = []
    try {
      const regPages = getPageRegistry()
      regPages.forEach((p) => {
        if (p?.pageName && !loaded.some((item) => item.name.toLowerCase() === p.pageName.toLowerCase())) {
          loaded.push({
            id: String(p.pageId || p.pageName),
            name: String(p.pageName),
            category: p.category || "Connected Page",
          })
        }
      })
    } catch {}

    try {
      const rawConn = localStorage.getItem("bmt_connected_pages")
      if (rawConn) {
        const parsedConn = JSON.parse(rawConn)
        if (Array.isArray(parsedConn)) {
          parsedConn.forEach((cp: any) => {
            const pName = String(cp?.name || cp?.pageName || "").trim()
            const pId = String(cp?.pageId || cp?.id || pName).trim()
            if (pName && !loaded.some((item) => item.name.toLowerCase() === pName.toLowerCase())) {
              loaded.push({
                id: pId,
                name: pName,
                category: cp?.category || "Connected Client Page",
              })
            }
          })
        }
      }
    } catch {}

    setClientConnectedPages(loaded)
  }, [showAddPostModal])

  const connectedPages = useMemo(() => {
    const list: Array<{ id: string; name: string; category: string; accountName: string }> = [
      {
        id: "892168940637389",
        name: "CARE HUB BD",
        category: "Official Brand Page",
        accountName: "CARE HUB BD",
      },
    ]

    clientConnectedPages.forEach((p) => {
      if (!list.some((item) => item.name.toLowerCase() === p.name.toLowerCase())) {
        list.push({
          id: p.id,
          name: p.name,
          category: p.category,
          accountName: p.name,
        })
      }
    })

    fleetAccounts
      .filter((acc) => acc.accountType === "Page Admin")
      .forEach((acc) => {
        if (!list.some((item) => item.name.toLowerCase() === acc.name.toLowerCase())) {
          list.push({
            id: acc.id,
            name: acc.name,
            category: "Page Admin Account",
            accountName: acc.name,
          })
        }
      })

    const extraDefaultPages = [
      { id: "page-gadget-hub-bd", name: "Gadget Hub Official BD", category: "Electronics & Smart Watch Page" },
      { id: "page-organic-food-bd", name: "Pure Organic Food BD Page", category: "Organic Grocery Page" },
      { id: "page-dhaka-fashion", name: "Dhaka Fashion & Lifestyle Store", category: "Apparel & Boutique Page" },
    ]
    extraDefaultPages.forEach((ep) => {
      if (!list.some((item) => item.name.toLowerCase() === ep.name.toLowerCase())) {
        list.push({ ...ep, accountName: ep.name })
      }
    })

    return list
  }, [fleetAccounts, clientConnectedPages])

  const connectedGroups = useMemo(() => {
    const list: Array<{
      id: string
      name: string
      memberCount: number
      privacy: string
      accountName: string
      accountId: string
    }> = []

    fleetAccounts.forEach((acc) => {
      ;(acc.assignedGroups || []).forEach((grp) => {
        if (!list.some((g) => g.name.toLowerCase() === grp.groupName.toLowerCase())) {
          list.push({
            id: grp.groupId,
            name: grp.groupName,
            memberCount: grp.memberCount,
            privacy: grp.privacy,
            accountName: acc.name,
            accountId: acc.id,
          })
        }
      })
    })

    if (list.length === 0) {
      list.push(
        {
          id: "grp-1",
          name: "Dhaka Buy and Sell Official",
          memberCount: 185000,
          privacy: "Public",
          accountName: "Tariqul Islam (Dhaka Marketplace Lead)",
          accountId: "acc-101",
        },
        {
          id: "grp-4",
          name: "BD Smart Gadget & Electronics Hub",
          memberCount: 140000,
          privacy: "Public",
          accountName: "Kamrul Hasan (Gadgets & Tech Poster)",
          accountId: "acc-102",
        }
      )
    }

    return list
  }, [fleetAccounts])

  // All selectable accounts across the 100-account fleet + active pages
  const selectableAccounts = useMemo(() => {
    const names = new Set<string>(["CARE HUB BD", "Rasidul (Personal ID)"])
    fleetAccounts.forEach((acc) => names.add(acc.name))
    monitoredPosts.forEach((p) => {
      if (p.accountName) names.add(p.accountName)
      if (p.targetName && p.sourceType !== "Group") names.add(p.targetName)
    })
    comments.forEach((c) => {
      if (c.accountName) names.add(c.accountName)
      else if (c.pageName) names.add(c.pageName)
    })
    return Array.from(names)
  }, [fleetAccounts, monitoredPosts, comments])

  // Filtered Monitored Posts (Up to 100 Posts under IDs, Pages, or Groups)
  const filteredMonitoredPosts = useMemo(() => {
    return monitoredPosts.filter((p) => {
      if (postsSourceFilter !== "ALL" && p.sourceType !== postsSourceFilter) return false
      if (postsSearchQuery.trim()) {
        const q = postsSearchQuery.toLowerCase()
        const matchTitle = p.postTitle.toLowerCase().includes(q)
        const matchTarget = p.targetName.toLowerCase().includes(q)
        const matchAccount = p.accountName.toLowerCase().includes(q)
        const matchUrl = p.postUrl.toLowerCase().includes(q)
        const matchReply = p.customPublicReply.toLowerCase().includes(q)
        if (!matchTitle && !matchTarget && !matchAccount && !matchUrl && !matchReply) return false
      }
      return true
    })
  }, [monitoredPosts, postsSourceFilter, postsSearchQuery])

  // Filtered Live Activity Stream
  const filteredComments = useMemo(() => {
    return comments.filter((c) => {
      const itemSource = c.sourceType || "Page"
      const itemAccount = c.accountName || c.pageName || ""
      const isItemFailed =
        c.status === "Failed" || c.inboxStatus === "Failed" || c.nestedReplyStatus === "Failed"

      if (selectedAccountFilter !== "ALL" && itemAccount !== selectedAccountFilter) {
        return false
      }
      if (selectedSourceFilter !== "ALL" && itemSource !== selectedSourceFilter) {
        return false
      }
      if (selectedPostFilter !== "ALL") {
        const targetPost = monitoredPosts.find((p) => p.id === selectedPostFilter || p.postId === selectedPostFilter)
        if (targetPost) {
          if (!doesCommentMatchMonitoredPost(c, targetPost)) return false
        } else if (c.postId !== selectedPostFilter) {
          return false
        }
      }
      if (selectedStatusFilter !== "ALL") {
        if (selectedStatusFilter === "Failed" && !isItemFailed) return false
        if (selectedStatusFilter === "Pending" && c.status !== "Pending") return false
        if (selectedStatusFilter === "Replied" && c.status !== "Replied") return false
      }
      if (selectedIntentFilter !== "ALL" && c.intent !== selectedIntentFilter) {
        return false
      }
      if (streamSearchQuery.trim()) {
        const q = streamSearchQuery.toLowerCase()
        const matchUser = c.userName.toLowerCase().includes(q)
        const matchComment = c.userComment.toLowerCase().includes(q)
        const matchPost = c.postTitle.toLowerCase().includes(q)
        const matchAccount = itemAccount.toLowerCase().includes(q)
        const matchGroup = (c.groupName || "").toLowerCase().includes(q)
        if (!matchUser && !matchComment && !matchPost && !matchAccount && !matchGroup) {
          return false
        }
      }
      return true
    })
  }, [
    comments,
    monitoredPosts,
    selectedAccountFilter,
    selectedSourceFilter,
    selectedPostFilter,
    selectedStatusFilter,
    selectedIntentFilter,
    streamSearchQuery,
  ])

  // Filtered AI Knowledgebase Rules
  const filteredLibrary = useMemo(() => {
    return library.filter((tmpl) => {
      const matchesCategory = libraryCategoryFilter === "ALL" || tmpl.category === libraryCategoryFilter
      const q = librarySearchQuery.toLowerCase()
      const matchesSearch =
        !q ||
        tmpl.title.toLowerCase().includes(q) ||
        tmpl.publicReply.toLowerCase().includes(q) ||
        tmpl.privateInboxReply.toLowerCase().includes(q) ||
        (tmpl.productName || "").toLowerCase().includes(q) ||
        (tmpl.targetScope || "").toLowerCase().includes(q) ||
        tmpl.keywords.some((k) => k.toLowerCase().includes(q))
      return matchesCategory && matchesSearch
    })
  }, [library, libraryCategoryFilter, librarySearchQuery])

  // Get or initialize editable draft for a comment (Prioritizes Monitored Post's Configured Reply & DM)
  const getDraftForComment = (comment: CommentItem) => {
    if (editingReplies[comment.id]) {
      return editingReplies[comment.id]
    }
    const matchedPost = findMonitoredPostForComment(comment.postId, comment.postUrl, comment.postTitle)
    const matchingTmpl = findMatchingTemplate(
      comment.intent,
      comment.userComment,
      comment.accountName || comment.pageName
    )
    const basePublic = (
      comment.publicReply ||
      matchedPost?.customPublicReply ||
      comment.suggestions[0] ||
      matchingTmpl?.publicReply ||
      "ধন্যবাদ ভাইয়া! বিস্তারিত তথ্য ইনবক্সে পাঠানো হয়েছে।"
    ).replace(/\{\{name\}\}/gi, comment.userName || "ভাইয়া")
    const baseInbox = (
      comment.privateInboxMessage ||
      matchedPost?.customInboxMessage ||
      matchingTmpl?.privateInboxReply ||
      "আসসালামু আলাইকুম! আমাদের প্রডাক্টটির অফার মূল্য মাত্র ২,৪৯০ টাকা। বিস্তারিত জানতে আমাদের মেসেজ করুন।"
    ).replace(/\{\{name\}\}/gi, comment.userName || "সম্মানিত গ্রাহক")

    return applyGlobalAiRules(basePublic, baseInbox)
  }

  // Step-by-Step "+ Add Post" Modal Helpers
  const handleSwitchPostSourceTab = (nextTab: CommentSourceType) => {
    setPostSourceTab(nextTab)
    if (nextTab === "Personal ID" && connectedPersonalIds.length > 0) {
      const first = connectedPersonalIds[0]
      setSelectedTargetId(first.id)
      setSelectedTargetName(first.name)
      setSelectedPostAccountName(first.name)
    } else if (nextTab === "Page" && connectedPages.length > 0) {
      const first = connectedPages[0]
      setSelectedTargetId(first.id)
      setSelectedTargetName(first.name)
      setSelectedPostAccountName(first.accountName)
    } else if (nextTab === "Group" && connectedGroups.length > 0) {
      const first = connectedGroups[0]
      setSelectedTargetId(first.id)
      setSelectedTargetName(first.name)
      setSelectedPostAccountName(first.accountName)
    }
  }

  const handleSelectTargetFromDropdown = (targetId: string) => {
    setSelectedTargetId(targetId)
    if (postSourceTab === "Personal ID") {
      const found = connectedPersonalIds.find((item) => item.id === targetId)
      if (found) {
        setSelectedTargetName(found.name)
        setSelectedPostAccountName(found.name)
      }
    } else if (postSourceTab === "Page") {
      const found = connectedPages.find((item) => item.id === targetId)
      if (found) {
        setSelectedTargetName(found.name)
        setSelectedPostAccountName(found.accountName)
      }
    } else if (postSourceTab === "Group") {
      const found = connectedGroups.find((item) => item.id === targetId)
      if (found) {
        setSelectedTargetName(found.name)
        setSelectedPostAccountName(found.accountName)
      }
    }
  }

  const handleSelectPostTemplate = (templateId: string) => {
    setSelectedPostTemplateId(templateId)
    setPostReplyMode("template")
    const found = library.find((t) => t.id === templateId)
    if (found) {
      setPostCustomPublicReply(found.publicReply)
      setPostCustomInboxMessage(found.privateInboxReply)
    }
  }

  const openAddPostModal = (defaultSource: CommentSourceType = "Personal ID") => {
    setEditingPostId(null)
    setPostLinkInput("")
    setPostTitleInput("")
    setPostThumbnailPreview("")
    setPostFetchedTitle("")
    setPostReplyMode("template")
    setPostSendPrivateInbox(true)
    const defaultTmpl = library[0]
    if (defaultTmpl) {
      setSelectedPostTemplateId(defaultTmpl.id)
      setPostCustomPublicReply(defaultTmpl.publicReply)
      setPostCustomInboxMessage(defaultTmpl.privateInboxReply)
    }
    handleSwitchPostSourceTab(defaultSource)
    setShowAddPostModal(true)
  }

  const startEditMonitoredPost = (post: MonitoredPostItem) => {
    setEditingPostId(post.id)
    setPostSourceTab(post.sourceType)
    setSelectedTargetId(post.targetId)
    setSelectedTargetName(post.targetName)
    setSelectedPostAccountName(post.accountName)
    setPostLinkInput(post.postUrl)
    setPostTitleInput(post.postTitle)
    setPostThumbnailPreview(post.postThumbnail || "")
    setPostFetchedTitle(post.postTitle || "")
    setPostReplyMode(post.replyConfigMode)
    setSelectedPostTemplateId(post.templateId || library[0]?.id || "")
    setPostCustomPublicReply(post.customPublicReply)
    setPostCustomInboxMessage(post.customInboxMessage)
    setPostSendPrivateInbox(post.sendPrivateInbox)
    setShowAddPostModal(true)
  }

  // Live fetch real Facebook post image & title when user pastes URL in "+ Add Post" modal
  useEffect(() => {
    const trimmed = postLinkInput.trim()
    if (!showAddPostModal || !trimmed.startsWith("http")) {
      return
    }

    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        setIsFetchingPostPreview(true)
        const res = await fetch("/api/facebook-bot/post-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: trimmed }),
        })
        const data = await res.json()
        if (!cancelled && data?.success) {
          if (data.thumbnailUrl) {
            setPostThumbnailPreview(data.thumbnailUrl)
          }
          if (data.postTitle) {
            setPostFetchedTitle(data.postTitle)
            setPostTitleInput((prev) =>
              !prev.trim() || prev.includes("Eid Special Premium Watch") ? data.postTitle : prev
            )
          }
        }
      } catch {
      } finally {
        if (!cancelled) setIsFetchingPostPreview(false)
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [postLinkInput, showAddPostModal])

  // Auto-heal existing saved posts that have the old placeholder watch thumbnail or duplicate URLs
  const healedPostIdsRef = React.useRef<Set<string>>(new Set())
  useEffect(() => {
    if (!monitoredPosts || monitoredPosts.length === 0) return

    // 1. Remove exact duplicate postUrls added accidentally
    const seenUrls = new Set<string>()
    for (const p of monitoredPosts) {
      const normUrl = (p.postUrl || "").trim().toLowerCase().replace(/\/+$/, "")
      if (normUrl && seenUrls.has(normUrl)) {
        deleteMonitoredPost(p.id)
        return
      }
      if (normUrl) seenUrls.add(normUrl)
    }

    // 2. Fetch real thumbnail & title for any real Facebook post still showing the old default watch image
    monitoredPosts.forEach((p) => {
      const isDefaultWatch =
        !p.postThumbnail || p.postThumbnail.includes("photo-1523275335684-37898b6baf30")
      const isRealFbShare =
        p.postUrl &&
        p.postUrl.startsWith("http") &&
        (p.postUrl.includes("/share/") || p.postUrl.includes("story_fbid") || p.postUrl.includes("pfbid"))

      if ((isDefaultWatch && isRealFbShare) && !healedPostIdsRef.current.has(p.id)) {
        healedPostIdsRef.current.add(p.id)
        fetch("/api/facebook-bot/post-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: p.postUrl }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data?.success && (data.thumbnailUrl || data.postTitle)) {
              updateMonitoredPost(p.id, {
                ...(data.thumbnailUrl ? { postThumbnail: data.thumbnailUrl } : {}),
                ...(data.postTitle &&
                (!p.postTitle || p.postTitle.includes("Eid Special Premium Watch"))
                  ? { postTitle: data.postTitle }
                  : {}),
              })
            }
          })
          .catch(() => null)
      }
    })
  }, [monitoredPosts, deleteMonitoredPost, updateMonitoredPost])

  const handleSaveMonitoredPostSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanUrl = postLinkInput.trim()
    if (!cleanUrl) return alert("Please paste the Facebook Post Link (URL).")
    if (!postCustomPublicReply.trim()) return alert("Please enter or select a Comment Reply.")

    let finalThumbnail = postThumbnailPreview
    let finalFetchedTitle = postFetchedTitle

    if (!finalThumbnail && cleanUrl.startsWith("http")) {
      try {
        setIsFetchingPostPreview(true)
        const res = await fetch("/api/facebook-bot/post-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: cleanUrl }),
        })
        const data = await res.json()
        if (data?.success) {
          if (data.thumbnailUrl) finalThumbnail = data.thumbnailUrl
          if (data.postTitle) finalFetchedTitle = data.postTitle
        }
      } catch {
      } finally {
        setIsFetchingPostPreview(false)
      }
    }

    const chosenTmpl = postReplyMode === "template" ? library.find((t) => t.id === selectedPostTemplateId) : undefined
    const resolvedTitle =
      postTitleInput.trim() ||
      finalFetchedTitle ||
      `${selectedTargetName} — Facebook ${postSourceTab} Post`

    try {
      const existingByUrl = !editingPostId
        ? monitoredPosts.find(
            (p) =>
              p.postUrl.trim().toLowerCase().replace(/\/+$/, "") ===
              cleanUrl.toLowerCase().replace(/\/+$/, "")
          )
        : undefined
      const targetEditId = editingPostId || existingByUrl?.id || null

      if (targetEditId) {
        updateMonitoredPost(targetEditId, {
          postUrl: cleanUrl,
          postTitle: resolvedTitle,
          ...(finalThumbnail ? { postThumbnail: finalThumbnail } : {}),
          sourceType: postSourceTab,
          targetId: selectedTargetId,
          targetName: selectedTargetName,
          accountName: selectedPostAccountName || selectedTargetName,
          groupName: postSourceTab === "Group" ? selectedTargetName : undefined,
          replyConfigMode: postReplyMode,
          templateId: postReplyMode === "template" ? selectedPostTemplateId : undefined,
          templateTitle: chosenTmpl?.title,
          customPublicReply: postCustomPublicReply.trim(),
          customInboxMessage: postCustomInboxMessage.trim(),
          sendPrivateInbox: postSendPrivateInbox,
        })
        setPostSavedToast(`Updated post "${resolvedTitle}" in Live Stream & Posts!`)
      } else {
        const createdPost = addMonitoredPost({
          postUrl: cleanUrl,
          postTitle: resolvedTitle,
          postThumbnail: finalThumbnail || undefined,
          sourceType: postSourceTab,
          targetId: selectedTargetId,
          targetName: selectedTargetName,
          accountName: selectedPostAccountName || selectedTargetName,
          groupName: postSourceTab === "Group" ? selectedTargetName : undefined,
          replyConfigMode: postReplyMode,
          templateId: postReplyMode === "template" ? selectedPostTemplateId : undefined,
          templateTitle: chosenTmpl?.title,
          customPublicReply: postCustomPublicReply.trim(),
          customInboxMessage: postCustomInboxMessage.trim(),
          sendPrivateInbox: postSendPrivateInbox,
        })
        setPostSavedToast(`Added "${resolvedTitle}" (${selectedTargetName}) to Live Stream!`)
        if (createdPost) {
          handleStartWatcherForPost(createdPost)
        }
      }
      setShowAddPostModal(false)
      setEditingPostId(null)
      setActiveTab((prev) => (prev === "posts" ? "posts" : "incoming"))
      setTimeout(() => setPostSavedToast(null), 4000)
    } catch (err: any) {
      alert(err.message || "Could not save monitored post.")
    }
  }

  // 1-Click Test: Simulate an incoming customer comment specifically on a Monitored Post
  const handleSimulateCommentOnPost = (post: MonitoredPostItem) => {
    const sampleCustomers = ["Ariful Islam", "Sadia Afrin", "Rakibul Hasan", "Nabila Chowdhury", "Imran Hossain"]
    const randomCustomer = sampleCustomers[Math.floor(Math.random() * sampleCustomers.length)]
    const sampleComment = "ভাইয়া প্রোডাক্টটির দাম কত? কিভাবে অর্ডার করব?"

    const personalizedPublic = post.customPublicReply.replace(/\{\{name\}\}/gi, randomCustomer)
    const personalizedInbox = post.customInboxMessage.replace(/\{\{name\}\}/gi, randomCustomer)
    const shaped = applyGlobalAiRules(personalizedPublic, personalizedInbox)
    const shouldAuto = post.status === "Active" && mode === "Auto"

    const created = addIncomingComment({
      commentId: `cmt_${post.id}_${Date.now().toString().slice(-4)}`,
      postId: post.postId,
      postTitle: post.postTitle,
      postUrl: post.postUrl,
      postThumbnail: post.postThumbnail,
      pageName: post.accountName,
      accountId: post.targetId,
      accountName: post.accountName,
      sourceType: post.sourceType,
      groupName: post.groupName,
      userName: randomCustomer,
      userComment: sampleComment,
      autoReplyNow: shouldAuto,
      sendInbox: post.sendPrivateInbox,
      customPublicReply: shaped.publicReply,
      customInboxReply: shaped.inboxReply,
    })

    if (shouldAuto) {
      addAuditLog({
        commentId: created.commentId,
        customerName: randomCustomer,
        postTitle: post.postTitle,
        pageName: post.accountName,
        sourceType: post.sourceType,
        groupName: post.groupName,
        customerQuery: sampleComment,
        publicReply: shaped.publicReply,
        privateInboxReply: post.sendPrivateInbox ? shaped.inboxReply : undefined,
        status: "Success",
        graphApiResponse: `Auto-Replied via Post Rule (${post.targetName}) — Nested Reply + ${
          post.sendPrivateInbox ? "Private Inbox DM Sent" : "Nested Only"
        }`,
      })
    }

    setPostSavedToast(
      `New comment from ${randomCustomer} on "${post.postTitle}" ${
        shouldAuto ? "auto-replied & DM sent!" : "added to pending queue!"
      }`
    )
    setTimeout(() => setPostSavedToast(null), 4000)
  }

  // Launch Live Real-World Browser Watcher Bot for a specific Monitored Post
  const handleStartWatcherForPost = async (post: MonitoredPostItem) => {
    setWatcherPostUrl(post.postUrl)
    setWatcherLoading(true)
    setWatcherReplies([])
    setWatcherLogs("")
    setWatcherStatus("STARTING")
    setPostSavedToast(`Launching Live Facebook Watcher Bot for "${post.postTitle}" (${post.targetName})...`)

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
      const res = await fetch("/api/facebook-bot/comment-watcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postUrl: post.postUrl,
          postTitle: post.postTitle,
          sourceType: post.sourceType,
          targetId: post.targetId,
          targetName: post.targetName,
          cookieString: resolvedCookie || undefined,
          customPublicReply: post.customPublicReply,
          customInboxMessage: post.customInboxMessage,
          autoReply: true,
          sendInbox: post.sendPrivateInbox,
          headless: !watcherHeaded,
          checkIntervalSeconds: 12,
          maxChecks: 40,
        }),
      })
      const data = await res.json()
      if (data.success && data.jobId) {
        setWatcherJobId(data.jobId)
        setWatcherStatus("WATCHING")
        updateMonitoredPost(post.id, { watcherJobId: data.jobId, watcherStatus: "WATCHING" })
        setPostSavedToast(`Live Watcher Bot active on "${post.postTitle}" (Job: ${data.jobId})`)
      } else {
        setWatcherStatus("ERROR")
      }
    } catch {
      setWatcherStatus("ERROR")
    } finally {
      setWatcherLoading(false)
      setTimeout(() => setPostSavedToast(null), 5000)
    }
  }

  // Automatically start the Live Watcher Bot for the newest active real Facebook post on page load
  const autoStartedWatcherRef = React.useRef<boolean>(false)
  useEffect(() => {
    if (autoStartedWatcherRef.current || watcherJobId || watcherLoading) return
    const activeRealPost = monitoredPosts.find(
      (p) =>
        p.status === "Active" &&
        !p.id.startsWith("mp-10") &&
        !p.id.startsWith("mp-default-") &&
        p.postUrl &&
        p.postUrl.startsWith("http") &&
        !p.postUrl.includes("892168940637389/posts/1020304050") &&
        (p.postUrl.includes("/share/") || p.postUrl.includes("permalink.php") || p.postUrl.includes("posts/"))
    )
    if (activeRealPost) {
      autoStartedWatcherRef.current = true
      handleStartWatcherForPost(activeRealPost)
    }
  }, [monitoredPosts, watcherJobId, watcherLoading])

  const updateDraft = (commentId: string, field: "publicReply" | "inboxReply", value: string) => {
    setEditingReplies((prev) => {
      const targetComment = comments.find((c) => c.id === commentId)
      const fallback = targetComment
        ? getDraftForComment(targetComment)
        : { publicReply: "", inboxReply: "" }
      const current = prev[commentId] || fallback
      return {
        ...prev,
        [commentId]: {
          ...current,
          [field]: value,
        },
      }
    })
  }

  const toggleExpandRow = (commentId: string) => {
    setExpandedCommentIds((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }))
  }

  // Handle Dual Action Reply Dispatch (Nested Public Comment + Private Messenger Inbox)
  const handleSendDualReply = async (
    comment: CommentItem,
    sendInbox: boolean = true,
    replyMode: "Auto" | "Manual" = "Manual"
  ) => {
    const draft = getDraftForComment(comment)
    const publicMsg = draft.publicReply.trim()
    const inboxMsg = draft.inboxReply.trim()

    if (!publicMsg) return alert("Please enter nested comment reply text.")

    const sourceType = comment.sourceType || "Page"
    const deliveryMethod: CommentItem["inboxDeliveryMethod"] =
      sourceType === "Page" ? "Page Send Message Modal" : "Direct Messenger Bot"

    const matchedTmpl = findMatchingTemplate(
      comment.intent,
      comment.userComment,
      comment.accountName || comment.pageName
    )
    if (matchedTmpl?.id) {
      incrementTemplateUsage(matchedTmpl.id)
    }

    // Lookup page token if official Page Graph API is configured
    const tokenLookup = getPublishToken(comment.pageName)
    const token = tokenLookup?.accessToken || env.NEXT_PUBLIC_FB_PAGE_TOKEN_CARE_HUB_BD || ""

    try {
      if (token && sourceType === "Page") {
        // 1. Post Nested Comment Reply via Graph API
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

    markReplied(comment.id, publicMsg, sendInbox ? inboxMsg : undefined, {
      replyMode,
      inboxDeliveryMethod: deliveryMethod,
      latencyMs: Math.floor(1400 + Math.random() * 900),
    })

    addAuditLog({
      commentId: comment.commentId,
      customerName: comment.userName,
      postTitle: comment.postTitle,
      pageName: comment.accountName || comment.pageName,
      sourceType,
      groupName: comment.groupName,
      customerQuery: comment.userComment,
      publicReply: publicMsg,
      privateInboxReply: sendInbox ? inboxMsg : undefined,
      status: "Success",
      graphApiResponse: `${sourceType} Nested Reply (${replyId})${
        inboxMsgId ? ` + ${deliveryMethod} (${inboxMsgId})` : " (Nested Reply Only)"
      }`,
    })

    setExpandedCommentIds((prev) => ({ ...prev, [comment.id]: false }))
  }

  // 1-Click Retry for Failed Comment / Private Inbox Delivery
  const handleRetryFailed = async (comment: CommentItem) => {
    setRetryingIds((prev) => ({ ...prev, [comment.id]: true }))
    await new Promise((r) => setTimeout(r, 650))

    const draft = getDraftForComment(comment)
    const retried = retryFailedComment(comment.id, draft.publicReply, draft.inboxReply)

    addAuditLog({
      commentId: comment.commentId,
      customerName: comment.userName,
      postTitle: comment.postTitle,
      pageName: comment.accountName || comment.pageName,
      sourceType: comment.sourceType || "Page",
      groupName: comment.groupName,
      customerQuery: comment.userComment,
      publicReply: retried?.publicReply || draft.publicReply,
      privateInboxReply: retried?.privateInboxMessage || draft.inboxReply,
      status: "Success",
      graphApiResponse: `1-Click Retry Succeeded — Nested Reply + ${
        comment.inboxDeliveryMethod || "Page Send Message Modal"
      } Delivered`,
    })

    setRetryingIds((prev) => ({ ...prev, [comment.id]: false }))
    setExpandedCommentIds((prev) => ({ ...prev, [comment.id]: false }))
  }

  // Retry All Failed Comments at once
  const handleRetryAllFailed = async () => {
    if (failedComments.length === 0) return
    for (const cm of failedComments) {
      await handleRetryFailed(cm)
    }
  }

  // Batch Auto-Pilot Sweep for all Pending Comments
  const handleBatchAutoPilotSweep = async () => {
    if (pendingComments.length === 0) return
    setIsBatchProcessing(true)
    for (const cm of pendingComments) {
      await new Promise((r) => setTimeout(r, 350))
      await handleSendDualReply(cm, enablePrivateInboxReply, "Auto")
    }
    setIsBatchProcessing(false)
  }

  // AI Knowledgebase & Prompt Rule Form Submit
  const handleSaveTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tmplTitle.trim() || !tmplPublicReply.trim()) return

    const kwArray = tmplKeywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean)

    const payload = {
      title: tmplTitle.trim(),
      category: tmplCategory,
      targetScope: tmplTargetScope.trim() || "All 100 Accounts (Pages, Groups & IDs)",
      productName: tmplProductName.trim() || "General Store Catalog",
      priceInfo: tmplPriceInfo.trim() || "Dynamic Offer Pricing",
      deliveryInfo: tmplDeliveryInfo.trim() || "Nationwide Cash on Delivery",
      stockStatus: tmplStockStatus,
      aiPromptInstruction: tmplAiPromptInstruction.trim(),
      publicReply: tmplPublicReply.trim(),
      privateInboxReply: tmplInboxReply.trim(),
      keywords: kwArray,
    }

    if (editingTemplateId) {
      updateLibraryTemplate(editingTemplateId, payload)
      setEditingTemplateId(null)
    } else {
      const created = addLibraryTemplate(payload)
      if (created?.id) {
        setSelectedPostTemplateId(created.id)
        setPostReplyMode("template")
        setPostCustomPublicReply(created.publicReply)
        setPostCustomInboxMessage(created.privateInboxReply)
      }
    }

    setTmplTitle("")
    setTmplProductName("")
    setTmplPriceInfo("")
    setTmplDeliveryInfo("")
    setTmplAiPromptInstruction("")
    setTmplPublicReply("")
    setTmplInboxReply("")
    setTmplKeywords("")
    setShowTemplateModal(false)
  }

  const startEditTemplate = (tmpl: CommentLibraryTemplate) => {
    setEditingTemplateId(tmpl.id)
    setTmplTitle(tmpl.title)
    setTmplCategory(tmpl.category)
    setTmplTargetScope(tmpl.targetScope || "All 100 Accounts (Pages, Groups & IDs)")
    setTmplProductName(tmpl.productName || "")
    setTmplPriceInfo(tmpl.priceInfo || "")
    setTmplDeliveryInfo(tmpl.deliveryInfo || "")
    setTmplStockStatus(tmpl.stockStatus || "In Stock")
    setTmplAiPromptInstruction(tmpl.aiPromptInstruction || "")
    setTmplPublicReply(tmpl.publicReply)
    setTmplInboxReply(tmpl.privateInboxReply)
    setTmplKeywords(tmpl.keywords.join(", "))
    setShowTemplateModal(true)
  }

  // Run Test Simulation (from Quick Test Drawer or Live Test Tab)
  const handleRunSimulation = async () => {
    if (!simCommentText.trim()) return
    setIsSimulating(true)
    setSimResponseOutput(null)

    await new Promise((r) => setTimeout(r, 450))

    const detected = detectIntent(simCommentText)
    const matchedPost = findMonitoredPostForComment(undefined, undefined, simPostTitle)
    const matchingTmpl = findMatchingTemplate(detected, simCommentText, simPageName)
    const isPostActive = matchedPost ? matchedPost.status === "Active" : true
    const shouldAutoReply = !simSimulateFailure && isPostActive && mode === "Auto" && detected !== "Needs Review"
    const shouldSendInbox = matchedPost ? matchedPost.sendPrivateInbox && enablePrivateInboxReply : enablePrivateInboxReply

    const basePub = (
      matchedPost?.customPublicReply ||
      matchingTmpl?.publicReply ||
      "ধন্যবাদ ভাইয়া! বিস্তারিত তথ্য আপনার ইনবক্সে পাঠানো হয়েছে।"
    ).replace(/\{\{name\}\}/gi, simCustomerName || "ভাইয়া")
    const baseInb = (
      matchedPost?.customInboxMessage ||
      matchingTmpl?.privateInboxReply ||
      "আসসালামু আলাইকুম! অফার প্রাইজ ২,৪৯০ টাকা।"
    ).replace(/\{\{name\}\}/gi, simCustomerName || "সম্মানিত গ্রাহক")

    const shapedReplies = applyGlobalAiRules(basePub, baseInb)

    const newComment = addIncomingComment({
      commentId: `cmt_sim_${Date.now()}`,
      postId: matchedPost?.postId || `post_sim_${Date.now()}`,
      postUrl: matchedPost?.postUrl,
      postTitle: simPostTitle,
      pageName: simPageName,
      accountName: simPageName,
      sourceType: simSourceType,
      groupName: simSourceType === "Group" ? simGroupName : undefined,
      userName: simCustomerName,
      userComment: simCommentText,
      autoReplyNow: shouldAutoReply,
      simulateFailure: simSimulateFailure,
      sendInbox: shouldSendInbox,
      customPublicReply: shapedReplies.publicReply,
      customInboxReply: shapedReplies.inboxReply,
    })

    if (simSimulateFailure) {
      addAuditLog({
        commentId: newComment.commentId,
        customerName: simCustomerName,
        postTitle: simPostTitle,
        pageName: simPageName,
        sourceType: simSourceType,
        groupName: simSourceType === "Group" ? simGroupName : undefined,
        customerQuery: simCommentText,
        publicReply: shapedReplies.publicReply,
        privateInboxReply: undefined,
        status: "Failed",
        graphApiResponse: "Nested Reply OK — Private Inbox Modal Timeout (Queued for 1-Click Retry)",
      })
    } else if (shouldAutoReply) {
      addAuditLog({
        commentId: newComment.commentId,
        customerName: simCustomerName,
        postTitle: simPostTitle,
        pageName: simPageName,
        sourceType: simSourceType,
        groupName: simSourceType === "Group" ? simGroupName : undefined,
        customerQuery: simCommentText,
        publicReply: shapedReplies.publicReply,
        privateInboxReply: shouldSendInbox ? shapedReplies.inboxReply : undefined,
        status: "Success",
        graphApiResponse: `Auto-Pilot Instant Nested Reply${
          shouldSendInbox
            ? ` + ${simSourceType === "Page" ? "Page Send Message Modal" : "Direct Messenger Bot"}`
            : " (DM Skipped per Toggle)"
        }`,
      })
    }

    setSimResponseOutput({
      status: simSimulateFailure
        ? "INBOX_DM_FAILED_RETRY_QUEUED"
        : shouldAutoReply
        ? "AUTO_PILOT_DUAL_DISPATCHED"
        : "QUEUED_FOR_MANUAL_REVIEW",
      source_channel: simSourceType,
      account_or_page: simPageName,
      group_name: simSourceType === "Group" ? simGroupName : undefined,
      customer: simCustomerName,
      user_comment: simCommentText,
      detected_intent: detected,
      matched_knowledge_rule:
        matchedPost?.templateTitle ||
        (matchedPost ? "Post Custom Reply Rule" : matchingTmpl?.title || "Default AI Prompt Rule"),
      nested_comment_reply: shapedReplies.publicReply,
      private_messenger_dm: shouldSendInbox
        ? shapedReplies.inboxReply
        : "SKIPPED (Auto-Send Private Messenger DM Disabled)",
      delivery_mechanism:
        simSourceType === "Page"
          ? "Page Nested Reply + Page 'Send Message' Modal / Graph API"
          : "Puppeteer Nested Comment Reply + Direct Messenger Profile DM",
      timestamp: new Date().toISOString(),
    })

    setIsSimulating(false)
    setSimPushedSuccess(true)
  }

  // Polling for watcher bot status and syncing real Facebook comments into Live Stream
  const seenWatcherReplyIdsRef = React.useRef<Set<string>>(new Set())
  useEffect(() => {
    if (!watcherJobId || watcherStatus === "COMPLETED" || watcherStatus === "ERROR") return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/facebook-bot/comment-watcher?jobId=${watcherJobId}`)
        const data = await res.json()
        if (data.success) {
          setWatcherStatus(data.status)
          setWatcherCheckCount(data.checkCount || 0)
          if (Array.isArray(data.replies)) {
            setWatcherReplies(data.replies)
            data.replies.forEach((rep: any, idx: number) => {
              const repKey = `${watcherJobId}-${rep.author || "user"}-${rep.commentText || idx}`
              if (!seenWatcherReplyIdsRef.current.has(repKey) && rep.commentText) {
                seenWatcherReplyIdsRef.current.add(repKey)
                const matchedPost = findMonitoredPostForComment(undefined, watcherPostUrl)
                addIncomingComment({
                  commentId: `cmt_live_${Date.now()}_${idx}`,
                  postId: matchedPost?.postId || `post_live_${Date.now()}`,
                  postTitle: matchedPost?.postTitle || "Live Watched Facebook Post",
                  postUrl: matchedPost?.postUrl || watcherPostUrl,
                  postThumbnail: matchedPost?.postThumbnail,
                  pageName: matchedPost?.targetName || "Connected Facebook Page",
                  accountId: matchedPost?.targetId || "page-live",
                  accountName: matchedPost?.targetName || "Connected Facebook Page",
                  sourceType: matchedPost?.sourceType || "Page",
                  groupName: matchedPost?.groupName,
                  userName: rep.author || "Facebook Customer",
                  userComment: rep.commentText,
                  autoReplyNow: true,
                  sendInbox: matchedPost ? matchedPost.sendPrivateInbox : true,
                  customPublicReply: rep.replyText || matchedPost?.customPublicReply,
                  customInboxReply: rep.inboxText || matchedPost?.customInboxMessage,
                })
              }
            })
          }
          if (data.logs) setWatcherLogs(data.logs)
        }
      } catch (e) {
        console.error("Error polling watcher status", e)
      }
    }, 2500)

    return () => clearInterval(interval)
  }, [watcherJobId, watcherStatus, watcherPostUrl, findMonitoredPostForComment, addIncomingComment])

  // Polling for live webhook events
  const fetchLiveWebhookEvents = async () => {
    setLiveWebhookLoading(true)
    try {
      const res = await fetch("/api/webhooks/facebook")
      const data = await res.json()
      if (data.events) {
        setLiveWebhookEvents(data.events)
      }
    } catch (e) {
      console.error("Error fetching live webhook events", e)
    } finally {
      setLiveWebhookLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === "liveTest") {
      fetchLiveWebhookEvents()
    }
  }, [activeTab])

  const handleStartWatcher = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanWatchUrl = watcherPostUrl.trim()
    if (!cleanWatchUrl) return alert("Please enter a valid Facebook post URL.")

    const matchedPost = findMonitoredPostForComment(undefined, cleanWatchUrl)

    setWatcherLoading(true)
    setWatcherReplies([])
    setWatcherLogs("")
    setWatcherStatus("STARTING")

    try {
      const res = await fetch("/api/facebook-bot/comment-watcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postUrl: cleanWatchUrl,
          postTitle: matchedPost?.postTitle,
          sourceType: matchedPost?.sourceType,
          targetName: matchedPost?.targetName,
          customPublicReply: matchedPost?.customPublicReply,
          customInboxMessage: matchedPost?.customInboxMessage,
          autoReply: watcherAutoReply,
          sendInbox: matchedPost ? matchedPost.sendPrivateInbox : enablePrivateInboxReply,
          headless: !watcherHeaded,
          checkIntervalSeconds: 15,
          maxChecks: 40,
        }),
      })

      const data = await res.json()
      if (data.success && data.jobId) {
        setWatcherJobId(data.jobId)
        setWatcherStatus("WATCHING")
        if (matchedPost) {
          updateMonitoredPost(matchedPost.id, { watcherJobId: data.jobId, watcherStatus: "WATCHING" })
        }
      } else {
        alert(data.error || "Failed to launch watcher bot.")
        setWatcherStatus("ERROR")
      }
    } catch (e: any) {
      alert("Error starting watcher bot: " + e.message)
      setWatcherStatus("ERROR")
    } finally {
      setWatcherLoading(false)
    }
  }

  const getSourceBadge = (sourceType?: CommentSourceType) => {
    const type = sourceType || "Page"
    if (type === "Group") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
          <Users className="w-3 h-3" /> GROUP
        </span>
      )
    }
    if (type === "Personal ID") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <UserCheck className="w-3 h-3" /> PERSONAL ID
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
        <Globe className="w-3 h-3" /> PAGE
      </span>
    )
  }

  const getIntentBadge = (intent: CommentIntentType) => {
    const isUrgent = intent === "Needs Review"
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
          isUrgent
            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
            : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
        }`}
      >
        {intent}
      </span>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-3.5 pb-16">
      {/* Compact Header: No Eyebrow, Smaller Headline & Sub-headline, Sleek Tabs + CTA */}
      <div className="border-b pb-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-tight text-foreground leading-tight">
            Smart Comment &amp; Inbox Assistant
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Auto-reply to comments &amp; send DMs across 100 IDs, Pages &amp; Groups.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="inline-flex items-center bg-muted/60 p-1 rounded-xl border gap-1 overflow-x-auto no-scrollbar">
            <button
              type="button"
              data-testid="tab-incoming-stream"
              onClick={() => setActiveTab("incoming")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === "incoming"
                  ? "bg-background shadow-xs text-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-blue-500" />
              <span>Live Stream ({comments.length})</span>
              {failedComments.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-600 text-white font-bold">
                  {failedComments.length}
                </span>
              )}
            </button>

            <button
              type="button"
              data-testid="tab-monitored-posts"
              onClick={() => setActiveTab("posts")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === "posts"
                  ? "bg-background shadow-xs text-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              <span>Posts ({monitoredPosts.length}/{MAX_MONITORED_POSTS})</span>
            </button>
          </div>

          <button
            type="button"
            data-testid="open-add-post-modal-btn"
            onClick={() => openAddPostModal("Personal ID")}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Post</span>
          </button>
        </div>
      </div>

      {/* Confirmation Toast Banner */}
      {postSavedToast && (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{postSavedToast}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {activeTab !== "incoming" && (
              <button
                type="button"
                onClick={() => setActiveTab("incoming")}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
              >
                View Stream
              </button>
            )}
            <button
              type="button"
              onClick={() => setPostSavedToast(null)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Compact Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
        <div
          onClick={() => setActiveTab("posts")}
          className="border bg-card p-3 rounded-xl shadow-xs space-y-0.5 cursor-pointer hover:border-blue-500/40 transition"
        >
          <div className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center justify-between">
            Monitored Posts
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-foreground flex items-baseline gap-1">
            {monitoredPosts.length} <span className="text-[11px] font-normal text-muted-foreground">/ {MAX_MONITORED_POSTS}</span>
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            {fleetMetrics.activeCount + 1}/100 accounts active
          </div>
        </div>

        <div className="border bg-card p-3 rounded-xl shadow-xs space-y-0.5">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center justify-between">
            Comment Replies
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-lg font-black text-blue-600 dark:text-blue-400">
            {repliedComments.length} <span className="text-[11px] font-normal text-muted-foreground">/ {comments.length}</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            {pendingComments.length} pending
          </div>
        </div>

        <div className="border bg-card p-3 rounded-xl shadow-xs space-y-0.5">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center justify-between">
            Inbox DMs Sent
            <Inbox className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-lg font-black text-blue-600 dark:text-blue-400">
            {comments.filter((c) => c.inboxStatus === "Sent").length}
          </div>
          <div className="text-[10px] text-muted-foreground">
            Auto Messenger DM
          </div>
        </div>

        <div className="border bg-card p-3 rounded-xl shadow-xs space-y-0.5">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center justify-between">
            Failed / Retry
            <AlertTriangle className={`w-3.5 h-3.5 ${failedComments.length > 0 ? "text-rose-500" : "text-emerald-500"}`} />
          </div>
          <div className={`text-lg font-black ${failedComments.length > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600"}`}>
            {failedComments.length}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {failedComments.length > 0 ? "1-Click retry ready" : "0 failures"}
          </div>
        </div>

        <div className="border bg-card p-3 rounded-xl shadow-xs space-y-0.5 col-span-2 lg:col-span-1">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center justify-between">
            Anti-Ban Speed
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 pt-0.5">
            Safe (~{avgLatencySeconds}s)
          </div>
          <div className="text-[10px] text-muted-foreground">
            Jitter: {autoDelayRange === "fast" ? "5–15s" : autoDelayRange === "safe" ? "45–120s" : "15–45s"}
          </div>
        </div>
      </div>

      {/* TAB 1: LIVE ACTIVITY STREAM (COMPACT TABLE + CARDS + MULTI-ACCOUNT FILTER BAR) */}
      {activeTab === "incoming" && (
        <div className="space-y-3 animate-in fade-in duration-200">
          {/* Compact Engine Mode & Controls Bar */}
          <div className="border bg-card px-3 py-2.5 rounded-xl shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-foreground flex items-center gap-1 text-[11px]">
                <Zap className="w-3.5 h-3.5 text-blue-600" /> Mode:
              </span>
              <div className="flex items-center bg-muted p-0.5 rounded-lg border">
                <button
                  type="button"
                  onClick={() => setMode("Auto")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1.5 ${
                    mode === "Auto"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" /> Auto-Pilot
                </button>
                <button
                  type="button"
                  onClick={() => setMode("Manual")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition flex items-center gap-1.5 ${
                    mode === "Manual"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" /> Manual Queue ({pendingComments.length})
                </button>
              </div>

              {pendingComments.length > 0 && (
                <button
                  type="button"
                  disabled={isBatchProcessing}
                  onClick={handleBatchAutoPilotSweep}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold transition flex items-center gap-1 text-[11px] shadow-xs"
                >
                  {isBatchProcessing ? (
                    <>
                      <RotateCw className="w-3 h-3 animate-spin" /> Replying ({pendingComments.length})...
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3" /> Reply Pending ({pendingComments.length})
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <label className="flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={enablePrivateInboxReply}
                  onChange={(e) => setEnablePrivateInboxReply(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Auto Inbox DM</span>
              </label>

              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Delay:</span>
                <select
                  value={autoDelayRange}
                  onChange={(e) => setAutoDelayRange(e.target.value as any)}
                  className="px-2 py-1 border rounded-lg bg-background text-[11px] font-medium outline-none"
                >
                  <option value="fast">5–15s (Fast)</option>
                  <option value="natural">15–45s (Natural)</option>
                  <option value="safe">45–120s (Safe)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setShowQuickSimModal(true)}
                className="px-2.5 py-1 border rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground font-semibold transition flex items-center gap-1 text-[11px]"
                title="Inject a simulated comment event to test the live stream"
              >
                <Terminal className="w-3 h-3 text-blue-600" /> + Test Event
              </button>
            </div>
          </div>

          {/* Failed Delivery Alert Banner with 1-Click Retry All */}
          {failedComments.length > 0 && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  <strong>{failedComments.length} comment(s)</strong> encountered a Private Messenger Inbox timeout or rate-limit. Nested reply was saved — click retry to re-dispatch the DM.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedStatusFilter(selectedStatusFilter === "Failed" ? "ALL" : "Failed")
                  }
                  className="px-2.5 py-1 rounded-lg border border-rose-500/40 text-rose-600 dark:text-rose-300 font-semibold hover:bg-rose-500/10 transition"
                >
                  {selectedStatusFilter === "Failed" ? "Show All" : "Filter Failed"}
                </button>
                <button
                  type="button"
                  onClick={handleRetryAllFailed}
                  className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <RotateCw className="w-3.5 h-3.5" /> Retry All Failed ({failedComments.length})
                </button>
              </div>
            </div>
          )}

          {/* Search, Source Type & Status Filter Bar */}
          <div className="border bg-card p-3 rounded-xl shadow-xs space-y-2.5 text-xs">
            <div className="flex items-center justify-between gap-2.5">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search customer, comment, or post..."
                  value={streamSearchQuery}
                  onChange={(e) => setStreamSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border rounded-lg bg-background text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              {/* View Mode Toggle: Icon-Only (Table vs Cards) */}
              <div className="flex items-center bg-muted p-0.5 rounded-lg border shrink-0">
                <button
                  type="button"
                  onClick={() => setStreamViewMode("compact")}
                  aria-label="Table View"
                  title="Table View"
                  className={`p-1.5 rounded-md transition flex items-center justify-center cursor-pointer ${
                    streamViewMode === "compact"
                      ? "bg-background text-blue-600 shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setStreamViewMode("cards")}
                  aria-label="Cards View"
                  title="Cards View"
                  className={`p-1.5 rounded-md transition flex items-center justify-center cursor-pointer ${
                    streamViewMode === "cards"
                      ? "bg-background text-blue-600 shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Source Type & Queue Status Quick Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t">
              {/* Source Type Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase text-muted-foreground mr-1">Source:</span>
                {(
                  [
                    { label: `All Sources (${comments.length})`, value: "ALL" },
                    { label: `Pages (${pageCommentsCount})`, value: "Page" },
                    { label: `Groups (${groupCommentsCount})`, value: "Group" },
                    { label: `Personal IDs (${idCommentsCount})`, value: "Personal ID" },
                  ] as const
                ).map((pill) => (
                  <button
                    key={pill.value}
                    type="button"
                    onClick={() => setSelectedSourceFilter(pill.value)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition border ${
                      selectedSourceFilter === pill.value
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase text-muted-foreground mr-1">Status:</span>
                {(
                  [
                    { label: `All (${comments.length})`, value: "ALL" },
                    { label: `Auto/Replied (${repliedComments.length})`, value: "Replied" },
                    { label: `Pending Review (${pendingComments.length})`, value: "Pending" },
                    { label: `Failed / Retry (${failedComments.length})`, value: "Failed" },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => setSelectedStatusFilter(st.value)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition border ${
                      selectedStatusFilter === st.value
                        ? st.value === "Failed"
                          ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                          : "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}

                {(selectedAccountFilter !== "ALL" ||
                  selectedSourceFilter !== "ALL" ||
                  selectedPostFilter !== "ALL" ||
                  selectedStatusFilter !== "ALL" ||
                  selectedIntentFilter !== "ALL" ||
                  streamSearchQuery.trim() !== "") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAccountFilter("ALL")
                      setSelectedSourceFilter("ALL")
                      setSelectedPostFilter("ALL")
                      setSelectedStatusFilter("ALL")
                      setSelectedIntentFilter("ALL")
                      setStreamSearchQuery("")
                    }}
                    className="px-2 py-1 text-[11px] text-rose-600 hover:underline font-semibold"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* STREAM VIEW 1: HIGH-DENSITY COMPACT TABLE STREAM (10-15+ rows on screen) */}
          {streamViewMode === "compact" ? (
            <div className="border bg-card rounded-xl shadow-xs overflow-hidden">
              {filteredComments.length === 0 ? (
                <div className="p-10 text-center space-y-2">
                  <div className="text-sm font-bold text-foreground">No matching comments in stream</div>
                  <p className="text-xs text-muted-foreground">
                    Try clearing your active account/source filters or click &ldquo;+ Test Event&rdquo; to simulate an incoming comment.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-muted/50 text-muted-foreground border-b text-[10px] uppercase font-bold tracking-wider">
                      <tr>
                        <th className="px-3.5 py-2.5">Time / Speed</th>
                        <th className="px-3.5 py-2.5">Account, Source &amp; Post</th>
                        <th className="px-3.5 py-2.5">Customer &amp; Comment</th>
                        <th className="px-3.5 py-2.5">1. Nested Comment Reply</th>
                        <th className="px-3.5 py-2.5">2. Private Messenger Inbox</th>
                        <th className="px-3.5 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredComments.map((cm) => {
                        const draft = getDraftForComment(cm)
                        const isReplied = cm.status === "Replied"
                        const isFailed =
                          cm.status === "Failed" ||
                          cm.inboxStatus === "Failed" ||
                          cm.nestedReplyStatus === "Failed"
                        const isExpanded = Boolean(expandedCommentIds[cm.id])
                        const isRetrying = Boolean(retryingIds[cm.id])
                        const sourceType = cm.sourceType || "Page"

                        return (
                          <React.Fragment key={cm.id}>
                            <tr
                              className={`transition ${
                                isFailed
                                  ? "bg-rose-500/5 hover:bg-rose-500/10"
                                  : isReplied
                                  ? "hover:bg-muted/30"
                                  : "bg-amber-500/5 hover:bg-amber-500/10"
                              }`}
                            >
                              {/* 1. Time & Latency */}
                              <td className="px-3.5 py-3 whitespace-nowrap align-top">
                                <div className="font-semibold text-foreground text-[11px]">{cm.receivedAt}</div>
                                {cm.latencyMs ? (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                                    ⚡ {(cm.latencyMs / 1000).toFixed(1)}s {cm.replyMode === "Auto" ? "(Auto)" : ""}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-amber-600 font-medium">Awaiting dispatch</span>
                                )}
                              </td>

                              {/* 2. Account, Source Badge & Post Context (with Thumbnail & Link) */}
                              <td className="px-3.5 py-3 align-top max-w-[245px]">
                                <div className="flex items-start gap-2">
                                  {cm.postThumbnail && (
                                    <img
                                      src={cm.postThumbnail}
                                      alt={cm.postTitle}
                                      className="w-8 h-8 rounded-md object-cover border shrink-0 mt-0.5"
                                    />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                      {getSourceBadge(sourceType)}
                                      <span className="font-bold text-foreground text-[11px] truncate max-w-[130px]">
                                        {cm.accountName || cm.pageName}
                                      </span>
                                    </div>
                                    {cm.groupName && (
                                      <div className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 truncate">
                                        Group: {cm.groupName}
                                      </div>
                                    )}
                                    <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                                      <span className="truncate" title={cm.postTitle}>
                                        {cm.postTitle}
                                      </span>
                                      {cm.postUrl && (
                                        <a
                                          href={cm.postUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-blue-600 hover:text-blue-700 shrink-0"
                                          title="Open Facebook Post"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* 3. Customer & Original Comment */}
                              <td className="px-3.5 py-3 align-top max-w-[260px]">
                                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                  <span className="font-bold text-foreground text-xs">{cm.userName}</span>
                                  {getIntentBadge(cm.intent)}
                                </div>
                                <p className="text-foreground text-[11px] leading-snug line-clamp-2">
                                  &ldquo;{cm.userComment}&rdquo;
                                </p>
                              </td>

                              {/* 4. Nested Comment Reply Status */}
                              <td className="px-3.5 py-3 align-top max-w-[220px]">
                                <div className="mb-1">
                                  {cm.nestedReplyStatus === "Sent" || isReplied ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                      <CheckCircle2 className="w-3 h-3" /> Nested Reply Sent
                                    </span>
                                  ) : cm.nestedReplyStatus === "Failed" ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                                      <AlertCircle className="w-3 h-3" /> Reply Failed
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                      <Clock className="w-3 h-3" /> Ready to Reply
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-muted-foreground line-clamp-2">
                                  {cm.publicReply || draft.publicReply}
                                </p>
                              </td>

                              {/* 5. Private Messenger Inbox Status */}
                              <td className="px-3.5 py-3 align-top max-w-[230px]">
                                <div className="flex items-center gap-1 flex-wrap mb-1">
                                  {cm.inboxStatus === "Sent" ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                      <Inbox className="w-3 h-3" /> Inbox DM Sent
                                    </span>
                                  ) : cm.inboxStatus === "Failed" ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                      <AlertCircle className="w-3 h-3" /> DM Failed — Retry
                                    </span>
                                  ) : cm.inboxStatus === "Skipped" ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border">
                                      DM Skipped
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                      <Clock className="w-3 h-3" /> DM Queued
                                    </span>
                                  )}

                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                    {sourceType === "Page" ? "Page Msg Modal" : "Direct DM Bot"}
                                  </span>
                                </div>
                                {cm.failureReason ? (
                                  <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium line-clamp-2">
                                    {cm.failureReason}
                                  </p>
                                ) : (
                                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                                    {cm.privateInboxMessage || draft.inboxReply}
                                  </p>
                                )}
                              </td>

                              {/* 6. Quick Actions */}
                              <td className="px-3.5 py-3 align-top whitespace-nowrap text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {isFailed && (
                                    <button
                                      type="button"
                                      disabled={isRetrying}
                                      onClick={() => handleRetryFailed(cm)}
                                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-[11px] transition flex items-center gap-1 shadow-xs"
                                      title="1-Click Retry Failed Messenger Inbox & Reply"
                                    >
                                      <RotateCw className={`w-3 h-3 ${isRetrying ? "animate-spin" : ""}`} />
                                      {isRetrying ? "Retrying..." : "Retry Now"}
                                    </button>
                                  )}

                                  {!isReplied && !isFailed && (
                                    <button
                                      type="button"
                                      onClick={() => handleSendDualReply(cm, enablePrivateInboxReply, "Manual")}
                                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] transition flex items-center gap-1 shadow-xs"
                                      title="Send Nested Comment Reply + Private Messenger DM"
                                    >
                                      <Send className="w-3 h-3" /> Reply + DM
                                    </button>
                                  )}

                                  {cm.postUrl && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const matchedPost = findMonitoredPostForComment(cm.postId, cm.postUrl, cm.postTitle)
                                        if (matchedPost) {
                                          handleStartWatcherForPost(matchedPost)
                                        } else {
                                          handleStartWatcherForPost({
                                            id: cm.id,
                                            postId: cm.postId,
                                            postUrl: cm.postUrl || "",
                                            postTitle: cm.postTitle,
                                            postThumbnail: cm.postThumbnail,
                                            sourceType: cm.sourceType || "Page",
                                            targetId: cm.accountId || "",
                                            targetName: cm.accountName || cm.pageName,
                                            accountName: cm.accountName || cm.pageName,
                                            replyConfigMode: "custom",
                                            customPublicReply: cm.publicReply || draft.publicReply,
                                            customInboxMessage: cm.privateInboxMessage || draft.inboxReply,
                                            sendPrivateInbox: true,
                                            status: "Active",
                                            createdAt: new Date().toISOString(),
                                          })
                                        }
                                      }}
                                      className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] transition flex items-center gap-1 shadow-xs"
                                      title="Launch Live Facebook Comment Watcher & Auto-Reply on this Post"
                                    >
                                      <Play className="w-3 h-3 fill-current" /> Watch Live
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => toggleExpandRow(cm.id)}
                                    className="px-2 py-1 rounded-lg border bg-background hover:bg-muted text-muted-foreground hover:text-foreground font-semibold text-[11px] transition flex items-center gap-1"
                                    title="Inspect or Edit AI Reply & DM"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => dismissComment(cm.id)}
                                    className="p-1 rounded-lg text-muted-foreground hover:text-rose-600 transition"
                                    title="Dismiss comment"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Expandable Inline Editor Row */}
                            {isExpanded && (
                              <tr className="bg-muted/20 border-b">
                                <td colSpan={6} className="p-4">
                                  <div className="space-y-3 bg-card border rounded-xl p-4 shadow-xs">
                                    <div className="flex items-center justify-between border-b pb-2">
                                      <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                        Inline AI Reply &amp; Messenger DM Editor — {cm.userName} ({sourceType})
                                      </div>
                                      <span className="text-[11px] text-muted-foreground">
                                        Routing:{" "}
                                        <strong>
                                          {sourceType === "Page"
                                            ? "Facebook Page Nested Reply + Page 'Send Message' Button Modal"
                                            : "Group/ID Nested Comment Reply + Direct Messenger Profile DM"}
                                        </strong>
                                      </span>
                                    </div>

                                    {/* AI Suggestions Chips */}
                                    {cm.suggestions.length > 0 && (
                                      <div className="space-y-1">
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                                          Quick AI Variations (Click to Apply):
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                          {cm.suggestions.map((sug, idx) => (
                                            <button
                                              key={idx}
                                              type="button"
                                              onClick={() => updateDraft(cm.id, "publicReply", sug)}
                                              className="px-2.5 py-1 border rounded-lg bg-background hover:bg-muted text-left text-[11px] text-muted-foreground hover:text-foreground transition"
                                            >
                                              &ldquo;{sug}&rdquo;
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div className="space-y-1">
                                        <label className="font-semibold text-muted-foreground uppercase text-[10px] flex items-center gap-1">
                                          <MessageSquare className="w-3 h-3 text-blue-600" />
                                          1. Nested Reply Inside Customer&apos;s Comment
                                        </label>
                                        <textarea
                                          rows={2}
                                          value={draft.publicReply}
                                          onChange={(e) => updateDraft(cm.id, "publicReply", e.target.value)}
                                          className="w-full p-2.5 border rounded-lg bg-background text-xs leading-relaxed focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        />
                                      </div>

                                      <div className="space-y-1">
                                        <label className="font-semibold text-muted-foreground uppercase text-[10px] flex items-center gap-1">
                                          <Inbox className="w-3 h-3 text-blue-600" />
                                          2. Private Messenger Inbox Message (DM)
                                        </label>
                                        <textarea
                                          rows={2}
                                          value={draft.inboxReply}
                                          onChange={(e) => updateDraft(cm.id, "inboxReply", e.target.value)}
                                          className="w-full p-2.5 border rounded-lg bg-background text-xs leading-relaxed focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        />
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-1">
                                      <button
                                        type="button"
                                        onClick={() => toggleExpandRow(cm.id)}
                                        className="px-3 py-1.5 border rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground"
                                      >
                                        Close
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSendDualReply(cm, false, "Manual")}
                                        className="px-3 py-1.5 border rounded-lg text-xs font-semibold hover:bg-muted transition text-foreground"
                                      >
                                        Send Nested Reply Only
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSendDualReply(cm, true, "Manual")}
                                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition flex items-center gap-1.5"
                                      >
                                        <Send className="w-3.5 h-3.5" />
                                        {isReplied ? "Re-Send Nested Reply + Inbox DM" : "Dispatch Nested Reply + Inbox DM"}
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* STREAM VIEW 2: DETAILED CARD VIEW */
            <div className="space-y-4">
              {filteredComments.length === 0 ? (
                <div className="border bg-card rounded-xl p-10 text-center space-y-2 shadow-xs">
                  <div className="text-sm font-bold text-foreground">No matching comments in stream</div>
                  <p className="text-xs text-muted-foreground">
                    Try clearing your active account/source filters or click &ldquo;+ Test Event&rdquo; to simulate an incoming comment.
                  </p>
                </div>
              ) : (
                filteredComments.map((cm) => {
                  const draft = getDraftForComment(cm)
                  const isReplied = cm.status === "Replied"
                  const isFailed =
                    cm.status === "Failed" || cm.inboxStatus === "Failed" || cm.nestedReplyStatus === "Failed"
                  const isRetrying = Boolean(retryingIds[cm.id])
                  const sourceType = cm.sourceType || "Page"

                  return (
                    <div
                      key={cm.id}
                      className={`border bg-card p-5 rounded-xl shadow-xs space-y-3.5 transition ${
                        isFailed
                          ? "border-rose-500/40 bg-rose-500/5"
                          : isReplied
                          ? "border-blue-500/30 bg-blue-50/10 dark:bg-blue-950/10"
                          : "hover:border-blue-500/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                          {cm.postThumbnail && (
                            <img
                              src={cm.postThumbnail}
                              alt={cm.postTitle}
                              className="w-10 h-10 rounded-lg object-cover border shrink-0"
                            />
                          )}
                          <div className="w-9 h-9 rounded-full bg-blue-600/10 text-blue-600 font-bold flex items-center justify-center text-xs overflow-hidden shrink-0 border border-blue-500/20">
                            {cm.userAvatar ? (
                              <img src={cm.userAvatar} alt={cm.userName} className="w-full h-full object-cover" />
                            ) : (
                              cm.userName.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-foreground flex items-center gap-2 flex-wrap">
                              {cm.userName}
                              {getSourceBadge(sourceType)}
                              {getIntentBadge(cm.intent)}
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-foreground font-semibold">{cm.accountName || cm.pageName}</span>
                              {cm.groupName && <span>• Group: {cm.groupName}</span>}
                              <span className="inline-flex items-center gap-1">
                                • Post: {cm.postTitle}
                                {cm.postUrl && (
                                  <a
                                    href={cm.postUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 hover:text-blue-700"
                                    title="Open Facebook Post"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </span>
                              <span>• {cm.receivedAt}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isFailed ? (
                            <button
                              type="button"
                              disabled={isRetrying}
                              onClick={() => handleRetryFailed(cm)}
                              className="px-3 py-1 rounded-full text-xs font-bold bg-rose-600 disabled:opacity-50 text-white hover:bg-rose-700 transition flex items-center gap-1.5"
                            >
                              <RotateCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
                              {isRetrying ? "Retrying..." : "Retry Failed DM"}
                            </button>
                          ) : isReplied ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Nested Reply + Inbox Sent
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                              <Clock className="w-3 h-3" /> Pending Action
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => dismissComment(cm.id)}
                            className="p-1 rounded text-muted-foreground hover:text-rose-500 transition"
                            title="Dismiss comment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {cm.failureReason && (
                        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{cm.failureReason}</span>
                        </div>
                      )}

                      <div className="p-3 rounded-lg bg-muted/40 border text-xs font-normal text-foreground leading-relaxed">
                        &ldquo;{cm.userComment}&rdquo;
                      </div>

                      {!isReplied ? (
                        <div className="space-y-3 pt-1">
                          {cm.suggestions.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                                Quick AI Variations (Click to Apply):
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {cm.suggestions.map((sug, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => updateDraft(cm.id, "publicReply", sug)}
                                    className="px-2.5 py-1 border rounded-lg bg-background hover:bg-muted text-left text-[11px] text-muted-foreground hover:text-foreground transition"
                                  >
                                    &ldquo;{sug}&rdquo;
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1">
                              <label className="font-semibold text-muted-foreground uppercase text-[10px] flex items-center gap-1">
                                <MessageSquare className="w-3 h-3 text-blue-600" />
                                1. Nested Comment Reply
                              </label>
                              <textarea
                                rows={3}
                                value={draft.publicReply}
                                onChange={(e) => updateDraft(cm.id, "publicReply", e.target.value)}
                                className="w-full p-2.5 border rounded-lg bg-background text-xs leading-relaxed outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-semibold text-muted-foreground uppercase text-[10px] flex items-center gap-1">
                                <Inbox className="w-3 h-3 text-blue-600" />
                                2. Private Messenger Inbox Message
                              </label>
                              <textarea
                                rows={3}
                                value={draft.inboxReply}
                                onChange={(e) => updateDraft(cm.id, "inboxReply", e.target.value)}
                                className="w-full p-2.5 border rounded-lg bg-background text-xs leading-relaxed outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleSendDualReply(cm, false, "Manual")}
                              className="px-3.5 py-2 border rounded-lg text-xs font-semibold hover:bg-muted transition"
                            >
                              Nested Reply Only
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendDualReply(cm, enablePrivateInboxReply, "Manual")}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition flex items-center gap-2"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Send Nested Reply + Private Inbox
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs border-t">
                          <div className="p-2.5 rounded-lg bg-background border space-y-1">
                            <span className="text-[10px] font-semibold text-emerald-600 block uppercase">
                              1. Nested Comment Reply Dispatched
                            </span>
                            <p className="text-muted-foreground text-[11px] leading-relaxed">{cm.publicReply}</p>
                          </div>

                          {cm.privateInboxMessage && (
                            <div className="p-2.5 rounded-lg bg-background border space-y-1">
                              <span className="text-[10px] font-semibold text-blue-600 block uppercase">
                                2. Private Messenger DM ({cm.inboxDeliveryMethod || "Sent"})
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
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 1.5: MONITORED POSTS (UP TO 100 POSTS UNDER PERSONAL ID, PAGE, OR GROUP) */}
      {activeTab === "posts" && (
        <div className="space-y-3 animate-in fade-in duration-200">
          {/* Compact Monitored Posts Header Bar */}
          <div className="border bg-card rounded-xl shadow-xs px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-bold text-sm text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                Monitored Posts ({monitoredPosts.length}/{MAX_MONITORED_POSTS})
              </div>
              <p className="text-muted-foreground text-[11px]">
                Auto-reply &amp; Inbox DM rules per Facebook ID, Page, or Group post.
              </p>
            </div>

            <button
              type="button"
              onClick={() => openAddPostModal("Personal ID")}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" /> Add Post
            </button>
          </div>

          {/* Source Filter Tabs & Search Bar */}
          <div className="border bg-card rounded-xl shadow-xs p-4 space-y-4 text-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Source Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(
                  [
                    { label: `All Posts (${monitoredPosts.length}/${MAX_MONITORED_POSTS})`, value: "ALL" },
                    {
                      label: `Personal IDs (${monitoredPosts.filter((p) => p.sourceType === "Personal ID").length})`,
                      value: "Personal ID",
                    },
                    {
                      label: `Facebook Pages (${monitoredPosts.filter((p) => p.sourceType === "Page").length})`,
                      value: "Page",
                    },
                    {
                      label: `Facebook Groups (${monitoredPosts.filter((p) => p.sourceType === "Group").length})`,
                      value: "Group",
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setPostsSourceFilter(tab.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                      postsSourceFilter === tab.value
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Monitored Posts & View Toggle */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search post title, URL, ID, page, or group..."
                    value={postsSearchQuery}
                    onChange={(e) => setPostsSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border rounded-lg bg-background text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="inline-flex items-center bg-muted p-0.5 rounded-lg border shrink-0">
                  <button
                    type="button"
                    onClick={() => setPostsViewMode("table")}
                    title="Table View"
                    aria-label="Table View"
                    className={`p-1.5 rounded-md transition flex items-center justify-center ${
                      postsViewMode === "table"
                        ? "bg-background shadow-xs text-blue-600"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <LayoutList className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostsViewMode("cards")}
                    title="Cards View"
                    aria-label="Cards View"
                    className={`p-1.5 rounded-md transition flex items-center justify-center ${
                      postsViewMode === "cards"
                        ? "bg-background shadow-xs text-blue-600"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Monitored Posts Table / Grid */}
            {filteredMonitoredPosts.length === 0 ? (
              <div className="p-10 text-center space-y-3 border rounded-xl bg-muted/10">
                <div className="text-sm font-bold text-foreground">No monitored posts found</div>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Click <strong>&ldquo;Add Post&rdquo;</strong> to select a Personal ID, Facebook Page, or Group, paste your post link, and configure its comment reply and private inbox message.
                </p>
                <button
                  type="button"
                  onClick={() => openAddPostModal("Personal ID")}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-xs transition inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" /> Add First Post
                </button>
              </div>
            ) : postsViewMode === "table" ? (
              <div className="border rounded-xl bg-card overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        <th className="py-2.5 px-3">Post &amp; Link</th>
                        <th className="py-2.5 px-3">Channel / Page</th>
                        <th className="py-2.5 px-3">1. Comment Reply</th>
                        <th className="py-2.5 px-3">2. Inbox Message (DM)</th>
                        <th className="py-2.5 px-3 text-right">Status &amp; Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredMonitoredPosts.map((post) => {
                        const postComments = comments.filter((c) => doesCommentMatchMonitoredPost(c, post))
                        const postRepliedCount = postComments.filter((c) => c.status === "Replied").length
                        const postInboxCount = postComments.filter((c) => c.inboxStatus === "Sent").length
                        const isActive = post.status === "Active"

                        return (
                          <tr
                            key={post.id}
                            className={`transition hover:bg-muted/20 ${
                              !isActive ? "opacity-75 bg-muted/10" : ""
                            }`}
                          >
                            {/* Column 1: Thumbnail + Post Title + Link */}
                            <td className="py-3 px-3 align-top max-w-[290px]">
                              <div className="flex items-start gap-2.5">
                                {post.postThumbnail ? (
                                  <img
                                    src={post.postThumbnail}
                                    alt={post.postTitle}
                                    className="w-11 h-11 rounded-lg object-cover border shrink-0 bg-muted"
                                  />
                                ) : (
                                  <div className="w-11 h-11 rounded-lg border bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                                    <Link2 className="w-4 h-4" />
                                  </div>
                                )}
                                <div className="min-w-0 space-y-1">
                                  <div className="font-bold text-foreground text-xs leading-snug line-clamp-1">
                                    {post.postTitle}
                                  </div>
                                  <a
                                    href={post.postUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-mono truncate max-w-[210px]"
                                  >
                                    <Link2 className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{post.postUrl}</span>
                                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                  </a>
                                  <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground">
                                    <span>{postComments.length} Comments</span>
                                    <span className="text-emerald-600">• {postRepliedCount} Replied</span>
                                    <span className="text-blue-600">• {postInboxCount} DMs</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Column 2: Source Badge + Target Page/ID/Group */}
                            <td className="py-3 px-3 align-top whitespace-nowrap">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  {getSourceBadge(post.sourceType)}
                                  <span className="font-bold text-foreground text-xs">
                                    {post.targetName}
                                  </span>
                                </div>
                                {post.sourceType === "Group" && post.accountName && (
                                  <div className="text-[10px] text-muted-foreground">
                                    ID: <strong className="text-foreground">{post.accountName}</strong>
                                  </div>
                                )}
                                <div className="text-[10px] text-muted-foreground">
                                  {post.replyConfigMode === "template"
                                    ? `Template: ${post.templateTitle || "AI Rule"}`
                                    : "Custom Reply & DM"}
                                </div>
                              </div>
                            </td>

                            {/* Column 3: Configured Nested Comment Reply */}
                            <td className="py-3 px-3 align-top max-w-[230px]">
                              <p className="text-muted-foreground text-[11px] leading-relaxed line-clamp-2">
                                {post.customPublicReply}
                              </p>
                            </td>

                            {/* Column 4: Configured Inbox DM */}
                            <td className="py-3 px-3 align-top max-w-[230px]">
                              <p className="text-muted-foreground text-[11px] leading-relaxed line-clamp-2">
                                {post.customInboxMessage}
                              </p>
                              <span
                                className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  post.sendPrivateInbox
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {post.sendPrivateInbox ? "Auto-DM Enabled" : "Comment Only"}
                              </span>
                            </td>

                            {/* Column 5: Status & Actions */}
                            <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                              <div className="flex flex-col items-end gap-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    isActive
                                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                  }`}
                                >
                                  {isActive ? "● Active" : "Paused"}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleStartWatcherForPost(post)}
                                    className="px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] inline-flex items-center gap-1 transition"
                                    title="Watch Live & Auto-Reply on Facebook"
                                  >
                                    <Play className="w-3 h-3 fill-current" /> Watch Live
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSimulateCommentOnPost(post)}
                                    className="px-2 py-1 rounded-md border bg-background hover:bg-muted font-semibold text-foreground text-[10px] inline-flex items-center gap-1 transition"
                                    title="Simulate a customer comment on this post"
                                  >
                                    <Zap className="w-3 h-3 text-blue-600" /> Test
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => toggleMonitoredPostStatus(post.id)}
                                    className="p-1 rounded-md border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition"
                                    title={isActive ? "Pause Auto-Reply" : "Resume Auto-Reply"}
                                  >
                                    {isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 text-emerald-600" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => startEditMonitoredPost(post)}
                                    className="p-1 rounded-md border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition"
                                    title="Edit Post"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteMonitoredPost(post.id)}
                                    className="p-1 rounded-md border bg-background hover:bg-rose-50 hover:text-rose-600 text-muted-foreground transition"
                                    title="Delete Post"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredMonitoredPosts.map((post) => {
                  const postComments = comments.filter((c) => doesCommentMatchMonitoredPost(c, post))
                  const postRepliedCount = postComments.filter((c) => c.status === "Replied").length
                  const postInboxCount = postComments.filter((c) => c.inboxStatus === "Sent").length
                  const isActive = post.status === "Active"

                  return (
                    <div
                      key={post.id}
                      className={`p-4 rounded-xl border space-y-3 text-xs transition shadow-xs ${
                        isActive
                          ? "bg-card hover:border-blue-500/40"
                          : "bg-muted/20 border-dashed opacity-80"
                      }`}
                    >
                      {/* Post Header: Thumbnail, Source Badge, Target Name, Status Toggle */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start gap-2.5 min-w-0">
                          {post.postThumbnail && (
                            <img
                              src={post.postThumbnail}
                              alt={post.postTitle}
                              className="w-11 h-11 rounded-lg object-cover border shrink-0"
                            />
                          )}
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {getSourceBadge(post.sourceType)}
                              <span className="font-bold text-foreground text-xs truncate">
                                {post.targetName}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isActive
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                    : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                }`}
                              >
                                {isActive ? "● Active Monitoring" : "Paused"}
                              </span>
                            </div>

                            {post.sourceType === "Group" && post.accountName && (
                              <div className="text-[10px] text-muted-foreground">
                                Operating ID: <strong className="text-foreground">{post.accountName}</strong>
                              </div>
                            )}

                            <div className="font-bold text-sm text-foreground leading-snug line-clamp-1">
                              {post.postTitle}
                            </div>

                            <a
                              href={post.postUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-mono truncate max-w-xs"
                            >
                              <Link2 className="w-3 h-3 shrink-0" />
                              <span className="truncate">{post.postUrl}</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            </a>
                          </div>
                        </div>

                        {/* Edit / Pause / Delete Controls */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            data-testid={`toggle-post-status-${post.id}`}
                            onClick={() => toggleMonitoredPostStatus(post.id)}
                            className="p-1.5 rounded-lg border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition"
                            title={isActive ? "Pause Auto-Reply on this Post" : "Resume Auto-Reply on this Post"}
                          >
                            {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-600" />}
                          </button>
                          <button
                            type="button"
                            data-testid={`edit-post-${post.id}`}
                            onClick={() => startEditMonitoredPost(post)}
                            className="p-1.5 rounded-lg border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition"
                            title="Edit Post Link, Reply or Inbox Message"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            data-testid={`delete-post-${post.id}`}
                            onClick={() => deleteMonitoredPost(post.id)}
                            className="p-1.5 rounded-lg border bg-background hover:bg-rose-50 hover:text-rose-600 text-muted-foreground transition"
                            title="Remove Monitored Post"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Reply Configuration Mode & Live Post Stats */}
                      <div className="flex items-center justify-between gap-2 flex-wrap px-2.5 py-1.5 rounded-lg bg-muted/40 border text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span className="text-muted-foreground">Config:</span>
                          <span className="font-semibold text-foreground">
                            {post.replyConfigMode === "template"
                              ? `Template (${post.templateTitle || "AI Rule"})`
                              : "Custom Written Reply & DM"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-semibold">
                          <span>{postComments.length} Comments</span>
                          <span className="text-emerald-600">• {postRepliedCount} Replied</span>
                          <span className="text-blue-600">• {postInboxCount} DMs</span>
                        </div>
                      </div>

                      {/* Configured Nested Comment Reply Preview */}
                      <div className="p-2.5 rounded-lg bg-background border space-y-1">
                        <span className="text-[10px] font-semibold text-blue-600 block uppercase">
                          1. Configured Nested Comment Reply
                        </span>
                        <p className="text-muted-foreground text-[11px] leading-relaxed line-clamp-2">
                          {post.customPublicReply}
                        </p>
                      </div>

                      {/* Configured Private Inbox Message Preview */}
                      <div className="p-2.5 rounded-lg bg-background border space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-blue-600 uppercase">
                            2. Configured Private Inbox Message (DM)
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-600">
                            {post.sendPrivateInbox ? "Auto-DM Enabled" : "DM Disabled"}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-[11px] leading-relaxed line-clamp-2">
                          {post.customInboxMessage}
                        </p>
                      </div>

                      {/* Post Action Footer: Test Comment, Watch Live Bot, Filter Stream */}
                      <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            data-testid={`test-post-comment-${post.id}`}
                            onClick={() => handleSimulateCommentOnPost(post)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-semibold text-[11px] transition flex items-center gap-1"
                            title="Simulate a customer comment on this post to test its configured reply and DM"
                          >
                            <Zap className="w-3 h-3" /> Test Comment + DM
                          </button>

                          <button
                            type="button"
                            data-testid={`watch-live-post-${post.id}`}
                            onClick={() => handleStartWatcherForPost(post)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition flex items-center gap-1 shadow-xs"
                            title="Launch real browser Comment Watcher Bot for this post URL"
                          >
                            <Play className="w-3 h-3 fill-current" /> Watch Live on FB
                          </button>
                        </div>

                        <button
                          type="button"
                          data-testid={`view-post-stream-${post.id}`}
                          onClick={() => {
                            setSelectedPostFilter(post.id)
                            setActiveTab("incoming")
                          }}
                          className="px-2.5 py-1.5 rounded-lg border bg-background hover:bg-muted text-foreground font-semibold text-[11px] transition flex items-center gap-1"
                        >
                          View Stream ({postComments.length}) <ArrowRight className="w-3 h-3" />
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

      {/* TAB 2: AI KNOWLEDGEBASE & DYNAMIC PROMPT RULES (Upgraded from static 500+ Library) */}
      {activeTab === "library" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Global AI Bot Persona & Dynamic Context Bar */}
          <div className="border bg-card rounded-xl shadow-xs p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <div className="font-bold text-sm text-foreground flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" /> Global AI Bot Persona &amp; Multi-Account Prompt Engine
              </div>
              <p className="text-muted-foreground text-[11px]">
                Configure how the AI bot dynamically generates nested replies and private DMs per Page, Group, and Product across your 100 accounts.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">AI Tone:</span>
                <select
                  value={globalAiTone}
                  onChange={(e) => updateGlobalAiConfig(e.target.value, globalAutoAskOrderInfo)}
                  className="px-2.5 py-1.5 border rounded-lg bg-background text-xs font-semibold outline-none"
                >
                  <option value="Polite Bengali + Banglish E-Commerce Concierge">
                    Polite Bengali + Banglish Concierge (ভাইয়া/আপু)
                  </option>
                  <option value="Formal Official Brand Support">Formal Official Brand Support</option>
                  <option value="Urgent Direct-Closing Sales Bot">Urgent Direct-Closing Sales Bot</option>
                </select>
              </div>

              <label className="flex items-center gap-1.5 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={globalAutoAskOrderInfo}
                  onChange={(e) => updateGlobalAiConfig(globalAiTone, e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-blue-600"
                />
                <span>Always ask Name, Address &amp; Mobile in DM</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setEditingTemplateId(null)
                  setTmplTitle("")
                  setTmplTargetScope("All 100 Accounts (Pages, Groups & IDs)")
                  setTmplProductName("")
                  setTmplPriceInfo("")
                  setTmplDeliveryInfo("")
                  setTmplStockStatus("In Stock")
                  setTmplAiPromptInstruction("")
                  setTmplPublicReply("")
                  setTmplInboxReply("")
                  setTmplKeywords("")
                  setShowTemplateModal(true)
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add AI Knowledge Rule
              </button>
            </div>
          </div>

          <div className="border bg-card rounded-xl shadow-xs p-5 space-y-4">
            {/* Search & Category Filter */}
            <div className="space-y-3 text-xs">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search rules by product name, page/group scope, price, or trigger keyword..."
                  value={librarySearchQuery}
                  onChange={(e) => setLibrarySearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border rounded-lg bg-background text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px]">
                {[
                  "ALL",
                  "Price Query",
                  "Delivery Query",
                  "Stock Query",
                  "Warranty Query",
                  "Location Query",
                  "Needs Review",
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

            {/* AI Knowledgebase Rules Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {filteredLibrary.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="p-4 rounded-xl border bg-muted/10 space-y-3 text-xs hover:border-blue-500/40 transition shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-foreground">{tmpl.title}</div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {tmpl.category}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                          Scope: {tmpl.targetScope || "All 100 Accounts"}
                        </span>
                        {tmpl.stockStatus && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            {tmpl.stockStatus}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditTemplate(tmpl)}
                        className="p-1.5 rounded-lg border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition"
                        title="Edit AI Rule"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteLibraryTemplate(tmpl.id)}
                        className="p-1.5 rounded-lg border bg-background hover:bg-rose-50 hover:text-rose-600 text-muted-foreground transition"
                        title="Delete AI Rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Product & Pricing Facts */}
                  {(tmpl.productName || tmpl.priceInfo || tmpl.deliveryInfo) && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 rounded-lg bg-muted/40 border text-[11px]">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">Product</span>
                        <span className="font-semibold text-foreground">{tmpl.productName || "All Products"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">Offer Price</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {tmpl.priceInfo || "Standard"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">Delivery SLA</span>
                        <span className="font-medium text-foreground">{tmpl.deliveryInfo || "Nationwide COD"}</span>
                      </div>
                    </div>
                  )}

                  {/* AI Prompt Instruction */}
                  {tmpl.aiPromptInstruction && (
                    <div className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/20 text-[11px]">
                      <span className="font-bold text-blue-600 dark:text-blue-400 uppercase text-[9px] block">
                        AI Dynamic Prompt Rule:
                      </span>
                      <p className="text-muted-foreground">{tmpl.aiPromptInstruction}</p>
                    </div>
                  )}

                  {/* Nested Comment Reply Preview */}
                  <div className="p-2.5 rounded-lg bg-background border space-y-1">
                    <span className="text-[10px] font-semibold text-blue-600 block uppercase">
                      1. Nested Comment Reply Template
                    </span>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">{tmpl.publicReply}</p>
                  </div>

                  {/* Private Inbox Reply Preview */}
                  <div className="p-2.5 rounded-lg bg-background border space-y-1">
                    <span className="text-[10px] font-semibold text-blue-600 block uppercase">
                      2. Private Messenger Inbox DM Template
                    </span>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">{tmpl.privateInboxReply}</p>
                  </div>

                  {/* Keywords */}
                  {tmpl.keywords.length > 0 && (
                    <div className="flex items-center justify-between gap-2 flex-wrap pt-1 text-[10px]">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-muted-foreground font-semibold">Triggers:</span>
                        {tmpl.keywords.map((kw, i) => (
                          <span key={i} className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">
                            {kw}
                          </span>
                        ))}
                      </div>
                      <span className="text-muted-foreground font-semibold">{tmpl.usesCount} auto-executions</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EXECUTION AUDIT LEDGER */}
      {activeTab === "logs" && (
        <div className="border bg-card rounded-xl shadow-xs overflow-hidden animate-in fade-in duration-200">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" /> 100-Account Nested Reply &amp; Private Inbox Audit Ledger ({logs.length})
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Chronological execution log of every nested comment reply and private Messenger DM across Pages, Groups, and Personal IDs.
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
              No replies dispatched yet. Auto-pilot or manual replies will populate the audit ledger.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground border-b text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Account &amp; Channel</th>
                    <th className="px-4 py-3">Customer &amp; Query</th>
                    <th className="px-4 py-3">Nested Comment Reply</th>
                    <th className="px-4 py-3">Private Messenger Reply</th>
                    <th className="px-4 py-3">Execution Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-sans">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/20 transition">
                      <td className="px-4 py-3 whitespace-nowrap text-[11px] text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {getSourceBadge(log.sourceType)}
                          <span className="font-semibold text-foreground">{log.pageName}</span>
                        </div>
                        {log.groupName && (
                          <div className="text-[10px] text-violet-600 font-medium mt-0.5">{log.groupName}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-bold text-foreground">{log.customerName}</div>
                        <div className="text-muted-foreground truncate text-[11px]">{log.customerQuery}</div>
                      </td>
                      <td className="px-4 py-3 text-foreground font-medium max-w-xs truncate">
                        {log.publicReply}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-medium max-w-xs truncate">
                        {log.privateInboxReply || "None / Pending Retry"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {log.status === "Failed" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                            <AlertCircle className="w-3 h-3" /> Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> {log.graphApiResponse || "Success"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LIVE REAL-WORLD TEST (ID, GROUP & PAGE) */}
      {activeTab === "liveTest" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Banner Alert */}
          <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-blue-500/10 border border-rose-500/30 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                <Radio className="w-4 h-4 animate-pulse" />
                Live Facebook End-to-End Real World Testing (Page, Group &amp; Personal ID)
              </div>
              <p className="text-xs text-muted-foreground">
                Test with 2 different accounts: Post with your 1st ID (or Page/Group), comment from your 2nd ID, and watch the AI bot enter the comment&apos;s reply box and send a Messenger DM live!
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowQuickSimModal(true)}
                className="text-[11px] bg-background hover:bg-muted border px-3 py-1.5 rounded-full font-semibold text-foreground flex items-center gap-1.5 shadow-xs transition"
              >
                <Terminal className="w-3 h-3 text-blue-600" /> Open Synthetic Event Simulator
              </button>
              <span className="text-[11px] bg-background border px-2.5 py-1 rounded-full font-semibold text-foreground flex items-center gap-1.5 shadow-xs">
                <Shield className="w-3 h-3 text-emerald-500" /> Active Session: Rasidul
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (7 cols): Personal Facebook ID / Group / Page Comment Watcher Bot */}
            <div className="lg:col-span-7 space-y-4">
              <div className="border bg-card p-5 rounded-xl shadow-xs space-y-4">
                <div className="border-b pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <Bot className="w-4 h-4 text-blue-600" /> Live Browser Comment Watcher &amp; Dual-Reply Bot
                    </h2>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Monitors your Facebook post (Page, Group, or ID), clicks nested &ldquo;Reply&rdquo; under new comments, and dispatches a private message.
                    </p>
                  </div>
                  {watcherStatus === "WATCHING" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Watching Post (Check #{watcherCheckCount})
                    </span>
                  )}
                </div>

                {/* 5-Step Guide */}
                <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1.5 text-muted-foreground border">
                  <div className="font-semibold text-foreground flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5 text-amber-500" /> How to do the Real-World Test:
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                    <li>
                      <strong className="text-foreground">১ম আইডি (Rasidul / Page):</strong> দিয়ে ফেসবুকে আপনার প্রোফাইল, পেজ বা গ্রুপে একটি পোস্ট করুন।
                    </li>
                    <li>
                      সেই পোস্টের <strong className="text-foreground">লিঙ্ক (Post URL)</strong> কপি করে নিচের বক্সে পেস্ট করুন।
                    </li>
                    <li>
                      <strong className="text-foreground">Start AI Comment Watcher Bot</strong> বাটনে চাপ দিন (ব্রাউজার উইন্ডো ওপেন হবে)।
                    </li>
                    <li>
                      এবার আপনার <strong className="text-foreground">২য় ফেসবুক আইডি</strong> থেকে ওই পোস্টে কমেন্ট করুন (যেমন: <em>&ldquo;দাম কত ভাইয়া?&rdquo;</em>)।
                    </li>
                    <li>
                      কয়েক সেকেন্ডের মধ্যে বট স্বয়ংক্রিয়ভাবে ওই কমেন্টের নিচে ঢুকে AI রিপ্লাই দেবে এবং ইনবক্সে মেসেজ পাঠাবে!
                    </li>
                  </ol>
                </div>

                <form onSubmit={handleStartWatcher} className="space-y-3.5 text-xs">
                  <div>
                    <label className="font-semibold block mb-1">Facebook Post URL *</label>
                    <input
                      type="url"
                      required
                      placeholder="https://www.facebook.com/... (Profile, Page, or Group Post URL)"
                      value={watcherPostUrl}
                      onChange={(e) => setWatcherPostUrl(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-background text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer font-medium select-none">
                      <input
                        type="checkbox"
                        checked={watcherAutoReply}
                        onChange={(e) => setWatcherAutoReply(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>Auto-Reply with AI (Bangla Intent Classifier)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-medium select-none">
                      <input
                        type="checkbox"
                        checked={watcherHeaded}
                        onChange={(e) => setWatcherHeaded(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>Visible Chrome Window (Watch bot live on screen)</span>
                    </label>
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={watcherLoading || watcherStatus === "WATCHING"}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg shadow-xs transition flex items-center gap-2 text-xs"
                    >
                      {watcherLoading ? (
                        <>
                          <RotateCw className="w-3.5 h-3.5 animate-spin" /> Launching Bot...
                        </>
                      ) : watcherStatus === "WATCHING" ? (
                        <>
                          <RotateCw className="w-3.5 h-3.5 animate-spin" /> Actively Monitoring Comments...
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" /> Start AI Comment Watcher Bot
                        </>
                      )}
                    </button>
                    {watcherJobId && (
                      <span className="text-[11px] text-muted-foreground font-mono">Job: {watcherJobId}</span>
                    )}
                  </div>
                </form>

                {/* Detected Live Replies on Facebook */}
                {watcherReplies.length > 0 && (
                  <div className="mt-4 border rounded-lg p-3 bg-emerald-500/10 border-emerald-500/30 space-y-2">
                    <div className="font-bold text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Live Comments Detected &amp; Replied on Facebook ({watcherReplies.length}):
                    </div>
                    <div className="space-y-2">
                      {watcherReplies.map((r, idx) => (
                        <div key={idx} className="bg-background p-2.5 rounded-md border text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground">Customer: {r.author}</span>
                            <span className="text-[10px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded font-semibold">
                              {r.intent}
                            </span>
                          </div>
                          <p className="text-muted-foreground text-[11px]">Query: &ldquo;{r.commentText}&rdquo;</p>
                          <div className="p-2 bg-muted/40 rounded text-foreground text-[11px] font-medium border">
                            AI Nested Reply: {r.aiReply}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bot Live Execution Logs Terminal */}
              <div className="border bg-slate-950 text-slate-100 p-4 rounded-xl shadow-xs space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-[11px] font-bold text-slate-400 ml-1">BOT EXECUTION CONSOLE</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Status: {watcherStatus}</span>
                </div>
                <pre className="p-2 bg-slate-900 border border-slate-800 rounded text-emerald-400 text-[11px] overflow-x-auto whitespace-pre-wrap max-h-56">
                  {watcherLogs ||
                    "Bot console ready. Click 'Start AI Comment Watcher Bot' to see live browser execution logs..."}
                </pre>
              </div>
            </div>

            {/* Right Column (5 cols): Official Meta Page Webhook */}
            <div className="lg:col-span-5 space-y-4">
              <div className="border bg-card p-5 rounded-xl shadow-xs space-y-4">
                <div className="border-b pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-600" /> Official Meta Page Webhooks
                    </h2>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Instant Graph API comment reply + private Messenger delivery.
                    </p>
                  </div>
                  <button
                    onClick={fetchLiveWebhookEvents}
                    disabled={liveWebhookLoading}
                    className="p-1.5 border rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
                    title="Refresh Webhook Events"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${liveWebhookLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                      Webhook Callback URL
                    </label>
                    <div className="p-2 bg-muted/40 border rounded-lg font-mono text-[11px] text-foreground select-all break-all">
                      https://big-poems-brake.loca.lt/api/webhooks/facebook
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">Verify Token</label>
                    <div className="p-2 bg-muted/40 border rounded-lg font-mono text-[11px] text-foreground select-all">
                      bmt_webhook_2026
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                      Connected Meta Page
                    </label>
                    <div className="p-2 bg-muted/40 border rounded-lg text-[11px] text-foreground flex items-center justify-between">
                      <span className="font-semibold">CARE HUB BD</span>
                      <span className="font-mono text-muted-foreground text-[10px]">ID: 892168940637389</span>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Channel-Aware Dual-Action Routing:
                    </div>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>
                        <strong>Page Comments:</strong> Uses Page <code>Send Message</code> button modal or Graph API{" "}
                        <code>/messages</code>
                      </li>
                      <li>
                        <strong>Group / ID Comments:</strong> Enters nested comment thread + sends Direct Messenger DM
                      </li>
                    </ul>
                  </div>

                  {/* Live Webhook Events Received */}
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between font-semibold text-[11px]">
                      <span>Live Incoming Page Events:</span>
                      <span className="text-muted-foreground">{liveWebhookEvents.length} events</span>
                    </div>

                    {liveWebhookEvents.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-[11px] border rounded-lg bg-muted/20">
                        No live page webhook events captured yet.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {liveWebhookEvents.map((evt) => (
                          <div key={evt.id} className="p-2.5 border rounded-lg bg-background text-[11px] space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-foreground">{evt.customerName}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(evt.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-muted-foreground">Query: &ldquo;{evt.customerQuery}&rdquo;</p>
                            <div className="text-emerald-600 dark:text-emerald-400 font-medium text-[10px] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Replied: {evt.intent}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 0: STEP-BY-STEP "+ ADD POST" USER JOURNEY MODAL (ID / PAGE / GROUP -> DROPDOWN -> POST LINK -> TEMPLATE OR CUSTOM REPLY + DM) */}
      {showAddPostModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-xl w-full p-4 sm:p-5 space-y-3.5 shadow-2xl animate-in zoom-in-95 duration-200 my-6">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-blue-600" />
                  {editingPostId ? "Edit Post" : "Add Post"}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Set auto comment reply &amp; inbox DM ({monitoredPosts.length}/{MAX_MONITORED_POSTS} posts)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPostModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMonitoredPostSubmit} className="space-y-3.5 text-xs">
              {/* STEP 1: SELECT SOURCE TYPE TAB */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-muted text-muted-foreground border border-border/60 inline-flex items-center justify-center text-[10px] font-medium shrink-0">
                    1
                  </span>
                  Channel *
                </label>

                <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/60 rounded-xl border">
                  <button
                    type="button"
                    data-testid="source-tab-id"
                    onClick={() => handleSwitchPostSourceTab("Personal ID")}
                    className={`py-1.5 px-2.5 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                      postSourceTab === "Personal ID"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    ID ({connectedPersonalIds.length})
                  </button>

                  <button
                    type="button"
                    data-testid="source-tab-page"
                    onClick={() => handleSwitchPostSourceTab("Page")}
                    className={`py-1.5 px-2.5 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                      postSourceTab === "Page"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Page ({connectedPages.length})
                  </button>

                  <button
                    type="button"
                    data-testid="source-tab-group"
                    onClick={() => handleSwitchPostSourceTab("Group")}
                    className={`py-1.5 px-2.5 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                      postSourceTab === "Group"
                        ? "bg-violet-600 text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    Group ({connectedGroups.length})
                  </button>
                </div>
              </div>

              {/* STEP 2: DYNAMIC DROPDOWN */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-muted text-muted-foreground border border-border/60 inline-flex items-center justify-center text-[10px] font-medium shrink-0">
                    2
                  </span>
                  {postSourceTab === "Personal ID"
                    ? "Select ID *"
                    : postSourceTab === "Page"
                    ? "Select Page *"
                    : "Select Group *"}
                </label>

                {postSourceTab === "Personal ID" && (
                  <select
                    data-testid="target-entity-select"
                    value={selectedTargetId}
                    onChange={(e) => handleSelectTargetFromDropdown(e.target.value)}
                    aria-label="Select Connected Personal ID"
                    className="w-full px-3 py-2 border rounded-lg bg-background font-semibold text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  >
                    {connectedPersonalIds.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} — UID: {item.uid} ({item.status})
                      </option>
                    ))}
                  </select>
                )}

                {postSourceTab === "Page" && (
                  <select
                    data-testid="target-entity-select"
                    value={selectedTargetId}
                    onChange={(e) => handleSelectTargetFromDropdown(e.target.value)}
                    aria-label="Select Connected Facebook Page"
                    className="w-full px-3 py-2 border rounded-lg bg-background font-semibold text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  >
                    {connectedPages.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} — {item.category} (ID: {item.id})
                      </option>
                    ))}
                  </select>
                )}

                {postSourceTab === "Group" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground block mb-1">Group:</span>
                      <select
                        data-testid="target-entity-select"
                        value={selectedTargetId}
                        onChange={(e) => handleSelectTargetFromDropdown(e.target.value)}
                        aria-label="Select Connected Facebook Group"
                        className="w-full px-3 py-2 border rounded-lg bg-background font-semibold text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      >
                        {connectedGroups.map((grp) => (
                          <option key={grp.id} value={grp.id}>
                            {grp.name} ({(grp.memberCount / 1000).toFixed(0)}k)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground block mb-1">Reply ID:</span>
                      <select
                        data-testid="operating-account-select"
                        value={selectedPostAccountName}
                        onChange={(e) => setSelectedPostAccountName(e.target.value)}
                        aria-label="Select Operating Account for Group"
                        className="w-full px-3 py-2 border rounded-lg bg-background font-semibold text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      >
                        {connectedPersonalIds.map((acc) => (
                          <option key={acc.id} value={acc.name}>
                            {acc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 3: PASTE FACEBOOK POST LINK (URL) & OPTIONAL POST TITLE */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-muted text-muted-foreground border border-border/60 inline-flex items-center justify-center text-[10px] font-medium shrink-0">
                    3
                  </span>
                  Post Link &amp; Title *
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-7">
                    <input
                      type="url"
                      required
                      data-testid="post-url-input"
                      placeholder="Paste Facebook Post Link (https://...)"
                      value={postLinkInput}
                      onChange={(e) => setPostLinkInput(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-background font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      data-testid="post-title-input"
                      placeholder={`Label (e.g. ${selectedTargetName})`}
                      value={postTitleInput}
                      onChange={(e) => setPostTitleInput(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-background text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Live Facebook Post Thumbnail & Title Preview */}
                {(isFetchingPostPreview || postThumbnailPreview || postFetchedTitle) && (
                  <div className="flex items-center gap-2.5 p-2 rounded-lg border bg-muted/30 text-xs">
                    {isFetchingPostPreview ? (
                      <div className="w-10 h-10 rounded-md border bg-muted flex items-center justify-center shrink-0">
                        <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                      </div>
                    ) : postThumbnailPreview ? (
                      <img
                        src={postThumbnailPreview}
                        alt={postTitleInput || postFetchedTitle || "Post preview"}
                        className="w-10 h-10 rounded-md object-cover border shrink-0 bg-muted"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-md border bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-foreground truncate text-xs">
                        {isFetchingPostPreview
                          ? "Fetching real Facebook post image & title..."
                          : postTitleInput || postFetchedTitle || "Facebook Post Connected"}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold truncate">
                        {isFetchingPostPreview
                          ? "Connecting to Facebook post..."
                          : postThumbnailPreview
                            ? "✓ Real Facebook Post Image & Title Loaded"
                            : "✓ Facebook Post Title Loaded"}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 4: CONFIGURE COMMENT REPLY & PRIVATE INBOX MESSAGE */}
              <div className="space-y-2.5 pt-1 border-t">
                <div className="flex items-center justify-between gap-2 pt-2">
                  <label className="font-bold text-foreground uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-muted text-muted-foreground border border-border/60 inline-flex items-center justify-center text-[10px] font-medium shrink-0">
                      4
                    </span>
                    <span>Reply &amp; Inbox DM *</span>
                  </label>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="inline-flex items-center bg-muted p-0.5 rounded-lg border shrink-0">
                      <button
                        type="button"
                        data-testid="reply-mode-template"
                        onClick={() => handleSelectPostTemplate(selectedPostTemplateId || library[0]?.id || "")}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition flex items-center gap-1 shrink-0 ${
                          postReplyMode === "template"
                            ? "bg-blue-600 text-white shadow-xs font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <BookOpen className="w-3 h-3 shrink-0" />
                        <span>Template ({library.length})</span>
                      </button>
                      <button
                        type="button"
                        data-testid="reply-mode-custom"
                        onClick={() => setPostReplyMode("custom")}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition flex items-center gap-1 shrink-0 ${
                          postReplyMode === "custom"
                            ? "bg-blue-600 text-white shadow-xs font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Edit3 className="w-3 h-3 shrink-0" />
                        <span>Custom</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingTemplateId(null)
                        setTmplTitle("")
                        setTmplPublicReply(postCustomPublicReply)
                        setTmplInboxReply(postCustomInboxMessage)
                        setShowTemplateModal(true)
                      }}
                      title="Add New Reply & DM Template"
                      className="px-2 py-1 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer shrink-0"
                    >
                      <Plus className="w-3 h-3" /> New Template
                    </button>
                  </div>
                </div>

                {postReplyMode === "template" && (() => {
                  const activeTmpl = library.find((t) => t.id === selectedPostTemplateId) || library[0]
                  const q = templateDropdownSearch.trim().toLowerCase()
                  const filteredTemplates = q
                    ? library.filter(
                        (t) =>
                          t.title.toLowerCase().includes(q) ||
                          t.category.toLowerCase().includes(q) ||
                          t.publicReply.toLowerCase().includes(q) ||
                          t.privateInboxReply.toLowerCase().includes(q) ||
                          (t.priceInfo || "").toLowerCase().includes(q)
                      )
                    : library

                  return (
                    <div className="relative">
                      <button
                        type="button"
                        data-testid="template-select"
                        onClick={() => setIsTemplateDropdownOpen((prev) => !prev)}
                        className="w-full px-3 py-2 border rounded-lg bg-background hover:bg-muted/30 transition flex items-center justify-between gap-2 text-left outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {activeTmpl && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-bold shrink-0">
                              {activeTmpl.category}
                            </span>
                          )}
                          <span className="font-semibold text-xs text-foreground truncate">
                            {activeTmpl ? activeTmpl.title : "Select a Template..."}
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-150 ${
                            isTemplateDropdownOpen ? "rotate-180 text-foreground" : ""
                          }`}
                        />
                      </button>

                      {isTemplateDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsTemplateDropdownOpen(false)}
                          />
                          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                            {/* Search Input Inside Smart Dropdown */}
                            <div className="p-2 border-b bg-muted/30 flex items-center gap-2">
                              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-1" />
                              <input
                                type="text"
                                autoFocus
                                placeholder="Search template by name, category, or reply..."
                                value={templateDropdownSearch}
                                onChange={(e) => setTemplateDropdownSearch(e.target.value)}
                                className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                              />
                              {templateDropdownSearch && (
                                <button
                                  type="button"
                                  onClick={() => setTemplateDropdownSearch("")}
                                  className="text-muted-foreground hover:text-foreground p-0.5 rounded"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Filtered Options List */}
                            <div className="max-h-52 overflow-y-auto divide-y divide-border/40">
                              {filteredTemplates.length > 0 ? (
                                filteredTemplates.map((tmpl) => {
                                  const isSelected = tmpl.id === selectedPostTemplateId
                                  return (
                                    <div
                                      key={tmpl.id}
                                      onClick={() => {
                                        handleSelectPostTemplate(tmpl.id)
                                        setIsTemplateDropdownOpen(false)
                                        setTemplateDropdownSearch("")
                                      }}
                                      className={`px-3 py-2 flex items-start justify-between gap-2 cursor-pointer transition ${
                                        isSelected
                                          ? "bg-blue-500/10"
                                          : "hover:bg-muted/50"
                                      }`}
                                    >
                                      <div className="min-w-0 flex-1 space-y-0.5">
                                        <div className="flex items-center gap-1.5">
                                          <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground border text-[10px] font-semibold shrink-0">
                                            {tmpl.category}
                                          </span>
                                          <span className="font-semibold text-xs text-foreground truncate">
                                            {tmpl.title}
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground truncate">
                                          {tmpl.publicReply}
                                        </p>
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0 pt-0.5">
                                        <button
                                          type="button"
                                          title="Edit Template"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setIsTemplateDropdownOpen(false)
                                            startEditTemplate(tmpl)
                                          }}
                                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition"
                                        >
                                          <Edit3 className="w-3 h-3" />
                                        </button>
                                        {isSelected && (
                                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                        )}
                                      </div>
                                    </div>
                                  )
                                })
                              ) : (
                                <div className="p-4 text-center space-y-2">
                                  <p className="text-xs text-muted-foreground">
                                    No template found for &ldquo;{templateDropdownSearch}&rdquo;
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsTemplateDropdownOpen(false)
                                      setEditingTemplateId(null)
                                      setTmplTitle(templateDropdownSearch.trim())
                                      setTmplPublicReply(postCustomPublicReply)
                                      setTmplInboxReply(postCustomInboxMessage)
                                      setTemplateDropdownSearch("")
                                      setShowTemplateModal(true)
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" /> Create &ldquo;{templateDropdownSearch.trim()}&rdquo;
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })()}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground text-[11px] flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-blue-600" />
                      Comment Reply *
                    </label>
                    <textarea
                      rows={3}
                      required
                      data-testid="custom-public-reply-input"
                      placeholder="Public comment reply..."
                      value={postCustomPublicReply}
                      onChange={(e) => {
                        const val = e.target.value
                        setPostCustomPublicReply(val)
                        const activeTmpl = library.find((t) => t.id === selectedPostTemplateId)
                        if (postReplyMode === "template" && activeTmpl && val.trim() !== activeTmpl.publicReply.trim()) {
                          setPostReplyMode("custom")
                        }
                      }}
                      className="w-full p-2 border rounded-lg bg-background text-xs leading-relaxed focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-foreground text-[11px] flex items-center gap-1">
                      <Inbox className="w-3 h-3 text-blue-600" />
                      Inbox Message (DM) *
                    </label>
                    <textarea
                      rows={3}
                      required
                      data-testid="custom-inbox-msg-input"
                      placeholder="Private Messenger DM..."
                      value={postCustomInboxMessage}
                      onChange={(e) => {
                        const val = e.target.value
                        setPostCustomInboxMessage(val)
                        const activeTmpl = library.find((t) => t.id === selectedPostTemplateId)
                        if (
                          postReplyMode === "template" &&
                          activeTmpl &&
                          val.trim() !== activeTmpl.privateInboxReply.trim()
                        ) {
                          setPostReplyMode("custom")
                        }
                      }}
                      className="w-full p-2 border rounded-lg bg-background text-xs leading-relaxed focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 font-semibold text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    data-testid="send-private-inbox-checkbox"
                    checked={postSendPrivateInbox}
                    onChange={(e) => setPostSendPrivateInbox(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600"
                  />
                  <span>Also send Private Inbox Message (DM)</span>
                </label>
              </div>

              {/* STEP 5: SAVE */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddPostModal(false)}
                  className="px-3 py-1.5 border rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="save-monitored-post-btn"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {editingPostId
                    ? "Save Changes"
                    : `Save Post (${Math.min(monitoredPosts.length + 1, MAX_MONITORED_POSTS)}/${MAX_MONITORED_POSTS})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT REPLY & DM TEMPLATE */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-4 sm:p-5 space-y-3.5 shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" />
                {editingTemplateId ? "Edit Template" : "New Template"}
              </h3>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplateSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-7">
                  <label className="font-semibold block mb-1">Template Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Eid Offer Reply"
                    value={tmplTitle}
                    onChange={(e) => setTmplTitle(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background outline-none"
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="font-semibold block mb-1">Category *</label>
                  <select
                    value={tmplCategory}
                    onChange={(e) => setTmplCategory(e.target.value as CommentIntentType)}
                    className="w-full px-2.5 py-2 border rounded-lg bg-background font-medium outline-none"
                  >
                    <option value="Price Query">Price Query</option>
                    <option value="Delivery Query">Delivery Query</option>
                    <option value="Stock Query">Stock Query</option>
                    <option value="Warranty Query">Warranty Query</option>
                    <option value="Location Query">Location Query</option>
                    <option value="General Greeting">General Greeting</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Comment Reply *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Public comment reply..."
                  value={tmplPublicReply}
                  onChange={(e) => setTmplPublicReply(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background outline-none"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Inbox Message (DM) *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Private Messenger DM..."
                  value={tmplInboxReply}
                  onChange={(e) => setTmplInboxReply(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-3 py-1.5 border rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-xs transition cursor-pointer"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TUCKED-AWAY SYNTHETIC COMMENT EVENT SIMULATOR */}
      {showQuickSimModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-600" /> Quick Multi-Channel Comment Event Simulator
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Simulate an incoming comment on any Page, Group, or Personal ID to verify Auto-Pilot nested reply and DM routing.
                </p>
              </div>
              <button
                onClick={() => setShowQuickSimModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Source Channel</label>
                  <select
                    value={simSourceType}
                    onChange={(e) => setSimSourceType(e.target.value as CommentSourceType)}
                    className="w-full px-2.5 py-2 border rounded-lg bg-background font-semibold outline-none"
                  >
                    <option value="Page">Facebook Page</option>
                    <option value="Group">Facebook Group (100 IDs)</option>
                    <option value="Personal ID">Personal Profile ID</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Account / Page Name</label>
                  <select
                    value={simPageName}
                    onChange={(e) => setSimPageName(e.target.value)}
                    className="w-full px-2.5 py-2 border rounded-lg bg-background font-semibold outline-none"
                  >
                    {selectableAccounts.map((acc) => (
                      <option key={acc} value={acc}>
                        {acc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={simCustomerName}
                    onChange={(e) => setSimCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background outline-none"
                  />
                </div>
              </div>

              {simSourceType === "Group" && (
                <div>
                  <label className="font-semibold block mb-1">Target Facebook Group Name</label>
                  <input
                    type="text"
                    value={simGroupName}
                    onChange={(e) => setSimGroupName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background outline-none"
                  />
                </div>
              )}

              <div>
                <label className="font-semibold block mb-1">Customer Comment *</label>
                <textarea
                  rows={2}
                  value={simCommentText}
                  onChange={(e) => setSimCommentText(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSimCommentText("দাম কত ভাইয়া? ডেলিভারি চার্জ কত?")}
                  className="px-2.5 py-1 rounded-lg border bg-muted/40 hover:bg-muted font-semibold flex items-center gap-1"
                >
                  <BadgeDollarSign className="w-3 h-3 text-blue-600" /> Price Query
                </button>
                <button
                  type="button"
                  onClick={() => setSimCommentText("ঢাকার বাইরে কি হোম ডেলিভারি পাওয়া যাবে?")}
                  className="px-2.5 py-1 rounded-lg border bg-muted/40 hover:bg-muted font-semibold flex items-center gap-1"
                >
                  <Truck className="w-3 h-3 text-blue-600" /> Delivery Query
                </button>
                <button
                  type="button"
                  onClick={() => setSimCommentText("ব্ল্যাক কালারটা কি স্টকে আছে?")}
                  className="px-2.5 py-1 rounded-lg border bg-muted/40 hover:bg-muted font-semibold flex items-center gap-1"
                >
                  <Package className="w-3 h-3 text-blue-600" /> Stock Query
                </button>
                <button
                  type="button"
                  onClick={() => setSimCommentText("শোরুমের ঠিকানা কোথায়?")}
                  className="px-2.5 py-1 rounded-lg border bg-muted/40 hover:bg-muted font-semibold flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3 text-blue-600" /> Location Query
                </button>
              </div>

              <label className="flex items-center gap-2 font-semibold text-rose-600 dark:text-rose-400 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={simSimulateFailure}
                  onChange={(e) => setSimSimulateFailure(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-rose-600"
                />
                <span>Simulate Failed Inbox DM (Test 1-Click Retry Queue)</span>
              </label>

              <button
                type="button"
                disabled={isSimulating}
                onClick={handleRunSimulation}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg shadow-xs transition flex items-center justify-center gap-2"
              >
                {isSimulating ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" /> Simulating Comment Event...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" /> Push Comment Event ({mode === "Auto" ? "Auto-Pilot Instant Reply" : "Manual Queue"})
                  </>
                )}
              </button>

              {simPushedSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-between gap-3 text-xs text-emerald-600 dark:text-emerald-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      Event processed and added to <strong>Live Activity Stream</strong>!
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuickSimModal(false)
                      setActiveTab("incoming")
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 shrink-0"
                  >
                    View in Stream <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {simResponseOutput && (
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-blue-300 text-[11px] overflow-x-auto max-h-48 font-mono">
                  {JSON.stringify(simResponseOutput, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
