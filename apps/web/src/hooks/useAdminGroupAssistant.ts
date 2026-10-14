"use client"

import { useState, useEffect, useCallback } from "react"

export interface AdminGroupItem {
  id: string
  name: string
  role: string
  members: number
  pendingMembers: number
  pendingPosts: number
  autoApproveActive: boolean
  privacy: "Public" | "Private"
  activityScore: number
}

export interface ApprovedMemberItem {
  id: string
  name: string
  groupName: string
  accountAge: string
  approvedAt: string
  status: string
}

export interface ApprovedPostItem {
  id: string
  author: string
  snippet: string
  groupName: string
  approvedAt: string
  status: string
}

export interface AdminAuditLog {
  id: string
  timestamp: string
  action: string
  group: string
  status: "SUCCESS" | "SKIPPED" | "REJECTED"
  details: string
}

export interface AdminGroupState {
  assistantRunning: boolean
  activeAction: string
  currentStepLabel: string
  progress: number
  totalMembersApproved: number
  totalPostsApproved: number
  totalWelcomeSent: number
  pendingMembersCount: number
  pendingPostsCount: number
  recentApprovedMembers: ApprovedMemberItem[]
  recentApprovedPosts: ApprovedPostItem[]
  auditLogs: AdminAuditLog[]
}

export interface AdminRulesConfig {
  requirePic: boolean
  requireRules: boolean
  requireQuestions: boolean
  minAgeMonths: number
  limit: number
  welcomeText: string
}

export function useAdminGroupAssistant() {
  const [groups, setGroups] = useState<AdminGroupItem[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string>("bmt-marketers-hub")
  const [actionType, setActionType] = useState<string>("RUN_ALL")
  const [loading, setLoading] = useState(false)
  const [rules, setRules] = useState<AdminRulesConfig>({
    requirePic: true,
    requireRules: true,
    requireQuestions: true,
    minAgeMonths: 3,
    limit: 10,
    welcomeText: "🎉 স্বাগতম আমাদের নতুন মেম্বারদের! গ্রুপের নিয়ম মেনে কোয়ালিটি আলোচনা চালিয়ে যান। Welcome to our community! 👋",
  })

  const [state, setState] = useState<AdminGroupState>({
    assistantRunning: false,
    activeAction: "IDLE",
    currentStepLabel: "Ready",
    progress: 0,
    totalMembersApproved: 248,
    totalPostsApproved: 94,
    totalWelcomeSent: 18,
    pendingMembersCount: 14,
    pendingPostsCount: 6,
    recentApprovedMembers: [],
    recentApprovedPosts: [],
    auditLogs: [],
  })

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/facebook-bot/admin-group")
      const data = await res.json()
      if (data.success) {
        if (data.groups && data.groups.length > 0) {
          setGroups(data.groups)
        }
        if (data.state) {
          setState(data.state)
        }
      }
    } catch (e) {
      console.error("Failed to fetch admin group state", e)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, state.assistantRunning ? 2000 : 5000)
    return () => clearInterval(interval)
  }, [fetchStatus, state.assistantRunning])

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) || groups[0]

  const updateRule = (key: keyof AdminRulesConfig, value: any) => {
    setRules((prev) => ({ ...prev, [key]: value }))
  }

  const startRunner = async (customAction?: string) => {
    setLoading(true)
    const targetAction = customAction || actionType
    try {
      const res = await fetch("/api/facebook-bot/admin-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: targetAction,
          groupId: selectedGroup?.id || "bmt-marketers-hub",
          groupName: selectedGroup?.name || "BMT Digital Marketers & Entrepreneurs BD",
          limit: rules.limit,
          requirePic: rules.requirePic,
          requireRules: rules.requireRules,
          requireQuestions: rules.requireQuestions,
          minAgeMonths: rules.minAgeMonths,
          welcomeText: rules.welcomeText,
        }),
      })
      const data = await res.json()
      if (data.state) {
        setState(data.state)
      }
    } catch (e) {
      console.error("Failed to start admin assistant runner", e)
    } finally {
      setLoading(false)
      fetchStatus()
    }
  }

  const resetRunner = async () => {
    try {
      const res = await fetch("/api/facebook-bot/admin-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESET" }),
      })
      const data = await res.json()
      if (data.state) setState(data.state)
    } catch (e) {
      console.error("Failed to reset admin runner", e)
    }
  }

  const exportCsv = () => {
    window.open("/api/facebook-bot/admin-group?action=EXPORT_CSV", "_blank")
  }

  return {
    groups,
    selectedGroup,
    selectedGroupId,
    setSelectedGroupId,
    actionType,
    setActionType,
    rules,
    updateRule,
    state,
    loading,
    startRunner,
    resetRunner,
    exportCsv,
    refresh: fetchStatus,
  }
}
