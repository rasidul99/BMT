import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const VERIFY_TOKEN = process.env.FB_WEBHOOK_VERIFY_TOKEN || "bmt_webhook_2026"
const STORAGE_FILE = path.resolve(process.cwd(), "..", "..", "scripts", "facebook-bot", "temp", "live-webhook-events.json")

function getStoredEvents() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      return JSON.parse(fs.readFileSync(STORAGE_FILE, "utf8"))
    }
  } catch {}
  return []
}

function saveEvent(event: any) {
  try {
    const dir = path.dirname(STORAGE_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const events = getStoredEvents()
    events.unshift(event)
    // Keep last 50 events
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(events.slice(0, 50), null, 2), "utf8")
  } catch (err) {
    console.error("[Webhook Storage Error]:", err)
  }
}

// AI Intent Classifier
function detectIntent(text: string): { intent: string; publicReply: string; inboxReply: string } {
  const lower = text.toLowerCase()
  if (lower.includes("দাম") || lower.includes("price") || lower.includes("কত") || lower.includes("cost") || lower.includes("টাকা")) {
    return {
      intent: "Price Query",
      publicReply: "ধন্যবাদ ভাইয়া! প্রিমিয়াম কালেকশনের স্পেশাল অফার প্রাইজ ইনবক্সে পাঠানো হয়েছে। দয়া করে ইনবক্স চেক করুন।",
      inboxReply: "আসসালামু আলাইকুম! আমাদের প্রিমিয়াম ওয়াচটির রেগুলার মূল্য ৩,৯৯০ টাকা, তবে ঈদ স্পেশাল অফারে পাচ্ছেন মাত্র ২,৪৯০ টাকায় (সারাদেশে ফ্রি ক্যাশ অন ডেলিভারি)! অর্ডার করতে আপনার নাম, পূর্ণ ঠিকানা ও মোবাইল নম্বর দিন।",
    }
  }
  if (lower.includes("ডেলিভারি") || lower.includes("delivery") || lower.includes("ক্যাশ অন") || lower.includes("চার্জ")) {
    return {
      intent: "Delivery Query",
      publicReply: "জি ভাইয়া, আমরা সারাদেশে ক্যাশ অন ডেলিভারি দিচ্ছি। বিস্তারিত তথ্য ইনবক্সে চেক করুন।",
      inboxReply: "জি সম্মানিত গ্রাহক! ঢাকা সিটিতে ২৪ ঘণ্টার মধ্যে এবং ঢাকার বাইরে ৪৮ ঘণ্টার মধ্যে ক্যাশ অন ডেলিভারি পাবেন। ডেলিভারি ম্যানের সামনে প্রোডাক্ট দেখে মূল্য পরিশোধ করতে পারবেন।",
    }
  }
  if (lower.includes("স্টক") || lower.includes("stock") || lower.includes("available") || lower.includes("কালার") || lower.includes("color")) {
    return {
      intent: "Stock Query",
      publicReply: "প্রোডাক্টটির সীমিত স্টক এভেইলেবল আছে ভাইয়া! দ্রুত ইনবক্স চেক করে বুকিং কনফার্ম করুন।",
      inboxReply: "জি প্রোডাক্টটি এই মুহূর্তে আমাদের স্টকে আছে, তবে মাত্র ১২টি পিস অবশিষ্ট রয়েছে। আপনি চাইলে এখনই আপনার বুকিং কনফার্ম করতে পারেন। ধন্যবাদ!",
    }
  }
  if (lower.includes("ওয়ারেন্টি") || lower.includes("warranty") || lower.includes("গ্যারান্টি") || lower.includes("নষ্ট")) {
    return {
      intent: "Warranty Query",
      publicReply: "জি সম্মানিত কাস্টমার, প্রতিটি প্রডাক্টে পাচ্ছেন ১ বছরের অফিসিয়াল রিপ্লেসমেন্ট ওয়ারেন্টি! বিস্তারিত ইনবক্সে দেওয়া হলো।",
      inboxReply: "আমাদের প্রতিটি অথেনটিক প্রডাক্টের সাথে পাবেন অফিসিয়াল ১ বছরের রিপ্লেসমেন্ট কার্ড। যেকোনো সমস্যায় ৭ দিনের মধ্যে ফ্রি এক্সচেঞ্জ সুবিধা রয়েছে।",
    }
  }
  return {
    intent: "General Greeting",
    publicReply: "আসসালামু আলাইকুম! বিস্তারিত তথ্য আপনার ইনবক্সে মেসেজ করা হয়েছে, দয়া করে মেসেঞ্জার চেক করুন।",
    inboxReply: "স্বাগতম! আপনি আমাদের পণ্যটি সম্পর্কে জানতে চাওয়ায় ধন্যবাদ। যেকোনো তথ্য বা অর্ডারের জন্য আমাদের জানাতে পারেন, আমরা তাৎক্ষণিক সহায়তা করছি।",
  }
}

