"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useFacebookAccounts, FacebookAccountItem } from "./useFacebookAccounts"

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
  totalInteractions: number // 0 likes, 0 comments
  inactivityReason: "Zero Engagement (90+ Days)" | "Never Interacted (180+ Days)" | "Deactivated Profile" | "Ghost Account (365+ Days)"
  engagementScore: number // 0-5%
  isWhitelisted: boolean // VIP protection
  status: "Detected" | "Queued" | "Unfriending" | "Unfriended" | "Ignored"
  unfriendedAt?: string
  lastActionText?: string
}

export interface UnfriendSettings {
  inactivityThresholdDays: number // 30, 60, 90, 180, 365
  dailyUnfriendLimit: number // default: 30
  delaySpeed: "safe_slow" | "normal" | "demo_fast" // safe_slow: 45-90s, normal: 20-45s, demo_fast: 3-8s
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
  progress: number // 0-100
  totalUnfriendedInSession: number
}

const STORAGE_KEY_FRIENDS = "bmt_inactive_friends"
const STORAGE_KEY_SETTINGS = "bmt_unfriend_settings"
const STORAGE_KEY_LOGS = "bmt_unfriend_logs"

export const DEFAULT_SETTINGS: UnfriendSettings = {
  inactivityThresholdDays: 90,
  dailyUnfriendLimit: 30,
  delaySpeed: "demo_fast", // default demo_fast for instant user verification
  autoSkipWhitelisted: true,
  autoTargetDeactivated: true,
  randomizeDelay: true,
}

export const INITIAL_INACTIVE_FRIENDS: InactiveFriend[] = [
  {
    id: "inact-1",
    name: "Sabbir Hossain",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    profileUrl: "https://facebook.com/sabbir.hossain.old",
    accountId: "acc-101",
    accountName: "Tariqul Islam (Dhaka Marketplace Lead)",
    proxyIp: "103.145.23.11:8080",
    daysInactive: 185,
    lastInteractionDate: "2026-03-22",
    totalInteractions: 0,
    inactivityReason: "Never Interacted (180+ Days)",
    engagementScore: 0,
    isWhitelisted: false,
    status: "Detected",
  },
  {
    id: "inact-2",
    name: "Anisur Rahman",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    profileUrl: "https://facebook.com/anisur.rahman.inactive",
    accountId: "acc-101",
    accountName: "Tariqul Islam (Dhaka Marketplace Lead)",
    proxyIp: "103.145.23.11:8080",
    daysInactive: 240,
    lastInteractionDate: "2026-01-26",
    totalInteractions: 0,
    inactivityReason: "Never Interacted (180+ Days)",
    engagementScore: 0,
    isWhitelisted: false,
    status: "Detected",
  },
  {
    id: "inact-3",
    name: "Facebook User (Deactivated)",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
    profileUrl: "https://facebook.com/profile.php?id=883719",
    accountId: "acc-101",
    accountName: "Tariqul Islam (Dhaka Marketplace Lead)",
    proxyIp: "103.145.23.11:8080",
    daysInactive: 320,
    lastInteractionDate: "Never",
    totalInteractions: 0,
    inactivityReason: "Deactivated Profile",
    engagementScore: 0,
    isWhitelisted: false,
    status: "Queued",
  },
  {
    id: "inact-4",
    name: "Mehedi Hasan Rony",
    avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
    profileUrl: "https://facebook.com/mehedi.rony.dormant",
    accountId: "acc-102",
    accountName: "Shakil Ahmed (BD Buyer Network)",
    proxyIp: "103.145.23.12:8080",
    daysInactive: 120,
    lastInteractionDate: "2026-05-25",
    totalInteractions: 0,
    inactivityReason: "Zero Engagement (90+ Days)",
    engagementScore: 0,
    isWhitelisted: false,
    status: "Queued",
  },
  {
    id: "inact-5",
    name: "Rafiqul Islam (VIP Client)",
    avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
    profileUrl: "https://facebook.com/rafiq.vip.partner",
    accountId: "acc-101",
    accountName: "Tariqul Islam (Dhaka Marketplace Lead)",
    proxyIp: "103.145.23.11:8080",
    daysInactive: 95,
    lastInteractionDate: "2026-06-20",
    totalInteractions: 1,
    inactivityReason: "Zero Engagement (90+ Days)",
    engagementScore: 3,
    isWhitelisted: true, // VIP protected
    status: "Ignored",
  },
  {
    id: "inact-6",
    name: "Ghost Bot Profile 99",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    profileUrl: "https://facebook.com/ghost.profile.99",
    accountId: "acc-103",
    accountName: "Rakib Chowdhury (Gadget Seller BD)",
    proxyIp: "103.145.23.13:8080",
    daysInactive: 390,
    lastInteractionDate: "Never",
    totalInteractions: 0,
    inactivityReason: "Ghost Account (365+ Days)",
    engagementScore: 0,
    isWhitelisted: false,
    status: "Queued",
  },
  {
    id: "inact-7",
    name: "Tanvir Ahmed Chowdhury",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    profileUrl: "https://facebook.com/tanvir.ahmed.dormant",
    accountId: "acc-102",
    accountName: "Shakil Ahmed (BD Buyer Network)",
    proxyIp: "103.145.23.12:8080",
    daysInactive: 150,
    lastInteractionDate: "2026-04-26",
    totalInteractions: 0,
    inactivityReason: "Never Interacted (180+ Days)",
    engagementScore: 0,
    isWhitelisted: false,
    status: "Detected",
  },
  {
    id: "inact-8",
    name: "Rubel Mia (Unfriended Test)",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
    profileUrl: "https://facebook.com/rubel.mia.clean",
    accountId: "acc-101",
    accountName: "Tariqul Islam (Dhaka Marketplace Lead)",
    proxyIp: "103.145.23.11:8080",
    daysInactive: 210,
    lastInteractionDate: "2026-02-24",
    totalInteractions: 0,
    inactivityReason: "Never Interacted (180+ Days)",
    engagementScore: 0,
    isWhitelisted: false,
    status: "Unfriended",
    unfriendedAt: "2026-09-23 14:15",
  },
]

