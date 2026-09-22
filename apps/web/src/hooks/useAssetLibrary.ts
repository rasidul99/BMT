"use client"

import { useState, useEffect, useCallback } from "react"

export interface LibraryAsset {
  id: string
  title: string
  type: "Text" | "Image" | "Video" | "Link" | "Poll"
  folder: "Product Photos" | "Videos & Reels" | "Captions & Copy" | "Link Cards" | "Polls & Surveys"
  content?: string // For Text / Captions or Poll Question
  url?: string // Media URL / Thumbnail URL
  targetUrl?: string // For Clickable Link cards
  pollOptions?: string[] // For Poll items
  tags: string[]
  size?: string
  uploadedAt: string
}

const STORAGE_KEY = "bmt_library_items"

export function useAssetLibrary() {
  const [assets, setAssets] = useState<LibraryAsset[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const defaultAssets: LibraryAsset[] = [
    {
      id: "lib-101",
      title: "Premium Wireless Earbuds HD Product Banner",
      type: "Image",
      folder: "Product Photos",
      url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop",
      tags: ["gadgets", "earbuds", "ecommerce"],
      size: "2.4 MB (Cloudflare R2)",
      uploadedAt: "2026-08-01",
    },
    {
      id: "lib-102",
      title: "Eid Mega Sale 2026 Viral Video Reel (1080p)",
      type: "Video",
      folder: "Videos & Reels",
      url: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600&auto=format&fit=crop",
      tags: ["video", "reel", "eid-sale"],
      size: "18.5 MB (AWS S3)",
      uploadedAt: "2026-08-02",
    },
    {
      id: "lib-103",
      title: "High-Converting Curiosity Hook Caption (Bengali)",
      type: "Text",
      folder: "Captions & Copy",
      content: "🔥 আপনি কি জানেন ৯০% মানুষ এই ছোট্ট ভুলের কারণে অনলাইনে সঠিক গ্যাজেট কিনতে পারে না? আজই জেনে নিন সেরা সমাধান। সীমিত সময়ের অফার পেতে ইনবক্স করুন!",
      tags: ["caption", "bengali-hook", "curiosity"],
      size: "1.2 KB",
      uploadedAt: "2026-08-02",
    },
    {
      id: "lib-104",
      title: "Eid Mega Offer 50% Off Clickable Card",
      type: "Link",
      folder: "Link Cards",
      url: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop",
      targetUrl: "https://bmt.cards/eid-mega-offer",
      tags: ["card", "clickable", "redirect"],
      size: "1.8 MB",
      uploadedAt: "2026-08-03",
    },
    {
      id: "lib-105",
      title: "Customer Preference Poll: Next Discount Campaign",
      type: "Poll",
      folder: "Polls & Surveys",
      content: "আসন্ন ঈদে আপনারা কোন ক্যাটাগরিতে সবচেয়ে বেশি ছাড় চান?",
      pollOptions: ["স্মার্ট ওয়াচ ও গ্যাজেট", "ফ্যাশন ও পাঞ্জাবি", "অর্গানিক ফুড আইটেম", "হোম অ্যাপ্লায়েন্স"],
      tags: ["poll", "engagement", "survey"],
      size: "800 B",
      uploadedAt: "2026-08-03",
    },
  ]

  const loadAssets = useCallback(() => {
    if (typeof window === "undefined") return

    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAssets(parsed)
        } else {
          setAssets(defaultAssets)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAssets))
        }
      } catch {
        setAssets(defaultAssets)
      }
    } else {
      setAssets(defaultAssets)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAssets))
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    loadAssets()

    const handleStorageChange = () => {
      loadAssets()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("bmt_library_update", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("bmt_library_update", handleStorageChange)
    }
  }, [loadAssets])

  const saveToStorage = (updated: LibraryAsset[]) => {
    setAssets(updated)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      window.dispatchEvent(new Event("bmt_library_update"))
    }
  }

  const addAsset = (newAsset: Omit<LibraryAsset, "id" | "uploadedAt">): LibraryAsset => {
    const asset: LibraryAsset = {
      ...newAsset,
      id: `lib-${Date.now()}`,
      uploadedAt: new Date().toISOString().split("T")[0],
    }
    const updated = [asset, ...assets]
    saveToStorage(updated)
    return asset
  }

  const deleteAsset = (id: string) => {
    const updated = assets.filter((item) => item.id !== id)
    saveToStorage(updated)
  }

  const updateAsset = (id: string, changes: Partial<LibraryAsset>) => {
    const updated = assets.map((item) => (item.id === id ? { ...item, ...changes } : item))
    saveToStorage(updated)
  }

  return {
    assets,
    isLoaded,
    addAsset,
    deleteAsset,
    updateAsset,
    refreshLibrary: loadAssets,
  }
}
