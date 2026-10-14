"use client"

import React, { useState } from "react"
import {
  ShieldCheck,
  Users,
  FileCheck,
  Sparkles,
  Play,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Download,
  Sliders,
  MessageSquare,
  Clock,
  Filter,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  UserCheck,
  ShieldAlert,
  Loader2,
} from "lucide-react"
import { useAdminGroupAssistant } from "../../hooks/useAdminGroupAssistant"

interface Props {
  mode?: "safe" | "advanced"
}

export function AdminGroupAssistantCenter({ mode = "safe" }: Props) {
  const {
    groups,
    selectedGroup,
    selectedGroupId,
    setSelectedGroupId,
    actionType,
    setActionType,
    rules,
    updateRule,
    state,
    loading,
    startRunner,
    resetRunner,
    exportCsv,
    refresh,
  } = useAdminGroupAssistant()

  const [activeTab, setActiveTab] = useState<"members" | "posts" | "welcome" | "ledger">("members")

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Facebook Group Admin & Moderator Assistant</span>
              <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] text-blue-300">
                {mode === "safe" ? "Business Automation (Safe)" : "Traffic Automation (Pro)"}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              Admin Group Auto-Approve & Management
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              আপনার পরিচালিত ফেসবুক গ্রুপগুলোর মেম্বার রিকোয়েস্ট কোয়ালিটি রুল অনুযায়ী অটো-অ্যাপ্রুভ করুন, স্প্যাম পোস্ট ফিল্টার করে ভ্যালিড পোস্ট পাবলিশ করুন এবং নতুন মেম্বারদের স্বয়ংক্রিয় ওয়েলকাম বার্তা পাঠান।
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refresh()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
            >
              <RotateCw className={`h-4 w-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
              <span>রিফ্রেশ</span>
            </button>
            <button
              onClick={() => startRunner("RUN_ALL")}
              disabled={state.assistantRunning || loading}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-lg transition ${
                state.assistantRunning
                  ? "bg-amber-600/60 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25"
              }`}
            >
              {state.assistantRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>অ্যাসিস্ট্যান্ট রানিং...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>১-ক্লিকে সব অটোমেশন চালান</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Runner Progress Banner */}
        {state.assistantRunning && (
          <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
            <div className="flex items-center justify-between text-xs text-amber-200 mb-2">
              <span className="flex items-center gap-2 font-semibold">
                <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                {state.currentStepLabel}
              </span>
              <span>{state.progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-blue-500 transition-all duration-500 ease-out"
                style={{ width: `${state.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">অটো-অ্যাপ্রুভড মেম্বার</span>
            <UserCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{state.totalMembersApproved}</div>
          <div className="mt-1 text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>কোয়ালিটি ফিল্টার ভেরিফাইড</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">অটো-অ্যাপ্রুভড পোস্ট</span>
            <FileCheck className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{state.totalPostsApproved}</div>
          <div className="mt-1 text-xs text-blue-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>স্প্যাম-মুক্ত পোস্ট পাবলিশড</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">ওয়েলকাম পোস্ট পাঠানো হয়েছে</span>
            <Sparkles className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{state.totalWelcomeSent}</div>
          <div className="mt-1 text-xs text-purple-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>মেম্বার এনগেজমেন্ট বৃদ্ধি</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">পেন্ডিং কিউ (মেম্বার + পোস্ট)</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-300">
            {state.pendingMembersCount + state.pendingPostsCount}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {state.pendingMembersCount} মেম্বার | {state.pendingPostsCount} পোস্ট
          </div>
        </div>
      </div>

      {/* Target Admin Group Selector */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-semibold text-slate-200">টার্গেট অ্যাডমিন গ্রুপ নির্বাচন করুন:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 flex-1 max-w-4xl">
            {groups.map((grp) => {
              const isSelected = grp.id === selectedGroupId
              return (
                <button
                  key={grp.id}
                  onClick={() => setSelectedGroupId(grp.id)}
                  className={`text-left rounded-lg p-2.5 transition border ${
                    isSelected
                      ? "border-blue-500 bg-blue-950/40 text-white shadow-md shadow-blue-500/10"
                      : "border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold truncate max-w-[140px]">{grp.name}</span>
                    <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-medium text-blue-300">
                      {grp.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>{grp.members.toLocaleString()} মেম্বার</span>
                    <span className="text-amber-400">{grp.pendingMembers} পেন্ডিং</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab("members")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold transition border-b-2 ${
            activeTab === "members"
              ? "border-blue-500 text-blue-400 bg-blue-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>মেম্বার অটো-অ্যাপ্রুভাল রুলস</span>
        </button>

        <button
          onClick={() => setActiveTab("posts")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold transition border-b-2 ${
            activeTab === "posts"
              ? "border-blue-500 text-blue-400 bg-blue-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileCheck className="h-4 w-4" />
          <span>পোস্ট মডারেশন ও ফিল্টার</span>
        </button>

        <button
          onClick={() => setActiveTab("welcome")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold transition border-b-2 ${
            activeTab === "welcome"
              ? "border-blue-500 text-blue-400 bg-blue-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>কমিউনিটি ওয়েলকাম পোস্ট</span>
        </button>

        <button
          onClick={() => setActiveTab("ledger")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold transition border-b-2 ${
            activeTab === "ledger"
              ? "border-blue-500 text-blue-400 bg-blue-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>অডিট লেজার ও অ্যাক্টিভিটি লগ</span>
        </button>
      </div>

      {/* Tab 1: Member Auto-Approval Rules */}
      {activeTab === "members" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-semibold text-white">কোয়ালিটি মেম্বার স্ক্রিনিং ক্রাইটেরিয়া</h3>
                  <p className="text-xs text-slate-400">
                    কোন রিকোয়ারমেন্ট পূরণ করলে বট মেম্বারদের অটোমেটিকভাবে গ্রুপে যুক্ত করবে তা নির্ধারণ করুন।
                  </p>
                </div>
                <button
                  onClick={() => startRunner("APPROVE_MEMBERS")}
                  disabled={state.assistantRunning || loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition shadow-sm"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>মেম্বার অ্যাপ্রুভাল শুরু করুন</span>
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
                  <div>
                    <div className="text-xs font-medium text-slate-200">প্রোফাইল পিকচার বাধ্যতামূলক</div>
                    <div className="text-[11px] text-slate-400">যেসব আইডিতে কোনো ছবি নেই তাদের স্বয়ংক্রিয়ভাবে বাদ দেওয়া হবে</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={rules.requirePic}
                    onChange={(e) => updateRule("requirePic", e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
                  <div>
                    <div className="text-xs font-medium text-slate-200">গ্রুপের নিয়মে সম্মতি (Agreed to Rules)</div>
                    <div className="text-[11px] text-slate-400">গ্রুপ রুলস এগ্রিমেন্ট টিক না দিলে অ্যাপ্রুভ হবে না</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={rules.requireRules}
                    onChange={(e) => updateRule("requireRules", e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
                  <div>
                    <div className="text-xs font-medium text-slate-200">মেম্বারশিপ প্রশ্নের উত্তর (Questions Answered)</div>
                    <div className="text-[11px] text-slate-400">অ্যাডমিন নির্ধারিত সকল প্রশ্নের উত্তর প্রদান করতে হবে</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={rules.requireQuestions}
                    onChange={(e) => updateRule("requireQuestions", e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
                  <div>
                    <div className="text-xs font-medium text-slate-200">সর্বনিম্ন অ্যাকাউন্ট বয়স (Account Age)</div>
                    <div className="text-[11px] text-slate-400">স্প্যাম ও নতুন ফেইক আইডি রুখতে নুন্যতম বয়স ফিল্টার</div>
                  </div>
                  <select
                    value={rules.minAgeMonths}
                    onChange={(e) => updateRule("minAgeMonths", Number(e.target.value))}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-200"
                  >
                    <option value={1}>কমপক্ষে ১ মাস</option>
                    <option value={3}>কমপক্ষে ৩ মাস</option>
                    <option value={6}>কমপক্ষে ৬ মাস</option>
                    <option value={12}>কমপক্ষে ১ বছর</option>
                  </select>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
                  <div>
                    <div className="text-xs font-medium text-slate-200">এক ক্লিকে সর্বোচ্চ মেম্বার প্রসেস লিমিট</div>
                    <div className="text-[11px] text-slate-400">নিরাপদ রেট লিমিট বজায় রাখতে এক ব্যাচে সর্বোচ্চ সংখ্যা</div>
                  </div>
                  <input
                    type="number"
                    min={5}
                    max={50}
                    value={rules.limit}
                    onChange={(e) => updateRule("limit", Number(e.target.value))}
                    className="w-20 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-200 text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recently Approved Members */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold text-slate-200">সম্প্রতি অ্যাপ্রুভড মেম্বার</span>
              <span className="text-[11px] text-slate-400">লাইভ ভেরিফিকেশন</span>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto">
              {state.recentApprovedMembers && state.recentApprovedMembers.length > 0 ? (
                state.recentApprovedMembers.map((mem) => (
                  <div key={mem.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{mem.name}</span>
                      <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300">
                        {mem.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>{mem.accountAge}</span>
                      <span>{mem.approvedAt}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-500">কোনো মেম্বার রেকর্ড এখনো নেই</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Post Moderation & Spam Filter */}
      {activeTab === "posts" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-semibold text-white">পেন্ডিং পোস্ট অটো-মডারেশন ফিল্টার</h3>
                  <p className="text-xs text-slate-400">
                    স্প্যাম ও নিষিদ্ধ কি-ওয়ার্ডযুক্ত পোস্ট স্বয়ংক্রিয়ভাবে বাতিল করে কোয়ালিটি পোস্ট পাবলিশ করুন।
                  </p>
                </div>
                <button
                  onClick={() => startRunner("APPROVE_POSTS")}
                  disabled={state.assistantRunning || loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-blue-500 transition shadow-sm"
                >
                  <FileCheck className="h-3.5 w-3.5" />
                  <span>পেন্ডিং পোস্ট স্ক্যান ও অ্যাপ্রুভ</span>
                </button>
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                  <label className="block text-xs font-medium text-slate-200 mb-1">
                    নিষিদ্ধ কি-ওয়ার্ড ব্ল্যাকলিস্ট (কমা দিয়ে আলাদা করুন)
                  </label>
                  <input
                    type="text"
                    defaultValue="casino, bet365, earn money 1000 daily, crypto giveaway, inbox me for income, scam"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    এই শব্দগুলো কোনো পেন্ডিং পোস্টে পাওয়া গেলে পোস্টটি অটোমেটিক Decline/Reject হবে।
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                  <div>
                    <div className="text-xs font-medium text-slate-200">এক্সটার্নাল লিঙ্ক অনুমোদন (External Links)</div>
                    <div className="text-[11px] text-slate-400">পোস্টে বাইরের কোনো ওয়েবসাইটের লিঙ্ক থাকলে রিভিউতে রাখা হবে</div>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked={false}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                  <div>
                    <div className="text-xs font-medium text-slate-200">ছবি/ভিডিও যুক্ত পোস্ট অটো-অ্যাপ্রুভ</div>
                    <div className="text-[11px] text-slate-400">যেসব পোস্টে মিডিয়া কনটেন্ট আছে সেগুলো প্রায়োরিটি সহ পাবলিশ করা হবে</div>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked={true}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recently Approved Posts */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold text-slate-200">সম্প্রতি অ্যাপ্রুভড পোস্ট</span>
              <span className="text-[11px] text-slate-400">পাবলিশড কিউ</span>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto">
              {state.recentApprovedPosts && state.recentApprovedPosts.length > 0 ? (
                state.recentApprovedPosts.map((post) => (
                  <div key={post.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{post.author}</span>
                      <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-300">
                        {post.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">{post.snippet}</p>
                    <div className="text-[10px] text-slate-400 mt-1.5 flex items-center justify-between">
                      <span>{post.groupName}</span>
                      <span>{post.approvedAt}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-500">কোনো পোস্ট রেকর্ড এখনো নেই</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Community Welcome Post Assistant */}
      {activeTab === "welcome" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur space-y-5">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">নতুন মেম্বারদের জন্য স্বয়ংক্রিয় ওয়েলকাম পোস্ট</h3>
            <p className="text-xs text-slate-400">
              গ্রুপে নতুন মেম্বার যুক্ত হওয়ার পর বট স্বয়ংক্রিয়ভাবে ওয়েলকাম পোস্ট করবে যাতে তাদের সাথে কমিউনিটির বন্ডিং ও এনগেজমেন্ট দ্রুত বৃদ্ধি পায়।
            </p>
          </div>

          <div className="space-y-3 max-w-3xl">
            <label className="block text-xs font-medium text-slate-200">ওয়েলকাম বার্তার টেমপ্লেট</label>
            <textarea
              rows={4}
              value={rules.welcomeText}
              onChange={(e) => updateRule("welcomeText", e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
              <span>ব্যবহারযোগ্য ডাইনামিক ট্যাগ:</span>
              <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-purple-300">{"{group_name}"}</span>
              <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-purple-300">{"{new_members_count}"}</span>
              <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-purple-300">{"{rules_link}"}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => startRunner("SEND_WELCOME")}
              disabled={state.assistantRunning || loading}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 transition shadow-lg shadow-purple-500/20"
            >
              <Sparkles className="h-4 w-4" />
              <span>এখনই ওয়েলকাম পোস্ট পাবলিশ করুন</span>
            </button>
            <span className="text-xs text-slate-400">
              (টার্গেট গ্রুপ: <strong className="text-slate-200">{selectedGroup?.name}</strong>)
            </span>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Ledger & Activity Log */}
      {activeTab === "ledger" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">অ্যাডমিন অ্যাক্টিভিটি অডিট লেজার</h3>
              <p className="text-xs text-slate-400">প্রতিটি স্বয়ংক্রিয় অ্যাপ্রুভাল, ফিল্টারিং ও ওয়েলকাম অ্যাকশনের রিয়েল-টাইম লগ</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportCsv}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
              >
                <Download className="h-3.5 w-3.5" />
                <span>CSV ডাউনলোড</span>
              </button>
              <button
                onClick={resetRunner}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>রিসেট</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-3">সময়</th>
                  <th className="p-3">অ্যাকশন</th>
                  <th className="p-3">টার্গেট গ্রুপ</th>
                  <th className="p-3">স্ট্যাটাস</th>
                  <th className="p-3">ডিটেইলস / রুল চেক</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {state.auditLogs && state.auditLogs.length > 0 ? (
                  state.auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-3 font-mono text-[11px] text-slate-400">{log.timestamp}</td>
                      <td className="p-3 font-medium text-white">{log.action}</td>
                      <td className="p-3 text-slate-300">{log.group}</td>
                      <td className="p-3">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                            log.status === "SUCCESS"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : log.status === "SKIPPED"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-red-500/20 text-red-300"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{log.details}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      কোনো অ্যাকশন রেকর্ড পাওয়া যায়নি
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
