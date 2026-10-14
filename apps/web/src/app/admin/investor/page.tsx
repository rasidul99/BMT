"use client"

import React from "react"
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Lock,
  Download,
  Calendar,
  ShieldCheck,
  Building,
  CheckCircle2,
  Printer,
} from "lucide-react"

export default function InvestorAdminPage() {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400 mb-2">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Investor Relations & Growth Performance</span>
            <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-300 flex items-center gap-1">
              <Lock className="h-3 w-3" />
              <span>Read-Only Executive Access</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Investor Performance Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            কোম্পানির ইনভেস্টমেন্ট স্ট্যাটাস, বার্ষিক গ্রোথ, প্রফিট/ROI এবং শেয়ারহোল্ডার রিপোর্ট।
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            <Printer className="h-4 w-4 text-purple-400" />
            <span>ইনভেস্টর সামারি PDF ডাউনলোড</span>
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-4 flex items-center justify-between text-xs text-purple-200">
        <span className="flex items-center gap-2 font-medium">
          <ShieldCheck className="h-4 w-4 text-purple-400" />
          <span>নিরাপত্তা নীতি: ইনভেস্টরদের জন্য সিস্টেম কোর সেটিংস রিড-অনলি এবং আর্থিক অডিট সম্পূর্ণ সুরক্ষিত।</span>
        </span>
        <span className="font-mono text-[11px] text-purple-300">FY 2026 Q3 Audited</span>
      </div>

      {/* Key Investor Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/30 to-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">বর্তমান কোম্পানি মূল্যায়ন (Valuation)</span>
            <Building className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white">$1,850,000</div>
          <div className="mt-1 text-xs text-purple-400">Based on 6x ARR Multiple</div>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 to-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">বার্ষিক রিটার্ন অন ইনভেস্টমেন্ট (ROI)</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400">+38.4%</div>
          <div className="mt-1 text-xs text-slate-400">Year-over-Year Capital Gain</div>
        </div>

        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/30 to-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">অ্যানুয়াল রান রেট (ARR)</span>
            <DollarSign className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white">$298,200</div>
          <div className="mt-1 text-xs text-blue-400">মাসিক রেভিনিউ: $24,850</div>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/30 to-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">ইকুইটি মাল্টিপল (MOIC)</span>
            <PieChart className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300">3.2x</div>
          <div className="mt-1 text-xs text-amber-400">Initial Seed Capital Growth</div>
        </div>
      </div>

      {/* Unit Economics & Dividend Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unit Economics */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur space-y-4">
          <h3 className="text-base font-semibold text-white">SaaS Unit Economics ও গ্রোথ এফিসিয়েন্সি</h3>
          <p className="text-xs text-slate-400">কোম্পানির কাস্টমার রিটেনশন এবং একুইজিশন এফিসিয়েন্সি</p>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3.5">
              <div>
                <div className="text-xs font-medium text-slate-200">LTV : CAC Ratio</div>
                <div className="text-[11px] text-slate-400">Customer Lifetime Value vs Acquisition Cost</div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-emerald-400">15.0x</span>
                <span className="block text-[10px] text-slate-400">(Healthy Benchmark: &gt; 3.0x)</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3.5">
              <div>
                <div className="text-xs font-medium text-slate-200">গ্রাহক রিটেনশন রেট (Monthly Retention)</div>
                <div className="text-[11px] text-slate-400">পেইড এজেন্সি ও প্রো গ্রাহকদের স্থায়িত্ব</div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-white">88.2%</span>
                <span className="block text-[10px] text-emerald-400">Low Churn</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3.5">
              <div>
                <div className="text-xs font-medium text-slate-200">মাসিক গড় রেভিনিউ প্রতি ইউজার (ARPU)</div>
                <div className="text-[11px] text-slate-400">এভারেজ সাবস্ক্রিপশন প্রাইসিং</div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-white">$78.14</span>
                <span className="block text-[10px] text-slate-400">Blended Plan Value</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dividend Distribution Schedule */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur space-y-4">
          <h3 className="text-base font-semibold text-white">ত্রৈমাসিক ডিভিডেন্ড ও মুনাফা বণ্টন</h3>
          <p className="text-xs text-slate-400">শেয়ারহোল্ডারদের মুনাফা প্রদানের ইতিহাস ও পরবর্তী শিডিউল</p>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3.5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <div>
                  <div className="text-xs font-semibold text-white">Q1 2026 Dividend Distribution</div>
                  <div className="text-[11px] text-slate-400">সম্পন্ন হয়েছে: ৩১ মার্চ ২০২৬</div>
                </div>
              </div>
              <div className="text-right font-mono font-bold text-emerald-400">$12,500 Paid</div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3.5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <div>
                  <div className="text-xs font-semibold text-white">Q2 2026 Dividend Distribution</div>
                  <div className="text-[11px] text-slate-400">সম্পন্ন হয়েছে: ৩০ জুন ২০২৬</div>
                </div>
              </div>
              <div className="text-right font-mono font-bold text-emerald-400">$16,800 Paid</div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-purple-500/30 bg-purple-950/20 p-3.5">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-purple-400" />
                <div>
                  <div className="text-xs font-semibold text-white">Q3 2026 Projected Distribution</div>
                  <div className="text-[11px] text-purple-300">প্রত্যাশিত তারিখ: ১৫ নভেম্বর ২০২৬</div>
                </div>
              </div>
              <div className="text-right font-mono font-bold text-purple-300">$22,000 Est.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
