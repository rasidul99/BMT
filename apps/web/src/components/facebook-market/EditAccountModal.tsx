"use client"

import React, { useState, useEffect } from "react"
import { FacebookAccountItem } from "../../hooks/useFacebookAccounts"
import {
  ShieldCheck,
  Server,
  KeyRound,
  User,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Wifi,
  Sparkles,
} from "lucide-react"

interface EditAccountModalProps {
  isOpen: boolean
  onClose: () => void
  account: FacebookAccountItem | null
  onUpdate: (accountId: string, updates: Partial<FacebookAccountItem>) => void
}

export function EditAccountModal({
  isOpen,
  onClose,
  account,
  onUpdate,
}: EditAccountModalProps) {
  const [name, setName] = useState("")
  const [uid, setUid] = useState("")
  const [authType, setAuthType] = useState<"Access Token" | "Cookie Session" | "OAuth 2.0">("Cookie Session")
  const [tokenOrCookie, setTokenOrCookie] = useState("")
  const [showSensitive, setShowSensitive] = useState(false)
  const [proxyIp, setProxyIp] = useState("103.145.23.21")
  const [proxyPort, setProxyPort] = useState(8080)
  const [proxyUser, setProxyUser] = useState("")
  const [proxyPass, setProxyPass] = useState("")
  const [proxyProtocol, setProxyProtocol] = useState<"http" | "socks5">("http")
  const [dailyLimit, setDailyLimit] = useState(20)
  const [status, setStatus] = useState<"Active" | "Warming Up" | "Checkpoint">("Active")
  const [copiedCookie, setCopiedCookie] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (account) {
      setName(account.name || "")
      setUid(account.uid || "")
      setAuthType(account.authType || "Cookie Session")
      setTokenOrCookie(account.tokenOrCookie || "")
      setProxyIp(account.proxy?.ip || "103.145.23.21")
      setProxyPort(account.proxy?.port || 8080)
      setProxyUser(account.proxy?.username || "")
      setProxyPass(account.proxy?.password || "")
      setProxyProtocol(account.proxy?.protocol || "http")
      setDailyLimit(account.dailyLimit || 20)
      setStatus(
        account.status === "Active" || account.status === "Warming Up" || account.status === "Checkpoint"
          ? account.status
          : "Active"
      )
      setSaveSuccess(false)
    }
  }, [account, isOpen])

  if (!isOpen || !account) return null

  // Analyze cookie status
  const isRealCookie =
    tokenOrCookie.includes("c_user=") && tokenOrCookie.includes("xs=")
  const isToken = tokenOrCookie.startsWith("EAAG")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !uid.trim()) {
      alert("Account Name and UID are required.")
      return
    }

    onUpdate(account.id, {
      name: name.trim(),
      uid: uid.trim(),
      authType,
      tokenOrCookie: tokenOrCookie.trim(),
      dailyLimit: Number(dailyLimit) || 20,
      status,
      proxy: {
        ...account.proxy,
        ip: proxyIp.trim() || "103.145.23.21",
        port: Number(proxyPort) || 8080,
        username: proxyUser.trim() || undefined,
        password: proxyPass.trim() || undefined,
        protocol: proxyProtocol,
      },
    })

    setSaveSuccess(true)
    setTimeout(() => {
      setSaveSuccess(false)
      onClose()
    }, 1200)
  }

  const handleCopyCookie = () => {
    if (!tokenOrCookie) return
    navigator.clipboard.writeText(tokenOrCookie).then(() => {
      setCopiedCookie(true)
      setTimeout(() => setCopiedCookie(false), 2000)
    })
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 bg-blue-600/10 text-blue-600 rounded-lg">
              <KeyRound className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-base text-foreground">
                Edit Account & Cookie Credentials
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Manage login session, tokens, and proxy for: <b>{account.name}</b>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground font-bold p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success toast */}
        {saveSuccess && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>অ্যাকাউন্ট এবং কুকি ক্রেডেনশিয়াল সফলভাবে আপডেট হয়েছে!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Identity info card */}
          <div className="p-3 bg-muted/30 border border-border/80 rounded-xl flex items-center space-x-3">
            <img
              src={account.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(account.name)}&background=2563eb&color=fff`}
              alt={account.name}
              className="w-11 h-11 rounded-full object-cover border border-border shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-foreground text-xs truncate">{account.name}</div>
              <div className="text-[11px] font-mono text-muted-foreground">UID: {account.uid}</div>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {account.accountType}
            </span>
          </div>

          {/* Authentication Token / Cookie section */}
          <div className="space-y-2.5 bg-muted/20 p-3.5 rounded-xl border border-border/70">
            <div className="flex items-center justify-between">
              <div className="font-bold text-[11px] text-foreground flex items-center space-x-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                <span>Facebook Authentication (Cookie / Token)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setShowSensitive(!showSensitive)}
                  className="p-1 text-muted-foreground hover:text-foreground text-[10px] font-semibold flex items-center space-x-1"
                  title={showSensitive ? "Hide Cookie" : "Show Cookie"}
                >
                  {showSensitive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showSensitive ? "Hide" : "Show"}</span>
                </button>
                {tokenOrCookie && (
                  <button
                    type="button"
                    onClick={handleCopyCookie}
                    className="p-1 text-muted-foreground hover:text-foreground text-[10px] font-semibold flex items-center space-x-1"
                    title="Copy Cookie"
                  >
                    {copiedCookie ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCookie ? "Copied" : "Copy"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Cookie Status Badge */}
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Cookie Status:</span>
              {isRealCookie ? (
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Real Cookie Active (c_user & xs verified)</span>
                </span>
              ) : isToken ? (
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Meta Access Token Verified</span>
                </span>
              ) : tokenOrCookie.length > 20 ? (
                <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center space-x-1 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/30">
                  <Sparkles className="w-3 h-3" />
                  <span>Cookie String Present</span>
                </span>
              ) : (
                <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center space-x-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                  <AlertCircle className="w-3 h-3" />
                  <span>Demo / Mock Session</span>
                </span>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center justify-between mb-1">
                <span>Cookie String / Access Token</span>
                <span className="text-[9px] text-muted-foreground lowercase">paste new cookie below</span>
              </label>
              <textarea
                rows={4}
                value={tokenOrCookie}
                onChange={(e) => setTokenOrCookie(e.target.value)}
                placeholder="c_user=61560588090925; xs=42%3Abmt_token_demo..."
                className={`w-full p-2.5 border rounded-lg bg-background font-mono text-[11px] focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                  !showSensitive ? "filter blur-xs hover:blur-none transition-all" : ""
                }`}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                💡 Chrome-এ <b>Cookie-Editor</b> এক্সটেনশন দিয়ে Export &gt; Header String কপি করে এখানে সরাসরি পেস্ট করুন।
              </p>
            </div>
          </div>

          {/* Account Profile Details */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Account Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg bg-background text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Facebook UID</label>
              <input
                type="text"
                required
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg bg-background text-xs font-mono font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Status & Daily Limit */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full mt-1 p-2 border rounded-lg bg-background text-xs font-medium"
              >
                <option value="Active">Active (Ready to Post)</option>
                <option value="Warming Up">Warming Up</option>
                <option value="Checkpoint">Checkpoint / Pending</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Daily Share Limit</label>
              <input
                type="number"
                min={1}
                max={50}
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Number(e.target.value))}
                className="w-full mt-1 p-2 border rounded-lg bg-background text-xs font-medium"
              />
            </div>
          </div>

          {/* Proxy Configuration */}
          <div className="space-y-2 bg-muted/20 p-3 rounded-xl border border-border/70">
            <div className="font-bold text-[11px] text-foreground flex items-center space-x-1.5">
              <Server className="w-3.5 h-3.5 text-blue-500" />
              <span>Dedicated Proxy IP</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-[9px] font-bold text-muted-foreground uppercase">Proxy IP</label>
                <input
                  type="text"
                  value={proxyIp}
                  onChange={(e) => setProxyIp(e.target.value)}
                  className="w-full mt-0.5 p-1.5 border rounded-lg bg-background text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase">Port</label>
                <input
                  type="number"
                  value={proxyPort}
                  onChange={(e) => setProxyPort(Number(e.target.value))}
                  className="w-full mt-0.5 p-1.5 border rounded-lg bg-background text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center space-x-1.5 transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Changes (সংরক্ষণ করুন)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
