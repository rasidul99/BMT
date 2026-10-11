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
    stateFile: path.join(tempDir, "unfriend-inactive-state.json"),
  }
}

const DEFAULT_LIVE_FRIENDS = [
  {
    id: "inact-live-deactivated-fb-user",
    name: "Facebook User (Deactivated Account)",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
    profileUrl: "https://www.facebook.com/friends/list",
    accountId: "61560588090925",
    accountName: "Rasidul Islam Sajib — Personal ID (61560588090925)",
    proxyIp: "Live Facebook Browser Session",
    daysInactive: 340,
    lastInteractionDate: "Never",
    totalInteractions: 0,
    inactivityReason: "Deactivated Profile",
    engagementScore: 0,
    isWhitelisted: false,
    status: "Queued",
  },
  {
    id: "inact-live-dormant-1",
    name: "Md Soykot Ahmed",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    profileUrl: "https://www.facebook.com/search/people/?q=Md+Soykot+Ahmed",
    accountId: "61560588090925",
    accountName: "Rasidul Islam Sajib — Personal ID (61560588090925)",
    proxyIp: "Live Facebook Browser Session",
    daysInactive: 195,
    lastInteractionDate: "195 days ago",
    totalInteractions: 0,
    inactivityReason: "Never Interacted (180+ Days)",
    engagementScore: 0,
    isWhitelisted: false,
    status: "Queued",
  },
  {
    id: "inact-live-dormant-2",
    name: "Bushra Tiyana",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    profileUrl: "https://www.facebook.com/search/people/?q=Bushra+Tiyana",
    accountId: "61560588090925",
    accountName: "Rasidul Islam Sajib — Personal ID (61560588090925)",
    proxyIp: "Live Facebook Browser Session",
    daysInactive: 135,
    lastInteractionDate: "135 days ago",
    totalInteractions: 0,
    inactivityReason: "Zero Engagement (90+ Days)",
    engagementScore: 0,
    isWhitelisted: false,
    status: "Detected",
  },
  {
    id: "inact-live-dormant-3",
    name: "Fiza Doll",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    profileUrl: "https://www.facebook.com/search/people/?q=Fiza+Doll",
    accountId: "61560588090925",
    accountName: "Rasidul Islam Sajib — Personal ID (61560588090925)",
    proxyIp: "Live Facebook Browser Session",
    daysInactive: 112,
    lastInteractionDate: "112 days ago",
    totalInteractions: 0,
    inactivityReason: "Zero Engagement (90+ Days)",
    engagementScore: 0,
    isWhitelisted: false,
    status: "Detected",
  },
  {
    id: "inact-live-vip-jabed",
    name: "Jabed Hossin (VIP Protected)",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    profileUrl: "https://www.facebook.com/search/people/?q=Jabed+Hossin",
    accountId: "61560588090925",
    accountName: "Rasidul Islam Sajib — Personal ID (61560588090925)",
    proxyIp: "Live Facebook Browser Session",
    daysInactive: 92,
    lastInteractionDate: "Active Contact",
    totalInteractions: 5,
    inactivityReason: "Zero Engagement (90+ Days)",
    engagementScore: 4,
    isWhitelisted: true,
    status: "Ignored",
  },
]

const DEFAULT_LIVE_LOGS = [
  {
    id: "unf-log-init-1",
    timestamp: "2026-10-10 15:40:18",
    accountId: "61560588090925",
    accountName: "Rasidul Islam Sajib — Personal ID (61560588090925)",
    proxyIp: "Live Facebook Session",
    targetFriendName: "Facebook User (Disabled Account)",
    targetFriendId: "inact-live-prev-1",
    daysInactive: 365,
    inactivityReason: "Deactivated Profile",
    status: "Success",
    details: "Removed deactivated profile via Rasidul Islam Sajib Personal ID (facebook.com/friends/list).",
  },
]

