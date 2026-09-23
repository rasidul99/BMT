"use client"

import { useState, useEffect, useCallback } from "react"

export interface CTAPinTemplate {
  id: string
  title: string
  commentText: string
  linkUrl: string
  assignedPage: string
  autoPin: boolean
  delaySeconds: number // 0, 15, 30, 60
  createdAt: string
}

export interface CTAPinLog {
  id: string
  postId: string
  pageName: string
  commentText: string
  pinnedStatus: "Pinned" | "Comment Only" | "Pending" | "Failed"
  apiResponse?: string
  timestamp: string
}

const STORAGE_KEY_TEMPLATES = "bmt_cta_pin_templates"
const STORAGE_KEY_LOGS = "bmt_cta_pin_logs"

export const DEFAULT_TEMPLATES: CTAPinTemplate[] = [
  {
    id: "cta-care-hub-1",
    title: "Care Hub Order Now Direct Link",
    commentText: "👉 হেলথ ও কেয়ার ডিসকাউন্ট অফারে অর্ডার করতে ভিসিট করুন: https://bmt.link/care-hub-order 🎁 সীমিত সময়ের জন্য ফ্রি ডেলিভারি!",
    linkUrl: "https://bmt.link/care-hub-order",
    assignedPage: "CARE HUB BD",
    autoPin: true,
    delaySeconds: 15,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cta-cooking-2",
    title: "Cooking Blog Customer Care & Recipe Book",
    commentText: "📞 স্পেশাল রেসিপি বুক ও হোম শেফ কিট পেতে সরাসরি মেসেজ দিন: https://wa.me/8801700000000 ⚡",
    linkUrl: "https://wa.me/8801700000000",
    assignedPage: "সাধারণ রান্না বান্না ব্লগ",
    autoPin: true,
    delaySeconds: 30,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cta-creator-3",
    title: "Official Creator VIP Update Link",
    commentText: "🛒 আমার অফিসিয়াল প্রফেশনাল কমিউনিটিতে জয়েন হতে ফলো করুন: https://bmt.link/nb-hridoy 🌿",
    linkUrl: "https://bmt.link/nb-hridoy",
    assignedPage: "NB Hridoy Hossen (Profile)",
    autoPin: true,
    delaySeconds: 0,
    createdAt: new Date().toISOString(),
  },
]

export const INITIAL_LOGS: CTAPinLog[] = [
  {
    id: "log-1",
    postId: "892168940637389_1020304050",
    pageName: "CARE HUB BD",
    commentText: "👉 হেলথ ও কেয়ার ডিসকাউন্ট অফারে অর্ডার করতে ভিসিট করুন: https://bmt.link/care-hub-order 🎁",
    pinnedStatus: "Pinned",
    apiResponse: "HTTP 200 OK - Comment ID: 1020304050_2030405",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: "log-2",
    postId: "page-102-id_987654321",
    pageName: "সাধারণ রান্না বান্না ব্লগ",
    commentText: "📞 স্পেশাল রেসিপি বুক ও হোম শেফ কিট পেতে সরাসরি মেসেজ দিন: https://wa.me/8801700000000 ⚡",
    pinnedStatus: "Pinned",
    apiResponse: "HTTP 200 OK - Comment ID: 987654321_11223344",
    timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
]

export function useCtaPinTemplates() {
  const [templates, setTemplates] = useState<CTAPinTemplate[]>([])
  const [logs, setLogs] = useState<CTAPinLog[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedTemplates = localStorage.getItem(STORAGE_KEY_TEMPLATES)
      if (storedTemplates) {
        setTemplates(JSON.parse(storedTemplates))
      } else {
        setTemplates(DEFAULT_TEMPLATES)
        localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(DEFAULT_TEMPLATES))
      }

      const storedLogs = localStorage.getItem(STORAGE_KEY_LOGS)
      if (storedLogs) {
        setLogs(JSON.parse(storedLogs))
      } else {
        setLogs(INITIAL_LOGS)
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(INITIAL_LOGS))
      }
    } catch {
      setTemplates(DEFAULT_TEMPLATES)
      setLogs(INITIAL_LOGS)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save templates
  const saveTemplates = useCallback((newTemplates: CTAPinTemplate[]) => {
    setTemplates(newTemplates)
    try {
      localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(newTemplates))
    } catch (e) {
      console.error("Failed to save CTA templates to localStorage", e)
    }
  }, [])

  // Save logs
  const saveLogs = useCallback((newLogs: CTAPinLog[]) => {
    setLogs(newLogs)
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(newLogs))
    } catch (e) {
      console.error("Failed to save CTA logs to localStorage", e)
    }
  }, [])

  // Add new template
  const addTemplate = useCallback(
    (template: Omit<CTAPinTemplate, "id" | "createdAt">) => {
      const newItem: CTAPinTemplate = {
        ...template,
        id: `cta-${Date.now()}`,
        createdAt: new Date().toISOString(),
      }
      const updated = [newItem, ...templates]
      saveTemplates(updated)
      return newItem
    },
    [templates, saveTemplates]
  )

  // Update existing template
  const updateTemplate = useCallback(
    (id: string, updates: Partial<CTAPinTemplate>) => {
      const updated = templates.map((t) => (t.id === id ? { ...t, ...updates } : t))
      saveTemplates(updated)
    },
    [templates, saveTemplates]
  )

  // Delete template
  const deleteTemplate = useCallback(
    (id: string) => {
      const updated = templates.filter((t) => t.id !== id)
      saveTemplates(updated)
    },
    [templates, saveTemplates]
  )

  // Add an execution log
  const addLog = useCallback(
    (log: Omit<CTAPinLog, "id" | "timestamp">) => {
      const newLogItem: CTAPinLog = {
        ...log,
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
      }
      const updated = [newLogItem, ...logs]
      saveLogs(updated)
      return newLogItem
    },
    [logs, saveLogs]
  )

  // Clear logs
  const clearLogs = useCallback(() => {
    saveLogs([])
  }, [saveLogs])

  return {
    templates,
    logs,
    isLoaded,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    addLog,
    clearLogs,
  }
}
