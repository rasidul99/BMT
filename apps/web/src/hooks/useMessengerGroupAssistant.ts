"use client"

import { useState, useEffect, useCallback, useMemo } from "react"

export interface ConnectedMessengerAccount {
  id: string
  name: string
  rawName: string
  sourceType: "Page" | "Personal ID"
  uid: string
  status: string
}

export interface LiveSessionStatus {
  hasCookie: boolean
  hasAccessToken: boolean
  authMode: string
  cUserId: string
  updatedAt: string | null
  is24x7BotActive: boolean
}

export interface MessengerGroup {
  id: string
  name: string
  threadId: string
  threadUrl?: string
  assignedAccountId: string
  assignedAccountName: string
  memberCount: number
  maxCapacity: number
  category:
    | "Resellers Wholesale"
    | "E-Commerce Buyers"
    | "Gadget Hunters"
    | "Organic Food"
    | "General VIP"
  lastMessageSent?: string
  lastMessagePreview?: string
  status: "Active" | "Idle" | "Almost Full" | "Full"
  isLiveMessengerThread?: boolean
  sourceType?: "Page" | "Personal ID"
}

export interface CampaignMessageLog {
  id: string
  groupId: string
  groupName: string
  threadId?: string
  accountId: string
  accountName: string
  sentMessageText: string
  isAiVariant: boolean
  sentAt: string
  status: "DELIVERED_200" | "PENDING" | "FAILED"
  latencyMs: number
}

export interface MessengerGroupCampaign {
  id: string
  title: string
  masterMessage: string
  targetGroupIds: string[]
  messagesPerAccount: number
  delayMinutes: number
  aiVariantEnabled: boolean
  status: "Draft" | "Sending" | "Completed" | "Paused"
  totalTarget: number
  sentCount: number
  progressPercent: number
  startedAt?: string
  logs: CampaignMessageLog[]
}

const DEFAULT_CONNECTED_ACCOUNTS: ConnectedMessengerAccount[] = [
  {
    id: "61595136714776",
    name: "Test Next (Page)",
    rawName: "Test Next",
    sourceType: "Page",
    uid: "61595136714776",
    status: "Active",
  },
  {
    id: "61560588090925",
    name: "Rasidul Islam Sajib — Personal ID (61560588090925)",
    rawName: "Rasidul Islam Sajib",
    sourceType: "Personal ID",
    uid: "61560588090925",
    status: "Active",
  },
  {
    id: "101909799416254",
    name: "Nature's Cure (Page)",
    rawName: "Nature's Cure",
    sourceType: "Page",
    uid: "101909799416254",
    status: "Active",
  },
]

