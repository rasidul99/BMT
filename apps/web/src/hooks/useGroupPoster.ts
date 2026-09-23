"use client"

import { useState, useEffect, useCallback } from "react"

export interface GroupPostJob {
  id: string
  groupId: string
  groupName: string
  privacy: "Public" | "Private"
  memberCount: number | string
  accountId: string
  accountName: string
  accountAvatar?: string
  postTitle: string
  postContent: string
  mediaUrl?: string
  linkUrl?: string
  postFormat: "Text" | "Image" | "Video" | "Link"
  status: "Pending" | "Posting" | "Success" | "Failed"
  delaySeconds: number
  error?: string
  postId?: string
  scheduledAt: string
  executedAt?: string
}

export interface GroupPostLog {
  id: string
  groupId: string
  groupName: string
  accountId: string
  accountName: string
  postTitle: string
  contentExcerpt: string
  mediaUrl?: string
  status: "Success" | "Failed"
  timestamp: string
  error?: string
  responseId?: string
}

export interface CustomGroupItem {
  id: string
  name: string
  category: "Buy & Sell" | "E-Commerce" | "Tech & Gadgets" | "Fashion & Lifestyle" | "Food & Organic" | "Community & General"
  memberCount: number
  privacy: "Public" | "Private"
  isManagedAdmin: boolean
  assignedAccountId: string
  url: string
}

const STORAGE_KEY_QUEUE = "bmt_group_post_queue"
const STORAGE_KEY_LOGS = "bmt_group_post_logs"
const STORAGE_KEY_CUSTOM_GROUPS = "bmt_saved_custom_groups"

export const DEFAULT_CUSTOM_GROUPS: CustomGroupItem[] = [
  {
    id: "grp-101",
    name: "Dhaka Buy and Sell Official Marketplace",
    category: "Buy & Sell",
    memberCount: 285000,
    privacy: "Public",
    isManagedAdmin: true,
    assignedAccountId: "acc-101",
    url: "https://facebook.com/groups/dhaka-buy-sell-official",
  },
  {
    id: "grp-102",
    name: "Bangladesh E-Commerce Entrepreneurs & Sellers",
    category: "E-Commerce",
    memberCount: 142000,
    privacy: "Public",
    isManagedAdmin: false,
    assignedAccountId: "acc-101",
    url: "https://facebook.com/groups/bd-ecommerce-entrepreneurs",
  },
  {
    id: "grp-103",
    name: "BD Smart Gadget & Electronics Traders Hub",
    category: "Tech & Gadgets",
    memberCount: 195000,
    privacy: "Public",
    isManagedAdmin: true,
    assignedAccountId: "acc-102",
    url: "https://facebook.com/groups/bd-smart-gadgets-hub",
  },
  {
    id: "grp-104",
    name: "Fashion & Lifestyle Bangladesh Official Group",
    category: "Fashion & Lifestyle",
    memberCount: 84500,
    privacy: "Public",
    isManagedAdmin: true,
    assignedAccountId: "acc-103",
    url: "https://facebook.com/groups/fashion-lifestyle-bd",
  },
  {
    id: "grp-105",
    name: "Organic Food & Healthy Living Community BD",
    category: "Food & Organic",
    memberCount: 68000,
    privacy: "Public",
    isManagedAdmin: false,
    assignedAccountId: "acc-103",
    url: "https://facebook.com/groups/organic-food-bd-healthy",
  },
]

export const INITIAL_LOGS: GroupPostLog[] = [
  {
    id: "log-grp-1",
    groupId: "grp-101",
    groupName: "Dhaka Buy and Sell Official Marketplace",
    accountId: "acc-101",
    accountName: "Tariqul Islam (Dhaka Marketplace Lead)",
    postTitle: "Eid Special Watch Offer",
    contentExcerpt: "🔥 ঈদ অফারে পাচ্ছেন প্রিমিয়াম ওয়াচে ৪০% ছাড়! স্টক সীমিত।",
    status: "Success",
    responseId: "fb_grp_feed_9281726481_102",
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: "log-grp-2",
    groupId: "grp-103",
    groupName: "BD Smart Gadget & Electronics Traders Hub",
    accountId: "acc-102",
    accountName: "Kamrul Hasan (Gadgets & Tech Poster)",
    postTitle: "Wireless Earbuds Flash Deal",
    contentExcerpt: "⚡ ওয়াটারপ্রুফ ব্লুটুথ ইয়ারবাড স্পেশাল স্টক ক্লিয়ারেন্স প্রাইস!",
    status: "Success",
    responseId: "fb_grp_feed_8827361928_103",
    timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
  },
]

