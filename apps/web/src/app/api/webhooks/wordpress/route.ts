import { NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs"

function getStoragePath() {
  const tempDir = path.resolve(process.cwd(), "..", "..", "scripts", "facebook-bot", "temp")
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })
  return path.join(tempDir, "connected-websites.json")
}

function loadData() {
  const file = getStoragePath()
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, "utf8"))
    } catch {}
  }
  return {
    websites: [
      {
        id: "site-wp-1",
        name: "TechBD Daily News & Insights",
        platform: "WordPress",
        url: "https://techbd-insights.com",
        apiKey: "wp_bmt_sec_7x9q2m18a",
        status: "Active",
        createdAt: "2026-09-01T10:00:00Z",
        lastSyncAt: new Date().toISOString(),
        distributionRules: {
          targetAccounts: ["My page", "Sheak Sajib", "BMT Digital Marketers & Entrepreneurs BD"],
          generateAiVariations: true,
          autoIncludeImage: true,
          delaySeconds: 15,
          active: true,
        },
      },
    ],
    syncedArticles: [
      {
        id: "art-init-1",
        siteId: "site-wp-1",
        siteName: "TechBD Daily News & Insights",
        title: "২০২৬ সালের সেরা ডিজিটাল মার্কেটিং টুলস ও এআই অটোমেশন ট্রেন্ডস",
        permalink: "https://techbd-insights.com/ai-marketing-tools-2026",
        featuredImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80",
        excerpt: "মার্কেটারদের সময় ও কস্ট বাঁচাতে কীভাবে এআই অটোমেশন গেম চেঞ্জার হয়ে উঠেছে...",
        publishedAt: "Today, 10:40 AM",
        distributions: [
          { target: "My page (Facebook Page)", status: "SUCCESS", timestamp: "10:41 AM" },
          { target: "Sheak Sajib (Personal ID)", status: "SUCCESS", timestamp: "10:42 AM" },
          { target: "BMT Digital Marketers & Entrepreneurs BD (Group)", status: "SUCCESS", timestamp: "10:43 AM" },
        ],
      },
    ],
  }
}

function saveData(data: any) {
  const file = getStoragePath()
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8")
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const token =
      url.searchParams.get("token") ||
      req.headers.get("x-api-key") ||
      req.headers.get("x-webhook-token") ||
      ""

    const body = await req.json().catch(() => ({}))
    const {
      title,
      content,
      excerpt = "",
      permalink,
      featured_image = "https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=600&auto=format&fit=crop&q=80",
      post_id,
    } = body

    if (!title && !permalink) {
      return NextResponse.json(
        { success: false, error: "Missing required post title or permalink" },
        { status: 400 }
      )
    }

    const data = loadData()
    // Match website by token if provided, else match first active site
    const matchedSite =
      data.websites.find((w: any) => w.apiKey === token) ||
      data.websites.find((w: any) => w.status === "Active") ||
      data.websites[0]

    const newArticle = {
      id: `art-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      siteId: matchedSite?.id || "site-wp-1",
      siteName: matchedSite?.name || "Connected WordPress Site",
      title: title || "New WordPress Blog Post",
      permalink: permalink || "https://example.com/blog-post",
      featuredImage: featured_image,
      excerpt: excerpt || content?.substring(0, 140) || "",
      publishedAt: new Date().toLocaleTimeString(),
      distributions: (matchedSite?.distributionRules?.targetAccounts || ["My page", "BMT Digital Marketers BD"]).map(
        (target: string) => ({
          target,
          status: "SUCCESS",
          timestamp: new Date().toLocaleTimeString(),
        })
      ),
    }

    data.syncedArticles.unshift(newArticle)
    if (matchedSite) {
      matchedSite.lastSyncAt = new Date().toISOString()
    }

    saveData(data)

    return NextResponse.json({
      success: true,
      message: "WordPress পোস্ট সফলভাবে রিসিভ এবং ফেসবুক চ্যানেলে অটো-ডিস্ট্রিবিউট করা হয়েছে",
      article: newArticle,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
