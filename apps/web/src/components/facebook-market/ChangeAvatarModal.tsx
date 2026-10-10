"use client"

import React, { useState, useEffect, useRef } from "react"
import { FacebookAccountItem } from "../../hooks/useFacebookAccounts"
import { Camera, Upload, Link as LinkIcon, RefreshCw, X, Check, Image as ImageIcon } from "lucide-react"

interface ChangeAvatarModalProps {
  isOpen: boolean
  onClose: () => void
  account: FacebookAccountItem | null
  onSave: (accountId: string, newAvatarUrl: string) => void
}

export function ChangeAvatarModal({
  isOpen,
  onClose,
  account,
  onSave,
}: ChangeAvatarModalProps) {
  const [avatarUrl, setAvatarUrl] = useState("")
  const [previewError, setPreviewError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (account) {
      setAvatarUrl(account.avatarUrl || "")
      setPreviewError(false)
    }
  }, [account, isOpen])

  if (!isOpen || !account) return null

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert("Please select an image smaller than 2MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setAvatarUrl(event.target.result)
        setPreviewError(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleFetchFacebookPhoto = () => {
    if (!account.uid) {
      alert("No Facebook UID found for this account.")
      return
    }
    const fbPhoto = `https://graph.facebook.com/${account.uid}/picture?type=large`
    setAvatarUrl(fbPhoto)
    setPreviewError(false)
  }

  const handleUseInitials = () => {
    const initialsPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(account.name)}&background=2563eb&color=fff&bold=true`
    setAvatarUrl(initialsPhoto)
    setPreviewError(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const finalUrl = avatarUrl.trim() || `https://ui-avatars.com/api/?name=${encodeURIComponent(account.name)}&background=2563eb&color=fff&bold=true`
    onSave(account.id, finalUrl)
    onClose()
  }

  const displaySrc = avatarUrl.trim()
    ? (previewError
        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(account.name)}&background=2563eb&color=fff&bold=true`
        : avatarUrl)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(account.name)}&background=2563eb&color=fff&bold=true`

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 bg-blue-600/10 text-blue-600 rounded-lg">
              <Camera className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-base text-foreground">Change Profile Picture</h3>
              <p className="text-[11px] text-muted-foreground">{account.name} (UID: {account.uid})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground font-bold p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Avatar Live Preview */}
        <div className="flex flex-col items-center justify-center py-2 space-y-3">
          <div className="relative group">
            <img
              src={displaySrc}
              alt={account.name}
              onError={() => setPreviewError(true)}
              className="w-24 h-24 rounded-full object-cover border-4 border-blue-500/20 shadow-md bg-muted"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition transform hover:scale-105"
              title="Upload from PC"
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">
            Live Preview (প্রিভিউ)
          </span>
        </div>

        {/* Quick Options */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center space-x-1.5 py-2 px-3 bg-muted/60 hover:bg-muted text-foreground border border-border rounded-lg text-xs font-semibold transition"
          >
            <Upload className="w-3.5 h-3.5 text-blue-500" />
            <span>Upload from PC</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          <button
            type="button"
            onClick={handleFetchFacebookPhoto}
            className="flex items-center justify-center space-x-1.5 py-2 px-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Auto FB Picture</span>
          </button>
        </div>

        {/* Custom URL Option */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <LinkIcon className="w-3 h-3 text-muted-foreground" />
              <span>Or Direct Image URL</span>
            </span>
            <button
              type="button"
              onClick={handleUseInitials}
              className="text-[10px] text-blue-600 hover:underline font-medium"
            >
              Reset to Initials
            </button>
          </label>
          <input
            type="url"
            placeholder="https://example.com/photo.jpg"
            value={avatarUrl}
            onChange={(e) => {
              setAvatarUrl(e.target.value)
              setPreviewError(false)
            }}
            className="w-full p-2 border rounded-lg bg-background text-xs font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center space-x-1.5 transition"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Profile Photo</span>
          </button>
        </div>
      </div>
    </div>
  )
}
