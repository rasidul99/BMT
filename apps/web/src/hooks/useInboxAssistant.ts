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

const STORAGE_KEY_CONVERSATIONS = "bmt_inbox_conversations"
const STORAGE_KEY_SETTINGS = "bmt_inbox_settings"
const STORAGE_KEY_TEMPLATES = "bmt_inbox_templates"

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: "tpl-1",
    title: "Watch Pricing & Discount Offer",
    category: "Sales Conversion",
    content: "আসসালামু আলাইকুম স্যার! প্রিমিয়াম ওয়াচটির অফার মূল্য ২,৪৯০ টাকা (৪০% ছাড় চলছে)। ফ্রি হোম ডেলিভারি পেতে আপনার নাম, ঠিকানা ও ফোন নম্বর দিন।",
    tags: ["Sales", "Watch", "Discount"],
  },
  {
    id: "tpl-2",
    title: "Showroom Location & Visiting Hours",
    category: "Visit Conversion",
    content: "ধন্যবাদ! আমাদের শোরুমের ঠিকানা: শপ #৪০৮, লেভেল ৪, যমুনা ফিউচার পার্ক, ঢাকা। শোরুম প্রতিদিন সকাল ১০টা থেকে রাত ৮টা পর্যন্ত খোলা থাকে। ভিজিট ম্যাপ: https://bmt.link/location",
    tags: ["Visit", "Address", "Showroom"],
  },
  {
    id: "tpl-3",
    title: "1-Year Official Warranty Policy",
    category: "Lead Conversion",
    content: "জি স্যার, প্রতিটি প্রোডাক্টের সাথে ১ বছরের অফিসিয়াল ব্র্যান্ড ওয়ারেন্টি এবং রিপ্লেসমেন্ট গ্যারান্টি কার্ড দেওয়া হয়। যেকোনো তথ্যের জন্য আমাদের হেল্পলাইনে কল করুন: 01700000000।",
    tags: ["Warranty", "Lead", "Guarantee"],
  },
  {
    id: "tpl-4",
    title: "AI Unknown Fallback Motivation",
    category: "General",
    content: "ধন্যবাদ আপনার বার্তার জন্য! আমাদের স্পেশাল কনসালটেন্ট দ্রুতই বিস্তারিত জানাচ্ছে। ইতিমধ্যে আমাদের বর্তমান অফার ক্যাটালগ দেখতে পারেন: https://bmt.link/catalog",
    tags: ["Fallback", "General", "AI Motivation"],
  },
]

