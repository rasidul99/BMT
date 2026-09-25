"use client"

import { useState, useEffect, useCallback } from "react"

export interface AccountProxy {
  ip: string
  port: number
  username?: string
  password?: string
  protocol: "http" | "socks5"
  status: "Active" | "Failed" | "Testing"
  latencyMs: number
}

export interface AssignedGroup {
  groupId: string
  groupName: string
  memberCount: number
  privacy: "Public" | "Private"
  joinedAt?: string
}

export interface FacebookAccountItem {
  id: string
  name: string
  uid: string
  avatarUrl: string
  accountType: "Personal Profile" | "Page Admin" | "BM Ad Account"
  authType: "Access Token" | "Cookie Session" | "OAuth 2.0"
  tokenOrCookie: string
  proxy: AccountProxy
  status: "Active" | "Warming Up" | "Checkpoint" | "Cooldown" | "Banned"
  dailyShareCount: number
  dailyLimit: number
  assignedGroups: AssignedGroup[]
  tags: string[]
  createdAt: string
  lastActive: string
}

const STORAGE_KEY = "bmt_fb_market_100_accounts"

const DEFAULT_ACCOUNTS: FacebookAccountItem[] = [
  {
    id: "acc-101",
    name: "Tariqul Islam (Dhaka Marketplace Lead)",
    uid: "100089234718291",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    accountType: "Personal Profile",
    authType: "Cookie Session",
    tokenOrCookie: "c_user=100089234718291; xs=42%3Abmt_session_token_ok",
    proxy: {
      ip: "103.145.23.11",
      port: 8080,
      protocol: "http",
      status: "Active",
      latencyMs: 78,
    },
    status: "Active",
    dailyShareCount: 8,
    dailyLimit: 20,
    tags: ["Dhaka Hub", "Fashion & Panjabi", "High Trust"],
    assignedGroups: [
      { groupId: "grp-1", groupName: "Dhaka Buy and Sell Official", memberCount: 185000, privacy: "Public" },
      { groupId: "grp-2", groupName: "Bangladesh E-Commerce Entrepreneurs", memberCount: 92000, privacy: "Public" },
      { groupId: "grp-3", groupName: "Mirpur Wholesale Marketplace", memberCount: 64000, privacy: "Public" },
    ],
    createdAt: "2026-08-10",
    lastActive: "15 mins ago",
  },
  {
    id: "acc-102",
    name: "Kamrul Hasan (Gadgets & Tech Poster)",
    uid: "100078129384729",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    accountType: "Personal Profile",
    authType: "Access Token",
    tokenOrCookie: "EAAG...bmt_verified_token_valid",
    proxy: {
      ip: "103.145.23.12",
      port: 8080,
      protocol: "socks5",
      status: "Active",
      latencyMs: 92,
    },
    status: "Active",
    dailyShareCount: 12,
    dailyLimit: 25,
    tags: ["Gadget Deals", "Smart Tools", "Active"],
    assignedGroups: [
      { groupId: "grp-4", groupName: "BD Smart Gadget & Electronics Hub", memberCount: 140000, privacy: "Public" },
      { groupId: "grp-5", groupName: "Dhaka Tech Enthusiasts & Traders", memberCount: 75000, privacy: "Public" },
    ],
    createdAt: "2026-08-12",
    lastActive: "2 hours ago",
  },
  {
    id: "acc-103",
    name: "Farhana Akter (Organic Food & Boutique)",
    uid: "100065239182374",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    accountType: "Page Admin",
    authType: "OAuth 2.0",
    tokenOrCookie: "EAAG...meta_oauth_page_token",
    proxy: {
      ip: "103.145.23.15",
      port: 3128,
      protocol: "http",
      status: "Active",
      latencyMs: 64,
    },
    status: "Warming Up",
    dailyShareCount: 4,
    dailyLimit: 15,
    tags: ["Organic Food", "Boutique", "Warming"],
    assignedGroups: [
      { groupId: "grp-6", groupName: "Pure & Organic Food BD", memberCount: 110000, privacy: "Public" },
      { groupId: "grp-7", groupName: "Dhaka Saree & Jewelry Boutique", memberCount: 88000, privacy: "Public" },
    ],
    createdAt: "2026-08-20",
    lastActive: "5 hours ago",
  },
  {
    id: "acc-104",
    name: "Nazmul Huda (Real Estate Specialist)",
    uid: "100054819203847",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    accountType: "Personal Profile",
    authType: "Cookie Session",
    tokenOrCookie: "c_user=100054819203847; xs=88%3Acheckpoint_pending",
    proxy: {
      ip: "103.145.23.18",
      port: 8080,
      protocol: "http",
      status: "Failed",
      latencyMs: 0,
    },
    status: "Checkpoint",
    dailyShareCount: 0,
    dailyLimit: 20,
    tags: ["Real Estate", "Flats & Plots", "Needs Review"],
    assignedGroups: [
      { groupId: "grp-8", groupName: "Bashundhara R/A Property Exchange", memberCount: 95000, privacy: "Public" },
    ],
    createdAt: "2026-08-22",
    lastActive: "1 day ago",
  },
]

