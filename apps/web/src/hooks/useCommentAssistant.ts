"use client"

import { useState, useEffect, useCallback } from "react"

export type CommentSourceType = "Page" | "Group" | "Personal ID"

export type CommentIntentType =
  | "Price Query"
  | "Delivery Query"
  | "Stock Query"
  | "Warranty Query"
  | "Location Query"
  | "General Greeting"
  | "Needs Review"

export interface CommentItem {
  id: string
  commentId: string
  postId: string
  postTitle: string
  postUrl?: string
  postThumbnail?: string
  pageName: string
  accountId?: string
  accountName?: string
  sourceType?: CommentSourceType
  groupName?: string
  userName: string
  userAvatar?: string
  userComment: string
  intent: CommentIntentType
  receivedAt: string
  status: "Pending" | "Replied" | "Failed" | "Ignored"
  nestedReplyStatus?: "Sent" | "Pending" | "Failed"
  inboxStatus?: "Sent" | "Pending" | "Failed" | "Skipped"
  inboxDeliveryMethod?: "Official Graph API" | "Page Send Message Modal" | "Direct Messenger Bot"
  failureReason?: string
  retryCount?: number
  latencyMs?: number
  replyMode?: "Auto" | "Manual"
  publicReply?: string
  privateInboxMessage?: string
  repliedAt?: string
  suggestions: string[]
}

export interface CommentLibraryTemplate {
  id: string
  category: CommentIntentType
  title: string
  targetScope?: string
  productName?: string
  priceInfo?: string
  deliveryInfo?: string
  stockStatus?: "In Stock" | "Limited Stock" | "Pre-Order" | "Out of Stock"
  aiPromptInstruction?: string
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
  sourceType?: CommentSourceType
  groupName?: string
  customerQuery: string
  publicReply: string
  privateInboxReply?: string
  status: "Success" | "Failed"
  graphApiResponse: string
  timestamp: string
}

export interface MonitoredPostItem {
  id: string
  postId: string
  postUrl: string
  postTitle: string
  postThumbnail?: string
  sourceType: CommentSourceType
  targetId: string
  targetName: string
  accountName: string
  groupName?: string
  replyConfigMode: "template" | "custom"
  templateId?: string
  templateTitle?: string
  customPublicReply: string
  customInboxMessage: string
  sendPrivateInbox: boolean
  status: "Active" | "Paused"
  watcherJobId?: string
  watcherStatus?: "IDLE" | "WATCHING" | "COMPLETED" | "ERROR"
  createdAt: string
}

export const MAX_MONITORED_POSTS = 100

const STORAGE_KEY_COMMENTS = "bmt_webhook_comments"
const STORAGE_KEY_LIBRARY = "bmt_comment_library"
const STORAGE_KEY_LOGS = "bmt_comment_reply_logs"
const STORAGE_KEY_POSTS = "bmt_monitored_posts_100"
const STORAGE_KEY_SCHEMA_VERSION = "bmt_comment_assistant_schema_v2"

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
    title: "Eid Special Watch — Dynamic Price & Order Prompt",
    targetScope: "CARE HUB BD (Page) + All Groups",
    productName: "Eid Special Premium Watch Collection 2026",
    priceInfo: "৳2,490 (Regular ৳3,990 — 38% OFF)",
    deliveryInfo: "Free Nationwide Cash on Delivery (24h Dhaka, 48h Outside)",
    stockStatus: "In Stock",
    aiPromptInstruction:
      "Reply inside the user's comment confirming inbox dispatch, then send full offer price (৳2,490) and ask for Name, Full Address, and Mobile Number in Messenger.",
    publicReply:
      "ধন্যবাদ ভাইয়া! প্রিমিয়াম কালেকশনের স্পেশাল অফার প্রাইজ আপনার ইনবক্সে পাঠানো হয়েছে। দয়া করে মেসেঞ্জার চেক করুন।",
    privateInboxReply:
      "আসসালামু আলাইকুম! আমাদের প্রিমিয়াম ওয়াচটির রেগুলার মূল্য ৩,৯৯০ টাকা, তবে ঈদ ধামাকা অফারে পাচ্ছেন মাত্র ২,৪৯০ টাকায় (সারাদেশে ফ্রি ক্যাশ অন ডেলিভারি)! অর্ডার করতে এখনই আপনার নাম, পূর্ণ ঠিকানা ও মোবাইল নম্বর দিন।",
    keywords: ["দাম", "price", "কত", "taka", "টাকা", "cost", "দাম কত", "koto", "dam"],
    usesCount: 412,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tmpl-del-2",
    category: "Delivery Query",
    title: "Nationwide Cash on Delivery & Inspection Rule",
    targetScope: "All 100 Accounts (Pages, Groups & IDs)",
    productName: "All Active Catalog Products",
    priceInfo: "Delivery Charge: ৳0 (Free COD Campaign)",
    deliveryInfo: "Dhaka City: 24 Hours | Outside Dhaka: 48-72 Hours (Steadfast/Pathao)",
    stockStatus: "In Stock",
    aiPromptInstruction:
      "Assure customer that 100% Cash on Delivery is available across Bangladesh and they can inspect the product in front of the delivery rider before paying.",
    publicReply:
      "জি ভাইয়া, আমরা সারাদেশে ক্যাশ অন ডেলিভারি দিচ্ছি। ডেলিভারি সংক্রান্ত বিস্তারিত তথ্য আপনার ইনবক্সে পাঠানো হয়েছে।",
    privateInboxReply:
      "জি সম্মানিত গ্রাহক! ঢাকা সিটিতে ২৪ ঘণ্টার মধ্যে এবং ঢাকার বাইরে ৪৮ ঘণ্টার মধ্যে ক্যাশ অন ডেলিভারি পাবেন। ডেলিভারি ম্যানের সামনে প্রোডাক্ট দেখে চেক করে মূল্য পরিশোধ করতে পারবেন।",
    keywords: ["ডেলিভারি", "delivery", "home delivery", "ক্যাশ অন", "ঢাকার বাইরে", "চার্জ", "charge", "cod"],
    usesCount: 289,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tmpl-stock-3",
    category: "Stock Query",
    title: "Color Variants & Live Stock Urgency Rule",
    targetScope: "All 100 Accounts (Pages, Groups & IDs)",
    productName: "Premium Watch & Smart Gadgets",
    priceInfo: "৳2,490 (Combo 2 pcs: ৳4,500)",
    deliveryInfo: "Instant Dispatch from Dhaka Hub",
    stockStatus: "Limited Stock",
    aiPromptInstruction:
      "Confirm color availability (Black, Silver, Rose Gold) and mention limited stock urgency to encourage immediate booking in Messenger.",
    publicReply:
      "প্রোডাক্টটির সবগুলো কালার বর্তমানে সীমিত স্টকে এভেইলেবল আছে ভাইয়া! স্টক শেষ হওয়ার আগেই বুকিং করতে ইনবক্স চেক করুন।",
    privateInboxReply:
      "জি প্রোডাক্টটি এই মুহূর্তে আমাদের স্টকে আছে (ব্ল্যাক, সিলভার ও রোজ গোল্ড কালার), তবে মাত্র ১২টি পিস অবশিষ্ট রয়েছে। এখনই বুকিং কনফার্ম করতে আপনার নাম, ঠিকানা ও ফোন নম্বর দিন।",
    keywords: ["স্টক", "stock", "available", "আছে কি", "কালার", "color", "ache", "ase"],
    usesCount: 196,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tmpl-war-4",
    category: "Warranty Query",
    title: "Official 1-Year Brand Replacement Guarantee",
    targetScope: "CARE HUB BD + Gadget Group Accounts",
    productName: "Electronics & Watch Catalog",
    priceInfo: "Includes Free Official Warranty Card",
    deliveryInfo: "7-Day Instant Free Exchange on Any Defect",
    stockStatus: "In Stock",
    aiPromptInstruction:
      "Highlight 1-year official replacement warranty and 7-day easy exchange policy so the customer feels 100% confident ordering.",
    publicReply:
      "জি সম্মানিত কাস্টমার, প্রতিটি প্রডাক্টে পাচ্ছেন ১ বছরের অফিসিয়াল রিপ্লেসমেন্ট ওয়ারেন্টি! বিস্তারিত ইনবক্সে দেওয়া হলো।",
    privateInboxReply:
      "আমাদের প্রতিটি অথেনটিক প্রডাক্টের সাথে পাবেন অফিসিয়াল ১ বছরের রিপ্লেসমেন্ট ওয়ারেন্টি কার্ড। যেকোনো সমস্যায় ৭ দিনের মধ্যে ফ্রি এক্সচেঞ্জ সুবিধা রয়েছে।",
    keywords: ["ওয়ারেন্টি", "warranty", "গ্যারান্টি", "guarantee", "নষ্ট হলে", "অরিজিনাল"],
    usesCount: 138,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tmpl-loc-5",
    category: "Location Query",
    title: "Showroom Address & Direct Online Booking",
    targetScope: "All 100 Accounts (Pages, Groups & IDs)",
    productName: "Physical Outlet & Online Store",
    priceInfo: "Same Offer Price Online & In-Store",
    deliveryInfo: "Jamuna Future Park Level 4, Shop #408",
    stockStatus: "In Stock",
    aiPromptInstruction:
      "Provide the Jamuna Future Park showroom address and offer home delivery if the customer prefers not to visit in person.",
    publicReply:
      "আমাদের ঢাকা শোরুমের পূর্ণ ঠিকানা ও গুগল ম্যাপ লিংক আপনার ইনবক্সে পাঠানো হয়েছে ভাইয়া।",
    privateInboxReply:
      "আমাদের হেড অফিস ও আউটলেট: শপ #৪০৮, লেভেল ৪, যমুনা ফিউচার পার্ক, কুড়িল, ঢাকা। আপনি চাইলে শোরুমে এসে অথবা ঘরে বসে ক্যাশ অন ডেলিভারিতেও নিতে পারেন!",
    keywords: ["ঠিকানা", "location", "দোকান", "শোরুম", "কোথায়", "address", "shop"],
    usesCount: 94,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tmpl-gen-6",
    category: "General Greeting",
    title: "Friendly AI Concierge & Catalog Overview",
    targetScope: "All 100 Accounts (Pages, Groups & IDs)",
    productName: "General Store Inquiry",
    priceInfo: "Dynamic Catalog Pricing",
    deliveryInfo: "Nationwide COD",
    stockStatus: "In Stock",
    aiPromptInstruction:
      "Greet politely in Bengali, confirm an inbox message was sent, and ask how we can help with their order.",
    publicReply:
      "আসসালামু আলাইকুম! বিস্তারিত তথ্য আপনার ইনবক্সে মেসেজ করা হয়েছে, দয়া করে মেসেঞ্জার চেক করুন।",
    privateInboxReply:
      "স্বাগতম! আমাদের পোস্টে কমেন্ট করার জন্য ধন্যবাদ। প্রোডাক্টের ছবি, অফার প্রাইজ এবং অর্ডারের যেকোনো তথ্যের জন্য এখানে রিপ্লাই দিন, আমরা তাৎক্ষণিক সহায়তা করছি।",
    keywords: ["hi", "hello", "হাই", "হ্যালো", "details", "info", "জানতে চাই", "interested", "দরকার"],
    usesCount: 215,
    createdAt: new Date().toISOString(),
  },
]