const INITIAL_CONVERSATIONS: InboxConversation[] = [
  {
    id: "conv-1",
    customerName: "Kamrul Islam",
    pageName: "Fashion Hub Official",
    platform: "Facebook Marketplace",
    category: "Sales Conversion",
    unreadCount: 1,
    lastMessageText: "আমি ওয়াচটা নিতে চাই। কত টাকা লাগবে আর ডেলিভারি চার্জ কত?",
    lastMessageTime: "2 mins ago",
    status: "WAITING_REPLY",
    aiSuggestions: [
      "আসসালামু আলাইকুম কামরুল স্যার! প্রিমিয়াম ওয়াচটির স্পেশাল অফার প্রাইজ ২,৪৯০ টাকা এবং সারা বাংলাদেশে ক্যাশ অন হোম ডেলিভারি একদম ফ্রি! অর্ডার করতে আপনার ডেলিভারি ঠিকানা ও মোবাইল নম্বর দিন।",
      "ধন্যবাদ আপনার আগ্রহের জন্য! বর্তমান স্টক সীমিত, দ্রুত অর্ডার কনফার্ম করলে পাচ্ছেন ফ্রি লেদার বেল্ট গিফট। অর্ডার প্লেস করতে ভিজিট করুন: https://bmt.link/eid-watch-sale",
    ],
    messages: [
      {
        id: "m-101",
        sender: "CUSTOMER",
        text: "আমি ওয়াচটা নিতে চাই। কত টাকা লাগবে আর ডেলিভারি চার্জ কত?",
        timestamp: "2 mins ago",
        status: "DELIVERED",
      },
    ],
  },
  {
    id: "conv-2",
    customerName: "Sharmin Sultana",
    pageName: "Tech Gadgets BD",
    platform: "Facebook Page",
    category: "Visit Conversion",
    unreadCount: 1,
    lastMessageText: "আপনাদের শোরুমের লোকেশন কোথায়? সরাসরি দেখে কেনা যাবে?",
    lastMessageTime: "12 mins ago",
    status: "WAITING_REPLY",
    aiSuggestions: [
      "ধন্যবাদ শারমিন আপু! আমাদের শোরুমের ঠিকানা: লেভেল ৪, যমুনা ফিউচার পার্ক, ঢাকা। আপনি সরাসরি এসে প্রোডাক্ট দেখে ও ট্রায়াল দিয়ে নিতে পারবেন। শোরুম ম্যাপ লিংক: https://bmt.link/location",
      "জি আপু অবশ্যই! যমুনা ফিউচার পার্ক ছাড়াও আমাদের ধানমন্ডি আউটলেটে কালেকশনটি পেয়ে যাবেন। ভিজিট আওয়ার: সকাল ১০টা - রাত ৮টা।",
    ],
    messages: [
      {
        id: "m-102",
        sender: "CUSTOMER",
        text: "আপনাদের শোরুমের লোকেশন কোথায়? সরাসরি দেখে কেনা যাবে?",
        timestamp: "12 mins ago",
        status: "DELIVERED",
      },
    ],
  },
  {
    id: "conv-3",
    customerName: "Rahim Chowdhury",
    pageName: "Tech Gadgets BD",
    platform: "Facebook Marketplace",
    category: "Lead Conversion",
    unreadCount: 0,
    lastMessageText: "প্রোডাক্টের সাথে কি অফিসিয়াল ওয়ারেন্টি থাকবে?",
    lastMessageTime: "25 mins ago",
    status: "REPLIED",
    aiSuggestions: [
      "জি রহিম স্যার, আমাদের প্রতিটি গ্যাজেটের সাথে পাচ্ছেন ১ বছরের ব্র্যান্ড ওয়ারেন্টি কার্ড।",
    ],
    messages: [
      {
        id: "m-103",
        sender: "CUSTOMER",
        text: "প্রোডাক্টের সাথে কি অফিসিয়াল ওয়ারেন্টি থাকবে?",
        timestamp: "28 mins ago",
        status: "DELIVERED",
      },
      {
        id: "m-104",
        sender: "PAGE",
        text: "জি রহিম স্যার, আমাদের প্রতিটি গ্যাজেটের সাথে পাচ্ছেন ১ বছরের ব্র্যান্ড ওয়ারেন্টি কার্ড এবং ৭ দিনের ইনস্ট্যান্ট রিপ্লেসমেন্ট গ্যারান্টি।",
        timestamp: "25 mins ago",
        status: "SENT",
        graphApiStatus: "SUCCESS_200",
      },
    ],
  },
  {
    id: "conv-4",
    customerName: "Nusrat Jahan",
    pageName: "Organic Foods Bangladesh",
    platform: "Facebook Page",
    category: "Sales Conversion",
    unreadCount: 1,
    lastMessageText: "সুন্দরবনের খাঁটি মধু কি ১ কেজির জার আছে?",
    lastMessageTime: "40 mins ago",
    status: "WAITING_REPLY",
    aiSuggestions: [
      "আসসালামু আলাইকুম নুসরাত আপু! জি, আমাদের ১ কেজি প্রিমিয়াম কাঁচাফুল সুন্দরবন মধুর জার এভেইলেবল আছে। অফার মূল্য মাত্র ৯৫০ টাকা। ডেলিভারি কনফার্ম করতে এড্রেসটি শেয়ার করুন।",
      "জি আপু ১ কেজি ও ৫০০ গ্রামের দুটি সাইজেই আছে। ল্যাব টেস্ট রিপোর্ট সহ ১০০% খাঁটি মধুর গ্যারান্টি। অর্ডার লিংক: https://bmt.link/honey",
    ],
    messages: [
      {
        id: "m-105",
        sender: "CUSTOMER",
        text: "সুন্দরবনের খাঁটি মধু কি ১ কেজির জার আছে?",
        timestamp: "40 mins ago",
        status: "DELIVERED",
      },
    ],
  },
]

const DEFAULT_SETTINGS: InboxAutomationSettings = {
  isRunning: true,
  mode: "MANUAL",
  activeCategory: "Sales Conversion",
  humanDelaySeconds: 45,
  autoFollowUpEnabled: true,
  fallbackMessageId: "tpl-4",
  monitoredPages: [
    "Fashion Hub Official",
    "Tech Gadgets BD",
    "Organic Foods Bangladesh",
  ],
}