export const INITIAL_LOGS: UnfriendAuditLog[] = [
  {
    id: "unf-log-1",
    timestamp: "2026-09-23 14:15:32",
    accountId: "acc-101",
    accountName: "Tariqul Islam (Dhaka Marketplace Lead)",
    proxyIp: "103.145.23.11:8080",
    targetFriendName: "Rubel Mia (Unfriended Test)",
    targetFriendId: "inact-8",
    daysInactive: 210,
    inactivityReason: "Never Interacted (180+ Days)",
    status: "Success",
    details: "Unfriended successfully via residential proxy session. Freeing slot for new targeted leads.",
  },
]

export function useUnfriendInactive() {
  const { accounts } = useFacebookAccounts()
  const [friends, setFriends] = useState<InactiveFriend[]>([])
  const [settings, setSettings] = useState<UnfriendSettings>(DEFAULT_SETTINGS)
  const [logs, setLogs] = useState<UnfriendAuditLog[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>("All")
  const [isScanning, setIsScanning] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Runner state
  const [runnerState, setRunnerState] = useState<UnfriendRunnerState>({
    isRunning: false,
    isPaused: false,
    activeFriendId: null,
    activeFriendName: null,
    activeAccountName: null,
    activeProxy: null,
    currentStepLabel: "Cleanup Engine Idle",
    progress: 0,
    totalUnfriendedInSession: 0,
  })

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Load from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const savedFriends = localStorage.getItem(STORAGE_KEY_FRIENDS)
      setFriends(savedFriends ? JSON.parse(savedFriends) : INITIAL_INACTIVE_FRIENDS)

      const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS)
      setSettings(savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS)

      const savedLogs = localStorage.getItem(STORAGE_KEY_LOGS)
      setLogs(savedLogs ? JSON.parse(savedLogs) : INITIAL_LOGS)
    } catch {
      setFriends(INITIAL_INACTIVE_FRIENDS)
      setSettings(DEFAULT_SETTINGS)
      setLogs(INITIAL_LOGS)
    }

    setIsLoaded(true)
  }, [])

  // Save helpers
  const saveFriends = useCallback((newFriends: InactiveFriend[]) => {
    setFriends(newFriends)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_FRIENDS, JSON.stringify(newFriends))
    }
  }, [])

  const saveSettingsState = useCallback((newSettings: UnfriendSettings) => {
    setSettings(newSettings)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettings))
    }
  }, [])

  const appendLog = useCallback((logEntry: Omit<UnfriendAuditLog, "id" | "timestamp">) => {
    const newLog: UnfriendAuditLog = {
      id: `unf-log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      ...logEntry,
    }
    setLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 150)
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updated))
      }
      return updated
    })
  }, [])

  // 1. Whitelist toggle (VIP protection)
  const toggleWhitelist = useCallback((friendId: string) => {
    const updated = friends.map(f => {
      if (f.id === friendId) {
        const nextWhitelisted = !f.isWhitelisted
        return {
          ...f,
          isWhitelisted: nextWhitelisted,
          status: nextWhitelisted ? ("Ignored" as const) : ("Detected" as const),
        }
      }
      return f
    })
    saveFriends(updated)
  }, [friends, saveFriends])

  // 2. Queue / Dequeue for unfriend
  const toggleQueueFriend = useCallback((friendId: string) => {
    const updated = friends.map(f => {
      if (f.id === friendId && !f.isWhitelisted && f.status !== "Unfriended") {
        const nextStatus = f.status === "Queued" ? "Detected" : "Queued"
        return { ...f, status: nextStatus as InactiveFriend["status"] }
      }
      return f
    })
    saveFriends(updated)
  }, [friends, saveFriends])

  const queueAllInactive = useCallback((filteredIds: string[]) => {
    const idSet = new Set(filteredIds)
    const updated = friends.map(f => {
      if (idSet.has(f.id) && !f.isWhitelisted && f.status === "Detected") {
        return { ...f, status: "Queued" as const }
      }
      return f
    })
    saveFriends(updated)
  }, [friends, saveFriends])

  // 3. Unfriend single friend immediately
  const unfriendSingle = useCallback((friendId: string) => {
    const target = friends.find(f => f.id === friendId)
    if (!target) return

    const updated = friends.map(f => {
      if (f.id === friendId) {
        return {
          ...f,
          status: "Unfriended" as const,
          unfriendedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
          lastActionText: "Unfriended manually",
        }
      }
      return f
    })
    saveFriends(updated)

    appendLog({
      accountId: target.accountId,
      accountName: target.accountName,
      proxyIp: target.proxyIp,
      targetFriendName: target.name,
      targetFriendId: target.id,
      daysInactive: target.daysInactive,
      inactivityReason: target.inactivityReason,
      status: "Success",
      details: `Unfriended ${target.name} (${target.daysInactive} days inactive, reason: ${target.inactivityReason}).`,
    })
  }, [friends, saveFriends, appendLog])

  // 4. Inactivity Scan Simulator
  const runInactivityScan = useCallback((accId?: string) => {
    setIsScanning(true)
    setTimeout(() => {
      setIsScanning(false)
      // Reveal any pending detected friends
      const updated = friends.map(f => {
        if (f.status === "Ignored" && !f.isWhitelisted) {
          return { ...f, status: "Detected" as const }
        }
        return f
      })
      saveFriends(updated)
    }, 1800)
  }, [friends, saveFriends])

  // 5. Cleanup Runner
  const stopCleanupRunner = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setRunnerState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      currentStepLabel: "Cleanup Runner Stopped",
      progress: 0,
    }))
  }, [])

  const pauseCleanupRunner = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setRunnerState(prev => ({
      ...prev,
      isPaused: true,
      currentStepLabel: "Cleanup Paused",
    }))
  }, [])

  const processNextUnfriend = useCallback(() => {
    const currentFriends = JSON.parse(localStorage.getItem(STORAGE_KEY_FRIENDS) || "[]") as InactiveFriend[]
    const nextTarget = currentFriends.find(f => f.status === "Queued" && !f.isWhitelisted)

    if (!nextTarget) {
      setRunnerState(prev => ({
        ...prev,
        isRunning: false,
        currentStepLabel: "All Queued Inactive Friends Unfriended! ✓",
        progress: 100,
      }))
      return
    }

    const speedDelayMs = settings.delaySpeed === "demo_fast" ? 3500 : settings.delaySpeed === "normal" ? 15000 : 35000

    // Set to Unfriending
    const inProgressFriends = currentFriends.map(f => {
      if (f.id === nextTarget.id) {
        return { ...f, status: "Unfriending" as const }
      }
      return f
    })
    saveFriends(inProgressFriends)

    setRunnerState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      activeFriendId: nextTarget.id,
      activeFriendName: nextTarget.name,
      activeAccountName: nextTarget.accountName,
      activeProxy: nextTarget.proxyIp,
      currentStepLabel: `Simulating clean removal of ${nextTarget.name} (${nextTarget.inactivityReason})...`,
      progress: 50,
    }))

    timerRef.current = setTimeout(() => {
      // Mark as Unfriended
      const completedFriends = (JSON.parse(localStorage.getItem(STORAGE_KEY_FRIENDS) || "[]") as InactiveFriend[]).map(f => {
        if (f.id === nextTarget.id) {
          return {
            ...f,
            status: "Unfriended" as const,
            unfriendedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
            lastActionText: `Unfriended via ${nextTarget.accountName}`,
          }
        }
        return f
      })
      saveFriends(completedFriends)

      appendLog({
        accountId: nextTarget.accountId,
        accountName: nextTarget.accountName,
        proxyIp: nextTarget.proxyIp,
        targetFriendName: nextTarget.name,
        targetFriendId: nextTarget.id,
        daysInactive: nextTarget.daysInactive,
        inactivityReason: nextTarget.inactivityReason,
        status: "Success",
        details: `Safely unfriended ${nextTarget.name} (${nextTarget.daysInactive} days inactive) via residential proxy session. Account friend slots cleaned.`,
      })

      setRunnerState(prev => ({
        ...prev,
        totalUnfriendedInSession: prev.totalUnfriendedInSession + 1,
        progress: 100,
        currentStepLabel: `Unfriended ${nextTarget.name}! Waiting safety pause...`,
      }))

      // Inter-action delay
      const pauseMs = settings.delaySpeed === "demo_fast" ? 2000 : 8000
      timerRef.current = setTimeout(() => {
        processNextUnfriend()
      }, pauseMs)

    }, speedDelayMs)
  }, [settings, saveFriends, appendLog])

  const startCleanupRunner = useCallback(() => {
    // Check if there are queued friends
    const hasQueued = friends.some(f => f.status === "Queued" && !f.isWhitelisted)
    if (!hasQueued) {
      // auto queue first 2 detected inactive friends
      const updated = friends.map((f, i) => {
        if (f.status === "Detected" && !f.isWhitelisted && i < 2) {
          return { ...f, status: "Queued" as const }
        }
        return f
      })
      saveFriends(updated)
    }

    setRunnerState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      currentStepLabel: "Initializing Anti-Ban Unfriend Session...",
      progress: 10,
    }))

    setTimeout(() => {
      processNextUnfriend()
    }, 400)
  }, [friends, saveFriends, processNextUnfriend])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  // Metrics
  const metrics = {
    totalDetected: friends.filter(f => f.status !== "Unfriended").length,
    queuedForUnfriend: friends.filter(f => f.status === "Queued" || f.status === "Unfriending").length,
    totalUnfriended: friends.filter(f => f.status === "Unfriended").length,
    whitelistedCount: friends.filter(f => f.isWhitelisted).length,
    deactivatedCount: friends.filter(f => f.inactivityReason === "Deactivated Profile" && f.status !== "Unfriended").length,
    over180DaysCount: friends.filter(f => f.daysInactive >= 180 && f.status !== "Unfriended").length,
  }

  return {
    isLoaded,
    friends,
    settings,
    logs,
    metrics,
    runnerState,
    selectedAccountId,
    setSelectedAccountId,
    isScanning,
    runInactivityScan,
    toggleWhitelist,
    toggleQueueFriend,
    queueAllInactive,
    unfriendSingle,
    startCleanupRunner,
    pauseCleanupRunner,
    stopCleanupRunner,
    saveSettings: saveSettingsState,
    accounts,
  }
}