export const DEFAULT_WEBHOOK_COMMENTS: CommentItem[] = [
  {
    id: "cm-101",
    commentId: "cmt_98234123_4021",
    postId: "post_892168940637389_1020304050",
    postTitle: "Eid Special Premium Watch Collection Offer 2026",
    postUrl: "https://www.facebook.com/892168940637389/posts/1020304050",
    postThumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120&auto=format&fit=crop&q=80",
    pageName: "CARE HUB BD",
    accountId: "page-care-hub",
    accountName: "CARE HUB BD",
    sourceType: "Page",
    userName: "Tanvir Ahmed",
    userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    userComment: "দাম কত ভাইয়া? ঢাকার বাইরে ডেলিভারি চার্জ কত পরবে?",
    intent: "Price Query",
    receivedAt: "Just now",
    status: "Replied",
    nestedReplyStatus: "Sent",
    inboxStatus: "Sent",
    inboxDeliveryMethod: "Page Send Message Modal",
    latencyMs: 1850,
    replyMode: "Auto",
    publicReply: "ধন্যবাদ ভাইয়া! প্রিমিয়াম কালেকশনের স্পেশাল অফার প্রাইজ আপনার ইনবক্সে পাঠানো হয়েছে। দয়া করে মেসেঞ্জার চেক করুন।",
    privateInboxMessage:
      "আসসালামু আলাইকুম! আমাদের প্রিমিয়াম ওয়াচটির রেগুলার মূল্য ৩,৯৯০ টাকা, তবে ঈদ ধামাকা অফারে পাচ্ছেন মাত্র ২,৪৯০ টাকায় (সারাদেশে ফ্রি ক্যাশ অন ডেলিভারি)! অর্ডার করতে এখনই আপনার নাম, পূর্ণ ঠিকানা ও মোবাইল নম্বর দিন।",
    repliedAt: new Date(Date.now() - 45 * 1000).toISOString(),
    suggestions: [
      "ধন্যবাদ ভাইয়া! প্রিমিয়াম কালেকশনের স্পেশাল অফার প্রাইজ আপনার ইনবক্সে পাঠানো হয়েছে। দয়া করে মেসেঞ্জার চেক করুন।",
      "আসসালামু আলাইকুম! ওয়াচটির প্রাইজ মাত্র ২,৪৯০ টাকা (সারাদেশে ফ্রি ডেলিভারি)। ইনবক্স চেক করুন ভাইয়া।",
    ],
  },
  {
    id: "cm-102",
    commentId: "cmt_87123982_5032",
    postId: "post_grp_dhaka_buy_sell_8821",
    postTitle: "অরিজিনাল স্টেইনলেস স্টিল প্রিমিয়াম ঘড়ি — ঈদ কালেকশন",
    postUrl: "https://www.facebook.com/groups/dhakabuyandsell/posts/88210391",
    postThumbnail: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=120&auto=format&fit=crop&q=80",
    pageName: "Tariqul Islam (Dhaka Marketplace Lead)",
    accountId: "acc-101",
    accountName: "Tariqul Islam (Dhaka Marketplace Lead)",
    sourceType: "Group",
    groupName: "Dhaka Buy and Sell Official",
    userName: "Nusrat Jahan",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    userComment: "ঢাকার বাইরে কি ক্যাশ অন ডেলিভারি হবে? প্রোডাক্ট হাতে পাওয়ার পর টাকা দিতে পারব?",
    intent: "Delivery Query",
    receivedAt: "2 mins ago",
    status: "Replied",
    nestedReplyStatus: "Sent",
    inboxStatus: "Sent",
    inboxDeliveryMethod: "Direct Messenger Bot",
    latencyMs: 2400,
    replyMode: "Auto",
    publicReply: "জি আপু, আমরা পুরো বাংলাদেশে ক্যাশ অন ডেলিভারিতে প্রোডাক্ট পাঠিয়ে থাকি। অর্ডার করতে ইনবক্স চেক করুন।",
    privateInboxMessage:
      "জি সম্মানিত গ্রাহক! ঢাকা সিটিতে ২৪ ঘণ্টার মধ্যে এবং ঢাকার বাইরে ৪৮ ঘণ্টার মধ্যে ক্যাশ অন ডেলিভারি পাবেন। ডেলিভারি ম্যানের সামনে প্রোডাক্ট দেখে চেক করে মূল্য পরিশোধ করতে পারবেন।",
    repliedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    suggestions: [
      "জি আপু, আমরা পুরো বাংলাদেশে ক্যাশ অন ডেলিভারিতে প্রোডাক্ট পাঠিয়ে থাকি। অর্ডার করতে ইনবক্স চেক করুন।",
      "হ্যাঁ আপু! প্রোডাক্ট হাতে পেয়ে দেখে মূল্য পরিশোধ করতে পারবেন। বিস্তারিত তথ্য ইনবক্সে মেসেজ করা হয়েছে।",
    ],
  },
  {
    id: "cm-103",
    commentId: "cmt_76123491_6043",
    postId: "post_grp_gadget_hub_7712",
    postTitle: "Smart Watch Ultra Series — 1 Year Replacement Guarantee",
    postUrl: "https://www.facebook.com/groups/bdsmartgadget/posts/77129384",
    postThumbnail: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=120&auto=format&fit=crop&q=80",
    pageName: "Kamrul Hasan (Gadgets & Tech Poster)",
    accountId: "acc-102",
    accountName: "Kamrul Hasan (Gadgets & Tech Poster)",
    sourceType: "Group",
    groupName: "BD Smart Gadget & Electronics Hub",
    userName: "Mahfuzur Rahman",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    userComment: "ব্ল্যাক কালারটা কি স্টকে এভেইলেবল আছে? সাথে কোনো ওয়ারেন্টি থাকবে?",
    intent: "Stock Query",
    receivedAt: "4 mins ago",
    status: "Pending",
    nestedReplyStatus: "Pending",
    inboxStatus: "Pending",
    inboxDeliveryMethod: "Direct Messenger Bot",
    suggestions: [
      "জি ভাইয়া, ব্ল্যাক কালার এভেইলেবল আছে এবং ১ বছরের অফিসিয়াল ব্র্যান্ড ওয়ারেন্টি রয়েছে! বিস্তারিত ইনবক্সে দেওয়া হলো।",
      "প্রোডাক্টটির ব্ল্যাক কালার স্টকে আছে। সীমিত স্টক, দ্রুত ইনবক্স চেক করে বুকিং কনফার্ম করুন।",
    ],
  },
  {
    id: "cm-104",
    commentId: "cmt_65192837_7054",
    postId: "post_892168940637389_1020304050",
    postTitle: "Eid Special Premium Watch Collection Offer 2026",
    postUrl: "https://www.facebook.com/892168940637389/posts/1020304050",
    postThumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120&auto=format&fit=crop&q=80",
    pageName: "CARE HUB BD",
    accountId: "page-care-hub",
    accountName: "CARE HUB BD",
    sourceType: "Page",
    userName: "Rafiqul Islam",
    userComment: "ভাইয়া আমি ২টা ঘড়ি একসাথে নিতে চাই, আমাকে ইনবক্সে মেসেজ দেন প্লিজ, আমার ইনবক্স থেকে মেসেজ যাচ্ছে না।",
    intent: "Price Query",
    receivedAt: "6 mins ago",
    status: "Failed",
    nestedReplyStatus: "Sent",
    inboxStatus: "Failed",
    inboxDeliveryMethod: "Page Send Message Modal",
    failureReason: "Messenger DOM modal timeout (Network jitter) — 1-Click Retry ready",
    retryCount: 1,
    publicReply: "ধন্যবাদ ভাইয়া! ২টি ঘড়ির কম্বো অফার প্রাইজ আপনার ইনবক্সে পাঠানো হচ্ছে।",
    privateInboxMessage:
      "আসসালামু আলাইকুম ভাইয়া! ২টি প্রিমিয়াম ওয়াচ একসাথে নিলে কম্বো অফারে পাচ্ছেন মাত্র ৪,৫০০ টাকায় (ফ্রি ডেলিভারি)। আপনার নাম, ঠিকানা ও মোবাইল নম্বর দিন।",
    suggestions: [
      "ধন্যবাদ ভাইয়া! ২টি ঘড়ির কম্বো অফার প্রাইজ আপনার ইনবক্সে পাঠানো হয়েছে। দয়া করে মেসেজ রিকোয়েস্ট চেক করুন।",
    ],
  },
  {
    id: "cm-105",
    commentId: "cmt_54182736_8065",
    postId: "post_id_rasidul_9912",
    postTitle: "আজকের স্পেশাল ঘড়ির লাইভ রিভিউ ও আনবক্সিং",
    postUrl: "https://www.facebook.com/rasidul/posts/99128374",
    postThumbnail: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=120&auto=format&fit=crop&q=80",
    pageName: "Rasidul (Personal ID)",
    accountId: "acc-rasidul",
    accountName: "Rasidul (Personal ID)",
    sourceType: "Personal ID",
    userName: "Sabbir Hossain",
    userComment: "দাম কত ভাইয়া? অরিজিনাল বক্স সাথে থাকবে তো?",
    intent: "Price Query",
    receivedAt: "9 mins ago",
    status: "Replied",
    nestedReplyStatus: "Sent",
    inboxStatus: "Sent",
    inboxDeliveryMethod: "Direct Messenger Bot",
    latencyMs: 2100,
    replyMode: "Auto",
    publicReply: "জি ভাইয়া, অরিজিনাল প্রিমিয়াম বক্স ও ওয়ারেন্টি কার্ড সাথে থাকবে! অফার প্রাইজ ইনবক্সে পাঠানো হয়েছে।",
    privateInboxMessage:
      "আসসালামু আলাইকুম! অরিজিনাল বক্স ও ১ বছরের ওয়ারেন্টি কার্ডসহ স্পেশাল প্রাইজ মাত্র ২,৪৯০ টাকা। অর্ডার করতে নাম, ঠিকানা ও ফোন নম্বর দিন।",
    repliedAt: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
    suggestions: [
      "জি ভাইয়া, অরিজিনাল প্রিমিয়াম বক্স ও ওয়ারেন্টি কার্ড সাথে থাকবে! অফার প্রাইজ ইনবক্সে পাঠানো হয়েছে।",
    ],
  },
  {
    id: "cm-106",
    commentId: "cmt_43172635_9076",
    postId: "post_grp_organic_food_6610",
    postTitle: "খাঁটি সুন্দরবনের প্রাকৃতিক চাকের মধু — ১০০% গ্যারান্টি",
    postUrl: "https://www.facebook.com/groups/pureorganicfoodbd/posts/66102938",
    postThumbnail: "https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=120&auto=format&fit=crop&q=80",
    pageName: "Farhana Akter (Organic Food & Boutique)",
    accountId: "acc-103",
    accountName: "Farhana Akter (Organic Food & Boutique)",
    sourceType: "Group",
    groupName: "Pure & Organic Food BD",
    userName: "Sharmin Sultana",
    userComment: "১ কেজি মধুর দাম কত আপু? মিরপুরে কবে ডেলিভারি দিতে পারবেন?",
    intent: "Price Query",
    receivedAt: "14 mins ago",
    status: "Pending",
    nestedReplyStatus: "Pending",
    inboxStatus: "Pending",
    inboxDeliveryMethod: "Direct Messenger Bot",
    suggestions: [
      "ধন্যবাদ আপু! ১ কেজি খাঁটি মধুর অফার প্রাইজ এবং মিরপুরে ২৪ ঘণ্টায় ডেলিভারির বিস্তারিত ইনবক্সে পাঠিয়েছি।",
      "জি আপু, আগামীকালই মিরপুরে হোম ডেলিভারি পাবেন! বিস্তারিত জানতে ইনবক্স চেক করুন।",
    ],
  },
  {
    id: "cm-107",
    commentId: "cmt_32162534_1087",
    postId: "post_892168940637389_1020304050",
    postTitle: "Eid Special Premium Watch Collection Offer 2026",
    postUrl: "https://www.facebook.com/892168940637389/posts/1020304050",
    postThumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120&auto=format&fit=crop&q=80",
    pageName: "CARE HUB BD",
    accountId: "page-care-hub",
    accountName: "CARE HUB BD",
    sourceType: "Page",
    userName: "Mehedi Hasan",
    userComment: "আপনাদের শোরুমের ঠিকানা কোথায়? সরাসরি এসে দেখে নিতে চাই।",
    intent: "Location Query",
    receivedAt: "18 mins ago",
    status: "Replied",
    nestedReplyStatus: "Sent",
    inboxStatus: "Sent",
    inboxDeliveryMethod: "Official Graph API",
    latencyMs: 1420,
    replyMode: "Auto",
    publicReply: "আমাদের ঢাকা শোরুমের পূর্ণ ঠিকানা ও গুগল ম্যাপ লিংক আপনার ইনবক্সে পাঠানো হয়েছে ভাইয়া।",
    privateInboxMessage:
      "আমাদের হেড অফিস ও আউটলেট: শপ #৪০৮, লেভেল ৪, যমুনা ফিউচার পার্ক, কুড়িল, ঢাকা। সরাসরি শোরুমে এসে দেখে নেওয়ার আমন্ত্রণ রইল!",
    repliedAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    suggestions: [
      "আমাদের ঢাকা শোরুমের পূর্ণ ঠিকানা ও গুগল ম্যাপ লিংক আপনার ইনবক্সে পাঠানো হয়েছে ভাইয়া।",
    ],
  },
  {
    id: "cm-108",
    commentId: "cmt_21152433_2098",
    postId: "post_grp_mirpur_wholesale_5519",
    postTitle: "পাইকারি দামে প্রিমিয়াম পাঞ্জাবি ও ঘড়ি কম্বো",
    postUrl: "https://www.facebook.com/groups/mirpurwholesale/posts/55192837",
    postThumbnail: "https://images.unsplash.com/photo-1509941943102-10c232535736?w=120&auto=format&fit=crop&q=80",
    pageName: "Tariqul Islam (Dhaka Marketplace Lead)",
    accountId: "acc-101",
    accountName: "Tariqul Islam (Dhaka Marketplace Lead)",
    sourceType: "Group",
    groupName: "Mirpur Wholesale Marketplace",
    userName: "Jahidul Islam",
    userComment: "ভাই গত সপ্তাহে অর্ডার করেছিলাম কিন্তু কুরিয়ার থেকে এখনো কল দেয়নি, একটু চেক করবেন?",
    intent: "Needs Review",
    receivedAt: "22 mins ago",
    status: "Pending",
    nestedReplyStatus: "Pending",
    inboxStatus: "Pending",
    inboxDeliveryMethod: "Direct Messenger Bot",
    suggestions: [
      "আন্তরিকভাবে দুঃখিত ভাইয়া! আপনার অর্ডার নম্বর বা মোবাইল নম্বরটি ইনবক্সে দিন, আমরা এখনই কুরিয়ার ট্র্যাকিং চেক করে আপডেট জানাচ্ছি।",
      "ভাইয়া আমরা আপনার ইনবক্সে মেসেজ দিয়েছি, দয়া করে আপনার ফোন নম্বরটি দিন যাতে দ্রুত সমাধান করতে পারি।",
    ],
  },
]

