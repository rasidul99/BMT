import { writeFile, readFile, mkdir } from "fs/promises"
import path from "path"
import { LandingPageProject } from "../hooks/useLandingPages"

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
]

function getStoreFilePath() {
  return path.join(process.cwd(), "data", "landing-pages.json")
}

export async function getAllLandingPagesServer(): Promise<LandingPageProject[]> {
  try {
    const filePath = getStoreFilePath()
    const content = await readFile(filePath, "utf-8")
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
    }
    return defaultPages
  } catch {
    return defaultPages
  }
}

export async function getLandingPageServer(slugOrId: string): Promise<LandingPageProject | null> {
  const pages = await getAllLandingPagesServer()
  const found = pages.find((p) => p.slug === slugOrId || p.id === slugOrId)
  if (found) return found

  const normalized = slugOrId.toLowerCase().replace(/[^a-z0-9]/g, "")
  return (
    pages.find((p) => p.slug.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized) ||
    pages.find((p) => p.slug.includes(slugOrId) || slugOrId.includes(p.slug)) ||
    null
  )
}

export async function saveLandingPageServer(page: LandingPageProject): Promise<LandingPageProject> {
  const pages = await getAllLandingPagesServer()
  const existingIdx = pages.findIndex((p) => p.slug === page.slug || p.id === page.id)
  if (existingIdx >= 0) {
    pages[existingIdx] = { ...pages[existingIdx], ...page }
  } else {
    pages.unshift(page)
  }

  try {
    const dataDir = path.join(process.cwd(), "data")
    await mkdir(dataDir, { recursive: true })
    await writeFile(getStoreFilePath(), JSON.stringify(pages, null, 2), "utf-8")
  } catch (err) {
    console.error("Failed to save landing page to disk:", err)
  }

  return page
}
