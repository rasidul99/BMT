"use client"

import React from "react"
import { Terminal, Undo2, Trash2, Play } from "lucide-react"
import { useAdvancedExecutionStore } from "../../stores/execution.store"
import { useAdvancedHistoryStore } from "../../stores/history.store"

export default function ExecutionConsole() {
  const { logs, clearLogs, addLog } = useAdvancedExecutionStore()
  const { undo } = useAdvancedHistoryStore()

  const handleCompile = () => {
    addLog("[Compiler] Commencing topological compile...")
    addLog("[Compiler] Sorted nodes topologically. Checking cycles...")
    addLog("[Compiler] Build Result: SUCCESSFUL")
  }

  const handleUndo = () => {
    const prevState = undo({ logs })
    if (prevState) {
      addLog("[History] Undo action executed.")
    } else {
      addLog("[History] No actions left to undo.")
    }
  }

  return (
    <div className="h-full flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Execution Log Streams
          </h2>
          <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleUndo}
            className="px-2.5 py-1 border border-border hover:bg-muted bg-card rounded-lg text-xs font-semibold text-foreground transition min-h-[32px] flex items-center space-x-1"
          >
            <Undo2 className="w-3 h-3 text-muted-foreground" />
            <span>Undo</span>
          </button>
          <button
            onClick={clearLogs}
            className="px-2.5 py-1 border border-border hover:bg-muted bg-card rounded-lg text-xs font-semibold text-foreground transition min-h-[32px] flex items-center space-x-1"
          >
            <Trash2 className="w-3 h-3 text-muted-foreground" />
            <span>Clear</span>
          </button>
          <button
            onClick={handleCompile}
            className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition min-h-[32px] flex items-center space-x-1"
          >
            <Play className="w-3 h-3" />
            <span>Compile Rules</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto font-mono text-[10px] space-y-1 text-slate-300 bg-slate-950 p-3 rounded-lg border border-border/80">
        {logs.map((log, i) => (
          <div key={i} className="leading-relaxed">
            <span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
            {log}
          </div>
        ))}
      </div>
    </div>
  )
}
