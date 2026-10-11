"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
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
  Zap,
  Sparkles,
} from "lucide-react"

interface AccountRiskHealth {
  id: string
  pageName: string
  pageId: string
  accountType?: "Personal ID" | "Facebook Page"
  profileUrl?: string
  riskLevel: "Low" | "Medium" | "High"
  riskScore: number // 0 - 100
  accountQualityStatus?: string
  postFrequency: string
  apiCallRate: string
  activityPattern: string
  unusualBehavior: string
  issues: string[]
  safetyRecommendations: string[]
  lastChecked: string
  isLiveVerified?: boolean
}

interface SessionInfo {
  hasCookie: boolean
  cUserId: string
  accountName: string
  botStatus: string
  authError: string | null
  updatedAt: string | null
}

interface ScanState {
  isScanning: boolean
  targetAccountId: string | null
  currentStepLabel: string
  progress: number
  lastScanAt: string | null
}

interface LiveTelemetry {
  friendActions: number
  unfriendActions: number
  groupHunts: number
  msgrBroadcasts: number
  totalActions: number
}

export default function SafeRiskDetectorPage() {
  const [accountHealths, setAccountHealths] = useState<AccountRiskHealth[]>([])
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    hasCookie: true,
    cUserId: "61560588090925",
    accountName: "Rasidul Islam Sajib — Personal ID (61560588090925)",
    botStatus: "CONNECTED",
    authError: null,
    updatedAt: null,
  })
  const [scanState, setScanState] = useState<ScanState>({
    isScanning: false,
    targetAccountId: null,
    currentStepLabel: "Ready — রিয়েল ফেসবুক আইডি ও পেজগুলোর লাইভ হেলথ এবং ব্যান রিস্ক মনিটর চালু আছে",
    progress: 0,
    lastScanAt: null,
  })
  const [liveTelemetry, setLiveTelemetry] = useState<LiveTelemetry>({
    friendActions: 0,
    unfriendActions: 0,
    groupHunts: 0,
    msgrBroadcasts: 0,
    totalActions: 0,
  })

  const [isScanning, setIsScanning] = useState(false)
  const [scanningId, setScanningId] = useState<string | null>(null)
  const [shieldingId, setShieldingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const [showCookieBox, setShowCookieBox] = useState(false)
  const [cookieInput, setCookieInput] = useState("")
  const [isSavingCookie, setIsSavingCookie] = useState(false)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const fetchLiveRiskData = useCallback(async () => {
    try {
      const res = await fetch("/api/facebook-bot/risk-detector", { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      if (!data.success) return

      if (data.session) setSessionInfo(data.session)
      if (Array.isArray(data.accountHealths)) setAccountHealths(data.accountHealths)
      if (data.liveTelemetry) setLiveTelemetry(data.liveTelemetry)
      if (data.scanState) {
        setScanState(data.scanState)
        setIsScanning(Boolean(data.scanState.isScanning))
        if (!data.scanState.isScanning) {
          setScanningId(null)
        }
      }
    } catch {
      // ignore transient errors
    }
  }, [])

  useEffect(() => {
    fetchLiveRiskData()
    const timer = setInterval(() => {
      fetchLiveRiskData()
    }, 2500)
    return () => clearInterval(timer)
  }, [fetchLiveRiskData])

  const handleRunHealthScan = async () => {
    setIsScanning(true)
    showToast("🔍 রিয়েল ব্রাউজারে আপনার Facebook আইডি ও ৪টি পেজের হেলথ স্ক্যান শুরু হয়েছে...")
    try {
      const res = await fetch("/api/facebook-bot/risk-detector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RUN_LIVE_HEALTH_SCAN" }),
      })
      const data = await res.json()
      if (data.success) {
        if (data.scanState) setScanState(data.scanState)
        if (Array.isArray(data.accountHealths)) setAccountHealths(data.accountHealths)
        showToast(data.message || "Live health scan launched on real Facebook!")
      } else {
        showToast(data.error || "Failed to launch live scan")
        setIsScanning(false)
      }
    } catch {
      setIsScanning(false)
    }
  }

  const handleScanSingleAccount = async (id: string, name: string) => {
    setScanningId(id)
    setIsScanning(true)
    showToast(`🔍 রিয়েল ফেসবুকে "${name}"-এর লাইভ হেলথ ও ব্যান রিস্ক চেক শুরু হয়েছে...`)
    try {
      const res = await fetch("/api/facebook-bot/risk-detector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RUN_LIVE_HEALTH_SCAN", targetAccountId: id }),
      })
      const data = await res.json()
      if (data.success && data.scanState) {
        setScanState(data.scanState)
      }
    } catch {
      setScanningId(null)
      setIsScanning(false)
    }
  }

  const handleApplySafeShield = async (accountId?: string, name?: string) => {
    setShieldingId(accountId || "ALL")
    try {
      const res = await fetch("/api/facebook-bot/risk-detector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPLY_SAFE_THROTTLE", accountId: accountId || "" }),
      })
      const data = await res.json()
      if (data.success) {
        if (Array.isArray(data.accountHealths)) setAccountHealths(data.accountHealths)
        showToast(
          name
            ? `🛡️ "${name}"-এ Safe Anti-Ban Shield সক্রিয় করা হয়েছে! রিস্ক স্কোর কমে গেছে।`
            : data.message
        )
      }
    } finally {
      setTimeout(() => setShieldingId(null), 800)
    }
  }

  const handleSaveCookie = async () => {
    if (!cookieInput.trim()) return
    setIsSavingCookie(true)
    try {
      const res = await fetch("/api/facebook-bot/risk-detector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_COOKIE", cookieString: cookieInput.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setCookieInput("")
        setShowCookieBox(false)
        showToast(data.message || "Connected to Real FB ID!")
        await fetchLiveRiskData()
      } else {
        showToast(data.error || "Invalid cookie string")
      }
    } finally {
      setIsSavingCookie(false)
    }
  }

  const handleCopyPageId = (pageId: string, id: string) => {
    navigator.clipboard.writeText(pageId)
    setCopiedId(id)
    showToast(`ID ${pageId} copied to clipboard!`)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Summary Metrics
  const summary = useMemo(() => {
    const total = accountHealths.length
    const safeCount = accountHealths.filter((a) => a.riskLevel === "Low").length
    const attentionCount = accountHealths.filter((a) => a.riskLevel !== "Low").length
    const avgScore =
      total > 0 ? Math.round(accountHealths.reduce((sum, a) => sum + a.riskScore, 0) / total) : 0
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
              LIVE REAL FB
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
            Real-time compliance & anti-ban monitor connected to your Personal Facebook ID (Rasidul Islam Sajib) and 4 Facebook Pages. Evaluates live bot action rates, session health, and restriction warnings.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 shrink-0">
          {summary.attentionCount > 0 && (
            <button
              onClick={() => handleApplySafeShield()}
              disabled={shieldingId === "ALL"}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-2.5 rounded-lg transition shadow-xs flex items-center space-x-1.5 min-h-[38px]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>🛡️ Apply Safe Shield (All)</span>
            </button>
          )}

          <button
            onClick={handleRunHealthScan}
            disabled={isScanning}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition shadow-xs flex items-center justify-center space-x-2 min-h-[38px]"
          >
            <Activity className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
            <span>{isScanning ? "Scanning Live on Facebook..." : "🔍 Run Live FB Health Scan"}</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CONNECTED REAL FACEBOOK PERSONAL ID + TELEMETRY BANNER    */}
      {/* ======================================================== */}
      <div className="border-2 border-blue-500/30 bg-gradient-to-r from-blue-950/20 via-card to-emerald-950/20 p-4 sm:p-5 rounded-2xl shadow-sm space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-border/70 pb-3">
          <div className="flex items-center flex-wrap gap-2.5">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{sessionInfo.hasCookie ? "REAL FB CONNECTED" : "COOKIE REQUIRED"}</span>
            </span>
            <span className="text-xs sm:text-sm font-black text-foreground">
              {sessionInfo.accountName || "Rasidul Islam Sajib — Personal ID (61560588090925)"}
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
              1 Personal ID + 4 Real Pages Monitored
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => setShowCookieBox(!showCookieBox)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-card hover:bg-muted border border-border text-foreground transition"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>{showCookieBox ? "Hide Cookie Box" : "Reconnect FB Cookie"}</span>
            </button>
          </div>
        </div>

        {showCookieBox && (
          <div className="p-3.5 rounded-xl bg-muted/60 border border-border space-y-2 text-xs">
            <p className="font-bold text-foreground">
              Update Real Facebook Session Cookie (`c_user` & `xs`) for Live Account Health Verification:
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Paste full Facebook cookie string (c_user=...; xs=...) or JSON array..."
                value={cookieInput}
                onChange={(e) => setCookieInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border bg-background text-xs font-mono"
              />
              <button
                onClick={handleSaveCookie}
                disabled={isSavingCookie || !cookieInput.trim()}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition disabled:opacity-50 shrink-0"
              >
                {isSavingCookie ? "Connecting..." : "Save & Connect Real FB"}
              </button>
            </div>
          </div>
        )}

        {/* Live Bot Action Telemetry Pills */}
        <div className="flex items-center flex-wrap gap-2 text-[11px]">
          <span className="font-extrabold text-muted-foreground flex items-center gap-1 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Live 24h Bot Action Telemetry:</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-card border border-border font-bold text-foreground">
            Friend Engine: <strong className="text-blue-600 dark:text-blue-400">{liveTelemetry.friendActions}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-card border border-border font-bold text-foreground">
            Unfriend Bot: <strong className="text-blue-600 dark:text-blue-400">{liveTelemetry.unfriendActions}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-card border border-border font-bold text-foreground">
            Live Group Hunts: <strong className="text-blue-600 dark:text-blue-400">{liveTelemetry.groupHunts}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-card border border-border font-bold text-foreground">
            Messenger Broadcasts: <strong className="text-blue-600 dark:text-blue-400">{liveTelemetry.msgrBroadcasts}</strong>
          </span>
        </div>

        {/* Live Scan Progress & Status Bar */}
        {(isScanning || scanState.currentStepLabel) && (
          <div className="p-3 rounded-xl bg-background/90 border border-blue-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 font-bold text-foreground">
                <Zap className={`w-4 h-4 text-blue-500 ${isScanning ? "animate-bounce" : ""}`} />
                <span>{scanState.currentStepLabel}</span>
              </div>
              <span className="text-[11px] font-black text-blue-600 dark:text-blue-400">
                {scanState.progress || 0}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-500"
                style={{ width: `${Math.max(5, scanState.progress || 0)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Executive Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Monitored IDs & Pages</span>
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">
              {summary.total}
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              1 ID + 4 Pages
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
              {summary.attentionCount === 0 ? "All Protected" : "Action Suggested"}
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
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Low Ban Risk
            </span>
          </div>
        </div>
      </div>

      {/* Account Risk Cards List */}
      <div className="space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <h2 className="font-bold text-sm text-foreground">
            Connected Real Facebook ID & Pages Health Analysis ({accountHealths.length})
          </h2>
          <span className="text-[11px] text-muted-foreground">
            Live Puppeteer & Bot Action Rate Monitoring
          </span>
        </div>

        {accountHealths.map((acc) => (
          <div key={acc.id} className="border border-border bg-card p-5 rounded-xl space-y-4 shadow-xs">
            {/* Account Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3.5">
              <div className="space-y-1">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="font-black text-base text-foreground">{acc.pageName}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      acc.accountType === "Personal ID"
                        ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30"
                        : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
                    }`}
                  >
                    {acc.accountType || "Facebook Page"}
                  </span>
                  <button
                    onClick={() => handleCopyPageId(acc.pageId, acc.id)}
                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded border border-border bg-muted/50 text-[10px] font-mono text-muted-foreground hover:text-foreground transition"
                    title="Click to copy ID"
                  >
                    <span>ID: {acc.pageId}</span>
                    {copiedId === acc.id ? (
                      <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                  {acc.profileUrl && (
                    <a
                      href={acc.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <span>Open on FB</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <div className="flex items-center flex-wrap gap-2 text-[10px] text-muted-foreground">
                  <span>Last verified: <strong className="text-foreground">{acc.lastChecked}</strong></span>
                  {acc.accountQualityStatus && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {acc.accountQualityStatus}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Risk Level Badge & Single Scan / Shield Trigger */}
              <div className="flex items-center flex-wrap gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                    acc.riskLevel === "Low"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                      : acc.riskLevel === "Medium"
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                      : "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30"
                  }`}
                >
                  {acc.riskLevel} Ban Risk ({acc.riskScore}%)
                </span>

                {acc.riskLevel !== "Low" && (
                  <button
                    onClick={() => handleApplySafeShield(acc.id, acc.pageName)}
                    disabled={shieldingId === acc.id}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition flex items-center space-x-1 shadow-xs disabled:opacity-50"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{shieldingId === acc.id ? "Applying..." : "🛡️ Apply Safe Anti-Ban Shield"}</span>
                  </button>
                )}

                <button
                  onClick={() => handleScanSingleAccount(acc.id, acc.pageName)}
                  disabled={scanningId === acc.id || isScanning}
                  title="Verify Live on Facebook"
                  className="px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground font-semibold text-[11px] transition flex items-center space-x-1 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${scanningId === acc.id ? "animate-spin text-blue-500" : ""}`} />
                  <span>Scan Live</span>
                </button>
              </div>
            </div>

            {/* Risk Gauge Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Activity className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span>Ban Risk & Activity Exposure Index (Lower is Safer)</span>
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
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(acc.riskScore, 100)}%` }}
                />
              </div>
            </div>

            {/* Health Indicators Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
              <div className="p-3 border border-border rounded-lg bg-card shadow-xs">
                <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">
                  Post & Action Frequency
                </span>
                <span className="text-foreground font-semibold mt-1 block leading-snug">
                  {acc.postFrequency}
                </span>
              </div>
              <div className="p-3 border border-border rounded-lg bg-card shadow-xs">
                <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">
                  Bot / API Call Rate
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
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
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