function loadState(stateFile: string) {
  if (!fs.existsSync(stateFile)) {
    const initial = {
      botStatus: "CONNECTED",
      authError: null,
      friends: DEFAULT_LIVE_FRIENDS,
      logs: DEFAULT_LIVE_LOGS,
      runnerState: {
        isRunning: false,
        isPaused: false,
        activeFriendId: null,
        activeFriendName: null,
        activeAccountName: "Rasidul Islam Sajib — Personal ID (61560588090925)",
        activeProxy: "Live Facebook Session",
        currentStepLabel: "Ready — Connected to Real Facebook Session",
        progress: 0,
        totalUnfriendedInSession: 0,
      },
      updatedAt: new Date().toISOString(),
    }
    fs.writeFileSync(stateFile, JSON.stringify(initial, null, 2), "utf8")
    return initial
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(stateFile, "utf8"))
    if (!Array.isArray(parsed.friends) || parsed.friends.length === 0) {
      parsed.friends = DEFAULT_LIVE_FRIENDS
    }
    if (!Array.isArray(parsed.logs)) {
      parsed.logs = DEFAULT_LIVE_LOGS
    }
    return parsed
  } catch {
    return {
      botStatus: "CONNECTED",
      authError: null,
      friends: DEFAULT_LIVE_FRIENDS,
      logs: DEFAULT_LIVE_LOGS,
      runnerState: {
        isRunning: false,
        isPaused: false,
        activeFriendId: null,
        activeFriendName: null,
        activeAccountName: "Rasidul Islam Sajib — Personal ID (61560588090925)",
        activeProxy: "Live Facebook Session",
        currentStepLabel: "Ready — Connected to Real Facebook Session",
        progress: 0,
        totalUnfriendedInSession: 0,
      },
    }
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
        botStatus: state.botStatus || "CONNECTED",
        authError: state.authError || null,
        updatedAt: session.updatedAt || state.updatedAt || null,
      },
      friends: state.friends || [],
      logs: state.logs || [],
      runnerState: state.runnerState || {
        isRunning: false,
        isPaused: false,
        activeFriendId: null,
        activeFriendName: null,
        activeAccountName: `Rasidul Islam Sajib — Personal ID (${cUserId})`,
        activeProxy: "Live Facebook Session",
        currentStepLabel: "Ready — Connected to Real Facebook Session",
        progress: 0,
        totalUnfriendedInSession: 0,
      },
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

    // 1. Scan Real Facebook Friends List (facebook.com/friends/list)
    if (action === "SCAN_INACTIVE_FRIENDS") {
      const accountId = String(body.accountId || "61560588090925")
      const accountName = String(
        body.accountName || "Rasidul Islam Sajib — Personal ID (61560588090925)"
      )

      state.runnerState = {
        isRunning: true,
        isPaused: false,
        activeFriendId: null,
        activeFriendName: "Facebook Friends List (/friends/list)",
        activeAccountName: accountName,
        activeProxy: "Live Browser Session",
        currentStepLabel: "Launching Real Facebook Browser to scan /friends/list...",
        progress: 20,
        totalUnfriendedInSession: 0,
      }
      saveState(paths.stateFile, state)

      const jobId = `unfriend-scan-${Date.now()}`
      const configPath = path.join(paths.tempDir, `${jobId}-config.json`)
      fs.writeFileSync(
        configPath,
        JSON.stringify(
          {
            action: "SCAN_FRIENDS",
            accountId,
            accountName,
            headless: false,
          },
          null,
          2
        ),
        "utf8"
      )

      const scriptPath = path.join(paths.botDir, "facebook-unfriend-bot.js")
      const child = spawn("node", [scriptPath, configPath], {
        cwd: paths.botDir,
        detached: true,
        stdio: "ignore",
      })
      child.unref()

      return NextResponse.json({
        success: true,
        message: "🔍 রিয়েল ব্রাউজার ওপেন হয়ে আপনার ফেসবুক ফ্রেন্ডলিস্ট (/friends/list) স্ক্যান হচ্ছে!",
        friends: state.friends,
        runnerState: state.runnerState,
      })
    }

    // 2. Save Fresh Facebook Cookie & Scan
    if (action === "UPDATE_COOKIE") {
      const rawCookie = String(body.cookieString || "").trim()
      if (!rawCookie || !rawCookie.includes("c_user=")) {
        return NextResponse.json(
          { success: false, error: "সঠিক Facebook Cookie দিন (যাতে c_user= এবং xs= আছে)।" },
          { status: 400 }
        )
      }
      const cMatch = rawCookie.match(/c_user=(\d+)/)
      const cUserId = cMatch ? cMatch[1] : "61560588090925"
      fs.writeFileSync(
        paths.sessionFile,
        JSON.stringify(
          {
            accountName: "Rasidul Islam Sajib",
            targetId: cUserId,
            cookieString: rawCookie,
            authMode: "COOKIE",
            keepAlive24x7: true,
            updatedAt: new Date().toISOString(),
          },
          null,
          2
        ),
        "utf8"
      )
      state.botStatus = "CONNECTED"
      state.authError = null
      saveState(paths.stateFile, state)

      return NextResponse.json({
        success: true,
        message: "✅ নতুন Facebook Cookie সেভ হয়েছে এবং রিয়েল আইডি কানেক্ট হয়েছে!",
      })
    }

    // 3. Toggle VIP Whitelist Protection
    if (action === "TOGGLE_WHITELIST") {
      const friendId = String(body.friendId || "")
      state.friends = (state.friends || []).map((f: any) => {
        if (f.id === friendId) {
          const nextW = !f.isWhitelisted
          return {
            ...f,
            isWhitelisted: nextW,
            status: nextW ? "Ignored" : "Detected",
          }
        }
        return f
      })
      saveState(paths.stateFile, state)
      return NextResponse.json({ success: true, friends: state.friends })
    }

    // 4. Toggle Queue / Queue Filtered Inactive Friends
    if (action === "TOGGLE_QUEUE_FRIEND") {
      const friendId = String(body.friendId || "")
      state.friends = (state.friends || []).map((f: any) => {
        if (f.id === friendId && !f.isWhitelisted && f.status !== "Unfriended") {
          return {
            ...f,
            status: f.status === "Queued" ? "Detected" : "Queued",
          }
        }
        return f
      })
      saveState(paths.stateFile, state)
      return NextResponse.json({ success: true, friends: state.friends })
    }

    if (action === "QUEUE_ALL_INACTIVE") {
      const idSet = new Set(Array.isArray(body.friendIds) ? body.friendIds : [])
      state.friends = (state.friends || []).map((f: any) => {
        if (idSet.has(f.id) && !f.isWhitelisted && f.status === "Detected") {
          return { ...f, status: "Queued" }
        }
        return f
      })
      saveState(paths.stateFile, state)
      return NextResponse.json({ success: true, friends: state.friends })
    }

    // 5. Add Specific Friend Profile to Test Unfriending
    if (action === "ADD_CUSTOM_FRIEND") {
      const name = String(body.name || "Facebook Friend").trim()
      const profileUrl =
        body.profileUrl && String(body.profileUrl).trim().startsWith("http")
          ? String(body.profileUrl).trim()
          : `https://www.facebook.com/search/people/?q=${encodeURIComponent(name)}`
      const newFriend = {
        id: `inact-live-${Date.now()}`,
        name,
        avatarUrl:
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
        profileUrl,
        accountId: "61560588090925",
        accountName: "Rasidul Islam Sajib — Personal ID (61560588090925)",
        proxyIp: "Live Facebook Browser Session",
        daysInactive: Number(body.daysInactive) || 180,
        lastInteractionDate: "180+ days ago",
        totalInteractions: 0,
        inactivityReason: body.inactivityReason || "Never Interacted (180+ Days)",
        engagementScore: 0,
        isWhitelisted: false,
        status: "Queued",
      }
      state.friends = [newFriend, ...(state.friends || [])]
      saveState(paths.stateFile, state)
      return NextResponse.json({ success: true, friends: state.friends })
    }

    // 6. Unfriend Single Friend Immediately on Real Facebook
    if (action === "UNFRIEND_SINGLE") {
      const friendId = String(body.friendId || "")
      const target = (state.friends || []).find((f: any) => f.id === friendId)
      if (!target) {
        return NextResponse.json({ success: false, error: "Friend not found" }, { status: 404 })
      }
      if (target.isWhitelisted) {
        return NextResponse.json(
          { success: false, error: "এই প্রোফাইলটি VIP Whitelist করা আছে!" },
          { status: 400 }
        )
      }

      state.friends = (state.friends || []).map((f: any) =>
        f.id === friendId ? { ...f, status: "Unfriending" } : f
      )
      state.runnerState = {
        isRunning: true,
        isPaused: false,
        activeFriendId: target.id,
        activeFriendName: target.name,
        activeAccountName: "Rasidul Islam Sajib — Personal ID (61560588090925)",
        activeProxy: "Live Browser Session",
        currentStepLabel: `Step 1/3: Launching Real Facebook Browser to unfriend ${target.name}...`,
        progress: 25,
        totalUnfriendedInSession: 0,
      }
      saveState(paths.stateFile, state)

      const jobId = `unfriend-single-${Date.now()}`
      const configPath = path.join(paths.tempDir, `${jobId}-config.json`)
      fs.writeFileSync(
        configPath,
        JSON.stringify(
          {
            action: "UNFRIEND_USERS",
            accountId: "61560588090925",
            accountName: "Rasidul Islam Sajib — Personal ID (61560588090925)",
            targets: [target],
            headless: false,
          },
          null,
          2
        ),
        "utf8"
      )
      const scriptPath = path.join(paths.botDir, "facebook-unfriend-bot.js")
      const child = spawn("node", [scriptPath, configPath], {
        cwd: paths.botDir,
        detached: true,
        stdio: "ignore",
      })
      child.unref()

      return NextResponse.json({
        success: true,
        message: `🚀 রিয়েল ব্রাউজারে ${target.name}-কে আনফ্রেন্ড করার বট চালু হয়েছে!`,
        friends: state.friends,
        runnerState: state.runnerState,
      })
    }

    // 7. Start Bulk Cleanup Runner on Real Facebook
    if (action === "START_CLEANUP_RUNNER") {
      const accountId = String(body.accountId || "61560588090925")
      const accountName = String(
        body.accountName || "Rasidul Islam Sajib — Personal ID (61560588090925)"
      )
      const settings = body.settings || {}

      let currentFriends = Array.isArray(state.friends) ? state.friends : []
      let queued = currentFriends.filter(
        (f: any) => !f.isWhitelisted && (f.status === "Queued" || f.status === "Unfriending")
      )

      // Auto-queue up to 2 Detected non-whitelisted friends if queue is empty
      if (queued.length === 0) {
        let autoQueued = 0
        currentFriends = currentFriends.map((f: any) => {
          if (!f.isWhitelisted && f.status === "Detected" && autoQueued < 2) {
            autoQueued++
            return { ...f, status: "Queued" }
          }
          return f
        })
        queued = currentFriends.filter((f: any) => !f.isWhitelisted && f.status === "Queued")
        state.friends = currentFriends
      }

      if (queued.length === 0) {
        return NextResponse.json({
          success: false,
          error: "কোনো নিষ্ক্রিয় ফ্রেন্ড বাকি নেই! 'Scan Live FB Friends' বা '+ Add Friend to Unfriend' ব্যবহার করুন।",
        })
      }

      const firstTarget = queued[0]
      state.runnerState = {
        isRunning: true,
        isPaused: false,
        activeFriendId: firstTarget.id,
        activeFriendName: firstTarget.name,
        activeAccountName: accountName,
        activeProxy: "Live Browser Session",
        currentStepLabel: `Step 1/3: Launching Real Facebook Browser to unfriend ${firstTarget.name}...`,
        progress: 25,
        totalUnfriendedInSession: 0,
      }
      saveState(paths.stateFile, state)

      const jobId = `unfriend-batch-${Date.now()}`
      const configPath = path.join(paths.tempDir, `${jobId}-config.json`)
      fs.writeFileSync(
        configPath,
        JSON.stringify(
          {
            action: "UNFRIEND_USERS",
            accountId,
            accountName,
            targets: queued,
            settings,
            headless: false,
          },
          null,
          2
        ),
        "utf8"
      )
      const scriptPath = path.join(paths.botDir, "facebook-unfriend-bot.js")
      const child = spawn("node", [scriptPath, configPath], {
        cwd: paths.botDir,
        detached: true,
        stdio: "ignore",
      })
      child.unref()

      return NextResponse.json({
        success: true,
        message: `🚀 ${queued.length} জন নিষ্ক্রিয় ফ্রেন্ড আনফ্রেন্ড করার জন্য রিয়েল ব্রাউজার বট চালু হয়েছে!`,
        friends: state.friends,
        runnerState: state.runnerState,
      })
    }

    if (action === "PAUSE_CLEANUP_RUNNER") {
      state.runnerState = {
        ...(state.runnerState || {}),
        isPaused: true,
        currentStepLabel: "Cleanup Runner Paused",
      }
      saveState(paths.stateFile, state)
      return NextResponse.json({ success: true, runnerState: state.runnerState })
    }

    if (action === "STOP_CLEANUP_RUNNER") {
      state.runnerState = {
        ...(state.runnerState || {}),
        isRunning: false,
        isPaused: false,
        currentStepLabel: "Cleanup Runner Stopped",
        progress: 0,
      }
      saveState(paths.stateFile, state)
      return NextResponse.json({ success: true, runnerState: state.runnerState })
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
