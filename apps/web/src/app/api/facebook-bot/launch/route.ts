import { NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import fs from "fs"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { accountName, cookieString, groups, targets, targetPage, targetPageName, targetUrl, postMessage, mediaUrl, delaySeconds, headless, ctaPin } = body

    // 1. Resolve cookie: use provided or fallback to active-session.json
    let activeCookie = cookieString
    let activeAccount = accountName || "Facebook Account"

    const sessionFilePath = path.resolve(process.cwd(), "..", "..", "scripts", "facebook-bot", "active-session.json")
    if ((!activeCookie || !activeCookie.includes("c_user=")) && fs.existsSync(sessionFilePath)) {
      try {
        const sessionData = JSON.parse(fs.readFileSync(sessionFilePath, "utf8"))
        if (sessionData.cookieString && sessionData.cookieString.includes("c_user=")) {
          activeCookie = sessionData.cookieString
          if (!accountName && sessionData.accountName) activeAccount = sessionData.accountName
        }
      } catch {}
    }

    if (!activeCookie || !activeCookie.includes("c_user=") || !activeCookie.includes("xs=")) {
      return NextResponse.json(
        {
          success: false,
          error: "Facebook Session Cookie missing or invalid. c_user and xs are required.",
        },
        { status: 400 }
      )
    }

    // 2. Resolve target list: supports groups, targets, or single targetPage
    let targetList = groups || targets || []
    if (targetList.length === 0 && targetPage) {
      targetList = [
        {
          groupId: targetPage,
          groupName: targetPageName || targetPage,
          url: targetUrl || `https://www.facebook.com/${targetPage}`,
          isPage: true,
        },
      ]
    }

    if (!targetList || !Array.isArray(targetList) || targetList.length === 0) {
      return NextResponse.json(
        { success: false, error: "Please provide at least 1 target page or group." },
        { status: 400 }
      )
    }

    // 3. Prepare temp config file for the bot worker
    const jobId = `job-${Date.now()}`
    const tempDir = path.resolve(process.cwd(), "..", "..", "scripts", "facebook-bot", "temp")
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const configPath = path.join(tempDir, `${jobId}.json`)
    const botConfig = {
      jobId,
      accountName: activeAccount,
      cookieString: activeCookie,
      groups: targetList,
      postMessage: postMessage || "BMT Automated Post",
      mediaUrl: mediaUrl || body.imageUrl || body.image || "",
      delaySeconds: delaySeconds || 30,
      headless: headless !== undefined ? headless : false,
      ctaPin: ctaPin || body.ctaPinConfig || null,
    }

    fs.writeFileSync(configPath, JSON.stringify(botConfig, null, 2), "utf8")

    const scriptPath = path.resolve(process.cwd(), "..", "..", "scripts", "facebook-bot", "facebook-poster.js")
    const logPath = path.join(tempDir, `${jobId}.log`)
    const logFd = fs.openSync(logPath, "a")

    // Spawn Puppeteer process and wait for completion for single post jobs
    const shouldWait = body.waitForCompletion === true || (body.waitForCompletion !== false && targetList.length === 1)

    if (shouldWait) {
      console.log(`[Facebook Bot] Executing synchronously for jobId: ${jobId}`);
      const child = spawn("node", [scriptPath, configPath], {
        stdio: ["ignore", logFd, logFd],
        cwd: path.dirname(scriptPath),
      })

      const statusFilePath = path.join(tempDir, `${jobId}-status.json`)
      const maxTimeoutMs = 180000 // 3 minutes timeout for image upload and browser interaction
      const startTime = Date.now()

      let processExited = false
      let processExitCode: number | null = null

      child.on("close", (code) => {
        processExited = true
        processExitCode = code
      })

      child.on("error", (err) => {
        processExited = true
        processExitCode = 1
        console.error(`[Facebook Bot] Child process spawn error for ${jobId}:`, err)
      })

      // Active polling loop: detect completion as soon as status file is written
      let finalStatus: any = null
      while (Date.now() - startTime < maxTimeoutMs) {
        if (fs.existsSync(statusFilePath)) {
          try {
            finalStatus = JSON.parse(fs.readFileSync(statusFilePath, "utf8"))
            if (finalStatus && (finalStatus.success !== undefined || finalStatus.results)) {
              break
            }
          } catch {}
        }

        if (processExited && processExitCode !== null) {
          // Process exited, wait 1 more second for disk flush
          await new Promise((r) => setTimeout(r, 1000))
          if (fs.existsSync(statusFilePath)) {
            try {
              finalStatus = JSON.parse(fs.readFileSync(statusFilePath, "utf8"))
            } catch {}
          }
          break
        }

        await new Promise((r) => setTimeout(r, 1500))
      }

      if (finalStatus) {
        const isSuccess = finalStatus.success === true || (finalStatus.summary && finalStatus.summary.success > 0)
        return NextResponse.json({
          ...finalStatus,
          success: isSuccess,
          jobId,
          engine: "bot",
          message: isSuccess
            ? "Published successfully to Facebook!"
            : (finalStatus.results?.[0]?.error || "Facebook Bot posting failed"),
        }, { status: isSuccess ? 200 : 400 })
      }

      if (processExited && processExitCode === 0) {
        return NextResponse.json({
          success: true,
          jobId,
          engine: "bot",
          message: "Puppeteer Bot completed successfully.",
        })
      }

      return NextResponse.json(
        {
          success: false,
          jobId,
          engine: "bot",
          error: "Facebook bot execution timed out. Please check browser session.",
        },
        { status: 500 }
      )
    } else {
      // Spawn background process for multi-destination bulk batches
      const child = spawn("node", [scriptPath, configPath], {
        detached: true,
        stdio: ["ignore", logFd, logFd],
        cwd: path.dirname(scriptPath),
      })
      child.unref()

      return NextResponse.json({
        success: true,
        jobId,
        engine: "bot",
        async: true,
        message: `Puppeteer Bot started for ${targetList.length} destination(s) in background.`,
        targetCount: targetList.length,
        antiSpamDelay: botConfig.delaySeconds,
      })
    }
  } catch (error: any) {
    console.error("[Facebook Bot API Error]:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to launch Facebook Bot" },
      { status: 500 }
    )
  }
}
