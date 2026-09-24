import type { Metadata } from "next"
import { getLandingPageServer } from "../../../lib/landingPagesStore"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const page = await getLandingPageServer(slug)

  if (!page) {
    return {
      title: "Special Offer Landing Page",
      description: "Exclusive product offer and discount.",
    }
  }

  let absoluteImageUrl = page.heroImage
  if (absoluteImageUrl.startsWith("/")) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bmt.cards"
    absoluteImageUrl = `${baseUrl}${absoluteImageUrl}`
  }

  return {
    title: page.headline || page.title,
    description: page.subheadline || "Click to view exclusive product deals and order via Cash on Delivery.",
    openGraph: {
      title: page.headline || page.title,
      description: page.subheadline || "Click to view exclusive product deals and order via Cash on Delivery.",
      images: [
        {
          url: absoluteImageUrl,
          width: 1200,
          height: 630,
          alt: page.title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: page.headline || page.title,
      description: page.subheadline || "Order via Cash on Delivery.",
      images: [absoluteImageUrl],
    },
  }
}

export default function PublicLandingPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
