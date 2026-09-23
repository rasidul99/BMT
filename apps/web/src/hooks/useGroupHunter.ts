"use client"

import { useState, useEffect, useCallback } from "react"

export interface FacebookActiveGroup {
  id: string
  name: string
  url: string
  country: string
  category: "Fashion & Lifestyle" | "E-Commerce & Digital" | "Smart Gadgets & Tech" | "Food & Organic" | "Buy & Sell Market" | "Affiliate & Deals"
  niche: string
  memberCount: number
  activeMembersEst: number
  dailyPostFrequency: number // posts per day
  autoApproval: boolean
  activityScore: number // 0-100
  engagementPrediction: number // 0-100%
  isSavedToPostGroup: boolean
  discoveredAt: string
}

export interface MessengerGroupLink {
  id: string
  name: string
  inviteUrl: string
  country: string
  category: "Buy & Sell Community" | "DropShipping & E-Com" | "Resellers Wholesale" | "Gadget Hunters" | "Affiliate Marketing" | "Freelancing Hub"
  niche: string
  memberCount: number
  maxCapacity: number
  messagesLast24h: number
  activeChatters: number
  lastMessageTime: string
  activityScore: number // 0-100
  status: "Active" | "High Activity" | "Almost Full" | "Full"
  discoveredAt: string
}

const STORAGE_KEY_FB_GROUPS = "bmt_hunted_fb_groups"
const STORAGE_KEY_MSGR_GROUPS = "bmt_hunted_messenger_groups"
const STORAGE_KEY_POST_GROUP_CUSTOM = "bmt_saved_custom_groups"

export const INITIAL_FB_GROUPS: FacebookActiveGroup[] = [
  {
    id: "hfb-1",
    name: "Fashion & Lifestyle BD Buyers Hub (Auto-Approval)",
    url: "https://facebook.com/groups/fashionbd-buyers-hub",
    country: "Bangladesh",
    category: "Fashion & Lifestyle",
    niche: "Clothing, Shoes, Bags, Jewelry",
    memberCount: 142500,
    activeMembersEst: 18400,
    dailyPostFrequency: 52,
    autoApproval: true,
    activityScore: 94,
    engagementPrediction: 91,
    isSavedToPostGroup: false,
    discoveredAt: "2026-09-23 10:15",
  },
  {
    id: "hfb-2",
    name: "Online Business Owners Bangladesh (Sell Anything)",
    url: "https://facebook.com/groups/onlinebiz-bd-official",
    country: "Bangladesh",
    category: "E-Commerce & Digital",
    niche: "Digital Products, Services, Dropshipping",
    memberCount: 89000,
    activeMembersEst: 12100,
    dailyPostFrequency: 38,
    autoApproval: true,
    activityScore: 88,
    engagementPrediction: 85,
    isSavedToPostGroup: true,
    discoveredAt: "2026-09-23 11:20",
  },
  {
    id: "hfb-3",
    name: "Smart Gadgets & Electronics Accessories BD",
    url: "https://facebook.com/groups/gadgetsbd-community-market",
    country: "Bangladesh",
    category: "Smart Gadgets & Tech",
    niche: "Smartwatches, Earbuds, Mobile Accs",
    memberCount: 210000,
    activeMembersEst: 28500,
    dailyPostFrequency: 64,
    autoApproval: true,
    activityScore: 92,
    engagementPrediction: 89,
    isSavedToPostGroup: false,
    discoveredAt: "2026-09-23 12:00",
  },
  {
    id: "hfb-4",
    name: "USA E-Commerce & Shopify Dropshipping Sellers",
    url: "https://facebook.com/groups/usa-ecom-sellers-hub",
    country: "USA",
    category: "E-Commerce & Digital",
    niche: "Shopify, Amazon FBA, TikTok Shop",
    memberCount: 345000,
    activeMembersEst: 42000,
    dailyPostFrequency: 85,
    autoApproval: true,
    activityScore: 96,
    engagementPrediction: 93,
    isSavedToPostGroup: false,
    discoveredAt: "2026-09-23 13:10",
  },
  {
    id: "hfb-5",
    name: "Dhaka Buy and Sell Super Market 24/7",
    url: "https://facebook.com/groups/dhaka-buysell-supermarket",
    country: "Bangladesh",
    category: "Buy & Sell Market",
    niche: "General Buy & Sell, Wholesale, Retail",
    memberCount: 178000,
    activeMembersEst: 19800,
    dailyPostFrequency: 45,
    autoApproval: true,
    activityScore: 84,
    engagementPrediction: 82,
    isSavedToPostGroup: false,
    discoveredAt: "2026-09-23 14:00",
  },
  {
    id: "hfb-6",
    name: "Healthy Food & Organic Products BD",
    url: "https://facebook.com/groups/organicfood-bd-wholesalers",
    country: "Bangladesh",
    category: "Food & Organic",
    niche: "Pure Honey, Ghee, Dry Fruits, Spices",
    memberCount: 45000,
    activeMembersEst: 4200,
    dailyPostFrequency: 16,
    autoApproval: true,
    activityScore: 72,
    engagementPrediction: 68,
    isSavedToPostGroup: false,
    discoveredAt: "2026-09-23 14:30",
  },
  {
    id: "hfb-7",
    name: "UK Amazon & Affiliate Deals Promo Network",
    url: "https://facebook.com/groups/uk-amazon-deals-promo",
    country: "UK",
    category: "Affiliate & Deals",
    niche: "Discount Codes, Cashback, Promo Links",
    memberCount: 112000,
    activeMembersEst: 14500,
    dailyPostFrequency: 29,
    autoApproval: true,
    activityScore: 78,
    engagementPrediction: 76,
    isSavedToPostGroup: false,
    discoveredAt: "2026-09-23 15:00",
  },
  {
    id: "hfb-8",
    name: "USA Smart Tech & Gadget Deals Community",
    url: "https://facebook.com/groups/usa-tech-gadgets-community",
    country: "USA",
    category: "Smart Gadgets & Tech",
    niche: "Laptops, Gaming Gear, Audio Tech",
    memberCount: 185000,
    activeMembersEst: 21300,
    dailyPostFrequency: 48,
    autoApproval: true,
    activityScore: 87,
    engagementPrediction: 84,
    isSavedToPostGroup: false,
    discoveredAt: "2026-09-23 15:45",
  },
]

