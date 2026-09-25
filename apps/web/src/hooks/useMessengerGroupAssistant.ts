"use client"

import { useState, useEffect, useCallback, useMemo } from "react"

export interface MessengerGroup {
  id: string
  name: string
  threadId: string
  assignedAccountId: string
  assignedAccountName: string
  memberCount: number
  maxCapacity: number
  category: "Resellers Wholesale" | "E-Commerce Buyers" | "Gadget Hunters" | "Organic Food" | "General VIP"
  lastMessageSent?: string
  status: "Active" | "Idle" | "Almost Full" | "Full"
}

export interface CampaignMessageLog {
  id: string
  groupId: string
  groupName: string
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

const STORAGE_KEY_GROUPS = "bmt_messenger_groups"
const STORAGE_KEY_CAMPAIGNS = "bmt_messenger_group_campaigns"

const INITIAL_GROUPS: MessengerGroup[] = [
  {
    id: "grp-msg-1",
    name: "BD Wholesalers & Resellers VIP Group 04",
    threadId: "m_thread_88912301",
    assignedAccountId: "acc-101",
    assignedAccountName: "Farhan Ahmed (Business)",
    memberCount: 242,
    maxCapacity: 250,
    category: "Resellers Wholesale",
    lastMessageSent: "10 mins ago",
    status: "Active",
  },
  {
    id: "grp-msg-2",
    name: "Dhaka Gadget Deals & Import Chat 01",
    threadId: "m_thread_77812302",
    assignedAccountId: "acc-101",
    assignedAccountName: "Farhan Ahmed (Business)",
    memberCount: 238,
    maxCapacity: 250,
    category: "Gadget Hunters",
    lastMessageSent: "1 hour ago",
    status: "Active",
  },
  {
    id: "grp-msg-3",
    name: "USA E-Com Dropship Community Group",
    threadId: "m_thread_66712303",
    assignedAccountId: "acc-102",
    assignedAccountName: "Sarah Jenkins (E-Com)",
    memberCount: 248,
    maxCapacity: 250,
    category: "E-Commerce Buyers",
    lastMessageSent: "3 hours ago",
    status: "Almost Full",
  },
  {
    id: "grp-msg-4",
    name: "BD Organic Food & Pure Honey Sellers",
    threadId: "m_thread_55612304",
    assignedAccountId: "acc-103",
    assignedAccountName: "Tanvir Rahman (Local Sales)",
    memberCount: 195,
    maxCapacity: 250,
    category: "Organic Food",
    lastMessageSent: "Yesterday",
    status: "Idle",
  },
  {
    id: "grp-msg-5",
    name: "Fashion & Lifestyle Retailers Club 02",
    threadId: "m_thread_44512305",
    assignedAccountId: "acc-103",
    assignedAccountName: "Tanvir Rahman (Local Sales)",
    memberCount: 215,
    maxCapacity: 250,
    category: "Resellers Wholesale",
    lastMessageSent: "2 days ago",
    status: "Active",
  },
]

export function useMessengerGroupAssistant() {
  const [groups, setGroups] = useState<MessengerGroup[]>([])
  const [campaigns, setCampaigns] = useState<MessengerGroupCampaign[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeRunningId, setActiveRunningId] = useState<string | null>(null)

  // Initialize
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const savedGroups = localStorage.getItem(STORAGE_KEY_GROUPS)
      setGroups(savedGroups ? JSON.parse(savedGroups) : INITIAL_GROUPS)

      const savedCampaigns = localStorage.getItem(STORAGE_KEY_CAMPAIGNS)
      setCampaigns(savedCampaigns ? JSON.parse(savedCampaigns) : [])
    } catch {
      setGroups(INITIAL_GROUPS)
      setCampaigns([])
    }

