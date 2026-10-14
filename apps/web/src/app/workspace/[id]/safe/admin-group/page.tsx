"use client"

import React from "react"
import { AdminGroupAssistantCenter } from "../../../../../components/admin-group/AdminGroupAssistantCenter"

export default function SafeAdminGroupPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <AdminGroupAssistantCenter mode="safe" />
      </div>
    </div>
  )
}
