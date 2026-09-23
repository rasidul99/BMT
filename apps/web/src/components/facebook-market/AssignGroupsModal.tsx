"use client"

import React, { useState } from "react"
import { FacebookAccountItem, AssignedGroup } from "../../hooks/useFacebookAccounts"
import { Users, Plus, Trash2, Globe, Lock, X, ExternalLink } from "lucide-react"

interface AssignGroupsModalProps {
  isOpen: boolean
  onClose: () => void
  account: FacebookAccountItem | null
  onAssignGroup: (accountId: string, group: AssignedGroup) => void
  onRemoveGroup: (accountId: string, groupId: string) => void
}

export function AssignGroupsModal({
  isOpen,
  onClose,
  account,
  onAssignGroup,
  onRemoveGroup,
}: AssignGroupsModalProps) {
  const [groupName, setGroupName] = useState("")
  const [groupId, setGroupId] = useState("")
  const [memberCount, setMemberCount] = useState(50000)
  const [privacy, setPrivacy] = useState<"Public" | "Private">("Public")

  if (!isOpen || !account) return null

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupName.trim()) return

    const newGroup: AssignedGroup = {
      groupId: groupId.trim() || `grp-${Date.now()}`,
      groupName: groupName.trim(),
      memberCount: Number(memberCount) || 10000,
      privacy,
      joinedAt: new Date().toISOString().split("T")[0],
    }

    onAssignGroup(account.id, newGroup)
    setGroupName("")
    setGroupId("")
    setMemberCount(50000)
  }

  // Pre-set common marketing groups for quick 1-click addition
  const quickPresets = [
    { name: "Dhaka Buy and Sell Online", members: 195000, privacy: "Public" as const },
    { name: "BD Fashion & Panjabi Wholesale", members: 84000, privacy: "Public" as const },
    { name: "Smart Gadgets Bangladesh Resellers", members: 125000, privacy: "Public" as const },
    { name: "Gulshan Banani Real Estate Exchange", members: 62000, privacy: "Private" as const },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-emerald-600/10 text-emerald-600 rounded-lg">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-base text-foreground">Assigned Facebook Groups</h3>
              <p className="text-[11px] text-muted-foreground">
                Target marketing destinations for: <b>{account.name}</b>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground font-bold p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Existing Assigned Groups List */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold text-muted-foreground uppercase text-[10px]">
            <span>Assigned Groups ({account.assignedGroups.length})</span>
            <span>
              Total Reach:{" "}
              <b className="text-foreground">
                {account.assignedGroups.reduce((sum, g) => sum + g.memberCount, 0).toLocaleString()} Members
              </b>
            </span>
          </div>

          <div className="border rounded-xl divide-y max-h-48 overflow-y-auto bg-muted/20">
            {account.assignedGroups.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-xs">
                No groups assigned yet. Add groups below to enable group sharing.
              </div>
            ) : (
              account.assignedGroups.map((grp) => (
                <div key={grp.groupId} className="p-3 flex items-center justify-between hover:bg-muted/40 transition">
                  <div className="space-y-0.5">
                    <div className="font-bold text-foreground text-xs flex items-center space-x-1.5">
                      <span>{grp.groupName}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {grp.privacy === "Public" ? (
                          <Globe className="w-3 h-3 text-blue-500 inline" />
                        ) : (
                          <Lock className="w-3 h-3 text-amber-500 inline" />
                        )}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      ID: {grp.groupId} &bull; {grp.memberCount.toLocaleString()} Members
                    </div>
                  </div>

                  <button
                    onClick={() => onRemoveGroup(account.id, grp.groupId)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 rounded-lg transition"
                    title="Remove group"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Add Presets */}
        <div className="space-y-1.5 text-xs">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">1-Click Quick Presets</label>
          <div className="flex flex-wrap gap-1.5">
            {quickPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() =>
                  onAssignGroup(account.id, {
                    groupId: `preset-${idx}-${Date.now()}`,
                    groupName: preset.name,
                    memberCount: preset.members,
                    privacy: preset.privacy,
                    joinedAt: new Date().toISOString().split("T")[0],
                  })
                }
                className="bg-muted hover:bg-muted/80 text-[10px] font-semibold px-2 py-1 rounded-md border flex items-center space-x-1 transition"
              >
                <Plus className="w-2.5 h-2.5" />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Add Custom Group Form */}
        <form onSubmit={handleAdd} className="space-y-3 bg-muted/30 p-3.5 rounded-xl border text-xs">
          <div className="font-bold text-[11px] text-foreground flex items-center space-x-1">
            <Plus className="w-3.5 h-3.5 text-emerald-500" />
            <span>Add Custom Group Target</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Group Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Bangladesh Tech Bazaar"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg bg-background text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Group ID / Slug</label>
              <input
                type="text"
                placeholder="e.g. 192837465"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg bg-background text-xs font-mono"
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
                className="w-full mt-1 p-2 border rounded-lg bg-background text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Privacy</label>
              <select
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value as any)}
                className="w-full mt-1 p-2 border rounded-lg bg-background text-xs"
              >
                <option value="Public">Public Group</option>
                <option value="Private">Private / Closed Group</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg shadow-sm transition text-xs flex items-center justify-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Assign Group to Account</span>
          </button>
        </form>

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
