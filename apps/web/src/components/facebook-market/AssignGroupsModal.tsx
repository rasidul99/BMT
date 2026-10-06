"use client"

import React, { useState, useMemo } from "react"
import { FacebookAccountItem, AssignedGroup } from "../../hooks/useFacebookAccounts"
import { useGroupPoster } from "../../hooks/useGroupPoster"
import {
  Users,
  Plus,
  Trash2,
  Globe,
  Lock,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  Search,
  Sparkles,
  FolderPlus,
  Library,
} from "lucide-react"

interface AssignGroupsModalProps {
  isOpen: boolean
  onClose: () => void
  account: FacebookAccountItem | null
  allAccounts?: FacebookAccountItem[]
  onAssignGroup: (accountId: string, group: AssignedGroup) => void
  onRemoveGroup: (accountId: string, groupId: string) => void
}

export function AssignGroupsModal({
  isOpen,
  onClose,
  account,
  allAccounts = [],
  onAssignGroup,
  onRemoveGroup,
}: AssignGroupsModalProps) {
  const { groups: customGroups, addGroup } = useGroupPoster()

  // Tab State: 'library' (Existing Real Groups) vs 'custom' (Create New Group)
  const [activeTab, setActiveTab] = useState<"library" | "custom">("library")
  const [searchQuery, setSearchQuery] = useState("")

  // Form State for creating a new custom group
  const [groupName, setGroupName] = useState("")
  const [groupId, setGroupId] = useState("")
  const [memberCount, setMemberCount] = useState(50000)
  const [privacy, setPrivacy] = useState<"Public" | "Private">("Public")

  // Feedback notifications
  const [actionFeedback, setActionFeedback] = useState<{
    type: "added" | "deleted"
    message: string
  } | null>(null)
  const [isJustAdded, setIsJustAdded] = useState(false)
  const [recentAddedId, setRecentAddedId] = useState<string | null>(null)

  // 1. Unified pool of ALL known real groups across the system
  const allKnownGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        groupId: string
        groupName: string
        memberCount: number
        privacy: "Public" | "Private"
        category?: string
        isCustom?: boolean
        assignedToAccountNames: string[]
      }
    >()

    // A. From workspace custom groups (Group Poster & saved communities)
    customGroups.forEach((cg) => {
      const key = cg.name.toLowerCase().trim()
      const existing = map.get(key)
      map.set(key, {
        groupId: cg.id,
        groupName: cg.name,
        memberCount: cg.memberCount,
        privacy: cg.privacy,
        category: cg.category,
        isCustom: true,
        assignedToAccountNames: existing?.assignedToAccountNames || [],
      })
    })

    // B. From all accounts' assigned groups (100 Accounts Engine)
    allAccounts.forEach((acc) => {
      acc.assignedGroups?.forEach((g) => {
        const key = g.groupName.toLowerCase().trim()
        const existing = map.get(key)
        const accountNames = existing ? [...existing.assignedToAccountNames] : []
        if (!accountNames.includes(acc.name)) {
          accountNames.push(acc.name)
        }
        map.set(key, {
          groupId: existing?.groupId || g.groupId,
          groupName: g.groupName,
          memberCount: existing?.memberCount || g.memberCount,
          privacy: existing?.privacy || g.privacy,
          category: existing?.category || "Buy & Sell",
          isCustom: existing?.isCustom || false,
          assignedToAccountNames: accountNames,
        })
      })
    })

    return Array.from(map.values())
  }, [customGroups, allAccounts])

  // Filter known groups by search query
  const filteredKnownGroups = useMemo(() => {
    if (!searchQuery.trim()) return allKnownGroups
    const q = searchQuery.toLowerCase().trim()
    return allKnownGroups.filter(
      (g) =>
        g.groupName.toLowerCase().includes(q) ||
        g.groupId.toLowerCase().includes(q) ||
        (g.category && g.category.toLowerCase().includes(q))
    )
  }, [allKnownGroups, searchQuery])

  if (!isOpen || !account) return null

  // Check if a group is already assigned to THIS specific account
  const isAssignedToThisAccount = (grpId: string, grpName: string) => {
    return account.assignedGroups.some(
      (g) => g.groupId === grpId || g.groupName.toLowerCase().trim() === grpName.toLowerCase().trim()
    )
  }

  // Assign an existing group from the library
  const handleAssignExisting = (grp: {
    groupId: string
    groupName: string
    memberCount: number
    privacy: "Public" | "Private"
  }) => {
    onAssignGroup(account.id, {
      groupId: grp.groupId,
      groupName: grp.groupName,
      memberCount: grp.memberCount,
      privacy: grp.privacy,
      joinedAt: new Date().toISOString().split("T")[0],
    })

    setActionFeedback({
      type: "added",
      message: `✅ "${grp.groupName}" গ্রুপটি সফলভাবে সংযুক্ত করা হয়েছে!`,
    })
    setRecentAddedId(grp.groupId)
    setTimeout(() => setRecentAddedId(null), 2500)
    setTimeout(() => setActionFeedback(null), 3500)
  }

  // Remove / unassign a group from this account
  const handleRemove = (grp: { groupId: string; groupName: string }) => {
    onRemoveGroup(account.id, grp.groupId)
    setActionFeedback({
      type: "deleted",
      message: `🗑️ "${grp.groupName}" গ্রুপটি আন-অ্যাসাইন করা হয়েছে।`,
    })
    setTimeout(() => setActionFeedback(null), 3500)
  }

  // Create new custom group & assign to this account
  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupName.trim()) return

    const newGroupId = groupId.trim() || `grp-${Date.now()}`
    const trimmedName = groupName.trim()
    const count = Number(memberCount) || 10000

    const newGroup: AssignedGroup = {
      groupId: newGroupId,
      groupName: trimmedName,
      memberCount: count,
      privacy,
      joinedAt: new Date().toISOString().split("T")[0],
    }

    // 1. Assign to current account
    onAssignGroup(account.id, newGroup)

    // 2. Register into workspace custom groups so it persists everywhere
    try {
      addGroup({
        name: trimmedName,
        category: "Buy & Sell",
        memberCount: count,
        privacy,
        isManagedAdmin: false,
        assignedAccountId: account.id,
        url: groupId.startsWith("http") ? groupId : `https://facebook.com/groups/${newGroupId}`,
      })
    } catch (err) {
      console.error("Failed to add to global groups:", err)
    }

    setActionFeedback({
      type: "added",
      message: `✅ "${trimmedName}" নতুন গ্রুপটি সিস্টেমে সংরক্ষিত এবং ${account.name}-এ সংযুক্ত হয়েছে!`,
    })
    setIsJustAdded(true)
    setRecentAddedId(newGroupId)

    setGroupName("")
    setGroupId("")
    setMemberCount(50000)

    setTimeout(() => setIsJustAdded(false), 2200)
    setTimeout(() => {
      setRecentAddedId(null)
      setActionFeedback(null)
    }, 3500)
  }

  const totalAssignedReach = account.assignedGroups.reduce((sum, g) => sum + g.memberCount, 0)

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-base text-foreground">Assigned Facebook Groups</h3>
              <p className="text-[11px] text-muted-foreground">
                Target destinations for: <b className="text-foreground">{account.name}</b>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground font-bold p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Feedback Toast Notification */}
        {actionFeedback && (
          <div
            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200 ${
              actionFeedback.type === "added"
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400"
            }`}
          >
            <div className="flex items-center space-x-2">
              {actionFeedback.type === "added" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{actionFeedback.message}</span>
            </div>
            <button
              onClick={() => setActionFeedback(null)}
              className="text-muted-foreground hover:text-foreground font-bold text-xs ml-2"
            >
              &times;
            </button>
          </div>
        )}

        {/* SECTION 1: Currently Assigned Groups for this Account */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold text-muted-foreground uppercase text-[10px]">
            <span>
              Assigned Groups ({account.assignedGroups.length})
            </span>
            <span>
              Total Reach:{" "}
              <b className="text-foreground font-mono">
                {totalAssignedReach.toLocaleString()} Members
              </b>
            </span>
          </div>

          <div className="border border-border/80 rounded-xl divide-y divide-border/60 max-h-40 overflow-y-auto bg-muted/20">
            {account.assignedGroups.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-xs space-y-1">
                <p className="font-semibold text-foreground/80">এখনও কোনো গ্রুপ যুক্ত করা হয়নি (০ গ্রুপ)</p>
                <p className="text-[10px] text-muted-foreground">
                  নিচের &apos;বিদ্যমান গ্রুপ লাইব্রেরি&apos; থেকে পছন্দমতো গ্রুপ অ্যাসাইন করুন অথবা নতুন গ্রুপ তৈরি করুন।
                </p>
              </div>
            ) : (
              account.assignedGroups.map((grp) => {
                const isRecentlyAdded = recentAddedId === grp.groupId
                return (
                  <div
                    key={grp.groupId}
                    className={`p-2.5 flex items-center justify-between transition-all ${
                      isRecentlyAdded
                        ? "bg-emerald-500/10 dark:bg-emerald-950/20 border-l-4 border-l-emerald-500"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <div className="font-bold text-foreground text-xs flex items-center space-x-1.5 truncate">
                        <span className="truncate">{grp.groupName}</span>
                        {isRecentlyAdded && (
                          <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold uppercase animate-pulse shrink-0">
                            New
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {grp.privacy === "Public" ? (
                            <Globe className="w-3 h-3 text-blue-500 inline ml-0.5" />
                          ) : (
                            <Lock className="w-3 h-3 text-amber-500 inline ml-0.5" />
                          )}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {grp.memberCount.toLocaleString()} Members
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(grp)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 rounded-lg transition shrink-0"
                      title="Remove group (মুছে ফেলুন)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* SECTION 2: Tab Controls (Library vs Create New) */}
        <div className="pt-2">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center space-x-1 bg-muted/60 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab("library")}
                className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                  activeTab === "library"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Library className="w-3.5 h-3.5 text-blue-500" />
                <span>বিদ্যমান গ্রুপ লাইব্রেরি ({allKnownGroups.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("custom")}
                className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                  activeTab === "custom"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FolderPlus className="w-3.5 h-3.5 text-emerald-500" />
                <span>+ নতুন গ্রুপ তৈরি করুন</span>
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: Existing Workspace Groups Library */}
        {activeTab === "library" && (
          <div className="space-y-3 text-xs animate-in fade-in duration-200">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="বিদ্যমান গ্রুপ খুঁজুন (যেমন: Dhaka, Fashion, Tech...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border rounded-xl bg-background text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* List of Known Groups */}
            <div className="border border-border/80 rounded-xl divide-y divide-border/60 max-h-56 overflow-y-auto bg-muted/10">
              {filteredKnownGroups.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-xs">
                  কোনো গ্রুপ খুঁজে পাওয়া যায়নি। আপনি &apos;+ নতুন গ্রুপ তৈরি করুন&apos; ট্যাব থেকে নতুন গ্রুপ যুক্ত করতে পারেন।
                </div>
              ) : (
                filteredKnownGroups.map((grp) => {
                  const alreadyAssigned = isAssignedToThisAccount(grp.groupId, grp.groupName)

                  return (
                    <div
                      key={grp.groupId}
                      className={`p-3 flex items-center justify-between gap-2.5 transition ${
                        alreadyAssigned ? "bg-emerald-500/5" : "hover:bg-muted/30"
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="font-extrabold text-foreground text-xs flex items-center gap-1.5 flex-wrap">
                          <span className="truncate">{grp.groupName}</span>
                          {grp.isCustom && (
                            <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0">
                              CUSTOM
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {grp.privacy === "Public" ? (
                              <Globe className="w-3 h-3 text-blue-500 inline ml-0.5" />
                            ) : (
                              <Lock className="w-3 h-3 text-amber-500 inline ml-0.5" />
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="font-mono">{(grp.memberCount / 1000).toFixed(0)}K Members</span>
                          {grp.category && (
                            <>
                              <span>•</span>
                              <span className="text-blue-600 dark:text-blue-400 font-medium">{grp.category}</span>
                            </>
                          )}
                          {grp.assignedToAccountNames.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-muted-foreground/80 truncate max-w-[150px]">
                                {grp.assignedToAccountNames.join(", ")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="shrink-0 flex items-center gap-1.5">
                        {alreadyAssigned ? (
                          <div className="flex items-center gap-1">
                            <span className="px-2 py-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold rounded-lg text-[10px] flex items-center gap-1">
                              <Check className="w-3 h-3" /> Assigned
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemove(grp)}
                              className="p-1 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded transition"
                              title="Unassign from this account"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAssignExisting(grp)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 transition shadow-xs"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Assign</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Add New Custom Group Form */}
        {activeTab === "custom" && (
          <form
            onSubmit={handleAddCustom}
            className="space-y-3 bg-muted/30 p-3.5 rounded-xl border border-border/70 text-xs animate-in fade-in duration-200"
          >
            <div className="font-bold text-[11px] text-foreground flex items-center space-x-1.5">
              <FolderPlus className="w-3.5 h-3.5 text-emerald-500" />
              <span>Create New Target Group (সিস্টেমে নতুন গ্রুপ যোগ)</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Group Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bangladesh Tech Wholesalers"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-lg bg-background text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center justify-between">
                  <span>Group ID / URL</span>
                  <span className="text-[9px] text-blue-500 font-normal lowercase">ID or link</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 174803776337640"
                  value={groupId}
                  onChange={(e) => {
                    const val = e.target.value.trim()
                    const cleaned = val
                      .replace(/^(https?:\/\/)?(www\.)?facebook\.com\/groups\//i, "")
                      .replace(/\/.*$/, "")
                    setGroupId(cleaned)
                  }}
                  className="w-full mt-1 p-2 border rounded-lg bg-background text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Member Count</label>
                <input
                  type="number"
                  value={memberCount}
                  onChange={(e) => setMemberCount(Number(e.target.value))}
                  className="w-full mt-1 p-2 border rounded-lg bg-background text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Privacy</label>
                <select
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value as any)}
                  className="w-full mt-1 p-2 border rounded-lg bg-background text-xs focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Public">Public Group</option>
                  <option value="Private">Private / Closed Group</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-2.5 text-white font-extrabold rounded-lg shadow-sm transition text-xs flex items-center justify-center space-x-1.5 ${
                isJustAdded
                  ? "bg-emerald-600 ring-2 ring-emerald-400"
                  : "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99]"
              }`}
            >
              {isJustAdded ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>✓ গ্রুপ সফলভাবে যোগ ও অ্যাসাইন হয়েছে!</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save to Library &amp; Assign to {account.name}</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
