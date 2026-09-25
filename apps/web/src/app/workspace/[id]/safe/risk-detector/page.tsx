"use client"

import React, { useState, useMemo } from "react"
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  Users,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  Info,
} from "lucide-react"

interface AccountRiskHealth {
  id: string
  pageName: string
  pageId: string
  riskLevel: "Low" | "Medium" | "High"
  riskScore: number // 0 - 100
  postFrequency: string
  apiCallRate: string
  activityPattern: string
  unusualBehavior: string
  issues: string[]
  safetyRecommendations: string[]
  lastChecked: string
}

export default function SafeRiskDetectorPage() {
  const [accountHealths, setAccountHealths] = useState<AccountRiskHealth[]>([
    {
      id: "risk-1",
      pageName: "Fashion Hub Official",
      pageId: "109823487123",
      riskLevel: "Low",
      riskScore: 12,
      postFrequency: "2-3 Posts / Day (Safe Range)",
      apiCallRate: "42 Calls / Hour (Well below Graph API limit)",
      activityPattern: "Natural Human Schedule with Queue Delays",
      unusualBehavior: "None Detected",
      issues: ["No policy violations or abnormal rate spikes detected."],
      safetyRecommendations: [
        "ম্যান্ডেটরি ৫ মিনিট পোস্ট ডিলে সক্রিয় রাখুন।",
        "একই ক্যাপশন বারবার পোস্ট না করে AI Variation Engine ব্যবহার করুন।",
      ],
      lastChecked: "Just now",
    },
    {
      id: "risk-2",
      pageName: "Tech Gadgets BD",
      pageId: "987234812314",
      riskLevel: "Medium",
      riskScore: 48,
      postFrequency: "6-8 Posts / Hour (Slightly High)",
      apiCallRate: "185 Calls / Hour (Approaching Graph API threshold)",
      activityPattern: "Rapid burst posting detected between 3 PM - 4 PM",
      unusualBehavior: "Multiple identical links detected in comments",
      issues: [
        "একই সময়ে খুব দ্রুত অনেকগুলো এপিআই কল হচ্ছে।",
        "পোস্টের মাঝে ডিলে টাইম ২ মিনিটের নিচে নেমে গেছে।",
      ],
      safetyRecommendations: [
        "পোস্ট ডিলে টাইম বাড়িয়ে ন্যূনতম ১০-১৫ মিনিট করুন।",
        "Link Comment Block চালু করে স্প্যাম লিংক ফিল্টার নিশ্চিত করুন।",
        "অফিসিয়াল ও-অথ টোকেন রি-অথেনটিকেট করুন।",
      ],
      lastChecked: "2 mins ago",
    },
    {
      id: "risk-3",
      pageName: "Organic Superstore",
      pageId: "445123987122",
      riskLevel: "Low",
      riskScore: 8,
      postFrequency: "1 Post / Day (Optimal)",
      apiCallRate: "18 Calls / Hour (Safe)",
      activityPattern: "Consistent scheduled posting via Content Calendar",
      unusualBehavior: "None Detected",
      issues: ["অ্যাকাউন্ট সম্পূর্ণ নিরাপদ রয়েছে।"],
      safetyRecommendations: [
        "বর্তমান শিডিউলিং নিয়ম বজায় রাখুন।",
      ],
      lastChecked: "5 mins ago",
    },
  ])

  const [isScanning, setIsScanning] = useState(false)
  const [scanningId, setScanningId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleRunHealthScan = () => {
    setIsScanning(true)
    setTimeout(() => {
      setIsScanning(false)
      showToast("All connected accounts evaluated successfully. 0 critical flags.")
    }, 1200)
  }

  const handleScanSingleAccount = (id: string) => {
    setScanningId(id)
    setTimeout(() => {
      setScanningId(null)
      showToast("Account compliance check updated.")
    }, 900)
  }

  const handleCopyPageId = (pageId: string, id: string) => {
    navigator.clipboard.writeText(pageId)
    setCopiedId(id)
    showToast(`Page ID ${pageId} copied to clipboard!`)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Summary Metrics
  const summary = useMemo(() => {
    const total = accountHealths.length
    const safeCount = accountHealths.filter((a) => a.riskLevel === "Low").length
    const attentionCount = accountHealths.filter((a) => a.riskLevel !== "Low").length
    const avgScore = total > 0 ? Math.round(accountHealths.reduce((sum, a) => sum + a.riskScore, 0) / total) : 0
    return { total, safeCount, attentionCount, avgScore }
  }, [accountHealths])

  return (
    <div className="max-w-5xl space-y-6 pb-20">
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
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Risk Score Detector & Account Health Check
            </h1>
            <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800">
              SAFE MODE
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
            Automated compliance check evaluating post frequency, Graph API call rate, activity patterns, and ban risk level.
          </p>
        </div>

        <button
          onClick={handleRunHealthScan}
          disabled={isScanning}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition shadow-xs flex items-center justify-center space-x-2 min-h-[38px] shrink-0"
        >
          <Activity className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
          <span>{isScanning ? "Scanning Account Health..." : "Run Full Account Health Scan"}</span>
        </button>
      </div>

      {/* Executive Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Monitored Accounts</span>
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">
              {summary.total}
            </span>
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
              Active Sync
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Safe & Compliant</span>
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">
              {summary.safeCount}
            </span>
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
              {Math.round((summary.safeCount / (summary.total || 1)) * 100)}% Optimal
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Attention Required</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">
              {summary.attentionCount}
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground">
              {summary.attentionCount === 0 ? "None" : "Action Suggested"}
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Average Risk Score</span>
            <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">
              {summary.avgScore}%
            </span>
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
              Low Ban Risk
            </span>
          </div>
        </div>
      </div>

      {/* Account Risk Cards List */}
      <div className="space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <h2 className="font-bold text-sm text-foreground">
            Connected Account Health Analysis ({accountHealths.length})
          </h2>
          <span className="text-[11px] text-muted-foreground">
            Real-time Graph API & activity rate monitoring
          </span>
        </div>

        {accountHealths.map((acc) => (
          <div key={acc.id} className="border border-border bg-card p-5 rounded-xl space-y-4 shadow-xs">
            {/* Account Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3.5">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-black text-base text-foreground block">{acc.pageName}</span>
                  <button
                    onClick={() => handleCopyPageId(acc.pageId, acc.id)}
                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded border border-border bg-muted/50 text-[10px] font-mono text-muted-foreground hover:text-foreground transition"
                    title="Click to copy Page ID"
                  >
                    <span>ID: {acc.pageId}</span>
                    {copiedId === acc.id ? (
                      <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <span className="text-[10px] text-muted-foreground block">
                  Last verified: {acc.lastChecked}
                </span>
              </div>

              {/* Risk Level Badge & Single Scan Trigger */}
              <div className="flex items-center space-x-2.5">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                    acc.riskLevel === "Low"
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                      : acc.riskLevel === "Medium"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                  }`}
                >
                  {acc.riskLevel} Ban Risk ({acc.riskScore}%)
                </span>

                <button
                  onClick={() => handleScanSingleAccount(acc.id)}
                  disabled={scanningId === acc.id}
                  title="Re-scan account health"
                  className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition min-h-[32px] min-w-[32px] flex items-center justify-center disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${scanningId === acc.id ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Risk Gauge Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Activity className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span>Compliance & Health Index</span>
                </span>
                <span className="text-foreground font-bold">{acc.riskScore} / 100</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    acc.riskScore > 60
                      ? "bg-red-500"
                      : acc.riskScore > 35
                      ? "bg-amber-500"
                      : "bg-blue-600"
                  }`}
                  style={{ width: `${Math.min(acc.riskScore, 100)}%` }}
                />
              </div>
            </div>

            {/* Health Indicators Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
              <div className="p-3 border border-border rounded-lg bg-card shadow-xs">
                <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">
                  Post Frequency
                </span>
                <span className="text-foreground font-semibold mt-1 block leading-snug">
                  {acc.postFrequency}
                </span>
              </div>
              <div className="p-3 border border-border rounded-lg bg-card shadow-xs">
                <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">
                  API Call Rate
                </span>
                <span className="text-foreground font-semibold mt-1 block leading-snug">
                  {acc.apiCallRate}
                </span>
              </div>
              <div className="p-3 border border-border rounded-lg bg-card shadow-xs">
                <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">
                  Activity Pattern
                </span>
                <span className="text-foreground font-semibold mt-1 block leading-snug">
                  {acc.activityPattern}
                </span>
              </div>
              <div className="p-3 border border-border rounded-lg bg-card shadow-xs">
                <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">
                  Unusual Behavior
                </span>
                <span className="text-foreground font-semibold mt-1 block leading-snug">
                  {acc.unusualBehavior}
                </span>
              </div>
            </div>

            {/* Issues Breakdown & Specific Safety Suggestions */}
            <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-border text-[11px]">
              <div className="p-3.5 border border-border rounded-lg bg-card shadow-xs space-y-2">
                <span className="font-bold text-foreground flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Identified Issues / Risk Factors:</span>
                </span>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 font-medium leading-relaxed">
                  {acc.issues.map((iss, idx) => (
                    <li key={idx}>{iss}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 border border-border rounded-lg bg-card shadow-xs space-y-2">
                <span className="font-bold text-foreground flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Specific Safety Recommendations:</span>
                </span>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 font-medium leading-relaxed">
                  {acc.safetyRecommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
