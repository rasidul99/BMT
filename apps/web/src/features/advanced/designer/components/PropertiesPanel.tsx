"use client"

import React, { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { NodeRegistry } from "automation-nodes"
import { Sliders, CheckCircle2, AlertCircle } from "lucide-react"
import { useAdvancedSelectionStore } from "../../stores/selection.store"
import { useAdvancedExecutionStore } from "../../stores/execution.store"

export default function PropertiesPanel() {
  const { selectedNodeId } = useAdvancedSelectionStore()
  const { addLog } = useAdvancedExecutionStore()

  // Match mock node definitions for this demo (e.g. mapping canvas nodes to registry IDs)
  const registryId = selectedNodeId === "node-1" ? "webhook-trigger" : "meta-adjust-budget"
  const definition = NodeRegistry.get(registryId)

  const [formFields, setFormFields] = useState<Record<string, any>>({})

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<any>({
    resolver: definition ? zodResolver(definition.propertiesSchema) : undefined,
    defaultValues: {},
  })

  // Watch for node changes to reload default parameters
  useEffect(() => {
    if (definition) {
      const defaults: Record<string, any> = {}
      Object.keys(definition.uiMetadata).forEach((key) => {
        defaults[key] = ""
      })
      setFormFields(defaults)
    }
  }, [selectedNodeId])

  const onSubmit = (data: any) => {
    addLog(`[Properties] Parameters verified successfully: ${JSON.stringify(data)}`)
  }

  if (!definition) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 border-b border-border pb-2.5">
          <Sliders className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Properties Inspector</h2>
        </div>
        <div className="text-xs text-muted-foreground text-center py-12 flex flex-col items-center justify-center space-y-2">
          <AlertCircle className="w-6 h-6 text-muted-foreground/60" />
          <span>Select a node on the canvas to view properties.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="border-b border-border pb-2.5">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Properties Inspector</h2>
        </div>
        <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold block mt-1">
          {definition.name} (v{definition.version})
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 text-xs">
        {Object.entries(definition.uiMetadata).map(([key, meta]) => {
          return (
            <div key={key} className="space-y-1">
              <label className="font-semibold text-foreground block">{meta.label}</label>

              {meta.type === "select" ? (
                <select
                  {...register(key)}
                  className="w-full rounded-lg border border-border px-2.5 py-1.5 bg-background text-xs text-foreground focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition min-h-[36px]"
                >
                  <option value="">Select Option</option>
                  {meta.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : meta.type === "textarea" ? (
                <textarea
                  {...register(key)}
                  className="w-full rounded-lg border border-border px-2.5 py-1.5 bg-background text-xs text-foreground focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition h-20"
                />
              ) : meta.type === "secret" ? (
                <div className="space-y-1">
                  <input
                    type="text"
                    placeholder="Reference e.g. secret-credentials-id"
                    {...register(`${key}.credentialId`)}
                    className="w-full rounded-lg border border-border px-2.5 py-1.5 bg-background text-xs text-foreground font-mono focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition min-h-[36px]"
                  />
                  <span className="text-[9px] text-muted-foreground block">
                    Resolves credentials via vault reference securely.
                  </span>
                </div>
              ) : (
                <input
                  type={meta.type === "password" ? "password" : "text"}
                  {...register(key)}
                  className="w-full rounded-lg border border-border px-2.5 py-1.5 bg-background text-xs text-foreground focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition min-h-[36px]"
                />
              )}

              {errors[key] && (
                <span className="text-[10px] text-red-500 font-semibold block">
                  {String(errors[key]?.message)}
                </span>
              )}
            </div>
          )
        })}

        <button
          type="submit"
          className="w-full rounded-lg bg-orange-600 hover:bg-orange-700 py-2.5 text-xs font-semibold text-white shadow-xs transition mt-4 flex items-center justify-center space-x-1.5 min-h-[38px]"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Validate Node Config</span>
        </button>
      </form>
    </div>
  )
}
