import { NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import fs from "fs"

function getBotPaths() {
  const botDir = path.resolve(process.cwd(), "..", "..", "scripts", "facebook-bot")
  const tempDir = path.join(botDir, "temp")
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })
  return {
    botDir,
    tempDir,
    sessionFile: path.join(botDir, "active-session.json"),
    stateFile: path.join(tempDir, "friend-automation-state.json"),
    scriptPath: path.join(botDir, "facebook-friend-bot.js"),
  }
}

function loadState(stateFile: string) {
  if (!fs.existsSync(stateFile)) {
    return {
      botStatus: "CONNECTED",
      authError: null,
      leads: [],
      incoming: [],
      logs: [],
      runnerState: {
        isRunning: false,
        isPaused: false,
        activeLeadId: null,
        activeLeadName: null,
        activeAccountId: "61560588090925",
        activeAccountName: "Rasidul Islam Sajib — Personal ID (61560588090925)",
        activeProxy: "Live Facebook Session",
        currentStep: "IDLE",
        currentStepLabel: "Engine Ready",
        stepProgress: 0,
        totalProcessedInSession: 0,
      },
    }
  }
  try {
    return JSON.parse(fs.readFileSync(stateFile, "utf8"))
  } catch {
    return { leads: [], incoming: [], logs: [], runnerState: {} }
  }
}

function saveState(stateFile: string, nextState: any) {
  fs.writeFileSync(
    stateFile,
    JSON.stringify({ ...nextState, updatedAt: new Date().toISOString() }, null, 2),
    "utf8"
  )
}

