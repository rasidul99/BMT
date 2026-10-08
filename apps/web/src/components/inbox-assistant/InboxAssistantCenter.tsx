"use client"

import React, { useState, useMemo, useEffect, useRef } from "react"
import {
  MessageSquare,
  Bot,
  User,
  UserCheck,
  Sparkles,
  Send,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  Trash2,
  Sliders,
  Bookmark,
  Zap,
  Check,
  Store,
  X,
  Play,
  Terminal,
  AlertTriangle,
  Package,
  Edit3,
  BrainCircuit,
  ChevronDown,
  Globe,
  Layers,
} from "lucide-react"
import {
  useInboxAssistant,
  ConversationCategory,
  TrainedProduct,
  ProductStockStatus,
  generatePreviewTrainedAnswer,
} from "../../hooks/useInboxAssistant"
import { useFacebookAccounts } from "../../hooks/useFacebookAccounts"
import { getPageRegistry, upsertPage } from "../../lib/fb-page-registry"

interface InboxAssistantCenterProps {
  currentMode: "SAFE" | "ADVANCED"
}

export interface InboxChannelItem {
  key: string
  sourceType: "Page" | "Personal ID" | "ALL"
  id: string
  name: string
  label: string
  cookieString?: string
  enabled?: boolean
}

const CUSTOM_CHANNELS_STORAGE_KEY = "bmt_inbox_custom_channels_v1"

