"use client"

import React, { useState } from "react"
import {
  Crown,
  Users,
  ShieldCheck,
  Server,
  ToggleLeft,
  ToggleRight,
  Settings,
  Activity,
  AlertTriangle,
  Search,
  MoreVertical,
  CheckCircle2,
  Database,
  Cpu,
  Layers,
  RotateCw,
} from "lucide-react"

export default function SuperAdminPage() {
  const [featureToggles, setFeatureToggles] = useState({
    trafficAutomation: true,
    riskDetector: true,
    groupAdminBot: true,
    wordpressWebhooks: true,
    mobileProxyRotation: true,
  })

  const [userList, setUserList] = useState([
    {
      id: "usr-1",
      name: "Julkar Nayeen (Client Master)",
      email: "julkar@example.com",
      plan: "Enterprise Agency (100 IDs)",
      connectedIds: 24,
      status: "Active",
      joined: "2026-08-01",
    },
    {
      id: "usr-2",
      name: "Rasidul Islam Sajib",
      email: "rasidul@example.com",
      plan: "Super Admin",
      connectedIds: 12,
      status: "Active",
      joined: "2026-07-15",
    },
    {
      id: "usr-3",
      name: "Tanvir Digital Agency",
      email: "agency@tanvir.bd",
      plan: "Agency Pro (50 IDs)",
      connectedIds: 45,
      status: "Active",
      joined: "2026-09-10",
    },
    {
      id: "usr-4",
      name: "Kamrul E-Com Solutions",
      email: "kamrul@techbd.com",
      plan: "Business Starter (10 IDs)",
      connectedIds: 8,
      status: "Active",
      joined: "2026-09-22",
    },
    {
      id: "usr-5",
      name: "Suspicious Bulk Spammer",
      email: "bot99@throwaway.io",
      plan: "Free Trial",
      connectedIds: 1,
      status: "Suspended",
      joined: "2026-10-10",
    },
  ])

  const toggleFeature = (key: keyof typeof featureToggles) => {
    setFeatureToggles((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleUserStatus = (id: string) => {
    setUserList((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: u.status === "Active" ? "Suspended" : "Active" } : u))
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 mb-2">
            <Crown className="h-3.5 w-3.5" />
            <span>Master Platform Control</span>
            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] text-blue-300">
              Role: Super Admin
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Super Admin Control Center
          </h1>
          <p className="text-sm text-slate-400">
            সম্পূর্ণ প্ল্যাটফর্ম নিয়ন্ত্রণ, ইউজার ম্যানেজমেন্ট, গ্লোবাল ফিচার টগল ও সিস্টেম হেলথ মনিটরিং।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300">
            <Server className="h-4 w-4 text-emerald-400" />
            <span>ক্লাস্টার Uptime: 99.98%</span>
          </span>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">মোট রেজিস্টার্ড ইউজার</span>
            <Users className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white">1,428</div>
          <div className="mt-1 text-xs text-emerald-400">+12% এই মাসে বৃদ্ধি</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">অ্যাক্টিভ সাবস্ক্রিপশন (MRR)</span>
            <Crown className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white">$24,850</div>
          <div className="mt-1 text-xs text-indigo-400">318 জন পেইড কাস্টমার</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">লাইভ রানিং বট ওয়ার্কার</span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400">68 টি সক্রিয়</div>
          <div className="mt-1 text-xs text-slate-400">Puppeteer Headless Nodes</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">সিস্টেম লোড / মেমোরি</span>
            <Cpu className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white">28.4%</div>
          <div className="mt-1 text-xs text-purple-400">Normal Optimal Load</div>
        </div>
      </div>

      {/* Global Feature Toggles */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-semibold text-white">গ্লোবাল প্ল্যাটফর্ম ফিচার কন্ট্রোল</h3>
            <p className="text-xs text-slate-400">সিস্টেমের যেকোনো মডিউল জরুরি প্রয়োজনে তৎক্ষণাৎ অন বা অফ করুন</p>
          </div>
          <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300">Live Kill-Switch</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3.5">
            <div>
              <div className="text-xs font-semibold text-white">Traffic Automation System</div>
              <div className="text-[11px] text-slate-400">হাই-স্পিড স্ক্র্যাপার ও মাল্টি-আইডি বট</div>
            </div>
            <button
              onClick={() => toggleFeature("trafficAutomation")}
              className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${
                featureToggles.trafficAutomation ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"
              }`}
            >
              {featureToggles.trafficAutomation ? "ON" : "OFF"}
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3.5">
            <div>
              <div className="text-xs font-semibold text-white">Risk Score Detector AI</div>
              <div className="text-[11px] text-slate-400">অ্যাকাউন্ট সেফটি স্ক্যানার ও ওয়ার্নিং</div>
            </div>
            <button
              onClick={() => toggleFeature("riskDetector")}
              className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${
                featureToggles.riskDetector ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"
              }`}
            >
              {featureToggles.riskDetector ? "ON" : "OFF"}
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3.5">
            <div>
              <div className="text-xs font-semibold text-white">Admin Group Assistant</div>
              <div className="text-[11px] text-slate-400">মেম্বার ও পোস্ট অটো-অ্যাপ্রুভাল বট</div>
            </div>
            <button
              onClick={() => toggleFeature("groupAdminBot")}
              className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${
                featureToggles.groupAdminBot ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"
              }`}
            >
              {featureToggles.groupAdminBot ? "ON" : "OFF"}
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3.5">
            <div>
              <div className="text-xs font-semibold text-white">WordPress Webhook APIs</div>
              <div className="text-[11px] text-slate-400">ব্লগ অটো-পাবলিশার লিসেনার</div>
            </div>
            <button
              onClick={() => toggleFeature("wordpressWebhooks")}
              className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${
                featureToggles.wordpressWebhooks ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"
              }`}
            >
              {featureToggles.wordpressWebhooks ? "ON" : "OFF"}
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3.5">
            <div>
              <div className="text-xs font-semibold text-white">Mobile Proxy Rotation</div>
              <div className="text-[11px] text-slate-400">অ্যান্টি-ব্যান আইপি রোটেশন লেয়ার</div>
            </div>
            <button
              onClick={() => toggleFeature("mobileProxyRotation")}
              className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${
                featureToggles.mobileProxyRotation ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"
              }`}
            >
              {featureToggles.mobileProxyRotation ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-semibold text-white">ইউজার কন্ট্রোল ও অ্যাক্সেস ম্যানেজমেন্ট</h3>
            <p className="text-xs text-slate-400">ইউজারদের প্ল্যান আপগ্রেড, অ্যাকাউন্ট ভেরিফিকেশন ও সাসপেনশন হ্যান্ডেল করুন</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5">ইউজারের নাম ও ইমেইল</th>
                <th className="p-3.5">সাবস্ক্রিপশন প্ল্যান</th>
                <th className="p-3.5 text-center">কানেক্টেড ফেসবুক ID</th>
                <th className="p-3.5">যুক্ত হওয়ার তারিখ</th>
                <th className="p-3.5">স্ট্যাটাস</th>
                <th className="p-3.5 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {userList.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-3.5">
                    <div className="font-semibold text-white">{user.name}</div>
                    <div className="text-[11px] text-slate-400">{user.email}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[11px] font-medium text-blue-300">
                      {user.plan}
                    </span>
                  </td>
                  <td className="p-3.5 text-center font-mono font-bold text-white">{user.connectedIds}</td>
                  <td className="p-3.5 text-slate-400">{user.joined}</td>
                  <td className="p-3.5">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                        user.status === "Active"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => toggleUserStatus(user.id)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                        user.status === "Active"
                          ? "border border-red-500/30 text-red-400 hover:bg-red-500/10"
                          : "border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                      }`}
                    >
                      {user.status === "Active" ? "সাসপেন্ড করুন" : "অ্যাক্টিভ করুন"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