    setIsLoaded(true)
  }, [])

  // Save Groups
  const saveGroups = useCallback((newGroups: MessengerGroup[]) => {
    setGroups(newGroups)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(newGroups))
    }
  }, [])

  // Save Campaigns
  const saveCampaigns = useCallback((newCampaigns: MessengerGroupCampaign[]) => {
    setCampaigns(newCampaigns)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(newCampaigns))
    }
  }, [])

  // Add New Messenger Group
  const addGroup = useCallback((group: Omit<MessengerGroup, "id" | "status">) => {
    const newGroup: MessengerGroup = {
      ...group,
      id: `grp-msg-${Date.now()}`,
      status: group.memberCount >= 246 ? "Almost Full" : "Active",
    }
    saveGroups([newGroup, ...groups])
  }, [groups, saveGroups])

  // Invite / Add Followers to Group (Note requirement from Page 3)
  const addFollowersToGroup = useCallback((groupId: string, followerCount: number) => {
    const updated = groups.map((g) => {
      if (g.id === groupId) {
        const newCount = Math.min(g.maxCapacity, g.memberCount + followerCount)
        return {
          ...g,
          memberCount: newCount,
          status: (newCount >= 250 ? "Full" : newCount >= 245 ? "Almost Full" : "Active") as MessengerGroup["status"],
        }
      }
      return g
    })
    saveGroups(updated)
  }, [groups, saveGroups])

  // Create & Dispatch Bulk Group Campaign
  const launchCampaign = useCallback(
    (
      title: string,
      masterMessage: string,
      selectedGroupIds: string[],
      messagesPerAccount: number,
      delayMinutes: number,
      aiVariantEnabled: boolean
    ) => {
      const selectedGroups = groups.filter((g) => selectedGroupIds.includes(g.id))
      const campaignId = `camp-${Date.now()}`

      // Generate AI High-CTA Variations if enabled
      const initialLogs: CampaignMessageLog[] = selectedGroups.map((grp, index) => {
        let textToSend = masterMessage
        if (aiVariantEnabled) {
          const ctaVariations = [
            `🔥 [Special Notice for ${grp.name}]: ${masterMessage} 👉 Grab yours before stock ends: https://bmt.link/deal`,
            `⚡ Exclusive Community Update: ${masterMessage} 📩 Inbox us for direct VIP pricing: https://bmt.link/vip`,
            `📢 Announcement: ${masterMessage} 🎁 Limited slots remaining!`,
          ]
          textToSend = ctaVariations[index % ctaVariations.length]
        }

        return {
          id: `log-msg-${Date.now()}-${index}`,
          groupId: grp.id,
          groupName: grp.name,
          accountId: grp.assignedAccountId,
          accountName: grp.assignedAccountName,
          sentMessageText: textToSend,
          isAiVariant: aiVariantEnabled,
          sentAt: "In Queue",
          status: "PENDING",
          latencyMs: 0,
        }
      })

      const newCampaign: MessengerGroupCampaign = {
        id: campaignId,
        title,
        masterMessage,
        targetGroupIds: selectedGroupIds,
        messagesPerAccount,
        delayMinutes,
        aiVariantEnabled,
        status: "Sending",
        totalTarget: selectedGroupIds.length,
        sentCount: 0,
        progressPercent: 0,
        startedAt: "Just now",
        logs: initialLogs,
      }

      const updatedCampaigns = [newCampaign, ...campaigns]
      saveCampaigns(updatedCampaigns)
      setActiveRunningId(campaignId)

      // Simulate Real Graph API Sending Queue
      let currentSent = 0
      const total = initialLogs.length

      const interval = setInterval(() => {
        currentSent += 1
        const percent = Math.round((currentSent / total) * 100)

        setCampaigns((prev) =>
          prev.map((c) => {
            if (c.id === campaignId) {
              const updatedLogs: CampaignMessageLog[] = c.logs.map((l, idx) => {
                if (idx < currentSent) {
                  return {
                    ...l,
                    status: "DELIVERED_200",
                    sentAt: "Just now",
                    latencyMs: Math.floor(Math.random() * 300) + 400,
                  }
                }
                return l
              })

              const isDone = currentSent >= total
              return {
                ...c,
                sentCount: currentSent,
                progressPercent: percent,
                status: isDone ? "Completed" : "Sending",
                logs: updatedLogs,
              }
            }
            return c
          })
        )

        if (currentSent >= total) {
          clearInterval(interval)
          setActiveRunningId(null)
        }
      }, 1500)
    },
    [groups, campaigns, saveCampaigns]
  )

  // Metrics
  const metrics = useMemo(() => {
    const totalGroups = groups.length
    const totalMembers = groups.reduce((acc, g) => acc + g.memberCount, 0)
    const totalDelivered = campaigns.reduce((acc, c) => acc + c.sentCount, 0)
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
    groups,
    campaigns,
    activeRunningId,
    metrics,
    addGroup,
    addFollowersToGroup,
    launchCampaign,
  }
}
