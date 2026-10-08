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
      mode = "AUTO",
      humanDelaySeconds = 4,
      templates = [],
      products = [],
      storeProfile = undefined,
      checkIntervalSeconds = 8,
      maxChecks = 86400,
      headless = false,
      reuseIfActive = false,
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
        updatedAt: new Date().toISOString(),
      }
      fs.writeFileSync(runtimeSettingsFile, JSON.stringify(mergedRuntime, null, 2), "utf8")
    } catch {}

    const activeLockFile = path.join(tempDir, "inbox-active-lock.json")
    if (reuseIfActive && fs.existsSync(activeLockFile)) {
      try {
        const lock = JSON.parse(fs.readFileSync(activeLockFile, "utf8"))
        if (lock.activeJobId && (!targetId || lock.targetId === targetId)) {
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

    if (
      typeof body.cookieString === "string" &&
      body.cookieString.includes("c_user=") &&
      body.cookieString.includes("xs=")
    ) {
      try {
        const sessionFilePath = path.resolve(
          process.cwd(),
          "..",
          "..",
          "scripts",
          "facebook-bot",
          "active-session.json"
        )
        fs.writeFileSync(
          sessionFilePath,
          JSON.stringify(
            {
              accountName: targetName || "Main Facebook Profile",
              cookieString: body.cookieString,
              updatedAt: new Date().toISOString(),
            },
            null,
            2
          ),
          "utf8"
        )
      } catch {}
    }

    const jobId = `inbox-${Date.now()}`
    const configPath = path.join(tempDir, `${jobId}.json`)
    const botConfig = {
      jobId,
      sourceType: String(sourceType || "Page").trim(),
      targetId: String(targetId || "61595136714776").trim(),
      targetName: String(targetName || "Test Next").trim(),
      cookieString: typeof body.cookieString === "string" ? body.cookieString.trim() : undefined,
      mode: mode === "MANUAL" ? "MANUAL" : "AUTO",
      humanDelaySeconds: Number(humanDelaySeconds) || 4,
      templates: Array.isArray(templates) ? templates : [],
      products: Array.isArray(products) && products.length > 0 ? products : undefined,
      storeProfile: storeProfile || undefined,
      checkIntervalSeconds: Number(checkIntervalSeconds) || 8,
      maxChecks: Number(maxChecks) || 86400,
      headless: Boolean(headless),
    }

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
    return NextResponse.json({ success: false, status: "IDLE", error: "No active jobId" })
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
    logs: logs.split("\n").slice(-30).join("\n"),
  })
}
