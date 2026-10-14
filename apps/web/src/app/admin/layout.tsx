"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ShieldCheck,
  Crown,
  Users,
  TrendingUp,
  Share2,
  DollarSign,
  ArrowLeft,
  Activity,
  Layers,
} from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navItems = [
    {
      label: "Super Admin",
      href: "/admin/super",
      icon: Crown,
      badge: "Full Control",
      activeColor: "border-blue-500 text-blue-400 bg-blue-500/10",
    },
    {
      label: "Employee Admin",
      href: "/admin/employee",
      icon: Users,
      badge: "Operations",
      activeColor: "border-indigo-500 text-indigo-400 bg-indigo-500/10",
    },
    {
      label: "Investor Admin",
      href: "/admin/investor",
      icon: TrendingUp,
      badge: "Read Only",
      activeColor: "border-purple-500 text-purple-400 bg-purple-500/10",
    },
    {
      label: "Affiliate Partner",
      href: "/admin/affiliate",
      icon: Share2,
      badge: "Referral & Payout",
      activeColor: "border-amber-500 text-amber-400 bg-amber-500/10",
    },
    {
      label: "Company Finance",
      href: "/admin/finance",
      icon: DollarSign,
      badge: "Income & Expense",
      activeColor: "border-emerald-500 text-emerald-400 bg-emerald-500/10",
    },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Multi-Role Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/workspace/workspace-1/safe/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
              title="Return to Workspace"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Workspace</span>
            </Link>

            <div className="h-4 w-px bg-slate-800" />

            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 font-black text-white text-xs">
                BMT
              </span>
              <div>
                <span className="text-xs font-bold tracking-tight text-white">Platform Administration</span>
                <span className="block text-[10px] text-slate-400">PDF Page 7 Multi-Role Panels</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>System Operational</span>
            </div>
          </div>
        </div>

        {/* Role Switcher Tabs */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 overflow-x-auto no-scrollbar">
          <nav className="flex space-x-1 border-t border-slate-900 py-1.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition border whitespace-nowrap ${
                    isActive
                      ? item.activeColor
                      : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                  <span
                    className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                      isActive ? "bg-white/10" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  )
}
