import { NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import fs from "fs"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { postUrl, checkIntervalSeconds = 15, maxChecks = 30, autoReply = true, headless = false } = body

    if (!postUrl || typeof postUrl !== "string" || !postUrl.trim()) {
      return NextResponse.json({ success: false, error: "Please provide a valid Facebook Post URL." }, { status: 400 })
    }

    const jobId = `watcher-${Date.now()}`
    const tempDir = path.resolve(process.cwd(), "..", "..", "scripts", "facebook-bot", "temp")
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

    if (typeof body.cookieString === "string" && body.cookieString.includes("c_user=") && body.cookieString.includes("xs=")) {
      try {
        const sessionFilePath = path.resolve(process.cwd(), "..", "..", "scripts", "facebook-bot", "active-session.json")
        fs.writeFileSync(
          sessionFilePath,
          JSON.stringify(
            {
              accountName: body.targetName || "Main Facebook Profile",
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
      postTitle: typeof body.postTitle === "string" ? body.postTitle.trim() : undefined,
      sourceType: typeof body.sourceType === "string" ? body.sourceType.trim() : undefined,
      targetId: typeof body.targetId === "string" ? body.targetId.trim() : undefined,
      targetName: typeof body.targetName === "string" ? body.targetName.trim() : undefined,
      cookieString: typeof body.cookieString === "string" ? body.cookieString.trim() : undefined,
      customPublicReply: typeof body.customPublicReply === "string" ? body.customPublicReply.trim() : undefined,
      customInboxMessage: typeof body.customInboxMessage === "string" ? body.customInboxMessage.trim() : undefined,
      checkIntervalSeconds: Number(checkIntervalSeconds) || 12,
      maxChecks: Number(maxChecks) || 40,
      autoReply: Boolean(autoReply),
      sendInbox: body.sendInbox !== undefined ? Boolean(body.sendInbox) : true,
      headless: Boolean(headless),
    }

    fs.writeFileSync(configPath, JSON.stringify(botConfig, null, 2), "utf8")

    const scriptPath = path.resolve(process.cwd(), "..", "..", "scripts", "facebook-bot", "facebook-comment-watcher.js")
    const logPath = path.join(tempDir, `${jobId}.log`)
    const logFd = fs.openSync(logPath, "a")

    // Launch watcher in background
    const child = spawn("node", [scriptPath, configPath], {
      detached: true,
      stdio: ["ignore", logFd, logFd],
      cwd: path.dirname(scriptPath),
    })

    child.unref()

    return NextResponse.json({
      success: true,
      jobId,
      message: "Facebook Live Comment Watcher launched successfully!",
      postUrl: postUrl.trim(),
      status: "WATCHING",
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const jobId = searchParams.get("jobId")

  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId" }, { status: 400 })
  }

  const tempDir = path.resolve(process.cwd(), "..", "..", "scripts", "facebook-bot", "temp")
  const statusFile = path.join(tempDir, `${jobId}-status.json`)
  const logFile = path.join(tempDir, `${jobId}.log`)

  let statusData: any = { status: "STARTING" }
  if (fs.existsSync(statusFile)) {
    try {
      statusData = JSON.parse(fs.readFileSync(statusFile, "utf8"))
    } catch {}
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
    checkCount: statusData.checkCount || 0,
    replies: statusData.replies || [],
    logs: logs.split("\n").slice(-30).join("\n"),
  })
}