// 1. GET: Webhook Verification from Meta (or get events for frontend)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  // If Meta Webhook handshake
  if (mode === "subscribe" && token) {
    if (token === VERIFY_TOKEN) {
      console.log("[Meta Webhook Verified Successfully]")
      return new NextResponse(challenge, { status: 200 })
    }
    return new NextResponse("Forbidden", { status: 403 })
  }

  // Otherwise return recent events for frontend dashboard
  const events = getStoredEvents()
  return NextResponse.json({ success: true, count: events.length, events })
}

// 2. POST: Meta Live Webhook Event Dispatcher
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log("[Meta Webhook Received Payload]:", JSON.stringify(body, null, 2))

    if (body.object === "page") {
      for (const entry of body.entry || []) {
        const pageId = entry.id
        for (const change of entry.changes || []) {
          if (change.field === "feed") {
            const val = change.value
            // Only process newly added comments
            if (val.item === "comment" && val.verb === "add") {
              const commentId = val.comment_id
              const commenterName = val.from?.name || "Facebook User"
              const commenterId = val.from?.id
              const message = val.message || ""
              const postId = val.post_id

              // Prevent self-reply loop if page comments on itself
              if (commenterId === pageId) continue

              const aiResult = detectIntent(message)

              // Meta Graph API Page Access Token
              const pageToken = process.env.NEXT_PUBLIC_FB_PAGE_TOKEN_CARE_HUB_BD || ""

              let publicSuccess = false
              let inboxSuccess = false

              if (pageToken && commentId) {
                // 1. Post Public Comment Reply
                try {
                  const pubRes = await fetch(`https://graph.facebook.com/v26.0/${commentId}/comments`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      message: aiResult.publicReply,
                      access_token: pageToken,
                    }),
                  })
                  publicSuccess = pubRes.ok
                } catch (err) {
                  console.error("[Graph API Public Comment Reply Error]:", err)
                }

                // 2. Send Private Messenger Reply (Meta Private Replies API)
                try {
                  const inboxRes = await fetch(`https://graph.facebook.com/v26.0/${pageId}/messages`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      recipient: { comment_id: commentId },
                      message: { text: aiResult.inboxReply },
                      access_token: pageToken,
                    }),
                  })
                  inboxSuccess = inboxRes.ok
                } catch (err) {
                  console.error("[Graph API Private Inbox Error]:", err)
                }
              }

              // Save event to audit store
              saveEvent({
                id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                pageId,
                postId,
                commentId,
                customerName: commenterName,
                customerQuery: message,
                intent: aiResult.intent,
                publicReply: aiResult.publicReply,
                inboxReply: aiResult.inboxReply,
                publicDispatched: publicSuccess,
                inboxDispatched: inboxSuccess,
                timestamp: new Date().toISOString(),
              })
            }
          }
        }
      }
      return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 })
    }

    return NextResponse.json({ status: "IGNORED" }, { status: 200 })
  } catch (err: any) {
    console.error("[Meta Webhook Processing Error]:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
