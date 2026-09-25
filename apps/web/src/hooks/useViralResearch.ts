"use client"

import { useState, useEffect, useCallback } from "react"

export interface ViralContentItem {
  id: string
  title: string
  caption: string
  platform: "Facebook" | "YouTube" | "TikTok"
  author: string
  country: string
  category: string
  url: string
  thumbnailUrl: string
  views: number
  likes: number
  comments: number
  shares: number
  viralScore: number // 0-100
  postedTime: string
}

export interface ViralSearchParams {
  platform?: "all" | "facebook" | "youtube" | "tiktok"
  country?: string
  category?: string
  keyword?: string
  minLikes?: number
}

const BOOKMARKS_STORAGE_KEY = "bmt_viral_bookmarks"

export function useViralResearch() {
  const [results, setResults] = useState<ViralContentItem[]>([])
  const [bookmarks, setBookmarks] = useState<ViralContentItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastParams, setLastParams] = useState<ViralSearchParams>({
    platform: "all",
    country: "Bangladesh",
    category: "All Categories",
    keyword: "",
    minLikes: 0,
  })

  // Load bookmarks from localStorage
  const loadBookmarks = useCallback(() => {
    if (typeof window === "undefined") return
    try {
      const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setBookmarks(parsed)
        }
      }
    } catch (e) {
      console.warn("Failed to parse viral bookmarks from localStorage:", e)
    }
  }, [])

  useEffect(() => {
    loadBookmarks()

    const handleStorageChange = () => {
      loadBookmarks()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("bmt_viral_bookmarks_update", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("bmt_viral_bookmarks_update", handleStorageChange)
    }
  }, [loadBookmarks])

  // Save bookmarks
  const saveBookmarks = (items: ViralContentItem[]) => {
    setBookmarks(items)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(items))
        window.dispatchEvent(new Event("bmt_viral_bookmarks_update"))
      } catch (e) {
        console.error("Failed to save bookmarks to localStorage:", e)
      }
    }
  }

  // Toggle bookmark
  const toggleBookmark = (item: ViralContentItem) => {
    const exists = bookmarks.some((b) => b.id === item.id)
    if (exists) {
      saveBookmarks(bookmarks.filter((b) => b.id !== item.id))
    } else {
      saveBookmarks([item, ...bookmarks])
    }
  }

  const isBookmarked = (id: string) => {
    return bookmarks.some((b) => b.id === id)
  }

  // Append new items to existing results (deduplicated by id)
  const appendResults = useCallback((newItems: ViralContentItem[]) => {
    setResults((prev) => {
      const existingIds = new Set(prev.map((i) => i.id))
      const uniqueNew = newItems.filter((i) => !existingIds.has(i.id))
      return [...prev, ...uniqueNew]
    })
  }, [])

  // Load more viral videos dynamically from API
  const loadMoreViralContent = async (params: ViralSearchParams, count: number = 5) => {
    try {
      const res = await fetch("/api/viral-content/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...params,
          generateMore: true,
          offset: results.length,
          count,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          appendResults(data.items)
          return data.items.length
        }
      }
    } catch (err) {
      console.warn("loadMoreViralContent error:", err)
    }
    return 0
  }

  // Search API caller
  const searchViralContent = async (params: ViralSearchParams) => {
    setIsLoading(true)
    setError(null)
    setLastParams(params)

    try {
      const res = await fetch("/api/viral-content/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })

      if (!res.ok) {
        throw new Error(`Search request failed with status: ${res.status}`)
      }

      const data = await res.json()
      if (data.items && Array.isArray(data.items)) {
        setResults(data.items)
      } else {
        setResults([])
      }
    } catch (err: any) {
      console.error("useViralResearch search error:", err)
      setError(err.message || "Failed to search viral content")
    } finally {
      setIsLoading(false)
    }
  }

  return {
    results,
    setResults,
    appendResults,
    loadMoreViralContent,
    bookmarks,
    isLoading,
    error,
    lastParams,
    searchViralContent,
    toggleBookmark,
    isBookmarked,
    refreshBookmarks: loadBookmarks,
  }
}
