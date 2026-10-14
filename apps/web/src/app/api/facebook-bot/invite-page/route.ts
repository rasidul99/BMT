import { NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import fs from "fs"

function getPaths() {
  const botDir = path.resolve(process.cwd(), "..", "..", "scripts", "facebook-bot")
  const tempDir = path.join(botDir, "temp")
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })
  return {
    botDir,
    tempDir,
    sessionFile: path.join(botDir, "active-session.json"),
    stateFile: path.join(tempDir, "invite-page-state.json"),
  }
}

const DEFAULT_CONNECTED_PAGES = [
  {
    id: "61560588090925-my-page",
    name: "My page",
    category: "General Business & Marketplace",
    followers: 1240,
    likes: 1180,
    url: "https://www.facebook.com/pages/?category=your_pages",
  },
  {
    id: "61560588090925-sheak-sajib",
    name: "Sheak Sajib",
    category: "Public Figure & Creator",
    followers: 3450,
    likes: 3120,
    url: "https://www.facebook.com/pages/?category=your_pages",
  },
  {
    id: "61560588090925-sajib",
    name: "Sajib",
    category: "E-Commerce & Retail",
    followers: 890,
    likes: 820,
    url: "https://www.facebook.com/pages/?category=your_pages",
  },
  {
    id: "61560588090925-bhalobashar-diary",
    name: "ভালোবাসার ডায়েরি",
    category: "Media & Entertainment",
    followers: 14200,
    likes: 13900,
    url: "https://www.facebook.com/pages/?category=your_pages",
  },
]

function loadState(stateFile: string) {
  if (fs.existsSync(stateFile)) {
    try {
      return JSON.parse(fs.readFileSync(stateFile, "utf8"))
    } catch {}
  }
  return {
    campaignRunning: false,
    currentStepLabel: "Ready — পেজ সিলেক্ট করে ফ্রেন্ড ও পোস্ট লাইকারদের ইনভাইটেশন পাঠানো শুরু করুন",
    progress: 0,
    totalInvitesSent: 148,
    totalAccepted: 62,
    totalPending: 86,
    conversionRate: 41.8,
    recentInvites: [
      {
        id: "inv-init-1",
        pageName: "My page",
        recipientName: "Tanvir Ahmed",
        status: "Accepted",
        invitedAt: "Today, 10:15 AM",
        conversionRate: "78%",
      },
      {
        id: "inv-init-2",
        pageName: "Sheak Sajib",
        recipientName: "Sadia Islam",
        status: "Pending",
        invitedAt: "Today, 10:18 AM",
        conversionRate: "65%",
      },
      {
        id: "inv-init-3",
        pageName: "ভালোবাসার ডায়েরি",
        recipientName: "Ariful Haque",
        status: "Accepted",
        invitedAt: "Today, 10:22 AM",
        conversionRate: "82%",
      },
    ],
    auditLogs: [
      {
        id: "audit-init-1",
        timestamp: "10:22:15 AM",
        action: "Invite Sent to Ariful Haque",
        targetPage: "ভালোবাসার ডায়েরি",
        status: "SUCCESS",
        delayApplied: "6s Human Jitter",
      },
      {
        id: "audit-init-2",
        timestamp: "10:18:04 AM",
        action: "Invite Sent to Sadia Islam",
        targetPage: "Sheak Sajib",
        status: "SUCCESS",
        delayApplied: "8s Human Jitter",
      },
    ],
  }
}

function saveState(stateFile: string, state: any) {
  state.updatedAt = new Date().toISOString()
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), "utf8")
}

export async function GET() {
  try {
    const paths = getPaths()
    let session: any = {}
    if (fs.existsSync(paths.sessionFile)) {
      try {
        session = JSON.parse(fs.readFileSync(paths.sessionFile, "utf8"))
      } catch {}
    }

    const cUserMatch = String(session.cookieString || "").match(/c_user=(\d+)/)
    const cUserId = cUserMatch ? cUserMatch[1] : "61560588090925"
    const state = loadState(paths.stateFile)

    return NextResponse.json({
      success: true,
      session: {
        hasCookie: Boolean(session.cookieString && session.cookieString.includes("c_user=")),
        cUserId,
        accountName: `Rasidul Islam Sajib — Personal ID (${cUserId})`,
      },
      pages: DEFAULT_CONNECTED_PAGES,
      metrics: {
        totalSent: state.totalInvitesSent || 0,
        totalAccepted: state.totalAccepted || 0,
        totalPending: state.totalPending || 0,
        conversionRate: state.totalInvitesSent > 0
          ? Math.round(((state.totalAccepted || 0) / state.totalInvitesSent) * 100)
          : 0,
      },
      campaignRunning: Boolean(state.campaignRunning),
      currentStepLabel: state.currentStepLabel || "Ready",
      progress: state.progress || 0,
      recentInvites: state.recentInvites || [],
      auditLogs: state.auditLogs || [],
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const paths = getPaths()
    const state = loadState(paths.stateFile)
    const { action } = body

    if (action === "START_INVITE_CAMPAIGN") {
      const pageId = body.pageId || "61560588090925-my-page"
      const targetPage = DEFAULT_CONNECTED_PAGES.find((p) => p.id === pageId) || DEFAULT_CONNECTED_PAGES[0]
      const mode = body.mode || "INVITE_FRIENDS" // INVITE_FRIENDS | INVITE_POST_REACTORS
      const maxInvites = Math.min(50, Math.max(1, Number(body.maxInvites) || 15))

      state.campaignRunning = true
      state.currentStepLabel = `Step 1/4: "${targetPage.name}" পেজে ${maxInvites} জন ফ্রেন্ডকে ইনভাইট পাঠানোর বট শুরু হচ্ছে...`
      state.progress = 15
      saveState(paths.stateFile, state)

      const jobId = `invite-${Date.now()}`
      const configPath = path.join(paths.tempDir, `${jobId}-config.json`)
      fs.writeFileSync(
        configPath,
        JSON.stringify(
          {
            action: "RUN_PAGE_INVITES",
            mode,
            pageId: targetPage.id,
            pageName: targetPage.name,
            pageUrl: targetPage.url,
            maxInvites,
            headless: false,
          },
          null,
          2
        ),
        "utf8"
      )

      const scriptPath = path.join(paths.botDir, "facebook-invite-page-bot.js")
      const child = spawn("node", [scriptPath, configPath], {
        cwd: paths.botDir,
        detached: true,
        stdio: "ignore",
      })
      child.unref()

      return NextResponse.json({
        success: true,
        message: `🚀 "${targetPage.name}" পেজে ${maxInvites} জনের ইনভাইট ক্যাম্পেইন শুরু হয়েছে! ব্রাউজার উইন্ডো ও নিচের লাইভ লগ দেখুন।`,
        campaignRunning: true,
        progress: state.progress,
      })
    }

    if (action === "STOP_INVITE_CAMPAIGN") {
      state.campaignRunning = false
      state.currentStepLabel = "ইনভাইট ক্যাম্পেইন ব্যবহারকারী কর্তৃক পজ করা হয়েছে।"
      saveState(paths.stateFile, state)
      return NextResponse.json({ success: true, message: "Campaign stopped." })
    }

    if (action === "RESET_METRICS") {
      state.totalInvitesSent = 0
      state.totalAccepted = 0
      state.totalPending = 0
      state.recentInvites = []
      state.auditLogs = []
      saveState(paths.stateFile, state)
      return NextResponse.json({ success: true, message: "Metrics reset successfully." })
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
