import { NextRequest, NextResponse } from "next/server"
import { getAllCardsServer, saveCardServer } from "../../../lib/cardsStore"

export async function GET() {
  const cards = await getAllCardsServer()
  return NextResponse.json({ success: true, cards })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body || !body.title) {
      return NextResponse.json({ error: "Missing required card details" }, { status: 400 })
    }

    const card = await saveCardServer(body)
    return NextResponse.json({ success: true, card })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save card" }, { status: 500 })
  }
}
