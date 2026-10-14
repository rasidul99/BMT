"use client"

import React, { useState } from "react"
import {
  Users,
  LifeBuoy,
  CheckCircle2,
  AlertCircle,
  Clock,
  MessageSquare,
  ShieldAlert,
  Send,
  Flag,
  RotateCw,
  Search,
} from "lucide-react"

export default function EmployeeAdminPage() {
  const [tickets, setTickets] = useState([
    {
      id: "TCK-412",
      user: "Julkar Nayeen (Agency Master)",
      subject: "গ্রুপ পোস্টার শিডিউলার ৩টি ফেসবুক গ্রুপে টাইমআউট হয়েছে",
      priority: "HIGH",
      status: "OPEN",
      time: "15 মিনিট আগে",
      category: "Bot Execution",
    },
    {
      id: "TCK-409",
      user: "Tanvir Digital Agency",
      subject: "নতুন প্রক্সি আইপি পুল কনফিগারেশন রিকোয়েস্ট",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      time: "১ ঘন্টা আগে",
      category: "Proxy & Anti-Ban",
    },
    {
      id: "TCK-405",
      user: "Kamrul E-Com Solutions",
      subject: "ইনভাইট পেজ ফ্লো এর কনভার্সন রেট রিপোর্ট সংক্রান্ত প্রশ্ন",
      priority: "LOW",
      status: "RESOLVED",
      time: "৩ ঘন্টা আগে",
      category: "Feature Inquiry",
    },
  ])

  const [activeReplyTicket, setActiveReplyTicket] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")

  const handleResolve = (id: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "RESOLVED" } : t))
    )
    setActiveReplyTicket(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 mb-2">
            <Users className="h-3.5 w-3.5" />
            <span>Daily Operations & Support</span>
            <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-300">
              Role: Employee Admin
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Employee Admin Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            ডেইলি অপারেশনাল কাজ, ইউজার সাপোর্ট টিকিট সমাধান, কন্টেন্ট মডারেশন ও বট হেলথ মনিটরিং।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 text-xs text-indigo-300">
            Shift: Active Morning Operations
          </span>
        </div>
      </div>

      {/* Operational Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">ওপেন সাপোর্ট টিকিট</span>
            <LifeBuoy className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-400">
            {tickets.filter((t) => t.status !== "RESOLVED").length} টি বাকি
          </div>
          <div className="mt-1 text-xs text-slate-400">গড় সমাধান সময়: ১৮ মিনিট</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">কন্টেন্ট মডারেশন ফ্ল্যাগ</span>
            <Flag className="h-4 w-4 text-red-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white">2 টি রিভিউতে</div>
          <div className="mt-1 text-xs text-emerald-400">স্প্যাম অটো-ফিল্টার সক্রিয়</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">প্রক্সি পুল অ্যাক্টিভ নোড</span>
            <ShieldAlert className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400">50 / 50 Active</div>
          <div className="mt-1 text-xs text-slate-400">0 টি ফেইল্ড আইপি</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">আজকের সম্পন্ন টাস্ক</span>
            <CheckCircle2 className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white">46 টি সম্পন্ন</div>
          <div className="mt-1 text-xs text-blue-400">100% SLA অন টাইম</div>
        </div>
      </div>

      {/* Daily Operations Checklist & Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Support Tickets Queue */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-semibold text-white">ইউজার সাপোর্ট টিকিট কিউ</h3>
              <p className="text-xs text-slate-400">কাস্টমারদের সমস্যা সমাধান ও সরাসরি রিপ্লাই পাঠান</p>
            </div>
            <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-300">Live Queue</span>
          </div>

          <div className="space-y-3">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">{t.id}</span>
                      <span
                        className={`rounded px-2 py-0.2 text-[10px] font-bold ${
                          t.priority === "HIGH"
                            ? "bg-red-500/20 text-red-300"
                            : t.priority === "MEDIUM"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-blue-500/20 text-blue-300"
                        }`}
                      >
                        {t.priority}
                      </span>
                      <span className="rounded bg-slate-800 px-2 py-0.2 text-[10px] text-slate-300">
                        {t.category}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white mt-1">{t.subject}</h4>
                    <div className="text-xs text-slate-400 mt-0.5">
                      ইউজার: <strong className="text-slate-300">{t.user}</strong> • {t.time}
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      t.status === "RESOLVED"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : t.status === "IN_PROGRESS"
                        ? "bg-blue-500/20 text-blue-300"
                        : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
                  {t.status !== "RESOLVED" && (
                    <>
                      <button
                        onClick={() =>
                          setActiveReplyTicket(activeReplyTicket === t.id ? null : t.id)
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
                        <span>রিপ্লাই লিখুন</span>
                      </button>
                      <button
                        onClick={() => handleResolve(t.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>সমাধান সম্পন্ন</span>
                      </button>
                    </>
                  )}
                </div>

                {activeReplyTicket === t.id && (
                  <div className="mt-3 rounded-lg border border-indigo-500/30 bg-slate-900 p-3 space-y-2">
                    <textarea
                      rows={2}
                      placeholder="ইউজারের জন্য বিস্তারিত সমাধান লিখুন..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setActiveReplyTicket(null)}
                        className="rounded px-3 py-1 text-xs text-slate-400 hover:text-white"
                      >
                        বাতিল
                      </button>
                      <button
                        onClick={() => {
                          setReplyText("")
                          handleResolve(t.id)
                        }}
                        className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500"
                      >
                        পাঠান ও ক্লোজ করুন
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Daily Operations Checklist */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur space-y-4">
          <h3 className="text-base font-semibold text-white">ডেইলি শিফট চেকলিস্ট</h3>
          <p className="text-xs text-slate-400">প্রতিদিনের রুটিন অপারেশন টাস্ক</p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <div className="text-xs text-slate-300">মোবাইল প্রক্সি আইপি পুল রেসপন্স টাইম চেক</div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <div className="text-xs text-slate-300">Facebook Graph API কোটা ও রেট লিমিট ভেরিফাই</div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
              <Clock className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <div className="text-xs text-slate-300">হাই-রিস্ক ওয়ার্নিং ওয়াচডগ রিভিউ</div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
              <Clock className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <div className="text-xs text-slate-300">পেন্ডিং এজেন্সি অ্যাকাউন্ট কেস স্টাডি চেক</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