export const INITIAL_REPLY_LOGS: CommentReplyLog[] = [
  {
    id: "log-rep-1",
    commentId: "cmt_98234123_4021",
    customerName: "Tanvir Ahmed",
    postTitle: "Eid Special Premium Watch Collection Offer 2026",
    pageName: "CARE HUB BD",
    sourceType: "Page",
    customerQuery: "দাম কত ভাইয়া? ঢাকার বাইরে ডেলিভারি চার্জ কত পরবে?",
    publicReply: "ধন্যবাদ ভাইয়া! প্রিমিয়াম কালেকশনের স্পেশাল অফার প্রাইজ আপনার ইনবক্সে পাঠানো হয়েছে। দয়া করে মেসেঞ্জার চেক করুন।",
    privateInboxReply: "আসসালামু আলাইকুম! আমাদের প্রিমিয়াম ওয়াচটির রেগুলার মূল্য ৩,৯৯০ টাকা, তবে ঈদ ধামাকা অফারে পাচ্ছেন মাত্র ২,৪৯০ টাকায় (সারাদেশে ফ্রি ক্যাশ অন ডেলিভারি)!",
    status: "Success",
    graphApiResponse: "Nested Reply OK (1.8s) + Page Send Message Modal Dispatched",
    timestamp: new Date(Date.now() - 45 * 1000).toISOString(),
  },
  {
    id: "log-rep-2",
    commentId: "cmt_87123982_5032",
    customerName: "Nusrat Jahan",
    postTitle: "অরিজিনাল স্টেইনলেস স্টিল প্রিমিয়াম ঘড়ি — ঈদ কালেকশন",
    pageName: "Tariqul Islam (Dhaka Marketplace Lead)",
    sourceType: "Group",
    groupName: "Dhaka Buy and Sell Official",
    customerQuery: "ঢাকার বাইরে কি ক্যাশ অন ডেলিভারি হবে? প্রোডাক্ট হাতে পাওয়ার পর টাকা দিতে পারব?",
    publicReply: "জি আপু, আমরা পুরো বাংলাদেশে ক্যাশ অন ডেলিভারিতে প্রোডাক্ট পাঠিয়ে থাকি। অর্ডার করতে ইনবক্স চেক করুন।",
    privateInboxReply: "জি সম্মানিত গ্রাহক! ঢাকা সিটিতে ২৪ ঘণ্টার মধ্যে এবং ঢাকার বাইরে ৪৮ ঘণ্টার মধ্যে ক্যাশ অন ডেলিভারি পাবেন।",
    status: "Success",
    graphApiResponse: "Group Nested Comment Reply OK + Direct Messenger Bot Sent",
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: "log-rep-3",
    commentId: "cmt_65192837_7054",
    customerName: "Rafiqul Islam",
    postTitle: "Eid Special Premium Watch Collection Offer 2026",
    pageName: "CARE HUB BD",
    sourceType: "Page",
    customerQuery: "ভাইয়া আমি ২টা ঘড়ি একসাথে নিতে চাই, আমাকে ইনবক্সে মেসেজ দেন প্লিজ",
    publicReply: "ধন্যবাদ ভাইয়া! ২টি ঘড়ির কম্বো অফার প্রাইজ আপনার ইনবক্সে পাঠানো হচ্ছে।",
    privateInboxReply: undefined,
    status: "Failed",
    graphApiResponse: "Nested Reply OK — Private Inbox Modal Timeout (Queued for 1-Click Retry)",
    timestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
  },
]

