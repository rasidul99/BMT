"use client"

import React, { useState } from "react"

interface ExecutionTimelineProps {
  workflowId: string
}

export default function ExecutionTimeline({ workflowId }: ExecutionTimelineProps) {
  const [runs, setRuns] = useState([
    { id: "run-101", triggerType: "cron", startedAt: "10 mins ago", duration: "10s", status: "COMPLETED" },
    { id: "run-102", triggerType: "manual", startedAt: "30 mins ago", duration: "5s", status: "FAILED" },
  ])

  const [selectedRun, setSelectedRun] = useState<string | null>(null)
  const [timeline, setTimeline] = useState<any[] | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSelectRun = (runId: string) => {
    setSelectedRun(runId)
    if (runId === "run-101") {
      setTimeline([
        { nodeId: "node-1", nodeType: "webhook-trigger", duration: "120ms", status: "SUCCESS" },
        { nodeId: "node-2", nodeType: "openai-prompt", duration: "1450ms", status: "SUCCESS" },
      ])
    } else {
      setTimeline([
        { nodeId: "node-1", nodeType: "webhook-trigger", duration: "110ms", status: "SUCCESS" },
        { nodeId: "node-2", nodeType: "meta-create-campaign", duration: "400ms", status: "FAILED", error: "OAuth Scope Mismatch" },
      ])
    }
  }

  const handleReplay = async (runId: string) => {
    setMessage(`Replay job enqueued successfully for run: ${runId}`)
    setTimeout(() => setMessage(null), 4000)
  }

  return (
    <div className="space-y-4 text-xs font-mono">
      <div className="flex items-center justify-between border-b pb-2 border-slate-700">
        <h4 className="text-sm font-bold text-slate-200">Execution Run History</h4>
        {message && <span className="text-emerald-400 font-semibold">{message}</span>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Run list */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {runs.map((r) => (
            <div
              key={r.id}
              onClick={() => handleSelectRun(r.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedRun === r.id
                  ? "border-blue-500 bg-blue-950/20 text-blue-400"
                  : "border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-300"
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold">{r.id}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] ${
                  r.status === "COMPLETED" ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400"
                }`}>
                  {r.status}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 flex justify-between">
                <span>Trigger: {r.triggerType}</span>
                <span>Dur: {r.duration}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Selected run timeline */}
        <div className="border border-slate-800 rounded-lg p-3 bg-slate-950/50 min-h-[150px]">
          {selectedRun && timeline ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-bold">Steps Timeline ({selectedRun})</span>
                <button
                  onClick={() => handleReplay(selectedRun)}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-sans font-semibold shadow-xs transition"
                >
                  Replay Run
                </button>
              </div>

              <div className="space-y-2">
                {timeline.map((t, idx) => (
                  <div key={idx} className="flex items-start space-x-2 border-l border-slate-700 pl-3 py-1 relative">
                    <div className={`w-2 h-2 rounded-full absolute -left-1 top-2 ${
                      t.status === "SUCCESS" ? "bg-emerald-500" : "bg-red-500"
                    }`} />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-200">{t.nodeId}</span>
                        <span className="text-slate-500">{t.duration}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{t.nodeType}</div>
                      {t.error && <div className="text-[10px] text-red-400 mt-1 bg-red-950/30 p-1 rounded">{t.error}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-slate-500 flex items-center justify-center h-full">
              Select an execution run to inspect its timeline.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
