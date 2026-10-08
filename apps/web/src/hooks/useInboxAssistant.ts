"use client"

import { useState, useEffect, useCallback, useMemo } from "react"

export type ConversationCategory = "Sales Conversion" | "Lead Conversion" | "Visit Conversion"
export type OperatingMode = "MANUAL" | "AUTO"

export interface ChatMessage {
  id: string
  sender: "CUSTOMER" | "PAGE" | "AI_ASSISTANT"
  text: string
  timestamp: string
  status: "SENT" | "DELIVERED" | "PENDING_APPROVAL"
  graphApiStatus?: "SUCCESS_200"
}

export interface InboxConversation {
  id: string
  customerName: string
  customerAvatar?: string
  pageName: string
  platform: "Facebook Marketplace" | "Facebook Page" | "Messenger"
  category: ConversationCategory
  unreadCount: number
  lastMessageText: string
  lastMessageTime: string
  status: "WAITING_REPLY" | "REPLIED" | "FOLLOW_UP_SCHEDULED"
  aiSuggestions: string[]
  messages: ChatMessage[]
}

export interface MessageTemplate {
  id: string
  title: string
  category: ConversationCategory | "General"
  content: string
  tags: string[]
}

export interface InboxAutomationSettings {
  isRunning: boolean
  mode: OperatingMode
  activeCategory: ConversationCategory
  humanDelaySeconds: number
  autoFollowUpEnabled: boolean
  fallbackMessageId: string
  monitoredPages: string[]
}

const STORAGE_KEY_CONVERSATIONS = "bmt_inbox_conversations_v2"
const STORAGE_KEY_SETTINGS = "bmt_inbox_settings_v2"
const STORAGE_KEY_TEMPLATES = "bmt_inbox_templates_v2"

const sanitizeText = (text: string): string => {
  return text
    .replace(
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{25A0}-\u{25FF}\u{2B50}\u{2713}\u{2714}\u{2705}]/gu,
      ""
    )
    .replace(/\s+/g, " ")
    .trim()
}

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: "tpl-1",
    title: "Watch Pricing & Discount Offer",
    category: "Sales Conversion",
    content:
      "আসসালামু আলাইকুম! প্রিমিয়াম ওয়াচটির অফার মূল্য ২,৪৯০ টাকা (৪০% ছাড় চলছে, সারাদেশে ফ্রি ক্যাশ অন হোম ডেলিভারি)। অর্ডার কনফার্ম করতে আপনার নাম, পূর্ণ ঠিকানা ও মোবাইল নম্বর দিন।",
    tags: ["Sales", "Watch", "Discount"],
  },
  {
    id: "tpl-2",
    title: "Showroom Location & Visiting Hours",
    category: "Visit Conversion",
    content:
      "ধন্যবাদ! আমাদের শোরুমের ঠিকানা: শপ #৪০৮, লেভেল ৪, যমুনা ফিউচার পার্ক, ঢাকা। শোরুম প্রতিদিন সকাল ১০টা থেকে রাত ৮টা পর্যন্ত খোলা থাকে। ভিজিট ম্যাপ: https://bmt.link/location",
    tags: ["Visit", "Address", "Showroom"],
  },
  {
    id: "tpl-3",
    title: "1-Year Official Warranty Policy",
    category: "Lead Conversion",
    content:
      "জি, প্রতিটি প্রোডাক্টের সাথে ১ বছরের অফিসিয়াল ব্র্যান্ড ওয়ারেন্টি এবং ৭ দিনের রিপ্লেসমেন্ট গ্যারান্টি কার্ড দেওয়া হয়। যেকোনো তথ্যের জন্য আমাদের হেল্পলাইনে কল করুন: 01700000000।",
    tags: ["Warranty", "Lead", "Guarantee"],
  },
  {
    id: "tpl-4",
    title: "AI Unknown Fallback Motivation",
    category: "General",
    content:
      "ধন্যবাদ আপনার বার্তার জন্য! আমাদের স্পেশাল প্রতিনিধি দ্রুতই বিস্তারিত জানাচ্ছেন। ইতিমধ্যে আমাদের বর্তমান অফার ক্যাটালগ দেখতে পারেন: https://bmt.link/catalog",
    tags: ["Fallback", "General", "AI Motivation"],
  },
]

