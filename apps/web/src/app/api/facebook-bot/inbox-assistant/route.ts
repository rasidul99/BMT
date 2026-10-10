import { NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import fs from "fs"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const tempDir = path.resolve(process.cwd(), "..", "..", "scripts", "facebook-bot", "temp")
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

    // 1. Queue a manual / approved reply to be sent by the running 24/7 Messenger Bot
    if (body.action === "SEND_REPLY") {
      const pendingRepliesFile = path.join(tempDir, "inbox-pending-replies.json")
      let list: any[] = []
      if (fs.existsSync(pendingRepliesFile)) {
        try {
          list = JSON.parse(fs.readFileSync(pendingRepliesFile, "utf8"))
          if (!Array.isArray(list)) list = []
        } catch {
          list = []
        }
      }
      list.push({
        customerName: String(body.customerName || "").trim(),
        replyText: String(body.replyText || "").trim(),
        queuedAt: new Date().toISOString(),
      })
      fs.writeFileSync(pendingRepliesFile, JSON.stringify(list, null, 2), "utf8")
      return NextResponse.json({
        success: true,
        message: `Reply queued for live delivery to ${body.customerName} on Facebook Messenger!`,
      })
    }

    const sessionFilePath = path.resolve(
      process.cwd(),
      "..",
      "..",
      "scripts",
      "facebook-bot",
      "active-session.json"
    )

    // 1b. Verify Facebook Access Token (Graph API EAA... Token) & discover managed Pages
    if (body.action === "VERIFY_TOKEN") {
      const token = String(body.accessToken || "").trim()
      if (!token) {
        return NextResponse.json({ success: false, error: "Access Token খালি রাখা যাবে না।" }, { status: 400 })
      }
      try {
        const meRes = await fetch(
          `https://graph.facebook.com/v19.0/me?fields=id,name,accounts{id,name,access_token,category}&access_token=${encodeURIComponent(token)}`
        )
        const meData = await meRes.json()
        if (meData.error) {
          return NextResponse.json({
            success: false,
            error: meData.error.message || "Invalid Facebook Access Token",
          })
        }
        const pages = Array.isArray(meData?.accounts?.data)
          ? meData.accounts.data.map((p: any) => ({
              pageId: String(p.id),
              pageName: String(p.name),
              accessToken: String(p.access_token || token),
              category: String(p.category || "Page"),
            }))
          : []
        return NextResponse.json({
          success: true,
          identity: { id: String(meData.id), name: String(meData.name) },
          isPageToken: pages.length === 0,
          pages,
        })
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          error: err.message || "Graph API সংযোগে সমস্যা হয়েছে",
        })
      }
    }

    // 1c. Explicitly update 24/7 Session Credentials (Access Token, Cookie Session, or Hybrid)
    if (body.action === "UPDATE_SESSION_CREDENTIALS") {
      let existingSession: any = {}
      if (fs.existsSync(sessionFilePath)) {
        try {
          existingSession = JSON.parse(fs.readFileSync(sessionFilePath, "utf8"))
        } catch {}
      }
      const cleanCookie =
        typeof body.cookieString === "string" &&
        body.cookieString.includes("c_user=") &&
        body.cookieString.includes("xs=") &&
        !body.cookieString.includes("bmt_session_token_ok") &&
        !body.cookieString.includes("checkpoint_pending")
          ? body.cookieString.trim()
          : existingSession.cookieString || ""

      const cleanToken =
        typeof body.accessToken === "string" && body.accessToken.trim().length > 15
          ? body.accessToken.trim()
          : body.clearToken
          ? ""
          : existingSession.accessToken || ""

      const nextAuthMode =
        body.authMode ||
        (cleanToken && cleanCookie ? "HYBRID" : cleanToken ? "TOKEN" : "COOKIE")

      const nextSession = {
        ...existingSession,
        accountName: body.accountName || existingSession.accountName || "Test Next",
        targetId: body.targetId || existingSession.targetId || "61595136714776",
        authMode: nextAuthMode,
        accessToken: cleanToken,
        cookieString: cleanCookie,
        keepAlive24x7: true,
        updatedAt: new Date().toISOString(),
      }
      fs.writeFileSync(sessionFilePath, JSON.stringify(nextSession, null, 2), "utf8")
      return NextResponse.json({
        success: true,
        message: "24/7 Token & Cookie Session saved & synced with Live Bot!",
        session: {
          accountName: nextSession.accountName,
          authMode: nextSession.authMode,
          hasCookie: Boolean(nextSession.cookieString),
          hasAccessToken: Boolean(nextSession.accessToken),
          updatedAt: nextSession.updatedAt,
        },
      })
    }

    // 2. Dynamically update runtime mode, trained products, storeProfile, and templates
    if (body.action === "UPDATE_RUNTIME") {
      const runtimeSettingsFile = path.join(tempDir, "inbox-runtime-settings.json")
      let current: any = {}
      if (fs.existsSync(runtimeSettingsFile)) {
        try {
          current = JSON.parse(fs.readFileSync(runtimeSettingsFile, "utf8"))
        } catch {}
      }
      const nextRuntime = {
        ...current,
        ...(body.mode ? { mode: body.mode } : {}),
        ...(typeof body.isRunning === "boolean" ? { isRunning: body.isRunning } : {}),
        ...(Array.isArray(body.templates) ? { templates: body.templates } : {}),
        ...(Array.isArray(body.products) ? { products: body.products } : {}),
        ...(body.storeProfile ? { storeProfile: body.storeProfile } : {}),
        ...(Array.isArray(body.monitoredChannels) ? { monitoredChannels: body.monitoredChannels } : {}),
        updatedAt: new Date().toISOString(),
      }
      fs.writeFileSync(runtimeSettingsFile, JSON.stringify(nextRuntime, null, 2), "utf8")
      return NextResponse.json({ success: true, runtime: nextRuntime })
    }

    // 3. Launch or Connect to 24/7 Live Facebook Messenger Bot
    const {
      sourceType = "Page",
      targetId = "61595136714776",
      targetName = "Test Next",
      monitoredChannels = [],
      mode = "AUTO",
      humanDelaySeconds = 4,
      templates = [],
      products = [],
      storeProfile = undefined,
      checkIntervalSeconds = 8,
      maxChecks = 86400,
      headless = false,
      reuseIfActive = false,
      forceUpdateSession = false,
    } = body

    // Always sync latest trained products & storeProfile to runtime settings even when reusing active bot!
    const runtimeSettingsFile = path.join(tempDir, "inbox-runtime-settings.json")
    try {
      let currentRuntime: any = {}
      if (fs.existsSync(runtimeSettingsFile)) {
        currentRuntime = JSON.parse(fs.readFileSync(runtimeSettingsFile, "utf8"))
      }
      const mergedRuntime = {
        ...currentRuntime,
        mode: mode === "MANUAL" ? "MANUAL" : "AUTO",
        isRunning: true,
        ...(Array.isArray(templates) && templates.length > 0 ? { templates } : {}),
        ...(Array.isArray(products) && products.length > 0 ? { products } : {}),
        ...(storeProfile ? { storeProfile } : {}),
        ...(Array.isArray(monitoredChannels) && monitoredChannels.length > 0
          ? { monitoredChannels }
          : {}),
        updatedAt: new Date().toISOString(),
      }
      fs.writeFileSync(runtimeSettingsFile, JSON.stringify(mergedRuntime, null, 2), "utf8")
    } catch {}

    const activeLockFile = path.join(tempDir, "inbox-active-lock.json")
    if (reuseIfActive && fs.existsSync(activeLockFile)) {
      try {
        const lock = JSON.parse(fs.readFileSync(activeLockFile, "utf8"))
        if (lock.activeJobId) {
          const existingStatusFile = path.join(tempDir, `${lock.activeJobId}-status.json`)
          if (fs.existsSync(existingStatusFile)) {
            const st = JSON.parse(fs.readFileSync(existingStatusFile, "utf8"))
            const ageMs = st.updatedAt ? Date.now() - new Date(st.updatedAt).getTime() : 999999
            if (
              (st.status === "WATCHING" || st.status === "LAUNCHING_BROWSER") &&
              ageMs < 45000
            ) {
              return NextResponse.json({
                success: true,
                jobId: lock.activeJobId,
                reused: true,
                message: "Connected to active 24/7 Live Facebook Messenger Bot!",
                targetName: st.targetName || targetName,
                status: st.status,
              })
            }
          }
        }
      } catch {}
    }

    // Load existing active-session.json first so we NEVER overwrite a live rotated cookie with stale localStorage cookies!
    let currentSession: any = {}
    if (fs.existsSync(sessionFilePath)) {
      try {
        currentSession = JSON.parse(fs.readFileSync(sessionFilePath, "utf8"))
      } catch {}
    }

    const incomingCookieValid =
      typeof body.cookieString === "string" &&
      body.cookieString.includes("c_user=") &&
      body.cookieString.includes("xs=") &&
      !body.cookieString.includes("bmt_session_token_ok") &&
      !body.cookieString.includes("checkpoint_pending")

    const incomingTokenValid =
      typeof body.accessToken === "string" &&
      body.accessToken.trim().length > 15 &&
      !body.accessToken.includes("bmt_verified_token_valid") &&
      !body.accessToken.includes("meta_oauth_page_token")

    // Only overwrite active-session.json if explicitly requested (forceUpdateSession) or if active-session.json has no valid cookie/token yet
    if (
      forceUpdateSession ||
      (!currentSession.cookieString && incomingCookieValid) ||
      (incomingTokenValid && body.accessToken !== currentSession.accessToken)
    ) {
      try {
        const updatedCookie = incomingCookieValid
          ? body.cookieString.trim()
          : currentSession.cookieString || ""
        const updatedToken = incomingTokenValid
          ? body.accessToken.trim()
          : currentSession.accessToken || ""
        const resolvedAuthMode =
          body.authMode ||
          (updatedToken && updatedCookie ? "HYBRID" : updatedToken ? "TOKEN" : "COOKIE")

        currentSession = {
          ...currentSession,
          accountName: targetName || currentSession.accountName || "Main Facebook Profile",
          authMode: resolvedAuthMode,
          cookieString: updatedCookie,
          accessToken: updatedToken,
          keepAlive24x7: true,
          updatedAt: new Date().toISOString(),
        }
        fs.writeFileSync(sessionFilePath, JSON.stringify(currentSession, null, 2), "utf8")
      } catch {}
    }

    const jobId = `inbox-${Date.now()}`
    const configPath = path.join(tempDir, `${jobId}.json`)
    const botConfig = {
      jobId,
      sourceType: String(sourceType || "Page").trim(),
      targetId: String(targetId || "61595136714776").trim(),
      targetName: String(targetName || "Test Next").trim(),
      monitoredChannels: Array.isArray(monitoredChannels) ? monitoredChannels : [],
      cookieString: currentSession.cookieString || (incomingCookieValid ? body.cookieString.trim() : undefined),
      accessToken: currentSession.accessToken || (incomingTokenValid ? body.accessToken.trim() : undefined),
      authMode: currentSession.authMode || "HYBRID",
      mode: mode === "MANUAL" ? "MANUAL" : "AUTO",
      humanDelaySeconds: Number(humanDelaySeconds) || 4,
      templates: Array.isArray(templates) ? templates : [],
      products: Array.isArray(products) && products.length > 0 ? products : undefined,
      storeProfile: storeProfile || undefined,
      checkIntervalSeconds: Number(checkIntervalSeconds) || 8,
      maxChecks: Number(maxChecks) || 86400,
      headless: Boolean(headless),
    }

    // Write activeLockFile immediately so any older running bot process sees isSuperseded() right away!
    try {
      fs.writeFileSync(
        activeLockFile,
        JSON.stringify(
          {
            activeJobId: jobId,
            targetId: botConfig.targetId,
            targetName: botConfig.targetName,
            startedAt: new Date().toISOString(),
          },
          null,
          2
        ),
        "utf8"
      )
    } catch {}

    fs.writeFileSync(configPath, JSON.stringify(botConfig, null, 2), "utf8")

    const scriptPath = path.resolve(
      process.cwd(),
      "..",
      "..",
      "scripts",
      "facebook-bot",
      "facebook-inbox-bot.js"
    )
    const logPath = path.join(tempDir, `${jobId}.log`)
    const logFd = fs.openSync(logPath, "a")

    const child = spawn("node", [scriptPath, configPath], {
      detached: true,
      stdio: ["ignore", logFd, logFd],
      cwd: path.dirname(scriptPath),
    })

    child.unref()

    return NextResponse.json({
      success: true,
      jobId,
      message: "24/7 Live Facebook Messenger Inbox Bot launched!",
      targetName,
      status: "WATCHING",
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  let jobId = searchParams.get("jobId")

  const tempDir = path.resolve(process.cwd(), "..", "..", "scripts", "facebook-bot", "temp")
  const sessionFilePath = path.resolve(
    process.cwd(),
    "..",
    "..",
    "scripts",
    "facebook-bot",
    "active-session.json"
  )

  let sessionHealth = {
    authMode: "HYBRID",
    hasCookie: false,
    hasAccessToken: false,
    keepAlive24x7: true,
    lastRefreshedAt: "",
  }
  if (fs.existsSync(sessionFilePath)) {
    try {
      const s = JSON.parse(fs.readFileSync(sessionFilePath, "utf8"))
      sessionHealth = {
        authMode: s.authMode || (s.accessToken && s.cookieString ? "HYBRID" : s.accessToken ? "TOKEN" : "COOKIE"),
        hasCookie: Boolean(s.cookieString && s.cookieString.includes("c_user=")),
        hasAccessToken: Boolean(s.accessToken && s.accessToken.length > 15),
        keepAlive24x7: true,
        lastRefreshedAt: s.updatedAt || "",
      }
    } catch {}
  }

  if (!jobId || jobId === "latest") {
    const activeLockFile = path.join(tempDir, "inbox-active-lock.json")
    if (fs.existsSync(activeLockFile)) {
      try {
        const lock = JSON.parse(fs.readFileSync(activeLockFile, "utf8"))
        jobId = lock.activeJobId || null
      } catch {}
    }
  }

  if (!jobId) {
    return NextResponse.json({
      success: false,
      status: "IDLE",
      error: "No active jobId",
      sessionHealth,
    })
  }

  const statusFile = path.join(tempDir, `${jobId}-status.json`)
  const logFile = path.join(tempDir, `${jobId}.log`)

  let statusData: any = { status: "STARTING" }
  if (fs.existsSync(statusFile)) {
    try {
      statusData = JSON.parse(fs.readFileSync(statusFile, "utf8"))
    } catch {}
  }

  if (
    (statusData.status === "WATCHING" || statusData.status === "LAUNCHING_BROWSER") &&
    statusData.updatedAt
  ) {
    const ageMs = Date.now() - new Date(statusData.updatedAt).getTime()
    if (ageMs > 60000) {
      statusData.status = "STOPPED"
    }
  }

  let logs = ""
  if (fs.existsSync(logFile)) {
    try {
      logs = fs.readFileSync(logFile, "utf8")
    } catch {}
  }

  return NextResponse.json({
    success: true,
    jobId,
    status: statusData.status || "UNKNOWN",
    sourceType: statusData.sourceType || "Page",
    targetId: statusData.targetId || "",
    targetName: statusData.targetName || "",
    error: statusData.error || null,
    checkCount: statusData.checkCount || 0,
    totalAutoRepliesSent: statusData.totalAutoRepliesSent || 0,
    conversations: statusData.conversations || [],
    sessionHealth,
    logs: logs.split("\n").slice(-30).join("\n"),
  })
}
