"use client"

import { useState, useEffect, useCallback } from "react"
import { useFacebookAccounts } from "./useFacebookAccounts"

export interface TargetLead {
  id: string
  name: string
  avatarUrl: string
  profileUrl: string
  country: string
  city: string
  age: number
  gender: "Female" | "Male"
  niche:
    | "Online Business / Marketing"
    | "E-Commerce & Shopping"
    | "Fashion & Beauty"
    | "Gadgets & Tech"
    | "Freelancing & Remote Work"
  mutualFriends: number
  engagementScore: number
  status: "Discovered" | "Queued" | "Simulating" | "Sent" | "Failed" | "Accepted" | "Cancelled"
  assignedAccountId?: string
  assignedAccountName?: string
  assignedProxy?: string
  addedAt: string
  sentAt?: string
  lastActionText?: string
}

export interface IncomingFriendRequest {
  id: string
  name: string
  avatarUrl: string
  profileUrl: string
  country: string
  city: string
  age: number
  gender: "Female" | "Male"
  mutualFriends: number
  bio: string
  receivedAt: string
  status: "Pending" | "Accepting" | "Accepted" | "Rejected"
  acceptedAt?: string
}

export interface FriendAutomationSettings {
  dailyLimitPerAccount: number
  dailyAcceptLimitPerAccount: number
  delaySpeed: "safe_slow" | "normal" | "demo_fast"
  enableProfileView: boolean
  profileViewDurationSec: number
  enableScrollFeed: boolean
  scrollFeedDurationSec: number
  enableLikePost: boolean
  likeProbability: number
  autoAcceptMinMutual: number
  autoAcceptTargetGender: "All" | "Female" | "Male"
  autoAcceptCountry: string
  autoRejectZeroMutual: boolean
}

export interface FriendExecutionLog {
  id: string
  timestamp: string
  accountId: string
  accountName: string
  proxyIp: string
  targetProfileName: string
  targetProfileId: string
  action:
    | "VIEW_PROFILE"
    | "SCROLL_TIMELINE"
    | "LIKE_RECENT_POST"
    | "SEND_FRIEND_REQUEST"
    | "AUTO_ACCEPT"
    | "CANCEL_PENDING"
  status: "Success" | "Failed"
  durationSec: number
  details: string
}

export interface RunnerState {
  isRunning: boolean
  isPaused: boolean
  activeLeadId: string | null
  activeLeadName: string | null
  activeAccountId: string | null
  activeAccountName: string | null
  activeProxy: string | null
  currentStep:
    | "IDLE"
    | "VIEWING_PROFILE"
    | "SCROLLING_FEED"
    | "LIKING_POST"
    | "SENDING_REQUEST"
    | "RANDOM_DELAY"
  currentStepLabel: string
  stepProgress: number
  totalProcessedInSession: number
}

export interface FriendSessionInfo {
  hasCookie: boolean
  cUserId: string
  botStatus: string
  authError: string | null
  updatedAt: string | null
}

const STORAGE_KEY_SETTINGS = "bmt_friend_automation_settings"

export const DEFAULT_SETTINGS: FriendAutomationSettings = {
  dailyLimitPerAccount: 15,
  dailyAcceptLimitPerAccount: 40,
  delaySpeed: "demo_fast",
  enableProfileView: true,
  profileViewDurationSec: 5,
  enableScrollFeed: true,
  scrollFeedDurationSec: 5,
  enableLikePost: true,
  likeProbability: 75,
  autoAcceptMinMutual: 3,
  autoAcceptTargetGender: "All",
  autoAcceptCountry: "All",
  autoRejectZeroMutual: false,
}

