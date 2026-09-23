"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useFacebookAccounts, FacebookAccountItem } from "./useFacebookAccounts"

export interface TargetLead {
  id: string
  name: string
  avatarUrl: string
  profileUrl: string
  country: string
  city: string
  age: number
  gender: "Female" | "Male"
  niche: "Online Business / Marketing" | "E-Commerce & Shopping" | "Fashion & Beauty" | "Gadgets & Tech" | "Freelancing & Remote Work"
  mutualFriends: number
  engagementScore: number // 0-100%
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
  dailyLimitPerAccount: number // 15
  dailyAcceptLimitPerAccount: number // 40
  delaySpeed: "safe_slow" | "normal" | "demo_fast" // safe_slow: 5-10m, normal: 2-5m, demo_fast: 10-25s
  enableProfileView: boolean // true (10-25s)
  profileViewDurationSec: number
  enableScrollFeed: boolean // true (15-35s)
  scrollFeedDurationSec: number
  enableLikePost: boolean // true
  likeProbability: number // 60%
  autoAcceptMinMutual: number // 3
  autoAcceptTargetGender: "All" | "Female" | "Male"
  autoAcceptCountry: string // "All" or "Bangladesh", "USA", etc.
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
  action: "VIEW_PROFILE" | "SCROLL_TIMELINE" | "LIKE_RECENT_POST" | "SEND_FRIEND_REQUEST" | "AUTO_ACCEPT" | "CANCEL_PENDING"
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
  currentStep: "IDLE" | "VIEWING_PROFILE" | "SCROLLING_FEED" | "LIKING_POST" | "SENDING_REQUEST" | "RANDOM_DELAY"
  currentStepLabel: string
  stepProgress: number // 0-100
  totalProcessedInSession: number
}

const STORAGE_KEY_LEADS = "bmt_friend_target_leads"
const STORAGE_KEY_INCOMING = "bmt_friend_incoming_requests"
const STORAGE_KEY_SETTINGS = "bmt_friend_automation_settings"
const STORAGE_KEY_LOGS = "bmt_friend_execution_logs"
const STORAGE_KEY_QUOTAS = "bmt_friend_account_quotas"

export const DEFAULT_SETTINGS: FriendAutomationSettings = {
  dailyLimitPerAccount: 15,
  dailyAcceptLimitPerAccount: 40,
  delaySpeed: "demo_fast", // default to demo_fast so user can verify visually without 10m pause
  enableProfileView: true,
  profileViewDurationSec: 6,
  enableScrollFeed: true,
  scrollFeedDurationSec: 8,
  enableLikePost: true,
  likeProbability: 75,
  autoAcceptMinMutual: 3,
  autoAcceptTargetGender: "All",
  autoAcceptCountry: "All",
  autoRejectZeroMutual: false,
}

