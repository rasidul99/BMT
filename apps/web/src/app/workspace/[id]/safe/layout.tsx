"use client"

import React from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Link as LinkIcon,
  Folder,
  CalendarClock,
  Image as ImageIcon,
  PanelTop,
  Download,
  Users,
  Pin,
  MessageSquareText,
  ShieldAlert,
  Inbox,
  Flame,
  Search,
  Activity,
  Zap,
  Sparkles,
  UserPlus,
  UserMinus,
  MessageCircle,
} from "lucide-react"
import { useWorkspace } from "../../../../hooks/useWorkspace"
import { TopPlatformHeader } from "../../../../components/layout/TopPlatformHeader"
import { useSidebarStore } from "../../../../stores/sidebar.store"

export default function SafeLayout({ children }: { children: React.ReactNode }) {
  const { activeWorkspace } = useWorkspace()
  const { isCollapsed } = useSidebarStore()
  const router = useRouter()
  const pathname = usePathname()

  const workspaceId = activeWorkspace?.id || "workspace-1"
  const isActive = (path: string) => pathname.includes(path)

  const navItems = [
    {
      category: "Main & Accounts",
      items: [
        { label: "Overview Dashboard", icon: LayoutDashboard, path: `/workspace/${workspaceId}/safe/dashboard` },
        { label: "Facebook Market (100 Accounts)", icon: Users, path: `/workspace/${workspaceId}/safe/facebook-market` },
        { label: "Connect FB Pages (OAuth)", icon: LinkIcon, path: `/workspace/${workspaceId}/safe/connect-accounts` },
        { label: "Asset Library", icon: Folder, path: `/workspace/${workspaceId}/safe/library` },
      ],
    },
    {
      category: "Post Suite & Content",
      items: [
        { label: "AI Post Scheduler", icon: CalendarClock, path: `/workspace/${workspaceId}/safe/post-scheduler` },
        { label: "AI Post Variations", icon: Sparkles, path: `/workspace/${workspaceId}/safe/ai-variations` },
        { label: "Clickable Image Generator", icon: ImageIcon, path: `/workspace/${workspaceId}/safe/clickable-image` },
        { label: "Landing Page Builder", icon: PanelTop, path: `/workspace/${workspaceId}/safe/landing-page` },
        { label: "Media Downloader", icon: Download, path: `/workspace/${workspaceId}/safe/downloader` },
      ],
    },
    {
      category: "Engagement & Moderation",
      items: [
        { label: "Post A Group", icon: Users, path: `/workspace/${workspaceId}/safe/group-poster` },
        { label: "CTA Pin Comment", icon: Pin, path: `/workspace/${workspaceId}/safe/cta-pin-comment` },
        { label: "AI Comment Assistant", icon: MessageSquareText, path: `/workspace/${workspaceId}/safe/comment-assistant` },
        { label: "Link Comment Block", icon: ShieldAlert, path: `/workspace/${workspaceId}/safe/link-comment-block` },
        { label: "AI Inbox Reply Assistant", icon: Inbox, path: `/workspace/${workspaceId}/safe/inbox-assistant` },
        { label: "AI Messenger Group Assistant", icon: MessageCircle, path: `/workspace/${workspaceId}/safe/messenger-group` },
      ],
    },
    {
      category: "Audience & Growth",
      items: [
        { label: "Friend Automation", icon: UserPlus, path: `/workspace/${workspaceId}/safe/friend-automation` },
        { label: "Unfriend Inactive", icon: UserMinus, path: `/workspace/${workspaceId}/safe/unfriend-inactive` },
      ],
    },
    {
      category: "Research & Intelligence",
      items: [
        { label: "Viral Content Finder", icon: Flame, path: `/workspace/${workspaceId}/safe/viral-content` },
        { label: "FB Group Hunter", icon: Search, path: `/workspace/${workspaceId}/safe/group-hunter` },
        { label: "Risk Score Detector", icon: Activity, path: `/workspace/${workspaceId}/safe/risk-detector` },
      ],
    },
  ]

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* 1. Global Top Platform Navigation Header */}
      <TopPlatformHeader currentMode="SAFE" />

      {/* 2. Workspace Content with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`border-r border-border bg-card flex flex-col justify-between transition-all duration-300 shadow-sm shrink-0 overflow-hidden ${
            isCollapsed ? "w-16 p-2" : "w-64 p-3"
          }`}
        >
          <div className="space-y-3 overflow-hidden flex flex-col flex-1">
            {/* Sidebar Sub-Header */}
            <div className={`flex items-center gap-2 px-1 py-1 ${isCollapsed ? "justify-center" : ""}`}>
              <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-xs shrink-0">
                FB
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <span className="font-extrabold text-xs tracking-tight block truncate text-foreground">FACEBOOK MARKETING</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span>SAFE Mode (Official API)</span>
                  </span>
                </div>
              )}
            </div>

            {/* Nav items list */}
            <nav className="space-y-3 overflow-y-auto flex-1 pr-0.5 text-xs no-scrollbar">
              {navItems.map((group, idx) => (
                <div key={idx} className="space-y-0.5">
                  {!isCollapsed && (
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 px-2.5 py-1">
                      {group.category}
                    </div>
                  )}
                  {group.items.map((item) => {
                    const active = isActive(item.path)
                    const Icon = item.icon
                    return (
                      <button
                        key={item.path}
                        onClick={() => router.push(item.path)}
                        title={isCollapsed ? item.label : undefined}
                        className={`w-full rounded-lg transition-colors text-xs flex items-center gap-2.5 ${
                          isCollapsed ? "justify-center p-2.5" : "px-2.5 py-2 text-left"
                        } ${
                          active
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold"
                            : "hover:bg-muted/70 text-muted-foreground hover:text-foreground font-medium"
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`} />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </button>
                    )
                  })}
                </div>
              ))}
            </nav>
          </div>

          {/* Footer switch button */}
          <div className="pt-2 border-t border-border mt-2">
            {!isCollapsed && (
              <div className="text-[11px] text-muted-foreground px-1 mb-2 truncate">
                Workspace: {activeWorkspace?.name || "Corporate"}
              </div>
            )}

            <button
              onClick={() => router.push(`/workspace/${workspaceId}/advanced/connect-accounts`)}
              title="Switch to ADVANCED High-Power Mode"
              className={`w-full rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border py-2 text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                isCollapsed ? "p-2" : "px-2"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              {!isCollapsed && <span>Switch to ADVANCED</span>}
            </button>
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}
