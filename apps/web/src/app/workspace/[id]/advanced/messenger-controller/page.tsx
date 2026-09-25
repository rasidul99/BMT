"use client"

import React, { useState } from "react"
import { Bot, MessageSquare, MessageCircle } from "lucide-react"
import { InboxAssistantCenter } from "../../../../../components/inbox-assistant/InboxAssistantCenter"
import { MessengerGroupAssistantCenter } from "../../../../../components/messenger-group/MessengerGroupAssistantCenter"

export default function AdvancedMessengerControllerPage() {
  const [controllerTab, setControllerTab] = useState<"INBOX" | "GROUPS">("INBOX")

  return (
    <div className="space-y-6">
      {/* Sub-module Switcher */}
      <div className="flex items-center space-x-2 border-b border-border pb-3">
        <button
          onClick={() => setControllerTab("INBOX")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition ${
            controllerTab === "INBOX"
              ? "bg-orange-600 text-white shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>AI Inbox Reply Assistant</span>
        </button>

        <button
          onClick={() => setControllerTab("GROUPS")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition ${
            controllerTab === "GROUPS"
              ? "bg-orange-600 text-white shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>AI Messenger Group Assistant</span>
        </button>
      </div>

      {/* Render Active Controller Engine */}
      {controllerTab === "INBOX" ? (
        <InboxAssistantCenter currentMode="ADVANCED" />
      ) : (
        <MessengerGroupAssistantCenter currentMode="ADVANCED" />
      )}
    </div>
  )
}
