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
} from "lucide-react"
import { useAssetLibrary, LibraryAsset } from "../../../../../hooks/useAssetLibrary"

export default function SafeLibraryPage() {
  const router = useRouter()
  const params = useParams()
  const workspaceId = (params?.id as string) || "workspace-1"

  const { assets, isLoaded, addAsset, deleteAsset } = useAssetLibrary()

  const [activeCategory, setActiveCategory] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // New Asset Form State
  const [newType, setNewType] = useState<LibraryAsset["type"]>("Image")
  const [newTitle, setNewTitle] = useState("")
  const [newFolder, setNewFolder] = useState<LibraryAsset["folder"]>("Product Photos")
  const [newContent, setNewContent] = useState("")
  const [newUrl, setNewUrl] = useState("")
  const [newTargetUrl, setNewTargetUrl] = useState("")
  const [newTags, setNewTags] = useState("facebook, marketing, campaign")
  const [pollOptions, setPollOptions] = useState(["Option 1", "Option 2", "Option 3", "Option 4"])

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
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

  // Handle Form Submission
  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    const fallbackImage = "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop"

    addAsset({
      title: newTitle,
      type: newType,
      folder: newFolder,
      content: newType === "Text" || newType === "Poll" ? newContent : undefined,
      url: newType === "Text" ? undefined : newUrl || fallbackImage,
      targetUrl: newType === "Link" ? newTargetUrl || "https://bmt.cards/product-offer" : undefined,
      pollOptions: newType === "Poll" ? pollOptions.filter((o) => o.trim().length > 0) : undefined,
      tags: newTags.split(",").map((t) => t.trim()).filter(Boolean),
      size: newType === "Video" ? "14.2 MB" : newType === "Image" || newType === "Link" ? "2.1 MB" : "1.5 KB",
    })

    setShowUploadModal(false)
    setNewTitle("")
    setNewContent("")
    setNewUrl("")
    setNewTargetUrl("")
    showToast(`✓ New ${newType} asset saved persistently to Central Library!`)
  }

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Remove "${title}" from Central Library?`)) {
      deleteAsset(id)
      showToast("✓ Asset deleted from Library.")
    }
  }

  const handleUseInScheduler = (item: LibraryAsset) => {
    router.push(`/workspace/${workspaceId}/safe/post-scheduler?libraryAssetId=${item.id}&type=${item.type}`)
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Central Asset Library
            </h1>
            <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/20">
              Persistent Storage
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your marketing assets (Images, Videos, Captions, Link Cards & Polls) with instant one-click Post Scheduler integration.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition shadow-xs flex items-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Asset to Library</span>
        </button>
      </div>

      {/* 2. Format Counts Metric Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="border border-border bg-card p-3 rounded-xl shadow-xs">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Assets</span>
          <div className="text-xl font-black text-foreground mt-0.5">{assets.length}</div>
        </div>
        <div className="border border-border bg-card p-3 rounded-xl shadow-xs">
          <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
            <ImageIcon className="w-3 h-3 text-blue-500" /> Images
          </span>
          <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
            {assets.filter((a) => a.type === "Image").length}
          </div>
        </div>
        <div className="border border-border bg-card p-3 rounded-xl shadow-xs">
          <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
            <Video className="w-3 h-3 text-red-500" /> Videos
          </span>
          <div className="text-xl font-black text-red-600 dark:text-red-400 mt-0.5">
            {assets.filter((a) => a.type === "Video").length}
          </div>
        </div>
        <div className="border border-border bg-card p-3 rounded-xl shadow-xs">
          <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
            <FileText className="w-3 h-3 text-emerald-500" /> Captions
          </span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            {assets.filter((a) => a.type === "Text").length}
          </div>
        </div>
        <div className="border border-border bg-card p-3 rounded-xl shadow-xs">
          <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
            <LinkIcon className="w-3 h-3 text-purple-500" /> Link Cards
          </span>
          <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
            {assets.filter((a) => a.type === "Link").length}
          </div>
        </div>
        <div className="border border-border bg-card p-3 rounded-xl shadow-xs">
          <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-amber-500" /> Polls
          </span>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
            {assets.filter((a) => a.type === "Poll").length}
          </div>
        </div>
      </div>

      {/* 3. Unified Category Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
        {/* Unified Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar order-2 md:order-1">
          {categories.map((cat) => {
            const Icon = cat.icon
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs font-bold"
                    : "bg-card border border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-muted-foreground"}`} />
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-0.5 ${
                    isActive
                      ? "bg-blue-700 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Searchbar: On top on mobile, right side on desktop */}
        <div className="relative w-full md:w-64 order-1 md:order-2">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search assets or #tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-border rounded-lg bg-card text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-foreground"
          />
        </div>
      </div>

      {/* 4. Asset Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full border border-dashed border-border p-12 text-center rounded-xl space-y-2">
            <Folder className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-semibold text-foreground">No assets found in this folder</p>
            <p className="text-xs text-muted-foreground">Click "Add Asset to Library" to create your first content item.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="border border-border bg-card rounded-xl overflow-hidden shadow-xs flex flex-col justify-between group hover:border-blue-500/60 transition"
            >
              <div className="space-y-2">
                {/* Visual Preview according to type */}
                {item.type === "Video" ? (
                  <div className="h-44 bg-black relative overflow-hidden group flex items-center justify-center">
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
                    <span className="absolute top-2 left-2 bg-black/75 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur flex items-center gap-1 pointer-events-none">
                      <Video className="w-3 h-3 text-red-400" />
                      <span>Video</span>
                    </span>
                    <span className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs pointer-events-none">
                      {item.folder}
                    </span>
                  </div>
                ) : item.type === "Image" || item.type === "Link" ? (
                  <div className="h-44 bg-muted relative overflow-hidden group">
                    <img
                      src={item.url || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop"}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-2 left-2 bg-black/75 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur flex items-center gap-1">
                      {item.type === "Image" && <ImageIcon className="w-3 h-3 text-blue-400" />}
                      {item.type === "Link" && <LinkIcon className="w-3 h-3 text-purple-400" />}
                      <span>{item.type}</span>
                    </span>
                    <span className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                      {item.folder}
                    </span>
                    {item.type === "Link" && item.targetUrl && (
                      <div className="absolute bottom-0 inset-x-0 bg-black/80 text-white px-2 py-1 text-[10px] truncate flex items-center gap-1 font-mono">
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{item.targetUrl}</span>
                      </div>
                    )}
                  </div>
                ) : item.type === "Text" ? (
                  <div className="h-44 bg-blue-500/5 p-4 flex flex-col justify-between border-b border-border relative">
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded w-fit border border-emerald-500/20 flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      <span>Caption / Hook</span>
                    </span>
                    <p className="text-xs font-medium text-foreground line-clamp-4 italic">
                      "{item.content}"
                    </p>
                    <span className="text-[10px] text-muted-foreground">{item.folder}</span>
                  </div>
                ) : (
                  /* Poll Item Preview */
                  <div className="h-44 bg-amber-500/5 p-3.5 flex flex-col justify-between border-b border-border relative">
                    <div className="space-y-1.5">
                      <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded w-fit border border-amber-500/20 flex items-center gap-1">
                        <HelpCircle className="w-3 h-3" />
                        <span>Interactive Poll</span>
                      </span>
                      <p className="text-xs font-bold text-foreground line-clamp-2">{item.content}</p>
                    </div>
                    <div className="space-y-1">
                      {item.pollOptions?.slice(0, 2).map((opt, i) => (
                        <div key={i} className="text-[10px] bg-card border border-border px-2 py-0.5 rounded truncate text-muted-foreground">
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
                  <h3 className="font-bold text-xs text-foreground line-clamp-2">{item.title}</h3>

                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-muted px-1.5 py-0.5 rounded text-[9px] font-medium text-muted-foreground"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border">
                    <span>{item.size}</span>
                    <span>{item.uploadedAt}</span>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="p-3 bg-muted/20 border-t border-border flex items-center justify-between gap-2">
                <button
                  onClick={() => handleUseInScheduler(item)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-1.5 px-2 rounded-lg transition text-center flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <CalendarClock className="w-3.5 h-3.5" />
                  <span>Use in Scheduler</span>
                </button>
                {item.type === "Video" && (item.videoUrl || item.url) && (
                  <a
                    href={`/api/media/download?format=video&filename=${encodeURIComponent(item.title.slice(0, 30))}.mp4&file=${encodeURIComponent(item.videoUrl || item.url || "")}`}
                    download
                    className="p-1.5 border border-border hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs transition"
                    title="Download to PC"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => handleDelete(item.id, item.title)}
                  className="p-1.5 border border-border hover:bg-destructive/10 text-destructive rounded-lg text-xs transition"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-lg rounded-xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <h2 className="text-base font-extrabold text-foreground">Add New Asset to Library</h2>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Type Selector Tabs in Modal */}
            <div className="grid grid-cols-5 gap-1.5 p-1 bg-muted/60 rounded-lg text-xs">
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
                  className={`py-1.5 font-bold rounded-md transition text-center text-[11px] ${
                    newType === t ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <form onSubmit={handleCreateAsset} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold block mb-1 text-foreground">Asset Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Special Offer Post"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-foreground">Folder Category</label>
                <select
                  value={newFolder}
                  onChange={(e) => setNewFolder(e.target.value as any)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground font-medium"
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
                  <label className="font-bold block mb-1 text-foreground">Caption / Copywriting Content *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Write marketing caption, hook, or sales pitch..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>
              )}

              {newType === "Poll" && (
                <div className="space-y-2">
                  <label className="font-bold block mb-1 text-foreground">Poll Question *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Which feature should we build next?"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  />
                  <label className="font-bold block text-[11px] text-muted-foreground">Poll Options (Min 2)</label>
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
                      className="w-full px-3 py-1.5 border border-border rounded-lg bg-background text-foreground text-xs"
                    />
                  ))}
                </div>
              )}

              {(newType === "Image" || newType === "Video" || newType === "Link") && (
                <div>
                  <label className="font-bold block mb-1 text-foreground">Media URL (CDN, Cloudflare R2, Unsplash) *</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>
              )}

              {newType === "Link" && (
                <div>
                  <label className="font-bold block mb-1 text-foreground">Target Redirect Link *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://yourwebsite.com/product-landing"
                    value={newTargetUrl}
                    onChange={(e) => setNewTargetUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>
              )}

              <div>
                <label className="font-bold block mb-1 text-foreground">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. eid, promo, deal"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-border rounded-lg font-semibold hover:bg-muted text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Save to Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