export const INITIAL_TARGET_LEADS: TargetLead[] = [
  {
    id: "lead-1",
    name: "Arifa Rahman Ritu",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    profileUrl: "https://facebook.com/arifa.ritu.biz",
    country: "Bangladesh",
    city: "Dhaka",
    age: 26,
    gender: "Female",
    niche: "E-Commerce & Shopping",
    mutualFriends: 18,
    engagementScore: 94,
    status: "Discovered",
    addedAt: "2026-09-23 10:15",
  },
  {
    id: "lead-2",
    name: "Mahmudul Hasan Tanvir",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    profileUrl: "https://facebook.com/tanvir.marketing.bd",
    country: "Bangladesh",
    city: "Chittagong",
    age: 29,
    gender: "Male",
    niche: "Online Business / Marketing",
    mutualFriends: 24,
    engagementScore: 91,
    status: "Discovered",
    addedAt: "2026-09-23 11:20",
  },
  {
    id: "lead-3",
    name: "Samantha Miller",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    profileUrl: "https://facebook.com/samantha.miller.ecom",
    country: "USA",
    city: "Austin, TX",
    age: 28,
    gender: "Female",
    niche: "Online Business / Marketing",
    mutualFriends: 7,
    engagementScore: 89,
    status: "Discovered",
    addedAt: "2026-09-23 12:00",
  },
  {
    id: "lead-4",
    name: "Nusrat Sharmin Shampa",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    profileUrl: "https://facebook.com/shampa.fashionbd",
    country: "Bangladesh",
    city: "Dhaka",
    age: 24,
    gender: "Female",
    niche: "Fashion & Beauty",
    mutualFriends: 32,
    engagementScore: 96,
    status: "Queued",
    addedAt: "2026-09-23 13:10",
  },
  {
    id: "lead-5",
    name: "David K. Henderson",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    profileUrl: "https://facebook.com/henderson.gadgetreviews",
    country: "USA",
    city: "Miami, FL",
    age: 34,
    gender: "Male",
    niche: "Gadgets & Tech",
    mutualFriends: 5,
    engagementScore: 82,
    status: "Queued",
    addedAt: "2026-09-23 14:00",
  },
  {
    id: "lead-6",
    name: "Kamrul Ahsan Joy",
    avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
    profileUrl: "https://facebook.com/kamrul.techgadget",
    country: "Bangladesh",
    city: "Sylhet",
    age: 27,
    gender: "Male",
    niche: "Gadgets & Tech",
    mutualFriends: 14,
    engagementScore: 87,
    status: "Queued",
    addedAt: "2026-09-23 14:30",
  },
  {
    id: "lead-7",
    name: "Jessica Davis",
    avatarUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80",
    profileUrl: "https://facebook.com/jessica.beautyboutique",
    country: "UK",
    city: "Manchester",
    age: 25,
    gender: "Female",
    niche: "Fashion & Beauty",
    mutualFriends: 9,
    engagementScore: 85,
    status: "Sent",
    assignedAccountName: "Tariqul Islam (Dhaka Marketplace Lead)",
    assignedProxy: "103.145.23.11:8080",
    addedAt: "2026-09-22 09:10",
    sentAt: "2026-09-22 10:12",
    lastActionText: "Friend Request Dispatched after profile view & like",
  },
  {
    id: "lead-8",
    name: "Fahim Shahriar",
    avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
    profileUrl: "https://facebook.com/fahim.freelancebd",
    country: "Bangladesh",
    city: "Rajshahi",
    age: 23,
    gender: "Male",
    niche: "Freelancing & Remote Work",
    mutualFriends: 21,
    engagementScore: 93,
    status: "Sent",
    assignedAccountName: "Shakil Ahmed (BD Buyer Network)",
    assignedProxy: "103.145.23.12:8080",
    addedAt: "2026-09-22 11:00",
    sentAt: "2026-09-22 12:45",
    lastActionText: "Friend Request Dispatched after feed scroll",
  },
]

export const INITIAL_INCOMING_REQUESTS: IncomingFriendRequest[] = [
  {
    id: "inc-1",
    name: "Sadia Sultana Mim",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    profileUrl: "https://facebook.com/sadia.mim.resell",
    country: "Bangladesh",
    city: "Dhaka",
    age: 23,
    gender: "Female",
    mutualFriends: 12,
    bio: "Online Boutique Owner | Modest Fashion Brand",
    receivedAt: "15 minutes ago",
    status: "Pending",
  },
  {
    id: "inc-2",
    name: "Zubayer Al Mahmud",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    profileUrl: "https://facebook.com/zubayer.darazseller",
    country: "Bangladesh",
    city: "Chittagong",
    age: 31,
    gender: "Male",
    mutualFriends: 9,
    bio: "Daraz Top Seller | Wholesale Gadgets Distributor",
    receivedAt: "45 minutes ago",
    status: "Pending",
  },
  {
    id: "inc-3",
    name: "Rachel Greenwald",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    profileUrl: "https://facebook.com/rachel.g.dropship",
    country: "USA",
    city: "Atlanta, GA",
    age: 27,
    gender: "Female",
    mutualFriends: 1, // low mutual
    bio: "Shopify store owner & Amazon FBA explorer",
    receivedAt: "2 hours ago",
    status: "Pending",
  },
  {
    id: "inc-4",
    name: "Nazmul Huda Bappy",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    profileUrl: "https://facebook.com/bappy.organicfood",
    country: "Bangladesh",
    city: "Khulna",
    age: 28,
    gender: "Male",
    mutualFriends: 16,
    bio: "Organic Food & Honey Exporter BD",
    receivedAt: "3 hours ago",
    status: "Pending",
  },
  {
    id: "inc-5",
    name: "Spam Profile (No Picture)",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
    profileUrl: "https://facebook.com/profile.php?id=992837",
    country: "Unknown",
    city: "Unknown",
    age: 0,
    gender: "Male",
    mutualFriends: 0,
    bio: "Cryptocurrency high profit instant deposit bot",
    receivedAt: "5 hours ago",
    status: "Pending",
  },
]

