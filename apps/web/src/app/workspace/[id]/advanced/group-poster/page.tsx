"use client"

import React, { useState } from "react"
import {
  Users,
  Clock,
  Layers,
  Sparkles,
  Send,
  UserPlus,
  Plus,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Share2,
} from "lucide-react"

export default function AdvancedGroupPosterPage() {
  const [groupLimit, setGroupLimit] = useState(5)
  const [delayInterval, setDelayInterval] = useState("5-15")
  const [masterText, setMasterText] = useState("")
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handlePostGroup = (e: React.FormEvent) => {
    e.preventDefault()
    showToast(
      `Bulk Group Post Launched! ${groupLimit} groups selected per account across connected IDs. Randomized delays (${delayInterval} min) activated.`
    )
  }

  const handleInviteFollowers = () => {
    showToast("Inviting all connected account followers & friends to your custom group...")
  }

  return (
    <div className="max-w-4xl space-y-6 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-orange-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Post A Group Engine
            </h1>
            <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800">
              ADVANCED ENGINE
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Post to joined Facebook Groups across connected accounts in bulk (3-5 groups/account) with AI variations, photo rotation, and 5-15 min random delays.
          </p>
        </div>
      </div>

      {/* Executive Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Campaign Limit</span>
            <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">
              {groupLimit * 100}
            </span>
            <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400">
              Posts Cap
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Delay Interval</span>
            <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">
              {delayInterval}m
            </span>
            <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400">
              Anti-Ban Safe
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Target Cluster</span>
            <Layers className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">
              100
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground">
              Connected IDs
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Multi-Account Sync</span>
            <Sparkles className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">
              AI
            </span>
            <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400">
              Auto Variation
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handlePostGroup} className="border border-border bg-card p-5 sm:p-6 rounded-xl space-y-6 shadow-xs">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span>Groups Per Account Limit (3-5 Groups)</span>
            </label>
            <select
              value={groupLimit}
              onChange={(e) => setGroupLimit(Number(e.target.value))}
              className="w-full border border-border rounded-lg p-2.5 text-xs bg-background text-foreground focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition min-h-[38px]"
            >
              <option value={3}>3 Groups / Account (300 Total Posts)</option>
              <option value={5}>5 Groups / Account (500 Total Posts)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span>Group Delay Posting System</span>
            </label>
            <select
              value={delayInterval}
              onChange={(e) => setDelayInterval(e.target.value)}
              className="w-full border border-border rounded-lg p-2.5 text-xs bg-background text-foreground focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition min-h-[38px]"
            >
              <option value="5-15">Random 5, 8, 10, 15 Minutes (Safe Mode)</option>
              <option value="10-20">Random 10 - 20 Minutes (Ultra Safe)</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            <span>Master Group Post Text</span>
          </label>
          <textarea
            rows={4}
            required
            placeholder="Write master group post content..."
            value={masterText}
            onChange={(e) => setMasterText(e.target.value)}
            className="w-full border border-border rounded-lg p-3 text-xs bg-background text-foreground focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition leading-relaxed"
          />
        </div>

        <div className="border border-orange-500/20 bg-orange-50/20 dark:bg-orange-950/10 p-4 rounded-xl space-y-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400 flex items-center space-x-1.5">
            <UserPlus className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>Group Offload & Invites</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Optionally invite all friends and followers across connected accounts to join your custom group.
          </p>
          <button
            type="button"
            onClick={handleInviteFollowers}
            className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition flex items-center space-x-1.5 min-h-[36px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Invite All Followers to Custom Group</span>
          </button>
        </div>

        <button
          type="submit"
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg text-sm shadow-xs transition flex items-center justify-center space-x-2 min-h-[44px]"
        >
          <Send className="w-4 h-4" />
          <span>Launch Group Post Campaign</span>
        </button>
      </form>
    </div>
  )
}
