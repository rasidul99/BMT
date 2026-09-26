"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
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
  Shield,
  Zap,
  User,
  ChevronDown,
  X,
  Menu,
} from "lucide-react"
import { useWorkspace } from "../../hooks/useWorkspace"
import { useAuth } from "../../hooks/useAuth"
import { useTheme } from "../../hooks/useTheme"
import { useSidebarStore } from "../../stores/sidebar.store"

// Custom SVG Icons
function FacebookSvgIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="-125 -44 600 600" fill="currentColor">
      <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
    </svg>
  )
}

function TikTokIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3 15.28a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.41a8.3 8.3 0 0 0 4.91 1.6V6.57a4.85 4.85 0 0 1-1-.02z" />
    </svg>
  )
}

function TelegramSvgIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
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
  const { isCollapsed, toggleSidebar, toggleMobileSidebar } = useSidebarStore()

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [isPlatformDropdownOpen, setIsPlatformDropdownOpen] = useState(false)
  const profileDropdownRef = useRef<HTMLDivElement>(null)
  const platformDropdownRef = useRef<HTMLDivElement>(null)

  const workspaceId = activeWorkspace?.id || "workspace-1"
  const displayName = user?.name || "Julkar Nayeem"

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false)
      }
      if (
        platformDropdownRef.current &&
        !platformDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPlatformDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const platforms = [
    {
      id: "facebook",
      name: "Facebook Marketing",
      iconComponent: FacebookSvgIcon,
      bgColor: "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60",
      activeBg: "bg-blue-600 text-white shadow-xs font-semibold ring-1 ring-blue-500",
      isActive: true,
    },
    {
      id: "instagram",
      name: "Instagram Marketing",
      iconComponent: Instagram,
      bgColor: "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60",
      activeBg: "bg-blue-600 text-white shadow-xs font-semibold ring-1 ring-blue-500",
      isActive: false,
    },
    {
      id: "youtube",
      name: "YouTube Marketing",
      iconComponent: Youtube,
      bgColor: "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60",
      activeBg: "bg-blue-600 text-white shadow-xs font-semibold ring-1 ring-blue-500",
      isActive: false,
    },
    {
      id: "tiktok",
      name: "TikTok Marketing",
      iconComponent: TikTokIcon,
      bgColor: "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60",
      activeBg: "bg-blue-600 text-white shadow-xs font-semibold ring-1 ring-blue-500",
      isActive: false,
    },
    {
      id: "telegram",
      name: "Telegram Marketing",
      iconComponent: TelegramSvgIcon,
      bgColor: "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60",
      activeBg: "bg-blue-600 text-white shadow-xs font-semibold ring-1 ring-blue-500",
      isActive: false,
    },
    {
      id: "shope",
      name: "Shope (E-Commerce)",
      iconComponent: ShoppingBag,
      bgColor: "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60",
      activeBg: "bg-blue-600 text-white shadow-xs font-semibold ring-1 ring-blue-500",
      isActive: false,
    },
    {
      id: "blog",
      name: "Blog & Content",
      iconComponent: BookOpen,
      bgColor: "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60",
      activeBg: "bg-blue-600 text-white shadow-xs font-semibold ring-1 ring-blue-500",
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

  const handleMobilePlatformSelect = (platform: (typeof platforms)[0]) => {
    setIsPlatformDropdownOpen(false)
    handlePlatformClick(platform)
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
    <header className="w-full border-b border-border bg-card text-foreground shadow-xs sticky top-0 z-50">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-blue-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-blue-400 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-75 font-bold" aria-label="Close notification">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Mobile Backdrop Overlay (Dims background behind open dropdowns) */}
      {(isPlatformDropdownOpen || isProfileDropdownOpen) && (
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => {
            setIsPlatformDropdownOpen(false)
            setIsProfileDropdownOpen(false)
          }}
        />
      )}

      <div className="flex h-14 items-center justify-between">
        {/* 1. Left Area: Logo & Mobile Menu Toggle */}
        <div
          className={`flex items-center gap-2 border-r-0 md:border-r border-border h-full transition-all duration-300 shrink-0 ${
            isCollapsed ? "w-auto md:w-16 px-3 md:px-2 justify-center" : "w-auto md:w-64 px-3 md:px-4 justify-start"
          }`}
        >
          <div
            onClick={() => router.push(`/workspace/${workspaceId}/safe/dashboard`)}
            className="flex items-center justify-center cursor-pointer group"
            title="BMT OS Dashboard"
          >
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-xs group-hover:bg-blue-700 transition-colors">
              BMT
            </div>
          </div>

          {/* Mobile Menu Toggle Button (Beside Logo on Mobile) */}
          <button
            onClick={toggleMobileSidebar}
            aria-label="Toggle navigation menu"
            title="Open Menu"
            className="md:hidden h-9 w-9 rounded-xl border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition flex items-center justify-center shrink-0 shadow-xs active:scale-95"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Middle: Collapse Button + Platform Icons (Desktop Only) */}
        <div className="hidden md:flex flex-1 items-center space-x-2 sm:space-x-3 px-4 overflow-x-auto no-scrollbar h-full py-1">
          {/* Sidebar Collapse Toggle Button */}
          <button
            onClick={toggleSidebar}
            title="Toggle Menu / Sidebar"
            className="h-10 w-10 rounded-xl border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition flex items-center justify-center shrink-0 shadow-xs group"
          >
            <PanelLeftOpen className="w-5 h-5 group-hover:text-blue-500 transition-colors" />
          </button>

          <div className="h-6 w-px bg-border shrink-0" />

          {/* Platform Icons (Desktop: Icon only, hover shows name tooltip) */}
          <nav className="flex items-center space-x-2 h-full py-1">
            {platforms.map((p) => {
              const isCurrentActive = p.id === "facebook"
              const IconComponent = p.iconComponent
              return (
                <div key={p.id} className="relative group flex items-center justify-center">
                  <button
                    onClick={() => handlePlatformClick(p)}
                    aria-label={p.name}
                    className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 transform group-hover:scale-105 shrink-0 ${
                      isCurrentActive ? p.activeBg : p.bgColor
                    } ${!isCurrentActive ? "opacity-75 hover:opacity-100" : ""}`}
                  >
                    <IconComponent className="w-5 h-5" />
                    {isCurrentActive && (
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-blue-600 animate-pulse" />
                    )}
                  </button>

                  {/* Hover Name Tooltip */}
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-black rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-slate-700 dark:border-slate-200">
                    {p.name}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900 dark:border-b-white" />
                  </div>
                </div>
              )
            })}
          </nav>
        </div>

        {/* 3. Right: Platform Dropdown (Mobile) + Profile Avatar */}
        <div className="px-3 sm:px-4 border-l-0 md:border-l border-border h-full flex items-center space-x-2 shrink-0 relative">
          {/* Mobile Platform Switcher Dropdown (Visible only on < md screens) */}
          <div className="relative md:hidden" ref={platformDropdownRef}>
            <button
              onClick={() => setIsPlatformDropdownOpen(!isPlatformDropdownOpen)}
              className="h-10 px-2 rounded-xl border border-border bg-muted/40 hover:bg-muted text-foreground flex items-center gap-1.5 shadow-xs transition active:scale-95 min-h-[40px]"
              aria-label="Select platform"
              aria-expanded={isPlatformDropdownOpen}
              title="Platform Menu"
            >
              <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs relative shrink-0">
                <FacebookSvgIcon className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-1 ring-blue-600 animate-pulse" />
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
                  isPlatformDropdownOpen ? "rotate-180 text-foreground" : ""
                }`}
              />
            </button>

            {/* Mobile Platform Dropdown Popover */}
            {isPlatformDropdownOpen && (
              <div className="absolute top-full mt-2 right-0 w-64 bg-card dark:bg-[#070B14] border border-border dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 text-xs space-y-1 ring-1 ring-black/10 dark:ring-white/5">
                <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between border-b border-border/80 mb-1">
                  <span>Switch Platform</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20">
                    Active: Facebook
                  </span>
                </div>

                {platforms.map((p) => {
                  const isCurrentActive = p.id === "facebook"
                  const IconComponent = p.iconComponent
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleMobilePlatformSelect(p)}
                      className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between transition min-h-[40px] text-left ${
                        isCurrentActive
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20 shadow-xs"
                          : "hover:bg-muted/70 text-foreground font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isCurrentActive
                              ? "bg-blue-600 text-white shadow-xs"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="text-xs truncate">{p.name}</span>
                      </div>
                      {isCurrentActive ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded font-medium">
                          Soon
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Profile Trigger Button */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="relative flex items-center justify-center p-1 rounded-full hover:bg-muted transition group"
              title="User Profile & Settings"
            >
              <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-border group-hover:ring-blue-500 transition-all">
                {displayName.charAt(0).toUpperCase()}
              </div>
              {/* Active Indicator Dot */}
              <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
            </button>

            {/* Profile Dropdown Popover */}
            {isProfileDropdownOpen && (
              <div className="absolute top-full mt-2 right-0 w-72 bg-card dark:bg-[#070B14] border border-border dark:border-slate-800 rounded-2xl shadow-2xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2 z-50 text-xs ring-1 ring-black/10 dark:ring-white/5">
              {/* User Header */}
              <div className="flex items-center space-x-3 border-b border-border pb-3">
                <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-extrabold text-sm text-foreground block truncate">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-muted-foreground block truncate">
                    {user?.email || "admin@bmt.app"}
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 mt-0.5">
                    Super Administrator
                  </span>
                </div>
              </div>

              {/* Setting 1: Mode Switcher (Safe vs Advanced) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Platform Engine Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      if (currentMode !== "SAFE") handleToggleMode()
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition ${
                      currentMode === "SAFE"
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs"
                        : "border-border hover:bg-muted text-muted-foreground font-semibold"
                    }`}
                  >
                    <Shield className="w-4 h-4 mb-1 text-emerald-500" />
                    <span className="text-xs">SAFE Mode</span>
                    <span className="text-[9px] opacity-75">Graph API</span>
                  </button>

                  <button
                    onClick={() => {
                      if (currentMode !== "ADVANCED") handleToggleMode()
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition ${
                      currentMode === "ADVANCED"
                        ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 font-bold shadow-xs"
                        : "border-border hover:bg-muted text-muted-foreground font-semibold"
                    }`}
                  >
                    <Zap className="w-4 h-4 mb-1 text-amber-500" />
                    <span className="text-xs">ADVANCED Mode</span>
                    <span className="text-[9px] opacity-75">High-Power</span>
                  </button>
                </div>
              </div>

              {/* Setting 2: Theme Toggle */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Appearance
                </label>
                <div className="flex items-center justify-between p-2 rounded-xl border border-border bg-muted/20">
                  <span className="font-semibold text-foreground flex items-center space-x-2">
                    {theme === "dark" ? (
                      <Moon className="w-4 h-4 text-purple-400" />
                    ) : (
                      <Sun className="w-4 h-4 text-amber-500" />
                    )}
                    <span>{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
                  </span>
                  <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="px-2.5 py-1 rounded-lg border text-[11px] font-bold bg-background hover:bg-muted transition"
                  >
                    Toggle
                  </button>
                </div>
              </div>

              {/* Setting 3: Logout Action */}
              <div className="pt-2 border-t border-border">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-1.5 p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out of BMT OS</span>
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </header>
  )
}
