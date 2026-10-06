"use client"

import React, { useState, useMemo, useRef } from "react"
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  HelpCircle,
  BookOpen,
  Copy,
  Check,
  FileSpreadsheet,
  Upload,
  Download,
  FileText,
  Trash2,
} from "lucide-react"

interface BulkImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (rawText: string) => number
  currentCount: number
  maxLimit?: number
}

interface LineValidation {
  lineNum: number
  raw: string
  isValid: boolean
  reason?: string
}

export function BulkImportModal({
  isOpen,
  onClose,
  onImport,
  currentCount,
  maxLimit = 100,
}: BulkImportModalProps) {
  const [activeTab, setActiveTab] = useState<"file" | "paste">("file")
  const [rawText, setRawText] = useState("")
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [isFileLoading, setIsFileLoading] = useState(false)
  const [importedSuccess, setImportedSuccess] = useState<number | null>(null)
  const [copiedTemplate, setCopiedTemplate] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const remainingSlots = Math.max(0, maxLimit - currentCount)

  // Real-time line-by-line validation
  const validationResults = useMemo<LineValidation[]>(() => {
    if (!rawText.trim()) return []
    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

    // Check if line 1 is a header row (e.g. UID, Token, Cookie, Proxy, Name)
    const isFirstLineHeader =
      lines.length > 0 &&
      (lines[0].toLowerCase().includes("uid") ||
        lines[0].toLowerCase().includes("token") ||
        lines[0].toLowerCase().includes("cookie"))

    const dataLines = isFirstLineHeader ? lines.slice(1) : lines

    return dataLines.map((line, index) => {
      const lineNum = isFirstLineHeader ? index + 2 : index + 1
      let parts: string[] = []

      if (line.includes("\t")) {
        parts = line.split("\t")
      } else if (line.includes("|")) {
        parts = line.split("|")
      } else if (line.includes(",")) {
        parts = line.split(",")
      } else {
        return {
          lineNum,
          raw: line,
          isValid: false,
          reason: "Missing separator (| or Tab or ,)",
        }
      }

      if (parts.length < 2) {
        return {
          lineNum,
          raw: line,
          isValid: false,
          reason: "At least UID and Token/Cookie required",
        }
      }

      const rawInputUid = parts[0]?.trim() || ""
      const tokenOrCookie = parts[1]?.trim() || ""
      // Clean UID if user pasted full profile URL or username
      const uid = rawInputUid.replace(/^(https?:\/\/)?(www\.)?facebook\.com\//i, "").replace(/\/$/, "")

      if (!/^[a-zA-Z0-9._]{3,50}$/.test(uid)) {
        return {
          lineNum,
          raw: line,
          isValid: false,
          reason: `Invalid UID/Username "${rawInputUid.slice(0, 15)}..." (Must be numbers or Facebook username)`,
        }
      }

      if (!tokenOrCookie || tokenOrCookie.length < 5) {
        return {
          lineNum,
          raw: line,
          isValid: false,
          reason: "Token or Cookie is missing or too short",
        }
      }

      return {
        lineNum,
        raw: line,
        isValid: true,
      }
    })
  }, [rawText])

  const validLines = useMemo(() => validationResults.filter((l) => l.isValid), [validationResults])
  const invalidLines = useMemo(() => validationResults.filter((l) => !l.isValid), [validationResults])
  const previewCount = Math.min(validLines.length, remainingSlots)

  if (!isOpen) return null

  // Execute Import
  const handleExecuteImport = () => {
    if (validLines.length === 0) {
      alert("No valid account lines found to import. Please check your file or pasted text.")
      return
    }

    const count = onImport(rawText)
    setImportedSuccess(count)
    setTimeout(() => {
      setImportedSuccess(null)
      onClose()
    }, 1800)
  }

  // Handle File Upload (.xlsx, .xls, .csv, .txt)
  const handleFileUpload = async (file: File) => {
    setIsFileLoading(true)
    setUploadedFileName(file.name)

    const fileExt = file.name.split(".").pop()?.toLowerCase()

    try {
      if (fileExt === "csv" || fileExt === "txt" || fileExt === "tsv") {
        const reader = new FileReader()
        reader.onload = (e) => {
          const text = e.target?.result as string
          if (text) {
            setRawText(text)
          }
          setIsFileLoading(false)
        }
        reader.readAsText(file, "UTF-8")
      } else if (fileExt === "xlsx" || fileExt === "xls") {
        // Dynamic load SheetJS for Excel files
        const loadSheetJS = async (): Promise<any> => {
          if ((window as any).XLSX) return (window as any).XLSX
          return new Promise((resolve, reject) => {
            const script = document.createElement("script")
            script.src = "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js"
            script.onload = () => resolve((window as any).XLSX)
            script.onerror = () => reject(new Error("Could not load Excel parser."))
            document.head.appendChild(script)
          })
        }

        const XLSX = await loadSheetJS()
        const reader = new FileReader()
        reader.onload = (e) => {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: "array" })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          const csvText = XLSX.utils.sheet_to_csv(worksheet)
          setRawText(csvText)
          setIsFileLoading(false)
        }
        reader.readAsArrayBuffer(file)
      } else {
        alert("Please upload an Excel (.xlsx, .xls) or CSV / TXT file.")
        setIsFileLoading(false)
      }
    } catch (err) {
      console.error("Error reading file:", err)
      alert("Error reading file. Please make sure it is a valid Excel or CSV file.")
      setIsFileLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  // Download Sample Excel/CSV Template
  const handleDownloadTemplate = () => {
    const csvContent =
      "UID,Token_Or_Cookie,Proxy_IP:Port:User:Pass,Account_Name\n" +
      "61560588090925,c_user=61560588090925; xs=42%3Abmt_token_demo,103.145.23.21:8080,Rasidul Personal\n" +
      "100084729182341,c_user=100084729182341; xs=55%3Abmt_token_demo,103.145.23.22:8080:usr:pwd,Dhaka Poster 1\n" +
      "100084729182342,EAAG...access_token_demo,103.145.23.23:3128,Dhaka Poster 2\n"

    // UTF-8 BOM ensures Excel on Windows displays everything perfectly
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "Facebook_Accounts_Template.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Copy sample to clipboard
  const handleCopyExcelTemplate = () => {
    const excelText = `UID\tToken_Or_Cookie\tProxy_IP:Port:User:Pass\tAccount_Name
61560588090925\tc_user=61560588090925; xs=42%3Abmt_token_demo\t103.145.23.21:8080\tRasidul Personal
100084729182341\tc_user=100084729182341; xs=55%3Abmt_token_demo\t103.145.23.22:8080:usr:pwd\tDhaka Poster 1
100084729182342\tEAAG...access_token_demo\t103.145.23.23:3128\tDhaka Poster 2`

    navigator.clipboard.writeText(excelText).then(() => {
      setCopiedTemplate(true)
      setTimeout(() => setCopiedTemplate(false), 2000)
    })
  }

  const handleFillSample = () => {
    const sample = `61560588090925|c_user=61560588090925; xs=42%3Abmt_token_demo|103.145.23.21:8080|Rasidul Personal
100084729182341|c_user=100084729182341; xs=55%3Abmt_token_demo|103.145.23.22:8080:usr:pwd|Dhaka Poster 1
100084729182342|EAAG...access_token_demo|103.145.23.23:3128|Dhaka Poster 2`
    setRawText(sample)
    setUploadedFileName("sample_demo_accounts.txt")
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 bg-blue-600/10 text-blue-600 rounded-lg">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-base text-foreground">Bulk Import Facebook Accounts</h3>
              <p className="text-[11px] text-muted-foreground">
                Upload Excel / CSV file or paste accounts directly
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground font-bold p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Capacity banner & Download Template */}
        <div className="flex items-center justify-between bg-muted/40 p-3 rounded-xl border border-border/80 text-xs">
          <div className="space-y-0.5">
            <div className="text-[11px]">
              <span className="text-muted-foreground">Capacity:</span>{" "}
              <span className="font-extrabold text-foreground">{currentCount} / {maxLimit}</span>
              <span className="mx-2 text-muted-foreground">&bull;</span>
              <span className="text-muted-foreground">Available:</span>{" "}
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{remainingSlots} Slots</span>
            </div>
          </div>

          {/* Download Excel Template Button */}
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold transition shadow-2xs"
            title="Download ready-to-use Excel / CSV template"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Excel Template</span>
          </button>
        </div>

        {/* Import Tabs: File Upload vs Copy Paste */}
        <div className="flex items-center space-x-2 border-b border-border/60 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("file")}
            className={`flex items-center space-x-2 px-3 py-2 text-xs font-bold border-b-2 transition ${
              activeTab === "file"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Upload Excel / CSV File (ফাইল আপলোড)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("paste")}
            className={`flex items-center space-x-2 px-3 py-2 text-xs font-bold border-b-2 transition ${
              activeTab === "paste"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Copy className="w-4 h-4" />
            <span>Copy & Paste Text (কপি-পেস্ট)</span>
          </button>
        </div>

        {/* Tab 1: File Upload (Excel, CSV, TXT) */}
        {activeTab === "file" && (
          <div className="space-y-3">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-blue-500 bg-muted/20 hover:bg-muted/40 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2.5 group"
            >
              <div className="p-3 bg-blue-600/10 text-blue-600 group-hover:scale-110 rounded-full transition">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  Drag and drop your Excel or CSV file here
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Supports <b>.xlsx</b>, <b>.xls</b>, <b>.csv</b>, <b>.txt</b> (Max 100 accounts)
                </p>
              </div>
              <button
                type="button"
                className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-blue-700 transition"
              >
                Browse File from PC
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.txt,.tsv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file)
                }}
              />
            </div>

            {/* Uploaded File Info */}
            {uploadedFileName && (
              <div className="p-3 bg-background border border-border/80 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5">
                  <span className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg">
                    <FileSpreadsheet className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="font-bold text-foreground">{uploadedFileName}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {isFileLoading ? "Processing file..." : `${validLines.length} valid accounts loaded`}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedFileName(null)
                    setRawText("")
                  }}
                  className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-rose-500 transition"
                  title="Remove File"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Copy & Paste from Excel/Text */}
        {activeTab === "paste" && (
          <div className="space-y-3">
            {/* Quick Helper / Actions */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-muted-foreground text-[10px] uppercase">
                Paste Columns or Lines:
              </span>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={handleCopyExcelTemplate}
                  className="text-[11px] bg-background hover:bg-muted text-foreground border border-border px-2 py-0.5 rounded font-semibold flex items-center space-x-1 transition"
                  title="Copy Excel table header to clipboard"
                >
                  {copiedTemplate ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-500">Copied!</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                      <span>Copy Excel Columns</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleFillSample}
                  className="text-[11px] bg-blue-600/15 hover:bg-blue-600/25 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-semibold transition"
                >
                  Fill Sample
                </button>
              </div>
            </div>

            <textarea
              rows={6}
              placeholder={`UID\tToken_Or_Cookie\tProxy\tAccount_Name\n61560588090925\tc_user=61560588090925; xs=42...\t103.145.23.21:8080\tRasidul\n100084729182341\tEAAG...\t103.145.23.22:8080\tPoster 1`}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full p-3 border rounded-xl bg-background font-mono text-[11px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        )}

        {/* Format Explanation Badge */}
        <div className="font-mono text-[10px] bg-muted/30 p-2 rounded-lg border border-border/60 text-muted-foreground flex flex-wrap gap-1.5 items-center">
          <span className="font-sans font-bold text-foreground mr-1 text-[11px]">Columns:</span>
          <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.2 rounded font-semibold">
            1. UID / Username
          </span>
          <span className="text-muted-foreground/40">&bull;</span>
          <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.2 rounded font-semibold">
            2. Token / Cookie
          </span>
          <span className="text-muted-foreground/40">&bull;</span>
          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded font-semibold">
            3. Proxy (Optional)
          </span>
          <span className="text-muted-foreground/40">&bull;</span>
          <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 rounded font-semibold">
            4. Name (Optional)
          </span>
        </div>

        {/* Validation Warning Feedback */}
        {invalidLines.length > 0 && (
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-lg text-[11px] space-y-1">
            <div className="font-bold flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>
                {invalidLines.length}টি লাইনে ফরম্যাট ভুল আছে (ভুল লাইনগুলো স্বয়ংক্রিয়ভাবে বাদ যাবে):
              </span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[10px] opacity-90">
              {invalidLines.slice(0, 2).map((inv) => (
                <li key={inv.lineNum}>
                  Line {inv.lineNum}: {inv.reason}
                </li>
              ))}
              {invalidLines.length > 2 && (
                <li>...এবং আরও {invalidLines.length - 2}টি ভুল লাইন।</li>
              )}
            </ul>
          </div>
        )}

        {/* Success message */}
        {importedSuccess !== null && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Successfully imported {importedSuccess} Facebook accounts into Market Engine!</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t text-xs">
          <span className="text-muted-foreground font-semibold text-[11px]">
            Ready to import: <b className="text-foreground">{previewCount}</b> accounts
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md transition flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Import {previewCount} Valid Accounts</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
