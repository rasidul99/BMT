"use client"

import { useState, useEffect, useCallback } from "react"

export interface CommentItem {
  id: string
  commentId: string
  postId: string
  postTitle: string
  pageName: string
  userName: string
  userAvatar?: string
  userComment: string
  intent: "Price Query" | "Delivery Query" | "Stock Query" | "Warranty Query" | "Location Query" | "General Greeting"
  receivedAt: string
  status: "Pending" | "Replied" | "Ignored"
  publicReply?: string
  privateInboxMessage?: string
  repliedAt?: string
  suggestions: string[]
}

export interface CommentLibraryTemplate {
  id: string
  category: "Price Query" | "Delivery Query" | "Stock Query" | "Warranty Query" | "Location Query" | "General Greeting"
  title: string
  publicReply: string
  privateInboxReply: string
  keywords: string[]
  usesCount: number
  createdAt: string
}

export interface CommentReplyLog {
  id: string
  commentId: string
  customerName: string
  postTitle: string
  pageName: string
  customerQuery: string
  publicReply: string
  privateInboxReply?: string
  status: "Success" | "Failed"
  graphApiResponse: string
  timestamp: string
}

const STORAGE_KEY_COMMENTS = "bmt_webhook_comments"
const STORAGE_KEY_LIBRARY = "bmt_comment_library"
const STORAGE_KEY_LOGS = "bmt_comment_reply_logs"

const sanitizeText = (text: string): string => {
  return text
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
}

