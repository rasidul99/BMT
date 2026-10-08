import { NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import fs from "fs"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      postUrl,
      postTitle = "Monitored Facebook Post",
      sourceType = "Page",
      targetId = "",
      targetName = "Facebook Page",
      actionType = "AUTO_DELETE",
      sensitivity = "STRICT",
      whitelistedDomains = [],
      blacklistedKeywords = [],
      checkIntervalSeconds = 10,
      maxChecks = 86400,
      headless = false,
      reuseIfActive = false,
    } = body

    if (!postUrl || typeof postUrl !== "string" || !postUrl.trim()) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid Facebook Post URL." },
        { status: 400 }
      )
    }

    const tempDir = path.resolve(process.cwd(), "..", "..", "scripts", "facebook-bot", "temp")
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

    // If reuseIfActive is requested, check if an existing 24/7 job is already actively watching
    const activeLockFile = path.join(tempDir, "shield-active-lock.json")
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
                message: "Connected to active 24/7 Live Facebook Link Shield!",
                postUrl: st.postUrl || postUrl.trim(),
                status: st.status,
              })
            }
          }
        }
      } catch {}
    }

    const jobId = `shield-${Date.now()}`

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

    const configPath = path.join(tempDir, `${jobId}.json`)
    const botConfig = {
      jobId,
      postUrl: postUrl.trim(),
      postTitle: String(postTitle || "Monitored Facebook Post").trim(),
      sourceType: String(sourceType || "Page").trim(),
      targetId: String(targetId || "").trim(),
      targetName: String(targetName || "Facebook Page").trim(),
      cookieString: typeof body.cookieString === "string" ? body.cookieString.trim() : undefined,
      actionType: actionType === "HIDE_COMMENT" ? "HIDE_COMMENT" : "AUTO_DELETE",
      sensitivity: sensitivity === "STANDARD" ? "STANDARD" : "STRICT",
      whitelistedDomains: Array.isArray(whitelistedDomains) ? whitelistedDomains : [],
      blacklistedKeywords: Array.isArray(blacklistedKeywords) ? blacklistedKeywords : [],
      checkIntervalSeconds: Number(checkIntervalSeconds) || 10,
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
      "facebook-link-shield-bot.js"
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
      message: "24/7 Live Facebook Link Comment Block Shield launched!",
      postUrl: postUrl.trim(),
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
    const activeLockFile = path.join(tempDir, "shield-active-lock.json")
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

  // Detect stale process if WATCHING hasn't updated in > 60 seconds
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
    postUrl: statusData.postUrl || null,
    postTitle: statusData.postTitle || null,
    targetName: statusData.targetName || null,
    error: statusData.error || null,
    checkCount: statusData.checkCount || 0,
    incidents: statusData.incidents || [],
    logs: logs.split("\n").slice(-30).join("\n"),
  })
}
