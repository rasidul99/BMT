"use client"

import React, { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useWorkspace } from "../../hooks/useWorkspace"
import { useAuth } from "../../hooks/useAuth"
import { useTheme } from "../../hooks/useTheme"

interface TopPlatformHeaderProps {
  currentMode?: "SAFE" | "ADVANCED"
}

export function TopPlatformHeader({ currentMode = "SAFE" }: TopPlatformHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { activeWorkspace, selectMode } = useWorkspace()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const workspaceId = activeWorkspace?.id || "workspace-1"

  const platforms = [
    {
      id: "facebook",
      name: "FACEBOOK MARKETING",
      icon: "📘",
      isActive: true,
      path: `/workspace/${workspaceId}/safe/dashboard`,
    },
    { id: "instagram", name: "INSTAGRAM", icon: "📸", isActive: false },
    { id: "youtube", name: "YOUTUBE", icon: "🔴", isActive: false },
    { id: "tiktok", name: "TIKTOK", icon: "🎵", isActive: false },
    { id: "telegram", name: "TELEGRAM", icon: "✈️", isActive: false },
    { id: "shope", name: "SHOPE", icon: "🛒", isActive: false },
    { id: "blog", name: "BLOG", icon: "📝", isActive: false },
  ]

  const handlePlatformClick = (platform: typeof platforms[0]) => {
    if (platform.isActive) {
      router.push(`/workspace/${workspaceId}/${currentMode.toLowerCase()}/dashboard`)
    } else {
      setToastMessage(`${platform.name} মডিউলটি পরবর্তী ফেজে রিলিজ করা হবে। বর্তমানে ফেসবুক অটোমেশন সক্রিয় আছে।`)
      setTimeout(() => setToastMessage(null), 3500)
    }
  }

  const handleToggleMode = () => {
    const nextMode = currentMode === "SAFE" ? "ADVANCED" : "SAFE"
    selectMode(nextMode)
    if (nextMode === "SAFE") {
      router.push(`/workspace/${workspaceId}/safe/dashboard`)
    } else {
      router.push(`/workspace/${workspaceId}/advanced/designer`)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/auth/login")
  }

  return (
    <header className="w-full border-b bg-card text-foreground shadow-sm sticky top-0 z-50">
      {/* Toast Notification for Coming Soon platforms */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-blue-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span>ℹ️</span>
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-75 font-bold">✕</button>
        </div>
      )}

      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        {/* 1. Left: BMT Brand Logo */}
        <div className="flex items-center space-x-3 pr-4 border-r">
          <div
            onClick={() => router.push(`/workspace/${workspaceId}/safe/dashboard`)}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-xs shadow-sm group-hover:scale-105 transition-transform">
              BMT
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-sm tracking-tight block leading-none">BMT OS</span>
              <span className="text-[10px] text-muted-foreground font-medium">Marketing Suite</span>
            </div>
          </div>
        </div>

        {/* 2. Center: Platform Switcher Navigation Tabs */}
        <nav className="flex-1 flex items-center space-x-1 sm:space-x-2 overflow-x-auto px-3 scrollbar-none">
          {platforms.map((p) => {
            const isCurrentActive = p.id === "facebook"
            return (
              <button
                key={p.id}
                onClick={() => handlePlatformClick(p)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  isCurrentActive
                    ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-500"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                <span>{p.icon}</span>
                <span>{p.name}</span>
                {isCurrentActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                )}
              </button>
            )
          })}
        </nav>

        {/* 3. Right: Controls (Mode Toggle, Theme, Profile) */}
        <div className="flex items-center space-x-2.5 pl-3 border-l">
          {/* Mode Switcher Button */}
          <button
            onClick={handleToggleMode}
            title="Switch between SAFE and ADVANCED Mode"
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition border ${
              currentMode === "SAFE"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-500/20"
                : "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-800 hover:bg-orange-500/20"
            }`}
          >
            <span>{currentMode === "SAFE" ? "🟢 SAFE" : "⚡ ADVANCED"}</span>
            <span className="text-[10px] opacity-75 font-normal">Switch</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-1.5 border rounded-lg hover:bg-muted text-xs transition"
            title="Theme"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {/* User Profile & Logout */}
          <div className="flex items-center space-x-2 text-xs">
            <div className="hidden md:flex items-center space-x-1.5">
              <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                {user?.name ? user.name[0].toUpperCase() : "A"}
              </div>
              <span className="font-semibold max-w-[100px] truncate">{user?.name || "Admin"}</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-2 py-1 border rounded-md text-xs hover:bg-destructive/10 text-destructive font-semibold transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