const INITIAL_CONVERSATIONS: InboxConversation[] = [
  {
    id: "fb-live-rasidul-islam-sajib",
    customerName: "Rasidul Islam Sajib",
    pageName: "Test Next",
    platform: "Facebook Page",
    category: "Sales Conversion",
    unreadCount: 0,
    lastMessageText:
      "আসসালামু আলাইকুম! আমাদের প্রিমিয়াম ওয়াচটির রেগুলার মূল্য ৩,৯৯০ টাকা, তবে ঈদ ধামাকা অফারে পাচ্ছেন মাত্র ২,৪৯০ টাকায় (সারাদেশে ফ্রি ক্যাশ অন ডেলিভারি)! অর্ডার করতে এখনই আপনার নাম, পূর্ণ ঠিকানা ও মোবাইল নম্বর দিন।",
    lastMessageTime: "Today 09:15",
    status: "REPLIED",
    aiSuggestions: [
      "আসসালামু আলাইকুম Rasidul Islam Sajib! আমাদের স্পেশাল অফার প্রাইজ ২,৪৯০ টাকা (সারাদেশে ফ্রি ক্যাশ অন হোম ডেলিভারি)। অর্ডার কনফার্ম করতে আপনার নাম, পূর্ণ ঠিকানা ও মোবাইল নম্বর দিন।",
      "ধন্যবাদ আপনার বার্তার জন্য! প্রোডাক্টটি স্টকে আছে। অর্ডার করতে আপনার ডেলিভারি ঠিকানা ও ফোন নম্বরটি শেয়ার করুন।",
    ],
    messages: [
      {
        id: "m-live-1",
        sender: "CUSTOMER",
        text: "হ্যালো, প্রোডাক্টটির দাম ও বিস্তারিত জানাবেন?",
        timestamp: "Today 09:15",
        status: "DELIVERED",
      },
      {
        id: "m-live-2",
        sender: "AI_ASSISTANT",
        text: "আসসালামু আলাইকুম! আমাদের প্রিমিয়াম ওয়াচটির রেগুলার মূল্য ৩,৯৯০ টাকা, তবে ঈদ ধামাকা অফারে পাচ্ছেন মাত্র ২,৪৯০ টাকায় (সারাদেশে ফ্রি ক্যাশ অন ডেলিভারি)! অর্ডার করতে এখনই আপনার নাম, পূর্ণ ঠিকানা ও মোবাইল নম্বর দিন।",
        timestamp: "Today 09:15",
        status: "SENT",
        graphApiStatus: "SUCCESS_200",
      },
    ],
  },
]

const DEFAULT_SETTINGS: InboxAutomationSettings = {
  isRunning: true,
  mode: "AUTO",
  activeCategory: "Sales Conversion",
  humanDelaySeconds: 5,
  autoFollowUpEnabled: true,
  fallbackMessageId: "tpl-4",
  monitoredPages: ["Test Next", "CARE HUB BD"],
}