export const DEFAULT_LIBRARY_TEMPLATES: CommentLibraryTemplate[] = [
  {
    id: "tmpl-price-1",
    category: "Price Query",
    title: "Standard Eid Discount Price & Inbox Trigger",
    publicReply: "ধন্যবাদ ভাইয়া! প্রিমিয়াম কালেকশনের স্পেশাল অফার প্রাইজ ইনবক্সে পাঠানো হয়েছে। দয়া করে ইনবক্স চেক করুন।",
    privateInboxReply: "আসসালামু আলাইকুম! আমাদের প্রিমিয়াম ওয়াচটির রেগুলার মূল্য ৩,৯৯০ টাকা, তবে ঈদ ধামাকা অফারে পাচ্ছেন মাত্র ২,৪৯০ টাকায় (সারাদেশে ফ্রি ক্যাশ অন ডেলিভারি)! অর্ডার করতে এখনই আপনার নাম, পূর্ণ ঠিকানা ও মোবাইল নম্বর দিন।",
    keywords: ["দাম", "price", "কত", "taka", "টাকা", "cost", "দাম কত"],
    usesCount: 184,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tmpl-del-2",
    category: "Delivery Query",
    title: "Nationwide Cash on Delivery Assurance",
    publicReply: "জি ভাইয়া, আমরা সারাদেশে ক্যাশ অন ডেলিভারি দিচ্ছি। ডেলিভারি সংক্রান্ত বিস্তারিত তথ্য ইনবক্সে চেক করুন।",
    privateInboxReply: "জি সম্মানিত গ্রাহক! ঢাকা সিটিতে ২৪ ঘণ্টার মধ্যে এবং ঢাকার বাইরে ৪৮ ঘণ্টার মধ্যে ক্যাশ অন ডেলিভারি পাবেন। ডেলিভারি ম্যানের সামনে প্রোডাক্ট দেখে চেক করে মূল্য পরিশোধ করতে পারবেন।",
    keywords: ["ডেলিভারি", "delivery", "home delivery", "ক্যাশ অন", "ঢাকার বাইরে", "চার্জ"],
    usesCount: 142,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tmpl-stock-3",
    category: "Stock Query",
    title: "Limited Stock & Booking Urgency",
    publicReply: "প্রোডাক্টটির সীমিত স্টক এভেইলেবল আছে ভাইয়া! স্টক শেষ হওয়ার আগেই বুকিং করতে ইনবক্স চেক করুন।",
    privateInboxReply: "জি প্রোডাক্টটি এই মুহূর্তে আমাদের স্টকে আছে, তবে মাত্র ১২টি পিস অবশিষ্ট রয়েছে। আপনি চাইলে এখনই আপনার বুকিং কনফার্ম করতে পারেন। ধন্যবাদ!",
    keywords: ["স্টক", "stock", "available", "আছে কি", "কালার", "color"],
    usesCount: 96,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tmpl-war-4",
    category: "Warranty Query",
    title: "Official Brand Replacement Guarantee",
    publicReply: "জি সম্মানিত কাস্টমার, প্রতিটি প্রডাক্টে পাচ্ছেন ১ বছরের অফিসিয়াল রিপ্লেসমেন্ট ওয়ারেন্টি! বিস্তারিত ইনবক্সে দেওয়া হলো।",
    privateInboxReply: "আমাদের প্রতিটি অথেনটিক প্রডাক্টের সাথে পাবেন অফিসিয়াল ১ বছরের রিপ্লেসমেন্ট কার্ড। যেকোনো সমস্যায় ৭ দিনের মধ্যে ফ্রি এক্সচেঞ্জ সুবিধা রয়েছে।",
    keywords: ["ওয়ারেন্টি", "warranty", "গ্যারান্টি", "guarantee", "নষ্ট হলে"],
    usesCount: 78,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tmpl-loc-5",
    category: "Location Query",
    title: "Showroom Address & Direct Order Link",
    publicReply: "আমাদের ঢাকা শোরুমের পূর্ণ ঠিকানা ও গুগল ম্যাপ লিংক ইনবক্সে পাঠানো হয়েছে ভাইয়া।",
    privateInboxReply: "আমাদের হেড অফিস ও আউটলেট: শপ #৪০৮, লেভেল ৪, যমুনা ফিউচার পার্ক, কুড়িল, ঢাকা। অনলাইনে অর্ডার করতে ভিজিট করুন: https://bmt.link/store",
    keywords: ["ঠিকানা", "location", "দোকান", "শোরুম", "কোথায়", "address"],
    usesCount: 52,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tmpl-gen-6",
    category: "General Greeting",
    title: "Friendly Welcome & Assistant Introduction",
    publicReply: "আসসালামু আলাইকুম! বিস্তারিত তথ্য আপনার ইনবক্সে মেসেজ করা হয়েছে, দয়া করে মেসেঞ্জার চেক করুন।",
    privateInboxReply: "স্বাগতম! আপনি আমাদের পণ্যটি সম্পর্কে জানতে চাওয়ায় ধন্যবাদ। যেকোনো তথ্য বা অর্ডারের জন্য আমাদের জানাতে পারেন, আমরা তাৎক্ষণিক সহায়তা করছি।",
    keywords: ["hi", "hello", "হাই", "হ্যালো", "details", "info", "জানতে চাই"],
    usesCount: 110,
    createdAt: new Date().toISOString(),
  },
]

