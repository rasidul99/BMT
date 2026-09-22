import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("bmt_token")?.value
  const { pathname, searchParams } = request.nextUrl

  // Allow OAuth callback redirects from Facebook (which carry code parameter) or connect-accounts page
  const isOAuthCallback = searchParams.has("code") || pathname.includes("/connect-accounts")

  if (!token && !isOAuthCallback && (pathname.startsWith("/workspace") || pathname === "/workspaces")) {
    const res = NextResponse.next()
    res.cookies.set("bmt_token", "bmt-local-dev-token", { path: "/", maxAge: 604800 })
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/workspace/:path*", "/workspaces", "/auth/:path*"],
}
