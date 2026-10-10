"use client"

import React, { useState } from "react"
import {
  MessageSquare,
  Globe,
  Bot,
  Play,
  CheckCircle2,
  Clock,
  Filter,
  Users,
  Flame,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

export default function AdvancedCommentAssistantPage() {
  const [activeTab, setActiveTab] = useState<"PUBLIC" | "REPLY">("PUBLIC")
  const [dailyLimit, setDailyLimit] = useState(25)
  const [replyMode, setReplyMode] = useState("AUTO_SMART")
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleRunPublicComment = () => {
    showToast("Public Comment Assistant Campaign started! Simulating human action flow.")
  }

  const handleActivateReplyComment = () => {
    showToast("AI Reply Comment Assistant enabled! Listening for new comments.")
  }

  const flowSteps = [
    "Open FB",
    "Scroll Feed (10-30s)",
    "Like Post",
    "Wait Delay (1-3m)",
    "Post Comment (50+ Library)",
    "Pause (2-5m)",
  ]

  return (
    <div className="max-w-4xl space-y-6 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-blue-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              FB Smart Comment Assistant
            </h1>
            <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800">
              ADVANCED ENGINE
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Automated public viral post engagement & human-like AI comment reply assistant.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1.5 bg-muted/60 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab("PUBLIC")}
            className={`px-3 py-2 rounded-lg transition flex items-center space-x-1.5 min-h-[36px] ${
              activeTab === "PUBLIC"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Public Comment</span>
          </button>
          <button
            onClick={() => setActiveTab("REPLY")}
            className={`px-3 py-2 rounded-lg transition flex items-center space-x-1.5 min-h-[36px] ${
              activeTab === "REPLY"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Reply Assistant</span>
          </button>
        </div>
      </div>

      {/* Executive Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Daily Comment Cap</span>
            <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">
              {dailyLimit}
            </span>
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
              Per Account
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Viral Filter</span>
            <Flame className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">
              200+
            </span>
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
              Min Likes
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Action Delays</span>
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">
              1-3m
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground">
              Anti-Ban Delay
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Connected Cluster</span>
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">
              100
            </span>
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
              Active IDs
            </span>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === "PUBLIC" ? (
        <div className="border border-border bg-card p-5 sm:p-6 rounded-xl space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-sm text-foreground">Public Comment Assistant Controls</h3>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
              Continuous Campaign Active
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Daily Comment Limit / Account</span>
              </label>
              <input
                type="number"
                min="5"
                max="100"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Number(e.target.value))}
                className="w-full border border-border rounded-lg p-2.5 text-xs bg-background text-foreground focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition min-h-[38px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center space-x-1.5">
                <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Viral Post Finder Filters</span>
              </label>
              <div className="text-xs text-muted-foreground p-2.5 border border-border rounded-lg bg-muted/30 font-medium min-h-[38px] flex items-center">
                Min 200+ Likes • Min 20+ Comments • Age 1-24h
              </div>
            </div>
          </div>

          {/* Visual Human-Like Action Flow Simulation */}
          <div className="border border-blue-500/20 bg-blue-50/20 dark:bg-blue-950/10 p-4 rounded-xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center space-x-2">
              <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Human-Like Action Flow Simulation</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {flowSteps.map((step, idx) => (
                <React.Fragment key={idx}>
                  <div className="bg-card border border-border px-3 py-1.5 rounded-lg text-[11px] font-semibold text-foreground shadow-xs">
                    {step}
                  </div>
                  {idx < flowSteps.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
              Simulates genuine user browsing patterns to maintain maximum Graph API trust and prevent spam flags.
            </p>
          </div>

          <button
            onClick={handleRunPublicComment}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg text-xs shadow-xs transition flex items-center justify-center space-x-2 min-h-[42px]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Public Comment Assistant</span>
          </button>
        </div>
      ) : (
        <div className="border border-border bg-card p-5 sm:p-6 rounded-xl space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-sm text-foreground">AI Reply Comment Assistant Controls</h3>
            </div>
            <span className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 rounded-full font-bold">
              Listening for New Comments
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Reply Operating Mode</span>
            </label>
            <select
              value={replyMode}
              onChange={(e) => setReplyMode(e.target.value)}
              className="w-full border border-border rounded-lg p-2.5 text-xs bg-background text-foreground focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition min-h-[38px]"
            >
              <option value="AUTO_SMART">AI Auto Mode (Option B: AI Smart Context Reply)</option>
              <option value="AUTO_SAVED">AI Auto Mode (Option A: 10 Saved Replies Sequence)</option>
              <option value="MANUAL">AI Manual Mode (Inbox Suggestions for User Approval)</option>
            </select>
          </div>

          <div className="border border-border bg-muted/30 p-4 rounded-xl space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Delay & Variation Engine</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Randomized delays: 30 seconds to 3 minutes. Synonyms, phrase variations, and sentence structures automatically randomized.
            </p>
          </div>

          <button
            onClick={handleActivateReplyComment}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg text-xs shadow-xs transition flex items-center justify-center space-x-2 min-h-[42px]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Activate AI Reply Comment Assistant</span>
          </button>
        </div>
      )}
    </div>
  )
}

