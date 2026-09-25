"use client"

import React, { useState } from "react"
import { useAdvancedShortcuts } from "../../../../../hooks/useShortcuts"
import Canvas from "../../../../../features/advanced/designer/components/Canvas"
import NodeLibrary from "../../../../../features/advanced/designer/components/NodeLibrary"
import PropertiesPanel from "../../../../../features/advanced/designer/components/PropertiesPanel"
import ExecutionConsole from "../../../../../features/advanced/designer/components/ExecutionConsole"
import { Workflow, Layers, Sliders, Terminal } from "lucide-react"

export default function AdvancedDesignerPage() {
  // Mount keyboard shortcuts listener hooks
  useAdvancedShortcuts()

  // Mobile active tab state: 'CANVAS' | 'NODES' | 'PROPERTIES' | 'LOGS'
  const [mobileTab, setMobileTab] = useState<"CANVAS" | "NODES" | "PROPERTIES" | "LOGS">("CANVAS")

  return (
    <div className="flex flex-col space-y-4 pb-20 lg:pb-0 lg:h-[calc(100vh-8rem)] lg:justify-between">
      {/* Mobile / Tablet Tab Selector (< lg) */}
      <div className="lg:hidden flex items-center space-x-1.5 border-b border-border pb-2 overflow-x-auto no-scrollbar shrink-0">
        <button
          onClick={() => setMobileTab("CANVAS")}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition min-h-[38px] ${
            mobileTab === "CANVAS"
              ? "bg-orange-600 text-white shadow-xs"
              : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Workflow className="w-3.5 h-3.5" />
          <span>Canvas Editor</span>
        </button>

        <button
          onClick={() => setMobileTab("NODES")}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition min-h-[38px] ${
            mobileTab === "NODES"
              ? "bg-orange-600 text-white shadow-xs"
              : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Node Library</span>
        </button>

        <button
          onClick={() => setMobileTab("PROPERTIES")}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition min-h-[38px] ${
            mobileTab === "PROPERTIES"
              ? "bg-orange-600 text-white shadow-xs"
              : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Properties</span>
        </button>

        <button
          onClick={() => setMobileTab("LOGS")}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition min-h-[38px] ${
            mobileTab === "LOGS"
              ? "bg-orange-600 text-white shadow-xs"
              : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Execution Logs</span>
        </button>
      </div>

      {/* Mobile Single Tab Render (< lg) */}
      <div className="lg:hidden flex-1 min-h-[500px]">
        {mobileTab === "CANVAS" && (
          <div className="h-[520px] border border-border bg-slate-950 rounded-xl relative overflow-hidden shadow-xs">
            <Canvas />
          </div>
        )}
        {mobileTab === "NODES" && (
          <div className="border border-border bg-card rounded-xl p-4 shadow-xs">
            <NodeLibrary />
          </div>
        )}
        {mobileTab === "PROPERTIES" && (
          <div className="border border-border bg-card rounded-xl p-4 shadow-xs">
            <PropertiesPanel />
          </div>
        )}
        {mobileTab === "LOGS" && (
          <div className="h-64 border border-border bg-card rounded-xl p-4 shadow-xs">
            <ExecutionConsole />
          </div>
        )}
      </div>

      {/* Desktop 3-Column IDE Grid (>= lg) */}
      <div className="hidden lg:grid flex-1 grid-cols-12 gap-4 overflow-hidden">
        {/* Left Side Node Catalog */}
        <div className="col-span-3 border border-border bg-card rounded-xl p-4 flex flex-col space-y-4 overflow-auto shadow-xs">
          <NodeLibrary />
        </div>

        {/* Center xyflow Viewport */}
        <div className="col-span-6 border border-border bg-card rounded-xl relative overflow-hidden bg-slate-950 text-white shadow-xs">
          <Canvas />
        </div>

        {/* Right Side Variables Inspector */}
        <div className="col-span-3 border border-border bg-card rounded-xl p-4 flex flex-col space-y-4 overflow-auto shadow-xs">
          <PropertiesPanel />
        </div>
      </div>

      {/* Desktop Bottom Log Terminal Pane (>= lg) */}
      <div className="hidden lg:flex h-44 border border-border bg-card rounded-xl p-4 mt-4 flex-col justify-between overflow-hidden shadow-xs">
        <ExecutionConsole />
      </div>
    </div>
  )
}
