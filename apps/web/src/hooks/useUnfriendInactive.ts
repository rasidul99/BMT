"use client"

import { useState, useEffect, useCallback } from "react"
import { useFacebookAccounts } from "./useFacebookAccounts"

export interface InactiveFriend {
  id: string
  name: string
  avatarUrl: string
  profileUrl: string
  accountId: string
  accountName: string
  proxyIp: string
  daysInactive: number
  lastInteractionDate: string
  totalInteractions: number
  inactivityReason:
    | "Zero Engagement (90+ Days)"
    | "Never Interacted (180+ Days)"
    | "Deactivated Profile"
    | "Ghost Account (365+ Days)"
  engagementScore: number
  isWhitelisted: boolean
  status: "Detected" | "Queued" | "Unfriending" | "Unfriended" | "Ignored"
  unfriendedAt?: string
  lastActionText?: string
}

export interface UnfriendSettings {
  inactivityThresholdDays: number
  dailyUnfriendLimit: number
  delaySpeed: "safe_slow" | "normal" | "demo_fast"
  autoSkipWhitelisted: boolean
  autoTargetDeactivated: boolean
  randomizeDelay: boolean
}

export interface UnfriendAuditLog {
  id: string
  timestamp: string
  accountId: string
  accountName: string
  proxyIp: string
  targetFriendName: string
  targetFriendId: string
  daysInactive: number
  inactivityReason: string
  status: "Success" | "Failed"
  details: string
}

export interface UnfriendRunnerState {
  isRunning: boolean
  isPaused: boolean
  activeFriendId: string | null
  activeFriendName: string | null
  activeAccountName: string | null
  activeProxy: string | null
  currentStepLabel: string
  progress: number
  totalUnfriendedInSession: number
}

export interface LiveUnfriendSessionInfo {
  hasCookie: boolean
  cUserId: string
  accountName: string
  botStatus: string
  authError: string | null
  updatedAt: string | null
}

const STORAGE_KEY_SETTINGS = "bmt_unfriend_settings"

export const DEFAULT_SETTINGS: UnfriendSettings = {
  inactivityThresholdDays: 90,
  dailyUnfriendLimit: 30,
  delaySpeed: "demo_fast",
  autoSkipWhitelisted: true,
  autoTargetDeactivated: true,
  randomizeDelay: true,
}

