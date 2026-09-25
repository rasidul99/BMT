"use client"

import React, { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  Users,
  CalendarClock,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  PlusCircle,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Activity,
  RotateCcw,
  Send,
  ExternalLink,
  ShieldCheck,
  Facebook,
} from "lucide-react"
import { useDashboardMetrics, DashboardQueueJob } from "../../../../../hooks/useDashboardMetrics"

export default function SafeDashboardPage() {
  const router = useRouter()
  const params = useParams()
  const workspaceId = (params?.id as string) || "workspace-1"

  const {
    accounts,
    queueJobs,
    logs,
    metrics,
    isLoading,
    refreshMetrics,
    retryFailedJob,
    publishJobNow,
  } = useDashboardMetrics()

  const [queueFilter, setQueueFilter] = useState<"ALL" | "Pending" | "Processing" | "Posted" | "Failed">("ALL")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    refreshMetrics()
    setTimeout(() => setIsRefreshing(false), 600)
  }

  const filteredJobs = queueJobs.filter((job) => {
    if (queueFilter === "ALL") return true
    return job.status === queueFilter
  })

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              Facebook Marketing Overview
            </h1>
            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Real-time execution dashboard for multi-account Facebook scheduling, automated queues, and engagement metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleManualRefresh}
            title="Refresh metrics from local store"
            className="p-2.5 sm:p-2 border border-border rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition flex items-center justify-center text-xs shrink-0"
          >
            <RefreshCw className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${isRefreshing ? "animate-spin text-blue-500" : ""}`} />
          </button>

          <button
            onClick={() => router.push(`/workspace/${workspaceId}/safe/connect-accounts`)}
            className="flex-1 sm:flex-none justify-center bg-card hover:bg-muted text-foreground border border-border text-xs font-semibold px-3 py-2.5 sm:py-2 rounded-xl transition shadow-xs flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-blue-500" />
            <span>Connect Account</span>
          </button>

          <button
            onClick={() => router.push(`/workspace/${workspaceId}/safe/post-scheduler`)}
            className="flex-1 sm:flex-none justify-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2.5 sm:py-2 rounded-xl transition shadow-xs flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Master Post</span>
          </button>
        </div>
      </div>

      {/* 2. Top 5 Core Metrics Cards */}
      <div className="grid gap-2.5 sm:gap-3.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {/* Card 1: Accounts */}
        <div className="border border-border bg-card p-3.5 sm:p-4 rounded-xl shadow-xs space-y-1.5 sm:space-y-2 relative overflow-hidden group hover:border-blue-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Accounts
            </span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-foreground">{metrics.totalAccounts}</div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3" />
              <span>Active Meta OAuth</span>
            </p>
          </div>
        </div>

        {/* Card 2: Post Scheduled */}
        <div className="border border-border bg-card p-3.5 sm:p-4 rounded-xl shadow-xs space-y-1.5 sm:space-y-2 relative overflow-hidden group hover:border-sky-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Post Scheduled
            </span>
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <CalendarClock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400">{metrics.postScheduled}</div>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
              In Pending Queue
            </p>
          </div>
        </div>

        {/* Card 3: Success */}
        <div className="border border-border bg-card p-3.5 sm:p-4 rounded-xl shadow-xs space-y-1.5 sm:space-y-2 relative overflow-hidden group hover:border-emerald-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Success
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.success}</div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              {metrics.successRate}% Success Rate
            </p>
          </div>
        </div>

        {/* Card 4: In Process */}
        <div className="border border-border bg-card p-3.5 sm:p-4 rounded-xl shadow-xs space-y-1.5 sm:space-y-2 relative overflow-hidden group hover:border-amber-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              In Process
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">{metrics.inProcess}</div>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
              Dispatcher Active
            </p>
          </div>
        </div>

        {/* Card 5: Failed (Full 2-cols span on mobile for balanced grid) */}
        <div className="col-span-2 sm:col-span-1 border border-border bg-card p-3.5 sm:p-4 rounded-xl shadow-xs space-y-1.5 sm:space-y-2 relative overflow-hidden group hover:border-rose-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Failed
            </span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">{metrics.failed}</div>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
              {metrics.failed > 0 ? "Requires Review" : "0 System Errors"}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Performance & Queue Delivery Status Bar */}
      <div className="border border-border bg-card p-4 rounded-xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">
              Queue Delivery & Execution Ratio
            </h3>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Total {metrics.totalJobs} Actions Processed in this Workspace
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden flex">
          <div
            style={{ width: `${metrics.totalJobs ? (metrics.success / metrics.totalJobs) * 100 : 0}%` }}
            className="bg-emerald-500 transition-all duration-500"
            title={`Success: ${metrics.success}`}
          />
          <div
            style={{ width: `${metrics.totalJobs ? (metrics.inProcess / metrics.totalJobs) * 100 : 0}%` }}
            className="bg-amber-500 transition-all duration-500 animate-pulse"
            title={`In Process: ${metrics.inProcess}`}
          />
          <div
            style={{ width: `${metrics.totalJobs ? (metrics.postScheduled / metrics.totalJobs) * 100 : 0}%` }}
            className="bg-sky-500 transition-all duration-500"
            title={`Scheduled: ${metrics.postScheduled}`}
          />
          <div
            style={{ width: `${metrics.totalJobs ? (metrics.failed / metrics.totalJobs) * 100 : 0}%` }}
            className="bg-rose-500 transition-all duration-500"
            title={`Failed: ${metrics.failed}`}
          />
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-4 text-[11px] text-muted-foreground pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0" />
            <span>Success: {metrics.success}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shrink-0" />
            <span>In Process: {metrics.inProcess}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block shrink-0" />
            <span>Scheduled: {metrics.postScheduled}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shrink-0" />
            <span>Failed: {metrics.failed}</span>
          </div>
        </div>
      </div>

      {/* 4. Main Two-Column Layout: Live Queue Table & Connected Accounts */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Live Queue Monitoring Table */}
        <div className="lg:col-span-2 border border-border bg-card rounded-xl p-3.5 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
            <div>
              <h3 className="font-bold text-sm text-foreground">Active Automation Queue</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Real-time queue execution for connected Facebook Pages
              </p>
            </div>

            {/* Filter Pills (Horizontally scrollable on mobile) */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl text-xs overflow-x-auto no-scrollbar max-w-full">
              {(["ALL", "Pending", "Processing", "Posted", "Failed"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setQueueFilter(filter)}
                  className={`px-3 py-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs sm:text-[11px] font-semibold transition shrink-0 ${
                    queueFilter === filter
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Queue Items */}
          <div className="space-y-3">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No queue items match the selected filter.
              </div>
            ) : (
              filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="border border-border p-3.5 rounded-xl hover:bg-muted/30 transition flex flex-col space-y-2 text-xs"
                >
                  {/* Top Line: Title + Type Tag */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-foreground leading-snug break-words flex-1">
                      {job.variationTitle}
                    </span>
                    {job.type && (
                      <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-[10px] font-semibold shrink-0">
                        {job.type}
                      </span>
                    )}
                  </div>

                  {/* Account Name & Scheduled Time */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{job.accountName}</span>
                    <span>•</span>
                    <span>{job.scheduledFor}</span>
                  </div>

                  {/* Error Alert Box (if failed) */}
                  {job.lastError && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-2.5 rounded-lg text-[11px] font-medium break-words leading-relaxed">
                      {job.lastError}
                    </div>
                  )}

                  {/* Bottom Line: Status Badge + Action Button */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-border/50">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        job.status === "Posted"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : job.status === "Processing"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse"
                          : job.status === "Failed"
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                          : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                      }`}
                    >
                      {job.status}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {job.status === "Failed" && (
                        <button
                          onClick={() => retryFailedJob(job.id)}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-lg transition flex items-center gap-1.5 font-bold text-xs"
                          title="Retry Failed Post"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retry</span>
                        </button>
                      )}

                      {job.status === "Pending" && (
                        <button
                          onClick={() => publishJobNow(job.id)}
                          className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg transition flex items-center gap-1.5 font-bold text-xs"
                          title="Publish Immediately"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Publish</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => router.push(`/workspace/${workspaceId}/safe/post-scheduler`)}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1 mx-auto py-1"
            >
              <span>View Full Scheduler & Calendar View</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right 1 Col: Connected Accounts List */}
        <div className="border border-border bg-card rounded-xl p-3.5 sm:p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-sm text-foreground">Connected Accounts</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {accounts.length} Pages / Profiles Linked
                </p>
              </div>
              <button
                onClick={() => router.push(`/workspace/${workspaceId}/safe/connect-accounts`)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 p-1"
              >
                <span>Manage</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="border border-border p-3 rounded-lg flex items-center justify-between text-xs hover:bg-muted/30 transition gap-2"
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Facebook className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="font-bold text-foreground truncate block">
                        {acc.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {acc.category} {acc.followers ? `• ${acc.followers}` : ""}
                    </span>
                  </div>

                  <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                    {acc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => router.push(`/workspace/${workspaceId}/safe/connect-accounts`)}
            className="w-full py-2.5 sm:py-2 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 mt-2"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Connect Another Page / Profile</span>
          </button>
        </div>
      </div>

      {/* 5. Live Activity Feed & Audit Trail */}
      <div className="border border-border bg-card p-3.5 sm:p-5 rounded-xl shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Activity className="w-4 h-4 text-blue-500 shrink-0" />
          <h3 className="font-bold text-sm text-foreground">Real-Time Automation Activity Feed</h3>
        </div>

        <div className="space-y-3 text-xs">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 border-b border-border/50 pb-2.5 last:border-0 last:pb-0"
            >
              <div className="flex items-start gap-2 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                <div className="leading-relaxed">
                  <span className="font-semibold text-foreground mr-1.5">{log.user}:</span>
                  <span className="text-muted-foreground mr-1.5">{log.action}</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">({log.target})</span>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground sm:shrink-0 pl-3.5 sm:pl-0">{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