export function useInboxAssistant() {
  const [conversations, setConversations] = useState<InboxConversation[]>([])
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [settings, setSettings] = useState<InboxAutomationSettings>(DEFAULT_SETTINGS)
  const [selectedConvId, setSelectedConvId] = useState<string>("conv-1")
  const [isLoaded, setIsLoaded] = useState(false)

  // Initialize from LocalStorage
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const savedConvs = localStorage.getItem(STORAGE_KEY_CONVERSATIONS)
      setConversations(savedConvs ? JSON.parse(savedConvs) : INITIAL_CONVERSATIONS)

      const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS)
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings))
      }

      const savedTemplates = localStorage.getItem(STORAGE_KEY_TEMPLATES)
      setTemplates(savedTemplates ? JSON.parse(savedTemplates) : DEFAULT_TEMPLATES)
    } catch {
      setConversations(INITIAL_CONVERSATIONS)
      setSettings(DEFAULT_SETTINGS)
      setTemplates(DEFAULT_TEMPLATES)
    }

    setIsLoaded(true)
  }, [])

  // Save Conversations
  const saveConversations = useCallback((newConvs: InboxConversation[]) => {
    setConversations(newConvs)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(newConvs))
    }
  }, [])

  // Save Settings
  const saveSettings = useCallback((newSettings: InboxAutomationSettings) => {
    setSettings(newSettings)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettings))
    }
  }, [])

  // Save Templates
  const saveTemplates = useCallback((newTemplates: MessageTemplate[]) => {
    setTemplates(newTemplates)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(newTemplates))
    }
  }, [])

  // Active Selected Conversation
  const selectedConversation = useMemo(() => {
    return conversations.find((c) => c.id === selectedConvId) || conversations[0] || null
  }, [conversations, selectedConvId])

  // Send Reply in Conversation
  const sendReply = useCallback(
    (convId: string, replyText: string, senderType: "PAGE" | "AI_ASSISTANT" = "PAGE") => {
      const updated = conversations.map((conv) => {
        if (conv.id === convId) {
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
    },
    [conversations, saveConversations]
  )

  // Toggle Automation Running State
  const toggleRunning = useCallback(() => {
    saveSettings({
      ...settings,
      isRunning: !settings.isRunning,
    })
  }, [settings, saveSettings])

  // Change Operating Mode (MANUAL vs AUTO)
  const setOperatingMode = useCallback(
    (mode: OperatingMode) => {
      saveSettings({
        ...settings,
        mode,
      })
    },
    [settings, saveSettings]
  )

  // Change Conversation Category Style
  const setCategoryStyle = useCallback(
    (category: ConversationCategory) => {
      saveSettings({
        ...settings,
        activeCategory: category,
      })
    },
    [settings, saveSettings]
  )

  // Add Custom Template
  const addTemplate = useCallback(
    (template: Omit<MessageTemplate, "id">) => {
      const newTpl: MessageTemplate = {
        ...template,
        id: `tpl-${Date.now()}`,
      }
      saveTemplates([...templates, newTpl])
    },
    [templates, saveTemplates]
  )

  // Delete Template
  const deleteTemplate = useCallback(
    (id: string) => {
      saveTemplates(templates.filter((t) => t.id !== id))
    },
    [templates, saveTemplates]
  )

  // Simulate Incoming Message Live
  const simulateIncomingMessage = useCallback(
    (customerName: string, messageText: string, pageName: string, category: ConversationCategory) => {
      // Determine AI Suggestions based on Category
      let suggestions: string[] = []
      if (category === "Sales Conversion") {
        suggestions = [
          `আসসালামু আলাইকুম ${customerName}! পণ্যটির বর্তমান অফার মূল্য ২,৪৯০ টাকা (সীমিত স্টক)। ফ্রি ডেলিভারি পেতে নাম ও নম্বর দিন।`,
          `ধন্যবাদ! আজই অর্ডার কনফার্ম করলে পাচ্ছেন বিশেষ ছাড় ও ক্যাশ অন ডেলিভারি। অর্ডার লিঙ্ক: https://bmt.link/shop`,
        ]
      } else if (category === "Visit Conversion") {
        suggestions = [
          `ধন্যবাদ ${customerName}! আমাদের শোরুম: লেভেল ৪, যমুনা ফিউচার পার্ক, ঢাকা। ভিজিট ম্যাপ: https://bmt.link/location`,
          `জি আমাদের শোরুমে এসে দেখে কিনতে পারবেন। সকাল ১০টা থেকে রাত ৮টা পর্যন্ত খোলা।`,
        ]
      } else {
        suggestions = [
          `জি ${customerName}, আমাদের প্রতিটি পণ্যের সাথে ১ বছরের অফিসিয়াল ব্র্যান্ড ওয়ারেন্টি কার্ড দেওয়া হয়।`,
          `ধন্যবাদ আপনার কোয়েরির জন্য। আমাদের সাপোর্ট হেল্পলাইন: 01700000000।`,
        ]
      }

      const newId = `conv-${Date.now()}`
      const newConv: InboxConversation = {
        id: newId,
        customerName,
        pageName,
        platform: "Facebook Marketplace",
        category,
        unreadCount: 1,
        lastMessageText: messageText,
        lastMessageTime: "Just now",
        status: settings.mode === "AUTO" && settings.isRunning ? "REPLIED" : "WAITING_REPLY",
        aiSuggestions: suggestions,
        messages: [
          {
            id: `m-${Date.now()}`,
            sender: "CUSTOMER",
            text: messageText,
            timestamp: "Just now",
            status: "DELIVERED",
          },
        ],
      }

      // If Auto Mode is ON and Running, simulate automated AI reply after delay
      if (settings.mode === "AUTO" && settings.isRunning) {
        newConv.messages.push({
          id: `m-${Date.now() + 1}`,
          sender: "AI_ASSISTANT",
          text: suggestions[0],
          timestamp: "Just now (Auto Sent)",
          status: "SENT",
          graphApiStatus: "SUCCESS_200",
        })
        newConv.lastMessageText = suggestions[0]
        newConv.unreadCount = 0
      }

      saveConversations([newConv, ...conversations])
      setSelectedConvId(newId)
    },
    [conversations, settings, saveConversations]
  )

  // Metrics
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
      avgResponseTime: "< 45 sec",
    }
  }, [conversations])

  return {
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
  }
}
