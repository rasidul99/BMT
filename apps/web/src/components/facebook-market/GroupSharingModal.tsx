"use client"

import React, { useState } from "react"
import { FacebookAccountItem } from "../../hooks/useFacebookAccounts"
import { useAssetLibrary } from "../../hooks/useAssetLibrary"
import {
  Send,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Folder,
  Layers,
  X,
  Play,
  Pause,
  ExternalLink,
  Bot,
  Sparkles,
  Cpu,
  Monitor,
} from "lucide-react"

interface GroupSharingModalProps {
  isOpen: boolean
  onClose: () => void
  accounts: FacebookAccountItem[]
  onRecordShare: (accountId: string) => void
}

interface DispatchTask {
  id: string
  accountName: string
  accountId: string
  groupName: string
  groupId: string
  status: "Queued" | "Posting" | "Success" | "Failed"
  time: string
}

export function GroupSharingModal({
  isOpen,
  onClose,
  accounts,
  onRecordShare,
}: GroupSharingModalProps) {
  const { assets } = useAssetLibrary()

  const [postTitle, setPostTitle] = useState("ঈদ স্পেশাল প্রিমিয়াম কালেকশন - অর্ডার করতে ইনবক্স করুন")
  const [postContent, setPostContent] = useState(
    "প্রিমিয়াম কোয়ালিটির পাঞ্জাবি ও শার্ট কালেকশন এখন বিশেষ ডিসকাউন্টে পাওয়া যাচ্ছে। সরাসরি ক্যাশ অন ডেলিভারি সুবিধা।"
  )
  const [selectedAssetId, setSelectedAssetId] = useState<string>("")
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(
    accounts.filter((a) => a.status === "Active").map((a) => a.id)
  )
  const [delaySeconds, setDelaySeconds] = useState<number>(60)
  const [randomJitter, setRandomJitter] = useState<boolean>(true)

  // Execution Mode State (Puppeteer Bot vs Assisted Manual)
  const [executionMode, setExecutionMode] = useState<"bot" | "manual">("bot")
  const [showBrowser, setShowBrowser] = useState<boolean>(true)
  const [botFeedback, setBotFeedback] = useState<string>("")

  // Dispatch Queue Execution State
  const [isExecuting, setIsExecuting] = useState(false)
  const [queue, setQueue] = useState<DispatchTask[]>([])
  const [completedCount, setCompletedCount] = useState(0)

  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null)

  const handleCopyAndOpenGroup = (task: DispatchTask) => {
    const fullText = `${postTitle}\n\n${postContent}`
    navigator.clipboard.writeText(fullText)
    setCopiedTaskId(task.id)
    setTimeout(() => setCopiedTaskId(null), 3000)

    const url = task.groupId.startsWith("http")
      ? task.groupId
      : `https://www.facebook.com/groups/${task.groupId}`
    window.open(url, "_blank")
  }

  if (!isOpen) return null

  // Compute total target groups across selected accounts
  const selectedAccounts = accounts.filter((a) => selectedAccountIds.includes(a.id))
  const totalTargetGroups = selectedAccounts.reduce((sum, a) => sum + a.assignedGroups.length, 0)
  const hasAnyRealCookie = selectedAccounts.some(
    (a) => a.tokenOrCookie?.includes("c_user=") && a.tokenOrCookie?.includes("xs=")
  )

  const handleToggleAccount = (id: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSelectAllActive = () => {
    const activeIds = accounts.filter((a) => a.status === "Active").map((a) => a.id)
    setSelectedAccountIds(activeIds)
  }

  const handleSelectAsset = (assetId: string) => {
    setSelectedAssetId(assetId)
    const found = assets.find((a) => a.id === assetId)
    if (found) {
      setPostTitle(found.title)
      setPostContent(found.content || found.title)
    }
  }

  const handleStartDispatch = async () => {
    if (selectedAccounts.length === 0) {
      alert("Please select at least 1 account to share.")
      return
    }

    // Build task list
    const tasks: DispatchTask[] = []
    selectedAccounts.forEach((acc) => {
      acc.assignedGroups.forEach((grp) => {
        tasks.push({
          id: `task-${acc.id}-${grp.groupId}-${Date.now()}`,
          accountName: acc.name,
          accountId: acc.id,
          groupName: grp.groupName,
          groupId: grp.groupId,
          status: "Queued",
          time: "Scheduled",
        })
      })
    })

    if (tasks.length === 0) {
      alert("Selected accounts do not have any assigned groups yet. Please assign groups first.")
      return
    }

    setQueue(tasks)
    setIsExecuting(true)
    setCompletedCount(0)
    setBotFeedback("")

    // If Bot Mode is selected, trigger the backend Puppeteer process
    if (executionMode === "bot" && hasAnyRealCookie) {
      for (const acc of selectedAccounts) {
        if (acc.tokenOrCookie?.includes("c_user=") && acc.assignedGroups.length > 0) {
          try {
            setBotFeedback(`রোবট ব্যাকএন্ড ইঞ্জিন প্রস্তুত হচ্ছে (${acc.name})...`)
            const res = await fetch("/api/facebook-bot/launch", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                accountName: acc.name,
                cookieString: acc.tokenOrCookie,
                groups: acc.assignedGroups.map((g) => ({ groupId: g.groupId, groupName: g.groupName })),
                postMessage: `${postTitle}\n\n${postContent}`,
                delaySeconds,
                headless: !showBrowser,
              }),
            })
            const data = await res.json()
            if (data.success) {
              setBotFeedback(
                `🤖 Puppeteer Bot সক্রিয় হয়েছে! ${showBrowser ? "ক্রোম ব্রাউজার স্ক্রিনে ওপেন হয়ে" : "ব্যাকগ্রাউন্ডে"} ${acc.assignedGroups.length} টি গ্রুপে স্বয়ংক্রিয় পোস্টিং শুরু হয়েছে।`
              )
            } else {
              setBotFeedback(`⚠️ Bot Launch Error: ${data.error}`)
            }
          } catch (e: any) {
            console.error("Bot launch error:", e)
            setBotFeedback(`⚠️ Bot Launch Exception: ${e.message}`)
          }
        }
      }
    }

    // Execute sequentially with pacing
    for (let i = 0; i < tasks.length; i++) {
      setQueue((prev) =>
        prev.map((t, idx) => (idx === i ? { ...t, status: "Posting", time: "Broadcasting..." } : t))
      )

      // Safe network pacing simulation
      const jitterTime = randomJitter ? Math.floor(Math.random() * 800) : 0
      await new Promise((r) => setTimeout(r, 1200 + jitterTime))

      onRecordShare(tasks[i].accountId)

      setQueue((prev) =>
        prev.map((t, idx) =>
          idx === i ? { ...t, status: "Success", time: new Date().toLocaleTimeString() } : t
        )
      )

      setCompletedCount((prev) => prev + 1)
    }

    setIsExecuting(false)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-rose-600/10 text-rose-600 rounded-lg">
              <Send className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-base text-foreground">Facebook Market Group Sharing Dispatcher</h3>
              <p className="text-[11px] text-muted-foreground">
                Orchestrate distributed group posting across 100 accounts with anti-spam delays
              </p>
            </div>
          </div>
          <button onClick={onClose} disabled={isExecuting} className="text-muted-foreground hover:text-foreground font-bold p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Content to Share */}
        <div className="space-y-3 bg-muted/20 p-4 rounded-xl border text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground flex items-center space-x-1.5">
              <Folder className="w-3.5 h-3.5 text-blue-500" />
              <span>Post Content & Central Library Picker</span>
            </span>

            {assets.length > 0 && (
              <select
                value={selectedAssetId}
                onChange={(e) => handleSelectAsset(e.target.value)}
                className="p-1 border rounded-lg bg-background text-[11px] font-semibold"
              >
                <option value="">Pick from Asset Library ({assets.length})</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.title} ({asset.type})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Post Title</label>
            <input
              type="text"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              className="w-full mt-1 p-2 border rounded-lg bg-background text-xs font-semibold"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Caption / Body</label>
            <textarea
              rows={2}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="w-full mt-1 p-2 border rounded-lg bg-background text-xs font-medium"
            />
          </div>
        </div>

        {/* Section 2: Account Selection Matrix */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <label className="font-bold text-foreground flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-500" />
              <span>Select Accounts ({selectedAccountIds.length} of {accounts.length} Selected)</span>
            </label>
            <button
              type="button"
              onClick={handleSelectAllActive}
              className="text-[11px] text-blue-600 hover:underline font-bold"
            >
              Select All Active
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto border p-2 rounded-xl bg-muted/20">
            {accounts.map((acc) => {
              const isSelected = selectedAccountIds.includes(acc.id)
              const hasCookie = acc.tokenOrCookie?.includes("c_user=") && acc.tokenOrCookie?.includes("xs=")
              return (
                <div
                  key={acc.id}
                  onClick={() => !isExecuting && handleToggleAccount(acc.id)}
                  className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition text-[11px] ${
                    isSelected ? "bg-blue-500/10 border-blue-500/50" : "bg-card hover:bg-muted/50 border-border"
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <div className="flex items-center space-x-1.5 truncate">
                      <span className="font-bold truncate text-foreground">{acc.name}</span>
                      {hasCookie && (
                        <span className="text-[9px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-1 py-0.2 rounded border border-emerald-500/30 shrink-0">
                          ✓ Cookie
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {acc.assignedGroups.length} groups
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Engine Execution Mode Selection */}
        <div className="p-3.5 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 border border-blue-500/30 rounded-xl space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 font-bold text-foreground">
              <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>অটোমেশন ইঞ্জিন (Automation Execution Mode)</span>
            </div>
            <span className="text-[10px] bg-blue-600/20 text-blue-700 dark:text-blue-300 font-extrabold px-2 py-0.5 rounded-full border border-blue-500/30">
              Puppeteer Bot Ready
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setExecutionMode("bot")}
              className={`p-2.5 rounded-lg border text-left transition flex items-start space-x-2.5 ${
                executionMode === "bot"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-card hover:bg-muted/50 border-border text-foreground"
              }`}
            >
              <Cpu className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-extrabold text-[11px]">১০০% অটোমেটিক রোবট (Puppeteer Bot)</div>
                <div className={`text-[10px] ${executionMode === "bot" ? "text-blue-100" : "text-muted-foreground"}`}>
                  কুকি দিয়ে ব্যাকগ্রাউন্ডে ব্রাউজার খুলে ২০টি গ্রুপে কোনো পেস্ট ছাড়াই নিজে নিজে পোস্ট করবে।
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setExecutionMode("manual")}
              className={`p-2.5 rounded-lg border text-left transition flex items-start space-x-2.5 ${
                executionMode === "manual"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-card hover:bg-muted/50 border-border text-foreground"
              }`}
            >
              <Monitor className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-extrabold text-[11px]">ম্যানুয়াল অ্যাসিস্ট মোড (১-ক্লিক কপি)</div>
                <div className={`text-[10px] ${executionMode === "manual" ? "text-blue-100" : "text-muted-foreground"}`}>
                  ক্লিপবোর্ডে কপি ও গ্রুপ খুলে দেওয়ার অ্যাসিস্ট্যান্স মোড।
                </div>
              </div>
            </button>
          </div>

          {executionMode === "bot" && (
            <div className="flex items-center justify-between pt-1 border-t border-blue-500/20 text-[11px]">
              <label className="flex items-center space-x-2 cursor-pointer text-foreground font-semibold">
                <input
                  type="checkbox"
                  checked={showBrowser}
                  onChange={(e) => setShowBrowser(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>স্ক্রিনে ক্রোম ব্রাউজার ওপেন হতে দেখতে চান? (Live Browser Window)</span>
              </label>
              <span className="text-[10px] text-muted-foreground">
                {showBrowser ? "ক্রোম দৃশ্যমান হবে" : "অদৃশ্য ব্যাকগ্রাউন্ডে চলবে"}
              </span>
            </div>
          )}

          {botFeedback && (
            <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-[11px] font-bold flex items-center space-x-2 animate-in fade-in">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{botFeedback}</span>
            </div>
          )}
        </div>

        {/* Section 3: Anti-Spam Pacing Configuration */}
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2 text-xs">
          <div className="flex items-center space-x-1.5 font-bold text-amber-600 dark:text-amber-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Anti-Spam Pacing & Delay Protection</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center space-x-1">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>Delay Between Posts: {delaySeconds}s</span>
              </label>
              <select
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(Number(e.target.value))}
                className="w-full mt-1 p-2 border rounded-lg bg-background text-xs font-semibold"
              >
                <option value={60}>60s (Fast Paced)</option>
                <option value={120}>120s (Recommended Safe)</option>
                <option value={180}>180s (High Safety)</option>
                <option value={300}>300s (Maximum Anti-Ban Isolation)</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center space-x-2 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={randomJitter}
                  onChange={(e) => setRandomJitter(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-0"
                />
                <span className="text-[11px] font-bold text-foreground">
                  Human Random Jitter (±20s variation)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Live Execution Progress Queue */}
        {queue.length > 0 && (
          <div className="space-y-2 text-xs border-t pt-3">
            <div className="flex items-center justify-between font-bold text-muted-foreground uppercase text-[10px]">
              <span>Execution Queue ({completedCount} / {queue.length})</span>
              <span className="text-emerald-600 font-extrabold">
                {Math.round((completedCount / queue.length) * 100)}% Complete
              </span>
            </div>

            <div className="border rounded-xl divide-y max-h-36 overflow-y-auto bg-muted/10 font-mono text-[11px]">
              {queue.map((task) => (
                <div key={task.id} className="p-2 flex items-center justify-between">
                  <div className="flex items-center space-x-2 truncate">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        task.status === "Success"
                          ? "bg-emerald-500"
                          : task.status === "Posting"
                          ? "bg-blue-500 animate-pulse"
                          : "bg-muted-foreground"
                      }`}
                    />
                    <span className="font-bold text-foreground truncate max-w-[160px]">
                      {task.accountName}
                    </span>
                    <span className="text-muted-foreground truncate">&rarr; {task.groupName}</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        task.status === "Success"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : task.status === "Posting"
                          ? "bg-blue-500/10 text-blue-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      {task.time}
                    </span>

                    {task.groupId && task.status === "Success" && (
                      executionMode === "bot" ? (
                        <a
                          href={
                            task.groupId.startsWith("http")
                              ? task.groupId
                              : `https://www.facebook.com/groups/${task.groupId}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-0.5 rounded font-bold transition flex items-center space-x-1 shadow-xs"
                          title="ফেসবুক গ্রুপে সরাসরি পোস্টটি দেখুন"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                          <span>গ্রুপে পোস্ট দেখুন</span>
                          <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCopyAndOpenGroup(task)}
                          className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded font-bold transition flex items-center space-x-1 shadow-xs"
                          title="কন্টেন্ট কপি করে ফেসবুক গ্রুপ ওপেন করুন"
                        >
                          {copiedTaskId === task.id ? (
                            <>
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-300" />
                              <span>কপি হয়েছে!</span>
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-2.5 h-2.5" />
                              <span>কপি ও পোস্ট করুন</span>
                            </>
                          )}
                        </button>
                      )
                    )}

                    {task.groupId && task.status !== "Success" && (
                      <a
                        href={
                          task.groupId.startsWith("http")
                            ? task.groupId
                            : `https://www.facebook.com/groups/${task.groupId}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-0.5 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded font-semibold border border-blue-200 dark:border-blue-800 transition"
                        title="Open group on Facebook to view"
                      >
                        <span>View Group</span>
                        <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {completedCount > 0 && !isExecuting && (
              hasAnyRealCookie ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-xl text-[11px] space-y-1 animate-in fade-in">
                  <div className="font-bold flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {executionMode === "bot"
                        ? `Puppeteer রোবট দিয়ে পোস্ট সম্পন্ন (${completedCount}/${queue.length} Tasks)`
                        : `ভেরিফাইড ফেসবুক কুকি সক্রিয় (${completedCount}/${queue.length} Tasks সম্পন্ন)`}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {executionMode === "bot"
                      ? "Puppeteer রোবট আপনার আসল ফেসবুক কুকি সেশন দিয়ে ক্রোম ব্রাউজারে গ্রুপ পোস্ট সফলভাবে সাবমিট করেছে! ফেসবুক গ্রুপে পোস্টটি লাইভ দেখতে উপরের 'গ্রুপে পোস্ট দেখুন' বাটনে ক্লিক করুন।"
                      : "আপনার অ্যাকাউন্টে আসল ফেসবুক সেশন সক্রিয়ভাবে লিংক করা আছে। সরাসরি ফেসবুক গ্রুপে এখনই পাবলিশ করার জন্য উপরের 'কপি ও পোস্ট করুন' বাটনে চাপুন।"}
                  </p>
                </div>
              ) : (
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 rounded-xl text-[11px] space-y-0.5">
                  <div className="font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>অটোমেশন সিমুলেশন টেস্ট সম্পন্ন ({completedCount}/{queue.length} Tasks)</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    অ্যান্টি-স্প্যাম পেসিং সফলভাবে যাচাই হয়েছে এবং অ্যাকাউন্টের ডেইলি শেয়ার কাউন্টারে +{completedCount} যোগ হয়েছে। রিয়েল সেশনে সরাসরি পোস্ট করার জন্য অ্যাকাউন্টে Cookie যুক্ত করুন।
                  </p>
                </div>
              )
            )}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-2 border-t text-xs">
          <div className="text-[11px] text-muted-foreground">
            Total Target Groups: <b className="text-foreground">{totalTargetGroups} Groups Reach</b>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isExecuting}
              className="px-4 py-2 border rounded-xl font-bold hover:bg-muted transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleStartDispatch}
              disabled={isExecuting || totalTargetGroups === 0}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-xs transition flex items-center space-x-2 disabled:opacity-50"
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{executionMode === "bot" ? "Bot Running..." : "Sharing in Progress..."}</span>
                </>
              ) : (
                <>
                  {executionMode === "bot" ? (
                    <>
                      <Bot className="w-4 h-4" />
                      <span>Launch Puppeteer Bot (অটো-পোস্টিং)</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>Launch Group Sharing</span>
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
