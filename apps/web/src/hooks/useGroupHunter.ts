"use client"

import { useState, useEffect, useCallback } from "react"

export interface FacebookActiveGroup {
  id: string
  name: string
  url: string
  country: string
  category:
    | "Fashion & Lifestyle"
    | "E-Commerce & Digital"
    | "Smart Gadgets & Tech"
    | "Food & Organic"
    | "Buy & Sell Market"
    | "Affiliate & Deals"
  niche: string
  memberCount: number
  activeMembersEst: number
  dailyPostFrequency: number
  autoApproval: boolean
  activityScore: number
  engagementPrediction: number
  isSavedToPostGroup: boolean
  discoveredAt: string
  isLiveHunted?: boolean
  isLiveExtracted?: boolean
  joinStatus?: "JOINED" | "REQUESTED" | "NONE"
}

export interface MessengerGroupLink {
  id: string
  name: string
  inviteUrl: string
  country: string
  category:
    | "Buy & Sell Community"
    | "DropShipping & E-Com"
    | "Resellers Wholesale"
    | "Gadget Hunters"
    | "Affiliate Marketing"
    | "Freelancing Hub"
  niche: string
  memberCount: number
  maxCapacity: number
  messagesLast24h: number
  activeChatters: number
  lastMessageTime: string
  activityScore: number
  status: "Active" | "High Activity" | "Almost Full" | "Full"
  discoveredAt: string
}

export interface GroupHunterSessionInfo {
  hasCookie: boolean
  cUserId: string
  accountName: string
  botStatus: string
  authError: string | null
  updatedAt: string | null
}

export interface GroupHunterScanState {
  isScanning: boolean
  keyword: string
  currentStepLabel: string
  progress: number
  lastDiscoveredCount: number
}

const STORAGE_KEY_POST_GROUP_CUSTOM = "bmt_saved_custom_groups"

const sanitizeText = (text: string): string => {
  return text
    .replace(
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{25A0}-\u{25FF}\u{2B50}\u{2713}\u{2714}\u{2705}]/gu,
      ""
    )
    .replace(/\s+/g, " ")
    .trim()
}

