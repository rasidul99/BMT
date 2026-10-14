"use client"

import React, { useState } from "react"
import {
  Share2,
  DollarSign,
  Users,
  MousePointerClick,
  Copy,
  Check,
  ArrowUpRight,
  CreditCard,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react"

export default function AffiliatePartnerPage() {
  const [copied, setCopied] = useState(false)
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [payoutSuccess, setPayoutSuccess] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState("1420")
  const [payoutMethod, setPayoutMethod] = useState("bKash")
  const [accountNumber, setAccountNumber] = useState("017XXXXXXXX")

  const referralLink = "https://bmt.agency/?ref=julkar-partner-99"

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault()
    setPayoutSuccess(true)
    setTimeout(() => {
      setShowPayoutModal(false)
      setPayoutSuccess(false)
    }, 2000)
  }

  const referralRecords = [
    {
      id: "ref-101",
      date: "2026-10-12",
      user: "Nayeem Agency Hub",
      plan: "Enterprise Agency ($1,200/yr)",
      commission: 360,
      rate: "30%",
      status: "Available for Payout",
    },
    {
      id: "ref-102",
      date: "2026-10-08",
      user: "Dhaka Dropship Club",
      plan: "Agency Pro ($99/mo)",
      commission: 29.7,
      rate: "30%",
      status: "Available for Payout",
    },
    {
      id: "ref-103",
      date: "2026-09-28",
      user: "E-Com Trends BD",
      plan: "Pro Marketer ($49/mo)",
      commission: 14.7,
      rate: "30%",
      status: "Paid",
    },
    {
      id: "ref-104",
      date: "2026-09-15",
      user: "TechBD Solutions",
      plan: "Enterprise Agency ($1,200/yr)",
      commission: 360,
      rate: "30%",
      status: "Paid",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 mb-2">
            <Share2 className="h-3.5 w-3.5" />
            <span>Partner & Affiliate Earnings Portal</span>
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300">
              Role: Affiliate Partner
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Affiliate Partner Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            আপনার রেফারেল লিংক শেয়ার করে ৩০% পর্যন্ত রিকারিং কমিশন আয় করুন এবং পে-আউট ট্র্যাক করুন।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPayoutModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2.5 text-xs font-semibold text-white hover:from-amber-500 hover:to-orange-500 transition shadow-lg shadow-amber-500/20"
          >
            <DollarSign className="h-4 w-4" />
            <span>কমিশন উত্তোলনের আবেদন</span>
          </button>
        </div>
      </div>

      {/* Referral Link Sharing Box */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900 p-5 backdrop-blur">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">আপনার ইউনিক রেফারেল লিংক</span>
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                30% Lifetime Recurring
              </span>
            </div>
            <p className="text-xs text-slate-300">
              এই লিংক দিয়ে যেকোনো ইউজার সাইন আপ করলে প্রতি মাসের সাবস্ক্রিপশন ফি থেকে আপনি পাবেন নিশ্চিত ৩০% রয়্যালটি কমিশন।
            </p>
          </div>

          <div className="flex items-center gap-2 max-w-md w-full">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-amber-200 select-all"
            />
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2 text-xs font-semibold text-white transition flex-shrink-0"
            >
              {copied ? <Check className="h-4 w-4 text-white" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? "কপি হয়েছে" : "কপি লিংক"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">উত্তোলনযোগ্য ব্যালেন্স</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400">$1,420.00</div>
          <div className="mt-1 text-xs text-emerald-400">≈ ৳১,৭৩,২৪০ BDT</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">সর্বমোট অর্জিত কমিশন</span>
            <Sparkles className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300">$4,854.20</div>
          <div className="mt-1 text-xs text-slate-400">সর্বমোট পেইড: $3,434.20</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">রেফারেল লিংক ক্লিক</span>
            <MousePointerClick className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white">3,842</div>
          <div className="mt-1 text-xs text-blue-400">কনভার্সন রেট: 1.35%</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">পেইড সক্রিয় রেফারেল</span>
            <Users className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white">52 জন</div>
          <div className="mt-1 text-xs text-purple-400">রিকারিং মাসিক আয় অব্যাহত</div>
        </div>
      </div>

      {/* Commission Ledger Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-semibold text-white">রেফারেল কমিশন ও পে-আউট হিস্ট্রি</h3>
            <p className="text-xs text-slate-400">আপনার মাধ্যমে জয়েন করা ক্লায়েন্টদের বিস্তারিত আয় তালিকা</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5">তারিখ</th>
                <th className="p-3.5">রেফার্ড ক্লায়েন্ট</th>
                <th className="p-3.5">ক্রয়কৃত প্ল্যান</th>
                <th className="p-3.5 text-center">কমিশন রেট</th>
                <th className="p-3.5 text-right">কমিশন লাভ</th>
                <th className="p-3.5 text-center">পে-আউট স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {referralRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-3.5 font-mono text-[11px] text-slate-400">{r.date}</td>
                  <td className="p-3.5 font-semibold text-white">{r.user}</td>
                  <td className="p-3.5 text-slate-300">{r.plan}</td>
                  <td className="p-3.5 text-center font-mono font-bold text-amber-300">{r.rate}</td>
                  <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                    +${r.commission.toFixed(2)}
                  </td>
                  <td className="p-3.5 text-center">
                    <span
                      className={`rounded px-2.5 py-0.5 text-[10px] font-semibold ${
                        r.status === "Paid"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Request Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-white">কমিশন উত্তোলন আবেদন</h3>
              <button onClick={() => setShowPayoutModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            {payoutSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">আবেদন সফলভাবে গ্রহণ করা হয়েছে!</h4>
                <p className="text-xs text-slate-400">২৪ ঘন্টার মধ্যে আপনার অ্যাকাউন্টে টাকা পাঠিয়ে দেওয়া হবে।</p>
              </div>
            ) : (
              <form onSubmit={handleRequestPayout} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">উত্তোলনের পরিমাণ ($ USD)</label>
                  <input
                    type="number"
                    max={1420}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    সর্বোচ্চ উত্তোলনযোগ্য ব্যালেন্স: $1,420.00
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">পেমেন্ট মেথড</label>
                  <select
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="bKash">bKash Personal / Merchant</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Bank">Bank Wire Transfer (Bangladesh)</option>
                    <option value="USDT">Crypto USDT (TRC-20)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">অ্যাকাউন্ট / ফোন নম্বর / ওয়ালেট</label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPayoutModal(false)}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500"
                  >
                    উত্তোলনের আবেদন পাঠান
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
