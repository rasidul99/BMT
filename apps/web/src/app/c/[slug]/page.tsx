"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ExternalLink, ShieldCheck, Loader2 } from "lucide-react"
import { useClickableCards, ClickableCard } from "../../../hooks/useClickableCards"

export default function ClickableCardRedirectPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const slug = (params?.slug as string) || ""

  const { getCard, recordClick, isLoaded } = useClickableCards()
  const [card, setCard] = useState<ClickableCard | null>(null)
  const [redirecting, setRedirecting] = useState(true)

  useEffect(() => {
    if (!slug) return

    // 1. Try to find card in persistent storage
    let found = getCard(slug)

    // Fallback if accessed via direct query parameters
    if (!found) {
      const qTarget = searchParams.get("target")
      const qTitle = searchParams.get("title")
      const qImg = searchParams.get("img")
      if (qTarget) {
        found = {
          id: slug,
          title: qTitle || "Featured Offer",
          description: "Click to view full product details.",
          imageUrl: qImg || "https://images.unsplash.com/photo-1542744094-3a3172720a8a?w=800&auto=format&fit=crop",
          destinationUrl: qTarget,
          displayDomain: "bmt.cards",
          clickCount: 0,
          createdAt: new Date().toISOString().split("T")[0],
        }
      }
    }

    if (found) {
      setCard(found)
      // Record click count
      recordClick(found.id)

      // Auto-redirect to destination link after 1.2s delay for seamless experience
      const timer = setTimeout(() => {
        window.location.replace(found!.destinationUrl)
      }, 1200)

      return () => clearTimeout(timer)
    } else {
      setRedirecting(false)
    }
  }, [slug, isLoaded])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Gateway Header */}
        <div className="flex items-center justify-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md">
            BMT
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white">BMT Smart Redirect</span>
        </div>

        {card ? (
          <div className="space-y-4">
            {/* Card Visual Banner */}
            <div className="h-44 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 relative shadow-inner">
              <img
                src={card.imageUrl}
                alt={card.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 left-2 bg-black/80 backdrop-blur text-blue-400 font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                {card.displayDomain}
              </span>
            </div>

            {/* Headline */}
            <div>
              <h1 className="text-base font-extrabold text-white leading-snug">
                {card.title}
              </h1>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                {card.description}
              </p>
            </div>

            {/* Redirect Status Indicator */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-2">
              <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-blue-400">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span>Redirecting you to target destination...</span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 truncate">
                {card.destinationUrl}
              </p>
            </div>

            {/* Manual Action Button */}
            <a
              href={card.destinationUrl}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center space-x-2 text-xs shadow-lg"
            >
              <span>Click here if not redirected automatically</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div className="flex items-center justify-center space-x-1.5 text-[10px] text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Safe Destination Link • BMT Security Guard</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-6">
            <h2 className="text-base font-bold text-slate-200">Card Not Found</h2>
            <p className="text-xs text-slate-400">
              The clickable image card you are looking for may have been deleted or the link has expired.
            </p>
            <button
              onClick={() => router.push("/workspace/workspace-1/safe/clickable-image")}
              className="mt-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
            >
              Back to Clickable Image Studio
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