export function useFriendAutomation() {
  const { accounts: globalAccounts } = useFacebookAccounts()
  const [leads, setLeads] = useState<TargetLead[]>([])
  const [incoming, setIncoming] = useState<IncomingFriendRequest[]>([])
  const [settings, setSettings] = useState<FriendAutomationSettings>(DEFAULT_SETTINGS)
  const [logs, setLogs] = useState<FriendExecutionLog[]>([])
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(["61560588090925"])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [sessionInfo, setSessionInfo] = useState<FriendSessionInfo>({
    hasCookie: true,
    cUserId: "61560588090925",
    botStatus: "CONNECTED",
    authError: null,
    updatedAt: null,
  })

  const [runnerState, setRunnerState] = useState<RunnerState>({
    isRunning: false,
    isPaused: false,
    activeLeadId: null,
    activeLeadName: null,
    activeAccountId: "61560588090925",
    activeAccountName: "Rasidul Islam Sajib — Personal ID (61560588090925)",
    activeProxy: "Live Facebook Session",
    currentStep: "IDLE",
    currentStepLabel: "Ready — Connected to Real Facebook Session",
    stepProgress: 0,
    totalProcessedInSession: 0,
  })

  // Load settings from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS)
      if (savedSettings) setSettings(JSON.parse(savedSettings))
    } catch {}
  }, [])

  const fetchLiveState = useCallback(async () => {
    try {
      const res = await fetch("/api/facebook-bot/friend-automation", { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      if (!data.success) return

      if (data.session) setSessionInfo(data.session)
      if (Array.isArray(data.leads)) setLeads(data.leads)
      if (Array.isArray(data.incoming)) setIncoming(data.incoming)
      if (Array.isArray(data.logs)) setLogs(data.logs)
      if (data.runnerState && data.runnerState.currentStep) {
        setRunnerState(data.runnerState)
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

  const saveSettings = useCallback((newSettings: FriendAutomationSettings) => {
    setSettings(newSettings)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettings))
    }
  }, [])

  const syncLiveFriends = useCallback(async () => {
    setIsSyncing(true)
    try {
      const res = await fetch("/api/facebook-bot/friend-automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SYNC_LIVE_FRIENDS",
          accountId: "61560588090925",
          accountName: "Rasidul Islam Sajib — Personal ID (61560588090925)",
        }),
      })
      const data = await res.json()
      await fetchLiveState()
      return data
    } finally {
      setTimeout(() => setIsSyncing(false), 1500)
    }
  }, [fetchLiveState])

  const updateCookieAndConnect = useCallback(
    async (cookieString: string) => {
      const res = await fetch("/api/facebook-bot/friend-automation", {
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

  const toggleQueueLead = useCallback(async (leadId: string) => {
    const res = await fetch("/api/facebook-bot/friend-automation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "TOGGLE_QUEUE_LEAD", leadId }),
    })
    const data = await res.json()
    if (data.success && Array.isArray(data.leads)) setLeads(data.leads)
  }, [])

  const queueAllFiltered = useCallback(async (leadIds: string[]) => {
    const res = await fetch("/api/facebook-bot/friend-automation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "QUEUE_ALL_FILTERED", leadIds }),
    })
    const data = await res.json()
    if (data.success && Array.isArray(data.leads)) setLeads(data.leads)
  }, [])

  const addNewCustomLead = useCallback(
    async (lead: Omit<TargetLead, "id" | "addedAt" | "status">) => {
      const res = await fetch("/api/facebook-bot/friend-automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_CUSTOM_LEAD",
          ...lead,
        }),
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.leads)) setLeads(data.leads)
    },
    []
  )

  const cancelSentRequest = useCallback(async (leadId: string) => {
    const res = await fetch("/api/facebook-bot/friend-automation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "CANCEL_SENT_REQUEST", leadId }),
    })
    const data = await res.json()
    if (data.success) {
      if (Array.isArray(data.leads)) setLeads(data.leads)
      if (Array.isArray(data.logs)) setLogs(data.logs)
    }
  }, [])

  const acceptIncoming = useCallback(async (requestId: string) => {
    const res = await fetch("/api/facebook-bot/friend-automation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ACCEPT_INCOMING",
        requestId,
        accountId: "61560588090925",
        accountName: "Rasidul Islam Sajib — Personal ID (61560588090925)",
      }),
    })
    const data = await res.json()
    if (data.success) {
      if (Array.isArray(data.incoming)) setIncoming(data.incoming)
      if (Array.isArray(data.logs)) setLogs(data.logs)
    }
  }, [])

  const rejectIncoming = useCallback(async (requestId: string) => {
    const res = await fetch("/api/facebook-bot/friend-automation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "REJECT_INCOMING", requestId }),
    })
    const data = await res.json()
    if (data.success && Array.isArray(data.incoming)) setIncoming(data.incoming)
  }, [])

  const batchAcceptQualified = useCallback(async () => {
    const res = await fetch("/api/facebook-bot/friend-automation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "BATCH_ACCEPT_QUALIFIED",
        minMutual: settings.autoAcceptMinMutual,
        accountId: "61560588090925",
        accountName: "Rasidul Islam Sajib — Personal ID (61560588090925)",
      }),
    })
    const data = await res.json()
    if (data.success) {
      if (Array.isArray(data.incoming)) setIncoming(data.incoming)
      if (Array.isArray(data.logs)) setLogs(data.logs)
    }
    return data.acceptedCount || 0
  }, [settings.autoAcceptMinMutual])

  const startRunner = useCallback(async () => {
    const res = await fetch("/api/facebook-bot/friend-automation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "START_OUTGOING_BOT",
        accountId: "61560588090925",
        accountName: "Rasidul Islam Sajib — Personal ID (61560588090925)",
        settings,
      }),
    })
    const data = await res.json()
    if (data.success) {
      if (Array.isArray(data.leads)) setLeads(data.leads)
      if (data.runnerState) setRunnerState(data.runnerState)
    }
  }, [settings])

  const pauseRunner = useCallback(async () => {
    const res = await fetch("/api/facebook-bot/friend-automation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "PAUSE_OUTGOING_BOT" }),
    })
    const data = await res.json()
    if (data.success && data.runnerState) setRunnerState(data.runnerState)
  }, [])

  const stopRunner = useCallback(async () => {
    const res = await fetch("/api/facebook-bot/friend-automation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "STOP_OUTGOING_BOT" }),
    })
    const data = await res.json()
    if (data.success && data.runnerState) setRunnerState(data.runnerState)
  }, [])

  // Ensure Rasidul Islam Sajib Personal ID is always at the top of accounts list
  const accounts = [
    {
      id: "61560588090925",
      name: "Rasidul Islam Sajib — Personal ID (61560588090925)",
      email: "rasidul.sajib@facebook.com",
      uid: "61560588090925",
      status: "Active" as const,
      sourceType: "Personal ID" as const,
      friendsCount: 1420,
      groupsJoined: 18,
      dailyMessagesSent: 12,
      dailyCommentsSent: 8,
      trustScore: 98,
      proxy: {
        ip: "Live Browser Session",
        port: 443,
        country: "BD",
        provider: "Direct FB Session",
        type: "Residential" as const,
      },
      cookieStatus: "Valid" as const,
      lastActive: "Active now",
      avatarUrl:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
    },
    ...(globalAccounts || []).filter((a) => a.uid !== "61560588090925"),
  ]

  const metrics = {
    totalLeads: leads.length,
    queuedLeads: leads.filter((l) => l.status === "Queued" || l.status === "Simulating").length,
    sentToday: leads.filter((l) => l.status === "Sent").length,
    acceptedLeads: leads.filter((l) => l.status === "Accepted").length,
    pendingIncoming: incoming.filter((i) => i.status === "Pending").length,
    acceptedIncoming: incoming.filter((i) => i.status === "Accepted").length,
    activeAccountsCount: Math.max(1, selectedAccountIds.length),
    totalDailyCapacity: Math.max(1, selectedAccountIds.length) * settings.dailyLimitPerAccount,
  }

  return {
    isLoaded,
    isSyncing,
    sessionInfo,
    leads,
    incoming,
    settings,
    logs,
    metrics,
    runnerState,
    selectedAccountIds,
    setSelectedAccountIds,
    saveSettings,
    syncLiveFriends,
    updateCookieAndConnect,
    toggleQueueLead,
    queueAllFiltered,
    addNewCustomLead,
    cancelSentRequest,
    acceptIncoming,
    rejectIncoming,
    batchAcceptQualified,
    startRunner,
    pauseRunner,
    stopRunner,
    accounts,
  }
}