export function useGroupHunter() {
  const [fbGroups, setFbGroups] = useState<FacebookActiveGroup[]>([])
  const [msgrGroups, setMsgrGroups] = useState<MessengerGroupLink[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const [sessionInfo, setSessionInfo] = useState<GroupHunterSessionInfo>({
    hasCookie: true,
    cUserId: "61560588090925",
    accountName: "Rasidul Islam Sajib — Personal ID (61560588090925)",
    botStatus: "CONNECTED",
    authError: null,
    updatedAt: null,
  })

  const [scanState, setScanState] = useState<GroupHunterScanState>({
    isScanning: false,
    keyword: "",
    currentStepLabel: "Ready — যেকোনো কি-ওয়ার্ড লিখে রিয়েল ফেসবুক থেকে লাইভ গ্রুপ সার্চ করুন",
    progress: 0,
    lastDiscoveredCount: 0,
  })

  const fetchLiveState = useCallback(async () => {
    try {
      const res = await fetch("/api/facebook-bot/group-hunter", { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      if (!data.success) return

      if (data.session) setSessionInfo(data.session)
      if (Array.isArray(data.fbGroups)) setFbGroups(data.fbGroups)
      if (Array.isArray(data.msgrGroups)) setMsgrGroups(data.msgrGroups)
      if (data.scanState) {
        setScanState(data.scanState)
        setIsScanning(Boolean(data.scanState.isScanning))
      }
    } catch {
      // ignore transient network errors
    } finally {
      setIsLoaded(true)
    }
  }, [])

  useEffect(() => {
    fetchLiveState()
    const timer = setInterval(() => {
      fetchLiveState()
    }, 2500)
    return () => clearInterval(timer)
  }, [fetchLiveState])

  // 1. Hunt Live Facebook Groups by Keyword
  const huntGroupsByKeyword = useCallback(
    async (keyword: string, country = "Bangladesh", category = "Buy & Sell Market") => {
      setIsScanning(true)
      try {
        const res = await fetch("/api/facebook-bot/group-hunter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "HUNT_LIVE_GROUPS",
            keyword: keyword.trim() || "Buy and Sell Bangladesh",
            country,
            category,
          }),
        })
        const data = await res.json()
        if (data.success) {
          if (Array.isArray(data.fbGroups)) setFbGroups(data.fbGroups)
          if (Array.isArray(data.msgrGroups)) setMsgrGroups(data.msgrGroups)
          if (data.scanState) setScanState(data.scanState)
        }
        return data
      } finally {
        setTimeout(() => setIsScanning(false), 1800)
      }
    },
    []
  )

  // Legacy triggerScan compatibility
  const triggerScan = useCallback(
    async (target: "FB" | "MESSENGER", keyword?: string) => {
      return huntGroupsByKeyword(
        keyword || (target === "FB" ? "Buy and Sell Bangladesh" : "My Joined Groups")
      )
    },
    [huntGroupsByKeyword]
  )

  // 2. Join Group on Real Facebook
  const joinLiveGroup = useCallback(async (groupId: string) => {
    const res = await fetch("/api/facebook-bot/group-hunter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "JOIN_LIVE_GROUP", groupId }),
    })
    const data = await res.json()
    if (data.success && data.scanState) {
      setScanState(data.scanState)
    }
    return data
  }, [])

  // 3. Update Facebook Cookie
  const updateCookieAndConnect = useCallback(
    async (cookieString: string) => {
      const res = await fetch("/api/facebook-bot/group-hunter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_COOKIE",
          cookieString,
        }),
      })
      const data = await res.json()
      await fetchLiveState()
      return data
    },
    [fetchLiveState]
  )

  // 4. Save Group to Module 12 (Post A Group)
  const saveGroupToPostGroup = useCallback(async (group: FacebookActiveGroup) => {
    try {
      const res = await fetch("/api/facebook-bot/group-hunter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SAVE_TO_POST_GROUP", groupId: group.id }),
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.fbGroups)) {
        setFbGroups(data.fbGroups)
      }
      if (typeof window !== "undefined") {
        const rawCustom = localStorage.getItem(STORAGE_KEY_POST_GROUP_CUSTOM)
        const existingCustom = rawCustom ? JSON.parse(rawCustom) : []
        const alreadyInCustom = existingCustom.some(
          (g: { url?: string; name?: string }) => g.url === group.url || g.name === group.name
        )
        if (!alreadyInCustom) {
          existingCustom.unshift({
            id: `imported-${group.id}`,
            name: sanitizeText(group.name),
            url: group.url,
            country: group.country,
            category: group.category,
            members: group.memberCount,
            autoApproval: group.autoApproval,
            status: "Joined",
          })
          localStorage.setItem(STORAGE_KEY_POST_GROUP_CUSTOM, JSON.stringify(existingCustom))
        }
      }
    } catch {}
  }, [])

  // 5. Add Custom FB Group
  const addCustomFbGroup = useCallback(
    async (newGroup: Omit<FacebookActiveGroup, "id" | "discoveredAt" | "isSavedToPostGroup">) => {
      const res = await fetch("/api/facebook-bot/group-hunter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_CUSTOM_FB_GROUP",
          ...newGroup,
          name: sanitizeText(newGroup.name),
          niche: sanitizeText(newGroup.niche),
        }),
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.fbGroups)) setFbGroups(data.fbGroups)
    },
    []
  )

  const addCustomMsgrGroup = useCallback(
    (newMsgr: Omit<MessengerGroupLink, "id" | "discoveredAt">) => {
      const entry: MessengerGroupLink = {
        ...newMsgr,
        name: sanitizeText(newMsgr.name),
        niche: sanitizeText(newMsgr.niche),
        id: `hmsgr-custom-${Date.now()}`,
        discoveredAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      }
      setMsgrGroups((prev) => [entry, ...prev])
    },
    []
  )

  const deleteFbGroup = useCallback(async (id: string) => {
    const res = await fetch("/api/facebook-bot/group-hunter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "DELETE_FB_GROUP", id }),
    })
    const data = await res.json()
    if (data.success && Array.isArray(data.fbGroups)) setFbGroups(data.fbGroups)
  }, [])

  const deleteMsgrGroup = useCallback(async (id: string) => {
    const res = await fetch("/api/facebook-bot/group-hunter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "DELETE_MSGR_GROUP", id }),
    })
    const data = await res.json()
    if (data.success && Array.isArray(data.msgrGroups)) setMsgrGroups(data.msgrGroups)
  }, [])

  const metrics = {
    totalFbGroups: fbGroups.length,
    autoApproveFbGroups: fbGroups.filter((g) => g.autoApproval).length,
    highScoreFbGroups: fbGroups.filter((g) => g.activityScore >= 85).length,
    savedToPostGroupCount: fbGroups.filter((g) => g.isSavedToPostGroup).length,
    totalMsgrGroups: msgrGroups.length,
    activeMsgrGroups: msgrGroups.filter(
      (m) => m.status === "High Activity" || m.status === "Active"
    ).length,
  }

  return {
    isLoaded,
    sessionInfo,
    scanState,
    fbGroups,
    msgrGroups,
    isScanning,
    metrics,
    huntGroupsByKeyword,
    joinLiveGroup,
    updateCookieAndConnect,
    triggerScan,
    saveGroupToPostGroup,
    addCustomFbGroup,
    addCustomMsgrGroup,
    deleteFbGroup,
    deleteMsgrGroup,
  }
}
