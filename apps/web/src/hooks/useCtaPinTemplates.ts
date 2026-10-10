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
    commentText: "হেলথ ও কেয়ার ডিসকাউন্ট অফারে অর্ডার করতে ভিসিট করুন: https://bmt.link/care-hub-order সীমিত সময়ের জন্য ফ্রি ডেলিভারি!",
    linkUrl: "https://bmt.link/care-hub-order",
    assignedPage: "All Destinations",
    autoPin: true,
    delaySeconds: 15,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cta-cooking-2",
    title: "Cooking Blog Customer Care & Recipe Book",
    commentText: "স্পেশাল রেসিপি বুক ও হোম শেফ কিট পেতে সরাসরি মেসেজ দিন: https://wa.me/8801700000000",
    linkUrl: "https://wa.me/8801700000000",
    assignedPage: "All Destinations",
    autoPin: true,
    delaySeconds: 15,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cta-creator-3",
    title: "Official Creator VIP Update Link",
    commentText: "আমার অফিসিয়াল প্রফেশনাল কমিউনিটিতে জয়েন হতে ফলো করুন: https://bmt.link/nb-hridoy",
    linkUrl: "https://bmt.link/nb-hridoy",
    assignedPage: "All Destinations",
    autoPin: true,
    delaySeconds: 15,
    createdAt: new Date().toISOString(),
  },
]

export const INITIAL_LOGS: CTAPinLog[] = []

export function useCtaPinTemplates() {
  const [templates, setTemplates] = useState<CTAPinTemplate[]>([])
  const [logs, setLogs] = useState<CTAPinLog[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedTemplates = localStorage.getItem(STORAGE_KEY_TEMPLATES)
      if (storedTemplates) {
        const parsed = JSON.parse(storedTemplates)
        const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{FE00}-\u{FE0F}]/gu
        const sanitized = Array.isArray(parsed)
          ? parsed.map((t: CTAPinTemplate) => ({
              ...t,
              title: t.title?.replace(emojiRegex, "").trim(),
              commentText: t.commentText?.replace(emojiRegex, "").trim(),
            }))
          : DEFAULT_TEMPLATES
        setTemplates(sanitized)
      } else {
        setTemplates(DEFAULT_TEMPLATES)
        localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(DEFAULT_TEMPLATES))
      }

      const storedLogs = localStorage.getItem(STORAGE_KEY_LOGS)
      if (storedLogs) {
        const parsedLogs: CTAPinLog[] = JSON.parse(storedLogs)
        // Keep ONLY real logs (remove legacy mock demo logs)
        const realOnly = Array.isArray(parsedLogs)
          ? parsedLogs.filter((l) => l.id !== "log-1" && l.id !== "log-2" && l.postId !== "892168940637389_1020304050")
          : []
        setLogs(realOnly)
      } else {
        setLogs([])
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify([]))
      }
    } catch {
      setTemplates(DEFAULT_TEMPLATES)
      setLogs([])
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
