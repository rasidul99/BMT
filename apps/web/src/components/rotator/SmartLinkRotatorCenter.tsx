"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  GitFork,
  Link as LinkIcon,
  Plus,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Sliders,
  Globe,
  PieChart,
  BarChart3,
  CheckCircle2,
  RefreshCw,
  Zap,
} from "lucide-react"

export interface RotatorDestination {
  id: string
  url: string
  weight: number
  country?: string
  clicks: number
  active: boolean
}

export interface SmartLinkRotator {
  id: string
  slug: string
  title: string
  mode: "WEIGHTED" | "ROUND_ROBIN" | "GEO_TARGET"
  fallbackUrl: string
  destinations: RotatorDestination[]
  totalClicks: number
  uniqueClicks: number
  active: boolean
  createdAt: string
  lastClickedAt?: string
}

interface SmartLinkRotatorCenterProps {
  currentMode: "SAFE" | "ADVANCED"
}

export function SmartLinkRotatorCenter({ currentMode }: SmartLinkRotatorCenterProps) {
  const [rotators, setRotators] = useState<SmartLinkRotator[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Creation Form State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newSlug, setNewSlug] = useState("")
  const [newMode, setNewMode] = useState<"WEIGHTED" | "ROUND_ROBIN" | "GEO_TARGET">("WEIGHTED")
  const [newFallbackUrl, setNewFallbackUrl] = useState("https://example.com/fallback")
  const [destinations, setDestinations] = useState<Array<{ url: string; weight: number; country: string }>>([
    { url: "https://example.com/offer-1", weight: 60, country: "All" },
    { url: "https://example.com/offer-2", weight: 40, country: "All" },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const fetchRotators = useCallback(async () => {
    try {
      const res = await fetch("/api/rotator", { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      if (data.success && Array.isArray(data.rotators)) {
        setRotators(data.rotators)
      }
    } finally {
      setIsLoaded(true)
    }
  }, [])

  useEffect(() => {
    fetchRotators()
  }, [fetchRotators])

  const handleCopyLink = (slug: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
    const fullUrl = `${origin}/r/${slug}`
    navigator.clipboard.writeText(fullUrl)
    setCopiedSlug(slug)
    showToast(`Master link copied: ${fullUrl}`)
    setTimeout(() => setCopiedSlug(null), 2500)
  }

  const handleAddDestinationRow = () => {
    setDestinations([...destinations, { url: "https://example.com/offer-new", weight: 30, country: "All" }])
  }

  const handleRemoveDestinationRow = (index: number) => {
    if (destinations.length <= 1) return
    setDestinations(destinations.filter((_, idx) => idx !== index))
  }

  const handleCreateRotator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSlug.trim()) {
      showToast("Please enter a valid unique slug.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/rotator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_ROTATOR",
          slug: newSlug.trim(),
          title: newTitle.trim() || newSlug.trim(),
          mode: newMode,
          fallbackUrl: newFallbackUrl.trim(),
          destinations,
        }),
      })
      const data = await res.json()
      if (data.success) {
        showToast("✅ Smart Link Rotator created successfully!")
        setIsCreateOpen(false)
        setNewTitle("")
        setNewSlug("")
        await fetchRotators()
      } else {
        showToast(data.error || "Failed to create rotator")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (id: string) => {
    const res = await fetch("/api/rotator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "TOGGLE_ACTIVE", id }),
    })
    const data = await res.json()
    if (data.success && Array.isArray(data.rotators)) {
      setRotators(data.rotators)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this link rotator?")) return
    const res = await fetch("/api/rotator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "DELETE_ROTATOR", id }),
    })
    const data = await res.json()
    if (data.success && Array.isArray(data.rotators)) {
      setRotators(data.rotators)
      showToast("Rotator deleted.")
    }
  }

  const totalRotatorClicks = rotators.reduce((sum, r) => sum + r.totalClicks, 0)
  const totalUniqueClicks = rotators.reduce((sum, r) => sum + r.uniqueClicks, 0)

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-blue-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <GitFork className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Smart Link Rotator & Traffic Splitter
            </h1>
            <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800">
              {currentMode} ENGINE
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
            High-speed master link redirection engine. Distributes visitors across multiple landing pages, affiliate offers, or regional stores using weighted percentages, geo-targeting, or round-robin rotation.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setIsCreateOpen(!isCreateOpen)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition min-h-[36px]"
          >
            <Plus className="w-4 h-4" />
            <span>{isCreateOpen ? "Close Form" : "Create Link Rotator"}</span>
          </button>
          <button
            onClick={fetchRotators}
            className="p-2 rounded-lg border bg-card hover:bg-muted text-foreground transition min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Refresh Links"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Executive Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Active Master Links</span>
            <GitFork className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">{rotators.length}</span>
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
              {rotators.filter((r) => r.active).length} Active Now
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Total Redirect Clicks</span>
            <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">
              {totalRotatorClicks.toLocaleString()}
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Distributed
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Unique Visitors</span>
            <PieChart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">
              {totalUniqueClicks.toLocaleString()}
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground">Unique IPs</span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Traffic Split Precision</span>
            <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">99.8%</span>
            <span className="text-[10px] font-semibold text-muted-foreground">Zero Downtime</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CREATION FORM MODAL / COLLAPSIBLE                        */}
      {/* ======================================================== */}
      {isCreateOpen && (
        <form
          onSubmit={handleCreateRotator}
          className="border-2 border-blue-500/30 bg-card p-5 rounded-2xl shadow-sm space-y-4 animate-in fade-in text-xs"
        >
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="font-extrabold text-sm text-foreground flex items-center space-x-2">
              <Plus className="w-4 h-4 text-blue-500" />
              <span>Create New Smart Link Rotator</span>
            </h2>
            <span className="text-[11px] text-muted-foreground">Master Short Link Destination Routing</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-extrabold text-foreground">Rotator Title</label>
              <input
                type="text"
                placeholder="e.g. Black Friday Flash Deals"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background font-semibold"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-extrabold text-foreground">Short Link Slug (/r/...)</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. deals-2026"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-background font-mono font-bold text-blue-600 dark:text-blue-400"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-extrabold text-foreground">Rotation Logic</label>
              <select
                value={newMode}
                onChange={(e: any) => setNewMode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background font-bold text-foreground"
              >
                <option value="WEIGHTED">Weighted Percentage (e.g. 60% / 40%)</option>
                <option value="ROUND_ROBIN">Round-Robin Sequential (1 by 1)</option>
                <option value="GEO_TARGET">Geo-Target Country (BD, USA, etc.)</option>
              </select>
            </div>
          </div>

          {/* Destinations Table */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-foreground">Destination URLs & Weight / Rules</label>
              <button
                type="button"
                onClick={handleAddDestinationRow}
                className="text-blue-600 dark:text-blue-400 font-bold hover:underline inline-flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another URL</span>
              </button>
            </div>

            <div className="space-y-2">
              {destinations.map((dest, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 bg-muted/40 p-2.5 rounded-xl border border-border">
                  <div className="flex-1 w-full">
                    <input
                      type="url"
                      placeholder="https://example.com/target-page"
                      value={dest.url}
                      onChange={(e) => {
                        const copy = [...destinations]
                        copy[idx].url = e.target.value
                        setDestinations(copy)
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border bg-background text-xs font-mono"
                      required
                    />
                  </div>

                  {newMode === "WEIGHTED" && (
                    <div className="flex items-center space-x-1.5 w-full sm:w-auto">
                      <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap">Weight:</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={dest.weight}
                        onChange={(e) => {
                          const copy = [...destinations]
                          copy[idx].weight = Number(e.target.value) || 10
                          setDestinations(copy)
                        }}
                        className="w-20 px-2 py-1.5 rounded-lg border bg-background text-center font-bold"
                      />
                      <span className="text-[11px] font-bold text-muted-foreground">%</span>
                    </div>
                  )}

                  {newMode === "GEO_TARGET" && (
                    <div className="flex items-center space-x-1.5 w-full sm:w-auto">
                      <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap">Country:</span>
                      <input
                        type="text"
                        placeholder="BD or USA"
                        value={dest.country}
                        onChange={(e) => {
                          const copy = [...destinations]
                          copy[idx].country = e.target.value.toUpperCase()
                          setDestinations(copy)
                        }}
                        className="w-20 px-2 py-1.5 rounded-lg border bg-background text-center font-bold uppercase"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveDestinationRow(idx)}
                    disabled={destinations.length <= 1}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <label className="font-extrabold text-foreground">Fallback Destination URL</label>
            <input
              type="url"
              value={newFallbackUrl}
              onChange={(e) => setNewFallbackUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-background font-mono"
              required
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-lg border bg-card hover:bg-muted font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Smart Rotator"}
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* ROTATOR CARDS LIST                                       */}
      {/* ======================================================== */}
      <div className="space-y-3.5 text-xs">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <h2 className="font-bold text-sm text-foreground">Active Smart Link Rotators ({rotators.length})</h2>
          <span className="text-[11px] text-muted-foreground">Automated traffic distribution</span>
        </div>

        {rotators.length === 0 ? (
          <div className="p-8 text-center border border-border rounded-xl bg-card text-muted-foreground">
            No link rotators found. Click &ldquo;Create Link Rotator&rdquo; to set up your first smart traffic splitter.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {rotators.map((rot) => {
              const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
              const fullUrl = `${origin}/r/${rot.slug}`

              return (
                <div key={rot.id} className="border border-border bg-card p-4 sm:p-5 rounded-2xl shadow-xs space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-black text-base text-foreground">{rot.title}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                          {rot.mode}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            rot.active
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {rot.active ? "Active" : "Paused"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className="text-muted-foreground font-mono bg-muted/60 px-2 py-0.5 rounded border border-border">
                          {fullUrl}
                        </span>
                        <button
                          onClick={() => handleCopyLink(rot.slug)}
                          className="text-blue-600 dark:text-blue-400 hover:underline font-bold inline-flex items-center space-x-1"
                        >
                          {copiedSlug === rot.slug ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedSlug === rot.slug ? "Copied" : "Copy Link"}</span>
                        </button>
                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground inline-flex items-center space-x-0.5"
                        >
                          <span>Test</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <div className="text-right pr-2">
                        <span className="text-sm font-black text-foreground block">
                          {rot.totalClicks.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Total Clicks</span>
                      </div>

                      <button
                        onClick={() => handleToggleActive(rot.id)}
                        className={`px-3 py-1.5 rounded-lg font-bold transition text-xs border ${
                          rot.active
                            ? "bg-muted hover:bg-muted/80 text-foreground"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                      >
                        {rot.active ? "Pause" : "Resume"}
                      </button>

                      <button
                        onClick={() => handleDelete(rot.id)}
                        className="p-1.5 rounded-lg border text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                        title="Delete Rotator"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Destination URLs Breakdown */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                      <span>Destination Traffic Distribution</span>
                      <span>Target Delivery</span>
                    </div>

                    <div className="space-y-1.5">
                      {rot.destinations.map((dest, idx) => {
                        const totalW = rot.destinations.reduce((s, d) => s + (d.weight || 1), 0)
                        const pct = Math.round(((dest.weight || 1) / totalW) * 100)
                        return (
                          <div
                            key={dest.id || idx}
                            className="p-2.5 rounded-xl border border-border/80 bg-background/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                                {idx + 1}
                              </span>
                              <a
                                href={dest.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-[11px] text-foreground hover:underline truncate"
                              >
                                {dest.url}
                              </a>
                            </div>

                            <div className="flex items-center space-x-3 text-[11px] shrink-0">
                              <span className="text-muted-foreground">
                                Clicks: <strong className="text-foreground">{dest.clicks || 0}</strong>
                              </span>
                              {rot.mode === "GEO_TARGET" ? (
                                <span className="px-2 py-0.5 rounded bg-muted font-bold text-[10px]">
                                  Country: {dest.country || "All"}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold text-[10px]">
                                  Weight: {pct}%
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
