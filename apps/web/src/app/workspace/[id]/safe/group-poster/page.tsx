"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import {
  Users,
  Send,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Clock,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  RotateCw,
  Image as ImageIcon,
  Video,
  FileText,
  Link2,
  Search,
  Check,
  Layers,
  Share2,
  ThumbsUp,
  MessageCircle,
  Filter,
  Eye,
  AlertTriangle,
  Globe,
  X,
  Info,
  Film,
  Smartphone,
  Vote,
  Music,
  Upload,
  HardDrive,
  Loader2,
  FolderPlus,
  UploadCloud,
} from "lucide-react"
import { useFacebookAccounts } from "../../../../../hooks/useFacebookAccounts"
import { useGroupPoster, GroupPostJob, CustomGroupItem } from "../../../../../hooks/useGroupPoster"
import { AssetLibraryPickerModal } from "../../../../../components/post-scheduler/AssetLibraryPickerModal"
import { LibraryAsset } from "../../../../../hooks/useAssetLibrary"

export default function SafeGroupPosterPage() {
  const { accounts: fbAccounts } = useFacebookAccounts()
  const {
    queue,
    logs,
    groups: customGroups,
    isLoaded,
    addJobsToQueue,
    updateJobStatus,
    removeJob,
    clearQueue,
    addLog,
    clearLogs,
    addGroup,
    deleteGroup,
  } = useGroupPoster()

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"composer" | "queue" | "groups" | "logs">("composer")

  // Post Composer State
  const [postFormat, setPostFormat] = useState<"Text" | "Image" | "Video" | "Reel" | "Story" | "Poll">("Image")
  const [postTitle, setPostTitle] = useState("Eid Special Wholesale Watch Collection 2026")
  const [postContent, setPostContent] = useState(
    "আমাদের অফিশিয়াল গ্রুপ মেম্বারদের জন্য এক্সক্লুসিভ ৩০% ডিসকাউন্ট ডিল! স্টক সীমিত। অর্ডার করতে এখনই ইনবক্স করুন অথবা লিংকে ভিসিট করুন।"
  )
  const [mediaUrl, setMediaUrl] = useState(
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80"
  )
  const [linkUrl, setLinkUrl] = useState("https://bmt.link/eid-deal-group")
  const [spinVariations, setSpinVariations] = useState(true)

  // Format Specific States (Poll, Reel, Story)
  const [pollQuestion, setPollQuestion] = useState("Which product feature matters most to you in 2026?")
  const [pollOptions, setPollOptions] = useState<string[]>([
    "Premium Build Quality & Durability",
    "Long Battery Life (48 Hours+)",
    "Affordable Price & Discounts",
    "Fast 24-Hour Home Delivery",
  ])
  const [pollDurationDays, setPollDurationDays] = useState<number>(3)
  const [reelAudioName, setReelAudioName] = useState("Original Sound - BMT Trending Audio")
  const [storyLinkSticker, setStoryLinkSticker] = useState("https://bmt.link/eid-deal")
  const [storyStickerText, setStoryStickerText] = useState("Swipe Up / Shop Now")

  // Media Source & Local Upload States
  const [mediaSourceType, setMediaSourceType] = useState<"local" | "url">("local")
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{ name: string; size: string } | null>(null)
  const localFileInputRef = useRef<HTMLInputElement>(null)

  const handleLocalFileUpload = async (file: File) => {
    try {
      setIsUploadingMedia(true)
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (data.success && data.url) {
        setMediaUrl(data.url)
        setUploadedFileInfo({
          name: data.originalName || file.name,
          size: data.size || `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        })
      } else {
        alert("Upload failed: " + (data.error || "Unknown error"))
      }
    } catch (err: any) {
      console.error("Local file upload error:", err)
      alert("Error uploading file: " + err.message)
    } finally {
      setIsUploadingMedia(false)
    }
  }

  // Asset Library Picker
  const [showLibraryModal, setShowLibraryModal] = useState(false)

  // Multi-Group Selection & Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>("ALL")
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])

  // Anti-Ban Delay & Account Rotation Settings
  const [delayPreset, setDelayPreset] = useState<"fast" | "balanced" | "safe">("balanced")
  const [accountRotationMode, setAccountRotationMode] = useState<"auto" | "assigned">("auto")
  const [dispatchExecutionMode, setDispatchExecutionMode] = useState<"live" | "simulation">("live")
  const [showChromeWindow, setShowChromeWindow] = useState<boolean>(true)

  // Dispatch Runner State
  const [isDispatcherRunning, setIsDispatcherRunning] = useState(false)
  const [activeJobIndex, setActiveJobIndex] = useState<number | null>(null)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [currentJobTotalDelay, setCurrentJobTotalDelay] = useState<number>(0)
  const [currentJobStep, setCurrentJobStep] = useState<"cooling" | "dispatching" | "done" | null>(null)
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null)
  const [statusNotice, setStatusNotice] = useState<string | null>(null)
  const isCancelledRef = useRef(false)

  // Batch Progress Metrics
  const totalBatchCount = queue.length
  const completedBatchCount = queue.filter((j) => j.status === "Success").length
  const failedBatchCount = queue.filter((j) => j.status === "Failed").length
  const postingBatchCount = queue.filter((j) => j.status === "Posting").length
  const pendingBatchCount = queue.filter((j) => j.status === "Pending").length

  const getJobProgressPercentage = (job: GroupPostJob) => {
    if (job.status === "Success") return 100
    if (job.status === "Failed") return 100
    if (job.status === "Pending") return 0
    if (job.status === "Posting") {
      if (currentJobStep === "dispatching" || countdownSeconds === null) {
        return 92
      }
      if (currentJobTotalDelay > 0 && countdownSeconds !== null) {
        const elapsed = currentJobTotalDelay - countdownSeconds
        const pct = Math.min(88, Math.max(12, Math.round((elapsed / currentJobTotalDelay) * 88)))
        return pct
      }
      return 50
    }
    return 0
  }

  const overallBatchPercentage = useMemo(() => {
    if (totalBatchCount === 0) return 0
    const totalProgress = queue.reduce((sum, j) => sum + getJobProgressPercentage(j), 0)
    return Math.min(100, Math.round(totalProgress / totalBatchCount))
  }, [queue, currentJobStep, countdownSeconds, currentJobTotalDelay, totalBatchCount])

  // New Group Modal State
  const [showAddGroupModal, setShowAddGroupModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupUrl, setNewGroupUrl] = useState("")
  const [newGroupCategory, setNewGroupCategory] = useState<CustomGroupItem["category"]>("Buy & Sell")
  const [newGroupMembers, setNewGroupMembers] = useState(50000)
  const [newGroupPrivacy, setNewGroupPrivacy] = useState<"Public" | "Private">("Public")
  const [newGroupIsAdmin, setNewGroupIsAdmin] = useState(false)
  const [newGroupAssignedAcc, setNewGroupAssignedAcc] = useState<string>("none")

  // Floating Toast Alert State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Combine groups from connected accounts and custom groups
  const allAvailableGroups = useMemo(() => {
    const list: Array<{
      id: string
      name: string
      category: string
      memberCount: number
      privacy: "Public" | "Private"
      isManagedAdmin: boolean
      assignedAccountId?: string
      assignedAccountName?: string
      accountAvatar?: string
      url?: string
    }> = []

    // 1. Groups assigned inside Facebook Accounts
    fbAccounts.forEach((acc) => {
      acc.assignedGroups?.forEach((g) => {
        list.push({
          id: `${acc.id}-${g.groupId}`,
          name: g.groupName,
          category: "Buy & Sell",
          memberCount: g.memberCount,
          privacy: g.privacy,
          isManagedAdmin: false,
          assignedAccountId: acc.id,
          assignedAccountName: acc.name,
          accountAvatar: acc.avatarUrl,
          url: `https://facebook.com/groups/${g.groupId}`,
        })
      })
    })

    // 2. Custom Groups
    customGroups.forEach((cg) => {
      const isUnassigned = !cg.assignedAccountId || cg.assignedAccountId === "none"
      const matchAcc = !isUnassigned ? fbAccounts.find((a) => a.id === cg.assignedAccountId) : null
      list.push({
        id: cg.id,
        name: cg.name,
        category: cg.category,
        memberCount: cg.memberCount,
        privacy: cg.privacy,
        isManagedAdmin: cg.isManagedAdmin,
        assignedAccountId: isUnassigned ? "none" : cg.assignedAccountId,
        assignedAccountName: isUnassigned
          ? "Shared (All IDs)"
          : (matchAcc ? matchAcc.name : "Connected Account"),
        accountAvatar: matchAcc?.avatarUrl,
        url: cg.url,
      })
    })

    return list
  }, [fbAccounts, customGroups])

  // Set default selection
  useEffect(() => {
    if (allAvailableGroups.length > 0 && selectedGroupIds.length === 0) {
      setSelectedGroupIds([allAvailableGroups[0].id])
    }
  }, [allAvailableGroups, selectedGroupIds])

  // Filtered Groups
  const filteredGroups = useMemo(() => {
    return allAvailableGroups.filter((grp) => {
      const matchesSearch = grp.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "ALL" || grp.category === selectedCategory
      const matchesAccount = selectedAccountFilter === "ALL" || grp.assignedAccountId === selectedAccountFilter
      return matchesSearch && matchesCategory && matchesAccount
    })
  }, [allAvailableGroups, searchQuery, selectedCategory, selectedAccountFilter])

  // Quick Select Handlers
  const handleSelectAll = () => {
    setSelectedGroupIds(filteredGroups.map((g) => g.id))
  }

  const handleSelectHighReach = () => {
    setSelectedGroupIds(filteredGroups.filter((g) => g.memberCount >= 100000).map((g) => g.id))
  }

  const handleDeselectAll = () => {
    setSelectedGroupIds([])
  }

  const toggleGroupSelection = (id: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Handle Asset Library Selection
  const handleAssetSelect = (asset: LibraryAsset) => {
    if (asset.title) setPostTitle(asset.title)
    if (asset.content) setPostContent(asset.content)
    const media = asset.url || asset.videoUrl || ""
    if (media) setMediaUrl(media)
    if (asset.type === "Video") {
      setPostFormat("Video")
    } else if (asset.type === "Image") {
      setPostFormat("Image")
    } else if (asset.type === "Poll") {
      setPostFormat("Poll")
      if (asset.pollOptions && asset.pollOptions.length > 0) {
        setPollOptions(asset.pollOptions)
      }
      if (asset.content) {
        setPollQuestion(asset.content)
      }
    } else {
      setPostFormat("Text")
    }
    setShowLibraryModal(false)
  }

  // Add custom group submit
  const handleAddCustomGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const groupNameTrimmed = newGroupName.trim()
    const groupUrlTrimmed = newGroupUrl.trim()

    if (!groupNameTrimmed) {
      showToast("দয়া করে গ্রুপের নাম লিখুন।", "error")
      return
    }

    if (!groupUrlTrimmed || (!groupUrlTrimmed.includes("facebook.com") && !groupUrlTrimmed.startsWith("http"))) {
      showToast("দয়া করে একটি সঠিক ফেসবুক গ্রুপ URL দিন (যেমন: https://www.facebook.com/groups/...)", "error")
      return
    }

    const chosenAccountId = newGroupAssignedAcc === "none" ? "none" : (newGroupAssignedAcc || "none")
    addGroup({
      name: groupNameTrimmed,
      category: newGroupCategory,
      memberCount: Number(newGroupMembers) || 10000,
      privacy: newGroupPrivacy,
      isManagedAdmin: newGroupIsAdmin,
      assignedAccountId: chosenAccountId,
      url: groupUrlTrimmed,
    })

    setNewGroupName("")
    setNewGroupUrl("")
    setNewGroupAssignedAcc("none")
    setNewGroupIsAdmin(false)
    setShowAddGroupModal(false)
    showToast(`"${groupNameTrimmed}" গ্রুপটি সফলভাবে যোগ করা হয়েছে!`, "success")
  }

  // Delete custom group handler
  const handleDeleteCustomGroup = (id: string, name: string) => {
    deleteGroup(id)
    setSelectedGroupIds((prev) => prev.filter((gid) => gid !== id))
    showToast(`"${name}" গ্রুপটি তালিকা থেকে মুছে ফেলা হয়েছে।`, "info")
  }

  // Launch Multi-Group Auto Dispatch
  const handleLaunchDispatch = () => {
    if (selectedGroupIds.length === 0) {
      showToast("দয়া করে কমপক্ষে একটি ফেসবুক গ্রুপ নির্বাচন করুন।", "error")
      return
    }
    if (!postTitle.trim() || !postContent.trim()) {
      showToast("পোস্টের টাইটেল এবং কনটেন্ট পূরণ করুন।", "error")
      return
    }

    const activeAccounts = fbAccounts.filter((a) => a.status === "Active")
    if (activeAccounts.length === 0) {
      showToast("পোস্ট করার মতো কোনো সক্রিয় ফেসবুক একাউন্ট পাওয়া যায়নি।", "error")
      return
    }

    // Build Jobs
    const jobs: GroupPostJob[] = selectedGroupIds.map((groupId, index) => {
      const groupData = allAvailableGroups.find((g) => g.id === groupId)
      
      // Load balance / account rotation
      let assignedAccount = activeAccounts[index % activeAccounts.length]
      if (
        accountRotationMode === "assigned" &&
        groupData?.assignedAccountId &&
        groupData.assignedAccountId !== "none"
      ) {
        const matched = activeAccounts.find((a) => a.id === groupData.assignedAccountId)
        if (matched) assignedAccount = matched
      }

      // Calculate anti-ban delay
      let delay = 60
      if (delayPreset === "fast") delay = Math.floor(Math.random() * 15) + 15 // 15-30s
      else if (delayPreset === "balanced") delay = Math.floor(Math.random() * 45) + 45 // 45-90s
      else delay = Math.floor(Math.random() * 180) + 120 // 120-300s

      // Spin variation
      let variedContent = postContent
      if (spinVariations && index > 0) {
        const greetings = ["বিশেষ অফার:", "এক্সক্লুসিভ আপডেট:", "অফার নোটিশ:", "স্পেশাল ডিল:"]
        const prefix = greetings[index % greetings.length]
        variedContent = `${prefix}\n${postContent}`
      }

      return {
        id: `job-grp-${Date.now()}-${index}`,
        groupId,
        groupName: groupData?.name || "Facebook Group",
        privacy: groupData?.privacy || "Public",
        memberCount: groupData?.memberCount || "10k+",
        accountId: assignedAccount.id,
        accountName: assignedAccount.name,
        accountAvatar: assignedAccount.avatarUrl,
        postTitle: postFormat === "Poll" ? pollQuestion || postTitle : postTitle,
        postContent:
          postFormat === "Poll"
            ? `${variedContent}\n\n📊 Voting Options:\n${pollOptions.map((o, idx) => `${idx + 1}. ${o}`).join("\n")}`
            : variedContent,
        mediaUrl: postFormat === "Text" || postFormat === "Poll" ? undefined : mediaUrl,
        linkUrl: postFormat === "Story" ? storyLinkSticker : undefined,
        postFormat,
        status: "Pending",
        delaySeconds: index === 0 ? 0 : delay, // 1st post executes immediately
        scheduledAt: new Date().toISOString(),
      }
    })

    addJobsToQueue(jobs)
    setActiveTab("queue")
    showToast(`${jobs.length}টি গ্রুপের জন্য অটো-পোস্টিং কিউ তৈরি করা হয়েছে!`, "success")
    startQueueExecution(jobs)
  }

  // Load Demo Batch (3 Groups) for Instant Testing
  const handleLoadDemoQueue = () => {
    const activeAccounts = fbAccounts.filter((a) => a.status === "Active")
    const sampleGroups = allAvailableGroups.slice(0, 3)
    const demoJobs: GroupPostJob[] = sampleGroups.map((grp, idx) => ({
      id: `job-demo-${Date.now()}-${idx}`,
      groupId: grp.id,
      groupName: grp.name,
      privacy: grp.privacy,
      memberCount: grp.memberCount,
      accountId: activeAccounts[idx % (activeAccounts.length || 1)]?.id || "acc-101",
      accountName: activeAccounts[idx % (activeAccounts.length || 1)]?.name || "Tariqul Islam",
      accountAvatar: activeAccounts[idx % (activeAccounts.length || 1)]?.avatarUrl,
      postTitle: "Eid Special Flash Sale 2026",
      postContent: "স্পেশাল ডিসকাউন্ট অফার! বিস্তারিত জানতে ইনবক্স করুন।",
      mediaUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80",
      postFormat: "Image",
      status: "Pending",
      delaySeconds: idx === 0 ? 0 : 15,
      scheduledAt: new Date().toISOString(),
    }))
    addJobsToQueue(demoJobs)
    setActiveTab("queue")
    showToast("৩টি ডেমো গ্রুপের অটো-পোস্টিং কিউ চালু করা হয়েছে!", "info")
    startQueueExecution(demoJobs)
  }

  // Queue Processing Runner
  const startQueueExecution = async (jobsToRun?: GroupPostJob[]) => {
    isCancelledRef.current = false
    setIsDispatcherRunning(true)

    const currentQueue = jobsToRun || queue
    const pendingJobs = currentQueue.filter((j) => j.status === "Pending")

    for (let i = 0; i < pendingJobs.length; i++) {
      if (isCancelledRef.current) break

      const job = pendingJobs[i]
      setActiveJobIndex(i)
      setActiveJobId(job.id)
      setCurrentJobTotalDelay(job.delaySeconds)

      // Respect anti-ban humanizer countdown
      if (job.delaySeconds > 0) {
        setCurrentJobStep("cooling")
        updateJobStatus(job.id, { status: "Posting" })
        for (let s = job.delaySeconds; s > 0; s--) {
          if (isCancelledRef.current) break
          setCountdownSeconds(s)
          setStatusNotice(
            `Anti-Ban Safety: Cooling down ${s}s before posting to "${job.groupName}" via ${job.accountName}...`
          )
          await new Promise((r) => setTimeout(r, 1000))
        }
      }

      if (isCancelledRef.current) break

      setCountdownSeconds(null)
      setCurrentJobStep("dispatching")
      setStatusNotice(`Posting to "${job.groupName}" via ${job.accountName} (Meta Graph API / Session)...`)
      updateJobStatus(job.id, { status: "Posting" })

      // Dispatch via Real Facebook Puppeteer Bot or Simulation
      try {
        const targetGroupItem = allAvailableGroups.find((g) => g.id === job.groupId)
        const targetGroupUrl = targetGroupItem?.url || ""
        const matchedAccount = fbAccounts.find((a) => a.id === job.accountId)
        const accountCookie = matchedAccount?.tokenOrCookie?.includes("c_user=")
          ? matchedAccount.tokenOrCookie
          : undefined

        const isLiveUrl = targetGroupUrl.startsWith("http://") || targetGroupUrl.startsWith("https://")

        if (dispatchExecutionMode === "live" && isLiveUrl) {
          setStatusNotice(`Launching real Facebook bot for "${job.groupName}" via ${job.accountName}...`)

          const botResponse = await fetch("/api/facebook-bot/launch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accountName: matchedAccount?.name || job.accountName,
              cookieString: accountCookie,
              groups: [
                {
                  groupId: job.groupId,
                  groupName: job.groupName,
                  url: targetGroupUrl,
                },
              ],
              postMessage: `${job.postTitle ? job.postTitle + "\n\n" : ""}${job.postContent}`,
              mediaUrl: job.mediaUrl,
              delaySeconds: 5,
              waitForCompletion: true,
              headless: !showChromeWindow,
            }),
          })

          const botResult = await botResponse.json()

          if (botResponse.ok && botResult.success) {
            const confirmedPostId =
              botResult.results?.[0]?.postId ||
              botResult.jobId ||
              `fb_live_${Date.now().toString().slice(-6)}`

            updateJobStatus(job.id, {
              status: "Success",
              postId: confirmedPostId,
              executedAt: new Date().toISOString(),
            })

            addLog({
              groupId: job.groupId,
              groupName: job.groupName,
              accountId: job.accountId,
              accountName: job.accountName,
              postTitle: job.postTitle,
              contentExcerpt: job.postContent.slice(0, 75) + "...",
              mediaUrl: job.mediaUrl,
              status: "Success",
              responseId: confirmedPostId,
            })
          } else {
            const errorMsg =
              botResult.error ||
              botResult.message ||
              botResult.results?.[0]?.error ||
              "Facebook posting failed"

            updateJobStatus(job.id, {
              status: "Failed",
              error: errorMsg,
            })

            addLog({
              groupId: job.groupId,
              groupName: job.groupName,
              accountId: job.accountId,
              accountName: job.accountName,
              postTitle: job.postTitle,
              contentExcerpt: job.postContent.slice(0, 75) + "...",
              status: "Failed",
              error: errorMsg,
            })
          }
        } else {
          // Simulation / Sandboxed test execution
          await new Promise((r) => setTimeout(r, 1800))
          const simPostId = `sandbox_grp_${job.groupId.replace(/[^a-zA-Z0-9]/g, "")}_${Date.now().toString().slice(-6)}`

          updateJobStatus(job.id, {
            status: "Success",
            postId: simPostId,
            executedAt: new Date().toISOString(),
          })

          addLog({
            groupId: job.groupId,
            groupName: job.groupName,
            accountId: job.accountId,
            accountName: job.accountName,
            postTitle: job.postTitle,
            contentExcerpt: job.postContent.slice(0, 75) + "...",
            mediaUrl: job.mediaUrl,
            status: "Success",
            responseId: `${simPostId} (Sandbox Mode)`,
          })
        }
      } catch (err: any) {
        updateJobStatus(job.id, {
          status: "Failed",
          error: err.message || "Posting failed",
        })

        addLog({
          groupId: job.groupId,
          groupName: job.groupName,
          accountId: job.accountId,
          accountName: job.accountName,
          postTitle: job.postTitle,
          contentExcerpt: job.postContent.slice(0, 75) + "...",
          status: "Failed",
          error: err.message || "Execution error",
        })
      }
    }

    setIsDispatcherRunning(false)
    setActiveJobIndex(null)
    setActiveJobId(null)
    setCurrentJobStep(null)
    setCountdownSeconds(null)
    setStatusNotice("All queued group posts completed!")
    showToast("সকল কিউ করা গ্রুপে সফলভাবে পোস্ট সম্পন্ন হয়েছে!", "success")
  }

  const handleStopExecution = () => {
    isCancelledRef.current = true
    setIsDispatcherRunning(false)
    setStatusNotice("Execution paused by user.")
    showToast("পোস্টিং প্রক্রিয়া সাময়িকভাবে থামানো হয়েছে।", "info")
  }

  const handleClearQueueWithToast = () => {
    clearQueue()
    showToast("পোস্টিং কিউ সফলভাবে খালি করা হয়েছে।", "info")
  }

  const handleClearLogsWithToast = () => {
    clearLogs()
    showToast("অডিট লগ খালি করা হয়েছে।", "info")
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 relative">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 text-white font-semibold text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top-2 duration-200 border border-white/10 ${
            toast.type === "error"
              ? "bg-rose-600"
              : toast.type === "info"
              ? "bg-slate-900 text-slate-100"
              : "bg-emerald-600 text-white"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-white" />
          ) : toast.type === "info" ? (
            <Info className="w-4 h-4 shrink-0 text-blue-300" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 hover:opacity-75 transition p-0.5 rounded text-white/80 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="border-b pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 mb-2">
            <Users className="w-3 h-3 text-blue-500" />
            MODULE 12 • MULTI-GROUP AUTO POSTER
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            Post A Group (Group Poster Automation)
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-2xl">
            Automate multi-account post sharing across high-reach Facebook Public Buy &amp; Sell and Admin Groups with anti-ban delay protection, account load balancing, and real-time execution.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-muted/60 p-1 rounded-xl border overflow-x-auto scrollbar-none flex-nowrap sm:flex-wrap gap-1 max-w-full">
          <button
            onClick={() => setActiveTab("composer")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === "composer"
                ? "bg-background shadow-xs text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Send className="w-3.5 h-3.5 text-blue-500" />
            Composer &amp; Dispatch
          </button>
          <button
            onClick={() => setActiveTab("queue")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === "queue"
                ? "bg-background shadow-xs text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Queue ({queue.length})
          </button>
          <button
            onClick={() => setActiveTab("groups")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === "groups"
                ? "bg-background shadow-xs text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-500" />
            Groups ({allAvailableGroups.length})
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === "logs"
                ? "bg-background shadow-xs text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Audit Ledger ({logs.length})
          </button>
        </div>
      </div>

      {/* Anti-Ban & Humanizer Delay Strategic Banner */}
      <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500 text-white shadow-xs mt-0.5 shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                Anti-Ban Protection &amp; Account Rotation Architecture
              </h2>
              <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-500" /> Smart Load Balancing Enabled
              </span>
            </div>
            <p className="text-xs text-amber-950/80 dark:text-amber-200/80 leading-relaxed">
              Posting to 10+ Facebook groups simultaneously from a single account triggers immediate Facebook spam checkpoints. BMT automatically enforces randomized humanizer intervals (45s–120s) and rotates across your connected accounts from <strong>Module 8 (100 Accounts Engine)</strong> to keep your profiles 100% safe.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border bg-card p-4 rounded-xl shadow-xs space-y-1">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            Reachable Groups
            <Users className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-foreground">{allAvailableGroups.length}</div>
          <div className="text-[10px] text-muted-foreground">Connected via accounts &amp; library</div>
        </div>

        <div className="border bg-card p-4 rounded-xl shadow-xs space-y-1">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            Active Accounts
            <Users className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {fbAccounts.filter((a) => a.status === "Active").length} / {fbAccounts.length}
          </div>
          <div className="text-[10px] text-muted-foreground">With daily share quotas ready</div>
        </div>

        <div className="border bg-card p-4 rounded-xl shadow-xs space-y-1">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            Queued Tasks
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {queue.filter((q) => q.status === "Pending").length}
          </div>
          <div className="text-[10px] text-muted-foreground">Pending anti-ban dispatch</div>
        </div>

        <div className="border bg-card p-4 rounded-xl shadow-xs space-y-1">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            Success Rate
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {logs.length > 0
              ? `${Math.round((logs.filter((l) => l.status === "Success").length / logs.length) * 100)}%`
              : "100%"}
          </div>
          <div className="text-[10px] text-muted-foreground">{logs.length} group dispatches recorded</div>
        </div>
      </div>

      {/* TAB 1: COMPOSER & DISPATCH */}
      {activeTab === "composer" && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Post Composer Column (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="border bg-card p-5 rounded-xl shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="font-extrabold text-sm flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-600" /> 1. Group Post Composer
                </h2>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  Multi-Account Broadcast Ready
                </span>
              </div>

              {/* Post Format & Asset Library Picker (Standardized across BMT) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-xs">Post Format</label>
                  <button
                    type="button"
                    onClick={() => setShowLibraryModal(true)}
                    className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 font-extrabold hover:underline bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Browse Central Asset Library</span>
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-1.5 text-xs font-bold">
                  {(["Text", "Image", "Video", "Reel", "Story", "Poll"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => {
                        setPostFormat(fmt)
                        if (fmt === "Video" || fmt === "Reel") {
                          if (!mediaUrl || !mediaUrl.match(/\.(mp4|mov|webm)/i)) {
                            setMediaUrl("/sample-video.mp4")
                          }
                        } else if (fmt === "Text" || fmt === "Poll") {
                          setMediaUrl("")
                        } else if (fmt === "Image" || fmt === "Story") {
                          if (!mediaUrl || mediaUrl.match(/\.(mp4|mov|webm)/i)) {
                            setMediaUrl("https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80")
                          }
                        }
                      }}
                      className={`py-2 rounded-lg border transition flex flex-col items-center justify-center space-y-1 ${
                        postFormat === fmt
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "hover:bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {fmt === "Text" && <FileText className="w-3.5 h-3.5" />}
                      {fmt === "Image" && <ImageIcon className="w-3.5 h-3.5" />}
                      {fmt === "Video" && <Video className="w-3.5 h-3.5" />}
                      {fmt === "Reel" && <Film className="w-3.5 h-3.5" />}
                      {fmt === "Story" && <Smartphone className="w-3.5 h-3.5" />}
                      {fmt === "Poll" && <Vote className="w-3.5 h-3.5" />}
                      <span className="text-[10px]">{fmt}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Post Details */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold block mb-1 text-foreground">Post Title / Header *</label>
                  <input
                    type="text"
                    required
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="e.g. Eid Mega Sale BD"
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-foreground">Post Caption &amp; Copy *</label>
                    <span className="text-[10px] text-muted-foreground">{postContent.length} chars</span>
                  </div>
                  <textarea
                    rows={4}
                    required
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Write group copy..."
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition leading-relaxed text-xs"
                  />
                </div>

                {/* Creative Media Attachment (Asset Library, Local Upload, Sample Video, URL) */}
                {postFormat !== "Text" && postFormat !== "Poll" && (
                  <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                        {postFormat === "Image" && <ImageIcon className="w-3.5 h-3.5 text-blue-500" />}
                        {postFormat === "Video" && <Video className="w-3.5 h-3.5 text-rose-500" />}
                        {postFormat === "Reel" && <Film className="w-3.5 h-3.5 text-purple-500" />}
                        {postFormat === "Story" && <Smartphone className="w-3.5 h-3.5 text-amber-500" />}
                        <span>{postFormat} Creative Media Attachment</span>
                      </label>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900/60">
                        Facebook Ready
                      </span>
                    </div>

                    {/* Media Actions: 1) Asset Library, 2) Direct File Upload, 3) Sample Video */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setShowLibraryModal(true)}
                        className="flex-1 min-w-[120px] h-8 px-2.5 rounded-lg border border-blue-500/30 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span>From Library</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => localFileInputRef.current?.click()}
                        disabled={isUploadingMedia}
                        className="flex-1 min-w-[120px] h-8 px-2.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        {isUploadingMedia ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Upload File</span>
                          </>
                        )}
                      </button>

                      {(postFormat === "Video" || postFormat === "Reel") && (
                        <button
                          type="button"
                          onClick={() => setMediaUrl("/sample-video.mp4")}
                          className="h-8 px-2.5 rounded-lg border border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Film className="w-3.5 h-3.5" />
                          <span>Sample Video</span>
                        </button>
                      )}
                    </div>

                    {/* Hidden Local File Input */}
                    <input
                      ref={localFileInputRef}
                      type="file"
                      accept={
                        postFormat === "Video" || postFormat === "Reel"
                          ? "video/mp4,video/webm,video/quicktime"
                          : "image/png,image/jpeg,image/webp,image/gif,video/mp4"
                      }
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleLocalFileUpload(file)
                      }}
                    />

                    {/* Media URL Input */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Or Media URL / Path:</span>
                      <input
                        type="text"
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        placeholder={
                          postFormat === "Image"
                            ? "https://.../product.jpg or /uploads/..."
                            : postFormat === "Video" || postFormat === "Reel"
                            ? "/sample-video.mp4 or https://.../video.mp4"
                            : "https://.../story-media.jpg"
                        }
                        className="w-full h-8 px-2.5 border border-border rounded-lg bg-background text-[11px] font-mono text-foreground focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition"
                      />
                    </div>

                    {/* Live Media Visual Preview */}
                    {mediaUrl && (
                      <div className="relative p-2 bg-background border border-border rounded-xl flex items-center gap-3">
                        {mediaUrl.match(/\.(mp4|mov|webm)$/i) || mediaUrl.includes("sample-video") ? (
                          <div className="w-20 h-14 bg-black rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-border">
                            <video src={mediaUrl} className="w-full h-full object-cover" muted />
                          </div>
                        ) : (
                          <div className="w-20 h-14 bg-muted rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-border">
                            <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate text-foreground">
                            {uploadedFileInfo?.name || (mediaUrl.startsWith("http") ? mediaUrl.split("/").pop() : mediaUrl)}
                          </p>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Ready for Group Poster &amp; Facebook Bot</span>
                            {uploadedFileInfo?.size && <span className="text-muted-foreground">({uploadedFileInfo.size})</span>}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setMediaUrl("")
                            setUploadedFileInfo(null)
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* CONDITIONAL FORMAT: REEL SETTINGS */}
                {postFormat === "Reel" && (
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between font-extrabold text-xs text-purple-700 dark:text-purple-300">
                      <span className="flex items-center space-x-1.5">
                        <Film className="w-4 h-4 text-purple-500" />
                        <span>Facebook Group Reel (9:16 Vertical)</span>
                      </span>
                      <span className="text-[10px] bg-purple-500/20 px-2 py-0.5 rounded font-mono">Aspect: 9:16</span>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Audio Credit / Track Name</label>
                      <input
                        type="text"
                        value={reelAudioName}
                        onChange={(e) => setReelAudioName(e.target.value)}
                        placeholder="Original Audio - Trending Sound"
                        className="w-full mt-1 p-2 border rounded-lg bg-background text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* CONDITIONAL FORMAT: STORY SETTINGS */}
                {postFormat === "Story" && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between font-extrabold text-xs text-amber-700 dark:text-amber-300">
                      <span className="flex items-center space-x-1.5">
                        <Smartphone className="w-4 h-4 text-amber-500" />
                        <span>Facebook Group Story (24-Hour Ephemeral)</span>
                      </span>
                      <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded font-bold">24H Expiry</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Link Sticker URL</label>
                        <input
                          type="url"
                          value={storyLinkSticker}
                          onChange={(e) => setStoryLinkSticker(e.target.value)}
                          placeholder="https://bmt.link/..."
                          className="w-full mt-1 p-2 border rounded-lg bg-background text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Sticker Button Text</label>
                        <input
                          type="text"
                          value={storyStickerText}
                          onChange={(e) => setStoryStickerText(e.target.value)}
                          placeholder="Shop Now / Click Deal"
                          className="w-full mt-1 p-2 border rounded-lg bg-background text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* CONDITIONAL FORMAT: POLL CREATOR */}
                {postFormat === "Poll" && (
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-3">
                    <div className="flex items-center justify-between font-extrabold text-xs text-emerald-700 dark:text-emerald-300">
                      <span className="flex items-center space-x-1.5">
                        <Vote className="w-4 h-4 text-emerald-500" />
                        <span>Facebook Group Interactive Poll</span>
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded">
                        Duration: {pollDurationDays} Days
                      </span>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Poll Question *</label>
                      <input
                        type="text"
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                        placeholder="Ask a question for group members..."
                        className="w-full mt-1 p-2 border rounded-lg bg-background text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">
                          Voting Choices ({pollOptions.length}/4)
                        </label>
                        {pollOptions.length < 4 && (
                          <button
                            type="button"
                            onClick={() => setPollOptions([...pollOptions, `New Choice ${pollOptions.length + 1}`])}
                            className="text-[10px] text-emerald-600 font-bold hover:underline flex items-center space-x-0.5"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Option</span>
                          </button>
                        )}
                      </div>
                      {pollOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold text-muted-foreground w-5">#{idx + 1}</span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const updated = [...pollOptions]
                              updated[idx] = e.target.value
                              setPollOptions(updated)
                            }}
                            placeholder={`Option ${idx + 1}`}
                            className="flex-1 p-1.5 border rounded-lg bg-background text-xs"
                          />
                          {pollOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                              className="p-1 text-muted-foreground hover:text-rose-500 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content Spinner Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <div className="space-y-0.5">
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      Anti-Spam Copy Variation Spinner
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Adds varied intro hooks per group so Facebook doesn&apos;t flag repeated text
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={spinVariations}
                    onChange={(e) => setSpinVariations(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Live Facebook Group Post Feed Mockup Preview */}
            <div className="border bg-card p-4 rounded-xl shadow-xs space-y-3">
              <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase border-b pb-2">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-500" /> Live Facebook Group Feed Preview
                </span>
                <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded">Mockup</span>
              </div>

              {/* Feed Card */}
              <div className="p-3.5 rounded-xl border bg-background shadow-xs space-y-3 text-xs">
                {/* Header */}
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs overflow-hidden shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="font-extrabold text-foreground truncate text-xs flex items-center gap-1">
                      {selectedGroupIds.length > 0
                        ? allAvailableGroups.find((g) => g.id === selectedGroupIds[0])?.name || "Selected Group"
                        : "Dhaka Buy and Sell Official Marketplace"}
                    </div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                      <span>Posted by BMT Marketing Lead</span>
                      <span>•</span>
                      <span>Just now</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Globe className="w-2.5 h-2.5 text-muted-foreground" />
                        <span>Public</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="space-y-1.5">
                  <div className="font-bold text-xs text-foreground">{postTitle}</div>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-[11px]">
                    {postContent}
                  </p>
                </div>

                {/* Media / Interactive Format Previews */}
                {postFormat === "Image" && (
                  mediaUrl ? (
                    <div className="h-44 rounded-lg overflow-hidden border bg-muted">
                      <img src={mediaUrl} alt="Post preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-32 rounded-lg border border-dashed flex flex-col items-center justify-center text-muted-foreground bg-muted/20 gap-1">
                      <ImageIcon className="w-6 h-6 text-muted-foreground/60" />
                      <span className="text-[10px]">Photo attachment will show here</span>
                    </div>
                  )
                )}

                {postFormat === "Video" && (
                  mediaUrl ? (
                    <div className="h-44 rounded-lg overflow-hidden border bg-slate-900 flex items-center justify-center text-white relative group">
                      {mediaUrl.endsWith(".mp4") || mediaUrl.includes("/downloads/") ? (
                        <video src={mediaUrl} controls className="w-full h-full object-contain" />
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
                            <Play className="w-6 h-6 fill-white ml-0.5" />
                          </div>
                          <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 px-2 py-0.5 rounded text-white font-mono">
                            Video Attachment
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="h-32 rounded-lg border border-dashed flex flex-col items-center justify-center text-muted-foreground bg-slate-950/5 dark:bg-slate-900/40 gap-1">
                      <Video className="w-6 h-6 text-blue-500/70" />
                      <span className="text-[10px]">Video player will show here</span>
                    </div>
                  )
                )}

                {postFormat === "Reel" && (
                  <div className="rounded-xl border bg-gradient-to-b from-slate-900 to-black p-3 text-white space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="flex items-center gap-1 font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30">
                        <Film className="w-3 h-3" /> Facebook Reel (9:16)
                      </span>
                      <span className="text-muted-foreground">Full Screen Vertical</span>
                    </div>
                    <div className="h-40 rounded-lg bg-slate-800/80 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
                      {mediaUrl ? (
                        <img src={mediaUrl} alt="Reel preview" className="w-full h-full object-cover opacity-75" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-rose-500/30 border border-rose-500/40 flex items-center justify-center">
                          <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] bg-black/60 backdrop-blur-xs px-2 py-1 rounded">
                        <span className="flex items-center gap-1 truncate text-xs font-medium text-white">
                          <Music className="w-3 h-3 text-rose-400 shrink-0" />
                          <span className="truncate">{reelAudioName || "Trending Audio Track"}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {postFormat === "Story" && (
                  <div className="rounded-xl border bg-gradient-to-tr from-amber-500/10 via-pink-500/10 to-purple-500/10 p-3 space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="flex items-center gap-1 font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/30">
                        <Smartphone className="w-3 h-3" /> Facebook Group Story (24h)
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold">Ephemeral Feed</span>
                    </div>
                    <div className="h-40 rounded-lg bg-muted border flex flex-col items-center justify-center relative overflow-hidden">
                      {mediaUrl ? (
                        <img src={mediaUrl} alt="Story preview" className="w-full h-full object-cover" />
                      ) : (
                        <Smartphone className="w-8 h-8 text-purple-400" />
                      )}
                      {storyLinkSticker && (
                        <div className="absolute bottom-3 bg-white text-blue-600 px-3 py-1.5 rounded-full shadow-lg font-bold text-[11px] flex items-center gap-1.5 border border-blue-100 animate-pulse">
                          <Link2 className="w-3 h-3 text-blue-600" />
                          <span>{storyStickerText || "Visit Link"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {postFormat === "Poll" && (
                  <div className="rounded-xl border bg-muted/20 p-3 space-y-2.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <Vote className="w-3 h-3" /> Live Group Poll • {pollDurationDays} Days
                      </span>
                      <span className="text-muted-foreground">Anonymous Voting</span>
                    </div>
                    <div className="font-bold text-xs text-foreground">
                      {pollQuestion || postTitle || "What is your preference?"}
                    </div>
                    <div className="space-y-1.5">
                      {pollOptions.map((opt, idx) => (
                        <div
                          key={idx}
                          className="relative overflow-hidden rounded-lg border bg-background p-2 text-xs font-semibold flex items-center justify-between shadow-xs"
                        >
                          <div
                            className="absolute inset-y-0 left-0 bg-blue-500/10 border-r border-blue-500/20"
                            style={{ width: `${Math.max(10, 85 - idx * 25)}%` }}
                          />
                          <span className="relative z-10 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-blue-600/10 text-blue-600 text-[10px] flex items-center justify-center font-bold">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span>{opt || `Choice ${idx + 1}`}</span>
                          </span>
                          <span className="relative z-10 text-[10px] text-muted-foreground font-mono">
                            {Math.max(10, 85 - idx * 25)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Engagement Bar */}
                <div className="border-t pt-2 flex items-center justify-around text-muted-foreground text-[11px] font-semibold">
                  <button type="button" className="flex items-center gap-1 hover:text-blue-600 transition">
                    <ThumbsUp className="w-3.5 h-3.5" /> Like
                  </button>
                  <button type="button" className="flex items-center gap-1 hover:text-blue-600 transition">
                    <MessageCircle className="w-3.5 h-3.5" /> Comment
                  </button>
                  <button type="button" className="flex items-center gap-1 hover:text-blue-600 transition">
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Group & Account Selector Matrix (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="border bg-card p-5 rounded-xl shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="font-extrabold text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" /> 2. Target Facebook Groups Matrix
                  </h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Select groups to broadcast this post. Accounts rotate automatically.
                  </p>
                </div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/40 px-2.5 py-1 rounded-lg">
                  {selectedGroupIds.length} Selected
                </span>
              </div>

              {/* Search & Category Filter */}
              <div className="space-y-2 text-xs">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search groups by name or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border rounded-lg bg-background text-xs"
                  />
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                  {["ALL", "Buy & Sell", "E-Commerce", "Tech & Gadgets", "Fashion & Lifestyle", "Food & Organic"].map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2.5 py-1 rounded-full whitespace-nowrap font-bold transition border ${
                          selectedCategory === cat
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {cat}
                      </button>
                    )
                  )}
                </div>

                {/* Quick Selection Buttons */}
                <div className="flex items-center justify-between pt-1 text-[11px] font-bold">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-blue-600 hover:underline"
                    >
                      Select All ({filteredGroups.length})
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={handleSelectHighReach}
                      className="text-blue-600 hover:underline"
                    >
                      High Reach (&gt;100K)
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-rose-500 hover:underline"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Group Cards List */}
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {filteredGroups.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-xs">
                    No groups matching search or filter.
                  </div>
                ) : (
                  filteredGroups.map((grp) => {
                    const isSelected = selectedGroupIds.includes(grp.id)
                    return (
                      <div
                        key={grp.id}
                        onClick={() => toggleGroupSelection(grp.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 text-xs ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 shadow-xs"
                            : "hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by parent onClick
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                          />
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-extrabold text-foreground truncate flex items-center gap-1.5">
                              {grp.name}
                              {grp.isManagedAdmin && (
                                <span className="bg-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded">
                                  ADMIN
                                </span>
                              )}
                              {customGroups.some((cg) => cg.id === grp.id) && (
                                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-bold px-1.5 py-0.2 rounded">
                                  CUSTOM
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                              <span className="inline-flex items-center gap-1">
                                <Users className="w-2.5 h-2.5 text-muted-foreground" />
                                <span>{(grp.memberCount / 1000).toFixed(1)}K members</span>
                              </span>
                              <span>•</span>
                              <span>{grp.privacy}</span>
                              <span>•</span>
                              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                {grp.category}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-muted-foreground block">Assigned ID</span>
                          <span className={`text-[11px] font-bold ${grp.assignedAccountId === "none" ? "text-blue-600 dark:text-blue-400" : "text-foreground"}`}>
                            {grp.assignedAccountId === "none"
                              ? "All IDs"
                              : (grp.assignedAccountName?.split(" ")[0] || "Assigned")}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Anti-Ban & Rotation Settings */}
              <div className="space-y-3 border-t pt-4 text-xs">
                <h3 className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Anti-Ban Delay &amp; Rotation Mode
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                      Interval Delay
                    </label>
                    <select
                      value={delayPreset}
                      onChange={(e) => setDelayPreset(e.target.value as any)}
                      className="w-full px-2.5 py-2 border rounded-lg bg-background font-semibold text-xs"
                    >
                      <option value="fast">15s–30s (Testing Mode)</option>
                      <option value="balanced">45s–90s (Recommended)</option>
                      <option value="safe">120s–300s (Conservative)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                      Account Rotation
                    </label>
                    <select
                      value={accountRotationMode}
                      onChange={(e) => setAccountRotationMode(e.target.value as any)}
                      className="w-full px-2.5 py-2 border rounded-lg bg-background font-semibold text-xs"
                    >
                      <option value="auto">Auto Round-Robin (All Active)</option>
                      <option value="assigned">Group-Assigned Account</option>
                    </select>
                  </div>
                </div>

                {/* Execution Engine Switcher: Live vs Simulation */}
                <div className="p-3 rounded-xl border bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] flex items-center gap-1.5 text-foreground">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      Execution Engine
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      dispatchExecutionMode === "live"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    }`}>
                      {dispatchExecutionMode === "live" ? "🟢 Live Real Facebook" : "🧪 Sandbox / Demo"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDispatchExecutionMode("live")}
                      className={`p-2 rounded-lg border text-left transition ${
                        dispatchExecutionMode === "live"
                          ? "border-emerald-600 bg-emerald-50/10 text-foreground font-bold shadow-xs"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <div className="text-xs flex items-center gap-1 text-emerald-600 font-extrabold">
                        <Globe className="w-3.5 h-3.5" /> Live Real Facebook
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Posts directly to Facebook via Puppeteer/Chrome &amp; active cookie
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDispatchExecutionMode("simulation")}
                      className={`p-2 rounded-lg border text-left transition ${
                        dispatchExecutionMode === "simulation"
                          ? "border-amber-600 bg-amber-50/10 text-foreground font-bold shadow-xs"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <div className="text-xs flex items-center gap-1 text-amber-600 font-extrabold">
                        <Sparkles className="w-3.5 h-3.5" /> Sandbox / Demo
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Tests delays, spinner &amp; queue without touching Facebook
                      </div>
                    </button>
                  </div>

                  {dispatchExecutionMode === "live" && (
                    <div className="pt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={showChromeWindow}
                          onChange={(e) => setShowChromeWindow(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>Show Visible Chrome Browser Window while posting</span>
                      </label>
                      <span className="text-[10px] text-emerald-600 font-mono">Real Puppeteer Bot</span>
                    </div>
                  )}
                </div>

                {/* Big Launch Dispatch Button */}
                <button
                  type="button"
                  onClick={handleLaunchDispatch}
                  disabled={selectedGroupIds.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold py-3 rounded-xl shadow-xs transition text-xs flex items-center justify-center gap-2 mt-2"
                >
                  <Send className="w-4 h-4" />
                  Launch Multi-Group Auto Dispatch ({selectedGroupIds.length} Groups)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE QUEUE DISPATCH RUNNER */}
      {activeTab === "queue" && (
        <div className="border bg-card p-5 rounded-xl shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b pb-4 flex-wrap gap-2">
            <div>
              <h2 className="font-extrabold text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" /> Active Dispatch Queue Runner ({queue.length} Tasks)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sequential execution engine with randomized anti-ban countdowns and live status dispatch.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isDispatcherRunning ? (
                <button
                  onClick={handleStopExecution}
                  className="px-3 py-1.5 border border-rose-500/40 bg-rose-500/10 text-rose-600 font-bold text-xs rounded-lg flex items-center gap-1.5"
                >
                  <Pause className="w-3.5 h-3.5" /> Pause Execution
                </button>
              ) : (
                <button
                  onClick={() => startQueueExecution()}
                  disabled={queue.filter((j) => j.status === "Pending").length === 0}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" /> Resume / Start Runner
                </button>
              )}
              {queue.length > 0 && (
                <button
                  onClick={handleClearQueueWithToast}
                  className="px-3 py-1.5 border hover:bg-muted text-muted-foreground hover:text-foreground font-bold text-xs rounded-lg"
                >
                  Clear Queue
                </button>
              )}
            </div>
          </div>

          {/* OVERALL BATCH PROGRESS DASHBOARD */}
          {queue.length > 0 && (
            <div className="p-4 border rounded-xl bg-card space-y-3.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Batch Posting Progress
                  </div>
                  <div className="text-sm font-extrabold text-foreground mt-0.5">
                    Posting to {completedBatchCount + (postingBatchCount > 0 ? 1 : 0)} of {totalBatchCount} Facebook Groups
                  </div>
                </div>

                <div>
                  {isDispatcherRunning ? (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
                      <RotateCw className="w-3.5 h-3.5 animate-spin" /> Batch in Progress ({overallBatchPercentage}%)
                    </span>
                  ) : pendingBatchCount === 0 && totalBatchCount > 0 ? (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> All {totalBatchCount} Groups Completed (100%)
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      Paused / Ready ({overallBatchPercentage}%)
                    </span>
                  )}
                </div>
              </div>

              {/* Master Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-muted-foreground">
                    {completedBatchCount} of {totalBatchCount} Groups Successfully Dispatched
                  </span>
                  <span className="font-mono font-black text-blue-600 dark:text-blue-400">
                    {overallBatchPercentage}%
                  </span>
                </div>
                <div className="w-full bg-muted/70 h-3 rounded-full overflow-hidden p-0.5 border border-border shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500 transition-all duration-500 ease-out shadow-xs"
                    style={{ width: `${overallBatchPercentage}%` }}
                  />
                </div>
              </div>

              {/* 4 Real-time Progress Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
                <div className="p-2.5 rounded-lg border bg-background/80 space-y-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Target Groups</span>
                  <div className="text-base font-black text-foreground">{totalBatchCount} Groups</div>
                </div>

                <div className="p-2.5 rounded-lg border bg-emerald-500/10 border-emerald-500/20 space-y-0.5">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Completed</span>
                  <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {completedBatchCount} ({totalBatchCount > 0 ? Math.round((completedBatchCount / totalBatchCount) * 100) : 0}%)
                  </div>
                </div>

                <div className="p-2.5 rounded-lg border bg-blue-500/10 border-blue-500/20 space-y-0.5">
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase">Current Group</span>
                  <div className="text-xs font-bold text-blue-600 dark:text-blue-400 truncate">
                    {queue.find((j) => j.status === "Posting")?.groupName ||
                      (pendingBatchCount === 0 ? "Completed" : "Waiting...")}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg border bg-amber-500/10 border-amber-500/20 space-y-0.5">
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">In Queue</span>
                  <div className="text-base font-black text-amber-600 dark:text-amber-400">{pendingBatchCount} Groups</div>
                </div>
              </div>
            </div>
          )}

          {/* Status Notice */}
          {statusNotice && (
            <div className="p-3.5 border rounded-xl bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <RotateCw className={`w-4 h-4 ${isDispatcherRunning ? "animate-spin" : ""}`} />
                {statusNotice}
              </span>
              {countdownSeconds !== null && (
                <span className="font-mono text-xs font-black bg-blue-600 text-white px-2 py-0.5 rounded">
                  {countdownSeconds}s
                </span>
              )}
            </div>
          )}

          {/* Queue Tasks Table */}
          {queue.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs space-y-3 border rounded-xl bg-muted/10">
              <div className="text-sm font-bold text-foreground">No posts currently active in queue.</div>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Go to the &ldquo;Composer &amp; Dispatch&rdquo; tab, select groups, and click &ldquo;Launch Multi-Group Auto Dispatch&rdquo;, or load a test batch to see the live progress bars in action.
              </p>
              <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTab("composer")}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Go to Composer &amp; Select Groups
                </button>
                <button
                  type="button"
                  onClick={handleLoadDemoQueue}
                  className="px-4 py-2 border border-border hover:bg-muted text-foreground font-bold rounded-lg transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" /> <span>Load Test Batch (3 Groups)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {queue.map((job, idx) => {
                const jobPct = getJobProgressPercentage(job)
                return (
                  <div
                    key={job.id}
                    className={`p-4 rounded-xl border text-xs space-y-3 transition ${
                      job.status === "Posting"
                        ? "border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs ring-1 ring-blue-500/30"
                        : job.status === "Success"
                        ? "border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/10"
                        : "bg-muted/10"
                    }`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-muted font-mono font-bold text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-extrabold text-foreground">{job.groupName}</span>
                        <span className="text-[10px] text-muted-foreground">({job.privacy})</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          Account: <strong className="text-foreground">{job.accountName}</strong>
                        </span>

                        {job.status === "Pending" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            0% Pending
                          </span>
                        )}
                        {job.status === "Posting" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center gap-1">
                            <RotateCw className="w-2.5 h-2.5 animate-spin" /> {jobPct}% Active
                          </span>
                        )}
                        {job.status === "Success" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> 100% Posted
                          </span>
                        )}
                        {job.status === "Failed" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                            Failed
                          </span>
                        )}

                        <button
                          onClick={() => removeJob(job.id)}
                          className="text-muted-foreground hover:text-rose-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-muted-foreground text-[11px] line-clamp-1">{job.postContent}</p>

                    {/* Per-Group Live Progress Bar */}
                    <div className="space-y-1.5 pt-2 border-t border-border/40">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="text-muted-foreground">Group Progress:</span>
                          <span
                            className={`font-mono font-black ${
                              job.status === "Success"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : job.status === "Posting"
                                ? "text-blue-600 dark:text-blue-400"
                                : job.status === "Failed"
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-muted-foreground"
                            }`}
                          >
                            {jobPct}%
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                          {job.status === "Success" && (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              {job.postId?.startsWith("sandbox_") || job.postId?.startsWith("sim_") || job.postId?.startsWith("fb_grp_")
                                ? "Sandbox / Simulation Mode"
                                : "Live Facebook Confirmed"}
                            </span>
                          )}
                          {job.status === "Posting" && (
                            <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1 font-bold">
                              <RotateCw className="w-3 h-3 animate-spin" />
                              {currentJobStep === "cooling"
                                ? `Anti-Ban Wait: ${countdownSeconds}s remaining`
                                : dispatchExecutionMode === "live"
                                ? "Running Live Facebook Bot..."
                                : "Sandbox Dispatching..."}
                            </span>
                          )}
                          {job.status === "Pending" && "Waiting in Queue"}
                          {job.status === "Failed" && (
                            <span className="text-rose-600 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {job.error || "Failed"}
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden border border-border/40">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            job.status === "Success"
                              ? "bg-emerald-500"
                              : job.status === "Failed"
                              ? "bg-rose-500"
                              : job.status === "Posting"
                              ? "bg-blue-600 animate-pulse"
                              : "bg-muted"
                          }`}
                          style={{ width: `${jobPct}%` }}
                        />
                      </div>
                    </div>

                    {job.postId && (
                      <div className="text-[10px] font-mono flex items-center justify-between pt-0.5">
                        <span className="text-muted-foreground">
                          Response ID: <strong className="text-foreground">{job.postId}</strong>
                        </span>
                        {job.postId?.startsWith("sandbox_") || job.postId?.startsWith("sim_") || job.postId?.startsWith("fb_grp_") ? (
                          <span className="text-amber-600 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded font-semibold text-[9px]">
                            Simulated (No Real FB Post)
                          </span>
                        ) : (
                          <span className="text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded font-semibold text-[9px]">
                            Live Bot Execution
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MANAGED GROUPS */}
      {activeTab === "groups" && (
        <div className="border bg-card rounded-xl shadow-xs overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
            <div>
              <h2 className="font-extrabold text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" /> Managed Facebook Groups ({allAvailableGroups.length})
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Groups aggregated from Module 8 (100 Accounts Engine) and custom imported communities.
              </p>
            </div>
            <button
              onClick={() => setShowAddGroupModal(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Group
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {allAvailableGroups.map((grp) => {
              const isCustom = customGroups.some((cg) => cg.id === grp.id)
              return (
                <div key={grp.id} className="p-3.5 rounded-xl border bg-muted/10 space-y-2 text-xs relative group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-extrabold text-foreground truncate">{grp.name}</div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {grp.isManagedAdmin && (
                        <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          ADMIN
                        </span>
                      )}
                      {isCustom && (
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded">
                          CUSTOM
                        </span>
                      )}
                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomGroup(grp.id, grp.name)}
                          className="text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 p-1 rounded-md transition"
                          title="গ্রুপটি মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                    <span>{(grp.memberCount / 1000).toFixed(1)}K Members</span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">{grp.category}</span>
                  </div>
                  <div className="pt-2 border-t flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground truncate max-w-[170px]">
                      {grp.assignedAccountId === "none" ? (
                        <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Shared / All IDs
                        </span>
                      ) : (
                        <span>Account: <strong className="text-foreground">{grp.assignedAccountName}</strong></span>
                      )}
                    </span>
                    {grp.url && (
                      <a
                        href={grp.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 shrink-0"
                      >
                        Visit <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LEDGER */}
      {activeTab === "logs" && (
        <div className="border bg-card rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Group Post Execution Audit Ledger ({logs.length})
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Full chronological ledger of group posts dispatched via Graph API / Session Dispatcher.
              </p>
            </div>
            {logs.length > 0 && (
              <button
                onClick={handleClearLogsWithToast}
                className="px-3 py-1.5 border rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Logs
              </button>
            )}
          </div>

          {logs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs">
              No group posts recorded yet. Launch your first broadcast from Composer.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground border-b text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Target Group</th>
                    <th className="px-4 py-3">Posting Account</th>
                    <th className="px-4 py-3">Post Title</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Response ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-sans">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/20 transition">
                      <td className="px-4 py-3 whitespace-nowrap text-[11px] text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-bold text-foreground whitespace-nowrap">
                        {log.groupName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {log.accountName}
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground max-w-xs truncate">
                        {log.postTitle}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {log.status === "Success" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {log.responseId || log.error || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Asset Library Picker Modal */}
      <AssetLibraryPickerModal
        isOpen={showLibraryModal}
        onClose={() => setShowLibraryModal(false)}
        onSelect={handleAssetSelect}
      />

      {/* Add Custom Group Modal */}
      {showAddGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-sm text-foreground">Add New Facebook Group</h3>
              <button
                onClick={() => setShowAddGroupModal(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomGroupSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold block mb-1">Group Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bangladesh Tech Sellers Hub"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold block">Facebook Group URL *</label>
                  <span className="text-[10px] text-muted-foreground">লাইভ ফেসবুক গ্রুপের লিংক</span>
                </div>
                <input
                  type="url"
                  required
                  placeholder="https://facebook.com/groups/123456789..."
                  value={newGroupUrl}
                  onChange={(e) => setNewGroupUrl(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  💡 আসল ফেসবুকে পোস্ট করার জন্য আপনার জয়েন করা গ্রুপের সঠিক URL দিন।
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Category</label>
                  <select
                    value={newGroupCategory}
                    onChange={(e) => setNewGroupCategory(e.target.value as any)}
                    className="w-full px-2.5 py-2 border rounded-lg bg-background font-semibold"
                  >
                    <option value="Buy & Sell">Buy &amp; Sell</option>
                    <option value="E-Commerce">E-Commerce</option>
                    <option value="Tech & Gadgets">Tech &amp; Gadgets</option>
                    <option value="Fashion & Lifestyle">Fashion &amp; Lifestyle</option>
                    <option value="Food & Organic">Food &amp; Organic</option>
                    <option value="Community & General">Community</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Member Count</label>
                  <input
                    type="number"
                    value={newGroupMembers}
                    onChange={(e) => setNewGroupMembers(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Privacy</label>
                  <select
                    value={newGroupPrivacy}
                    onChange={(e) => setNewGroupPrivacy(e.target.value as any)}
                    className="w-full px-2.5 py-2 border rounded-lg bg-background font-semibold"
                  >
                    <option value="Public">Public</option>
                    <option value="Private">Private</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={newGroupIsAdmin}
                      onChange={(e) => setNewGroupIsAdmin(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>I am an Admin</span>
                  </label>
                </div>
              </div>

              {/* Assign to Connected Facebook ID / Account */}
              <div className="space-y-2 p-3 rounded-xl border bg-muted/20">
                <div className="flex items-center justify-between">
                  <label className="font-bold block text-foreground flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Assign to Facebook ID / Account</span>
                  </label>
                  <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                    {fbAccounts.length} Connected IDs
                  </span>
                </div>

                <select
                  value={newGroupAssignedAcc}
                  onChange={(e) => setNewGroupAssignedAcc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-xs font-semibold text-foreground focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="none">
                    🌐 None / Unassigned (Shared across all IDs • Auto-Rotation)
                  </option>
                  {fbAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      👤 {acc.name} ({acc.status} • {acc.accountType})
                    </option>
                  ))}
                </select>

                {/* Selected Account Info Card Preview */}
                {newGroupAssignedAcc && newGroupAssignedAcc !== "none" ? (
                  (() => {
                    const selectedAcc = fbAccounts.find((a) => a.id === newGroupAssignedAcc)
                    return (
                      <div className="flex items-center gap-2.5 p-2 rounded-lg border bg-background text-[11px] animate-in fade-in duration-150">
                        {selectedAcc?.avatarUrl ? (
                          <img
                            src={selectedAcc.avatarUrl}
                            alt={selectedAcc.name}
                            className="w-7 h-7 rounded-full object-cover border shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                            {selectedAcc?.name?.slice(0, 2).toUpperCase() || "FB"}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-foreground truncate">{selectedAcc?.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            UID: {selectedAcc?.uid || selectedAcc?.id} • Status: {selectedAcc?.status}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded shrink-0">
                          Assigned ID
                        </span>
                      </div>
                    )
                  })()
                ) : (
                  <div className="p-2 rounded-lg border border-dashed text-[11px] text-muted-foreground flex items-center gap-2 bg-background/50">
                    <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>
                      কোনো নির্দিষ্ট আইডি সিলেক্ট না করলে গ্রুপটি সব আইডির জন্য উন্মুক্ত থাকবে এবং পোস্টিংয়ের সময় অটো-রোটেট হবে।
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-xs transition mt-2"
              >
                Save Group to Directory
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
