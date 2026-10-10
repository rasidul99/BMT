import { NextRequest, NextResponse } from "next/server"
import { getAllLandingPagesServer, saveLandingPageServer } from "../../../lib/landingPagesStore"

export async function GET() {
  const pages = await getAllLandingPagesServer()
  return NextResponse.json({ success: true, pages })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body || !body.title) {
      return NextResponse.json({ error: "Missing required landing page details" }, { status: 400 })
    }

    const page = await saveLandingPageServer(body)
    return NextResponse.json({ success: true, page })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save landing page" }, { status: 500 })
  }
}
