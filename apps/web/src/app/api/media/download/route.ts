import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const format = searchParams.get("format") || "video"
  const requestedName = searchParams.get("filename")
  const fileParam = searchParams.get("file")

  const isVideo = format.toLowerCase().includes("video") || format === "mp4"
  const defaultFilename = isVideo ? "facebook_media_1080p.mp4" : "extracted_audio.mp3"
  const filename = requestedName ? requestedName : defaultFilename

  let filePath: string
  if (fileParam) {
    // Sanitize file path to remain within public directory
    const cleanRelative = fileParam.replace(/^\/+/, "").replace(/\.\./g, "")
    filePath = path.join(process.cwd(), "public", cleanRelative)
  } else {
    const assetFile = isVideo ? "sample-video.mp4" : "sample-audio.mp3"
    filePath = path.join(process.cwd(), "public", assetFile)
  }

  try {
    if (!fs.existsSync(filePath)) {
      // Fallback to sample if custom file missing
      const fallbackFile = isVideo ? "sample-video.mp4" : "sample-audio.mp3"
      filePath = path.join(process.cwd(), "public", fallbackFile)
    }

    const fileBuffer = fs.readFileSync(filePath)
    const contentType = isVideo ? "video/mp4" : "audio/mpeg"

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("Download route error:", error)
    return NextResponse.json({ error: "Failed to download media" }, { status: 500 })
  }
}
