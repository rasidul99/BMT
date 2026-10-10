"use client"

import React, { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  Folder,
  Image as ImageIcon,
  Video,
  FileText,
  Link as LinkIcon,
  HelpCircle,
  PlusCircle,
  Search,
  Trash2,
  CalendarClock,
  ExternalLink,
  Tag,
  Check,
  Sparkles,
  Layers,
  Download,
  Upload,
  HardDrive,
  Globe,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react"
import { useAssetLibrary, LibraryAsset } from "../../../../../hooks/useAssetLibrary"

interface ToastNotification {
  message: string
  type: "success" | "error" | "info"
}

export default function SafeLibraryPage() {
  const router = useRouter()
  const params = useParams()
  const workspaceId = (params?.id as string) || "workspace-1"

  const { assets, isLoaded, addAsset, deleteAsset } = useAssetLibrary()

  const [activeCategory, setActiveCategory] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false)
  const [toast, setToast] = useState<ToastNotification | null>(null)

  // New Asset Form State
  const [newType, setNewType] = useState<LibraryAsset["type"]>("Image")
  const [newTitle, setNewTitle] = useState("")
  const [newFolder, setNewFolder] = useState<LibraryAsset["folder"]>("Product Photos")
  const [newContent, setNewContent] = useState("")
  const [newUrl, setNewUrl] = useState("")
  const [newTargetUrl, setNewTargetUrl] = useState("")
  const [newTags, setNewTags] = useState("facebook, marketing, campaign")
  const [pollOptions, setPollOptions] = useState(["Option 1", "Option 2", "Option 3", "Option 4"])

  // Local Media Upload State
  const [uploadMode, setUploadMode] = useState<"local" | "url">("local")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const categories: {
    id: "ALL" | LibraryAsset["type"]
    label: string
    icon: any
    folderName: string
    count: number
  }[] = [
    { id: "ALL", label: "All Assets", icon: Layers, folderName: "ALL", count: assets.length },
    {
      id: "Image",
      label: "Product Photos",
      icon: ImageIcon,
      folderName: "Product Photos",
      count: assets.filter((a) => a.type === "Image" || a.folder === "Product Photos").length,
    },
    {
      id: "Video",
      label: "Videos & Reels",
      icon: Video,
      folderName: "Videos & Reels",
      count: assets.filter((a) => a.type === "Video" || a.folder === "Videos & Reels").length,
    },
    {
      id: "Text",
      label: "Captions & Copy",
      icon: FileText,
      folderName: "Captions & Copy",
      count: assets.filter((a) => a.type === "Text" || a.folder === "Captions & Copy").length,
    },
    {
      id: "Link",
      label: "Link Cards",
      icon: LinkIcon,
      folderName: "Link Cards",
      count: assets.filter((a) => a.type === "Link" || a.folder === "Link Cards").length,
    },
    {
      id: "Poll",
      label: "Polls & Surveys",
      icon: HelpCircle,
      folderName: "Polls & Surveys",
      count: assets.filter((a) => a.type === "Poll" || a.folder === "Polls & Surveys").length,
    },
  ]

  // Filter Assets
  const filteredItems = assets.filter((item) => {
    const matchesCategory =
      activeCategory === "ALL" ||
      item.type === activeCategory ||
      (activeCategory === "Image" && item.folder === "Product Photos") ||
      (activeCategory === "Video" && item.folder === "Videos & Reels") ||
      (activeCategory === "Text" && item.folder === "Captions & Copy") ||
      (activeCategory === "Link" && item.folder === "Link Cards") ||
      (activeCategory === "Poll" && item.folder === "Polls & Surveys")
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      searchQuery === "" ||
      item.title.toLowerCase().includes(q) ||
      (item.content && item.content.toLowerCase().includes(q)) ||
      item.tags.some((t) => t.toLowerCase().includes(q))
    return matchesCategory && matchesSearch
  })

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    const preview = URL.createObjectURL(file)
    setFilePreview(preview)

    // Auto-fill title if empty
    if (!newTitle.trim()) {
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf(".")) || file.name
      setNewTitle(nameWithoutExt.replace(/[-_]/g, " "))
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  // Handle Form Submission
  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    let finalMediaUrl = newUrl
    let finalSize = newType === "Video" ? "14.2 MB" : newType === "Image" || newType === "Link" ? "2.1 MB" : "1.5 KB"

    // If uploading local file from device for Image, Video, or Link
    if ((newType === "Image" || newType === "Video" || newType === "Link") && uploadMode === "local") {
      if (selectedFile) {
        setIsUploading(true)
        try {
          const formData = new FormData()
          formData.append("file", selectedFile)

          const res = await fetch("/api/media/upload", {
            method: "POST",
            body: formData,
          })

          if (res.ok) {
            const data = await res.json()
            finalMediaUrl = data.url
            if (data.size) finalSize = `${data.size} (Local Storage)`
          } else {
            finalMediaUrl = filePreview || URL.createObjectURL(selectedFile)
            const mb = (selectedFile.size / (1024 * 1024)).toFixed(1)
            finalSize = `${mb} MB (Local Device)`
          }
        } catch (err) {
          console.warn("Upload fallback triggered:", err)
          finalMediaUrl = filePreview || URL.createObjectURL(selectedFile)
        } finally {
          setIsUploading(false)
        }
      } else if (!finalMediaUrl) {
        showToast("Please select a file from your device or switch to Web URL.", "error")
        return
      }
    }

    const fallbackImage = "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop"

    addAsset({
      title: newTitle,
      type: newType,
      folder: newFolder,
      content: newType === "Text" || newType === "Poll" ? newContent : undefined,
      url: newType === "Text" ? undefined : finalMediaUrl || fallbackImage,
      videoUrl: newType === "Video" ? finalMediaUrl || "/sample-video.mp4" : undefined,
      thumbnailUrl: newType === "Video" ? (finalMediaUrl?.endsWith(".mp4") ? undefined : finalMediaUrl) : undefined,
      targetUrl: newType === "Link" ? newTargetUrl || "https://bmt.cards/product-offer" : undefined,
      pollOptions: newType === "Poll" ? pollOptions.filter((o) => o.trim().length > 0) : undefined,
      tags: newTags.split(",").map((t) => t.trim()).filter(Boolean),
      size: finalSize,
    })

    setShowUploadModal(false)
    setNewTitle("")
    setNewContent("")
    setNewUrl("")
    setNewTargetUrl("")
    setSelectedFile(null)
    setFilePreview(null)
    showToast(`New ${newType} asset saved persistently to Central Library!`, "success")
  }

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Remove "${title}" from Central Library?`)) {
      deleteAsset(id)
      showToast("Asset deleted from Library.", "info")
    }
  }

  const handleUseInScheduler = (item: LibraryAsset) => {
    router.push(`/workspace/${workspaceId}/safe/post-scheduler?libraryAssetId=${item.id}&type=${item.type}`)
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-16 right-4 sm:right-6 z-50 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150 ${
            toast.type === "error"
              ? "bg-destructive text-destructive-foreground"
              : "bg-blue-600 text-white"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Central Asset Library
            </h1>
            <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-blue-500/20">
              Persistent Storage
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Manage your marketing assets (Images, Videos, Captions, Link Cards & Polls) with instant one-click Post Scheduler integration.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="w-full sm:w-auto h-10 sm:h-9 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-xs px-4 rounded-xl transition shadow-xs flex items-center justify-center gap-2 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Asset to Library</span>
        </button>
      </div>

      {/* 2. Format Counts Metric Row (Monochromatic Google-Minimalist) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 text-xs">
        {[
          { label: "Total Assets", count: assets.length, icon: Layers },
          { label: "Images", count: assets.filter((a) => a.type === "Image").length, icon: ImageIcon },
          { label: "Videos", count: assets.filter((a) => a.type === "Video").length, icon: Video },
          { label: "Captions", count: assets.filter((a) => a.type === "Text").length, icon: FileText },
          { label: "Link Cards", count: assets.filter((a) => a.type === "Link").length, icon: LinkIcon },
          { label: "Polls", count: assets.filter((a) => a.type === "Poll").length, icon: HelpCircle },
        ].map((m, idx) => {
          const Icon = m.icon
          return (
            <div
              key={idx}
              className="border border-border bg-card p-3 rounded-xl shadow-xs flex flex-col justify-between hover:border-blue-500/40 transition group"
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[11px] font-semibold text-muted-foreground tracking-tight">
                  {m.label}
                </span>
                <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {m.count}
              </div>
            </div>
          )
        })}
      </div>

      {/* 3. Unified Category Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Searchbar: Full width on mobile, right-aligned on desktop */}
        <div className="relative w-full sm:w-72 order-1 sm:order-2">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search assets, captions or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 h-10 sm:h-9 border border-border rounded-xl bg-card text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-foreground transition placeholder:text-muted-foreground/70"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills: Smooth horizontal scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar scroll-smooth order-2 sm:order-1 -mx-1 px-1">
          {categories.map((cat) => {
            const Icon = cat.icon
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs font-bold"
                    : "bg-card border border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-muted-foreground"}`} />
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5 ${
                    isActive
                      ? "bg-blue-700/80 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 4. Asset Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full border border-dashed border-border p-12 text-center rounded-2xl bg-card/50 space-y-2">
            <div className="w-12 h-12 rounded-xl bg-muted/60 text-muted-foreground mx-auto flex items-center justify-center">
              <Folder className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">No assets found in this folder</p>
            <p className="text-xs text-muted-foreground">Click "Add Asset to Library" to create your first content item.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="border border-border bg-card rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between group hover:border-blue-500/50 hover:shadow-md transition duration-200"
            >
              <div className="space-y-2">
                {/* Visual Preview according to type */}
                {item.type === "Video" ? (
                  <div className="h-44 sm:h-48 bg-black relative overflow-hidden group flex items-center justify-center">
                    {item.videoUrl || (item.url && (item.url.endsWith(".mp4") || item.url.startsWith("/downloads/"))) ? (
                      <video
                        src={item.videoUrl || item.url}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={item.thumbnailUrl || item.url || "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600&auto=format&fit=crop"}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    )}
                    <span className="absolute top-2 left-2 bg-black/75 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1 pointer-events-none">
                      <Video className="w-3 h-3 text-blue-400" />
                      <span>Video</span>
                    </span>
                    <span className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-xs pointer-events-none">
                      {item.folder}
                    </span>
                  </div>
                ) : item.type === "Image" || item.type === "Link" ? (
                  <div className="h-44 sm:h-48 bg-muted relative overflow-hidden group">
                    <img
                      src={item.url || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop"}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-2 left-2 bg-black/75 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1 pointer-events-none">
                      {item.type === "Image" ? <ImageIcon className="w-3 h-3 text-blue-400" /> : <LinkIcon className="w-3 h-3 text-blue-400" />}
                      <span>{item.type}</span>
                    </span>
                    <span className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-xs pointer-events-none">
                      {item.folder}
                    </span>
                    {item.type === "Link" && item.targetUrl && (
                      <div className="absolute bottom-0 inset-x-0 bg-black/80 text-white px-2.5 py-1 text-[10px] truncate flex items-center gap-1 font-mono">
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{item.targetUrl}</span>
                      </div>
                    )}
                  </div>
                ) : item.type === "Text" ? (
                  <div className="h-44 sm:h-48 bg-muted/40 p-4 flex flex-col justify-between border-b border-border relative">
                    <span className="bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded-md w-fit border border-blue-200 dark:border-blue-900/40 flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      <span>Caption / Hook</span>
                    </span>
                    <p className="text-xs font-medium text-foreground line-clamp-4 italic leading-relaxed">
                      "{item.content}"
                    </p>
                    <span className="text-[10px] font-medium text-muted-foreground">{item.folder}</span>
                  </div>
                ) : (
                  /* Poll Item Preview */
                  <div className="h-44 sm:h-48 bg-muted/40 p-3.5 flex flex-col justify-between border-b border-border relative">
                    <div className="space-y-1.5">
                      <span className="bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded-md w-fit border border-blue-200 dark:border-blue-900/40 flex items-center gap-1">
                        <HelpCircle className="w-3 h-3" />
                        <span>Interactive Poll</span>
                      </span>
                      <p className="text-xs font-semibold text-foreground line-clamp-2">{item.content}</p>
                    </div>
                    <div className="space-y-1">
                      {item.pollOptions?.slice(0, 2).map((opt, i) => (
                        <div key={i} className="text-[10px] bg-card border border-border px-2 py-1 rounded-md truncate text-muted-foreground">
                          {i + 1}. {opt}
                        </div>
                      ))}
                      {item.pollOptions && item.pollOptions.length > 2 && (
                        <span className="text-[9px] text-muted-foreground">
                          +{item.pollOptions.length - 2} more options
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Info & Tags */}
                <div className="p-3.5 space-y-2">
                  <h3 className="font-bold text-xs text-foreground line-clamp-2 leading-snug">{item.title}</h3>

                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-muted px-1.5 py-0.5 rounded-md text-[9px] font-medium text-muted-foreground"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-2 border-t border-border">
                    <span>{item.size}</span>
                    <span>{item.uploadedAt}</span>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="p-3 bg-muted/20 border-t border-border flex items-center justify-between gap-2">
                <button
                  onClick={() => handleUseInScheduler(item)}
                  className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-semibold px-3 rounded-xl transition text-center flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <CalendarClock className="w-3.5 h-3.5" />
                  <span>Use in Scheduler</span>
                </button>
                {item.type === "Video" && (item.videoUrl || item.url) && (
                  <a
                    href={`/api/media/download?format=video&filename=${encodeURIComponent(item.title.slice(0, 30))}.mp4&file=${encodeURIComponent(item.videoUrl || item.url || "")}`}
                    download
                    className="w-9 h-9 border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl text-xs transition flex items-center justify-center shrink-0"
                    title="Download to PC"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => handleDelete(item.id, item.title)}
                  className="w-9 h-9 border border-border hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-xl text-xs transition flex items-center justify-center shrink-0"
                  title="Delete Asset"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 5. Create New Asset Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-foreground">Add New Asset to Library</h2>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type Selector Tabs in Modal */}
            <div className="grid grid-cols-5 gap-1 p-1 bg-muted/60 rounded-xl text-xs">
              {(["Image", "Video", "Text", "Link", "Poll"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setNewType(t)
                    if (t === "Image") setNewFolder("Product Photos")
                    else if (t === "Video") setNewFolder("Videos & Reels")
                    else if (t === "Text") setNewFolder("Captions & Copy")
                    else if (t === "Link") setNewFolder("Link Cards")
                    else if (t === "Poll") setNewFolder("Polls & Surveys")
                  }}
                  className={`py-1.5 font-semibold rounded-lg transition text-center text-xs ${
                    newType === t ? "bg-card text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <form onSubmit={handleCreateAsset} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-foreground">Asset Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Special Offer Post"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-10 px-3 border border-border rounded-xl bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-foreground">Folder Category</label>
                <select
                  value={newFolder}
                  onChange={(e) => setNewFolder(e.target.value as any)}
                  className="w-full h-10 px-3 border border-border rounded-xl bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                >
                  <option value="Product Photos">Product Photos</option>
                  <option value="Videos & Reels">Videos & Reels</option>
                  <option value="Captions & Copy">Captions & Copy</option>
                  <option value="Link Cards">Link Cards</option>
                  <option value="Polls & Surveys">Polls & Surveys</option>
                </select>
              </div>

              {/* Conditional Inputs based on Type */}
              {newType === "Text" && (
                <div>
                  <label className="font-semibold block mb-1 text-foreground">Caption / Copywriting Content *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Write marketing caption, hook, or sales pitch..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full p-3 border border-border rounded-xl bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              )}

              {newType === "Poll" && (
                <div className="space-y-2">
                  <label className="font-semibold block mb-1 text-foreground">Poll Question *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Which feature should we build next?"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full h-10 px-3 border border-border rounded-xl bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                  <label className="font-semibold block text-[11px] text-muted-foreground">Poll Options (Min 2)</label>
                  {pollOptions.map((opt, i) => (
                    <input
                      key={i}
                      type="text"
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const copy = [...pollOptions]
                        copy[i] = e.target.value
                        setPollOptions(copy)
                      }}
                      className="w-full h-9 px-3 border border-border rounded-xl bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  ))}
                </div>
              )}

              {(newType === "Image" || newType === "Video" || newType === "Link") && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold block text-foreground">Media Source *</label>
                    {/* Toggle Local vs URL */}
                    <div className="flex items-center bg-muted/70 p-0.5 rounded-xl border border-border">
                      <button
                        type="button"
                        onClick={() => setUploadMode("local")}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                          uploadMode === "local"
                            ? "bg-card text-foreground shadow-xs font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <HardDrive className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span>From Device / PC</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadMode("url")}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                          uploadMode === "url"
                            ? "bg-card text-foreground shadow-xs font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Globe className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span>Web URL</span>
                      </button>
                    </div>
                  </div>

                  {uploadMode === "local" ? (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={newType === "Video" ? "video/*" : "image/*"}
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileSelect(e.target.files[0])
                          }
                        }}
                      />

                      {selectedFile && filePreview ? (
                        <div className="border border-border bg-muted/30 p-3 rounded-xl flex items-center gap-3">
                          <div className="w-16 h-16 rounded-xl overflow-hidden border border-border bg-black/5 shrink-0 flex items-center justify-center">
                            {newType === "Video" ? (
                              <video src={filePreview} className="w-full h-full object-cover" />
                            ) : (
                              <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-xs text-foreground truncate">{selectedFile.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || "Media file"}
                            </p>
                            <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Ready to upload
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-2.5 py-1.5 border border-border rounded-xl bg-card hover:bg-muted text-xs font-semibold text-foreground transition"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <div
                          onDragOver={(e) => {
                            e.preventDefault()
                            setIsDragging(true)
                          }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                            isDragging
                              ? "border-blue-500 bg-blue-500/10"
                              : "border-border hover:border-blue-500/60 bg-muted/20 hover:bg-muted/40"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground">
                              Click to browse or drag & drop {newType === "Video" ? "video" : "image"}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {newType === "Video"
                                ? "MP4, MOV, WEBM (up to 100MB)"
                                : "JPG, PNG, WEBP, GIF (up to 25MB)"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/... or https://cdn..."
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        className="w-full h-10 px-3 border border-border rounded-xl bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Paste any public image/video URL, CDN link or cloud storage URL.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {newType === "Link" && (
                <div>
                  <label className="font-semibold block mb-1 text-foreground">Target Redirect Link *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://yourwebsite.com/product-landing"
                    value={newTargetUrl}
                    onChange={(e) => setNewTargetUrl(e.target.value)}
                    className="w-full h-10 px-3 border border-border rounded-xl bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              )}

              <div>
                <label className="font-semibold block mb-1 text-foreground">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. eid, promo, deal"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full h-10 px-3 border border-border rounded-xl bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="h-10 sm:h-9 px-4 border border-border rounded-xl font-semibold hover:bg-muted text-muted-foreground text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="h-10 sm:h-9 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 text-white font-semibold rounded-xl shadow-xs flex items-center gap-1.5 text-xs transition"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading to Storage...</span>
                    </>
                  ) : (
                    <span>Save to Library</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
