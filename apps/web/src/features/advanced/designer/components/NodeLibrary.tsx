"use client"

import React, { useState } from "react"
import { NodeRegistry } from "automation-nodes"
import {
  Search,
  Layers,
  Zap,
  Play,
  GitBranch,
  Sparkles,
  Cpu,
} from "lucide-react"

export default function NodeLibrary() {
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")

  const nodes = NodeRegistry.list()

  // Filter definitions based on search key and selected category
  const filteredNodes = nodes.filter((node) => {
    const matchesSearch =
      node.name.toLowerCase().includes(search.toLowerCase()) ||
      node.provider.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === "ALL" || node.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const onDragStart = (event: React.DragEvent, nodeId: string, nodeType: string, label: string) => {
    event.dataTransfer.setData("application/reactflow-type", nodeType)
    event.dataTransfer.setData("application/reactflow-label", label)
    event.dataTransfer.setData("application/reactflow-id", nodeId)
    event.dataTransfer.effectAllowed = "move"
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "TRIGGER":
        return <Zap className="w-3 h-3 text-orange-500" />
      case "ACTION":
        return <Play className="w-3 h-3 text-orange-500" />
      case "CONDITION":
        return <GitBranch className="w-3 h-3 text-orange-500" />
      case "AI":
        return <Sparkles className="w-3 h-3 text-orange-500" />
      default:
        return <Cpu className="w-3 h-3 text-orange-500" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 border-b border-border pb-2.5">
        <Layers className="w-4 h-4 text-orange-600 dark:text-orange-400" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Node Library SDK</h2>
      </div>

      {/* Search and Filters */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border pl-8 pr-3 py-1.5 bg-background text-xs text-foreground focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition min-h-[36px]"
          />
        </div>

        <div className="flex space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
          {["ALL", "TRIGGER", "ACTION", "CONDITION", "AI"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-semibold border transition whitespace-nowrap min-h-[28px] ${
                selectedCategory === cat
                  ? "bg-orange-600 border-orange-500 text-white shadow-xs"
                  : "bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Node Catalog List */}
      <div className="space-y-2.5 overflow-auto pr-0.5">
        {filteredNodes.map((node) => (
          <div
            key={node.id}
            draggable
            onDragStart={(e) => onDragStart(e, node.id, node.category, node.name)}
            className="border border-border bg-card hover:border-orange-500/50 hover:bg-muted/40 p-3 rounded-lg text-xs font-medium cursor-grab text-foreground flex flex-col space-y-1.5 transition shadow-xs select-none"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center space-x-1">
                {getCategoryIcon(node.category)}
                <span>{node.category}</span>
              </span>
              <span className="text-[9px] text-muted-foreground font-mono">v{node.version}</span>
            </div>
            <div className="font-bold text-foreground text-xs">{node.name}</div>
            <div className="text-[10px] text-muted-foreground">{node.provider} Integration</div>
          </div>
        ))}

        {filteredNodes.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-8">
            No matching nodes found.
          </div>
        )}
      </div>
    </div>
  )
}
