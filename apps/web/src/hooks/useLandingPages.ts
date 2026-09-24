"use client"

import { useState, useEffect, useCallback } from "react"

export interface DropdownOption {
  label: string
  price: string
}

export interface AdSlotConfig {
  enabled: boolean
  adType: "Banner Image" | "Custom HTML / AdSense"
  adImageUrl?: string
  adTargetUrl?: string
  adHtmlSnippet?: string
}

export interface SectionVisibility {
  announcementBar?: boolean
  categoryBadge?: boolean
  headline?: boolean
  subheadline?: boolean
  heroImage?: boolean
  features?: boolean
  pricingBadge?: boolean
  variantsDropdown?: boolean
  checkoutForm?: boolean
  trustBadges?: boolean
  adSlot?: boolean
}

export interface LandingPageProject {
  id: string
  slug: string
  title: string
  category: "E-Commerce & Gadgets" | "Health & Beauty" | "Courses & Education" | "Affiliate Offers" | "Services & Real Estate"
  announcementBar?: string
  headline: string
  subheadline: string
  heroImage: string
  features?: string[]
  productPrice: string
  ctaText: string
  ctaAction: "Order Form" | "WhatsApp Checkout"
  whatsappNumber?: string
  dropdownTitle: string
  dropdownOptions: DropdownOption[]
  adSlot: AdSlotConfig
  visibleSections?: SectionVisibility
  viewsCount: number
  ordersCount: number
  status: "Published" | "Draft"
  createdAt: string
  workspaceId?: string
}

const STORAGE_KEY = "bmt_landing_pages"