export const DEFAULT_MONITORED_POSTS: MonitoredPostItem[] = [
  {
    id: "mp-101",
    postId: "post_892168940637389_1020304050",
    postUrl: "https://www.facebook.com/892168940637389/posts/1020304050",
    postTitle: "Eid Special Premium Watch Collection Offer 2026",
    postThumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120&auto=format&fit=crop&q=80",
    sourceType: "Page",
    targetId: "892168940637389",
    targetName: "CARE HUB BD",
    accountName: "CARE HUB BD",
    replyConfigMode: "template",
    templateId: "tmpl-price-1",
    templateTitle: "Eid Special Watch — Dynamic Price & Order Prompt",
    customPublicReply:
      "ধন্যবাদ ভাইয়া! প্রিমিয়াম কালেকশনের স্পেশাল অফার প্রাইজ আপনার ইনবক্সে পাঠানো হয়েছে। দয়া করে মেসেঞ্জার চেক করুন।",
    customInboxMessage:
      "আসসালামু আলাইকুম! আমাদের প্রিমিয়াম ওয়াচটির রেগুলার মূল্য ৩,৯৯০ টাকা, তবে ঈদ ধামাকা অফারে পাচ্ছেন মাত্র ২,৪৯০ টাকায় (সারাদেশে ফ্রি ক্যাশ অন ডেলিভারি)! অর্ডার করতে এখনই আপনার নাম, পূর্ণ ঠিকানা ও মোবাইল নম্বর দিন।",
    sendPrivateInbox: true,
    status: "Active",
    watcherStatus: "IDLE",
    createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
  },
  {
    id: "mp-102",
    postId: "post_grp_dhaka_buy_sell_8821",
    postUrl: "https://www.facebook.com/groups/dhakabuyandsell/posts/88210391",
    postTitle: "অরিজিনাল স্টেইনলেস স্টিল প্রিমিয়াম ঘড়ি — ঈদ কালেকশন",
    postThumbnail: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=120&auto=format&fit=crop&q=80",
    sourceType: "Group",
    targetId: "grp-1",
    targetName: "Dhaka Buy and Sell Official",
    accountName: "Tariqul Islam (Dhaka Marketplace Lead)",
    groupName: "Dhaka Buy and Sell Official",
    replyConfigMode: "template",
    templateId: "tmpl-del-2",
    templateTitle: "Nationwide Cash on Delivery & Inspection Rule",
    customPublicReply:
      "জি ভাইয়া, আমরা সারাদেশে ক্যাশ অন ডেলিভারি দিচ্ছি। ডেলিভারি সংক্রান্ত বিস্তারিত তথ্য আপনার ইনবক্সে পাঠানো হয়েছে।",
    customInboxMessage:
      "জি সম্মানিত গ্রাহক! ঢাকা সিটিতে ২৪ ঘণ্টার মধ্যে এবং ঢাকার বাইরে ৪৮ ঘণ্টার মধ্যে ক্যাশ অন ডেলিভারি পাবেন। ডেলিভারি ম্যানের সামনে প্রোডাক্ট দেখে চেক করে মূল্য পরিশোধ করতে পারবেন।",
    sendPrivateInbox: true,
    status: "Active",
    watcherStatus: "IDLE",
    createdAt: new Date(Date.now() - 7200 * 1000).toISOString(),
  },
  {
    id: "mp-103",
    postId: "post_id_rasidul_9912",
    postUrl: "https://www.facebook.com/rasidul/posts/99128374",
    postTitle: "আজকের স্পেশাল ঘড়ির লাইভ রিভিউ ও আনবক্সিং",
    postThumbnail: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=120&auto=format&fit=crop&q=80",
    sourceType: "Personal ID",
    targetId: "acc-rasidul",
    targetName: "Rasidul (Personal ID)",
    accountName: "Rasidul (Personal ID)",
    replyConfigMode: "custom",
    customPublicReply:
      "জি ভাইয়া, অরিজিনাল প্রিমিয়াম বক্স ও ওয়ারেন্টি কার্ড সাথে থাকবে! অফার প্রাইজ ইনবক্সে পাঠানো হয়েছে।",
    customInboxMessage:
      "আসসালামু আলাইকুম! অরিজিনাল বক্স ও ১ বছরের ওয়ারেন্টি কার্ডসহ স্পেশাল প্রাইজ মাত্র ২,৪৯০ টাকা। অর্ডার করতে নাম, ঠিকানা ও ফোন নম্বর দিন।",
    sendPrivateInbox: true,
    status: "Active",
    watcherStatus: "IDLE",
    createdAt: new Date(Date.now() - 10800 * 1000).toISOString(),
  },
  {
    id: "mp-104",
    postId: "post_grp_gadget_hub_7712",
    postUrl: "https://www.facebook.com/groups/bdsmartgadget/posts/77129384",
    postTitle: "Smart Watch Ultra Series — 1 Year Replacement Guarantee",
    postThumbnail: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=120&auto=format&fit=crop&q=80",
    sourceType: "Group",
    targetId: "grp-4",
    targetName: "BD Smart Gadget & Electronics Hub",
    accountName: "Kamrul Hasan (Gadgets & Tech Poster)",
    groupName: "BD Smart Gadget & Electronics Hub",
    replyConfigMode: "template",
    templateId: "tmpl-stock-3",
    templateTitle: "Color Variants & Live Stock Urgency Rule",
    customPublicReply:
      "প্রোডাক্টটির সবগুলো কালার বর্তমানে সীমিত স্টকে এভেইলেবল আছে ভাইয়া! স্টক শেষ হওয়ার আগেই বুকিং করতে ইনবক্স চেক করুন।",
    customInboxMessage:
      "জি প্রোডাক্টটি এই মুহূর্তে আমাদের স্টকে আছে (ব্ল্যাক, সিলভার ও রোজ গোল্ড কালার), তবে মাত্র ১২টি পিস অবশিষ্ট রয়েছে। এখনই বুকিং কনফার্ম করতে আপনার নাম, ঠিকানা ও ফোন নম্বর দিন।",
    sendPrivateInbox: true,
    status: "Active",
    watcherStatus: "IDLE",
    createdAt: new Date(Date.now() - 14400 * 1000).toISOString(),
  },
  {
    id: "mp-105",
    postId: "post_grp_organic_food_6610",
    postUrl: "https://www.facebook.com/groups/pureorganicfoodbd/posts/66102938",
    postTitle: "খাঁটি সুন্দরবনের প্রাকৃতিক চাকের মধু — ১০০% গ্যারান্টি",
    postThumbnail: "https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=120&auto=format&fit=crop&q=80",
    sourceType: "Group",
    targetId: "grp-6",
    targetName: "Pure & Organic Food BD",
    accountName: "Farhana Akter (Organic Food & Boutique)",
    groupName: "Pure & Organic Food BD",
    replyConfigMode: "custom",
    customPublicReply:
      "ধন্যবাদ আপু! ১ কেজি খাঁটি মধুর অফার প্রাইজ এবং মিরপুরে ২৪ ঘণ্টায় ডেলিভারির বিস্তারিত ইনবক্সে পাঠিয়েছি।",
    customInboxMessage:
      "আসসালামু আলাইকুম আপু! ১০০% খাঁটি সুন্দরবনের চাকের মধু ১ কেজি ১,২৫০ টাকা (সারাদেশে ক্যাশ অন ডেলিভারি)। অর্ডার করতে আপনার নাম, ঠিকানা ও মোবাইল নম্বর দিন।",
    sendPrivateInbox: true,
    status: "Active",
    watcherStatus: "IDLE",
    createdAt: new Date(Date.now() - 18000 * 1000).toISOString(),
  },
]