export const INITIAL_LOGS: FriendExecutionLog[] = [
  {
    id: "log-1",
    timestamp: "2026-09-23 17:10:45",
    accountId: "acc-101",
    accountName: "Tariqul Islam (Dhaka Marketplace Lead)",
    proxyIp: "103.145.23.11:8080",
    targetProfileName: "Jessica Davis",
    targetProfileId: "lead-7",
    action: "SEND_FRIEND_REQUEST",
    status: "Success",
    durationSec: 24,
    details: "Viewed profile (10s), scrolled feed (8s), liked cover post, dispatched friend request with clean residential proxy session.",
  },
  {
    id: "log-2",
    timestamp: "2026-09-23 16:45:12",
    accountId: "acc-102",
    accountName: "Shakil Ahmed (BD Buyer Network)",
    proxyIp: "103.145.23.12:8080",
    targetProfileName: "Fahim Shahriar",
    targetProfileId: "lead-8",
    action: "SEND_FRIEND_REQUEST",
    status: "Success",
    durationSec: 19,
    details: "Natural delay randomized (2m 15s). Liked recent public post. Sent friend request successfully.",
  },
  {
    id: "log-3",
    timestamp: "2026-09-23 15:30:00",
    accountId: "acc-101",
    accountName: "Tariqul Islam (Dhaka Marketplace Lead)",
    proxyIp: "103.145.23.11:8080",
    targetProfileName: "Nusrat Jahan",
    targetProfileId: "inc-109",
    action: "AUTO_ACCEPT",
    status: "Success",
    durationSec: 12,
    details: "Incoming request accepted. Qualified via mutual friends filter (14 mutuals).",
  },
]

