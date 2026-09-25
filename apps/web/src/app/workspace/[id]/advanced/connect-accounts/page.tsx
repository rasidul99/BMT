"use client"

import React, { useState } from "react"
import {
  Link2,
  Plus,
  Users,
  Globe,
  User,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  X,
  Sparkles,
  Code,
  KeyRound,
  ExternalLink,
} from "lucide-react"

export default function AdvancedConnectAccountsPage() {
  const [connectedCount, setConnectedCount] = useState(3)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [activeTab, setActiveTab] = useState<"OAuth" | "Manual">("OAuth")
  const [manualToken, setManualToken] = useState("")
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const [accounts, setAccounts] = useState([
    {
      id: "acc-1",
      name: "CARE HUB BD",
      type: "Facebook Page",
      status: "Active",
      permissions: "pages_manage_posts, pages_read_engagement",
      connectedVia: "Facebook OAuth 2.0",
    },
    {
      id: "acc-2",
      name: "Julkar Nayeem (Primary ID)",
      type: "Facebook ID",
      status: "Active",
      permissions: "Full Automation Scope",
      connectedVia: "Facebook OAuth 2.0",
    },
    {
      id: "acc-3",
      name: "Corporate Brand Page",
      type: "Facebook Page",
      status: "Active",
      permissions: "pages_manage_posts",
      connectedVia: "Manual Developer Token",
    },
  ])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Simulate 1-Click Facebook OAuth Login
  const handleFacebookOAuthLogin = () => {
    const newPage = {
      id: `acc-${Date.now()}`,
      name: "New Connected Page (Via 1-Click Facebook)",
      type: "Facebook Page",
      status: "Active",
      permissions: "pages_manage_posts, pages_read_engagement",
      connectedVia: "1-Click Facebook OAuth",
    }
    setAccounts([newPage, ...accounts])
    setConnectedCount((prev) => prev + 1)
    setShowConnectModal(false)
    showToast("Facebook OAuth login complete! New Connected Page linked securely.")
  }

  const handleSaveManualToken = () => {
    if (!manualToken.trim()) return
    const newPage = {
      id: `acc-${Date.now()}`,
      name: "Custom Developer Token Page",
      type: "Facebook Page",
      status: "Active",
      permissions: "pages_manage_posts, pages_messaging",
      connectedVia: "Manual Developer Token",
    }
    setAccounts([newPage, ...accounts])
    setConnectedCount((prev) => prev + 1)
    setManualToken("")
    setShowConnectModal(false)
    showToast("Developer Page Access Token validated and saved!")
  }

  const handleDisconnect = (id: string, name: string) => {
    setAccounts(accounts.filter((a) => a.id !== id))
    setConnectedCount((prev) => prev - 1)
    showToast(`Disconnected ${name} successfully.`)
  }

  const pagesCount = accounts.filter((a) => a.type === "Facebook Page").length
  const profilesCount = accounts.filter((a) => a.type === "Facebook ID").length

  return (
    <div className="max-w-6xl space-y-6 pb-20">
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
              <Link2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Connect Facebook Accounts & Pages
            </h1>
            <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800">
              ADVANCED ENGINE
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
            Seamless 1-Click Official Facebook Login for End-Clients & Developers. Enterprise 100+ account cluster support.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <span className="text-xs bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-bold px-3 py-2 rounded-lg border border-orange-200 dark:border-orange-800">
            {connectedCount} / 100 Connected
          </span>
          <button
            onClick={() => setShowConnectModal(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition flex items-center space-x-1.5 min-h-[38px]"
          >
            <Plus className="w-4 h-4" />
            <span>Connect Facebook Page / ID</span>
          </button>
        </div>
      </div>

      {/* Executive Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Connected Cluster</span>
            <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">
              {connectedCount}
            </span>
            <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400">
              Capacity: 100
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Business Pages</span>
            <Globe className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">
              {pagesCount}
            </span>
            <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400">
              Active Sync
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Personal IDs</span>
            <User className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">
              {profilesCount}
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground">
              Automation Scope
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>OAuth Token Health</span>
            <ShieldCheck className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">
              100%
            </span>
            <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400">
              Long-Lived Tokens
            </span>
          </div>
        </div>
      </div>

      {/* Account Table */}
      <div className="border border-border bg-card rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-muted/50 border-b border-border uppercase text-[10px] font-bold text-muted-foreground">
              <tr>
                <th className="p-3.5">Account / Page Name</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Connection Method</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Permissions Granted</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {accounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-muted/40 transition">
                  <td className="p-3.5 font-bold text-sm text-foreground">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 flex items-center justify-center shrink-0">
                        {acc.type === "Facebook Page" ? (
                          <Globe className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        ) : (
                          <User className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        )}
                      </div>
                      <span className="font-semibold text-xs text-foreground">{acc.name}</span>
                    </div>
                  </td>
                  <td className="p-3.5 text-muted-foreground font-medium text-xs">{acc.type}</td>
                  <td className="p-3.5">
                    <span className="bg-muted text-muted-foreground border border-border text-[10px] font-medium px-2.5 py-1 rounded-md">
                      {acc.connectedVia}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">
                      {acc.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-muted-foreground font-mono text-[11px]">
                    <span className="bg-muted/40 px-2 py-1 rounded border border-border/60">
                      {acc.permissions}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleDisconnect(acc.id, acc.name)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-md border border-border text-muted-foreground hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition"
                      title="Disconnect Account"
                    >
                      Disconnect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <h3 className="font-bold text-base text-foreground">Connect Facebook Account or Page</h3>
              </div>
              <button
                onClick={() => setShowConnectModal(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 bg-muted/60 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab("OAuth")}
                className={`py-2 px-3 rounded-lg transition flex items-center justify-center space-x-1.5 ${
                  activeTab === "OAuth"
                    ? "bg-orange-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>1-Click Client Login</span>
              </button>
              <button
                onClick={() => setActiveTab("Manual")}
                className={`py-2 px-3 rounded-lg transition flex items-center justify-center space-x-1.5 ${
                  activeTab === "Manual"
                    ? "bg-orange-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Developer Manual Token</span>
              </button>
            </div>

            {/* TAB 1: 1-CLICK OAUTH */}
            {activeTab === "OAuth" && (
              <div className="space-y-4 text-xs">
                <div className="bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 p-4 rounded-xl space-y-2">
                  <h4 className="font-bold text-orange-900 dark:text-orange-200 text-sm">
                    Zero-Technical Client Onboarding
                  </h4>
                  <p className="text-orange-800 dark:text-orange-300 leading-relaxed text-[11px]">
                    Clients do NOT need developer accounts or tokens. Clicking below opens the official Facebook popup where the client selects their Page and grants 1-click permission.
                  </p>
                </div>

                <button
                  onClick={handleFacebookOAuthLogin}
                  className="w-full py-3 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center space-x-2 text-sm min-h-[44px]"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Continue with Facebook</span>
                </button>
              </div>
            )}

            {/* TAB 2: MANUAL TOKEN */}
            {activeTab === "Manual" && (
              <div className="space-y-4 text-xs">
                <p className="text-muted-foreground text-[11px]">
                  For agency developers or custom API integrations, paste a Page Access Token manually below:
                </p>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Meta Page Access Token (EAAG...)</label>
                  <textarea
                    rows={3}
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    className="w-full border border-border rounded-xl p-2.5 font-mono text-[11px] bg-background text-foreground focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition"
                    placeholder="EAAG..."
                  />
                </div>
                <button
                  onClick={handleSaveManualToken}
                  disabled={!manualToken.trim()}
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-xs transition min-h-[38px]"
                >
                  Save Custom Token
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
