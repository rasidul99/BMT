"use client"

import React from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  Workflow,
  KeyRound,
  CalendarClock,
  Users,
  MessageSquare,
  Bot,
  UserPlus,
  UserMinus,
  Ban,
  Target,
  ShieldCheck,
  Zap,
} from "lucide-react"
import { useWorkspace } from "../../../../hooks/useWorkspace"
import { TopPlatformHeader } from "../../../../components/layout/TopPlatformHeader"
import { useSidebarStore } from "../../../../stores/sidebar.store"

export default function AdvancedLayout({ children }: { children: React.ReactNode }) {
  const { activeWorkspace, selectMode } = useWorkspace()
  const { isCollapsed, isMobileOpen, closeMobileSidebar } = useSidebarStore()
  const router = useRouter()
  const pathname = usePathname()

  const workspaceId = activeWorkspace?.id || "workspace-1"
  const isActive = (path: string) => pathname.includes(path)

  const handleModeSwitch = () => {
    selectMode("SAFE")
    router.push(`/workspace/${workspaceId}/safe/dashboard`)
    closeMobileSidebar()
  }

  const handleNavClick = (path: string) => {
    router.push(path)
    closeMobileSidebar()
  }

  const advancedNav = [
    { label: "Topological Workflow Designer", icon: Workflow, path: `/workspace/${workspaceId}/advanced/designer` },
    { label: "Connect Accounts (100 FB/Pages)", icon: KeyRound, path: `/workspace/${workspaceId}/advanced/connect-accounts` },
    { label: "Post Scheduler & AI Variations", icon: CalendarClock, path: `/workspace/${workspaceId}/advanced/post-scheduler` },
    { label: "Post A Group Engine", icon: Users, path: `/workspace/${workspaceId}/advanced/group-poster` },
    { label: "Smart Comment Assistant", icon: MessageSquare, path: `/workspace/${workspaceId}/advanced/comment-assistant` },
    { label: "Messenger Controller Bot", icon: Bot, path: `/workspace/${workspaceId}/advanced/messenger-controller` },
    { label: "Friend Request & Accept Engine", icon: UserPlus, path: `/workspace/${workspaceId}/advanced/friend-automation` },
    { label: "Unfriend Inactive Users", icon: UserMinus, path: `/workspace/${workspaceId}/advanced/unfriend-inactive` },
    { label: "Link Comment Auto-Deleter", icon: Ban, path: `/workspace/${workspaceId}/advanced/link-comment-block` },
    { label: "Active Group & Link Hunter", icon: Target, path: `/workspace/${workspaceId}/advanced/group-hunter` },
  ]

  const renderNavContent = (collapsed: boolean, isMobileDrawer = false) => (
    <>
      <div className="space-y-3 overflow-hidden flex flex-col flex-1">
        {/* Sidebar Sub-Header */}
        <div className={`flex items-center gap-2 px-1 py-1 ${collapsed && !isMobileDrawer ? "justify-center" : ""}`}>
          <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-xs shrink-0">
            FB
          </div>
          {(!collapsed || isMobileDrawer) && (
            <div className="overflow-hidden">
              <span className="font-extrabold text-xs tracking-tight block truncate text-foreground">FACEBOOK MARKETING</span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1.5 mt-0.5">
                <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                <span>ADVANCED (High Power)</span>
              </span>
            </div>
          )}
        </div>

        {/* Nav list */}
        <nav className="space-y-1 overflow-y-auto flex-1 pr-0.5 text-xs no-scrollbar">
          {(!collapsed || isMobileDrawer) && (
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 px-2.5 py-1">
              Active Automations
            </div>
          )}
          {advancedNav.map((item) => {
            const active = isActive(item.path)
            const Icon = item.icon
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                title={collapsed && !isMobileDrawer ? item.label : undefined}
                className={`w-full rounded-lg transition-colors text-xs flex items-center gap-2.5 ${
                  collapsed && !isMobileDrawer ? "justify-center p-2.5" : "px-2.5 py-2 text-left"
                } ${
                  active
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold"
                    : "hover:bg-muted/70 text-muted-foreground hover:text-foreground font-medium"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`} />
                {(!collapsed || isMobileDrawer) && <span className="truncate">{item.label}</span>}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Footer mode switch */}
      <div className="pt-2 border-t border-border mt-2">
        {(!collapsed || isMobileDrawer) && (
          <div className="text-[11px] text-muted-foreground px-1 mb-2 truncate">
            Workspace: {activeWorkspace?.name || "Corporate"}
          </div>
        )}
        <button
          onClick={handleModeSwitch}
          title="Switch to SAFE Mode"
          className={`w-full rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border py-2 text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
            collapsed && !isMobileDrawer ? "p-2" : "px-2"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          {(!collapsed || isMobileDrawer) && <span>Switch to SAFE Mode</span>}
        </button>
      </div>
    </>
  )

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* 1. Global Top Platform Navigation Header */}
      <TopPlatformHeader currentMode="ADVANCED" />

      {/* 2. Workspace Content with Sidebar */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Persistent Sidebar */}
        <aside
          className={`hidden md:flex border-r border-border bg-card flex-col justify-between transition-all duration-300 shadow-sm shrink-0 overflow-hidden ${
            isCollapsed ? "w-16 p-2" : "w-64 p-3"
          }`}
        >
          {renderNavContent(isCollapsed, false)}
        </aside>

        {/* Mobile Slide-Over Drawer with Backdrop (< md screens) */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
              onClick={closeMobileSidebar}
            />
            {/* Drawer */}
            <aside className="relative w-72 max-w-[85vw] h-full bg-card border-r border-border p-3.5 flex flex-col justify-between z-10 shadow-2xl animate-in slide-in-from-left duration-200">
              {renderNavContent(false, true)}
            </aside>
          </div>
        )}

        {/* Main content area */}
        <main className="flex-1 overflow-auto p-3.5 sm:p-5 md:p-6 bg-muted/10">
          {children}
        </main>
      </div>
    </div>
  )
}