const MAX_STORED_COMMENTS = 200
const MAX_STORED_LOGS = 500
const DEFAULT_POST_THUMBNAIL = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120&auto=format&fit=crop&q=80"

function safeSetLocalStorage(key: string, data: unknown, fallbackSlice?: () => unknown) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    if (fallbackSlice) {
      try {
        localStorage.setItem(key, JSON.stringify(fallbackSlice()))
      } catch (innerErr) {
        console.error(`Failed to persist ${key} after quota trim`, innerErr)
      }
    } else {
      console.error(`Failed to persist ${key}`, e)
    }
  }
}

function normalizeCommentItem(c: CommentItem): CommentItem {
  const isReplied = c.status === "Replied"
  const isFailed = c.status === "Failed"
  return {
    ...c,
    postThumbnail: c.postThumbnail || DEFAULT_POST_THUMBNAIL,
    sourceType: c.sourceType || (c.pageName?.includes("Group") ? "Group" : c.pageName?.includes("ID") ? "Personal ID" : "Page"),
    accountName: c.accountName || c.pageName || "CARE HUB BD",
    accountId: c.accountId || "page-care-hub",
    nestedReplyStatus: c.nestedReplyStatus || (isReplied ? "Sent" : isFailed ? "Sent" : "Pending"),
    inboxStatus: c.inboxStatus || (isReplied ? (c.privateInboxMessage ? "Sent" : "Skipped") : isFailed ? "Failed" : "Pending"),
    inboxDeliveryMethod:
      c.inboxDeliveryMethod ||
      (c.sourceType === "Group" || c.sourceType === "Personal ID" ? "Direct Messenger Bot" : "Page Send Message Modal"),
    publicReply: c.publicReply ? sanitizeText(c.publicReply) : undefined,
    privateInboxMessage: c.privateInboxMessage ? sanitizeText(c.privateInboxMessage) : undefined,
    suggestions: (c.suggestions || []).map(sanitizeText),
  }
}

export function normalizeFacebookPostUrl(rawUrl?: string): string {
  if (!rawUrl) return ""
  const trimmed = rawUrl.trim()
  if (!trimmed) return ""
  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    const u = new URL(withProto)
    const host = u.hostname.toLowerCase().replace(/^(m|web|mbasic|touch|business)\./, "www.")
    const normHost = host === "facebook.com" ? "www.facebook.com" : host
    const pathClean = u.pathname.replace(/\/+$/, "").toLowerCase()
    const keepParams = ["story_fbid", "id", "fbid", "v", "multi_permalinks"]
    const kept: string[] = []
    keepParams.forEach((k) => {
      const val = u.searchParams.get(k)
      if (val) kept.push(`${k}=${val.toLowerCase()}`)
    })
    return `${normHost}${pathClean}${kept.length ? "?" + kept.join("&") : ""}`
  } catch {
    return trimmed.replace(/\/+$/, "").toLowerCase()
  }
}