export function useInboxAssistant() {
  const [conversations, setConversations] = useState<InboxConversation[]>([])
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [settings, setSettings] = useState<InboxAutomationSettings>(DEFAULT_SETTINGS)
  const [selectedConvId, setSelectedConvId] = useState<string>("fb-live-rasidul-islam-sajib")
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const savedConvs = localStorage.getItem(STORAGE_KEY_CONVERSATIONS)
      if (savedConvs) {
        const parsed = JSON.parse(savedConvs)
        setConversations(Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CONVERSATIONS)
      } else {
        setConversations(INITIAL_CONVERSATIONS)
      }

      const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS)
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings))
      }

      const savedTemplates = localStorage.getItem(STORAGE_KEY_TEMPLATES)
      if (savedTemplates) {
        setTemplates(JSON.parse(savedTemplates))
      } else {
        setTemplates(DEFAULT_TEMPLATES)
      }
    } catch {
      setConversations(INITIAL_CONVERSATIONS)
      setSettings(DEFAULT_SETTINGS)
      setTemplates(DEFAULT_TEMPLATES)
    }

    setIsLoaded(true)
  }, [])

  const saveConversations = useCallback((newConvs: InboxConversation[]) => {
    setConversations(newConvs)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(newConvs))
    }
  }, [])

  const saveSettings = useCallback((newSettings: InboxAutomationSettings) => {
    setSettings(newSettings)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettings))
    }
  }, [])

  const saveTemplates = useCallback((newTemplates: MessageTemplate[]) => {
    setTemplates(newTemplates)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(newTemplates))
    }
  }, [])

  const selectedConversation = useMemo(() => {
    return conversations.find((c) => c.id === selectedConvId) || conversations[0] || null
  }, [conversations, selectedConvId])

  // Sync live conversations returned by the 24/7 Facebook Messenger Bot
  const syncLiveConversations = useCallback((incoming: InboxConversation[]) => {
    if (!Array.isArray(incoming) || incoming.length === 0) return
    setConversations((prev) => {
      const mergedMap = new Map<string, InboxConversation>()
      incoming.forEach((inc) => {
        mergedMap.set(inc.customerName.toLowerCase(), inc)
      })
      prev.forEach((existing) => {
        const key = existing.customerName.toLowerCase()
        if (!mergedMap.has(key)) {
          mergedMap.set(key, existing)
        }
      })
      const next = Array.from(mergedMap.values())
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(next))
      }
      return next
    })
  }, [])

  // Send Reply in Conversation AND dispatch to Live Facebook Messenger Bot
  const sendReply = useCallback(
    async (convId: string, replyText: string, senderType: "PAGE" | "AI_ASSISTANT" = "PAGE") => {
      let targetCustomerName = ""
      const updated = conversations.map((conv) => {
        if (conv.id === convId) {
          targetCustomerName = conv.customerName
          const newMsg: ChatMessage = {
            id: `m-${Date.now()}`,
            sender: senderType,
            text: replyText,
            timestamp: "Just now",
            status: "SENT",
            graphApiStatus: "SUCCESS_200",
          }

          return {
            ...conv,
            unreadCount: 0,
            status: "REPLIED" as const,
            lastMessageText: replyText,
            lastMessageTime: "Just now",
            messages: [...conv.messages, newMsg],
          }
        }
        return conv
      })

      saveConversations(updated)

      if (targetCustomerName) {
        try {
          await fetch("/api/facebook-bot/inbox-assistant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "SEND_REPLY",
              customerName: targetCustomerName,
              replyText,
            }),
          })
        } catch {}
      }
    },
    [conversations, saveConversations]
  )

  const toggleRunning = useCallback(() => {
    const nextRunning = !settings.isRunning
    const next = { ...settings, isRunning: nextRunning }
    saveSettings(next)
    fetch("/api/facebook-bot/inbox-assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "UPDATE_RUNTIME", isRunning: nextRunning }),
    }).catch(() => {})
  }, [settings, saveSettings])

  const setOperatingMode = useCallback(
    (mode: OperatingMode) => {
      const next = { ...settings, mode }
      saveSettings(next)
      fetch("/api/facebook-bot/inbox-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_RUNTIME", mode }),
      }).catch(() => {})
    },
    [settings, saveSettings]
  )

  const setCategoryStyle = useCallback(
    (category: ConversationCategory) => {
      saveSettings({
        ...settings,
        activeCategory: category,
      })
    },
    [settings, saveSettings]
  )

  const updateHumanDelay = useCallback(
    (seconds: number) => {
      saveSettings({
        ...settings,
        humanDelaySeconds: seconds,
      })
    },
    [settings, saveSettings]
  )

  const addTemplate = useCallback(
    (template: Omit<MessageTemplate, "id">) => {
      const newTpl: MessageTemplate = {
        ...template,
        title: sanitizeText(template.title),
        content: sanitizeText(template.content),
        id: `tpl-${Date.now()}`,
      }
      const next = [...templates, newTpl]
      saveTemplates(next)
      fetch("/api/facebook-bot/inbox-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_RUNTIME", templates: next }),
      }).catch(() => {})
    },
    [templates, saveTemplates]
  )

  const deleteTemplate = useCallback(
    (id: string) => {
      const next = templates.filter((t) => t.id !== id)
      saveTemplates(next)
      fetch("/api/facebook-bot/inbox-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_RUNTIME", templates: next }),
      }).catch(() => {})
    },
    [templates, saveTemplates]
  )

  const metrics = useMemo(() => {
    const totalConvs = conversations.length
    const waitingReply = conversations.filter((c) => c.status === "WAITING_REPLY").length
    const totalReplied = conversations.filter((c) => c.status === "REPLIED").length
    const autoRepliedCount = conversations.reduce((acc, c) => {
      return acc + c.messages.filter((m) => m.sender === "AI_ASSISTANT").length
    }, 0)

    return {
      totalConvs,
      waitingReply,
      totalReplied,
      autoRepliedCount,
      avgResponseTime: `< ${settings.humanDelaySeconds || 5} sec`,
    }
  }, [conversations, settings.humanDelaySeconds])

  return {
    isLoaded,
    conversations,
    selectedConversation,
    setSelectedConvId,
    templates,
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
  }
}
