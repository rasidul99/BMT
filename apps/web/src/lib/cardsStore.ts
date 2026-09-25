import { writeFile, readFile, mkdir } from "fs/promises"
import path from "path"

export interface ClickableCard {
  id: string
  title: string
  description: string
  imageUrl: string
  destinationUrl: string
  displayDomain: string
  clickCount: number
  createdAt: string
  workspaceId?: string
}

const defaultCards: ClickableCard[] = [
  {
    id: "card-eid-mega-sale",
    title: "Eid Mega Sale 2026 - Up to 50% Off Top Gadgets!",
    description: "Get original smartwatches, earbuds & tech accessories with fast home delivery.",
    imageUrl: "https://images.unsplash.com/photo-1542744094-3a3172720a8a?w=800&auto=format&fit=crop",
    destinationUrl: "https://bmt.cards/eid-mega-offer",
    displayDomain: "bmt.cards",
    clickCount: 142,
    createdAt: "2026-08-01",
    workspaceId: "workspace-1",
  },
  {
    id: "card-wireless-earbuds-pro",
    title: "Ultra ANC Wireless Earbuds with 48h Battery Life",
    description: "Limited stock offer! Tap to order today with free express shipping across BD.",
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop",
    destinationUrl: "https://bmt.cards/earbuds-pro",
    displayDomain: "shope.bd",
    clickCount: 89,
    createdAt: "2026-08-03",
    workspaceId: "workspace-1",
  },
]

function getStoreFilePath() {
  return path.join(process.cwd(), "data", "clickable-cards.json")
}

export async function getAllCardsServer(): Promise<ClickableCard[]> {
  try {
    const filePath = getStoreFilePath()
    const content = await readFile(filePath, "utf-8")
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
    }
    return defaultCards
  } catch {
    return defaultCards
  }
}

export async function getCardServer(slugOrId: string): Promise<ClickableCard | null> {
  const cards = await getAllCardsServer()
  const found = cards.find((c) => c.id === slugOrId || c.id.toLowerCase() === slugOrId.toLowerCase())
  if (found) return found

  // Match partial or normalized
  const normalized = slugOrId.toLowerCase().replace(/^c-/, "")
  return (
    cards.find((c) => c.id.toLowerCase().replace(/^c-/, "") === normalized) ||
    cards.find((c) => c.id.includes(normalized) || normalized.includes(c.id)) ||
    null
  )
}

export async function saveCardServer(card: ClickableCard): Promise<ClickableCard> {
  const cards = await getAllCardsServer()
  const existingIdx = cards.findIndex((c) => c.id === card.id)
  if (existingIdx >= 0) {
    cards[existingIdx] = { ...cards[existingIdx], ...card }
  } else {
    cards.unshift(card)
  }

  try {
    const dataDir = path.join(process.cwd(), "data")
    await mkdir(dataDir, { recursive: true })
    await writeFile(getStoreFilePath(), JSON.stringify(cards, null, 2), "utf-8")
  } catch (err) {
    console.error("Failed to save card to disk:", err)
  }

  return card
}
