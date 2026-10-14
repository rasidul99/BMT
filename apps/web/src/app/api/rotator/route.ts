import { NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs"

function getDataPath() {
  const dataDir = path.resolve(process.cwd(), "..", "..", "scripts", "facebook-bot", "temp")
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  return path.join(dataDir, "smart-link-rotators.json")
}

export interface RotatorDestination {
  id: string
  url: string
  weight: number // 1 - 100%
  country?: string // "All" or "BD", "USA", etc.
  clicks: number
  active: boolean
}

export interface SmartLinkRotator {
  id: string
  slug: string
  title: string
  mode: "WEIGHTED" | "ROUND_ROBIN" | "GEO_TARGET"
  fallbackUrl: string
  destinations: RotatorDestination[]
  totalClicks: number
  uniqueClicks: number
  active: boolean
  createdAt: string
  lastClickedAt?: string
}

const DEFAULT_ROTATORS: SmartLinkRotator[] = [
  {
    id: "rot-1",
    slug: "summer-deals",
    title: "Summer E-Commerce Flash Deals",
    mode: "WEIGHTED",
    fallbackUrl: "https://yourbrand.com/deals",
    destinations: [
      {
        id: "dest-1",
        url: "https://yourbrand.com/offer-a?ref=rotator",
        weight: 60,
        country: "All",
        clicks: 342,
        active: true,
      },
      {
        id: "dest-2",
        url: "https://yourbrand.com/offer-b?ref=rotator",
        weight: 40,
        country: "All",
        clicks: 228,
        active: true,
      },
    ],
    totalClicks: 570,
    uniqueClicks: 495,
    active: true,
    createdAt: "2026-10-10 14:30",
    lastClickedAt: "10 mins ago",
  },
  {
    id: "rot-2",
    slug: "global-gadget",
    title: "Global Smart Gadgets Campaign",
    mode: "GEO_TARGET",
    fallbackUrl: "https://gadgetzone.com/global",
    destinations: [
      {
        id: "dest-3",
        url: "https://gadgetzone.com/bd-store",
        weight: 100,
        country: "BD",
        clicks: 850,
        active: true,
      },
      {
        id: "dest-4",
        url: "https://gadgetzone.com/usa-store",
        weight: 100,
        country: "USA",
        clicks: 430,
        active: true,
      },
    ],
    totalClicks: 1280,
    uniqueClicks: 1110,
    active: true,
    createdAt: "2026-10-12 11:20",
    lastClickedAt: "2 mins ago",
  },
]

function loadRotators(): SmartLinkRotator[] {
  const filePath = getDataPath()
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"))
      if (Array.isArray(data) && data.length > 0) return data
    } catch {}
  }
  fs.writeFileSync(filePath, JSON.stringify(DEFAULT_ROTATORS, null, 2), "utf8")
  return DEFAULT_ROTATORS
}

function saveRotators(data: SmartLinkRotator[]) {
  fs.writeFileSync(getDataPath(), JSON.stringify(data, null, 2), "utf8")
}

export async function GET() {
  const rotators = loadRotators()
  return NextResponse.json({ success: true, rotators })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body
    const rotators = loadRotators()

    if (action === "CREATE_ROTATOR") {
      const rawSlug = String(body.slug || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "")
      if (!rawSlug) {
        return NextResponse.json({ success: false, error: "Valid slug is required." }, { status: 400 })
      }
      if (rotators.some((r) => r.slug === rawSlug)) {
        return NextResponse.json({ success: false, error: "Slug already exists. Choose a unique slug." }, { status: 400 })
      }

      const destinations: RotatorDestination[] = Array.isArray(body.destinations) && body.destinations.length > 0
        ? body.destinations.map((d: any, idx: number) => ({
            id: `dest-${Date.now()}-${idx}`,
            url: String(d.url || "https://google.com").trim(),
            weight: Number(d.weight) || 50,
            country: d.country || "All",
            clicks: 0,
            active: Boolean(d.active ?? true),
          }))
        : [
            { id: `dest-1-${Date.now()}`, url: "https://example.com/page-a", weight: 50, country: "All", clicks: 0, active: true },
            { id: `dest-2-${Date.now()}`, url: "https://example.com/page-b", weight: 50, country: "All", clicks: 0, active: true },
          ]

      const newRotator: SmartLinkRotator = {
        id: `rot-${Date.now()}`,
        slug: rawSlug,
        title: String(body.title || rawSlug).trim(),
        mode: body.mode || "WEIGHTED",
        fallbackUrl: String(body.fallbackUrl || "https://google.com").trim(),
        destinations,
        totalClicks: 0,
        uniqueClicks: 0,
        active: true,
        createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      }

      const updated = [newRotator, ...rotators]
      saveRotators(updated)
      return NextResponse.json({ success: true, rotator: newRotator, rotators: updated })
    }

    if (action === "TOGGLE_ACTIVE") {
      const id = String(body.id || "")
      const updated = rotators.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
      saveRotators(updated)
      return NextResponse.json({ success: true, rotators: updated })
    }

    if (action === "DELETE_ROTATOR") {
      const id = String(body.id || "")
      const updated = rotators.filter((r) => r.id !== id)
      saveRotators(updated)
      return NextResponse.json({ success: true, rotators: updated })
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
