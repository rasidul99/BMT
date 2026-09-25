"use client"

import { useState, useEffect, useCallback } from "react"

export interface ConnectedAccount {
  id: string
  pageId: string
  name: string
  category: string
  followers?: string
  status: "Connected" | "Disconnected" | "Expired"
  connectedAt?: string
}

export interface DashboardQueueJob {
  id: string
  variationTitle: string
  accountName: string
  delayMinutes: number
  scheduledFor: string
  status: "Pending" | "Processing" | "Posted" | "Failed"
  retryCount: number
  maxRetries: number
  type?: string
  lastError?: string
}

export interface ActivityLog {
  id: string
  user: string
  action: string
  target: string
  time: string
  status: "success" | "warning" | "info"
}

export function useDashboardMetrics() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([])
  const [queueJobs, setQueueJobs] = useState<DashboardQueueJob[]>([])
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(() => {
    if (typeof window === "undefined") return

    // 1. Load Connected Accounts
    const defaultAccounts: ConnectedAccount[] = [
      { id: "page-1", pageId: "1742727983", name: "NB Hridoy Hossen (Profile)", category: "Profile Owner / Business", followers: "5.0K", status: "Connected", connectedAt: "Today, 10:00 AM" },
      { id: "page-2", pageId: "109823487123", name: "CARE HUB BD", category: "Health & Care / Business", followers: "45.2K", status: "Connected", connectedAt: "Today, 11:30 AM" },
      { id: "page-3", pageId: "987234812314", name: "সাধারণ রান্না বান্না ব্লগ", category: "Personal Blog & Cooking", followers: "18.9K", status: "Connected", connectedAt: "Yesterday" },
    ]

    const savedAccounts = localStorage.getItem("bmt_connected_pages")
    if (savedAccounts) {
      try {
        const parsed = JSON.parse(savedAccounts)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAccounts(parsed)
        } else {
          setAccounts(defaultAccounts)
          localStorage.setItem("bmt_connected_pages", JSON.stringify(defaultAccounts))
        }
      } catch {
        setAccounts(defaultAccounts)
      }
    } else {
      setAccounts(defaultAccounts)
      localStorage.setItem("bmt_connected_pages", JSON.stringify(defaultAccounts))
    }

    // 2. Load Queue Jobs
    const defaultJobs: DashboardQueueJob[] = [
      { id: "job-101", variationTitle: "[Curiosity] ঈদ অফারে পাচ্ছেন প্রিমিয়াম ওয়াচ কালেকশন...", accountName: "CARE HUB BD", delayMinutes: 10, scheduledFor: "Today, 4:10 PM", status: "Processing", retryCount: 0, maxRetries: 3, type: "Image Post" },
      { id: "job-102", variationTitle: "[Emotional] প্রিয়জনকে ভালোবাসার উপহার দিন...", accountName: "সাধারণ রান্না বান্না ব্লগ", delayMinutes: 20, scheduledFor: "Today, 5:30 PM", status: "Pending", retryCount: 0, maxRetries: 3, type: "Reel" },
      { id: "job-103", variationTitle: "[Deal] স্পেশাল ডিসকাউন্ট অফার মাত্র ২৪ ঘণ্টার জন্য...", accountName: "NB Hridoy Hossen (Profile)", delayMinutes: 0, scheduledFor: "Today, 2:00 PM", status: "Posted", retryCount: 0, maxRetries: 3, type: "Post" },
      { id: "job-104", variationTitle: "[Shock] 🚨 স্টক সীমিত! ঈদ ধামাকা ডিল মিস করবেন না...", accountName: "CARE HUB BD", delayMinutes: 50, scheduledFor: "Today, 3:15 PM", status: "Failed", retryCount: 3, maxRetries: 3, type: "Video", lastError: "Graph API Permissions error: Page token expired" },
      { id: "job-105", variationTitle: "[Viral] সেরা ৫টি ট্রেন্ডিং টেক গ্যাজেট রিভিউ ২০২৬...", accountName: "NB Hridoy Hossen (Profile)", delayMinutes: 0, scheduledFor: "Yesterday, 8:00 PM", status: "Posted", retryCount: 0, maxRetries: 3, type: "Image Post" },
    ]

    const savedJobs = localStorage.getItem("bmt_queue_jobs")
    if (savedJobs) {
      try {
        const parsed = JSON.parse(savedJobs)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQueueJobs(parsed)
        } else {
          setQueueJobs(defaultJobs)
          localStorage.setItem("bmt_queue_jobs", JSON.stringify(defaultJobs))
        }
      } catch {
        setQueueJobs(defaultJobs)
      }
    } else {
      setQueueJobs(defaultJobs)
      localStorage.setItem("bmt_queue_jobs", JSON.stringify(defaultJobs))
    }

    // 3. Load Activity Logs
    const defaultLogs: ActivityLog[] = [
      { id: "log-1", user: "Admin", action: "Scheduled 10 AI variations with auto queue delay", target: "CARE HUB BD", time: "12 mins ago", status: "info" },
      { id: "log-2", user: "Scheduler Engine", action: "Successfully published post with CTA pin comment", target: "NB Hridoy Hossen (Profile)", time: "25 mins ago", status: "success" },
      { id: "log-3", user: "Meta Graph API", action: "Webhook verified page token access", target: "সাধারণ রান্না বান্না ব্লগ", time: "1 hour ago", status: "info" },
      { id: "log-4", user: "Risk Detector", action: "Rate limit safety check passed (0 spam score)", target: "System-wide", time: "2 hours ago", status: "success" },
    ]
    setLogs(defaultLogs)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadData()

    const handleStorageChange = () => {
      loadData()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("bmt_storage_update", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("bmt_storage_update", handleStorageChange)
    }
  }, [loadData])

  // Computed Metrics exactly per Client PDF Spec:
  // 1. Accounts: Connected accounts
  // 2. Post Scheduled: Pending jobs
  // 3. Success: Successfully posted
  // 4. In Process: Currently processing
  // 5. Failed: Failed jobs
  const metrics = {
    totalAccounts: accounts.filter((a) => a.status === "Connected").length,
    postScheduled: queueJobs.filter((j) => j.status === "Pending").length,
    success: queueJobs.filter((j) => j.status === "Posted").length,
    inProcess: queueJobs.filter((j) => j.status === "Processing").length,
    failed: queueJobs.filter((j) => j.status === "Failed").length,
    totalJobs: queueJobs.length,
    successRate: queueJobs.length > 0
      ? Math.round((queueJobs.filter((j) => j.status === "Posted").length / queueJobs.length) * 100)
      : 0,
  }

  // Action: Retry failed job
  const retryFailedJob = (jobId: string) => {
    const updated = queueJobs.map((j) => {
      if (j.id === jobId) {
        return {
          ...j,
          status: "Pending" as const,
          retryCount: 0,
          scheduledFor: "Re-queued (Now)",
          lastError: undefined,
        }
      }
      return j
    })
    setQueueJobs(updated)
    localStorage.setItem("bmt_queue_jobs", JSON.stringify(updated))
    window.dispatchEvent(new Event("bmt_storage_update"))
  }

  // Action: Publish Now (instantly turns Pending/Processing into Posted)
  const publishJobNow = (jobId: string) => {
    const updated = queueJobs.map((j) => {
      if (j.id === jobId) {
        return {
          ...j,
          status: "Posted" as const,
          scheduledFor: "Published Just Now",
        }
      }
      return j
    })
    setQueueJobs(updated)
    localStorage.setItem("bmt_queue_jobs", JSON.stringify(updated))
    window.dispatchEvent(new Event("bmt_storage_update"))
  }

  return {
    accounts,
    queueJobs,
    logs,
    metrics,
    isLoading,
    refreshMetrics: loadData,
    retryFailedJob,
    publishJobNow,
  }
}
