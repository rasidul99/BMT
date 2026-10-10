"use client"

import React, { useEffect } from "react"
import { useWorkspaceStore } from "../stores/workspace.store"
import { useRouter, usePathname } from "next/navigation"

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { activeWorkspace, activeMode, setWorkspace, setMode } = useWorkspaceStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (pathname.startsWith("/workspace/")) {
      const parts = pathname.split("/")
      const wsId = parts[2]
      const modeSegment = parts[3]?.toUpperCase() as "SAFE" | "ADVANCED"
      
      if (wsId && !activeWorkspace) {
        setWorkspace({
          id: wsId,
          name: wsId === "workspace-2" ? "Agency Client Ops Workspace" : "Corporate Marketing OS Workspace",
        })
      }
      if (modeSegment && (modeSegment === "SAFE" || modeSegment === "ADVANCED") && !activeMode) {
        setMode(modeSegment)
      }
    } else if (
      !pathname.startsWith("/auth") &&
      pathname !== "/workspaces" &&
      !pathname.startsWith("/p/") &&
      !pathname.startsWith("/c/")
    ) {
      if (!activeWorkspace || !activeMode) {
        router.push("/workspaces")
      }
    }
  }, [activeWorkspace, activeMode, pathname, router, setWorkspace, setMode])

  return <>{children}</>
}