export function useFriendAutomation() {
  const { accounts } = useFacebookAccounts()
  const [leads, setLeads] = useState<TargetLead[]>([])
  const [incoming, setIncoming] = useState<IncomingFriendRequest[]>([])
  const [settings, setSettings] = useState<FriendAutomationSettings>(DEFAULT_SETTINGS)
  const [logs, setLogs] = useState<FriendExecutionLog[]>([])
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Runner state
  const [runnerState, setRunnerState] = useState<RunnerState>({
    isRunning: false,
    isPaused: false,
    activeLeadId: null,
    activeLeadName: null,
    activeAccountId: null,
    activeAccountName: null,
    activeProxy: null,
    currentStep: "IDLE",
    currentStepLabel: "Engine Idle",
    stepProgress: 0,
    totalProcessedInSession: 0,
  })

  // Timer ref for runner loop
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Load from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const savedLeads = localStorage.getItem(STORAGE_KEY_LEADS)
      setLeads(savedLeads ? JSON.parse(savedLeads) : INITIAL_TARGET_LEADS)

      const savedIncoming = localStorage.getItem(STORAGE_KEY_INCOMING)
      setIncoming(savedIncoming ? JSON.parse(savedIncoming) : INITIAL_INCOMING_REQUESTS)

      const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS)
      setSettings(savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS)

      const savedLogs = localStorage.getItem(STORAGE_KEY_LOGS)
      setLogs(savedLogs ? JSON.parse(savedLogs) : INITIAL_LOGS)
    } catch {
      setLeads(INITIAL_TARGET_LEADS)
      setIncoming(INITIAL_INCOMING_REQUESTS)
      setSettings(DEFAULT_SETTINGS)
      setLogs(INITIAL_LOGS)
    }

    setIsLoaded(true)
  }, [])

  // Sync selected accounts when accounts are loaded
  useEffect(() => {
    if (accounts && accounts.length > 0 && selectedAccountIds.length === 0) {
      // select top active accounts by default
      const activeOnes = accounts.filter(a => a.status === "Active" || a.status === "Warming Up").map(a => a.id)
      setSelectedAccountIds(activeOnes.length > 0 ? activeOnes : [accounts[0].id])
    }
  }, [accounts, selectedAccountIds])

  // Save helpers
  const saveLeads = useCallback((newLeads: TargetLead[]) => {
    setLeads(newLeads)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(newLeads))
    }
  }, [])

  const saveIncoming = useCallback((newIncoming: IncomingFriendRequest[]) => {
    setIncoming(newIncoming)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_INCOMING, JSON.stringify(newIncoming))
    }
  }, [])

  const saveSettings = useCallback((newSettings: FriendAutomationSettings) => {
    setSettings(newSettings)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettings))
    }
  }, [])

  const appendLog = useCallback((logEntry: Omit<FriendExecutionLog, "id" | "timestamp">) => {
    const newLog: FriendExecutionLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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

  // 1. Add / Queue leads
  const toggleQueueLead = useCallback((leadId: string) => {
    const updated = leads.map(lead => {
      if (lead.id === leadId) {
        const nextStatus = lead.status === "Queued" ? "Discovered" : "Queued"
        return { ...lead, status: nextStatus as TargetLead["status"] }
      }
      return lead
    })
    saveLeads(updated)
  }, [leads, saveLeads])

  const queueAllFiltered = useCallback((leadIds: string[]) => {
    const idSet = new Set(leadIds)
    const updated = leads.map(lead => {
      if (idSet.has(lead.id) && lead.status === "Discovered") {
        return { ...lead, status: "Queued" as const }
      }
      return lead
    })
    saveLeads(updated)
  }, [leads, saveLeads])

  const addNewCustomLead = useCallback((lead: Omit<TargetLead, "id" | "addedAt" | "status">) => {
    const newLead: TargetLead = {
      ...lead,
      id: `lead-${Date.now()}`,
      addedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      status: "Discovered",
    }
    saveLeads([newLead, ...leads])
  }, [leads, saveLeads])

  // 2. Cancel pending sent request
  const cancelSentRequest = useCallback((leadId: string) => {
    const lead = leads.find(l => l.id === leadId)
    const updated = leads.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          status: "Cancelled" as const,
          lastActionText: "Friend request cancelled by user",
        }
      }
      return l
    })
    saveLeads(updated)

    if (lead) {
      appendLog({
        accountId: lead.assignedAccountId || "acc-101",
        accountName: lead.assignedAccountName || "Facebook Account",
        proxyIp: lead.assignedProxy || "Residential Proxy",
        targetProfileName: lead.name,
        targetProfileId: lead.id,
        action: "CANCEL_PENDING",
        status: "Success",
        durationSec: 3,
        details: `Cancelled pending outgoing friend request to ${lead.name} to preserve account health.`,
      })
    }
  }, [leads, saveLeads, appendLog])

  // 3. Incoming Requests accept / reject
  const acceptIncoming = useCallback((requestId: string) => {
    const item = incoming.find(i => i.id === requestId)
    if (!item) return

    const updated = incoming.map(req => {
      if (req.id === requestId) {
        return {
          ...req,
          status: "Accepted" as const,
          acceptedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
        }
      }
      return req
    })
    saveIncoming(updated)

    appendLog({
      accountId: selectedAccountIds[0] || "acc-101",
      accountName: accounts.find(a => a.id === selectedAccountIds[0])?.name || "Tariqul Islam",
      proxyIp: accounts.find(a => a.id === selectedAccountIds[0])?.proxy.ip || "103.145.23.11",
      targetProfileName: item.name,
      targetProfileId: item.id,
      action: "AUTO_ACCEPT",
      status: "Success",
      durationSec: 5,
      details: `Accepted incoming friend request from ${item.name} (${item.mutualFriends} mutual friends).`,
    })
  }, [incoming, saveIncoming, appendLog, selectedAccountIds, accounts])

  const rejectIncoming = useCallback((requestId: string) => {
    const updated = incoming.map(req => {
      if (req.id === requestId) {
        return { ...req, status: "Rejected" as const }
      }
      return req
    })
    saveIncoming(updated)
  }, [incoming, saveIncoming])

  const batchAcceptQualified = useCallback(() => {
    const minMutual = settings.autoAcceptMinMutual
    const targetGender = settings.autoAcceptTargetGender
    const targetCountry = settings.autoAcceptCountry

    let acceptedCount = 0
    const updated = incoming.map(req => {
      if (req.status !== "Pending") return req

      const mutualPass = req.mutualFriends >= minMutual
      const genderPass = targetGender === "All" || req.gender === targetGender
      const countryPass = targetCountry === "All" || req.country === targetCountry

      if (mutualPass && genderPass && countryPass) {
        acceptedCount++
        return {
          ...req,
          status: "Accepted" as const,
          acceptedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
        }
      } else if (settings.autoRejectZeroMutual && req.mutualFriends === 0) {
        return { ...req, status: "Rejected" as const }
      }
      return req
    })

    saveIncoming(updated)

    if (acceptedCount > 0) {
      appendLog({
        accountId: selectedAccountIds[0] || "acc-101",
        accountName: accounts.find(a => a.id === selectedAccountIds[0])?.name || "Tariqul Islam",
        proxyIp: accounts.find(a => a.id === selectedAccountIds[0])?.proxy.ip || "103.145.23.11",
        targetProfileName: `Batch (${acceptedCount} qualified leads)`,
        targetProfileId: "batch",
        action: "AUTO_ACCEPT",
        status: "Success",
        durationSec: acceptedCount * 4,
        details: `Batch accepted ${acceptedCount} incoming friend requests matching criteria (Min ${minMutual} mutual friends, Gender: ${targetGender}, Country: ${targetCountry}).`,
      })
    }

    return acceptedCount
  }, [incoming, settings, saveIncoming, appendLog, selectedAccountIds, accounts])

  // 4. Live Outgoing Automation Engine Runner
  const stopRunner = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (stepTimerRef.current) clearInterval(stepTimerRef.current)
    setRunnerState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      currentStep: "IDLE",
      currentStepLabel: "Engine Stopped",
      stepProgress: 0,
    }))
  }, [])

  const pauseRunner = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (stepTimerRef.current) clearInterval(stepTimerRef.current)
    setRunnerState(prev => ({
      ...prev,
      isPaused: true,
      currentStepLabel: "Automation Paused",
    }))
  }, [])

  const processNextLead = useCallback(() => {
    // find next queued lead
    const currentLeads = JSON.parse(localStorage.getItem(STORAGE_KEY_LEADS) || "[]") as TargetLead[]
    const nextLead = currentLeads.find(l => l.status === "Queued")

    if (!nextLead) {
      setRunnerState(prev => ({
        ...prev,
        isRunning: false,
        currentStep: "IDLE",
        currentStepLabel: "All Queued Leads Completed! ✓",
        stepProgress: 100,
      }))
      return
    }

    // pick an account with available quota
    const availableAccounts = accounts.filter(a => selectedAccountIds.includes(a.id))
    const assignedAccount = availableAccounts.length > 0
      ? availableAccounts[Math.floor(Math.random() * availableAccounts.length)]
      : { id: "acc-101", name: "Tariqul Islam", proxy: { ip: "103.145.23.11", port: 8080 } }

    const speedMultiplier = settings.delaySpeed === "demo_fast" ? 0.3 : settings.delaySpeed === "normal" ? 1 : 2.5
    const profileViewSec = Math.round((settings.profileViewDurationSec || 6) * speedMultiplier)
    const scrollSec = Math.round((settings.scrollFeedDurationSec || 8) * speedMultiplier)

    // Mark lead as Simulating
    const updatedWithSim = currentLeads.map(l => {
      if (l.id === nextLead.id) {
        return {
          ...l,
          status: "Simulating" as const,
          assignedAccountId: assignedAccount.id,
          assignedAccountName: assignedAccount.name,
          assignedProxy: `${assignedAccount.proxy.ip}:${assignedAccount.proxy.port}`,
          lastActionText: "Simulating human behavior...",
        }
      }
      return l
    })
    saveLeads(updatedWithSim)

    setRunnerState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      activeLeadId: nextLead.id,
      activeLeadName: nextLead.name,
      activeAccountId: assignedAccount.id,
      activeAccountName: assignedAccount.name,
      activeProxy: `${assignedAccount.proxy.ip}:${assignedAccount.proxy.port}`,
      currentStep: "VIEWING_PROFILE",
      currentStepLabel: `Step 1/4: Viewing Profile of ${nextLead.name} (${profileViewSec}s)...`,
      stepProgress: 15,
    }))

    // Step 1: Profile View
    timerRef.current = setTimeout(() => {
      setRunnerState(prev => ({
        ...prev,
        currentStep: "SCROLLING_FEED",
        currentStepLabel: `Step 2/4: Scrolling Timeline & Posts (${scrollSec}s)...`,
        stepProgress: 45,
      }))

      // Step 2: Feed Scroll
      timerRef.current = setTimeout(() => {
        const willLike = settings.enableLikePost && (Math.random() * 100 <= settings.likeProbability)
        setRunnerState(prev => ({
          ...prev,
          currentStep: "LIKING_POST",
          currentStepLabel: willLike ? `Step 3/4: Liking Recent Post by ${nextLead.name}... ✓` : `Step 3/4: Skipped Post Like (Natural randomized behavior)`,
          stepProgress: 75,
        }))

        // Step 3: Like & Dispatch Friend Request
        timerRef.current = setTimeout(() => {
          setRunnerState(prev => ({
            ...prev,
            currentStep: "SENDING_REQUEST",
            currentStepLabel: `Step 4/4: Dispatching Friend Request to ${nextLead.name}... Done ✓`,
            stepProgress: 95,
          }))

          // Update lead status to Sent
          const finishedLeads = (JSON.parse(localStorage.getItem(STORAGE_KEY_LEADS) || "[]") as TargetLead[]).map(l => {
            if (l.id === nextLead.id) {
              return {
                ...l,
                status: "Sent" as const,
                sentAt: new Date().toISOString().replace("T", " ").substring(0, 16),
                lastActionText: `Friend Request Sent via ${assignedAccount.name}`,
              }
            }
            return l
          })
          saveLeads(finishedLeads)

          appendLog({
            accountId: assignedAccount.id,
            accountName: assignedAccount.name,
            proxyIp: `${assignedAccount.proxy.ip}:${assignedAccount.proxy.port}`,
            targetProfileName: nextLead.name,
            targetProfileId: nextLead.id,
            action: "SEND_FRIEND_REQUEST",
            status: "Success",
            durationSec: profileViewSec + scrollSec + 3,
            details: `Simulated profile view (${profileViewSec}s), feed scroll (${scrollSec}s), ${willLike ? "liked recent photo" : "natural skip"}, dispatched friend request via residential proxy.`,
          })

          setRunnerState(prev => ({
            ...prev,
            totalProcessedInSession: prev.totalProcessedInSession + 1,
            stepProgress: 100,
            currentStep: "RANDOM_DELAY",
            currentStepLabel: `Waiting natural inter-request pause (${settings.delaySpeed === "demo_fast" ? "4s" : "2m"})...`,
          }))

          // Delay before next request
          const pauseSec = settings.delaySpeed === "demo_fast" ? 4000 : 15000
          timerRef.current = setTimeout(() => {
            processNextLead()
          }, pauseSec)

        }, 1200)
      }, scrollSec * 1000)
    }, profileViewSec * 1000)
  }, [accounts, selectedAccountIds, settings, saveLeads, appendLog])

  const startRunner = useCallback(() => {
    // Check if there are queued leads
    const hasQueued = leads.some(l => l.status === "Queued")
    if (!hasQueued) {
      // Auto queue first 3 discovered leads for convenience
      const updated = leads.map((l, i) => {
        if (l.status === "Discovered" && i < 3) {
          return { ...l, status: "Queued" as const }
        }
        return l
      })
      saveLeads(updated)
    }

    setRunnerState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      currentStep: "VIEWING_PROFILE",
      currentStepLabel: "Initializing Automation Session...",
      stepProgress: 5,
    }))

    setTimeout(() => {
      processNextLead()
    }, 500)
  }, [leads, saveLeads, processNextLead])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (stepTimerRef.current) clearInterval(stepTimerRef.current)
    }
  }, [])

  // Metrics
  const metrics = {
    totalLeads: leads.length,
    queuedLeads: leads.filter(l => l.status === "Queued" || l.status === "Simulating").length,
    sentToday: leads.filter(l => l.status === "Sent").length,
    acceptedLeads: leads.filter(l => l.status === "Accepted").length,
    pendingIncoming: incoming.filter(i => i.status === "Pending").length,
    acceptedIncoming: incoming.filter(i => i.status === "Accepted").length,
    activeAccountsCount: selectedAccountIds.length,
    totalDailyCapacity: selectedAccountIds.length * settings.dailyLimitPerAccount,
  }

  return {
    isLoaded,
    leads,
    incoming,
    settings,
    logs,
    metrics,
    runnerState,
    selectedAccountIds,
    setSelectedAccountIds,
    saveSettings,
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
