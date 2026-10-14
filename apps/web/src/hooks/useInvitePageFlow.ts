"use client"

import { useState, useEffect, useCallback } from "react"

export interface ConnectedPage {
  id: string
  name: string
  category: string
  followers: number
  likes: number
  url: string
}

export interface InviteRecipient {
  id: string
  pageName: string
  recipientName: string
  status: "Accepted" | "Pending" | "Failed"
  invitedAt: string
  conversionRate: string
}

export interface InviteAuditLog {
  id: string
  timestamp: string
  action: string
  targetPage: string
  status: "SUCCESS" | "FAILED"
  delayApplied: string
}

export interface InviteMetrics {
  totalSent: number
  totalAccepted: number
  totalPending: number
  conversionRate: number
}

export function useInvitePageFlow() {
  const [pages, setPages] = useState<ConnectedPage[]>([])
  const [metrics, setMetrics] = useState<InviteMetrics>({
    totalSent: 0,
    totalAccepted: 0,
    totalPending: 0,
    conversionRate: 0,
  })
  const [campaignRunning, setCampaignRunning] = useState(false)
  const [currentStepLabel, setCurrentStepLabel] = useState("Ready")
  const [progress, setProgress] = useState(0)
  const [recentInvites, setRecentInvites] = useState<InviteRecipient[]>([])
  const [auditLogs, setAuditLogs] = useState<InviteAuditLog[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const fetchLiveState = useCallback(async () => {
    try {
      const res = await fetch("/api/facebook-bot/invite-page", { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      if (!data.success) return

      if (Array.isArray(data.pages)) setPages(data.pages)
      if (data.metrics) setMetrics(data.metrics)
      setCampaignRunning(Boolean(data.campaignRunning))
      if (data.currentStepLabel) setCurrentStepLabel(data.currentStepLabel)
      if (typeof data.progress === "number") setProgress(data.progress)
      if (Array.isArray(data.recentInvites)) setRecentInvites(data.recentInvites)
      if (Array.isArray(data.auditLogs)) setAuditLogs(data.auditLogs)
    } catch {
      // transient network errors ignored
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

  const startInviteCampaign = useCallback(
    async (pageId: string, mode: "INVITE_FRIENDS" | "INVITE_POST_REACTORS", maxInvites: number) => {
      setCampaignRunning(true)
      try {
        const res = await fetch("/api/facebook-bot/invite-page", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "START_INVITE_CAMPAIGN",
            pageId,
            mode,
            maxInvites,
          }),
        })
        const data = await res.json()
        await fetchLiveState()
        return data
      } catch (err: any) {
        setCampaignRunning(false)
        return { success: false, error: err.message }
      }
    },
    [fetchLiveState]
  )

  const stopInviteCampaign = useCallback(async () => {
    setCampaignRunning(false)
    const res = await fetch("/api/facebook-bot/invite-page", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "STOP_INVITE_CAMPAIGN" }),
    })
    const data = await res.json()
    await fetchLiveState()
    return data
  }, [fetchLiveState])

  const resetMetrics = useCallback(async () => {
    const res = await fetch("/api/facebook-bot/invite-page", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "RESET_METRICS" }),
    })
    const data = await res.json()
    await fetchLiveState()
    return data
  }, [fetchLiveState])

  return {
    isLoaded,
    pages,
    metrics,
    campaignRunning,
    currentStepLabel,
    progress,
    recentInvites,
    auditLogs,
    startInviteCampaign,
    stopInviteCampaign,
    resetMetrics,
    refresh: fetchLiveState,
  }
}
