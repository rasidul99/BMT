import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    await mkdir(uploadsDir, { recursive: true })

    const ext = path.extname(file.name) || (file.type.startsWith("video") ? ".mp4" : ".jpg")
    const safeBase = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30)
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e4)}`
    const filename = `${safeBase || "asset"}-${uniqueSuffix}${ext}`
    const filepath = path.join(uploadsDir, filename)

    await writeFile(filepath, buffer)

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1)
    const formattedSize = file.size >= 1024 * 1024 ? `${sizeInMb} MB` : `${(file.size / 1024).toFixed(1)} KB`

    return NextResponse.json({
      success: true,
      url: `/uploads/${filename}`,
      filename,
      originalName: file.name,
      size: formattedSize,
      mimeType: file.type,
    })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload file", details: error.message },
      { status: 500 }
    )
  }
}
