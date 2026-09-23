"use client"

import React, { useState } from "react"
import { useAssetLibrary, LibraryAsset } from "../../hooks/useAssetLibrary"
import { X, Search, Image as ImageIcon, Video, FileText, Vote, ExternalLink, Check, Sparkles } from "lucide-react"

interface AssetLibraryPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (asset: LibraryAsset) => void
}

export function AssetLibraryPickerModal({ isOpen, onClose, onSelect }: AssetLibraryPickerModalProps) {
  const { assets } = useAssetLibrary()
  const [search, setSearch] = useState("")
  const [selectedType, setSelectedType] = useState<string>("ALL")

  if (!isOpen) return null

  const filteredAssets = assets.filter((asset) => {
    const matchesType = selectedType === "ALL" || asset.type === selectedType
    const matchesSearch =
      asset.title.toLowerCase().includes(search.toLowerCase()) ||
      (asset.content && asset.content.toLowerCase().includes(search.toLowerCase())) ||
      asset.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    return matchesType && matchesSearch
  })

  const getTypeIcon = (type: LibraryAsset["type"]) => {
    switch (type) {
      case "Image":
        return <ImageIcon className="w-4 h-4 text-blue-500" />
      case "Video":
        return <Video className="w-4 h-4 text-rose-500" />
      case "Poll":
        return <Vote className="w-4 h-4 text-emerald-500" />
      case "Link":
        return <ExternalLink className="w-4 h-4 text-amber-500" />
      default:
        return <FileText className="w-4 h-4 text-purple-500" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-blue-600/10 text-blue-600 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-base text-foreground">Import from Central Asset Library</h3>
              <p className="text-[11px] text-muted-foreground">
                Select an approved product photo, viral video, caption, or poll to schedule
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground font-bold p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search assets by title, caption, or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border rounded-lg bg-background text-xs"
            />
          </div>

          <div className="flex items-center space-x-1 overflow-x-auto text-[11px] font-bold">
            {["ALL", "Image", "Video", "Text", "Poll", "Link"].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-2.5 py-1 rounded-lg border transition ${
                  selectedType === t
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Asset Grid */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[260px] max-h-[420px]">
          {filteredAssets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-xs space-y-1">
              <p className="font-bold">No assets found</p>
              <p className="text-[11px]">Try adjusting your search or add items to Central Library first.</p>
            </div>
          ) : (
            filteredAssets.map((asset) => (
              <div
                key={asset.id}
                onClick={() => {
                  onSelect(asset)
                  onClose()
                }}
                className="group border border-border/80 hover:border-blue-500 rounded-xl p-3 bg-muted/20 hover:bg-muted/40 transition cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  {/* Thumbnail / Icon */}
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden border shrink-0">
                    {asset.url || asset.thumbnailUrl ? (
                      <img
                        src={asset.thumbnailUrl || asset.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getTypeIcon(asset.type)
                    )}
                  </div>

                  {/* Asset Info */}
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-xs text-foreground group-hover:text-blue-600 transition truncate">
                        {asset.title}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground shrink-0 flex items-center space-x-1">
                        {getTypeIcon(asset.type)}
                        <span>{asset.type}</span>
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {asset.content || asset.url || asset.targetUrl || "Asset attached"}
                    </p>

                    <div className="flex items-center space-x-2 text-[10px] text-muted-foreground">
                      <span>Folder: {asset.folder}</span>
                      <span>•</span>
                      <span>Added: {asset.uploadedAt}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="bg-blue-600 group-hover:bg-blue-700 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow-sm shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Select</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t pt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {filteredAssets.length} approved assets</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border font-bold hover:bg-muted text-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
