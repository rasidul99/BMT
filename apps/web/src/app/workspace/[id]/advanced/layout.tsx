"use client"

import React from "react"
import { useWorkspace } from "../../../../hooks/useWorkspace"
import { useAuth } from "../../../../hooks/useAuth"
import { useTheme } from "../../../../hooks/useTheme"
import { useRouter } from "next/navigation"
import { TopPlatformHeader } from "../../../../components/layout/TopPlatformHeader"

export default function AdvancedLayout({ children }: { children: React.ReactNode }) {
  const { activeWorkspace, selectMode } = useWorkspace()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/auth/login")
  }

  const handleModeSwitch = () => {
    selectMode("SAFE")
    router.push(`/workspace/${activeWorkspace?.id || "workspace-1"}/safe/dashboard`)
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* 1. Global Top Platform Navigation Header (Per Client PDF Spec) */}
      <TopPlatformHeader currentMode="ADVANCED" />

      {/* 2. Workspace Content with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card flex flex-col justify-between p-4 shadow-sm shrink-0 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 px-2 py-1">
              <div className="h-7 w-7 rounded-lg bg-orange-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
                FB
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight block leading-none">FACEBOOK SUITE</span>
                <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold">⚡ ADVANCED (High Power)</span>
              </div>
            </div>

            <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-210px)] pr-1 text-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 px-3 py-1">Active Automations (Risk Mode)</div>
              <button
                onClick={() => router.push(`/workspace/${activeWorkspace?.id || "workspace-1"}/advanced/designer`)}
                className="w-full text-left px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 font-semibold text-xs"
              >
                🎨 Topological Workflow Designer
              </button>
              <button
                onClick={() => router.push(`/workspace/${activeWorkspace?.id || "workspace-1"}/advanced/connect-accounts`)}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-muted text-muted-foreground text-xs font-medium"
              >
                🔐 Connect Accounts (100 FB/Pages)
              </button>
              <button
                onClick={() => router.push(`/workspace/${activeWorkspace?.id || "workspace-1"}/advanced/post-scheduler`)}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-muted text-muted-foreground text-xs font-medium"
              >
                📢 Post Scheduler & AI Variations
              </button>
              <button
                onClick={() => router.push(`/workspace/${activeWorkspace?.id || "workspace-1"}/advanced/group-poster`)}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-muted text-muted-foreground text-xs font-medium"
              >
                👥 Post A Group Engine
              </button>
              <button
                onClick={() => router.push(`/workspace/${activeWorkspace?.id || "workspace-1"}/advanced/comment-assistant`)}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-muted text-muted-foreground text-xs font-medium"
              >
                💬 Smart Comment Assistant
              </button>
              <button
                onClick={() => router.push(`/workspace/${activeWorkspace?.id || "workspace-1"}/advanced/messenger-controller`)}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-muted text-muted-foreground text-xs font-medium"
              >
                📬 Messenger Controller Bot
              </button>
              <button
                onClick={() => router.push(`/workspace/${activeWorkspace?.id || "workspace-1"}/advanced/friend-automation`)}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-muted text-muted-foreground text-xs font-medium"
              >
                🤝 Friend Request & Accept Engine
              </button>
              <button
                onClick={() => router.push(`/workspace/${activeWorkspace?.id || "workspace-1"}/advanced/unfriend-inactive`)}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-muted text-muted-foreground text-xs font-medium"
              >
                🧹 Unfriend Inactive Users
              </button>
              <button
                onClick={() => router.push(`/workspace/${activeWorkspace?.id || "workspace-1"}/advanced/link-comment-block`)}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-muted text-muted-foreground text-xs font-medium"
              >
                🚫 Link Comment Auto-Deleter
              </button>
              <button
                onClick={() => router.push(`/workspace/${activeWorkspace?.id || "workspace-1"}/advanced/group-hunter`)}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-muted text-muted-foreground text-xs font-medium"
              >
                🎯 Active Group & Link Hunter
              </button>
            </nav>
          </div>

          <div className="space-y-3 pt-3 border-t">
            <div className="text-xs text-muted-foreground px-1">
              Workspace: {activeWorkspace?.name || "Corporate"}
            </div>
            <button
              onClick={handleModeSwitch}
              className="w-full rounded bg-blue-600 hover:bg-blue-700 text-white py-1.5 text-xs font-semibold shadow-sm transition"
            >
              🟢 Switch to SAFE Mode
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