export async function GET() {
  try {
    const paths = getBotPaths()
    let session: any = {}
    if (fs.existsSync(paths.sessionFile)) {
      try {
        session = JSON.parse(fs.readFileSync(paths.sessionFile, "utf8"))
      } catch {}
    }

    const cUserMatch = String(session.cookieString || "").match(/c_user=(\d+)/)
    const cUserId = cUserMatch ? cUserMatch[1] : "61560588090925"
    const state = loadState(paths.stateFile)

    const connectedAccounts = [
      {
        id: cUserId,
        name: `Rasidul Islam Sajib — Personal ID (${cUserId})`,
        rawName: "Rasidul Islam Sajib",
        sourceType: "Personal ID",
        uid: cUserId,
        status: "Active",
        proxy: { ip: "Live FB Session", port: 443 },
      },
    ]

    return NextResponse.json({
      success: true,
      session: {
        hasCookie: Boolean(session.cookieString && session.cookieString.includes("c_user=")),
        cUserId,
        botStatus: state.botStatus || "CONNECTED",
        authError: state.authError || null,
        updatedAt: session.updatedAt || null,
      },
      connectedAccounts,
      leads: state.leads || [],
      incoming: state.incoming || [],
      logs: state.logs || [],
      runnerState: state.runnerState || {},
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const paths = getBotPaths()
    const state = loadState(paths.stateFile)
    const { action } = body

    // 1. Update Facebook Session Cookie right from Friend Automation page
    if (action === "UPDATE_COOKIE") {
      let existingSession: any = {}
      if (fs.existsSync(paths.sessionFile)) {
        try {
          existingSession = JSON.parse(fs.readFileSync(paths.sessionFile, "utf8"))
        } catch {}
      }
      const rawCookie = String(body.cookieString || "").trim()
      if (!rawCookie.includes("c_user=") || !rawCookie.includes("xs=")) {
        return NextResponse.json(
          { success: false, error: "সঠিক Facebook Cookie (c_user=...; xs=...) দিন।" },
          { status: 400 }
        )
      }
      const nextSession = {
        ...existingSession,
        accountName: "Rasidul Islam Sajib",
        cookieString: rawCookie,
        authMode: "COOKIE",
        keepAlive24x7: true,
        updatedAt: new Date().toISOString(),
      }
      fs.writeFileSync(paths.sessionFile, JSON.stringify(nextSession, null, 2), "utf8")
      state.botStatus = "CONNECTED"
      state.authError = null
      saveState(paths.stateFile, state)
      return NextResponse.json({
        success: true,
        message: "✅ নতুন Facebook Cookie সেভ হয়েছে! রিয়েল ফ্রেন্ড অটোমেশন ইঞ্জিন কানেক্টেড।",
      })
    }

    // 2. Sync Live Friend Requests & Suggestions from Real Facebook Account
    if (action === "SYNC_LIVE_FRIENDS") {
      const accountId = String(body.accountId || "61560588090925")
      const accountName = String(
        body.accountName || "Rasidul Islam Sajib — Personal ID (61560588090925)"
      )
      const jobId = `friend-sync-${Date.now()}`
      const configPath = path.join(paths.tempDir, `${jobId}-config.json`)
      fs.writeFileSync(
        configPath,
        JSON.stringify(
          {
            action: "SYNC_FRIENDS",
            accountId,
            accountName,
            headless: false,
          },
          null,
          2
        ),
        "utf8"
      )
      const child = spawn("node", [paths.scriptPath, configPath], {
        cwd: paths.botDir,
        detached: true,
        stdio: "ignore",
      })
      child.unref()

      return NextResponse.json({
        success: true,
        message: `🔄 রিয়েল ফেসবুক অ্যাকাউন্ট (${accountName}) থেকে লাইভ ফ্রেন্ড রিকোয়েস্ট ও সাজেশন সিঙ্ক হচ্ছে!`,
        leads: state.leads || [],
        incoming: state.incoming || [],
      })
    }

    // 3. Add Custom Target Lead (Real Facebook Profile URL or Name)
    if (action === "ADD_CUSTOM_LEAD") {
      const newLead = {
        id: `lead-live-${Date.now()}`,
        name: String(body.name || "Facebook User").trim(),
        avatarUrl:
          body.avatarUrl ||
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
        profileUrl:
          body.profileUrl && String(body.profileUrl).trim().startsWith("http")
            ? String(body.profileUrl).trim()
            : `https://www.facebook.com/search/people/?q=${encodeURIComponent(
                String(body.name || "").trim()
              )}`,
        country: body.country || "Bangladesh",
        city: body.city || "Dhaka",
        age: Number(body.age) || 25,
        gender: body.gender || "Male",
        niche: body.niche || "E-Commerce & Shopping",
        mutualFriends: Number(body.mutualFriends) || 12,
        engagementScore: 94,
        status: "Queued",
        assignedAccountId: "61560588090925",
        assignedAccountName: "Rasidul Islam Sajib — Personal ID (61560588090925)",
        addedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      }
      state.leads = [newLead, ...(state.leads || [])]
      saveState(paths.stateFile, state)
      return NextResponse.json({ success: true, leads: state.leads })
    }

    // 4. Toggle Queue / Queue Filtered Leads
    if (action === "TOGGLE_QUEUE_LEAD") {
      const leadId = String(body.leadId || "")
      state.leads = (state.leads || []).map((l: any) =>
        l.id === leadId
          ? { ...l, status: l.status === "Queued" ? "Discovered" : "Queued" }
          : l
      )
      saveState(paths.stateFile, state)
      return NextResponse.json({ success: true, leads: state.leads })
    }

    if (action === "QUEUE_ALL_FILTERED") {
      const idSet = new Set(Array.isArray(body.leadIds) ? body.leadIds : [])
      state.leads = (state.leads || []).map((l: any) =>
        idSet.has(l.id) && l.status === "Discovered" ? { ...l, status: "Queued" } : l
      )
      saveState(paths.stateFile, state)
      return NextResponse.json({ success: true, leads: state.leads })
    }

    // 5. Launch Live Outgoing Friend Request Bot on Real Facebook
    if (action === "START_OUTGOING_BOT") {
      const accountId = String(body.accountId || "61560588090925")
      const accountName = String(
        body.accountName || "Rasidul Islam Sajib — Personal ID (61560588090925)"
      )
      const settings = body.settings || {}

      let currentLeads = Array.isArray(state.leads) ? state.leads : []
      let queued = currentLeads.filter((l: any) => l.status === "Queued" || l.status === "Simulating")
      if (queued.length === 0) {
        let autoQueued = 0
        currentLeads = currentLeads.map((l: any) => {
          if (l.status === "Discovered" && autoQueued < 2) {
            autoQueued++
            return { ...l, status: "Queued" }
          }
          return l
        })
        queued = currentLeads.filter((l: any) => l.status === "Queued")
        state.leads = currentLeads
      }

      if (queued.length === 0) {
        return NextResponse.json({
          success: false,
          error: "সবগুলো প্রোফাইলেই ইতিমধ্যে ফ্রেন্ড রিকোয়েস্ট পাঠানো হয়েছে! নতুন প্রোফাইল Sync বা Add করুন।",
        })
      }

      const firstTarget = queued[0]
      state.runnerState = {
        isRunning: true,
        isPaused: false,
        activeLeadId: firstTarget.id,
        activeLeadName: firstTarget.name,
        activeAccountId: accountId,
        activeAccountName: accountName,
        activeProxy: "Live Facebook Browser Session",
        currentStep: "VIEWING_PROFILE",
        currentStepLabel: `Step 1/4: Launching Real Facebook Browser for ${firstTarget.name}...`,
        stepProgress: 15,
        totalProcessedInSession: 0,
      }
      saveState(paths.stateFile, state)

      const jobId = `friend-send-${Date.now()}`
      const configPath = path.join(paths.tempDir, `${jobId}-config.json`)
      fs.writeFileSync(
        configPath,
        JSON.stringify(
          {
            action: "SEND_FRIEND_REQUESTS",
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

      const child = spawn("node", [paths.scriptPath, configPath], {
        cwd: paths.botDir,
        detached: true,
        stdio: "ignore",
      })
      child.unref()

      return NextResponse.json({
        success: true,
        leads: state.leads,
        runnerState: state.runnerState,
      })
    }

    if (action === "STOP_OUTGOING_BOT" || action === "PAUSE_OUTGOING_BOT") {
      state.runnerState = {
        ...(state.runnerState || {}),
        isRunning: action === "PAUSE_OUTGOING_BOT" ? true : false,
        isPaused: action === "PAUSE_OUTGOING_BOT",
        currentStep: "IDLE",
        currentStepLabel:
          action === "PAUSE_OUTGOING_BOT" ? "Automation Paused" : "Engine Stopped",
        stepProgress: 0,
      }
      saveState(paths.stateFile, state)
      return NextResponse.json({ success: true, runnerState: state.runnerState })
    }

    // 6. Accept Incoming Friend Request(s) on Real Facebook
    if (action === "ACCEPT_INCOMING" || action === "BATCH_ACCEPT_QUALIFIED") {
      const accountId = String(body.accountId || "61560588090925")
      const accountName = String(
        body.accountName || "Rasidul Islam Sajib — Personal ID (61560588090925)"
      )
      const nowStr = new Date().toISOString().replace("T", " ").slice(0, 16)
      const acceptedTargets: any[] = []

      if (action === "ACCEPT_INCOMING") {
        const reqId = String(body.requestId || "")
        state.incoming = (state.incoming || []).map((req: any) => {
          if (req.id === reqId) {
            acceptedTargets.push(req)
            return { ...req, status: "Accepted", acceptedAt: nowStr }
          }
          return req
        })
      } else {
        const minMutual = Number(body.minMutual) || 0
        state.incoming = (state.incoming || []).map((req: any) => {
          if (req.status === "Pending" && (Number(req.mutualFriends) || 0) >= minMutual) {
            acceptedTargets.push(req)
            return { ...req, status: "Accepted", acceptedAt: nowStr }
          }
          return req
        })
      }

      if (acceptedTargets.length > 0) {
        const newLog = {
          id: `log-accept-${Date.now()}`,
          timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
          accountId,
          accountName,
          proxyIp: "Live Facebook Session",
          targetProfileName:
            acceptedTargets.length === 1
              ? acceptedTargets[0].name
              : `Batch (${acceptedTargets.length} requests)`,
          targetProfileId: acceptedTargets[0].id,
          action: "AUTO_ACCEPT",
          status: "Success",
          durationSec: 5,
          details: `Accepted ${acceptedTargets.length} incoming friend request(s) on live Facebook (${acceptedTargets
            .map((t) => t.name)
            .join(", ")}).`,
        }
        state.logs = [newLog, ...(state.logs || [])].slice(0, 150)

        const jobId = `friend-accept-${Date.now()}`
        const configPath = path.join(paths.tempDir, `${jobId}-config.json`)
        fs.writeFileSync(
          configPath,
          JSON.stringify(
            {
              action: "ACCEPT_REQUESTS",
              accountId,
              accountName,
              targets: acceptedTargets,
              headless: false,
            },
            null,
            2
          ),
          "utf8"
        )
        const child = spawn("node", [paths.scriptPath, configPath], {
          cwd: paths.botDir,
          detached: true,
          stdio: "ignore",
        })
        child.unref()
      }

      saveState(paths.stateFile, state)
      return NextResponse.json({
        success: true,
        acceptedCount: acceptedTargets.length,
        incoming: state.incoming,
        logs: state.logs,
      })
    }

    if (action === "REJECT_INCOMING") {
      const reqId = String(body.requestId || "")
      state.incoming = (state.incoming || []).map((req: any) =>
        req.id === reqId ? { ...req, status: "Rejected" } : req
      )
      saveState(paths.stateFile, state)
      return NextResponse.json({ success: true, incoming: state.incoming })
    }

    if (action === "CANCEL_SENT_REQUEST") {
      const leadId = String(body.leadId || "")
      let targetLead: any = null
      state.leads = (state.leads || []).map((l: any) => {
        if (l.id === leadId) {
          targetLead = l
          return {
            ...l,
            status: "Cancelled",
            lastActionText: "Friend request cancelled on Facebook",
          }
        }
        return l
      })
      if (targetLead) {
        state.logs = [
          {
            id: `log-cancel-${Date.now()}`,
            timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
            accountId: "61560588090925",
            accountName: "Rasidul Islam Sajib — Personal ID (61560588090925)",
            proxyIp: "Live Facebook Session",
            targetProfileName: targetLead.name,
            targetProfileId: targetLead.id,
            action: "CANCEL_PENDING",
            status: "Success",
            durationSec: 4,
            details: `Cancelled pending friend request to ${targetLead.name}.`,
          },
          ...(state.logs || []),
        ]
      }
      saveState(paths.stateFile, state)
      return NextResponse.json({ success: true, leads: state.leads, logs: state.logs })
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