export function extractFacebookPostTokens(postId?: string, postUrl?: string): string[] {
  const tokens = new Set<string>()
  const addToken = (val?: string | null) => {
    const clean = (val || "").trim().toLowerCase()
    if (clean && clean.length >= 4) tokens.add(clean)
  }

  if (postId) {
    const rawId = postId.trim().toLowerCase()
    addToken(rawId)
    const stripped = rawId.replace(/^post_/, "")
    addToken(stripped)
    const graphMatch = stripped.match(/^(\d+)_(\d+)$/)
    if (graphMatch) {
      addToken(`${graphMatch[1]}_${graphMatch[2]}`)
      addToken(graphMatch[2])
    }
  }

  if (postUrl) {
    const rawUrl = postUrl.trim()
    const pagePostMatch = rawUrl.match(/facebook\.com\/(\d+)\/posts\/([a-zA-Z0-9._-]+)/i)
    if (pagePostMatch) {
      addToken(`${pagePostMatch[1]}_${pagePostMatch[2]}`)
      addToken(pagePostMatch[2])
    }
    const genericPostMatch = rawUrl.match(/\/(?:posts|permalink|videos|reel)\/([a-zA-Z0-9._-]+)/i)
    if (genericPostMatch) {
      addToken(genericPostMatch[1])
    }
    const shareMatch = rawUrl.match(/\/share\/[pvr]\/([a-zA-Z0-9._-]+)/i)
    if (shareMatch) {
      addToken(`share_${shareMatch[1]}`)
    }
    const fbWatchMatch = rawUrl.match(/fb\.watch\/([a-zA-Z0-9._-]+)/i)
    if (fbWatchMatch) {
      addToken(`fbwatch_${fbWatchMatch[1]}`)
    }
    try {
      const withProto = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`
      const u = new URL(withProto)
      const storyFbid = u.searchParams.get("story_fbid")
      const pageId = u.searchParams.get("id")
      const fbid = u.searchParams.get("fbid")
      const vParam = u.searchParams.get("v")
      if (storyFbid) {
        addToken(storyFbid)
        if (pageId) addToken(`${pageId}_${storyFbid}`)
      }
      if (fbid) addToken(fbid)
      if (vParam) addToken(vParam)
    } catch {}
  }

  return Array.from(tokens)
}

export function doesCommentMatchMonitoredPost(
  comment: { postId?: string; postUrl?: string; postTitle?: string },
  post: MonitoredPostItem
): boolean {
  if (comment.postId && post.postId && comment.postId === post.postId) return true

  const normCommentUrl = normalizeFacebookPostUrl(comment.postUrl)
  const normPostUrl = normalizeFacebookPostUrl(post.postUrl)
  if (normCommentUrl && normPostUrl && normCommentUrl === normPostUrl) return true

  const commentTokens = extractFacebookPostTokens(comment.postId, comment.postUrl)
  if (commentTokens.length > 0) {
    const postTokens = extractFacebookPostTokens(post.postId, post.postUrl)
    if (commentTokens.some((t) => postTokens.includes(t))) return true
  }

  const cleanCommentTitle = (comment.postTitle || "").trim().toLowerCase()
  const cleanPostTitle = (post.postTitle || "").trim().toLowerCase()
  if (cleanCommentTitle && cleanPostTitle && cleanCommentTitle === cleanPostTitle) return true

  return false
}

export function useCommentAssistant() {
  const [comments, setComments] = useState<CommentItem[]>(DEFAULT_WEBHOOK_COMMENTS)
  const [library, setLibrary] = useState<CommentLibraryTemplate[]>(DEFAULT_LIBRARY_TEMPLATES)
  const [logs, setLogs] = useState<CommentReplyLog[]>(INITIAL_REPLY_LOGS)
  const [monitoredPosts, setMonitoredPosts] = useState<MonitoredPostItem[]>(DEFAULT_MONITORED_POSTS)
  const [isLoaded, setIsLoaded] = useState(false)

  const loadFromStorage = useCallback(() => {
    if (typeof window === "undefined") return
    try {
      const currentSchema = localStorage.getItem(STORAGE_KEY_SCHEMA_VERSION)
      const isUpgraded = currentSchema === "2.0"

      const storedComments = localStorage.getItem(STORAGE_KEY_COMMENTS)
      if (storedComments && isUpgraded) {
        const parsed = JSON.parse(storedComments) as CommentItem[]
        const sanitized = parsed.slice(0, MAX_STORED_COMMENTS).map(normalizeCommentItem)
        setComments(sanitized)
      } else if (!isUpgraded) {
        setComments(DEFAULT_WEBHOOK_COMMENTS)
        safeSetLocalStorage(STORAGE_KEY_COMMENTS, DEFAULT_WEBHOOK_COMMENTS)
      }

      const storedLib = localStorage.getItem(STORAGE_KEY_LIBRARY)
      if (storedLib && isUpgraded) {
        const parsed = JSON.parse(storedLib) as CommentLibraryTemplate[]
        const sanitized = parsed.map((t) => ({
          ...t,
          publicReply: sanitizeText(t.publicReply),
          privateInboxReply: sanitizeText(t.privateInboxReply),
        }))
        setLibrary(sanitized)
      } else if (!isUpgraded) {
        setLibrary(DEFAULT_LIBRARY_TEMPLATES)
        safeSetLocalStorage(STORAGE_KEY_LIBRARY, DEFAULT_LIBRARY_TEMPLATES)
      }

      const storedLogs = localStorage.getItem(STORAGE_KEY_LOGS)
      if (storedLogs && isUpgraded) {
        const parsed = JSON.parse(storedLogs) as CommentReplyLog[]
        const sanitized = parsed.slice(0, MAX_STORED_LOGS).map((l) => ({
          ...l,
          publicReply: sanitizeText(l.publicReply),
          privateInboxReply: l.privateInboxReply ? sanitizeText(l.privateInboxReply) : undefined,
        }))
        setLogs(sanitized)
      } else if (!isUpgraded) {
        setLogs(INITIAL_REPLY_LOGS)
        safeSetLocalStorage(STORAGE_KEY_LOGS, INITIAL_REPLY_LOGS)
      }

      const storedPosts = localStorage.getItem(STORAGE_KEY_POSTS)
      if (storedPosts !== null && isUpgraded) {
        const parsed = JSON.parse(storedPosts) as MonitoredPostItem[]
        if (Array.isArray(parsed)) {
          const sanitized = parsed.slice(0, MAX_MONITORED_POSTS).map((p) => ({
            ...p,
            postThumbnail: p.postThumbnail || DEFAULT_POST_THUMBNAIL,
            customPublicReply: sanitizeText(p.customPublicReply || ""),
            customInboxMessage: sanitizeText(p.customInboxMessage || ""),
          }))
          setMonitoredPosts(sanitized)
        } else {
          setMonitoredPosts(DEFAULT_MONITORED_POSTS)
          safeSetLocalStorage(STORAGE_KEY_POSTS, DEFAULT_MONITORED_POSTS)
        }
      } else {
        setMonitoredPosts(DEFAULT_MONITORED_POSTS)
        safeSetLocalStorage(STORAGE_KEY_POSTS, DEFAULT_MONITORED_POSTS)
      }

      localStorage.setItem(STORAGE_KEY_SCHEMA_VERSION, "2.0")
    } catch (e) {
      console.error("Error loading comment assistant data", e)
      setComments(DEFAULT_WEBHOOK_COMMENTS)
      setLibrary(DEFAULT_LIBRARY_TEMPLATES)
      setLogs(INITIAL_REPLY_LOGS)
      setMonitoredPosts(DEFAULT_MONITORED_POSTS)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Load from localStorage with v2 schema upgrade & multi-tab storage listener
  useEffect(() => {
    loadFromStorage()

    const handleStorageEvent = (e: StorageEvent) => {
      if (
        !e.key ||
        e.key === STORAGE_KEY_COMMENTS ||
        e.key === STORAGE_KEY_LIBRARY ||
        e.key === STORAGE_KEY_LOGS ||
        e.key === STORAGE_KEY_POSTS
      ) {
        loadFromStorage()
      }
    }

    window.addEventListener("storage", handleStorageEvent)
    return () => window.removeEventListener("storage", handleStorageEvent)
  }, [loadFromStorage])

  // Functional Persistence Helpers with bounded size & quota safety
  const saveComments = useCallback(
    (updater: CommentItem[] | ((prev: CommentItem[]) => CommentItem[])) => {
      setComments((prev) => {
        const rawNext = typeof updater === "function" ? updater(prev) : updater
        const next = rawNext.slice(0, MAX_STORED_COMMENTS)
        safeSetLocalStorage(STORAGE_KEY_COMMENTS, next, () => next.slice(0, 50))
        return next
      })
    },
    []
  )

  const saveLibrary = useCallback(
    (updater: CommentLibraryTemplate[] | ((prev: CommentLibraryTemplate[]) => CommentLibraryTemplate[])) => {
      setLibrary((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater
        safeSetLocalStorage(STORAGE_KEY_LIBRARY, next)
        return next
      })
    },
    []
  )

  const saveLogs = useCallback(
    (updater: CommentReplyLog[] | ((prev: CommentReplyLog[]) => CommentReplyLog[])) => {
      setLogs((prev) => {
        const rawNext = typeof updater === "function" ? updater(prev) : updater
        const next = rawNext.slice(0, MAX_STORED_LOGS)
        safeSetLocalStorage(STORAGE_KEY_LOGS, next, () => next.slice(0, 100))
        return next
      })
    },
    []
  )

  const saveMonitoredPosts = useCallback(
    (updater: MonitoredPostItem[] | ((prev: MonitoredPostItem[]) => MonitoredPostItem[])) => {
      setMonitoredPosts((prev) => {
        const rawNext = typeof updater === "function" ? updater(prev) : updater
        const next = rawNext.slice(0, MAX_MONITORED_POSTS)
        safeSetLocalStorage(STORAGE_KEY_POSTS, next)
        return next
      })
    },
    []
  )

  // Lookup if a comment belongs to a Monitored Post (by postId, normalized postUrl, post tokens, or postTitle)
  const findMonitoredPostForComment = useCallback(
    (postId?: string, postUrl?: string, postTitle?: string): MonitoredPostItem | undefined => {
      return monitoredPosts.find((p) =>
        doesCommentMatchMonitoredPost({ postId, postUrl, postTitle }, p)
      )
    },
    [monitoredPosts]
  )

  // Build a Live Stream row representation for a Monitored Post
  const buildStreamItemFromPost = useCallback((post: MonitoredPostItem): CommentItem => {
    const displayAccount =
      post.sourceType === "Group"
        ? post.accountName || post.targetName
        : post.targetName || post.accountName
    return {
      id: `stream-${post.id}`,
      commentId: `cmt_post_${post.id}`,
      postId: post.postId,
      postTitle: post.postTitle,
      postUrl: post.postUrl,
      postThumbnail: post.postThumbnail,
      pageName: displayAccount,
      accountId: post.targetId,
      accountName: displayAccount,
      sourceType: post.sourceType,
      groupName: post.groupName || (post.sourceType === "Group" ? post.targetName : undefined),
      userName: "Live Post Active",
      userComment: "Auto-Reply & Inbox DM active on this post",
      intent: "Price Query",
      receivedAt: "Just now",
      status: "Replied",
      nestedReplyStatus: "Sent",
      inboxStatus: post.sendPrivateInbox ? "Sent" : "Skipped",
      inboxDeliveryMethod: post.sourceType === "Page" ? "Page Send Message Modal" : "Direct Messenger Bot",
      latencyMs: 1800,
      replyMode: "Auto",
      publicReply: post.customPublicReply,
      privateInboxMessage: post.sendPrivateInbox ? post.customInboxMessage : undefined,
      repliedAt: post.createdAt || new Date().toISOString(),
      suggestions: [post.customPublicReply],
    }
  }, [])

  // Monitored Posts CRUD (Up to 100 Posts under Personal IDs, Pages, or Groups)
  const addMonitoredPost = useCallback(
    (
      postData: Omit<MonitoredPostItem, "id" | "postId" | "createdAt" | "status" | "watcherStatus"> & {
        postId?: string
        status?: "Active" | "Paused"
      }
    ) => {
      if (monitoredPosts.length >= MAX_MONITORED_POSTS) {
        throw new Error(`Maximum capacity reached: ${MAX_MONITORED_POSTS} Monitored Posts limit.`)
      }

      const derivedTokens = extractFacebookPostTokens(postData.postId, postData.postUrl)
      const resolvedPostId =
        postData.postId ||
        (derivedTokens.length > 0 ? `post_${derivedTokens[0]}` : `post_${Date.now()}`)

      const newPost: MonitoredPostItem = {
        ...postData,
        id: `mp-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        postId: resolvedPostId,
        postUrl: postData.postUrl.trim(),
        postTitle: postData.postTitle.trim() || `${postData.targetName} — Monitored Post`,
        postThumbnail: postData.postThumbnail || undefined,
        customPublicReply: sanitizeText(postData.customPublicReply),
        customInboxMessage: sanitizeText(postData.customInboxMessage),
        status: postData.status || "Active",
        watcherStatus: "IDLE",
        createdAt: new Date().toISOString(),
      }

      saveMonitoredPosts((prev) => [newPost, ...prev])

      // Immediately add the saved post to Live Stream (comments)
      const streamEntry = buildStreamItemFromPost(newPost)
      saveComments((prev) => {
        const filtered = prev.filter(
          (c) =>
            c.id !== streamEntry.id &&
            !c.id.startsWith("cm-10") &&
            !doesCommentMatchMonitoredPost(c, newPost)
        )
        return [streamEntry, ...filtered]
      })

      return newPost
    },
    [monitoredPosts.length, saveMonitoredPosts, saveComments, buildStreamItemFromPost]
  )

  const updateMonitoredPost = useCallback(
    (id: string, updates: Partial<MonitoredPostItem>) => {
      let updatedPostSnapshot: MonitoredPostItem | null = null
      saveMonitoredPosts((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p
          const nextPost: MonitoredPostItem = {
            ...p,
            ...updates,
            customPublicReply:
              updates.customPublicReply !== undefined
                ? sanitizeText(updates.customPublicReply)
                : p.customPublicReply,
            customInboxMessage:
              updates.customInboxMessage !== undefined
                ? sanitizeText(updates.customInboxMessage)
                : p.customInboxMessage,
          }
          updatedPostSnapshot = nextPost
          return nextPost
        })
      )

      // Sync updates into Live Stream (comments)
      saveComments((prev) => {
        if (!updatedPostSnapshot) return prev
        const snap = updatedPostSnapshot
        const displayAccount =
          snap.sourceType === "Group"
            ? snap.accountName || snap.targetName
            : snap.targetName || snap.accountName
        let matchedAny = false
        const nextList = prev.map((c) => {
          if (c.id === `stream-${id}` || doesCommentMatchMonitoredPost(c, snap)) {
            matchedAny = true
            return {
              ...c,
              postId: snap.postId,
              postTitle: snap.postTitle,
              postUrl: snap.postUrl,
              postThumbnail: snap.postThumbnail || c.postThumbnail,
              pageName: displayAccount,
              accountId: snap.targetId,
              accountName: displayAccount,
              sourceType: snap.sourceType,
              groupName: snap.groupName || (snap.sourceType === "Group" ? snap.targetName : undefined),
              publicReply: snap.customPublicReply,
              privateInboxMessage: snap.sendPrivateInbox ? snap.customInboxMessage : undefined,
            }
          }
          return c
        })
        if (!matchedAny) {
          return [buildStreamItemFromPost(snap), ...nextList]
        }
        return nextList
      })
    },
    [saveMonitoredPosts, saveComments, buildStreamItemFromPost]
  )

  const toggleMonitoredPostStatus = useCallback(
    (id: string) => {
      saveMonitoredPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: p.status === "Active" ? "Paused" : "Active" } : p))
      )
    },
    [saveMonitoredPosts]
  )

  const deleteMonitoredPost = useCallback(
    (id: string) => {
      const targetPost = monitoredPosts.find((p) => p.id === id)
      saveMonitoredPosts((prev) => prev.filter((p) => p.id !== id))
      saveComments((prev) =>
        prev.filter(
          (c) =>
            c.id !== `stream-${id}` &&
            !(targetPost && doesCommentMatchMonitoredPost(c, targetPost))
        )
      )
    },
    [monitoredPosts, saveMonitoredPosts, saveComments]
  )

  // Auto-sync saved Monitored Posts into Live Stream (comments) and clean up stale demo seed items
  useEffect(() => {
    if (!isLoaded || monitoredPosts.length === 0) return

    const hasRealUserPosts = monitoredPosts.some((p) => !p.id.startsWith("mp-default-"))
    if (hasRealUserPosts && monitoredPosts.some((p) => p.id.startsWith("mp-default-"))) {
      saveMonitoredPosts((prev) => prev.filter((p) => !p.id.startsWith("mp-default-")))
      return
    }

    const activePosts = hasRealUserPosts
      ? monitoredPosts.filter((p) => !p.id.startsWith("mp-default-"))
      : monitoredPosts

    const needsDemoCleanup =
      hasRealUserPosts &&
      comments.some(
        (c) =>
          c.id.startsWith("cm-10") ||
          (c.postUrl || "").includes("892168940637389/posts/1020304050") ||
          (c.postUrl || "").includes("groups/pureorganicfoodbd")
      )

    const missingPosts = activePosts.filter(
      (p) => !comments.some((c) => c.id === `stream-${p.id}` || doesCommentMatchMonitoredPost(c, p))
    )

    const outOfSyncPosts = activePosts.filter((p) =>
      comments.some(
        (c) =>
          (c.id === `stream-${p.id}` || doesCommentMatchMonitoredPost(c, p)) &&
          ((p.postThumbnail && c.postThumbnail !== p.postThumbnail) ||
            (p.postTitle && c.postTitle !== p.postTitle) ||
            (p.targetName && p.sourceType !== "Group" && c.accountName !== p.targetName))
      )
    )

    if (needsDemoCleanup || missingPosts.length > 0 || outOfSyncPosts.length > 0) {
      saveComments((prev) => {
        let next = hasRealUserPosts
          ? prev.filter(
              (c) =>
                !c.id.startsWith("cm-10") &&
                !(c.postUrl || "").includes("892168940637389/posts/1020304050") &&
                !(c.postUrl || "").includes("groups/pureorganicfoodbd")
            )
          : [...prev]

        next = next.map((c) => {
          const matched = activePosts.find(
            (p) => c.id === `stream-${p.id}` || doesCommentMatchMonitoredPost(c, p)
          )
          if (!matched) return c
          const displayAccount =
            matched.sourceType === "Group"
              ? matched.accountName || matched.targetName
              : matched.targetName || matched.accountName
          return {
            ...c,
            postId: matched.postId,
            postTitle: matched.postTitle,
            postUrl: matched.postUrl,
            postThumbnail: matched.postThumbnail || c.postThumbnail,
            pageName: displayAccount,
            accountId: matched.targetId,
            accountName: displayAccount,
            sourceType: matched.sourceType,
            groupName: matched.groupName || (matched.sourceType === "Group" ? matched.targetName : undefined),
            publicReply: c.publicReply || matched.customPublicReply,
            privateInboxMessage:
              c.privateInboxMessage || (matched.sendPrivateInbox ? matched.customInboxMessage : undefined),
          }
        })

        for (const p of [...activePosts].reverse()) {
          const exists = next.some((c) => c.id === `stream-${p.id}` || doesCommentMatchMonitoredPost(c, p))
          if (!exists) {
            next = [buildStreamItemFromPost(p), ...next]
          }
        }

        return next
      })
    }
  }, [isLoaded, monitoredPosts, comments, saveComments, saveMonitoredPosts, buildStreamItemFromPost])

  // Intent Classifier Helper based on custom library keywords + built-in rules
  const detectIntent = useCallback(
    (commentText: string): CommentIntentType => {
      const lower = commentText.toLowerCase()

      // First check urgent complaint / complex review triggers
      if (
        lower.includes("সমস্যা") ||
        lower.includes("অভিযোগ") ||
        lower.includes("ফেইক") ||
        lower.includes("কল দেয়নি") ||
        lower.includes("পাইনি") ||
        lower.includes("দেরি")
      ) {
        // Check if user defined a custom rule with matching keyword first
        const customNeedsReview = library.find(
          (t) =>
            t.category === "Needs Review" &&
            t.keywords.some((kw) => kw.trim() && lower.includes(kw.trim().toLowerCase()))
        )
        if (customNeedsReview) return "Needs Review"
        return "Needs Review"
      }

      // Check custom AI Knowledgebase rules by user-defined trigger keywords
      for (const tmpl of library) {
        if (
          tmpl.keywords &&
          tmpl.keywords.some((kw) => kw.trim().length > 0 && lower.includes(kw.trim().toLowerCase()))
        ) {
          return tmpl.category
        }
      }

      if (
        lower.includes("দাম") ||
        lower.includes("price") ||
        lower.includes("কত") ||
        lower.includes("টাকা") ||
        lower.includes("cost") ||
        lower.includes("koto") ||
        lower.includes("dam")
      ) {
        return "Price Query"
      }
      if (
        lower.includes("ডেলিভারি") ||
        lower.includes("delivery") ||
        lower.includes("কুরিয়ার") ||
        lower.includes("কুরিয়ার") ||
        lower.includes("চার্জ") ||
        lower.includes("cod")
      ) {
        return "Delivery Query"
      }
      if (
        lower.includes("স্টক") ||
        lower.includes("stock") ||
        lower.includes("আছে") ||
        lower.includes("কালার") ||
        lower.includes("color") ||
        lower.includes("ache")
      ) {
        return "Stock Query"
      }
      if (
        lower.includes("ওয়ারেন্টি") ||
        lower.includes("warranty") ||
        lower.includes("গ্যারান্টি") ||
        lower.includes("guarantee")
      ) {
        return "Warranty Query"
      }
      if (
        lower.includes("ঠিকানা") ||
        lower.includes("location") ||
        lower.includes("শোরুম") ||
        lower.includes("দোকান") ||
        lower.includes("address")
      ) {
        return "Location Query"
      }
      return "General Greeting"
    },
    [library]
  )

  // Find best matching AI Knowledgebase template by intent, keyword match, and account/page scope
  const findMatchingTemplate = useCallback(
    (intent: CommentIntentType, commentText?: string, accountOrPageName?: string): CommentLibraryTemplate | undefined => {
      const candidates = library.filter((t) => t.category === intent)
      if (candidates.length === 0) return library[0]

      const lowerText = (commentText || "").toLowerCase()
      const lowerAcc = (accountOrPageName || "").toLowerCase()

      let best = candidates[0]
      let bestScore = -1

      for (const tmpl of candidates) {
        let score = 0
        if (lowerText && tmpl.keywords.some((k) => k.trim() && lowerText.includes(k.trim().toLowerCase()))) {
          score += 3
        }
        if (lowerAcc && tmpl.targetScope && tmpl.targetScope.toLowerCase().includes(lowerAcc)) {
          score += 2
        }
        if (score > bestScore) {
          bestScore = score
          best = tmpl
        }
      }
      return best
    },
    [library]
  )

  const incrementTemplateUsage = useCallback(
    (templateId?: string) => {
      if (!templateId) return
      saveLibrary((prev) =>
        prev.map((t) => (t.id === templateId ? { ...t, usesCount: (t.usesCount || 0) + 1 } : t))
      )
    },
    [saveLibrary]
  )

  // Add simulated or incoming webhook comment
  const addIncomingComment = useCallback(
    (
      comment: Omit<CommentItem, "id" | "receivedAt" | "status" | "suggestions" | "intent"> & {
        autoReplyNow?: boolean
        simulateFailure?: boolean
        sendInbox?: boolean
        customPublicReply?: string
        customInboxReply?: string
      }
    ) => {
      const detectedIntent = detectIntent(comment.userComment)
      const matchedPost = findMonitoredPostForComment(comment.postId, comment.postUrl, comment.postTitle)
      const bestTemplate = findMatchingTemplate(
        detectedIntent,
        comment.userComment,
        comment.accountName || comment.pageName
      )
      const matchingTemplates = library.filter((t) => t.category === detectedIntent)

      const rawPublic =
        comment.customPublicReply ||
        matchedPost?.customPublicReply ||
        bestTemplate?.publicReply ||
        "ধন্যবাদ ভাইয়া! বিস্তারিত তথ্য আপনার ইনবক্সে পাঠানো হয়েছে।"
      const rawInbox =
        comment.customInboxReply ||
        matchedPost?.customInboxMessage ||
        bestTemplate?.privateInboxReply ||
        "আসসালামু আলাইকুম! প্রোডাক্টটির স্পেশাল অফার প্রাইজ ২,৪৯০ টাকা। অর্ডার করতে আপনার নাম, ঠিকানা ও মোবাইল নম্বর দিন।"

      const defaultPublic = rawPublic.replace(/\{\{name\}\}/gi, comment.userName || "ভাইয়া")
      const defaultInbox = rawInbox.replace(/\{\{name\}\}/gi, comment.userName || "সম্মানিত গ্রাহক")

      const suggestions =
        matchingTemplates.length > 0
          ? Array.from(new Set([defaultPublic, ...matchingTemplates.map((t) => t.publicReply)]))
          : [
              defaultPublic,
              "আসসালামু আলাইকুম! বিস্তারিত জানতে ইনবক্স মেসেজ চেক করুন।",
            ]

      const sourceType: CommentSourceType =
        comment.sourceType ||
        matchedPost?.sourceType ||
        (comment.groupName ? "Group" : comment.pageName.includes("ID") ? "Personal ID" : "Page")

      const isSimulatedFail = Boolean(comment.simulateFailure)
      const isPostActive = matchedPost ? matchedPost.status === "Active" : true
      const shouldAuto = Boolean(
        !isSimulatedFail && isPostActive && comment.autoReplyNow && detectedIntent !== "Needs Review"
      )
      const shouldSendInbox =
        comment.sendInbox !== undefined
          ? Boolean(comment.sendInbox)
          : matchedPost
          ? matchedPost.sendPrivateInbox
          : true

      const templateIdToCredit = matchedPost?.templateId || bestTemplate?.id
      if ((shouldAuto || isSimulatedFail) && templateIdToCredit) {
        incrementTemplateUsage(templateIdToCredit)
      }

      const newComment: CommentItem = {
        ...comment,
        id: `cm-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        postId: comment.postId || matchedPost?.postId || `post_${Date.now()}`,
        postUrl: comment.postUrl || matchedPost?.postUrl,
        postThumbnail: comment.postThumbnail || matchedPost?.postThumbnail || DEFAULT_POST_THUMBNAIL,
        sourceType,
        accountName: comment.accountName || matchedPost?.accountName || comment.pageName,
        accountId: comment.accountId || matchedPost?.targetId || "page-care-hub",
        groupName: comment.groupName || matchedPost?.groupName,
        intent: detectedIntent,
        receivedAt: "Just now",
        status: isSimulatedFail ? "Failed" : shouldAuto ? "Replied" : "Pending",
        nestedReplyStatus: isSimulatedFail || shouldAuto ? "Sent" : "Pending",
        inboxStatus: isSimulatedFail
          ? "Failed"
          : shouldAuto
          ? shouldSendInbox
            ? "Sent"
            : "Skipped"
          : "Pending",
        inboxDeliveryMethod:
          comment.inboxDeliveryMethod ||
          (sourceType === "Page" ? "Page Send Message Modal" : "Direct Messenger Bot"),
        failureReason: isSimulatedFail
          ? "Messenger DOM modal timeout / Rate-limit — 1-Click Retry ready"
          : undefined,
        latencyMs: shouldAuto ? Math.floor(1400 + Math.random() * 1100) : undefined,
        replyMode: shouldAuto || isSimulatedFail ? "Auto" : undefined,
        publicReply: isSimulatedFail || shouldAuto ? defaultPublic : undefined,
        privateInboxMessage:
          isSimulatedFail || (shouldAuto && shouldSendInbox) ? defaultInbox : undefined,
        repliedAt: shouldAuto ? new Date().toISOString() : undefined,
        suggestions,
      }

      saveComments((prev) => [newComment, ...prev])
      return newComment
    },
    [
      detectIntent,
      findMatchingTemplate,
      findMonitoredPostForComment,
      incrementTemplateUsage,
      library,
      saveComments,
    ]
  )

  // Mark Comment as Replied
  const markReplied = useCallback(
    (
      commentId: string,
      publicReply: string,
      privateInboxMessage?: string,
      options?: {
        replyMode?: "Auto" | "Manual"
        inboxDeliveryMethod?: CommentItem["inboxDeliveryMethod"]
        latencyMs?: number
      }
    ) => {
      saveComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                status: "Replied",
                nestedReplyStatus: "Sent",
                inboxStatus: privateInboxMessage ? "Sent" : "Skipped",
                inboxDeliveryMethod: options?.inboxDeliveryMethod || c.inboxDeliveryMethod || "Page Send Message Modal",
                failureReason: undefined,
                replyMode: options?.replyMode || "Manual",
                latencyMs: options?.latencyMs || c.latencyMs || 1650,
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

  // Retry a Failed Comment / Inbox Delivery (deterministic synchronous return)
  const retryFailedComment = useCallback(
    (commentId: string, customPublicReply?: string, customInboxReply?: string) => {
      const existing = comments.find((c) => c.id === commentId)
      const resolvedPub =
        customPublicReply ||
        existing?.publicReply ||
        existing?.suggestions?.[0] ||
        "ধন্যবাদ ভাইয়া! ইনবক্স চেক করুন।"
      const resolvedInb =
        customInboxReply ||
        existing?.privateInboxMessage ||
        "আসসালামু আলাইকুম! আপনার কাঙ্ক্ষিত প্রোডাক্টটির বিস্তারিত তথ্য ও অফার প্রাইজ পাঠানো হলো।"

      const retriedSnapshot: CommentItem | null = existing
        ? {
            ...existing,
            status: "Replied",
            nestedReplyStatus: "Sent",
            inboxStatus: "Sent",
            failureReason: undefined,
            retryCount: (existing.retryCount || 0) + 1,
            latencyMs: 1520,
            publicReply: resolvedPub,
            privateInboxMessage: resolvedInb,
            repliedAt: new Date().toISOString(),
          }
        : null

      saveComments((prev) =>
        prev.map((c) => {
          if (c.id !== commentId) return c
          const pub = customPublicReply || c.publicReply || c.suggestions[0] || "ধন্যবাদ ভাইয়া! ইনবক্স চেক করুন।"
          const inb =
            customInboxReply ||
            c.privateInboxMessage ||
            "আসসালামু আলাইকুম! আপনার কাঙ্ক্ষিত প্রোডাক্টটির বিস্তারিত তথ্য ও অফার প্রাইজ পাঠানো হলো।"
          return {
            ...c,
            status: "Replied",
            nestedReplyStatus: "Sent",
            inboxStatus: "Sent",
            failureReason: undefined,
            retryCount: (c.retryCount || 0) + 1,
            latencyMs: 1520,
            publicReply: pub,
            privateInboxMessage: inb,
            repliedAt: new Date().toISOString(),
          }
        })
      )
      return retriedSnapshot
    },
    [comments, saveComments]
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
        id: `log-rep-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
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
    monitoredPosts,
    isLoaded,
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
  }
}
