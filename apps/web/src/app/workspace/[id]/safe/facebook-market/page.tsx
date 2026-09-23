"use client"

import React, { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Users,
  ShieldCheck,
  Server,
  Layers,
  Search,
  Plus,
  Send,
  RefreshCw,
  Trash2,
  Tag,
  ExternalLink,
  Wifi,
  WifiOff,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Settings,
} from "lucide-react"
import { useFacebookAccounts, FacebookAccountItem } from "../../../../../hooks/useFacebookAccounts"
import { AddAccountModal } from "../../../../../components/facebook-market/AddAccountModal"
import { BulkImportModal } from "../../../../../components/facebook-market/BulkImportModal"
import { AssignGroupsModal } from "../../../../../components/facebook-market/AssignGroupsModal"
import { GroupSharingModal } from "../../../../../components/facebook-market/GroupSharingModal"

export default function FacebookMarketPage() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = (params?.id as string) || "workspace-1"

  const {
    accounts,
    isLoaded,
    metrics,
    addAccount,
    updateAccount,
    deleteAccount,
    bulkImportAccounts,
    testProxy,
    assignGroupToAccount,
    removeAssignedGroup,
    recordShare,
  } = useFacebookAccounts()

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showSharingModal, setShowSharingModal] = useState(false)
  const [selectedAccountForGroups, setSelectedAccountForGroups] = useState<FacebookAccountItem | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Warming Up" | "Checkpoint">("All")
  const [testingProxyId, setTestingProxyId] = useState<string | null>(null)

  // Filtered accounts list
  const filteredAccounts = accounts.filter((acc) => {
    if (statusFilter !== "All" && acc.status !== statusFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = acc.name.toLowerCase().includes(q)
      const matchUid = acc.uid.toLowerCase().includes(q)
      const matchProxy = acc.proxy.ip.toLowerCase().includes(q)
      const matchTag = acc.tags.some((t) => t.toLowerCase().includes(q))
      return matchName || matchUid || matchProxy || matchTag
    }
    return true
  })

  const handleTestProxy = async (accId: string) => {
    setTestingProxyId(accId)
    await testProxy(accId)
    setTestingProxyId(null)
  }

  const handleDelete = (acc: FacebookAccountItem) => {
    if (confirm(`Are you sure you want to disconnect & remove '${acc.name}'?`)) {
      deleteAccount(acc.id)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                Facebook Market (100 Accounts Engine)
              </h1>
              <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-blue-500/20">
                MODULE 8
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              মাল্টি-অ্যাকাউন্ট ফেসবুক মার্কেটিং হাব: ১০০টি ফেসবুক আইডি ও ডেডিকেটেড প্রক্সি ম্যানেজমেন্ট এবং অ্যান্টি-ব্যান গ্রুপ শেয়ারিং
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-3.5 py-2 border rounded-xl hover:bg-muted font-bold text-xs transition flex items-center space-x-1.5 shadow-sm"
          >
            <Layers className="w-3.5 h-3.5 text-purple-500" />
            <span>📥 Bulk Import (100 IDs)</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Connect Account</span>
          </button>

          <button
            onClick={() => setShowSharingModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>🚀 Launch Group Sharing</span>
          </button>
        </div>
      </div>

      {/* 2. Executive 4-Metric Live Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Connected Accounts */}
        <div className="border bg-card p-4 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Connected Accounts</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-foreground">{metrics.total}</span>
            <span className="text-xs font-bold text-muted-foreground">/ {metrics.maxCapacity} Max</span>
          </div>
          {/* Progress gauge */}
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${(metrics.total / metrics.maxCapacity) * 100}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Live Proxies */}
        <div className="border bg-card p-4 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Active Proxies</span>
            <Server className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {metrics.activeProxies}
            </span>
            <span className="text-xs font-bold text-muted-foreground">/ {metrics.total} Live</span>
          </div>
          <p className="text-[10px] text-muted-foreground flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Dedicated IP Isolation Active</span>
          </p>
        </div>

        {/* Metric 3: Account Health */}
        <div className="border bg-card p-4 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Health Status</span>
            <ShieldCheck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-center space-x-3 text-xs font-bold">
            <span className="text-emerald-600">{metrics.activeCount} Active</span>
            <span className="text-amber-500">{metrics.warmingCount} Warming</span>
            {metrics.checkpointCount > 0 && (
              <span className="text-rose-500">{metrics.checkpointCount} Checkpoint</span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Safety Score: <b>{Math.round((metrics.activeCount / Math.max(1, metrics.total)) * 100)}%</b>
          </p>
        </div>

        {/* Metric 4: Cumulative Group Reach */}
        <div className="border bg-card p-4 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Total Group Reach</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {metrics.totalGroupsReach >= 1000000
              ? (metrics.totalGroupsReach / 1000000).toFixed(1) + "M"
              : (metrics.totalGroupsReach / 1000).toFixed(0) + "K"}{" "}
            <span className="text-xs font-bold text-muted-foreground font-sans">Audience</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Across all assigned marketing groups</p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="border bg-card p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search account name, UID, Proxy IP, or Tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-xl bg-background text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-1.5 border p-1 rounded-xl bg-muted/30">
          {(["All", "Active", "Warming Up", "Checkpoint"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-bold transition text-[11px] ${
                statusFilter === st
                  ? "bg-card text-foreground shadow-sm font-extrabold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {st} {st === "All" && `(${accounts.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Accounts Table */}
      <div className="border bg-card rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b uppercase text-[10px] font-extrabold text-muted-foreground">
              <tr>
                <th className="p-3.5">Account & UID</th>
                <th className="p-3.5">Dedicated Proxy & Ping</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Assigned Groups</th>
                <th className="p-3.5">Daily Shares</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No accounts found matching your filter. Click <b>Connect Account</b> to add one.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-muted/40 transition">
                    {/* Account Identity */}
                    <td className="p-3.5">
                      <div className="flex items-center space-x-3">
                        <img
                          src={acc.avatarUrl}
                          alt={acc.name}
                          className="w-9 h-9 rounded-full object-cover border border-border shadow-xs shrink-0"
                        />
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-foreground text-xs">{acc.name}</div>
                          <div className="font-mono text-[10px] text-muted-foreground flex items-center space-x-1.5">
                            <span>UID: {acc.uid}</span>
                            <span className="text-[10px] bg-muted px-1.5 py-0.2 rounded font-sans font-semibold">
                              {acc.accountType}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Dedicated Proxy */}
                    <td className="p-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                          {acc.proxy.status === "Active" ? (
                            <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <WifiOff className="w-3.5 h-3.5 text-rose-500" />
                          )}
                          <span className="font-bold text-foreground">
                            {acc.proxy.ip}:{acc.proxy.port}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-[10px]">
                          <span className="text-muted-foreground uppercase">{acc.proxy.protocol}</span>
                          <span className="text-muted-foreground">&bull;</span>
                          <span
                            className={
                              acc.proxy.status === "Active"
                                ? "text-emerald-600 font-bold"
                                : "text-rose-500 font-bold"
                            }
                          >
                            {acc.proxy.latencyMs > 0 ? `${acc.proxy.latencyMs}ms` : "Offline"}
                          </span>
                          <button
                            onClick={() => handleTestProxy(acc.id)}
                            disabled={testingProxyId === acc.id}
                            className="text-blue-600 hover:underline font-semibold ml-1"
                            title="Ping Proxy Test"
                          >
                            {testingProxyId === acc.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin inline" />
                            ) : (
                              "Test"
                            )}
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border inline-flex items-center space-x-1 ${
                          acc.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : acc.status === "Warming Up"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            acc.status === "Active"
                              ? "bg-emerald-500"
                              : acc.status === "Warming Up"
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                        />
                        <span>{acc.status}</span>
                      </span>
                    </td>

                    {/* Assigned Groups */}
                    <td className="p-3.5">
                      <button
                        onClick={() => setSelectedAccountForGroups(acc)}
                        className="px-2.5 py-1 bg-muted hover:bg-muted/80 rounded-lg border text-[11px] font-bold text-foreground flex items-center space-x-1.5 transition"
                      >
                        <Users className="w-3 h-3 text-blue-500" />
                        <span>{acc.assignedGroups.length} Groups Assigned</span>
                      </button>
                    </td>

                    {/* Daily Shares Progress */}
                    <td className="p-3.5">
                      <div className="space-y-1 w-28">
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                          <span>{acc.dailyShareCount} shares</span>
                          <span>max {acc.dailyLimit}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              acc.dailyShareCount >= acc.dailyLimit
                                ? "bg-rose-500"
                                : "bg-emerald-500"
                            }`}
                            style={{
                              width: `${Math.min(100, (acc.dailyShareCount / acc.dailyLimit) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setSelectedAccountForGroups(acc)}
                          className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition"
                          title="Assign Groups"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(acc)}
                          className="p-1.5 hover:bg-rose-500/10 rounded-lg text-rose-500 hover:text-rose-700 transition"
                          title="Disconnect Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddAccountModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addAccount}
        currentCount={accounts.length}
      />

      <BulkImportModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onImport={bulkImportAccounts}
        currentCount={accounts.length}
      />

      <AssignGroupsModal
        isOpen={selectedAccountForGroups !== null}
        onClose={() => setSelectedAccountForGroups(null)}
        account={selectedAccountForGroups}
        onAssignGroup={assignGroupToAccount}
        onRemoveGroup={removeAssignedGroup}
      />

      <GroupSharingModal
        isOpen={showSharingModal}
        onClose={() => setShowSharingModal(false)}
        accounts={accounts}
        onRecordShare={recordShare}
      />
    </div>
  )
}