export function useUnfriendInactive() {
  const { accounts: globalAccounts } = useFacebookAccounts()
  const [friends, setFriends] = useState<InactiveFriend[]>([])
  const [settings, setSettings] = useState<UnfriendSettings>(DEFAULT_SETTINGS)
  const [logs, setLogs] = useState<UnfriendAuditLog[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>("All")
  const [isScanning, setIsScanning] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [sessionInfo, setSessionInfo] = useState<LiveUnfriendSessionInfo>({
    hasCookie: true,
    cUserId: "61560588090925",
    accountName: "Rasidul Islam Sajib — Personal ID (61560588090925)",
    botStatus: "CONNECTED",
    authError: null,
    updatedAt: null,
  })

  const [runnerState, setRunnerState] = useState<UnfriendRunnerState>({
    isRunning: false,
    isPaused: false,
    activeFriendId: null,
    activeFriendName: null,
    activeAccountName: "Rasidul Islam Sajib — Personal ID (61560588090925)",
    activeProxy: "Live Facebook Session",
    currentStepLabel: "Ready — Connected to Real Facebook Session",
    progress: 0,
    totalUnfriendedInSession: 0,
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS)
      if (savedSettings) setSettings(JSON.parse(savedSettings))
    } catch {}
  }, [])

  const fetchLiveState = useCallback(async () => {
    try {
      const res = await fetch("/api/facebook-bot/unfriend-inactive", { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      if (!data.success) return

      if (data.session) setSessionInfo(data.session)
      if (Array.isArray(data.friends)) setFriends(data.friends)
      if (Array.isArray(data.logs)) setLogs(data.logs)
      if (data.runnerState) setRunnerState(data.runnerState)
    } catch {
      // ignore transient poll errors
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

  const saveSettings = useCallback((newSettings: UnfriendSettings) => {
    setSettings(newSettings)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettings))
    }
  }, [])

  // 1. Scan Real Facebook Friends List
  const runInactivityScan = useCallback(async () => {
    setIsScanning(true)
    try {
      const res = await fetch("/api/facebook-bot/unfriend-inactive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SCAN_INACTIVE_FRIENDS",
          accountId: "61560588090925",
          accountName: "Rasidul Islam Sajib — Personal ID (61560588090925)",
        }),
      })
      const data = await res.json()
      if (data.success) {
        if (Array.isArray(data.friends)) setFriends(data.friends)
        if (data.runnerState) setRunnerState(data.runnerState)
      }
      return data
    } finally {
      setTimeout(() => setIsScanning(false), 1800)
    }
  }, [])

  // 2. Save Cookie & Reconnect
  const updateCookieAndConnect = useCallback(
    async (cookieString: string) => {
      const res = await fetch("/api/facebook-bot/unfriend-inactive", {
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

  // 3. Whitelist toggle (VIP protection)
  const toggleWhitelist = useCallback(async (friendId: string) => {
    const res = await fetch("/api/facebook-bot/unfriend-inactive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "TOGGLE_WHITELIST", friendId }),
    })
    const data = await res.json()
    if (data.success && Array.isArray(data.friends)) setFriends(data.friends)
  }, [])

  // 4. Queue / Dequeue for unfriend
  const toggleQueueFriend = useCallback(async (friendId: string) => {
    const res = await fetch("/api/facebook-bot/unfriend-inactive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "TOGGLE_QUEUE_FRIEND", friendId }),
    })
    const data = await res.json()
    if (data.success && Array.isArray(data.friends)) setFriends(data.friends)
  }, [])

  const queueAllInactive = useCallback(async (filteredIds: string[]) => {
    const res = await fetch("/api/facebook-bot/unfriend-inactive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "QUEUE_ALL_INACTIVE", friendIds: filteredIds }),
    })
    const data = await res.json()
    if (data.success && Array.isArray(data.friends)) setFriends(data.friends)
  }, [])

  // 5. Add Custom Friend Profile to Test Unfriending
  const addCustomFriend = useCallback(
    async (payload: {
      name: string
      profileUrl?: string
      daysInactive?: number
      inactivityReason?: InactiveFriend["inactivityReason"]
    }) => {
      const res = await fetch("/api/facebook-bot/unfriend-inactive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_CUSTOM_FRIEND",
          ...payload,
        }),
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.friends)) setFriends(data.friends)
      return data
    },
    []
  )

  // 6. Unfriend single friend immediately on real Facebook
  const unfriendSingle = useCallback(async (friendId: string) => {
    const res = await fetch("/api/facebook-bot/unfriend-inactive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "UNFRIEND_SINGLE", friendId }),
    })
    const data = await res.json()
    if (data.success) {
      if (Array.isArray(data.friends)) setFriends(data.friends)
      if (data.runnerState) setRunnerState(data.runnerState)
    }
    return data
  }, [])

  // 7. Start Bulk Cleanup Runner on Real Facebook
  const startCleanupRunner = useCallback(async () => {
    const res = await fetch("/api/facebook-bot/unfriend-inactive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "START_CLEANUP_RUNNER",
        accountId: "61560588090925",
        accountName: "Rasidul Islam Sajib — Personal ID (61560588090925)",
        settings,
      }),
    })
    const data = await res.json()
    if (data.success) {
      if (Array.isArray(data.friends)) setFriends(data.friends)
      if (data.runnerState) setRunnerState(data.runnerState)
    }
    return data
  }, [settings])

  const pauseCleanupRunner = useCallback(async () => {
    const res = await fetch("/api/facebook-bot/unfriend-inactive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "PAUSE_CLEANUP_RUNNER" }),
    })
    const data = await res.json()
    if (data.success && data.runnerState) setRunnerState(data.runnerState)
  }, [])

  const stopCleanupRunner = useCallback(async () => {
    const res = await fetch("/api/facebook-bot/unfriend-inactive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "STOP_CLEANUP_RUNNER" }),
    })
    const data = await res.json()
    if (data.success && data.runnerState) setRunnerState(data.runnerState)
  }, [])

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
    totalDetected: friends.filter((f) => f.status !== "Unfriended").length,
    queuedForUnfriend: friends.filter((f) => f.status === "Queued" || f.status === "Unfriending")
      .length,
    totalUnfriended: friends.filter((f) => f.status === "Unfriended").length,
    whitelistedCount: friends.filter((f) => f.isWhitelisted).length,
    over180DaysCount: friends.filter((f) => f.daysInactive >= 180 && f.status !== "Unfriended")
      .length,
  }

  return {
    isLoaded,
    sessionInfo,
    friends,
    settings,
    logs,
    metrics,
    runnerState,
    selectedAccountId,
    setSelectedAccountId,
    isScanning,
    runInactivityScan,
    updateCookieAndConnect,
    addCustomFriend,
    toggleWhitelist,
    toggleQueueFriend,
    queueAllInactive,
    unfriendSingle,
    startCleanupRunner,
    pauseCleanupRunner,
    stopCleanupRunner,
    saveSettings,
    accounts,
  }
}
