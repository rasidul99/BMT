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

export async function GET() {
  const data = loadData()
  return NextResponse.json({
    success: true,
    websites: data.websites,
    syncedArticles: data.syncedArticles,
    totalSyncs: data.syncedArticles.length,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { action = "ADD_SITE", site, siteId, simulationPayload } = body
    const data = loadData()

    if (action === "ADD_SITE") {
      const newSite = {
        id: `site-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: site.name || "My WordPress Site",
        platform: site.platform || "WordPress",
        url: site.url || "https://example.com",
        apiKey: `wp_bmt_sec_${Math.random().toString(36).substr(2, 9)}`,
        status: "Active",
        createdAt: new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
        distributionRules: site.distributionRules || {
          targetAccounts: ["My page", "BMT Digital Marketers & Entrepreneurs BD"],
          generateAiVariations: true,
          autoIncludeImage: true,
          delaySeconds: 20,
          active: true,
        },
      }
      data.websites.push(newSite)
      saveData(data)
      return NextResponse.json({ success: true, website: newSite, message: "Site connected successfully" })
    }

    if (action === "UPDATE_SITE") {
      const idx = data.websites.findIndex((w: any) => w.id === siteId)
      if (idx !== -1) {
        data.websites[idx] = { ...data.websites[idx], ...site }
        saveData(data)
        return NextResponse.json({ success: true, website: data.websites[idx] })
      }
      return NextResponse.json({ success: false, error: "Website not found" }, { status: 404 })
    }

    if (action === "DELETE_SITE") {
      data.websites = data.websites.filter((w: any) => w.id !== siteId)
      saveData(data)
      return NextResponse.json({ success: true, message: "Website connection removed" })
    }

    if (action === "SIMULATE_SYNC") {
      const targetSite = data.websites.find((w: any) => w.id === siteId) || data.websites[0]
      const sampleTitles = [
        "ফেইসবুক পেইজের অর্গানিক রিচ বাড়ানোর ৫টি প্রমাণিত স্ট্র্যাটেজি",
        "ড্রপশিপিং ও ই-কমার্স বিজনেসে এআই এর সঠিক ব্যবহার",
        "কীভাবে ট্রেন্ডিং ভাইরাল কন্টেন্ট খুঁজে বের করবেন",
        "ডিজিটাল মার্কেটিং এ অটোমেশনের ম্যাজিক: স্টেপ বাই স্টেপ গাইড",
      ]
      const randomTitle = sampleTitles[Math.floor(Math.random() * sampleTitles.length)]

      const simulatedArticle = {
        id: `art-sim-${Date.now()}`,
        siteId: targetSite?.id || "site-wp-1",
        siteName: targetSite?.name || "TechBD Daily News",
        title: simulationPayload?.title || randomTitle,
        permalink: simulationPayload?.permalink || `${targetSite?.url || "https://techbd-insights.com"}/article-${Date.now()}`,
        featuredImage:
          simulationPayload?.featuredImage ||
          "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80",
        excerpt:
          simulationPayload?.excerpt ||
          "ওয়ার্ডপ্রেস থেকে লাইভ পাবলিশ হওয়া ব্লগ পোস্ট স্বয়ংক্রিয়ভাবে ফেসবুক পেজ, প্রোফাইল এবং গ্রুপে ডিস্ট্রিবিউট করা হচ্ছে...",
        publishedAt: new Date().toLocaleTimeString(),
        distributions: (targetSite?.distributionRules?.targetAccounts || ["My page", "BMT Digital Marketers BD"]).map(
          (tgt: string) => ({
            target: tgt,
            status: "SUCCESS",
            timestamp: new Date().toLocaleTimeString(),
          })
        ),
      }

      data.syncedArticles.unshift(simulatedArticle)
      if (targetSite) targetSite.lastSyncAt = new Date().toISOString()
      saveData(data)

      return NextResponse.json({
        success: true,
        message: "সফলভাবে ওয়ার্ডপ্রেস পোস্ট সিমুলেশন সম্পন্ন হয়েছে এবং ফেসবুকে ডিস্ট্রিবিউট করা হয়েছে!",
        article: simulatedArticle,
      })
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