export const INITIAL_MSGR_GROUPS: MessengerGroupLink[] = [
  {
    id: "hmsg-1",
    name: "BD Wholesalers & Resellers VIP Group 04",
    inviteUrl: "https://m.me/j/AbZ892JkLm19",
    country: "Bangladesh",
    category: "Resellers Wholesale",
    niche: "Cloths, Cosmetics, Jewelry",
    memberCount: 242,
    maxCapacity: 250,
    messagesLast24h: 840,
    activeChatters: 68,
    lastMessageTime: "2 mins ago",
    activityScore: 95,
    status: "High Activity",
    discoveredAt: "2026-09-23 12:30",
  },
  {
    id: "hmsg-2",
    name: "Dhaka Gadget Deals & Import Chat 01",
    inviteUrl: "https://m.me/j/BbK771QwEr32",
    country: "Bangladesh",
    category: "Gadget Hunters",
    niche: "Smartwatch, Airpod, Camera",
    memberCount: 238,
    maxCapacity: 250,
    messagesLast24h: 620,
    activeChatters: 54,
    lastMessageTime: "8 mins ago",
    activityScore: 91,
    status: "Active",
    discoveredAt: "2026-09-23 13:00",
  },
  {
    id: "hmsg-3",
    name: "USA Dropship Winners Chatroom (Verified)",
    inviteUrl: "https://m.me/j/UsA441TyOp90",
    country: "USA",
    category: "DropShipping & E-Com",
    niche: "Winning Products, Ads scaling",
    memberCount: 248,
    maxCapacity: 250,
    messagesLast24h: 1120,
    activeChatters: 94,
    lastMessageTime: "Just now",
    activityScore: 98,
    status: "Almost Full",
    discoveredAt: "2026-09-23 14:15",
  },
  {
    id: "hmsg-4",
    name: "BD Organic Food & Pure Honey Sellers",
    inviteUrl: "https://m.me/j/Org221GheeHoney",
    country: "Bangladesh",
    category: "Buy & Sell Community",
    niche: "Village Foods, Organic Ghee",
    memberCount: 195,
    maxCapacity: 250,
    messagesLast24h: 310,
    activeChatters: 28,
    lastMessageTime: "24 mins ago",
    activityScore: 78,
    status: "Active",
    discoveredAt: "2026-09-23 15:10",
  },
  {
    id: "hmsg-5",
    name: "Affiliate Marketers Daily Deals Group",
    inviteUrl: "https://m.me/j/Aff992ClickPromo",
    country: "USA",
    category: "Affiliate Marketing",
    niche: "CPA Deals, ClickBank, Amazon",
    memberCount: 220,
    maxCapacity: 250,
    messagesLast24h: 490,
    activeChatters: 42,
    lastMessageTime: "12 mins ago",
    activityScore: 85,
    status: "Active",
    discoveredAt: "2026-09-23 15:45",
  },
  {
    id: "hmsg-6",
    name: "UK Online Deals & Voucher Exchange Chat",
    inviteUrl: "https://m.me/j/UkDeals11Voucher",
    country: "UK",
    category: "Buy & Sell Community",
    niche: "Discount Vouchers, Promo codes",
    memberCount: 250,
    maxCapacity: 250,
    messagesLast24h: 980,
    activeChatters: 78,
    lastMessageTime: "5 mins ago",
    activityScore: 93,
    status: "Full",
    discoveredAt: "2026-09-23 16:20",
  },
]