export const DEFAULT_WEBHOOK_COMMENTS: CommentItem[] = [
  {
    id: "cm-101",
    commentId: "cmt_98234123_4021",
    postId: "post_892168940637389_1020304050",
    postTitle: "Eid Special Premium Watch Collection Offer 2026",
    pageName: "CARE HUB BD",
    userName: "Tanvir Ahmed",
    userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    userComment: "দাম কত ভাইয়া? ঢাকার বাইরে ডেলিভারি চার্জ কত পরবে?",
    intent: "Price Query",
    receivedAt: "1 min ago (Webhook Detected)",
    status: "Pending",
    suggestions: [
      "ধন্যবাদ ভাইয়া! প্রিমিয়াম কালেকশনের স্পেশাল অফার প্রাইজ ইনবক্সে পাঠানো হয়েছে। দয়া করে ইনবক্স চেক করুন।",
      "আসসালামু আলাইকুম! ওয়াচটির প্রাইজ মাত্র ২,৪৯০ টাকা (সারাদেশে ফ্রি ডেলিভারি)। ইনবক্স চেক করুন ভাইয়া।",
      "ভাইয়া ওয়াচটির দাম ২,৪৯০ টাকা। আপনার ঠিকানা ও ফোন নম্বর ইনবক্সে পাঠিয়ে অর্ডার কনফার্ম করুন।",
    ],
  },
  {
    id: "cm-102",
    commentId: "cmt_87123982_5032",
    postId: "post_892168940637389_1020304050",
    pageName: "CARE HUB BD",
    userName: "Nusrat Jahan",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    userComment: "ঢাকার বাইরে কি ক্যাশ অন ডেলিভারি হবে? প্রোডাক্ট হাতে পাওয়ার পর টাকা দিতে পারব?",
    intent: "Delivery Query",
    receivedAt: "4 mins ago (Webhook Detected)",
    status: "Pending",
    suggestions: [
      "জি আপু, আমরা পুরো বাংলাদেশে ক্যাশ অন ডেলিভারিতে প্রোডাক্ট পাঠিয়ে থাকি। অর্ডার করতে ইনবক্স চেক করুন।",
      "হ্যাঁ আপু! প্রোডাক্ট হাতে পেয়ে দেখে মূল্য পরিশোধ করতে পারবেন। বিস্তারিত তথ্য ইনবক্সে মেসেজ করা হয়েছে।",
    ],
  },
  {
    id: "cm-103",
    commentId: "cmt_76123491_6043",
    postId: "post_892168940637389_1020304050",
    pageName: "CARE HUB BD",
    userName: "Mahfuzur Rahman",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    userComment: "ব্ল্যাক কালারটা কি স্টকে এভেইলেবল আছে? সাথে কোনো ওয়ারেন্টি থাকবে?",
    intent: "Stock Query",
    receivedAt: "12 mins ago (Webhook Detected)",
    status: "Pending",
    suggestions: [
      "জি ভাইয়া, ব্ল্যাক কালার এভেইলেবল আছে এবং ১ বছরের অফিসিয়াল ব্র্যান্ড ওয়ারেন্টি রয়েছে! বিস্তারিত ইনবক্সে দেওয়া হলো।",
      "প্রোডাক্টটির ব্ল্যাক কালার স্টকে আছে। সীমিত স্টক, দ্রুত ইনবক্স চেক করে বুকিং কনফার্ম করুন।",
    ],
  },
]

