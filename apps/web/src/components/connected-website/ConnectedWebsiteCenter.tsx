"use client"

import React, { useState } from "react"
import {
  Globe,
  Share2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Plus,
  Trash2,
  Play,
  RotateCw,
  ExternalLink,
  Layers,
  ArrowRight,
  ShieldCheck,
  Code2,
  BookOpen,
  Settings,
  HelpCircle,
  Clock,
  Send,
  Loader2,
} from "lucide-react"
import { useConnectedWebsite, ConnectedWebsiteItem } from "../../hooks/useConnectedWebsite"

interface Props {
  mode?: "safe" | "advanced"
}

export function ConnectedWebsiteCenter({ mode = "safe" }: Props) {
  const {
    websites,
    syncedArticles,
    loading,
    copiedKey,
    copyToClipboard,
    addWebsite,
    updateWebsite,
    deleteWebsite,
    simulateSync,
    refresh,
  } = useConnectedWebsite()

  const [showAddModal, setShowAddModal] = useState(false)
  const [activeTab, setActiveTab] = useState<"sites" | "stream" | "guide">("sites")

  // Form State
  const [siteName, setSiteName] = useState("")
  const [siteUrl, setSiteUrl] = useState("")
  const [platform, setPlatform] = useState<"WordPress" | "Shopify" | "Ghost" | "Custom CMS">("WordPress")
  const [targetChannels, setTargetChannels] = useState<string[]>([
    "My page (Facebook Page)",
    "BMT Digital Marketers & Entrepreneurs BD (Group)",
  ])

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!siteName || !siteUrl) return
    await addWebsite({
      name: siteName,
      url: siteUrl,
      platform,
      distributionRules: {
        targetAccounts: targetChannels,
        generateAiVariations: true,
        autoIncludeImage: true,
        delaySeconds: 15,
        active: true,
      },
    })
    setSiteName("")
    setSiteUrl("")
    setShowAddModal(false)
  }

  const getWebhookUrl = (apiKey: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/api/webhooks/wordpress?token=${apiKey}`
    }
    return `http://localhost:3000/api/webhooks/wordpress?token=${apiKey}`
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-purple-950/40 p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
              <Globe className="h-3.5 w-3.5" />
              <span>WordPress & Blog Auto-Distribution Engine</span>
              <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-300">
                {mode === "safe" ? "Business Automation (Safe)" : "Traffic Automation (Pro)"}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              Connected Website (Blog Auto-Publisher)
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              আপনার ওয়েবসাইট (WordPress, Custom Blog, Shopify) কানেক্ট করুন। ওয়েবসাইটে নতুন কোনো আর্টিকেল পাবলিশ হওয়া মাত্র তা স্বয়ংক্রিয়ভাবে ফেসবুক আইডি, পেজ ও গ্রুপগুলোতে পোস্ট হয়ে যাবে।
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => simulateSync()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-950/50 px-4 py-2.5 text-xs font-medium text-indigo-200 transition hover:bg-indigo-900/60 shadow-lg shadow-indigo-500/10"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
              ) : (
                <Sparkles className="h-4 w-4 text-indigo-400" />
              )}
              <span>WordPress Webhook টেস্ট চালান</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-500 hover:to-purple-500"
            >
              <Plus className="h-4 w-4" />
              <span>নতুন সাইট যুক্ত করুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">কানেক্টেড ওয়েবসাইট</span>
            <Globe className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{websites.length}</div>
          <div className="mt-1 text-xs text-indigo-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Webhook লিসেনার অ্যাক্টিভ</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">অটো-ডিস্ট্রিবিউটেড আর্টিকেল</span>
            <Share2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{syncedArticles.length}</div>
          <div className="mt-1 text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>১০০% ডেলিভারি রেট</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">সোশ্যাল চ্যানেলে শেয়ার সংখ্যা</span>
            <Layers className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {syncedArticles.reduce((acc, a) => acc + (a.distributions?.length || 0), 0)}
          </div>
          <div className="mt-1 text-xs text-blue-400">পেজ + আইডি + গ্রুপ চ্যানেল</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">অটো-পাইলট এআই ভ্যারিয়েশন</span>
            <Sparkles className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-300">ইনেবল্ড</div>
          <div className="mt-1 text-xs text-slate-400">স্বয়ংক্রিয় ক্যাপশন ও হ্যাশট্যাগ</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab("sites")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold transition border-b-2 ${
            activeTab === "sites"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>কানেক্টেড ওয়েবসাইট ({websites.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("stream")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold transition border-b-2 ${
            activeTab === "stream"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>লাইভ সিঙ্ক আর্টিকেল ফিড ({syncedArticles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("guide")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold transition border-b-2 ${
            activeTab === "guide"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>ওয়ার্ডপ্রেস সেটআপ গাইড</span>
        </button>
      </div>

      {/* Tab 1: Connected Websites Cards */}
      {activeTab === "sites" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {websites.map((site) => {
              const webhookUrl = getWebhookUrl(site.apiKey)
              const isCopied = copiedKey === site.id
              return (
                <div
                  key={site.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur space-y-4 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-white">{site.name}</h3>
                        <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                          {site.platform}
                        </span>
                      </div>
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-400 hover:underline flex items-center gap-1 mt-1"
                      >
                        <span>{site.url}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    <button
                      onClick={() => deleteWebsite(site.id)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Webhook Endpoint Box */}
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>WordPress Webhook URL:</span>
                      <button
                        onClick={() => copyToClipboard(webhookUrl, site.id)}
                        className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition"
                      >
                        {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{isCopied ? "কপি হয়েছে!" : "URL কপি করুন"}</span>
                      </button>
                    </div>
                    <div className="font-mono text-xs text-slate-300 truncate bg-slate-900/80 px-2.5 py-1.5 rounded border border-slate-800">
                      {webhookUrl}
                    </div>
                  </div>

                  {/* Target Distribution Channels */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-slate-300">টার্গেট ফেসবুক চ্যানেল:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {site.distributionRules.targetAccounts.map((tgt, i) => (
                        <span
                          key={i}
                          className="rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] text-slate-200"
                        >
                          {tgt}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Quick Test & Status Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <span className="text-slate-400">
                      সর্বশেষ সিঙ্ক: <strong className="text-slate-300">{new Date(site.lastSyncAt).toLocaleTimeString()}</strong>
                    </span>
                    <button
                      onClick={() => simulateSync(site.id)}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 px-3 py-1.5 font-medium text-white transition text-xs"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>টেস্ট পোস্ট পাঠান</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Live Synced Articles Stream */}
      {activeTab === "stream" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">সম্প্রতি অটো-পাবলিশড আর্টিকেলসমূহ</h3>
              <p className="text-xs text-slate-400">ব্লগ থেকে সরাসরি ফেসবুক পেজ ও গ্রুপে শেয়ার হওয়া পোস্টের লাইভ লগ</p>
            </div>
            <button
              onClick={() => refresh()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>রিফ্রেশ</span>
            </button>
          </div>

          <div className="space-y-3">
            {syncedArticles.map((art) => (
              <div
                key={art.id}
                className="flex flex-col sm:flex-row items-start gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-slate-700"
              >
                {art.featuredImage && (
                  <img
                    src={art.featuredImage}
                    alt={art.title}
                    className="h-20 w-32 rounded-lg object-cover border border-slate-800 flex-shrink-0"
                  />
                )}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                      {art.siteName}
                    </span>
                    <span className="text-[11px] text-slate-400">{art.publishedAt}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white truncate">{art.title}</h4>
                  <p className="text-xs text-slate-300 line-clamp-1">{art.excerpt}</p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-400">ডিস্ট্রিবিউটেড:</span>
                    {art.distributions.map((dist, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-medium text-emerald-300"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{dist.target}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Step-by-Step Setup Guide */}
      {activeTab === "guide" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur space-y-6 max-w-4xl">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">ওয়ার্ডপ্রেসের সাথে মাত্র ২ মিনিটে কানেক্ট করার নিয়ম</h3>
            <p className="text-xs text-slate-400">
              ওয়ার্ডপ্রেস প্লাগইন অথবা কাস্টম হুক ব্যবহার করে সরাসরি নতুন পোস্ট ফেসবুকে সিঙ্ক করুন।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                ১
              </div>
              <h4 className="text-xs font-semibold text-white">প্লাগইন ইন্সটল</h4>
              <p className="text-[11px] text-slate-400">
                আপনার WordPress Admin এ গিয়ে Plugins &gt; Add New থেকে <strong>WP Webhooks</strong> অথবা <strong>Webhook Pro</strong> সার্চ করে ইন্সটল ও অ্যাক্টিভ করুন।
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                ২
              </div>
              <h4 className="text-xs font-semibold text-white">Webhook URL পেস্ট</h4>
              <p className="text-[11px] text-slate-400">
                প্লাগইনের &quot;Send Data&quot; অপশনে যান, Trigger হিসেবে <strong>Post Created / Published</strong> সিলেক্ট করুন এবং আমাদের সিস্টেমের Webhook URL টি পেস্ট করুন।
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                ৩
              </div>
              <h4 className="text-xs font-semibold text-white">অটোমেশন লাইভ</h4>
              <p className="text-[11px] text-slate-400">
                কাজ শেষ! এখন থেকে আপনি ব্লগে কোনো পোস্ট পাবলিশ করলেই স্বয়ংক্রিয়ভাবে আমাদের এআই বট তা নিয়ে নির্বাচিত ফেসবুক আইডি, পেজ ও গ্রুপে পাবলিশ করবে।
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Website Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-white">নতুন ওয়েবসাইট কানেক্ট করুন</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSite} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">ওয়েবসাইট বা ব্লগের নাম</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: TechBD News"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">ওয়েবসাইট URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://myblog.com"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">প্ল্যাটফর্ম টাইপ</label>
                <select
                  value={platform}
                  onChange={(e: any) => setPlatform(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="WordPress">WordPress</option>
                  <option value="Shopify">Shopify Blog</option>
                  <option value="Ghost">Ghost CMS</option>
                  <option value="Custom CMS">Custom CMS / Webhook</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                >
                  কানেক্ট ও সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
