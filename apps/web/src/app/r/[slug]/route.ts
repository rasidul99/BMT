import { NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs"

function getDataPath() {
  const dataDir = path.resolve(process.cwd(), "..", "..", "scripts", "facebook-bot", "temp")
  return path.join(dataDir, "smart-link-rotators.json")
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const filePath = getDataPath()

    if (!fs.existsSync(filePath)) {
      return NextResponse.redirect(new URL("/", req.url))
    }

    const rotators = JSON.parse(fs.readFileSync(filePath, "utf8"))
    const rotator = (rotators || []).find((r: any) => r.slug === slug && r.active)

    if (!rotator || !Array.isArray(rotator.destinations) || rotator.destinations.length === 0) {
      return NextResponse.redirect(new URL(rotator?.fallbackUrl || "/", req.url))
    }

    const activeDests = rotator.destinations.filter((d: any) => d.active)
    if (activeDests.length === 0) {
      return NextResponse.redirect(new URL(rotator.fallbackUrl || "/", req.url))
    }

    let selected = activeDests[0]

    if (rotator.mode === "GEO_TARGET") {
      const countryHeader =
        req.headers.get("x-vercel-ip-country") ||
        req.headers.get("cf-ipcountry") ||
        "BD"
      const match = activeDests.find(
        (d: any) => d.country && d.country.toUpperCase() === countryHeader.toUpperCase()
      )
      if (match) selected = match
    } else if (rotator.mode === "WEIGHTED") {
      const totalWeight = activeDests.reduce((sum: number, d: any) => sum + (d.weight || 1), 0)
      let randomVal = Math.random() * totalWeight
      for (const dest of activeDests) {
        if (randomVal <= (dest.weight || 1)) {
          selected = dest
          break
        }
        randomVal -= (dest.weight || 1)
      }
    } else {
      // ROUND_ROBIN
      const minClicks = Math.min(...activeDests.map((d: any) => d.clicks || 0))
      selected = activeDests.find((d: any) => (d.clicks || 0) === minClicks) || activeDests[0]
    }

    // Increment click counts
    selected.clicks = (selected.clicks || 0) + 1
    rotator.totalClicks = (rotator.totalClicks || 0) + 1
    rotator.uniqueClicks = (rotator.uniqueClicks || 0) + 1
    rotator.lastClickedAt = "Just now"

    fs.writeFileSync(filePath, JSON.stringify(rotators, null, 2), "utf8")

    return NextResponse.redirect(new URL(selected.url, req.url))
  } catch {
    return NextResponse.redirect(new URL("/", req.url))
  }
}