export function InboxAssistantCenter({ currentMode }: InboxAssistantCenterProps) {
  const {
    conversations,
    selectedConversation,
    setSelectedConvId,
    templates,
    products,
    storeProfile,
    settings,
    metrics,
    sendReply,
    syncLiveConversations,
    toggleRunning,
    setOperatingMode,
    setCategoryStyle,
    updateHumanDelay,
    addTemplate,
    deleteTemplate,
    addProduct,
    updateProduct,
    deleteProduct,
    saveStoreProfile,
  } = useInboxAssistant()

  const { accounts: fleetAccounts } = useFacebookAccounts()

  const [activeTab, setActiveTab] = useState<
    "INBOX" | "TRAINING" | "TEMPLATES" | "RULES" | "LEDGER"
  >("INBOX")
  const [searchQuery, setSearchQuery] = useState("")
  const [replyInput, setReplyInput] = useState("")
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Channel selector for Live Messenger Bot (Page, Personal ID, or ALL_CHANNELS)
  const [selectedChannelKey, setSelectedChannelKey] = useState<string>(
    "Page::61595136714776::Test Next"
  )

  // Smart Searchable Channel Dropdown State
  const [isChannelDropdownOpen, setIsChannelDropdownOpen] = useState(false)
  const [channelSearchQuery, setChannelSearchQuery] = useState("")
  const [channelTypeFilter, setChannelTypeFilter] = useState<"ALL" | "Page" | "Personal ID">("ALL")
  const channelDropdownRef = useRef<HTMLDivElement>(null)
  const channelSearchInputRef = useRef<HTMLInputElement>(null)

  // Custom added Pages & Personal IDs (up to 100+)
  const [customChannels, setCustomChannels] = useState<InboxChannelItem[]>([])
  const [isAddChannelModalOpen, setIsAddChannelModalOpen] = useState(false)
  const [newChannelType, setNewChannelType] = useState<"Page" | "Personal ID">("Page")
  const [newChannelName, setNewChannelName] = useState("")
  const [newChannelId, setNewChannelId] = useState("")
  const [newChannelCookie, setNewChannelCookie] = useState("")

  // Live Messenger Bot Watcher State
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [watcherStatus, setWatcherStatus] = useState<string>("IDLE")
  const [watcherError, setWatcherError] = useState<string | null>(null)
  const [watcherCheckCount, setWatcherCheckCount] = useState<number>(0)
  const [watcherLogs, setWatcherLogs] = useState<string>("")
  const [showTerminalLogs, setShowTerminalLogs] = useState<boolean>(false)
  const [isStartingBot, setIsStartingBot] = useState<boolean>(false)
  const autoStartedRef = useRef<boolean>(false)

  // Template Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [newTplTitle, setNewTplTitle] = useState("")
  const [newTplCategory, setNewTplCategory] = useState<ConversationCategory | "General">(
    "Sales Conversion"
  )
  const [newTplContent, setNewTplContent] = useState("")

  // Product AI Training Modal State (Add / Edit Product)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [prodName, setProdName] = useState("")
  const [prodKeywords, setProdKeywords] = useState("")
  const [prodRegularPrice, setProdRegularPrice] = useState("")
  const [prodOfferPrice, setProdOfferPrice] = useState("")
  const [prodStockStatus, setProdStockStatus] = useState<ProductStockStatus>("IN_STOCK")
  const [prodStockText, setProdStockText] = useState("হ্যাঁ, আমাদের কাছে পর্যাপ্ত রেডি স্টক আছে")
  const [prodVariants, setProdVariants] = useState("")
  const [prodWhyGood, setProdWhyGood] = useState("")
  const [prodWarranty, setProdWarranty] = useState("")
  const [prodIsDefault, setProdIsDefault] = useState(false)
  const [prodAssignedChannelKey, setProdAssignedChannelKey] = useState<string>("ALL")

  // Store Policy Editable State
  const [deliveryPolicyInput, setDeliveryPolicyInput] = useState(storeProfile.deliveryPolicy)
  const [deliveryTimeInput, setDeliveryTimeInput] = useState(storeProfile.deliveryTime)
  const [showroomAddressInput, setShowroomAddressInput] = useState(storeProfile.showroomAddress)
  const [helplineInput, setHelplineInput] = useState(storeProfile.helplineNumber)

  // Quick Preview Question inside AI Training Tab
  const [previewQuestion, setPreviewQuestion] = useState(
    "ভাইয়া দাম কত, স্টক আছে নাকি আর প্রোডাক্টটা কেন ভালো?"
  )

  useEffect(() => {
    setDeliveryPolicyInput(storeProfile.deliveryPolicy)
    setDeliveryTimeInput(storeProfile.deliveryTime)
    setShowroomAddressInput(storeProfile.showroomAddress)
    setHelplineInput(storeProfile.helplineNumber)
  }, [storeProfile])

  // Load custom channels from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_CHANNELS_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setCustomChannels(parsed)
      }
    } catch {}
  }, [])

  // Close Smart Channel Dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        channelDropdownRef.current &&
        !channelDropdownRef.current.contains(e.target as Node)
      ) {
        setIsChannelDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (isChannelDropdownOpen) {
      setTimeout(() => channelSearchInputRef.current?.focus(), 60)
    }
  }, [isChannelDropdownOpen])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const openAddProductModal = () => {
    setEditingProductId(null)
    setProdName("")
    setProdKeywords("")
    setProdRegularPrice("")
    setProdOfferPrice("")
    setProdStockStatus("IN_STOCK")
    setProdStockText("হ্যাঁ, আমাদের কাছে পর্যাপ্ত রেডি স্টক এভেইলেবল আছে")
    setProdVariants("")
    setProdWhyGood("")
    setProdWarranty("১ বছরের অফিসিয়াল ওয়ারেন্টি")
    setProdIsDefault(products.length === 0)
    setProdAssignedChannelKey("ALL")
    setIsProductModalOpen(true)
  }

  const openEditProductModal = (prod: TrainedProduct) => {
    setEditingProductId(prod.id)
    setProdName(prod.name)
    setProdKeywords(prod.keywords)
    setProdRegularPrice(prod.regularPrice)
    setProdOfferPrice(prod.offerPrice)
    setProdStockStatus(prod.stockStatus)
    setProdStockText(prod.stockQuantityText)
    setProdVariants(prod.variantsAndContents)
    setProdWhyGood(prod.whyGoodFeatures)
    setProdWarranty(prod.warrantyInfo)
    setProdIsDefault(Boolean(prod.isDefaultProduct))
    setProdAssignedChannelKey(prod.assignedChannelKey || "ALL")
    setIsProductModalOpen(true)
  }

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prodName.trim() || !prodOfferPrice.trim()) return

    if (editingProductId) {
      updateProduct(editingProductId, {
        name: prodName.trim(),
        keywords: prodKeywords.trim() || prodName.trim().toLowerCase(),
        regularPrice: prodRegularPrice.trim(),
        offerPrice: prodOfferPrice.trim(),
        stockStatus: prodStockStatus,
        stockQuantityText: prodStockText.trim(),
        variantsAndContents: prodVariants.trim(),
        whyGoodFeatures: prodWhyGood.trim(),
        warrantyInfo: prodWarranty.trim(),
        isDefaultProduct: prodIsDefault,
        assignedChannelKey: prodAssignedChannelKey,
      })
      showToast(`"${prodName.trim()}" প্রোডাক্টের AI ট্রেনিং আপডেট হয়ে লাইভ মেসেঞ্জার বটে সিঙ্ক হয়েছে!`)
    } else {
      addProduct({
        name: prodName.trim(),
        keywords: prodKeywords.trim() || prodName.trim().toLowerCase(),
        regularPrice: prodRegularPrice.trim(),
        offerPrice: prodOfferPrice.trim(),
        stockStatus: prodStockStatus,
        stockQuantityText: prodStockText.trim(),
        variantsAndContents: prodVariants.trim(),
        whyGoodFeatures: prodWhyGood.trim(),
        warrantyInfo: prodWarranty.trim(),
        isDefaultProduct: prodIsDefault,
        assignedChannelKey: prodAssignedChannelKey,
      })
      showToast(`নতুন প্রোডাক্ট "${prodName.trim()}" AI বটে যুক্ত ও সিঙ্ক করা হয়েছে!`)
    }
    setIsProductModalOpen(false)
  }

  const handleSaveStorePolicy = (e: React.FormEvent) => {
    e.preventDefault()
    saveStoreProfile({
      ...storeProfile,
      deliveryPolicy: deliveryPolicyInput.trim(),
      deliveryTime: deliveryTimeInput.trim(),
      showroomAddress: showroomAddressInput.trim(),
      helplineNumber: helplineInput.trim(),
    })
    showToast("স্টোর ও ডেলিভারি পলিসি লাইভ মেসেঞ্জার AI বটে সেভ হয়েছে!")
  }

  // Dynamic connected Facebook Pages & Personal IDs (supports 100+ channels)
  const channelOptions = useMemo(() => {
    const list: InboxChannelItem[] = [
      {
        key: "Page::61595136714776::Test Next",
        sourceType: "Page",
        id: "61595136714776",
        name: "Test Next",
        label: "Page: Test Next (61595136714776)",
        enabled: true,
      },
      {
        key: "Page::892168940637389::CARE HUB BD",
        sourceType: "Page",
        id: "892168940637389",
        name: "CARE HUB BD",
        label: "Page: CARE HUB BD (892168940637389)",
        enabled: true,
      },
      {
        key: "Personal ID::acc-rasidul::Rasidul (Personal ID)",
        sourceType: "Personal ID",
        id: "acc-rasidul",
        name: "Rasidul (Personal ID)",
        label: "Personal ID: Rasidul",
        enabled: true,
      },
    ]

    const registeredPages = getPageRegistry()
    registeredPages.forEach((entry) => {
      if (!list.some((item) => item.id === entry.pageId)) {
        list.push({
          key: `Page::${entry.pageId}::${entry.pageName}`,
          sourceType: "Page",
          id: entry.pageId,
          name: entry.pageName,
          label: `Page: ${entry.pageName} (${entry.pageId})`,
          enabled: true,
        })
      }
    })

    fleetAccounts.forEach((acc) => {
      // Include each connected Personal ID from the 100-Account Fleet
      if (acc.id && acc.name && !list.some((item) => item.id === acc.id || item.name === acc.name)) {
        list.push({
          key: `Personal ID::${acc.id}::${acc.name}`,
          sourceType: "Personal ID",
          id: acc.id,
          name: acc.name,
          label: `Personal ID: ${acc.name} (${acc.id})`,
          cookieString: acc.cookieString,
          enabled: true,
        })
      }
      // Include all connected Pages under each fleet account
      if (acc.connectedPages) {
        acc.connectedPages.forEach((pg) => {
          if (!list.some((item) => item.id === pg.pageId)) {
            list.push({
              key: `Page::${pg.pageId}::${pg.pageName}`,
              sourceType: "Page",
              id: pg.pageId,
              name: pg.pageName,
              label: `Page: ${pg.pageName} (${pg.pageId})`,
              cookieString: acc.cookieString,
              enabled: true,
            })
          }
        })
      }
    })

    customChannels.forEach((ch) => {
      if (!list.some((item) => item.key === ch.key || item.id === ch.id)) {
        list.push({ ...ch, enabled: true })
      }
    })

    return list
  }, [fleetAccounts, customChannels])

  const allChannelsMasterOption: InboxChannelItem = useMemo(
    () => ({
      key: "ALL_CHANNELS",
      sourceType: "ALL",
      id: "ALL",
      name: `All Active Pages & IDs (${channelOptions.length})`,
      label: `🌐 All Active Pages & IDs (${channelOptions.length}টি চ্যানেল — 24/7 AI)`,
      enabled: true,
    }),
    [channelOptions.length]
  )

  const activeChannel = useMemo(() => {
    if (selectedChannelKey === "ALL_CHANNELS") return allChannelsMasterOption
    return channelOptions.find((c) => c.key === selectedChannelKey) || channelOptions[0]
  }, [channelOptions, selectedChannelKey, allChannelsMasterOption])

  const filteredDropdownChannels = useMemo(() => {
    const q = channelSearchQuery.trim().toLowerCase()
    return channelOptions.filter((ch) => {
      if (channelTypeFilter !== "ALL" && ch.sourceType !== channelTypeFilter) return false
      if (!q) return true
      return (
        ch.name.toLowerCase().includes(q) ||
        ch.id.toLowerCase().includes(q) ||
        ch.label.toLowerCase().includes(q)
      )
    })
  }, [channelOptions, channelSearchQuery, channelTypeFilter])

  const pageChannelsCount = useMemo(
    () => channelOptions.filter((c) => c.sourceType === "Page").length,
    [channelOptions]
  )
  const personalIdChannelsCount = useMemo(
    () => channelOptions.filter((c) => c.sourceType === "Personal ID").length,
    [channelOptions]
  )

  const handleAddNewChannel = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChannelName.trim()) return

    const cleanName = newChannelName.trim()
    const cleanId =
      newChannelId.trim() ||
      (newChannelType === "Page" ? `page-${Date.now()}` : `id-${Date.now()}`)
    const newItem: InboxChannelItem = {
      key: `${newChannelType}::${cleanId}::${cleanName}`,
      sourceType: newChannelType,
      id: cleanId,
      name: cleanName,
      label: `${newChannelType}: ${cleanName} (${cleanId})`,
      cookieString: newChannelCookie.trim() || undefined,
      enabled: true,
    }

    const updatedCustom = [...customChannels.filter((c) => c.id !== cleanId), newItem]
    setCustomChannels(updatedCustom)
    try {
      localStorage.setItem(CUSTOM_CHANNELS_STORAGE_KEY, JSON.stringify(updatedCustom))
    } catch {}

    if (newChannelType === "Page") {
      try {
        upsertPage({
          pageId: cleanId,
          pageName: cleanName,
          accessToken: "",
          tokenExpiry: Date.now() + 86400000 * 60,
          category: "E-Commerce",
          isActive: true,
        })
      } catch {}
    }

    // Sync updated monitoredChannels with running 24/7 bot immediately
    const nextAllChannels = [...channelOptions, newItem]
    fetch("/api/facebook-bot/inbox-assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "UPDATE_RUNTIME",
        monitoredChannels: nextAllChannels,
      }),
    }).catch(() => {})

    setNewChannelName("")
    setNewChannelId("")
    setNewChannelCookie("")
    setIsAddChannelModalOpen(false)
    showToast(
      `নতুন ${newChannelType} "${cleanName}" যুক্ত হয়েছে এবং ২৪/৭ মেসেঞ্জার AI বটের তালিকায় সিঙ্ক হয়েছে!`
    )
  }

  // Start or Connect to 24/7 Live Facebook Messenger Bot
  const handleStartLiveInboxBot = async (options?: {
    reuseIfActive?: boolean
    silent?: boolean
    customChannel?: InboxChannelItem
  }) => {
    const channel = options?.customChannel || activeChannel
    setIsStartingBot(true)
    setWatcherError(null)
    setWatcherStatus("STARTING")

    if (!options?.silent) {
      showToast(`Launching 24/7 Live Facebook Messenger Bot for "${channel.name}"...`)
    }

    let resolvedCookie = channel.cookieString || ""
    if (!resolvedCookie) {
      try {
        const accWithCookie = fleetAccounts.find(
          (a) => a.cookieString && a.cookieString.includes("c_user=") && a.cookieString.includes("xs=")
        )
        if (accWithCookie?.cookieString) {
          resolvedCookie = accWithCookie.cookieString
        }
      } catch {}
    }

    try {
      const res = await fetch("/api/facebook-bot/inbox-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: channel.sourceType,
          targetId: channel.id,
          targetName: channel.name,
          monitoredChannels: channelOptions,
          cookieString: resolvedCookie || undefined,
          mode: settings.mode,
          humanDelaySeconds: settings.humanDelaySeconds,
          templates,
          products,
          storeProfile,
          checkIntervalSeconds: 8,
          maxChecks: 86400,
          headless: false,
          reuseIfActive: Boolean(options?.reuseIfActive),
        }),
      })
      const data = await res.json()
      if (data?.success && data.jobId) {
        setActiveJobId(data.jobId)
        setWatcherStatus("WATCHING")
        if (!options?.silent) {
          showToast(`24/7 Live Facebook Messenger Bot active on "${channel.name}"!`)
        }
      } else {
        setWatcherStatus("ERROR")
        setWatcherError(data?.error || "Failed to start Live Messenger Bot")
      }
    } catch (err: any) {
      setWatcherStatus("ERROR")
      setWatcherError(err.message || "Network error launching Live Messenger Bot")
    } finally {
      setIsStartingBot(false)
    }
  }

  useEffect(() => {
    if (!settings.isRunning) return
    if (activeJobId || isStartingBot || autoStartedRef.current) return

    autoStartedRef.current = true
    handleStartLiveInboxBot({ reuseIfActive: true, silent: true })
  }, [settings.isRunning, activeJobId, isStartingBot])

  useEffect(() => {
    if (!activeJobId && !settings.isRunning) return

    const pollNow = async () => {
      try {
        const targetJob = activeJobId || "latest"
        const res = await fetch(
          `/api/facebook-bot/inbox-assistant?jobId=${encodeURIComponent(targetJob)}`
        )
        const data = await res.json()
        if (data?.success && data.jobId) {
          if (!activeJobId) setActiveJobId(data.jobId)
          const nextStatus = data.status || "WATCHING"
          setWatcherStatus(nextStatus)
          setWatcherCheckCount(data.checkCount || 0)
          if (data.error) setWatcherError(data.error)
          if (data.logs) setWatcherLogs(data.logs)
          if (Array.isArray(data.conversations) && data.conversations.length > 0) {
            syncLiveConversations(data.conversations)
          }

          if (
            settings.isRunning &&
            (nextStatus === "COMPLETED" || nextStatus === "STOPPED") &&
            !isStartingBot
          ) {
            handleStartLiveInboxBot({ reuseIfActive: false, silent: true })
          }
        }
      } catch {}
    }

    pollNow()
    const interval = setInterval(pollNow, 3000)

    return () => clearInterval(interval)
  }, [activeJobId, syncLiveConversations, settings.isRunning, isStartingBot])

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

  const handleSendReply = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!replyInput.trim() || !selectedConversation) return

    sendReply(selectedConversation.id, replyInput.trim(), "PAGE")
    setReplyInput("")
    showToast(
      `Reply dispatched to "${selectedConversation.customerName}" on Live Facebook Messenger!`
    )
  }

  const handleApproveSuggestion = (text: string) => {
    if (!selectedConversation) return
    sendReply(selectedConversation.id, text, "AI_ASSISTANT")
    showToast(
      `AI Reply approved & dispatched to "${selectedConversation.customerName}" on Live Messenger!`
    )
  }

  const handleInsertTemplate = (content: string) => {
    setReplyInput(content)
    showToast("Template loaded into reply composer!")
  }

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
    showToast("New message template saved to Library & synced with Live Bot!")
  }

  const isBotWatching = Boolean(
    activeJobId &&
      (watcherStatus === "WATCHING" ||
        watcherStatus === "LAUNCHING_BROWSER" ||
        watcherStatus === "STARTING")
  )

  const livePreviewAnswer = useMemo(() => {
    return generatePreviewTrainedAnswer(
      previewQuestion,
      "Rasidul Islam Sajib",
      products,
      storeProfile
    )
  }, [previewQuestion, products, storeProfile])

  return (
    <div className="space-y-5 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-bold border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3.5 border-b border-border pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <div className="w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-500 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground whitespace-nowrap">
                  AI Inbox Reply Assistant
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border bg-emerald-500/10 text-emerald-500 border-emerald-500/25 whitespace-nowrap shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE BOT ({currentMode})
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                ১০০+ পেজ ও আইডির মেসেঞ্জারে প্রোডাক্টের দাম, স্টক ও ফিচার অনুযায়ী ২৪/৭ অটো-রিপ্লাই
              </p>
            </div>
          </div>
        </div>

        {/* Live Facebook Channel Selector & Train AI + 24/7 Bot Buttons */}
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          <button
            type="button"
            data-testid="open-ai-product-training-btn"
            onClick={() => setActiveTab("TRAINING")}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white transition shadow-xs cursor-pointer whitespace-nowrap"
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>Train AI Products ({products.length})</span>
          </button>

          {/* Smart Searchable 100+ Page & Personal ID Dropdown */}
          <div ref={channelDropdownRef} className="relative">
            <button
              type="button"
              data-testid="smart-channel-dropdown-btn"
              onClick={() => setIsChannelDropdownOpen((prev) => !prev)}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted/60 text-foreground text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 min-w-[235px] sm:min-w-[260px] shadow-xs transition cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                {activeChannel.sourceType === "ALL" ? (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase shrink-0 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    ALL 24/7
                  </span>
                ) : activeChannel.sourceType === "Page" ? (
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[10px] font-black uppercase shrink-0">
                    PAGE
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30 text-[10px] font-black uppercase shrink-0">
                    ID
                  </span>
                )}
                <span className="truncate font-bold">{activeChannel.name}</span>
                {activeChannel.sourceType !== "ALL" && (
                  <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[110px]">
                    ({activeChannel.id})
                  </span>
                )}
              </div>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${
                  isChannelDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isChannelDropdownOpen && (
              <div
                data-testid="smart-channel-dropdown-menu"
                className="absolute right-0 mt-2 w-[350px] sm:w-[410px] rounded-2xl border border-border bg-card shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95"
              >
                {/* Search Input Header */}
                <div className="p-3 border-b border-border bg-muted/30 space-y-2.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      ref={channelSearchInputRef}
                      type="text"
                      data-testid="smart-channel-search-input"
                      placeholder="Search 100+ Pages or Personal IDs by name or ID..."
                      value={channelSearchQuery}
                      onChange={(e) => setChannelSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-8 py-2 rounded-xl border border-border bg-background text-xs font-medium text-foreground outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                    {channelSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setChannelSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filter Tabs inside Dropdown */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setChannelTypeFilter("ALL")}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          channelTypeFilter === "ALL"
                            ? "bg-blue-600 text-white"
                            : "bg-background border border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        All ({channelOptions.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setChannelTypeFilter("Page")}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          channelTypeFilter === "Page"
                            ? "bg-blue-600 text-white"
                            : "bg-background border border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Pages ({pageChannelsCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setChannelTypeFilter("Personal ID")}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          channelTypeFilter === "Personal ID"
                            ? "bg-blue-600 text-white"
                            : "bg-background border border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Personal IDs ({personalIdChannelsCount})
                      </button>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      100+ Ready
                    </span>
                  </div>
                </div>

                {/* Master Option: All Active Pages & IDs (Multi-Channel 24/7 AI) */}
                <div className="p-2 border-b border-border bg-emerald-500/5">
                  <button
                    type="button"
                    data-testid="select-all-channels-option"
                    onClick={() => {
                      setSelectedChannelKey("ALL_CHANNELS")
                      setIsChannelDropdownOpen(false)
                      handleStartLiveInboxBot({
                        reuseIfActive: false,
                        customChannel: allChannelsMasterOption,
                      })
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between gap-2 cursor-pointer ${
                      selectedChannelKey === "ALL_CHANNELS"
                        ? "bg-emerald-500/15 border-emerald-500/40 text-foreground"
                        : "bg-background/70 border-border/60 hover:bg-muted/60 text-foreground"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black flex items-center gap-1.5">
                          <span>All Active Pages &amp; IDs ({channelOptions.length})</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase">
                            24/7 Multi-Bot
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">
                          যুক্ত করা ১০০টি পেজ ও আইডির সকল মেসেজে AI স্বয়ংক্রিয়ভাবে রিপ্লাই দেবে
                        </p>
                      </div>
                    </div>
                    {selectedChannelKey === "ALL_CHANNELS" && (
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                  </button>
                </div>

                {/* Scrollable Search Results List */}
                <div className="max-h-64 overflow-y-auto divide-y divide-border/50 p-1.5">
                  {filteredDropdownChannels.length === 0 ? (
                    <div className="py-8 px-4 text-center space-y-2">
                      <p className="text-xs font-bold text-muted-foreground">
                        &ldquo;{channelSearchQuery}&rdquo; নামে কোনো পেজ বা আইডি পাওয়া যায়নি
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setNewChannelName(channelSearchQuery)
                          setIsChannelDropdownOpen(false)
                          setIsAddChannelModalOpen(true)
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-500 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add &ldquo;{channelSearchQuery}&rdquo; as New Page/ID</span>
                      </button>
                    </div>
                  ) : (
                    filteredDropdownChannels.map((ch) => {
                      const isSelected = selectedChannelKey === ch.key
                      return (
                        <button
                          key={ch.key}
                          type="button"
                          onClick={() => {
                            setSelectedChannelKey(ch.key)
                            setIsChannelDropdownOpen(false)
                            handleStartLiveInboxBot({
                              reuseIfActive: false,
                              customChannel: ch,
                            })
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between gap-2 cursor-pointer ${
                            isSelected
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                              : "hover:bg-muted/60 text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0 border ${
                                ch.sourceType === "Page"
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                  : "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20"
                              }`}
                            >
                              {ch.sourceType === "Page" ? "PAGE" : "ID"}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-bold truncate">{ch.name}</div>
                              <div className="text-[10px] text-muted-foreground font-mono truncate">
                                ID: {ch.id}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="24/7 Ready" />
                            {isSelected && <Check className="w-4 h-4 text-blue-500" />}
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>

                {/* Dropdown Footer: Add New Page / Personal ID (Up to 100+) */}
                <div className="p-2.5 border-t border-border bg-muted/40 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Showing {filteredDropdownChannels.length} of {channelOptions.length} channels
                  </span>
                  <button
                    type="button"
                    data-testid="open-add-channel-modal-btn"
                    onClick={() => {
                      setIsChannelDropdownOpen(false)
                      setIsAddChannelModalOpen(true)
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Page / Personal ID</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            data-testid="start-live-inbox-bot-btn"
            disabled={isStartingBot}
            onClick={() => handleStartLiveInboxBot({ reuseIfActive: false })}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white transition shadow-xs cursor-pointer whitespace-nowrap ${
              isBotWatching
                ? "bg-emerald-600 hover:bg-emerald-500"
                : "bg-blue-600 hover:bg-blue-500"
            }`}
          >
            {isBotWatching ? (
              <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current shrink-0" />
            )}
            <span>
              {isBotWatching
                ? `24/7 Active (${activeChannel.name})`
                : "Watch & Reply Live Messenger"}
            </span>
          </button>
        </div>
      </div>

      {/* Live Messenger Bot Status Banner */}
      {activeJobId && (
        <div
          className={`p-3 rounded-xl border flex flex-col gap-2 text-xs ${
            watcherStatus === "AUTH_ERROR" || watcherStatus === "ERROR"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-bold">
              {watcherStatus === "AUTH_ERROR" || watcherStatus === "ERROR" ? (
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
              )}
              <span>
                {watcherStatus === "AUTH_ERROR" || watcherStatus === "ERROR"
                  ? watcherError || "Live Messenger Bot encountered an error"
                  : `💬 24/7 Live Facebook Messenger Bot Active on "${activeChannel.name}" — Scan #${watcherCheckCount} | Trained on ${products.length} Product(s)`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTerminalLogs((v) => !v)}
                className="px-2.5 py-1 rounded-lg border bg-background/80 text-foreground font-semibold hover:bg-background transition flex items-center gap-1"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>{showTerminalLogs ? "Hide Live Logs" : "View Live Logs"}</span>
              </button>
            </div>
          </div>

          {showTerminalLogs && watcherLogs && (
            <pre className="p-3 rounded-lg bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48 leading-relaxed border border-slate-800">
              {watcherLogs}
            </pre>
          )}
        </div>
      )}

      {/* Control Banner: Operating Mode & Category Selector */}
      <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Continuous Status Toggle */}
          <div className="flex items-center space-x-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                settings.isRunning ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
              }`}
            />
            <span className="font-bold text-foreground">
              {settings.isRunning ? "24/7 ACTIVE" : "PAUSED"}
            </span>
            <button
              type="button"
              onClick={toggleRunning}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                settings.isRunning
                  ? "bg-muted hover:bg-muted/80 text-muted-foreground border border-border"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
              }`}
            >
              {settings.isRunning ? "Pause" : "Activate"}
            </button>
          </div>

          <div className="h-4 w-px bg-border hidden sm:block" />

          {/* Operating Mode Buttons */}
          <div className="flex items-center space-x-1 bg-muted/60 p-1 rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setOperatingMode("AUTO")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                settings.mode === "AUTO"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Auto Reply (Instant Live Bot)</span>
            </button>
            <button
              type="button"
              onClick={() => setOperatingMode("MANUAL")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                settings.mode === "MANUAL"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Manual Reply (Review &amp; Approve)</span>
            </button>
          </div>
        </div>

        {/* Category Style Selector */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
          <span className="font-semibold text-muted-foreground shrink-0">Category Style:</span>
          {(
            [
              { id: "Sales Conversion", label: "Sales" },
              { id: "Lead Conversion", label: "Lead" },
              { id: "Visit Conversion", label: "Visit" },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryStyle(cat.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition border ${
                settings.activeCategory === cat.id
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-background hover:bg-muted text-muted-foreground border-border"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Executive Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Live Conversations</span>
            <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {metrics.totalConvs}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground">
              Synced from Messenger
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Trained Products</span>
            <Package className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">
              {products.length}
            </span>
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              {products.filter((p) => p.stockStatus !== "OUT_OF_STOCK").length} In Stock
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>AI Automated Replies</span>
            <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {metrics.autoRepliedCount}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground">
              Live Messenger Sent
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Average Reply Speed</span>
            <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {metrics.avgResponseTime}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground">
              Human-like Delay
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center space-x-2 border-b border-border pb-2 overflow-x-auto no-scrollbar flex-nowrap">
        <button
          type="button"
          onClick={() => setActiveTab("INBOX")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${
            activeTab === "INBOX"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Live Messenger Inbox ({conversations.length})</span>
        </button>

        <button
          type="button"
          data-testid="tab-ai-product-training"
          onClick={() => setActiveTab("TRAINING")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
            activeTab === "TRAINING"
              ? "bg-violet-600 text-white shadow-xs"
              : "bg-violet-500/10 text-violet-600 dark:text-violet-300 border border-violet-500/20 hover:bg-violet-500/20"
          }`}
        >
          <BrainCircuit className="w-3.5 h-3.5" />
          <span>AI Product Training &amp; Catalog ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("TEMPLATES")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${
            activeTab === "TEMPLATES"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Message Library ({templates.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("RULES")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${
            activeTab === "RULES"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Automation &amp; Delay Rules</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("LEDGER")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${
            activeTab === "LEDGER"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Delivery Audit Ledger</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 0: AI PRODUCT TRAINING & CATALOG KNOWLEDGEBASE       */}
      {/* ======================================================== */}
      {activeTab === "TRAINING" && (
        <div className="space-y-6 text-xs">
          {/* Top Action Header */}
          <div className="border border-violet-500/30 bg-violet-500/5 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-violet-500" />
                <h2 className="text-sm font-black text-foreground">
                  AI Product Knowledgebase &amp; Multi-Intent Training
                </h2>
              </div>
              <p className="text-muted-foreground text-xs max-w-3xl">
                এখানে আপনার প্রতিটি প্রোডাক্টের <b>দাম, স্টক আছে কি না, কী কী কালার/ভ্যারিয়েন্ট আছে, কেন প্রোডাক্টটি ভালো এবং ওয়ারেন্টি</b> যুক্ত করুন। কাস্টমার মেসেঞ্জারে যেভাবেই প্রশ্ন করুক, ২৪/৭ লাইভ AI বট এখানকার তথ্য অনুযায়ী সাথে সাথে উত্তর দেবে!
              </p>
            </div>
            <button
              type="button"
              onClick={openAddProductModal}
              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add New Product to Train AI</span>
            </button>
          </div>

          {/* Trained Products Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {products.map((prod) => {
              const isOut = prod.stockStatus === "OUT_OF_STOCK"
              const isLimited = prod.stockStatus === "LIMITED_STOCK"
              return (
                <div
                  key={prod.id}
                  className={`border rounded-2xl p-4 space-y-3 bg-card shadow-xs transition ${
                    prod.isDefaultProduct
                      ? "border-violet-500/50 ring-1 ring-violet-500/20"
                      : "border-border"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-foreground">{prod.name}</span>
                        {prod.isDefaultProduct && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/15 text-violet-400 border border-violet-500/30">
                            ★ Primary Default Product
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Match Keywords: <span className="text-foreground font-medium">{prod.keywords}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!prod.isDefaultProduct && (
                        <button
                          type="button"
                          onClick={() => {
                            updateProduct(prod.id, { isDefaultProduct: true })
                            showToast(`"${prod.name}"-কে ডিফল্ট প্রোডাক্ট হিসেবে সেট করা হয়েছে!`)
                          }}
                          className="px-2 py-1 rounded-lg border border-border hover:bg-muted text-[10px] font-semibold text-muted-foreground hover:text-foreground transition cursor-pointer"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openEditProductModal(prod)}
                        className="px-2.5 py-1 rounded-lg bg-blue-600/10 text-blue-500 hover:bg-blue-600/20 border border-blue-500/20 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deleteProduct(prod.id)
                          showToast(`"${prod.name}" প্রোডাক্টটি ডিলিট করা হয়েছে।`)
                        }}
                        className="p-1.5 rounded-lg border border-border hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition cursor-pointer"
                        title="Delete product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Price & 1-Click Stock Status Switcher */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/30 p-2.5 rounded-xl border border-border">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                        Trained Price
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-emerald-500">
                          অফার: {prod.offerPrice}
                        </span>
                        {prod.regularPrice && (
                          <span className="text-[11px] text-muted-foreground line-through">
                            রেগুলার: {prod.regularPrice}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block text-right">
                        1-Click Stock Status (Live Sync)
                      </span>
                      <div className="flex items-center gap-1">
                        {(
                          [
                            { id: "IN_STOCK", label: "In Stock" },
                            { id: "LIMITED_STOCK", label: "Limited" },
                            { id: "OUT_OF_STOCK", label: "Out of Stock" },
                          ] as const
                        ).map((st) => {
                          const active = prod.stockStatus === st.id
                          return (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => {
                                updateProduct(prod.id, { stockStatus: st.id })
                                showToast(
                                  `"${prod.name}"-এর স্টক স্ট্যাটাস "${st.label}" হিসেবে লাইভ বটে আপডেট হয়েছে!`
                                )
                              }}
                              className={`px-2 py-1 rounded-md text-[10px] font-bold transition cursor-pointer border ${
                                active
                                  ? st.id === "IN_STOCK"
                                    ? "bg-emerald-600 text-white border-emerald-600"
                                    : st.id === "LIMITED_STOCK"
                                    ? "bg-amber-600 text-white border-amber-600"
                                    : "bg-rose-600 text-white border-rose-600"
                                  : "bg-background text-muted-foreground border-border hover:text-foreground"
                              }`}
                            >
                              {st.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Product Knowledge Fields */}
                  <div className="space-y-2 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-muted/15 border border-border/60">
                      <span className="font-bold text-blue-500 block mb-0.5">
                        📦 কী কী আছে / কালার, সাইজ ও বক্সে যা থাকছে:
                      </span>
                      <p className="text-foreground leading-relaxed">{prod.variantsAndContents}</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-muted/15 border border-border/60">
                      <span className="font-bold text-emerald-500 block mb-0.5">
                        ✨ কেন প্রোডাক্টটি ভালো / মূল বৈশিষ্ট্য ও সুবিধা:
                      </span>
                      <p className="text-foreground leading-relaxed">{prod.whyGoodFeatures}</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-muted/15 border border-border/60 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-violet-400">🛡️ ওয়ারেন্টি ও গ্যারান্টি: </span>
                        <span className="text-foreground">{prod.warrantyInfo}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          isOut
                            ? "bg-rose-500/15 text-rose-400"
                            : isLimited
                            ? "bg-amber-500/15 text-amber-400"
                            : "bg-emerald-500/15 text-emerald-400"
                        }`}
                      >
                        {isOut ? "স্টক আউট" : isLimited ? "সীমিত স্টক" : "স্টকে আছে"}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Store Policy & Live AI Answer Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Store Delivery & Showroom Info Form (6 cols) */}
            <form
              onSubmit={handleSaveStorePolicy}
              className="lg:col-span-6 border border-border bg-card p-4 rounded-2xl space-y-3 shadow-xs"
            >
              <div className="border-b border-border pb-2.5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-foreground">
                    🚚 ডেলিভারি চার্জ, শোরুম ও স্টোর পলিসি ট্রেনিং
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    কাস্টমার ডেলিভারি বা শোরুমের ঠিকানা জানতে চাইলে AI এখান থেকে উত্তর দেবে।
                  </p>
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer"
                >
                  Save Policy
                </button>
              </div>

              <div className="space-y-2.5">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">
                    ডেলিভারি পলিসি ও চার্জ (Delivery Policy)
                  </label>
                  <input
                    type="text"
                    value={deliveryPolicyInput}
                    onChange={(e) => setDeliveryPolicyInput(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">
                    ডেলিভারি সময় (Delivery Time)
                  </label>
                  <input
                    type="text"
                    value={deliveryTimeInput}
                    onChange={(e) => setDeliveryTimeInput(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">
                    শোরুম / অফিসের ঠিকানা (Showroom Address)
                  </label>
                  <input
                    type="text"
                    value={showroomAddressInput}
                    onChange={(e) => setShowroomAddressInput(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">
                    হেল্পলাইন নম্বর (Helpline Number)
                  </label>
                  <input
                    type="text"
                    value={helplineInput}
                    onChange={(e) => setHelplineInput(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </form>

            {/* Instant AI Brain Answer Previewer (6 cols) */}
            <div className="lg:col-span-6 border border-border bg-card p-4 rounded-2xl space-y-3 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="border-b border-border pb-2.5">
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-violet-500" />
                    <span>AI ট্রেইনড উত্তর প্রিভিউ (Instant AI Brain Check)</span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    কাস্টমার মেসেঞ্জারে কোনো প্রশ্ন করলে আপনার ট্রেইন করা তথ্য দিয়ে AI ঠিক কীভাবে উত্তর দেবে তা নিচে দেখুন:
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    "ভাইয়া দাম কত?",
                    "স্টক আছে নাকি নাই?",
                    "কি কি কালার আছে আর বক্সে কি থাকবে?",
                    "প্রোডাক্টটা কেন ভালো? ওয়ারেন্টি আছে?",
                    "ইয়ারবাডের দাম কত আর কেন ভালো?",
                    "আপনাদের কাছে কি কি প্রোডাক্ট আছে?",
                  ].map((sampleQ) => (
                    <button
                      key={sampleQ}
                      type="button"
                      onClick={() => setPreviewQuestion(sampleQ)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                        previewQuestion === sampleQ
                          ? "bg-violet-600 text-white border-violet-600"
                          : "bg-muted/40 text-muted-foreground border-border hover:text-foreground"
                      }`}
                    >
                      {sampleQ}
                    </button>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground text-[11px]">
                    কাস্টমারের যেকোনো প্রশ্ন লিখে চেক করুন:
                  </label>
                  <input
                    type="text"
                    value={previewQuestion}
                    onChange={(e) => setPreviewQuestion(e.target.value)}
                    placeholder="যেমন: ভাইয়া ঘড়িটার দাম কত আর স্টক আছে নাকি?"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/30 space-y-1.5 mt-2">
                <div className="text-[10px] font-bold uppercase text-violet-400 flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5" />
                  <span>Live Messenger AI Auto-Reply Output:</span>
                </div>
                <p className="text-xs text-foreground leading-relaxed font-medium">
                  &ldquo;{livePreviewAnswer}&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: LIVE MESSENGER INBOX (SPLIT-PANE VIEW)            */}
      {/* ======================================================== */}
      {activeTab === "INBOX" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 border border-border bg-card rounded-2xl shadow-xs overflow-hidden text-xs min-h-[620px]">
          {/* Left Pane: Conversations List (5 cols) */}
          <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-border flex flex-col h-[320px] lg:h-[650px] overflow-hidden bg-muted/10">
            <div className="p-3 border-b border-border bg-card">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search customer, page or query..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-border rounded-lg bg-background text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

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
                      type="button"
                      onClick={() => setSelectedConvId(conv.id)}
                      className={`w-full p-3.5 text-left flex items-start space-x-3 transition ${
                        isSelected
                          ? "bg-blue-50/70 dark:bg-blue-950/30 border-l-4 border-blue-600"
                          : "hover:bg-muted/30"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                        {conv.customerName.charAt(0)}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground truncate block">
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
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50">
                            {conv.category}
                          </span>
                        </div>

                        <p className="text-[11px] text-muted-foreground truncate">
                          &ldquo;{conv.lastMessageText}&rdquo;
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
          <div className="lg:col-span-7 flex flex-col min-h-[420px] lg:h-[650px] overflow-hidden bg-background">
            {selectedConversation ? (
              <>
                <div className="p-3.5 border-b border-border bg-card flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                      {selectedConversation.customerName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-foreground">
                          {selectedConversation.customerName}
                        </span>
                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground font-semibold">
                          {selectedConversation.platform}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        Channel: <strong>{selectedConversation.pageName}</strong> • Intent:{" "}
                        <strong className="text-blue-600 dark:text-blue-400">
                          {selectedConversation.category}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center space-x-1 ${
                      selectedConversation.status === "WAITING_REPLY"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60"
                        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60"
                    }`}
                  >
                    {selectedConversation.status === "WAITING_REPLY" ? (
                      <span>Awaiting Reply</span>
                    ) : (
                      <>
                        <Check className="w-3 h-3 mr-1 inline" />
                        <span>Replied on Live Messenger</span>
                      </>
                    )}
                  </span>
                </div>

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
                              <Bot className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              <span className="font-bold text-blue-600 dark:text-blue-400">
                                AI Live Messenger Reply
                              </span>
                            </>
                          ) : (
                            <>
                              <Store className="w-3 h-3 text-blue-600 dark:text-blue-400" />
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
                              : "bg-blue-600 text-white rounded-tr-xs shadow-xs"
                          }`}
                        >
                          {msg.text}
                        </div>

                        {!isCustomer && (
                          <span className="text-[10px] text-muted-foreground font-medium mt-1 flex items-center space-x-1">
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>Delivered via Live Facebook Messenger</span>
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {selectedConversation.aiSuggestions.length > 0 && (
                  <div className="p-3 border-t border-border bg-blue-50/40 dark:bg-blue-950/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          AI Suggested Responses (Trained on {products.length} Products):
                        </span>
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Click Approve to send directly to Live Messenger
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {selectedConversation.aiSuggestions.map((sugg, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-card border border-border rounded-xl flex items-center justify-between gap-3 shadow-xs"
                        >
                          <p className="text-[11px] text-foreground font-medium flex-1">
                            &ldquo;{sugg}&rdquo;
                          </p>
                          <div className="flex items-center space-x-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setReplyInput(sugg)}
                              className="px-2.5 py-1 rounded-lg border border-border text-[11px] font-semibold hover:bg-muted text-foreground transition"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveSuggestion(sugg)}
                              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold shadow-xs transition flex items-center space-x-1"
                            >
                              <Check className="w-3.5 h-3.5 mr-0.5" />
                              <span>Approve &amp; Send Live</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-2 border-t border-border bg-muted/20 flex items-center space-x-2 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] font-semibold text-muted-foreground shrink-0 flex items-center space-x-1">
                    <Bookmark className="w-3 h-3 text-blue-600" />
                    <span>Templates:</span>
                  </span>
                  {templates.slice(0, 3).map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleInsertTemplate(tpl.content)}
                      className="px-2.5 py-1 rounded-lg bg-background border border-border text-[11px] font-medium hover:bg-muted truncate max-w-[160px] shrink-0 transition"
                    >
                      {tpl.title}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setActiveTab("TRAINING")}
                    className="text-[10px] text-violet-500 font-bold hover:underline shrink-0"
                  >
                    + Train Products →
                  </button>
                </div>

                <form
                  onSubmit={handleSendReply}
                  className="p-3 border-t border-border bg-card flex items-center space-x-2"
                >
                  <input
                    type="text"
                    placeholder="Type customized reply to send directly to Live Facebook Messenger..."
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    className="flex-1 px-3 py-2 border border-border rounded-xl bg-background text-xs min-h-[40px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xs transition flex items-center space-x-1.5 min-h-[40px]"
                  >
                    <span>Send Live</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-2">
                <MessageSquare className="w-10 h-10 opacity-40 text-blue-600" />
                <p className="font-semibold text-foreground">
                  Select a conversation to view chat history
                </p>
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
              <h3 className="font-bold text-sm text-foreground">Predefined Message Library</h3>
              <p className="text-[11px] text-muted-foreground">
                Ready-to-send response templates categorized by Sales Conversion, Lead Conversion, and Visit Conversion.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsTemplateModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-xs min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Template</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="border border-border bg-card p-4 rounded-xl space-y-2.5 shadow-xs hover:border-blue-500/50 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">{tpl.title}</span>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50">
                      {tpl.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteTemplate(tpl.id)}
                      className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition"
                      title="Delete template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground bg-muted/20 p-2.5 rounded-lg leading-relaxed">
                  &ldquo;{tpl.content}&rdquo;
                </p>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-wrap gap-1">
                    {tpl.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 bg-muted rounded font-medium text-muted-foreground"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      handleInsertTemplate(tpl.content)
                      setActiveTab("INBOX")
                    }}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
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
        <div className="border border-border bg-card p-5 rounded-2xl space-y-5 shadow-xs text-xs max-w-3xl">
          <div className="border-b border-border pb-3">
            <h3 className="font-bold text-sm text-foreground">
              AI Automation &amp; Anti-Detection Rules
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Configure human-like response behavior to keep your Facebook accounts 100% safe from Meta rate limits.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-bold text-foreground">Human-like Response Delay</label>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {settings.humanDelaySeconds} seconds
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="60"
                step="1"
                value={settings.humanDelaySeconds}
                onChange={(e) => updateHumanDelay(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <p className="text-[11px] text-muted-foreground">
                Simulates natural human typing delay before sending auto-replies in Live Facebook Messenger.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: DELIVERY AUDIT LEDGER                             */}
      {/* ======================================================== */}
      {activeTab === "LEDGER" && (
        <div className="border border-border bg-card rounded-2xl shadow-xs overflow-hidden text-xs">
          <div className="p-3.5 bg-muted/40 border-b border-border flex items-center justify-between font-bold text-foreground">
            <span>Live Messenger Delivery Logs ({conversations.length})</span>
            <span className="text-[11px] text-muted-foreground font-normal">
              Real-time Facebook Messenger &amp; Business Suite Inbox records
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
                    <span className="font-bold text-sm text-foreground">{conv.customerName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
                      {conv.pageName}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50">
                      {conv.category}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    Last Message: &ldquo;{conv.lastMessageText}&rdquo;
                  </p>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                      {conv.status === "REPLIED" ? "LIVE_DELIVERED" : "WAITING_REPLY"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {conv.lastMessageTime}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT PRODUCT FOR AI TRAINING                */}
      {/* ======================================================== */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <BrainCircuit className="w-5 h-5 text-violet-500" />
                <h3 className="font-bold text-base text-foreground">
                  {editingProductId
                    ? "Edit Product AI Training Data"
                    : "Add New Product to Train AI"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">
                    প্রোডাক্টের নাম (Product Name) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: Premium Smart Watch Ultra"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs outline-none focus:border-violet-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">
                    চেনার কীওয়ার্ড (Keywords — কমা দিয়ে)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: watch, ঘড়ি, স্মার্ট ওয়াচ, ওয়াচ"
                    value={prodKeywords}
                    onChange={(e) => setProdKeywords(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">
                    অফার প্রাইজ / বিক্রয়মূল্য *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: ২,৪৯০ টাকা"
                    value={prodOfferPrice}
                    onChange={(e) => setProdOfferPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs outline-none focus:border-violet-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">
                    রেগুলার প্রাইজ (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: ৩,৯৯০ টাকা"
                    value={prodRegularPrice}
                    onChange={(e) => setProdRegularPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs outline-none focus:border-violet-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">স্টক স্ট্যাটাস (Stock)</label>
                  <select
                    value={prodStockStatus}
                    onChange={(e) => setProdStockStatus(e.target.value as ProductStockStatus)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs outline-none focus:border-violet-500"
                  >
                    <option value="IN_STOCK">✅ In Stock (স্টকে আছে)</option>
                    <option value="LIMITED_STOCK">⚠️ Limited Stock (সীমিত স্টক)</option>
                    <option value="OUT_OF_STOCK">❌ Out of Stock (স্টক আউট)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">
                  কী কী আছে / কালার, সাইজ ও বক্সের ভেতর কী থাকবে (Variants &amp; Box Contents)
                </label>
                <textarea
                  rows={2}
                  placeholder="যেমন: কালার: ব্ল্যাক, সিলভার ও গোল্ড | বক্সে থাকছে: ১টি ওয়াচ, ২টি বেল্ট ও চার্জার"
                  value={prodVariants}
                  onChange={(e) => setProdVariants(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs outline-none focus:border-violet-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">
                  কেন প্রোডাক্টটি ভালো / মূল বৈশিষ্ট্য ও উপকারিতা (Why It&apos;s Good / Key Benefits)
                </label>
                <textarea
                  rows={2}
                  placeholder="যেমন: ১০০% ওয়াটারপ্রুফ, Super AMOLED ডিসপ্লে, ব্লুটুথ কলিং এবং ৭ দিন ব্যাটারি ব্যাকআপ"
                  value={prodWhyGood}
                  onChange={(e) => setProdWhyGood(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">
                    ওয়ারেন্টি ও গ্যারান্টি (Warranty)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: ১ বছরের অফিসিয়াল ওয়ারেন্টি"
                    value={prodWarranty}
                    onChange={(e) => setProdWarranty(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs outline-none focus:border-violet-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">
                    কোন পেজ / আইডির জন্য প্রযোজ্য? (Target Page / ID)
                  </label>
                  <select
                    value={prodAssignedChannelKey}
                    onChange={(e) => setProdAssignedChannelKey(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs outline-none focus:border-violet-500"
                  >
                    <option value="ALL">🌐 All 100+ Pages &amp; Personal IDs (সকল পেজ ও আইডি)</option>
                    {channelOptions.map((ch) => (
                      <option key={ch.key} value={ch.key}>
                        {ch.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={prodIsDefault}
                    onChange={(e) => setProdIsDefault(e.target.checked)}
                    className="rounded accent-violet-600"
                  />
                  <span>এটিকে মেইন/ডিফল্ট প্রোডাক্ট হিসেবে সেট করুন</span>
                </label>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-muted font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  Save &amp; Train Live AI Bot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD NEW FACEBOOK PAGE OR PERSONAL ID (UP TO 100+) */}
      {/* ======================================================== */}
      {isAddChannelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-base text-foreground">
                  Add Facebook Page or Personal ID
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddChannelModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewChannel} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-foreground">চ্যানেলের ধরন (Channel Type)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewChannelType("Page")}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs transition cursor-pointer ${
                      newChannelType === "Page"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-background border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Facebook Page
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewChannelType("Personal ID")}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs transition cursor-pointer ${
                      newChannelType === "Personal ID"
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-background border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Personal ID
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">
                  {newChannelType === "Page" ? "পেজের নাম (Page Name) *" : "আইডির নাম (Profile Name) *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={newChannelType === "Page" ? "যেমন: Fashion Hub BD" : "যেমন: Rasidul Islam"}
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">
                  {newChannelType === "Page"
                    ? "Numeric Page ID (যেমন: 61595136714776) *"
                    : "Profile / Account ID (যেমন: 100081643483232) *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={newChannelType === "Page" ? "61595136714776" : "100081643483232"}
                  value={newChannelId}
                  onChange={(e) => setNewChannelId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs font-mono outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">
                  আলাদা সেশন কুকি (ঐচ্ছিক — না দিলে মেইন অ্যাকাউন্টের কুকি ব্যবহার হবে)
                </label>
                <input
                  type="text"
                  placeholder="c_user=...; xs=... (অন্য আইডির ক্ষেত্রে প্রয়োজন হলে দিন)"
                  value={newChannelCookie}
                  onChange={(e) => setNewChannelCookie(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs font-mono outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddChannelModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-muted font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  Add &amp; Sync with 24/7 AI Bot
                </button>
              </div>
            </form>
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
                <Bookmark className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-base text-foreground">Create Message Template</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Template Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Return & Exchange Policy"
                  value={newTplTitle}
                  onChange={(e) => setNewTplTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition min-h-[38px]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Category Style</label>
                <select
                  value={newTplCategory}
                  onChange={(e) => setNewTplCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition min-h-[38px]"
                >
                  <option value="Sales Conversion">Sales Conversion</option>
                  <option value="Lead Conversion">Lead Conversion</option>
                  <option value="Visit Conversion">Visit Conversion</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Message Content</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Type ready response template..."
                  value={newTplContent}
                  onChange={(e) => setNewTplContent(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                />
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-muted font-semibold text-xs transition min-h-[36px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition min-h-[36px]"
                >
                  Save to Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
