/**
 * BMT Facebook Page Registry
 * Manages multiple Facebook Pages with their credentials for multi-page posting.
 * 
 * Each page entry contains: pageId, pageName, accessToken, tokenExpiry, category.
 * Registry is persisted in localStorage and synced with env-based defaults.
 * 
 * Production Note: In production, this registry should be stored in the database
 * (Prisma MetaConnection model) and accessed via backend API.
 */

export interface FacebookPageEntry {
  pageId: string
  pageName: string
  accessToken: string
  tokenExpiry: number  // Unix timestamp (ms)
  category: string
  isActive: boolean
}

const STORAGE_KEY = "bmt_fb_page_registry"

// Get all registered pages
export function getPageRegistry(): FacebookPageEntry[] {
  if (typeof window === "undefined") return []
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

// Save entire registry
export function savePageRegistry(pages: FacebookPageEntry[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pages))
}

// Add or update a page in the registry
export function upsertPage(page: FacebookPageEntry): void {
  const registry = getPageRegistry()
  const existingIdx = registry.findIndex(p => p.pageId === page.pageId)
  if (existingIdx !== -1) {
    registry[existingIdx] = { ...registry[existingIdx], ...page }
  } else {
    registry.push(page)
  }
  savePageRegistry(registry)
}

// Remove a page from the registry
export function removePage(pageId: string): void {
  const registry = getPageRegistry().filter(p => p.pageId !== pageId)
  savePageRegistry(registry)
}

// Get a specific page by ID
export function getPageById(pageId: string): FacebookPageEntry | null {
  return getPageRegistry().find(p => p.pageId === pageId) || null
}

// Get a specific page by name
export function getPageByName(pageName: string): FacebookPageEntry | null {
  return getPageRegistry().find(p => p.pageName === pageName) || null
}

// Get all active pages
export function getActivePages(): FacebookPageEntry[] {
  return getPageRegistry().filter(p => p.isActive)
}

// Update token for a specific page
export function updatePageToken(pageId: string, accessToken: string, tokenExpiry: number): void {
  const registry = getPageRegistry()
  const page = registry.find(p => p.pageId === pageId)
  if (page) {
    page.accessToken = accessToken
    page.tokenExpiry = tokenExpiry
    savePageRegistry(registry)
  }
}

// Initialize default pages from env variables if registry is empty
export function initializeDefaultPages(defaults: Omit<FacebookPageEntry, "isActive">[]): FacebookPageEntry[] {
  const existing = getPageRegistry()
  if (existing.length > 0) {
    let changed = false
    const merged = existing.map(item => {
      const match = defaults.find(d => d.pageName === item.pageName || d.pageId === item.pageId)
      if (match && match.accessToken && (!item.accessToken || item.accessToken !== match.accessToken)) {
        changed = true
        return { ...item, accessToken: match.accessToken, pageId: match.pageId }
      }
      return item
    })
    if (changed) {
      savePageRegistry(merged)
      return merged
    }
    return existing
  }

  const pages: FacebookPageEntry[] = defaults.map(d => ({
    ...d,
    isActive: true,
  }))
  savePageRegistry(pages)
  return pages
}

// Get page token for publishing (looks up by page name)
export function getPublishToken(accountName: string): { pageId: string; accessToken: string } | null {
  const page = getPageByName(accountName)
  if (page && page.isActive && page.accessToken) {
    return { pageId: page.pageId, accessToken: page.accessToken }
  }
  if (typeof window !== "undefined") {
    try {
      const connRaw = localStorage.getItem("bmt_connected_pages")
      if (connRaw) {
        const connected = JSON.parse(connRaw)
        const match = connected.find((p: any) => (p.name || p.pageName || "").toLowerCase() === accountName.toLowerCase())
        if (match) {
          return {
            pageId: match.pageId || match.id,
            accessToken: match.accessToken || match.token || process.env.NEXT_PUBLIC_FB_PAGE_TOKEN_CARE_HUB_BD || "",
          }
        }
      }
    } catch {}
  }
  if (accountName === "CARE HUB BD") {
    return {
      pageId: process.env.NEXT_PUBLIC_FB_PAGE_ID_CARE_HUB_BD || "892168940637389",
      accessToken: process.env.NEXT_PUBLIC_FB_PAGE_TOKEN_CARE_HUB_BD || "",
    }
  }
  return null
}