export function useFacebookAccounts() {
  const [accounts, setAccounts] = useState<FacebookAccountItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from LocalStorage
  const loadAccounts = useCallback(() => {
    if (typeof window === "undefined") return
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAccounts(parsed)
          setIsLoaded(true)
          return
        }
      }
      // Initialize with defaults if empty
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS))
      setAccounts(DEFAULT_ACCOUNTS)
    } catch (e) {
      console.error("Failed to load Facebook Accounts from localStorage:", e)
      setAccounts(DEFAULT_ACCOUNTS)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  useEffect(() => {
    loadAccounts()

    const handleStorageChange = () => {
      loadAccounts()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("bmt_fb_accounts_update", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("bmt_fb_accounts_update", handleStorageChange)
    }
  }, [loadAccounts])

  // Save to LocalStorage
  const persistAccounts = (newAccounts: FacebookAccountItem[]) => {
    setAccounts(newAccounts)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newAccounts))
        window.dispatchEvent(new Event("bmt_fb_accounts_update"))
      } catch (e) {
        console.error("Failed to save Facebook accounts to localStorage:", e)
      }
    }
  }

  // 1. Add Single Account
  const addAccount = (accountData: Omit<FacebookAccountItem, "id" | "createdAt" | "dailyShareCount">) => {
    if (accounts.length >= 100) {
      throw new Error("Maximum capacity reached: 100 Facebook Accounts limit.")
    }

    const newAccount: FacebookAccountItem = {
      ...accountData,
      id: `acc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      dailyShareCount: 0,
      createdAt: new Date().toISOString().split("T")[0],
    }

    const updated = [newAccount, ...accounts]
    persistAccounts(updated)
    return newAccount
  }

  // 2. Update Existing Account
  const updateAccount = (id: string, updates: Partial<FacebookAccountItem>) => {
    const updated = accounts.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc))
    persistAccounts(updated)
  }

  // 3. Delete Account
  const deleteAccount = (id: string) => {
    const updated = accounts.filter((acc) => acc.id !== id)
    persistAccounts(updated)
  }

  // 4. Bulk Import Accounts
  // Format supported: UID|TokenOrCookie|ProxyIP:Port[:User:Pass]|Name
  // Or CSV lines
  const bulkImportAccounts = (rawText: string) => {
    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    const newItems: FacebookAccountItem[] = []

    for (const line of lines) {
      if (accounts.length + newItems.length >= 100) {
        break
      }

      // Check pipe or comma separator
      const parts = line.includes("|") ? line.split("|") : line.split(",")
      if (parts.length >= 2) {
        const uid = parts[0]?.trim() || `1000${Math.floor(Math.random() * 9000000000)}`
        const tokenOrCookie = parts[1]?.trim() || "c_user=session_mock"
        const proxyStr = parts[2]?.trim() || "103.145.23.20:8080"
        const name = parts[3]?.trim() || `FB Marketing Account ${uid.slice(-4)}`

        let ip = "103.145.23.20"
        let port = 8080
        let user: string | undefined = undefined
        let pass: string | undefined = undefined

        if (proxyStr.includes(":")) {
          const proxyParts = proxyStr.split(":")
          ip = proxyParts[0] || ip
          port = parseInt(proxyParts[1], 10) || 8080
          if (proxyParts.length >= 4) {
            user = proxyParts[2]
            pass = proxyParts[3]
          }
        }

        const item: FacebookAccountItem = {
          id: `acc-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          name,
          uid,
          avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + newItems.length * 10}?w=120&auto=format&fit=crop&q=80`,
          accountType: "Personal Profile",
          authType: tokenOrCookie.startsWith("EAAG") ? "Access Token" : "Cookie Session",
          tokenOrCookie,
          proxy: {
            ip,
            port,
            username: user,
            password: pass,
            protocol: "http",
            status: "Active",
            latencyMs: Math.floor(65 + Math.random() * 45),
          },
          status: "Active",
          dailyShareCount: 0,
          dailyLimit: 20,
          assignedGroups: [],
          tags: ["Bulk Imported", "Active"],
          createdAt: new Date().toISOString().split("T")[0],
          lastActive: "Just added",
        }

        newItems.push(item)
      }
    }

    if (newItems.length > 0) {
      const updated = [...newItems, ...accounts]
      persistAccounts(updated)
    }

    return newItems.length
  }

  // 5. Test Proxy Health
  const testProxy = async (accountId: string) => {
    updateAccount(accountId, {
      proxy: {
        ...accounts.find((a) => a.id === accountId)!.proxy,
        status: "Testing",
      },
    })

    // Simulate network handshake ping (1-1.5s)
    await new Promise((r) => setTimeout(r, 1200))

    const isSuccess = Math.random() > 0.08
    const latency = isSuccess ? Math.floor(55 + Math.random() * 50) : 0

    updateAccount(accountId, {
      proxy: {
        ...accounts.find((a) => a.id === accountId)!.proxy,
        status: isSuccess ? "Active" : "Failed",
        latencyMs: latency,
      },
    })

    return isSuccess
  }

  // 6. Assign Group to Account
  const assignGroupToAccount = (accountId: string, group: AssignedGroup) => {
    const acc = accounts.find((a) => a.id === accountId)
    if (!acc) return

    const alreadyAssigned = acc.assignedGroups.some((g) => g.groupId === group.groupId)
    if (alreadyAssigned) return

    const updatedGroups = [...acc.assignedGroups, group]
    updateAccount(accountId, { assignedGroups: updatedGroups })
  }

  // 7. Remove Assigned Group
  const removeAssignedGroup = (accountId: string, groupId: string) => {
    const acc = accounts.find((a) => a.id === accountId)
    if (!acc) return

    const updatedGroups = acc.assignedGroups.filter((g) => g.groupId !== groupId)
    updateAccount(accountId, { assignedGroups: updatedGroups })
  }

  // 8. Record a Share Action (Increments daily counter and updates lastActive)
  const recordShare = (accountId: string) => {
    const acc = accounts.find((a) => a.id === accountId)
    if (!acc) return

    updateAccount(accountId, {
      dailyShareCount: acc.dailyShareCount + 1,
      lastActive: "Just now",
    })
  }

  // Summary Metrics
  const activeCount = accounts.filter((a) => a.status === "Active").length
  const warmingCount = accounts.filter((a) => a.status === "Warming Up").length
  const checkpointCount = accounts.filter((a) => a.status === "Checkpoint").length
  const bannedCount = accounts.filter((a) => a.status === "Banned").length
  const activeProxies = accounts.filter((a) => a.proxy.status === "Active").length
  const totalGroupsReach = accounts.reduce(
    (sum, a) => sum + a.assignedGroups.reduce((gSum, g) => gSum + g.memberCount, 0),
    0
  )

  return {
    accounts,
    isLoaded,
    metrics: {
      total: accounts.length,
      maxCapacity: 100,
      activeCount,
      warmingCount,
      checkpointCount,
      bannedCount,
      activeProxies,
      totalGroupsReach,
    },
    addAccount,
    updateAccount,
    deleteAccount,
    bulkImportAccounts,
    testProxy,
    assignGroupToAccount,
    removeAssignedGroup,
    recordShare,
    reload: loadAccounts,
  }
}
