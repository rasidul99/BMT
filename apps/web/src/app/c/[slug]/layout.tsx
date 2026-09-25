import type { Metadata } from "next"
import { getCardServer } from "../../../lib/cardsStore"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const card = await getCardServer(slug)

  if (!card) {
    return {
      title: "Exclusive Offer | BMT Cards",
      description: "Click to view product details and exclusive deals.",
    }
  }

  // Format absolute image URL for Facebook, WhatsApp, Telegram, Twitter crawlers
  let absoluteImageUrl = card.imageUrl
  if (absoluteImageUrl.startsWith("/")) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bmt.cards"
    absoluteImageUrl = `${baseUrl}${absoluteImageUrl}`
  }

  return {
    title: card.title,
    description: card.description || "Click to view product details and special offer.",
    openGraph: {
      title: card.title,
      description: card.description || "Click to view product details and special offer.",
      siteName: card.displayDomain?.toUpperCase() || "BMT.CARDS",
      images: [
        {
          url: absoluteImageUrl,
          width: 1200,
          height: 630,
          alt: card.title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: card.title,
      description: card.description || "Click to view product details and special offer.",
      images: [absoluteImageUrl],
    },
    other: {
      "og:image:width": "1200",
      "og:image:height": "630",
    },
  }
}

export default function ClickableCardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
