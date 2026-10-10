"use client"

import React, { useState, useRef } from "react"
import { FacebookAccountItem } from "../../hooks/useFacebookAccounts"
import { ShieldCheck, Server, KeyRound, User, Tag, X, Camera, Upload, RefreshCw, Link as LinkIcon, CheckCircle2, AlertCircle } from "lucide-react"

interface AddAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (account: Omit<FacebookAccountItem, "id" | "createdAt" | "dailyShareCount">) => void
  currentCount: number
}

export function AddAccountModal({ isOpen, onClose, onAdd, currentCount }: AddAccountModalProps) {
  const [name, setName] = useState("")
  const [uid, setUid] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [previewError, setPreviewError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [accountType, setAccountType] = useState<"Personal Profile" | "Page Admin" | "BM Ad Account">("Personal Profile")
  const [authType, setAuthType] = useState<"Access Token" | "Cookie Session" | "OAuth 2.0">("Cookie Session")
  const [tokenOrCookie, setTokenOrCookie] = useState("")
  const [proxyIp, setProxyIp] = useState("103.145.23.21")
  const [proxyPort, setProxyPort] = useState(8080)
  const [proxyUser, setProxyUser] = useState("")
  const [proxyPass, setProxyPass] = useState("")
  const [proxyProtocol, setProxyProtocol] = useState<"http" | "socks5">("http")
  const [dailyLimit, setDailyLimit] = useState(20)
  const [tagInput, setTagInput] = useState("Marketplace, Active")
  const [status, setStatus] = useState<"Active" | "Warming Up" | "Checkpoint">("Active")

  if (!isOpen) return null

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert("Please select an image smaller than 2MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setAvatarUrl(event.target.result)
        setPreviewError(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleFetchFacebookPhoto = () => {
    if (!uid.trim()) {
      alert("Please enter Facebook UID first.")
      return
    }
    setAvatarUrl(`https://graph.facebook.com/${uid.trim()}/picture?type=large`)
    setPreviewError(false)
  }

  const handleCookieInput = (val: string) => {
    // 1. Check if JSON from Cookie-Editor
    const trimmed = val.trim()
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          const cUserObj = parsed.find((c: any) => c.name === "c_user")
          const xsObj = parsed.find((c: any) => c.name === "xs")
          if (cUserObj && xsObj) {
            const formatted = `c_user=${cUserObj.value}; xs=${xsObj.value}`
            setTokenOrCookie(formatted)
            if (!uid || uid.includes("@")) {
              setUid(cUserObj.value)
            }
            if (!name) {
              setName("Main Facebook Profile")
            }
            return
          }
        }
      } catch {}
    }

    setTokenOrCookie(val)

    // 2. Check if key=value cookie string contains c_user
    const cUserMatch = val.match(/c_user=([0-9]+)/)
    if (cUserMatch && cUserMatch[1]) {
      if (!uid || uid.includes("@")) {
        setUid(cUserMatch[1])
      }
      if (!name) {
        setName("Main Facebook Profile")
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    let finalUid = uid.trim()
    let finalCookie = tokenOrCookie.trim()

    // Try extracting c_user from cookie if uid is missing or an email
    if (finalCookie) {
      const cUserMatch = finalCookie.match(/c_user=([0-9]+)/)
      if (cUserMatch && cUserMatch[1]) {
        if (!finalUid || finalUid.includes("@")) {
          finalUid = cUserMatch[1]
        }
      }
    }

    if (!finalUid) {
      alert("Please provide Facebook UID or paste your Cookie Session.")
      return
    }

    const finalName = name.trim() || (uid.includes("@") ? uid.split("@")[0] : `Facebook User (${finalUid})`)

    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

    const fallbackAvatar = finalUid && /^\d+$/.test(finalUid)
      ? `https://graph.facebook.com/${finalUid}/picture?type=large`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(finalName)}&background=2563eb&color=fff&bold=true`

    onAdd({
      name: finalName,
      uid: finalUid,
      avatarUrl: avatarUrl.trim() || fallbackAvatar,
      accountType,
      authType,
      tokenOrCookie: finalCookie || "c_user=" + finalUid,
      proxy: {
        ip: proxyIp.trim() || "103.145.23.21",
        port: Number(proxyPort) || 8080,
        username: proxyUser.trim() || undefined,
        password: proxyPass.trim() || undefined,
        protocol: proxyProtocol,
        status: "Active",
        latencyMs: Math.floor(65 + Math.random() * 40),
      },
      status,
      dailyLimit: Number(dailyLimit) || 20,
      assignedGroups: [],
      tags: tags.length > 0 ? tags : ["Direct Added"],
      lastActive: "Just added",
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-blue-600/10 text-blue-600 rounded-lg">
              <User className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-base text-foreground">Connect Facebook Account ({currentCount + 1}/100)</h3>
              <p className="text-[11px] text-muted-foreground">Add personal ID or page admin with isolated proxy</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground font-bold p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Account Details */}
          <div className="space-y-3 bg-muted/30 p-3.5 rounded-xl border border-border/60">
            <div className="font-bold text-[11px] text-foreground flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>Facebook Profile Identity</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Account Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rasidul Islam (Main ID)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-lg bg-background text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center justify-between">
                  <span>Facebook UID / Username</span>
                  <span className="text-[9px] text-blue-500 font-normal lowercase">number or profile username</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 61560588090925 or rasidulislamsajib1"
                  value={uid}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/^(https?:\/\/)?(www\.)?facebook\.com\//i, "").replace(/\/$/, "")
                    setUid(cleaned)
                  }}
                  className="w-full mt-1 p-2 border rounded-lg bg-background text-xs font-mono font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Profile Picture Option */}
            <div className="p-2.5 bg-background border border-border/70 rounded-xl space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Camera className="w-3.5 h-3.5 text-blue-500" />
                  <span>Profile Photo / Avatar (ছবি)</span>
                </span>
                <span className="text-[9px] text-muted-foreground lowercase">optional</span>
              </label>

              <div className="flex items-center space-x-3">
                <div className="relative shrink-0">
                  <img
                    src={
                      avatarUrl.trim()
                        ? (previewError
                            ? `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "FB")}&background=2563eb&color=fff&bold=true`
                            : avatarUrl)
                        : uid.trim() && /^\d+$/.test(uid.trim())
                        ? `https://graph.facebook.com/${uid.trim()}/picture?type=large`
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "FB")}&background=2563eb&color=fff&bold=true`
                    }
                    alt="Avatar preview"
                    onError={() => setPreviewError(true)}
                    className="w-12 h-12 rounded-full object-cover border-2 border-border shadow-xs bg-muted"
                  />
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 bg-muted/80 hover:bg-muted text-foreground border border-border rounded-md text-[11px] font-semibold flex items-center space-x-1 transition"
                    >
                      <Upload className="w-3 h-3 text-blue-500" />
                      <span>Upload from PC</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />

                    <button
                      type="button"
                      onClick={handleFetchFacebookPhoto}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-md text-[11px] font-semibold flex items-center space-x-1 transition"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Fetch FB Pic</span>
                    </button>
                  </div>

                  <input
                    type="url"
                    placeholder="Or paste image URL (https://...)"
                    value={avatarUrl}
                    onChange={(e) => {
                      setAvatarUrl(e.target.value)
                      setPreviewError(false)
                    }}
                    className="w-full px-2 py-1 border rounded-md bg-card text-[11px] font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Account Type</label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as any)}
                  className="w-full mt-1 p-2 border rounded-lg bg-background text-xs font-medium focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Personal Profile">Personal Profile (Marketplace)</option>
                  <option value="Page Admin">Page Admin Account</option>
                  <option value="BM Ad Account">BM Ad Account</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Initial Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full mt-1 p-2 border rounded-lg bg-background text-xs font-medium focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Active">Active (Ready to Post)</option>
                  <option value="Warming Up">Warming Up (Light Action)</option>
                  <option value="Checkpoint">Checkpoint / Pending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Authentication Credentials */}
          <div className="space-y-3 bg-muted/30 p-3.5 rounded-xl border border-border/60">
            <div className="font-bold text-[11px] text-foreground flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                <span>Authentication Token / Cookie</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-normal">Use Cookie-Editor extension or Meta Developer Token</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Auth Method</label>
                <select
                  value={authType}
                  onChange={(e) => setAuthType(e.target.value as any)}
                  className="w-full mt-1 p-2 border rounded-lg bg-background text-xs font-medium"
                >
                  <option value="Cookie Session">Cookie Session (c_user + xs)</option>
                  <option value="Access Token">EAAG Access Token</option>
                  <option value="OAuth 2.0">OAuth 2.0 Official</option>
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

            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center justify-between">
                <span>{authType === "Cookie Session" ? "Cookie String (c_user=...; xs=...)" : "Access Token"}</span>
                {authType === "Cookie Session" && (
                  <span className="text-[9px] text-blue-500 font-semibold">Supports Cookie-Editor JSON & String</span>
                )}
              </label>
              <textarea
                rows={2}
                placeholder={authType === "Cookie Session" ? "c_user=1000...; xs=42%3A... (or paste exported JSON from Cookie-Editor)" : "EAAG..."}
                value={tokenOrCookie}
                onChange={(e) => handleCookieInput(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg bg-background font-mono text-[11px] focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              {authType === "Cookie Session" && tokenOrCookie.trim().length > 0 && (
                <div className="mt-1">
                  {tokenOrCookie.includes("c_user=") && tokenOrCookie.includes("xs=") ? (
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Cookie verified (c_user + xs detected)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Make sure both &apos;c_user=&apos; and &apos;xs=&apos; are present in the cookie string.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Dedicated Proxy Configuration */}
          <div className="space-y-3 bg-muted/30 p-3.5 rounded-xl border border-border/60">
            <div className="font-bold text-[11px] text-foreground flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-500" />
                <span>Dedicated Proxy (Anti-Ban Isolation)</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-normal">Prevents Facebook account linkage bans</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Proxy IP</label>
                <input
                  type="text"
                  placeholder="103.145.23.21"
                  value={proxyIp}
                  onChange={(e) => setProxyIp(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-lg bg-background font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Port</label>
                <input
                  type="number"
                  placeholder="8080"
                  value={proxyPort}
                  onChange={(e) => setProxyPort(Number(e.target.value))}
                  className="w-full mt-1 p-2 border rounded-lg bg-background font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Protocol</label>
                <select
                  value={proxyProtocol}
                  onChange={(e) => setProxyProtocol(e.target.value as any)}
                  className="w-full mt-1 p-2 border rounded-lg bg-background text-xs"
                >
                  <option value="http">HTTP</option>
                  <option value="socks5">SOCKS5</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Proxy User (Optional)</label>
                <input
                  type="text"
                  placeholder="user"
                  value={proxyUser}
                  onChange={(e) => setProxyUser(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-lg bg-background text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Proxy Pass (Optional)</label>
                <input
                  type="password"
                  placeholder="pass"
                  value={proxyPass}
                  onChange={(e) => setProxyPass(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-lg bg-background text-xs"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center space-x-1">
              <Tag className="w-3 h-3 text-purple-500" />
              <span>Category / Campaign Tags (comma separated)</span>
            </label>
            <input
              type="text"
              placeholder="Dhaka Marketplace, Panjabi Deals, Tech Poster"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="w-full mt-1 p-2 border rounded-lg bg-background text-xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-xl font-bold hover:bg-muted transition text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-xs transition text-xs"
            >
              Connect Facebook Account
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
