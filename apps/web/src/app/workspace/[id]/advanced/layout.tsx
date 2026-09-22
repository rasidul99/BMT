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
} from "lucide-react"
import { useWorkspace } from "../../../../hooks/useWorkspace"
import { TopPlatformHeader } from "../../../../components/layout/TopPlatformHeader"
import { useSidebarStore } from "../../../../stores/sidebar.store"

export default function AdvancedLayout({ children }: { children: React.ReactNode }) {
  const { activeWorkspace, selectMode } = useWorkspace()
  const { isCollapsed } = useSidebarStore()
  const router = useRouter()
  const pathname = usePathname()

  const workspaceId = activeWorkspace?.id || "workspace-1"
  const isActive = (path: string) => pathname.includes(path)

  const handleModeSwitch = () => {
    selectMode("SAFE")
    router.push(`/workspace/${workspaceId}/safe/dashboard`)
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

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* 1. Global Top Platform Navigation Header */}
      <TopPlatformHeader currentMode="ADVANCED" />

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
              <div className="h-7 w-7 rounded-lg bg-orange-600 flex items-center justify-center text-white font-black text-xs shadow-xs shrink-0">
                FB
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <span className="font-extrabold text-xs tracking-tight block truncate">FACEBOOK MARKETING</span>
                  <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold block">⚡ ADVANCED (High Power)</span>
                </div>
              )}
            </div>

            {/* Nav list */}
            <nav className="space-y-1 overflow-y-auto flex-1 pr-0.5 text-xs no-scrollbar">
              {!isCollapsed && (
                <div className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 px-2 py-1">
                  Active Automations
                </div>
              )}
              {advancedNav.map((item) => {
                const active = isActive(item.path)
                const Icon = item.icon
                return (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full rounded-lg transition font-medium text-xs flex items-center gap-2.5 ${
                      isCollapsed ? "justify-center p-2.5" : "px-2.5 py-2 text-left"
                    } ${
                      active
                        ? "bg-orange-600 text-white font-semibold shadow-xs"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? "text-white" : "text-muted-foreground"}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Footer mode switch */}
          <div className="pt-2 border-t border-border mt-2">
            {!isCollapsed && (
              <div className="text-[11px] text-muted-foreground px-1 mb-2 truncate">
                Workspace: {activeWorkspace?.name || "Corporate"}
              </div>
            )}
            <button
              onClick={handleModeSwitch}
              title="Switch to SAFE Mode"
              className={`w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-2 text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5 ${
                isCollapsed ? "p-2" : "px-2"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-white shrink-0" />
              {!isCollapsed && <span>Switch to SAFE Mode</span>}
            </button>
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-auto p-6 bg-muted/10">
          {children}
        </main>
      </div>
    </div>
  )
}
