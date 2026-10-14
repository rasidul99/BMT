"use client"

import React from "react"
import { ConnectedWebsiteCenter } from "../../../../../components/connected-website/ConnectedWebsiteCenter"

export default function AdvancedConnectedWebsitePage() {
  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <ConnectedWebsiteCenter mode="advanced" />
      </div>
    </div>
  )
}
