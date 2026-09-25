"use client"

import React, { useCallback, useEffect } from "react"
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Panel,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Activity } from "lucide-react"

import { useAdvancedSelectionStore } from "../../stores/selection.store"
import { useAdvancedExecutionStore } from "../../stores/execution.store"
import { WorkflowValidator } from "../../../automation/application/services/validator"
import { useAdvancedHistoryStore } from "../../stores/history.store"

const initialNodes: Node[] = [
  {
    id: "node-1",
    type: "input",
    data: { label: "CPC Spike Trigger" },
    position: { x: 100, y: 150 },
    style: {
      background: "#0f172a",
      color: "#f8fafc",
      border: "1.5px solid #f97316",
      borderRadius: "8px",
      fontSize: "12px",
      fontWeight: "600",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.2)",
    },
  },
  {
    id: "node-2",
    type: "default",
    data: { label: "Cut Budget Action" },
    position: { x: 350, y: 150 },
    style: {
      background: "#0f172a",
      color: "#f8fafc",
      border: "1.5px solid #fb923c",
      borderRadius: "8px",
      fontSize: "12px",
      fontWeight: "600",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.2)",
    },
  },
]

const initialEdges: Edge[] = [
  {
    id: "edge-1",
    source: "node-1",
    target: "node-2",
    animated: true,
    style: { stroke: "#f97316", strokeWidth: 2 },
  },
]

export default function Canvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const { setSelectedNodeId } = useAdvancedSelectionStore()
  const { addLog } = useAdvancedExecutionStore()
  const { pushState } = useAdvancedHistoryStore()

  // 1. Run live graph validation on each change
  useEffect(() => {
    // Map React Flow nodes/edges to BMT Domain structures
    const domainNodes = nodes.map((n) => ({
      id: n.id,
      type: (n.type === "input" ? "TRIGGER" : "ACTION") as any,
      label: n.data?.label as string,
      config: {},
    }))
    const domainEdges = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
    }))

    const validationErrors = WorkflowValidator.validate(domainNodes, domainEdges)
    if (validationErrors.length > 0) {
      addLog(`[Validator] Detected ${validationErrors.length} issues: ${validationErrors[0].message}`)
    } else {
      addLog("[Validator] Graph compiled with zero errors.")
    }
  }, [nodes, edges, addLog])

  const onConnect = useCallback(
    (params: Connection) => {
      pushState({ nodes, edges })
      setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: "#f97316", strokeWidth: 2 } }, eds))
      addLog(`[Canvas] Connection established between ${params.source} and ${params.target}`)
    },
    [nodes, edges, setEdges, addLog, pushState]
  )

  const onNodeClick = useCallback(
    (_: any, node: Node) => {
      setSelectedNodeId(node.id)
      addLog(`[Canvas] Inspected node settings for ID: ${node.id}`)
    },
    [setSelectedNodeId, addLog]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData("application/reactflow-type")
      const label = event.dataTransfer.getData("application/reactflow-label")

      if (!type) return

      pushState({ nodes, edges })

      const position = {
        x: event.clientX - 350,
        y: event.clientY - 150,
      }

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: type === "TRIGGER" ? "input" : "default",
        position,
        data: { label },
        style: {
          background: "#0f172a",
          color: "#f8fafc",
          border: type === "TRIGGER" ? "1.5px solid #f97316" : "1.5px solid #fb923c",
          borderRadius: "8px",
          fontSize: "12px",
          fontWeight: "600",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.2)",
        },
      }

      setNodes((nds) => nds.concat(newNode))
      addLog(`[Canvas] Spawned new node type ${type}: "${label}"`)
    },
    [nodes, edges, setNodes, addLog, pushState]
  )

  return (
    <div className="w-full h-full relative" onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
      >
        <MiniMap style={{ background: "#0f172a" }} />
        <Controls />
        <Background bgColor="#020617" />
        <Panel position="top-right" className="bg-card/90 backdrop-blur p-2 border border-border rounded-lg text-xs space-x-1 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800 flex items-center space-x-1">
            <Activity className="w-3 h-3 text-orange-600 dark:text-orange-400" />
            <span>ADVANCED Editor Panel</span>
          </span>
        </Panel>
      </ReactFlow>
    </div>
  )
}