export function useGroupPoster() {
  const [queue, setQueue] = useState<GroupPostJob[]>([])
  const [logs, setLogs] = useState<GroupPostLog[]>([])
  const [groups, setGroups] = useState<CustomGroupItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage
  useEffect(() => {
    try {
      const storedQueue = localStorage.getItem(STORAGE_KEY_QUEUE)
      if (storedQueue) setQueue(JSON.parse(storedQueue))

      const storedLogs = localStorage.getItem(STORAGE_KEY_LOGS)
      if (storedLogs) {
        setLogs(JSON.parse(storedLogs))
      } else {
        setLogs(INITIAL_LOGS)
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(INITIAL_LOGS))
      }

      const storedGroups = localStorage.getItem(STORAGE_KEY_CUSTOM_GROUPS)
      if (storedGroups) {
        setGroups(JSON.parse(storedGroups))
      } else {
        setGroups(DEFAULT_CUSTOM_GROUPS)
        localStorage.setItem(STORAGE_KEY_CUSTOM_GROUPS, JSON.stringify(DEFAULT_CUSTOM_GROUPS))
      }
    } catch (e) {
      console.error("Error loading group poster data", e)
      setLogs(INITIAL_LOGS)
      setGroups(DEFAULT_CUSTOM_GROUPS)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save helpers
  const saveQueue = useCallback((newQueue: GroupPostJob[]) => {
    setQueue(newQueue)
    try {
      localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(newQueue))
    } catch (e) {
      console.error("Failed to save queue", e)
    }
  }, [])

  const saveLogs = useCallback((newLogs: GroupPostLog[]) => {
    setLogs(newLogs)
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(newLogs))
    } catch (e) {
      console.error("Failed to save logs", e)
    }
  }, [])

  const saveGroups = useCallback((newGroups: CustomGroupItem[]) => {
    setGroups(newGroups)
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_GROUPS, JSON.stringify(newGroups))
    } catch (e) {
      console.error("Failed to save custom groups", e)
    }
  }, [])

  // Queue actions
  const addJobsToQueue = useCallback(
    (newJobs: GroupPostJob[]) => {
      const updated = [...newJobs, ...queue]
      saveQueue(updated)
    },
    [queue, saveQueue]
  )

  const updateJobStatus = useCallback(
    (jobId: string, updates: Partial<GroupPostJob>) => {
      const updated = queue.map((j) => (j.id === jobId ? { ...j, ...updates } : j))
      saveQueue(updated)
    },
    [queue, saveQueue]
  )

  const removeJob = useCallback(
    (jobId: string) => {
      const updated = queue.filter((j) => j.id !== jobId)
      saveQueue(updated)
    },
    [queue, saveQueue]
  )

  const clearQueue = useCallback(() => {
    saveQueue([])
  }, [saveQueue])

  // Log actions
  const addLog = useCallback(
    (log: Omit<GroupPostLog, "id" | "timestamp">) => {
      const newEntry: GroupPostLog = {
        ...log,
        id: `log-grp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
      }
      const updated = [newEntry, ...logs]
      saveLogs(updated)
      return newEntry
    },
    [logs, saveLogs]
  )

  const clearLogs = useCallback(() => {
    saveLogs([])
  }, [saveLogs])

  // Group Management actions
  const addGroup = useCallback(
    (group: Omit<CustomGroupItem, "id">) => {
      const newGroupItem: CustomGroupItem = {
        ...group,
        id: `grp-${Date.now()}`,
      }
      const updated = [newGroupItem, ...groups]
      saveGroups(updated)
      return newGroupItem
    },
    [groups, saveGroups]
  )

  const deleteGroup = useCallback(
    (groupId: string) => {
      const updated = groups.filter((g) => g.id !== groupId)
      saveGroups(updated)
    },
    [groups, saveGroups]
  )

  return {
    queue,
    logs,
    groups,
    isLoaded,
    addJobsToQueue,
    updateJobStatus,
    removeJob,
    clearQueue,
    addLog,
    clearLogs,
    addGroup,
    deleteGroup,
  }
}