export function useLandingPages(workspaceId?: string) {
  const [pages, setPages] = useState<LandingPageProject[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const defaultPages: LandingPageProject[] = [
    {
      id: "page-smart-watch-pro",
      slug: "smart-watch-ultra-eid-offer",
      title: "Ultra Smart Watch Series 9 Eid Offer",
      category: "E-Commerce & Gadgets",
      announcementBar: "🎉 সীমিত সময়ের ধামাকা অফার • সারাদেশে ক্যাশ অন হোম ডেলিভারি ফ্রি!",
      headline: "ঈদের সেরা ধামাকা অফারে কিনুন অরিজিনাল আল্ট্রা স্মার্ট ওয়াচ!",
      subheadline: "অরিজিনাল অ্যামোলেড ডিসপ্লে, ব্লুটুথ কলিং ও ১ বছরের অফিসিয়াল ব্র্যান্ড ওয়ারেন্টি সহ। স্টক সীমিত!",
      heroImage: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop",
      features: [
        "অরিজিনাল ২.০২ ইঞ্চি সুপার অ্যামোলেড কালার ডিসপ্লে",
        "হাই-ডেফিনিশন ব্লুটুথ কলিং ও লাউড স্পিকার",
        "এক চার্জে টানা ৫ থেকে ৭ দিন ব্যাটারি ব্যাকআপ",
        "১ বছরের অফিসিয়াল ব্র্যান্ড রিপ্লেসমেন্ট ওয়ারেন্টি",
      ],
      productPrice: "২,৪৯০ টাকা (রেগুলার ৩,৯৯০ টাকা)",
      ctaText: "এখনই ক্যাশ অন ডেলিভারিতে অর্ডার করুন",
      ctaAction: "Order Form",
      whatsappNumber: "01700000000",
      dropdownTitle: "প্যাকেজ ও কালার ভ্যারিয়েন্ট বেছে নিন (Select Variant):",
      dropdownOptions: [
        { label: "1x Ultra Smart Watch - Jet Black (Silver Bezel)", price: "২,৪৯০ টাকা" },
        { label: "1x Ultra Smart Watch - Ocean Orange (Sport Loop)", price: "২,৪৯০ টাকা" },
        { label: "2x Combo Pack (Black + Orange) - স্পেশাল গিফট প্যাক", price: "৪,৫০০ টাকা (Save ৫০০৳)" },
      ],
      adSlot: {
        enabled: true,
        adType: "Banner Image",
        adImageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop",
        adTargetUrl: "https://bmt.cards/eid-mega-offer",
      },
      viewsCount: 384,
      ordersCount: 42,
      status: "Published",
      createdAt: "2026-08-01",
      workspaceId: "workspace-1",
    },
    {
      id: "page-organic-glow-serum",
      slug: "organic-glow-herbal-serum",
      title: "Natural Herbal Glow Skin Serum",
      category: "Health & Beauty",
      headline: "প্রাকৃতিক উপাদানে তৈরি স্কিন ব্রাইটনিং ও অ্যান্টি-অ্যাকনি সিরাম",
      subheadline: "১০০% ভেষজ উপাদান, কোনো সাইড ইফেক্ট নেই। ৭ দিনে দৃশ্যমান পরিবর্তন লক্ষ্য করুন।",
      heroImage: "https://images.unsplash.com/photo-1608248597359-52e69784dc9e?w=800&auto=format&fit=crop",
      productPrice: "১,২৯০ টাকা (রেগুলার ১,৮৫০ টাকা)",
      ctaText: "অর্ডার করতে এখানে ক্লিক করুন",
      ctaAction: "Order Form",
      whatsappNumber: "01800000000",
      dropdownTitle: "সাইজ ও কম্বো অফার সিলেক্ট করুন:",
      dropdownOptions: [
        { label: "1x 30ml Single Pack (১ মাসের কোর্স)", price: "১,২৯০ টাকা" },
        { label: "2x 30ml Duo Treatment Pack (২ মাসের ফুল কোর্স)", price: "২,২৯০ টাকা" },
      ],
      adSlot: {
        enabled: true,
        adType: "Banner Image",
        adImageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop",
        adTargetUrl: "https://bmt.cards/beauty-special",
      },
      viewsCount: 219,
      ordersCount: 28,
      status: "Published",
      createdAt: "2026-08-03",
      workspaceId: "workspace-1",
    },
  ]

  const loadPages = useCallback(() => {
    if (typeof window === "undefined") return

    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPages(parsed)
          setIsLoaded(true)
          return
        }
      }
      setPages(defaultPages)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPages))
    } catch (e) {
      console.warn("Failed to parse landing pages from localStorage:", e)
      setPages(defaultPages)
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    loadPages()

    const handleStorageChange = () => {
      loadPages()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("bmt_pages_update", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("bmt_pages_update", handleStorageChange)
    }
  }, [loadPages])

  const saveToStorage = (updated: LandingPageProject[]) => {
    setPages(updated)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        window.dispatchEvent(new Event("bmt_pages_update"))
      } catch (e) {
        console.error("Failed to write landing pages to localStorage:", e)
      }
    }
  }

  const createPage = (newPage: Omit<LandingPageProject, "id" | "slug" | "viewsCount" | "ordersCount" | "createdAt">): LandingPageProject => {
    let currentPages: LandingPageProject[] = []
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed) && parsed.length > 0) {
            currentPages = parsed
          }
        }
      } catch (e) {
        console.error("Error reading localStorage in createPage:", e)
      }
    }

    if (currentPages.length === 0) {
      currentPages = pages.length > 0 ? pages : defaultPages
    }

    const baseSlug = newPage.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 35)
      .replace(/^-|-$/g, "") || "offer"
    const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`

    const page: LandingPageProject = {
      ...newPage,
      id: `proj-${Date.now()}`,
      slug: uniqueSlug,
      viewsCount: 0,
      ordersCount: 0,
      createdAt: new Date().toISOString().split("T")[0],
    }

    const updated = [page, ...currentPages]
    saveToStorage(updated)

    // Sync to server storage for live page and OpenGraph crawlers
    if (typeof window !== "undefined") {
      fetch("/api/landing-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(page),
      }).catch((err) => console.warn("Failed to sync landing page to server:", err))
    }

    return page
  }

  const updatePage = (id: string, changes: Partial<LandingPageProject>) => {
    let current = pages
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) current = parsed
        }
      } catch {}
    }

    const updated = current.map((p) => (p.id === id ? { ...p, ...changes } : p))
    saveToStorage(updated)
  }

  const deletePage = (id: string) => {
    let current = pages
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) current = parsed
        }
      } catch {}
    }

    const updated = current.filter((p) => p.id !== id)
    saveToStorage(updated)
  }

  const getPage = (slugOrId: string): LandingPageProject | undefined => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            const found = parsed.find((p) => p.slug === slugOrId || p.id === slugOrId)
            if (found) return found
          }
        }
      } catch {}
    }
    return pages.find((p) => p.slug === slugOrId || p.id === slugOrId)
  }

  const recordView = (slugOrId: string) => {
    let current = pages
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) current = parsed
        }
      } catch {}
    }

    const updated = current.map((p) =>
      p.slug === slugOrId || p.id === slugOrId
        ? { ...p, viewsCount: (p.viewsCount || 0) + 1 }
        : p
    )
    saveToStorage(updated)
  }

  const recordOrder = (slugOrId: string) => {
    let current = pages
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) current = parsed
        }
      } catch {}
    }

    const updated = current.map((p) =>
      p.slug === slugOrId || p.id === slugOrId
        ? { ...p, ordersCount: (p.ordersCount || 0) + 1 }
        : p
    )
    saveToStorage(updated)
  }

  return {
    pages,
    isLoaded,
    createPage,
    updatePage,
    deletePage,
    getPage,
    recordView,
    recordOrder,
    refreshPages: loadPages,
  }
}