export function useMessengerGroupAssistant() {
  const [groups, setGroups] = useState<MessengerGroup[]>([])
  const [campaigns, setCampaigns] = useState<MessengerGroupCampaign[]>([])
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedMessengerAccount[]>(
    DEFAULT_CONNECTED_ACCOUNTS
  )
  const [sessionInfo, setSessionInfo] = useState<LiveSessionStatus>({
    hasCookie: true,
    hasAccessToken: false,
    authMode: "COOKIE",
    cUserId: "61560588090925",
    updatedAt: null,
    is24x7BotActive: true,
  })
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [activeRunningId, setActiveRunningId] = useState<string | null>(null)

  const fetchLiveState = useCallback(async () => {
    try {
      const res = await fetch("/api/facebook-bot/messenger-group", { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      if (!data.success) return

      if (data.session) {
        setSessionInfo(data.session)
      }
      if (Array.isArray(data.connectedAccounts) && data.connectedAccounts.length > 0) {
        setConnectedAccounts(data.connectedAccounts)
      }
      if (Array.isArray(data.liveGroups)) {
        setGroups(data.liveGroups)
      }
      if (Array.isArray(data.campaigns)) {
        setCampaigns(data.campaigns)
        const sendingCamp = data.campaigns.find((c: MessengerGroupCampaign) => c.status === "Sending")
        setActiveRunningId(sendingCamp ? sendingCamp.id : null)
      }
    } catch {
      // Ignore transient poll errors
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Initial load + automatic polling for live Messenger state & campaign delivery logs
  useEffect(() => {
    fetchLiveState()
    const timer = setInterval(() => {
      fetchLiveState()
    }, 3000)
    return () => clearInterval(timer)
  }, [fetchLiveState])

  // Sync Live Messenger Groups & Threads from Real Facebook Account / Page
  const syncLiveGroups = useCallback(
    async (account: ConnectedMessengerAccount) => {
      setIsSyncing(true)
      try {
        const res = await fetch("/api/facebook-bot/messenger-group", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "SYNC_LIVE_GROUPS",
            targetId: account.id,
            targetName: account.rawName,
            sourceType: account.sourceType,
          }),
        })
        const data = await res.json()
        if (data.success && Array.isArray(data.liveGroups)) {
          setGroups(data.liveGroups)
        }
        return data
      } finally {
        setTimeout(() => setIsSyncing(false), 1200)
      }
    },
    []
  )

  // Add or Create Real Messenger Group
  const addGroup = useCallback(
    async (payload: {
      name: string
      threadUrlOrId?: string
      assignedAccountId: string
      assignedAccountName: string
      sourceType?: "Page" | "Personal ID"
      memberCount: number
      category: MessengerGroup["category"]
      openLiveComposer?: boolean
      welcomeMessage?: string
    }) => {
      const res = await fetch("/api/facebook-bot/messenger-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_OR_CREATE_GROUP",
          ...payload,
        }),
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.liveGroups)) {
        setGroups(data.liveGroups)
      }
      return data
    },
    []
  )

  // Delete Group
  const deleteGroup = useCallback(async (groupId: string) => {
    const res = await fetch("/api/facebook-bot/messenger-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "DELETE_GROUP",
        groupId,
      }),
    })
    const data = await res.json()
    if (data.success && Array.isArray(data.liveGroups)) {
      setGroups(data.liveGroups)
    }
  }, [])

  // Invite / Add Followers to Group
  const addFollowersToGroup = useCallback(async (groupId: string, followerCount: number) => {
    const res = await fetch("/api/facebook-bot/messenger-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "INVITE_FOLLOWERS",
        groupId,
        followerCount,
      }),
    })
    const data = await res.json()
    if (data.success && Array.isArray(data.liveGroups)) {
      setGroups(data.liveGroups)
    }
  }, [])

  // Create & Dispatch Real Bulk Group Campaign on Live Facebook Messenger
  const launchCampaign = useCallback(
    async (
      title: string,
      masterMessage: string,
      selectedGroupIds: string[],
      messagesPerAccount: number,
      delayMinutes: number,
      aiVariantEnabled: boolean
    ) => {
      const selectedGroups = groups.filter((g) => selectedGroupIds.includes(g.id))
      if (selectedGroups.length === 0) return null

      const res = await fetch("/api/facebook-bot/messenger-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DISPATCH_CAMPAIGN",
          title,
          masterMessage,
          selectedGroups,
          messagesPerAccount,
          delayMinutes,
          aiVariantEnabled,
        }),
      })
      const data = await res.json()
      if (data.success) {
        if (Array.isArray(data.campaigns)) {
          setCampaigns(data.campaigns)
        }
        if (data.campaign?.id) {
          setActiveRunningId(data.campaign.id)
        }
      }
      return data
    },
    [groups]
  )

  // Metrics
  const metrics = useMemo(() => {
    const totalGroups = groups.length
    const totalMembers = groups.reduce((acc, g) => acc + (Number(g.memberCount) || 0), 0)
    const totalDelivered = campaigns.reduce((acc, c) => acc + (Number(c.sentCount) || 0), 0)
    const activeCampaignsCount = campaigns.filter((c) => c.status === "Sending").length

    return {
      totalGroups,
      totalMembers,
      totalDelivered,
      activeCampaignsCount,
    }
  }, [groups, campaigns])

  return {
    isLoaded,
    isSyncing,
    sessionInfo,
    connectedAccounts,
    groups,
    campaigns,
    activeRunningId,
    metrics,
    syncLiveGroups,
    addGroup,
    deleteGroup,
    addFollowersToGroup,
    launchCampaign,
  }
}
