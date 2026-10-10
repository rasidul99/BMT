import { NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import path from "path"
import fs from "fs"
import { promisify } from "util"

const execPromise = promisify(exec)

export async function POST(req: NextRequest) {
  try {
    const { url, format } = await req.json()

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    const trimmedUrl = url.trim()
    const isAudio = format && (format.includes("Audio") || format.includes("MP3"))
    const formatParam = isAudio ? "audio" : "video"

    // Ensure downloads directory exists
    const downloadsDir = path.join(process.cwd(), "public", "downloads")
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true })
    }

    // Determine platform
    let platform = "Web Video"
    const lowerUrl = trimmedUrl.toLowerCase()
    if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
      platform = "YouTube"
    } else if (lowerUrl.includes("tiktok.com")) {
      platform = "TikTok"
    } else if (lowerUrl.includes("pinterest.") || lowerUrl.includes("pin.it")) {
      platform = "Pinterest"
    } else if (lowerUrl.includes("instagram.com")) {
      platform = "Instagram"
    } else if (lowerUrl.includes("facebook.com") || lowerUrl.includes("fb.watch") || lowerUrl.includes("fb.com")) {
      platform = "Facebook"
    } else if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com")) {
      platform = "Twitter / X"
    } else if (lowerUrl.includes("reddit.com") || lowerUrl.includes("v.redd.it")) {
      platform = "Reddit"
    } else if (lowerUrl.includes("vimeo.com")) {
      platform = "Vimeo"
    } else if (lowerUrl.endsWith(".mp4") || lowerUrl.includes(".mp4?")) {
      platform = "Direct Video"
    }

    // Path to python script
    let scriptPath = path.join(process.cwd(), "scripts", "extract_media.py")
    if (!fs.existsSync(scriptPath)) {
      scriptPath = path.join(process.cwd(), "apps", "web", "scripts", "extract_media.py")
    }

    // Run Python extractor with UTF-8 environment
    const cmd = `python "${scriptPath}" "${trimmedUrl}" "${downloadsDir}" "${formatParam}"`
    
    let extractedData: any = null
    try {
      const { stdout } = await execPromise(cmd, {
        maxBuffer: 20 * 1024 * 1024,
        timeout: 60000,
        env: {
          ...process.env,
          PYTHONIOENCODING: "utf-8",
        },
      })

      // Extract JSON cleanly between first { and last }
      const jsonStart = stdout.indexOf("{")
      const jsonEnd = stdout.lastIndexOf("}")
      if (jsonStart !== -1 && jsonEnd !== -1) {
        extractedData = JSON.parse(stdout.substring(jsonStart, jsonEnd + 1))
      }
    } catch (execErr: any) {
      console.warn("Python extractor process error:", execErr.message)
      if (execErr.stdout) {
        const jsonStart = execErr.stdout.indexOf("{")
        const jsonEnd = execErr.stdout.lastIndexOf("}")
        if (jsonStart !== -1 && jsonEnd !== -1) {
          try {
            extractedData = JSON.parse(execErr.stdout.substring(jsonStart, jsonEnd + 1))
          } catch (_) {}
        }
      }
    }

    if (extractedData && extractedData.success) {
      return NextResponse.json({
        success: true,
        id: extractedData.id,
        title: extractedData.title,
        platform: extractedData.platform || platform,
        format: isAudio ? "Audio (MP3)" : "1080p Video (MP4)",
        fileSize: extractedData.fileSize,
        videoUrl: extractedData.videoUrl,
        thumbnailUrl: extractedData.thumbnailUrl,
        duration: extractedData.duration,
      })
    }

    // If extraction failed, report the actual reason so user knows what happened
    const failureReason = extractedData?.error || "ভিডিওটি ডাউনলোড করা সম্ভব হয়নি। লিংকটি সঠিক ও ভিডিওটি পাবলিক কিনা নিশ্চিত করুন।"
    return NextResponse.json({
      success: false,
      error: failureReason,
      platform,
    }, { status: 422 })
  } catch (err: any) {
    console.error("Extraction API fatal error:", err)
    return NextResponse.json({
      error: err.message || "Failed to extract media",
    }, { status: 500 })
  }
}
