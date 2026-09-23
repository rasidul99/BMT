"use client"

import React, { useState } from "react"
import { Layers, CheckCircle2, AlertCircle, X, HelpCircle } from "lucide-react"

interface BulkImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (rawText: string) => number
  currentCount: number
  maxLimit?: number
}

export function BulkImportModal({
  isOpen,
  onClose,
  onImport,
  currentCount,
  maxLimit = 100,
}: BulkImportModalProps) {
  const [rawText, setRawText] = useState("")
  const [importedSuccess, setImportedSuccess] = useState<number | null>(null)

  if (!isOpen) return null

  const remainingSlots = Math.max(0, maxLimit - currentCount)

  // Calculate live preview count
  const validLines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 5 && (l.includes("|") || l.includes(",")))

  const previewCount = Math.min(validLines.length, remainingSlots)

  const handleExecuteImport = () => {
    if (validLines.length === 0) {
      alert("Please paste accounts in the specified format.")
      return
    }

    const count = onImport(rawText)
    setImportedSuccess(count)
    setTimeout(() => {
      setImportedSuccess(null)
      onClose()
    }, 1800)
  }

  const sampleFormat = `100084729182341|c_user=100084729182341; xs=42%3Abmt_token|103.145.23.21:8080|Shafiul Poster 1
100084729182342|EAAG...access_token_demo|103.145.23.22:8080:usr:pwd|Shafiul Poster 2
100084729182343|c_user=100084729182343; xs=99%3Abmt_token|103.145.23.23:3128|Shafiul Poster 3`

  const handleFillSample = () => {
    setRawText(sampleFormat)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-purple-600/10 text-purple-600 rounded-lg">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-base text-foreground">Bulk Import Facebook Accounts & Proxies</h3>
              <p className="text-[11px] text-muted-foreground">
                Rapidly onboard up to 100 accounts via Pipe-separated or CSV format
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground font-bold p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Capacity banner */}
        <div className="flex items-center justify-between bg-muted/40 p-3 rounded-xl border text-xs">
          <div>
            <span className="text-muted-foreground">Currently Connected:</span>{" "}
            <span className="font-extrabold text-foreground">{currentCount} / {maxLimit}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Slots Available:</span>{" "}
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{remainingSlots} Accounts</span>
          </div>
        </div>

        {/* Format Explanation & Interactive Guide */}
        <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-2.5 text-xs">
          <div className="flex items-center justify-between font-bold text-blue-600 dark:text-blue-400">
            <span className="flex items-center space-x-1.5">
              <HelpCircle className="w-4 h-4" />
              <span>Standard Industry Import Format (1 per line):</span>
            </span>
            <button
              type="button"
              onClick={handleFillSample}
              className="text-[11px] bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-semibold transition-colors"
            >
              Fill Sample Template
            </button>
          </div>

          <div className="font-mono text-[11px] bg-background/90 p-2.5 rounded-lg border border-border/80 text-muted-foreground flex flex-wrap gap-2 items-center">
            <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-semibold" title="Numeric Facebook User ID (e.g. 100084729182341)">
              UID
            </span>
            <span className="text-muted-foreground/40">|</span>
            <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded font-semibold" title="Cookie string (c_user=...; xs=...) or Graph API Access Token (EAAG...)">
              Token_Or_Cookie
            </span>
            <span className="text-muted-foreground/40">|</span>
            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-semibold" title="Proxy IP:Port or IP:Port:User:Password for isolated anti-ban routing">
              Proxy_IP:Port[:User:Pass]
            </span>
            <span className="text-muted-foreground/40">|</span>
            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-semibold" title="Friendly Account or Persona Name">
              Account_Name
            </span>
          </div>

          {/* Quick Helper Accordion / Tooltip Guide */}
          <details className="group pt-1">
            <summary className="cursor-pointer text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 select-none">
              <span>📖 How & where do I get these credentials? (Click to view guide)</span>
            </summary>
            <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] leading-relaxed text-muted-foreground bg-background/60 p-3 rounded-lg border border-border/60">
              <div className="space-y-1">
                <p className="font-bold text-foreground flex items-center space-x-1">
                  <span className="text-blue-500">1. Facebook UID:</span>
                </p>
                <p>
                  Go to your FB profile URL (e.g. <code className="bg-muted px-1 rounded text-[10px]">facebook.com/profile.php?id=1000...</code>) or paste profile link in <span className="text-blue-500 font-semibold">lookup-id.com</span>.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-foreground flex items-center space-x-1">
                  <span className="text-purple-500">2. Cookie / Session (Recommended):</span>
                </p>
                <p>
                  Install free Chrome extension <span className="font-semibold text-foreground">Cookie-Editor</span>. Log into Facebook &gt; Click Extension &gt; Export cookie string (contains <code className="bg-muted px-1 rounded text-[10px]">c_user</code> & <code className="bg-muted px-1 rounded text-[10px]">xs</code>).
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-foreground flex items-center space-x-1">
                  <span className="text-emerald-500">3. Dedicated Proxy:</span>
                </p>
                <p>
                  To prevent Facebook from detecting multiple accounts on one IP, get residential/mobile proxies from providers like <span className="font-semibold text-foreground">Webshare, Smartproxy, or IPRoyal</span> in <code className="bg-muted px-1 rounded text-[10px]">IP:Port:User:Pass</code> format.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-foreground flex items-center space-x-1">
                  <span className="text-amber-500">4. Bulk Account Sellers / AdsPower:</span>
                </p>
                <p>
                  If you bought marketing accounts or exported from <span className="font-semibold text-foreground">AdsPower, Dolphin&#123;anty&#125;, or GoLogin</span>, they export in this exact pipe (<code className="bg-muted px-1 rounded text-[10px]">|</code>) format!
                </p>
              </div>
            </div>
          </details>
        </div>

        {/* Text Area */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <label className="font-bold text-muted-foreground uppercase text-[10px]">
              Paste Accounts Data ({validLines.length} lines detected)
            </label>
            {validLines.length > remainingSlots && (
              <span className="text-rose-500 font-bold text-[10px] flex items-center space-x-0.5">
                <AlertCircle className="w-3 h-3" />
                <span>Exceeds capacity by {validLines.length - remainingSlots}</span>
              </span>
            )}
          </div>

          <textarea
            rows={7}
            placeholder={`100084729182341|c_user=100084729182341; xs=42...|103.145.23.21:8080|Account 1\n100084729182342|EAAG...|103.145.23.22:8080:usr:pwd|Account 2`}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="w-full p-3 border rounded-xl bg-background font-mono text-[11px] focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        {/* Feedback message */}
        {importedSuccess !== null && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Successfully imported {importedSuccess} Facebook accounts into Market Engine!</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t text-xs">
          <span className="text-muted-foreground font-semibold text-[11px]">
            Ready to import: <b>{previewCount}</b> accounts
          </span>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-xl font-bold hover:bg-muted transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={previewCount === 0 || remainingSlots === 0}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md transition flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Import {previewCount} Accounts</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