export function useGroupHunter() {
  const [fbGroups, setFbGroups] = useState<FacebookActiveGroup[]>([])
  const [msgrGroups, setMsgrGroups] = useState<MessengerGroupLink[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const savedFb = localStorage.getItem(STORAGE_KEY_FB_GROUPS)
      setFbGroups(savedFb ? JSON.parse(savedFb) : INITIAL_FB_GROUPS)

      const savedMsgr = localStorage.getItem(STORAGE_KEY_MSGR_GROUPS)
      setMsgrGroups(savedMsgr ? JSON.parse(savedMsgr) : INITIAL_MSGR_GROUPS)
    } catch {
      setFbGroups(INITIAL_FB_GROUPS)
      setMsgrGroups(INITIAL_MSGR_GROUPS)
    }

    setIsLoaded(true)
  }, [])

  const saveFbGroups = useCallback((newGroups: FacebookActiveGroup[]) => {
    setFbGroups(newGroups)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_FB_GROUPS, JSON.stringify(newGroups))
    }
  }, [])

  const saveMsgrGroups = useCallback((newGroups: MessengerGroupLink[]) => {
    setMsgrGroups(newGroups)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_MSGR_GROUPS, JSON.stringify(newGroups))
    }
  }, [])

  // 1. Scan Trigger
  const triggerScan = useCallback((type: "FB" | "MESSENGER") => {
    setIsScanning(true)
    setTimeout(() => {
      setIsScanning(false)
    }, 1200)
  }, [])

  // 2. Bridge to Module 12 (Post A Group)
  const saveGroupToPostGroup = useCallback((group: FacebookActiveGroup) => {
    // 1. Mark as saved locally
    const updated = fbGroups.map(g => {
      if (g.id === group.id) {
        return { ...g, isSavedToPostGroup: true }
      }
      return g
    })
    saveFbGroups(updated)

    // 2. Append to bmt_saved_custom_groups for Module 12 Post A Group
    if (typeof window !== "undefined") {
      try {
        const existing = JSON.parse(localStorage.getItem(STORAGE_KEY_POST_GROUP_CUSTOM) || "[]")
        const alreadyIn = existing.some((g: any) => g.id === group.id || g.name === group.name)
        if (!alreadyIn) {
          existing.push({
            id: group.id,
            name: group.name,
            category: group.category === "Fashion & Lifestyle" ? "Fashion & Lifestyle" : "E-Commerce",
            memberCount: group.memberCount,
            privacy: "Public",
            isManagedAdmin: false,
            assignedAccountId: "acc-101",
            url: group.url,
          })
          localStorage.setItem(STORAGE_KEY_POST_GROUP_CUSTOM, JSON.stringify(existing))
        }
      } catch {}
    }
  }, [fbGroups, saveFbGroups])

  // 3. Add Custom Group
  const addCustomFbGroup = useCallback((group: Omit<FacebookActiveGroup, "id" | "discoveredAt" | "isSavedToPostGroup">) => {
    const newGroup: FacebookActiveGroup = {
      ...group,
      id: `hfb-${Date.now()}`,
      discoveredAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      isSavedToPostGroup: false,
    }
    saveFbGroups([newGroup, ...fbGroups])
  }, [fbGroups, saveFbGroups])

  const addCustomMsgrGroup = useCallback((group: Omit<MessengerGroupLink, "id" | "discoveredAt">) => {
    const newGroup: MessengerGroupLink = {
      ...group,
      id: `hmsg-${Date.now()}`,
      discoveredAt: new Date().toISOString().replace("T", " ").substring(0, 16),
    }
    saveMsgrGroups([newGroup, ...msgrGroups])
  }, [msgrGroups, saveMsgrGroups])

  // 4. Delete Groups
  const deleteFbGroup = useCallback((id: string) => {
    saveFbGroups(fbGroups.filter(g => g.id !== id))
  }, [fbGroups, saveFbGroups])

  const deleteMsgrGroup = useCallback((id: string) => {
    saveMsgrGroups(msgrGroups.filter(g => g.id !== id))
  }, [msgrGroups, saveMsgrGroups])

  // Metrics
  const metrics = {
    totalFbGroups: fbGroups.length,
    highScoreFbGroups: fbGroups.filter(g => g.activityScore >= 85).length,
    totalMsgrGroups: msgrGroups.length,
    activeMsgrGroups: msgrGroups.filter(m => m.status === "Active" || m.status === "High Activity").length,
    savedToPostGroupCount: fbGroups.filter(g => g.isSavedToPostGroup).length,
  }

  return {
    isLoaded,
    fbGroups,
    msgrGroups,
    isScanning,
    metrics,
    triggerScan,
    saveGroupToPostGroup,
    addCustomFbGroup,
    addCustomMsgrGroup,
    deleteFbGroup,
    deleteMsgrGroup,
  }
}
