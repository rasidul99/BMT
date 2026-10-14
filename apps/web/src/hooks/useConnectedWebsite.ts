"use client"

import { useState, useEffect, useCallback } from "react"

export interface ConnectedWebsiteItem {
  id: string
  name: string
  platform: "WordPress" | "Shopify" | "Ghost" | "Custom CMS"
  url: string
  apiKey: string
  status: "Active" | "Paused"
  createdAt: string
  lastSyncAt: string
  distributionRules: {
    targetAccounts: string[]
    generateAiVariations: boolean
    autoIncludeImage: boolean
    delaySeconds: number
    active: boolean
  }
}

export interface SyncedArticleItem {
  id: string
  siteId: string
  siteName: string
  title: string
  permalink: string
  featuredImage: string
  excerpt: string
  publishedAt: string
  distributions: { target: string; status: string; timestamp: string }[]
}

export function useConnectedWebsite() {
  const [websites, setWebsites] = useState<ConnectedWebsiteItem[]>([])
  const [syncedArticles, setSyncedArticles] = useState<SyncedArticleItem[]>([])
  const [loading, setLoading] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const fetchSites = useCallback(async () => {
    try {
      const res = await fetch("/api/connected-website")
      const data = await res.json()
      if (data.success) {
        setWebsites(data.websites || [])
        setSyncedArticles(data.syncedArticles || [])
      }
    } catch (e) {
      console.error("Failed to load connected websites", e)
    }
  }, [])

  useEffect(() => {
    fetchSites()
  }, [fetchSites])

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(id)
    setTimeout(() => setCopiedKey(null), 2500)
  }

  const addWebsite = async (siteData: Partial<ConnectedWebsiteItem>) => {
    setLoading(true)
    try {
      const res = await fetch("/api/connected-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ADD_SITE", site: siteData }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchSites()
        return data.website
      }
    } catch (e) {
      console.error("Failed to add website", e)
    } finally {
      setLoading(false)
    }
  }

  const updateWebsite = async (siteId: string, siteData: Partial<ConnectedWebsiteItem>) => {
    try {
      const res = await fetch("/api/connected-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_SITE", siteId, site: siteData }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchSites()
      }
    } catch (e) {
      console.error("Failed to update website", e)
    }
  }

  const deleteWebsite = async (siteId: string) => {
    try {
      const res = await fetch("/api/connected-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE_SITE", siteId }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchSites()
      }
    } catch (e) {
      console.error("Failed to delete website", e)
    }
  }

  const simulateSync = async (siteId?: string) => {
    setLoading(true)
    try {
      const res = await fetch("/api/connected-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SIMULATE_SYNC", siteId }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchSites()
      }
    } catch (e) {
      console.error("Failed to simulate blog sync", e)
    } finally {
      setLoading(false)
    }
  }

  return {
    websites,
    syncedArticles,
    loading,
    copiedKey,
    copyToClipboard,
    addWebsite,
    updateWebsite,
    deleteWebsite,
    simulateSync,
    refresh: fetchSites,
  }
}
