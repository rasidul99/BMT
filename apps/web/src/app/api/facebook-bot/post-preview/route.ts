import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import crypto from "crypto"

function decodeHtmlEntities(str: string): string {
  if (!str) return ""
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      try {
        return String.fromCodePoint(parseInt(hex, 16))
      } catch {
        return _
      }
    })
    .replace(/&#([0-9]+);/g, (_, dec) => {
      try {
        return String.fromCodePoint(parseInt(dec, 10))
      } catch {
        return _
      }
    })
}

function extractMetaContent(html: string, prop: string): string {
  const regex1 = new RegExp(`property=["']${prop}["']\\s+content=["']([^"']+)["']`, "i")
  const regex2 = new RegExp(`content=["']([^"']+)["']\\s+property=["']${prop}["']`, "i")
  const regex3 = new RegExp(`name=["']${prop}["']\\s+content=["']([^"']+)["']`, "i")
  const m = html.match(regex1) || html.match(regex2) || html.match(regex3)
  return m?.[1] ? decodeHtmlEntities(m[1]).trim() : ""
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const rawUrl = String(body?.url || "").trim()

    if (!rawUrl || !rawUrl.startsWith("http")) {
      return NextResponse.json({ success: false, error: "Valid URL is required" }, { status: 400 })
    }

    const crawlerHeaders = {
      "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,bn;q=0.8",
    }

    const res = await fetch(rawUrl, {
      headers: crawlerHeaders,
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    })

    const html = await res.text()
    const resolvedUrl = res.url || rawUrl

    const ogTitle = extractMetaContent(html, "og:title")
    const ogDescription = extractMetaContent(html, "og:description")
    const ogImageUrl = extractMetaContent(html, "og:image")

    // Derive clean post title from first non-empty line of og:description, or fallback to og:title
    let postTitle = ""
    if (ogDescription) {
      const firstLine = ogDescription
        .split(/\r?\n/)
        .map((l) => l.trim())
        .find((l) => l.length > 0)
      if (firstLine) {
        postTitle = firstLine.length > 90 ? `${firstLine.slice(0, 87)}...` : firstLine
      }
    }
    if (!postTitle && ogTitle && ogTitle.toLowerCase() !== "facebook") {
      postTitle = ogTitle
    }

    // Download the OG image using facebookexternalhit UA so lookaside.fbsbx.com returns actual image bytes
    let localImageUrl = ""
    if (ogImageUrl && ogImageUrl.startsWith("http")) {
      try {
        const imgRes = await fetch(ogImageUrl, {
          headers: {
            "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
            Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          },
          redirect: "follow",
          signal: AbortSignal.timeout(10000),
        })

        const contentType = imgRes.headers.get("content-type") || ""
        if (imgRes.ok && contentType.startsWith("image/")) {
          const arrayBuffer = await imgRes.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          if (buffer.length > 500) {
            const hash = crypto.createHash("md5").update(rawUrl).digest("hex").slice(0, 12)
            const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg"
            const fileName = `fb-post-${hash}.${ext}`
            const uploadsDir = path.join(process.cwd(), "public", "uploads")
            if (!fs.existsSync(uploadsDir)) {
              fs.mkdirSync(uploadsDir, { recursive: true })
            }
            const filePath = path.join(uploadsDir, fileName)
            fs.writeFileSync(filePath, buffer)
            localImageUrl = `/uploads/${fileName}`
          }
        }
      } catch (imgErr) {
        console.warn("[post-preview] Failed to download OG image:", imgErr)
      }
    }

    return NextResponse.json({
      success: true,
      url: rawUrl,
      resolvedUrl,
      postTitle: postTitle || ogTitle || "",
      pageName: ogTitle || "",
      description: ogDescription || "",
      thumbnailUrl: localImageUrl || "",
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to fetch Facebook post preview",
      },
      { status: 500 }
    )
  }
}
