"use client"

import { useState, useEffect, useCallback } from "react"

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

const STORAGE_KEY = "bmt_clickable_cards"

export function useClickableCards(workspaceId?: string) {
  const [cards, setCards] = useState<ClickableCard[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

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

  const loadCards = useCallback(() => {
    if (typeof window === "undefined") return

    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCards(parsed)
          setIsLoaded(true)
          return
        }
      }
      setCards(defaultCards)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultCards))
    } catch (e) {
      console.warn("Failed to parse clickable cards from localStorage:", e)
      setCards(defaultCards)
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    loadCards()

    const handleStorageChange = () => {
      loadCards()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("bmt_cards_update", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("bmt_cards_update", handleStorageChange)
    }
  }, [loadCards])

  const saveToStorage = (updated: ClickableCard[]) => {
    setCards(updated)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        window.dispatchEvent(new Event("bmt_cards_update"))
      } catch (e) {
        console.error("Failed to write clickable cards to localStorage:", e)
      }
    }
  }

  const createCard = (newCard: Omit<ClickableCard, "id" | "clickCount" | "createdAt">): ClickableCard => {
    let currentCards: ClickableCard[] = []
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed) && parsed.length > 0) {
            currentCards = parsed
          }
        }
      } catch (e) {
        console.error("Error reading localStorage in createCard:", e)
      }
    }

    if (currentCards.length === 0) {
      currentCards = cards.length > 0 ? cards : defaultCards
    }

    // Generate unique slug id from title
    const baseSlug = newCard.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 35)
      .replace(/^-|-$/g, "") || "card"
    const uniqueId = `c-${baseSlug}-${Date.now().toString().slice(-4)}`

    const card: ClickableCard = {
      ...newCard,
      id: uniqueId,
      clickCount: 0,
      createdAt: new Date().toISOString().split("T")[0],
    }

    const updated = [card, ...currentCards]
    saveToStorage(updated)

    // Sync to server storage for Facebook/Twitter OpenGraph crawlers
    if (typeof window !== "undefined") {
      fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(card),
      }).catch((err) => console.warn("Failed to sync card to server:", err))
    }

    return card
  }

  const recordClick = (id: string) => {
    let currentCards: ClickableCard[] = cards
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) currentCards = parsed
        }
      } catch {}
    }

    const updated = currentCards.map((item) =>
      item.id === id ? { ...item, clickCount: (item.clickCount || 0) + 1 } : item
    )
    saveToStorage(updated)
  }

  const deleteCard = (id: string) => {
    let currentCards: ClickableCard[] = cards
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) currentCards = parsed
        }
      } catch {}
    }

    const updated = currentCards.filter((item) => item.id !== id)
    saveToStorage(updated)
  }

  const getCard = (id: string): ClickableCard | undefined => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            const found = parsed.find((item) => item.id === id)
            if (found) return found
          }
        }
      } catch {}
    }
    return cards.find((item) => item.id === id)
  }

  return {
    cards,
    isLoaded,
    createCard,
    recordClick,
    deleteCard,
    getCard,
    refreshCards: loadCards,
  }
}