export const INITIAL_REPLY_LOGS: CommentReplyLog[] = [
  {
    id: "log-rep-1",
    commentId: "cmt_98234123_4021",
    customerName: "Sajid Hasan",
    postTitle: "Eid Special Premium Watch Collection Offer 2026",
    pageName: "CARE HUB BD",
    customerQuery: "দাম কত?",
    publicReply: "ধন্যবাদ ভাইয়া! প্রিমিয়াম কালেকশনের স্পেশাল অফার প্রাইজ ইনবক্সে পাঠানো হয়েছে।",
    privateInboxReply: "আসসালামু আলাইকুম! ওয়াচটির প্রাইজ মাত্র ২,৪৯০ টাকা (সারাদেশে ফ্রি ডেলিভারি)।",
    status: "Success",
    graphApiResponse: "HTTP 200 OK — CommentReplyId: 1020304050_991, MsgId: m_mid_9921",
    timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
]

export function useCommentAssistant() {
  const [comments, setComments] = useState<CommentItem[]>([])
  const [library, setLibrary] = useState<CommentLibraryTemplate[]>([])
  const [logs, setLogs] = useState<CommentReplyLog[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage
  useEffect(() => {
    try {
      const storedComments = localStorage.getItem(STORAGE_KEY_COMMENTS)
      if (storedComments) {
        const parsed = JSON.parse(storedComments) as CommentItem[]
        const sanitized = parsed.map((c) => ({
          ...c,
          publicReply: c.publicReply ? sanitizeText(c.publicReply) : undefined,
          privateInboxMessage: c.privateInboxMessage ? sanitizeText(c.privateInboxMessage) : undefined,
          suggestions: (c.suggestions || []).map(sanitizeText),
        }))
        setComments(sanitized)
        localStorage.setItem(STORAGE_KEY_COMMENTS, JSON.stringify(sanitized))
      } else {
        setComments(DEFAULT_WEBHOOK_COMMENTS)
        localStorage.setItem(STORAGE_KEY_COMMENTS, JSON.stringify(DEFAULT_WEBHOOK_COMMENTS))
      }

      const storedLib = localStorage.getItem(STORAGE_KEY_LIBRARY)
      if (storedLib) {
        const parsed = JSON.parse(storedLib) as CommentLibraryTemplate[]
        const sanitized = parsed.map((t) => ({
          ...t,
          publicReply: sanitizeText(t.publicReply),
          privateInboxReply: sanitizeText(t.privateInboxReply),
        }))
        setLibrary(sanitized)
        localStorage.setItem(STORAGE_KEY_LIBRARY, JSON.stringify(sanitized))
      } else {
        setLibrary(DEFAULT_LIBRARY_TEMPLATES)
        localStorage.setItem(STORAGE_KEY_LIBRARY, JSON.stringify(DEFAULT_LIBRARY_TEMPLATES))
      }

      const storedLogs = localStorage.getItem(STORAGE_KEY_LOGS)
      if (storedLogs) {
        const parsed = JSON.parse(storedLogs) as CommentReplyLog[]
        const sanitized = parsed.map((l) => ({
          ...l,
          publicReply: sanitizeText(l.publicReply),
          privateInboxReply: l.privateInboxReply ? sanitizeText(l.privateInboxReply) : undefined,
        }))
        setLogs(sanitized)
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(sanitized))
      } else {
        setLogs(INITIAL_REPLY_LOGS)
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(INITIAL_REPLY_LOGS))
      }
    } catch (e) {
      console.error("Error loading comment assistant data", e)
      setComments(DEFAULT_WEBHOOK_COMMENTS)
      setLibrary(DEFAULT_LIBRARY_TEMPLATES)
      setLogs(INITIAL_REPLY_LOGS)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Functional Persistence Helpers
  const saveComments = useCallback(
    (updater: CommentItem[] | ((prev: CommentItem[]) => CommentItem[])) => {
      setComments((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater
        try {
          localStorage.setItem(STORAGE_KEY_COMMENTS, JSON.stringify(next))
        } catch (e) {
          console.error("Failed to save comments", e)
        }
        return next
      })
    },
    []
  )

  const saveLibrary = useCallback(
    (updater: CommentLibraryTemplate[] | ((prev: CommentLibraryTemplate[]) => CommentLibraryTemplate[])) => {
      setLibrary((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater
        try {
          localStorage.setItem(STORAGE_KEY_LIBRARY, JSON.stringify(next))
        } catch (e) {
          console.error("Failed to save library", e)
        }
        return next
      })
    },
    []
  )

  const saveLogs = useCallback(
    (updater: CommentReplyLog[] | ((prev: CommentReplyLog[]) => CommentReplyLog[])) => {
      setLogs((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater
        try {
          localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(next))
        } catch (e) {
          console.error("Failed to save logs", e)
        }
        return next
      })
    },
    []
  )

  // Intent Classifier Helper based on keywords
  const detectIntent = useCallback(
    (commentText: string): CommentItem["intent"] => {
      const lower = commentText.toLowerCase()
      if (lower.includes("দাম") || lower.includes("price") || lower.includes("কত") || lower.includes("টাকা") || lower.includes("cost")) {
        return "Price Query"
      }
      if (lower.includes("ডেলিভারি") || lower.includes("delivery") || lower.includes("কুরিয়ার") || lower.includes("চার্জ")) {
        return "Delivery Query"
      }
      if (lower.includes("স্টক") || lower.includes("stock") || lower.includes("আছে") || lower.includes("কালার") || lower.includes("color")) {
        return "Stock Query"
      }
      if (lower.includes("ওয়ারেন্টি") || lower.includes("warranty") || lower.includes("গ্যারান্টি") || lower.includes("guarantee")) {
        return "Warranty Query"
      }
      if (lower.includes("ঠিকানা") || lower.includes("location") || lower.includes("শোরুম") || lower.includes("দোকান") || lower.includes("address")) {
        return "Location Query"
      }
      return "General Greeting"
    },
    []
  )

  // Add simulated or incoming webhook comment
  const addIncomingComment = useCallback(
    (comment: Omit<CommentItem, "id" | "receivedAt" | "status" | "suggestions" | "intent">) => {
      const detectedIntent = detectIntent(comment.userComment)
      const matchingTemplates = library.filter((t) => t.category === detectedIntent)
      const suggestions = matchingTemplates.length > 0
        ? matchingTemplates.map((t) => t.publicReply)
        : [
            "ধন্যবাদ ভাইয়া! বিস্তারিত তথ্য ইনবক্সে পাঠানো হয়েছে।",
            "আসসালামু আলাইকুম! বিস্তারিত জানতে ইনবক্স মেসেজ চেক করুন।",
          ]

      const newComment: CommentItem = {
        ...comment,
        id: `cm-${Date.now()}`,
        intent: detectedIntent,
        receivedAt: "Just now (Webhook Detected)",
        status: "Pending",
        suggestions,
      }

      saveComments((prev) => [newComment, ...prev])
      return newComment
    },
    [detectIntent, library, saveComments]
  )

  // Mark Comment as Replied
  const markReplied = useCallback(
    (commentId: string, publicReply: string, privateInboxMessage?: string) => {
      saveComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                status: "Replied",
                publicReply,
                privateInboxMessage,
                repliedAt: new Date().toISOString(),
              }
            : c
        )
      )
    },
    [saveComments]
  )

  // Dismiss / Ignore Comment
  const dismissComment = useCallback(
    (commentId: string) => {
      saveComments((prev) => prev.filter((c) => c.id !== commentId))
    },
    [saveComments]
  )

  // Library CRUD
  const addLibraryTemplate = useCallback(
    (template: Omit<CommentLibraryTemplate, "id" | "usesCount" | "createdAt">) => {
      const newTmpl: CommentLibraryTemplate = {
        ...template,
        id: `tmpl-${Date.now()}`,
        usesCount: 0,
        createdAt: new Date().toISOString(),
      }
      saveLibrary((prev) => [newTmpl, ...prev])
      return newTmpl
    },
    [saveLibrary]
  )

  const updateLibraryTemplate = useCallback(
    (id: string, updates: Partial<CommentLibraryTemplate>) => {
      saveLibrary((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
    },
    [saveLibrary]
  )

  const deleteLibraryTemplate = useCallback(
    (id: string) => {
      saveLibrary((prev) => prev.filter((t) => t.id !== id))
    },
    [saveLibrary]
  )

  // Append Audit Log
  const addAuditLog = useCallback(
    (log: Omit<CommentReplyLog, "id" | "timestamp">) => {
      const newLog: CommentReplyLog = {
        ...log,
        id: `log-rep-${Date.now()}`,
        timestamp: new Date().toISOString(),
      }
      saveLogs((prev) => [newLog, ...prev])
      return newLog
    },
    [saveLogs]
  )

  const clearAuditLogs = useCallback(() => {
    saveLogs([])
  }, [saveLogs])

  return {
    comments,
    library,
    logs,
    isLoaded,
    detectIntent,
    addIncomingComment,
    markReplied,
    dismissComment,
    addLibraryTemplate,
    updateLibraryTemplate,
    deleteLibraryTemplate,
    addAuditLog,
    clearAuditLogs,
  }
}
