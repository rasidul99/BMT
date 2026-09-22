"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Facebook,
  Instagram,
  Youtube,
  Send,
  ShoppingBag,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  LogOut,
  Sparkles,
} from "lucide-react"
import { useWorkspace } from "../../hooks/useWorkspace"
import { useAuth } from "../../hooks/useAuth"
import { useTheme } from "../../hooks/useTheme"
import { useSidebarStore } from "../../stores/sidebar.store"

function TikTokIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3 15.28a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.41a8.3 8.3 0 0 0 4.91 1.6V6.57a4.85 4.85 0 0 1-1-.02z" />
    </svg>
  )
}

interface TopPlatformHeaderProps {
  currentMode?: "SAFE" | "ADVANCED"
}

export function TopPlatformHeader({ currentMode = "SAFE" }: TopPlatformHeaderProps) {
  const router = useRouter()
  const { activeWorkspace, selectMode } = useWorkspace()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const { isCollapsed, toggleSidebar } = useSidebarStore()
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const workspaceId = activeWorkspace?.id || "workspace-1"

  const platforms = [
    {
      id: "facebook",
      name: "FACEBOOK MARKETING",
      icon: Facebook,
      color: "text-blue-500",
      isActive: true,
    },
    {
      id: "instagram",
      name: "INSTAGRAM",
      icon: Instagram,
      color: "text-pink-500",
      isActive: false,
    },
    {
      id: "youtube",
      name: "YOUTUBE",
      icon: Youtube,
      color: "text-red-500",
      isActive: false,
    },
    {
      id: "tiktok",
      name: "TIKTOK",
      isCustom: true,
      iconComponent: TikTokIcon,
      color: "text-cyan-400",
      isActive: false,
    },
    {
      id: "telegram",
      name: "TELEGRAM",
      icon: Send,
      color: "text-sky-400",
      isActive: false,
    },
    {
      id: "shope",
      name: "SHOPE",
      icon: ShoppingBag,
      color: "text-amber-400",
      isActive: false,
    },
    {
      id: "blog",
      name: "BLOG",
      icon: BookOpen,
      color: "text-emerald-400",
      isActive: false,
    },
  ]

  const handlePlatformClick = (platform: (typeof platforms)[0]) => {
    if (platform.isActive) {
      router.push(`/workspace/${workspaceId}/${currentMode.toLowerCase()}/dashboard`)
    } else {
      setToastMessage(`${platform.name} মডিউলটি পরবর্তী ফেজে রিলিজ করা হবে। বর্তমানে ফেসবুক মার্কেটিং সক্রিয় রয়েছে।`)
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
    <header className="w-full border-b border-border bg-card text-foreground shadow-sm sticky top-0 z-50">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-blue-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 border border-blue-400">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-75 font-bold">
            ✕
          </button>
        </div>
      )}

      <div className="flex h-14 items-center justify-between">
        {/* 1. Left Area: Strictly aligns with Sidebar width (w-64 or w-16 when collapsed) */}
        <div
          className={`flex items-center border-r border-border h-full transition-all duration-300 shrink-0 ${
            isCollapsed ? "w-16 px-2 justify-center" : "w-64 px-4 justify-between"
          }`}
        >
          {/* Logo & Branding */}
          <div
            onClick={() => router.push(`/workspace/${workspaceId}/safe/dashboard`)}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-xs shadow-md group-hover:scale-105 transition-transform">
              BMT
            </div>
            {!isCollapsed && (
              <div className="leading-tight">
                <span className="font-extrabold text-sm tracking-tight block">BMT OS</span>
                <span className="text-[10px] text-muted-foreground font-medium">Marketing Suite</span>
              </div>
            )}
          </div>

          {/* Sidebar Collapse / Expand Button */}
          <button
            onClick={toggleSidebar}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition flex items-center justify-center"
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* 2. Middle: Platform Switcher Tabs (Aligned with Main Content area, Clean no-scrollbar) */}
        <nav className="flex-1 flex items-center space-x-1 sm:space-x-2 overflow-x-auto px-4 no-scrollbar">
          {platforms.map((p) => {
            const isCurrentActive = p.id === "facebook"
            return (
              <button
                key={p.id}
                onClick={() => handlePlatformClick(p)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 ${
                  isCurrentActive
                    ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-500"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                }`}
              >
                {p.isCustom && p.iconComponent ? (
                  <p.iconComponent className={`w-3.5 h-3.5 ${isCurrentActive ? "text-white" : p.color}`} />
                ) : p.icon ? (
                  <p.icon className={`w-3.5 h-3.5 ${isCurrentActive ? "text-white" : p.color}`} />
                ) : null}

                <span>{p.name}</span>

                {isCurrentActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                )}
              </button>
            )
          })}
        </nav>

        {/* 3. Right: Controls (Mode Toggle, Theme, Profile) */}
        <div className="flex items-center space-x-2 px-4 border-l border-border h-full shrink-0">
          {/* Mode Switcher Button */}
          <button
            onClick={handleToggleMode}
            title="Switch between SAFE and ADVANCED Mode"
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition border shadow-xs ${
              currentMode === "SAFE"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-500/20"
                : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-800 hover:bg-orange-500/20"
            }`}
          >
            <span>{currentMode === "SAFE" ? "🟢 SAFE" : "⚡ ADVANCED"}</span>
            <span className="text-[10px] opacity-75 font-normal">Switch</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-1.5 border border-border rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
            title="Toggle Light/Dark Theme"
          >
            {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
          </button>

          {/* User Profile Info & Logout */}
          <div className="flex items-center space-x-2 text-xs pl-1">
            <div className="hidden lg:flex items-center space-x-1.5">
              <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shadow-xs">
                {user?.name ? user.name[0].toUpperCase() : "A"}
              </div>
              <span className="font-semibold max-w-[90px] truncate text-foreground">{user?.name || "Admin"}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 px-2.5 py-1 border border-border rounded-md text-xs hover:bg-destructive/10 text-destructive font-semibold transition"
              title="Logout"
            >
              <LogOut className="w-3 h-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
