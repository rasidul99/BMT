import { NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import fs from "fs"

function getBotPaths() {
  const botDir = path.resolve(process.cwd(), "..", "..", "scripts", "facebook-bot")
  const tempDir = path.join(botDir, "temp")
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })
  return {
    botDir,
    tempDir,
    sessionFile: path.join(botDir, "active-session.json"),
    liveGroupsFile: path.join(tempDir, "messenger-groups-live.json"),
    campaignStateFile: path.join(tempDir, "messenger-group-campaign-state.json"),
    inboxLockFile: path.join(tempDir, "inbox-active-lock.json"),
    pendingRepliesFile: path.join(tempDir, "inbox-pending-replies.json"),
  }
}

function loadLiveGroups(paths: ReturnType<typeof getBotPaths>) {
  let groups: any[] = []
  if (fs.existsSync(paths.liveGroupsFile)) {
    try {
      groups = JSON.parse(fs.readFileSync(paths.liveGroupsFile, "utf8")) || []
    } catch {
      groups = []
    }
  }

  // Also merge any live conversations from the active 24/7 Messenger Bot so real threads appear immediately!
  if (fs.existsSync(paths.inboxLockFile)) {
    try {
      const lock = JSON.parse(fs.readFileSync(paths.inboxLockFile, "utf8"))
      if (lock && lock.activeJobId) {
        const statusFile = path.join(paths.tempDir, `${lock.activeJobId}-status.json`)
        if (fs.existsSync(statusFile)) {
          const statusData = JSON.parse(fs.readFileSync(statusFile, "utf8"))
          const convs = Array.isArray(statusData?.conversations) ? statusData.conversations : []
          for (const conv of convs) {
            if (!conv || !conv.customerName) continue
            const exists = groups.some(
              (g) => String(g.name || "").toLowerCase() === String(conv.customerName).toLowerCase()
            )
            if (!exists) {
              groups.unshift({
                id: `live-msg-${String(conv.customerName).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
                name: conv.customerName,
                threadId: conv.threadId || `live_thread_${String(conv.customerName).toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
                assignedAccountId: String(lock.targetId || "61595136714776"),
                assignedAccountName: `${conv.pageName || lock.targetName || "Test Next"} (Page)`,
                memberCount: 2,
                maxCapacity: 250,
                category: "General VIP",
                lastMessageSent: conv.lastMessageTime || "Active now",
                lastMessagePreview: conv.lastMessageText || "",
                status: "Active",
                isLiveMessengerThread: true,
                sourceType: "Page",
              })
            }
          }
        }
      }
    } catch {}
  }

  return groups
}

export async function GET() {
  try {
    const paths = getBotPaths()
    let session: any = {}
    if (fs.existsSync(paths.sessionFile)) {
      try {
        session = JSON.parse(fs.readFileSync(paths.sessionFile, "utf8"))
      } catch {}
    }

    const cUserMatch = String(session.cookieString || "").match(/c_user=(\d+)/)
    const cUserId = cUserMatch ? cUserMatch[1] : "61560588090925"

    const connectedAccounts = [
      {
        id: "61595136714776",
        name: "Test Next (Page)",
        rawName: "Test Next",
        sourceType: "Page",
        uid: "61595136714776",
        status: "Active",
      },
      {
        id: cUserId,
        name: `Rasidul Islam Sajib — Personal ID (${cUserId})`,
        rawName: "Rasidul Islam Sajib",
        sourceType: "Personal ID",
        uid: cUserId,
        status: "Active",
      },
      {
        id: "101909799416254",
        name: "Nature's Cure (Page)",
        rawName: "Nature's Cure",
        sourceType: "Page",
        uid: "101909799416254",
        status: "Active",
      },
    ]

    const liveGroups = loadLiveGroups(paths)

    let campaigns: any[] = []
    if (fs.existsSync(paths.campaignStateFile)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(paths.campaignStateFile, "utf8"))
        if (parsed && Array.isArray(parsed.campaigns)) {
          campaigns = parsed.campaigns
        }
      } catch {}
    }

    let is24x7BotActive = false
    if (fs.existsSync(paths.inboxLockFile)) {
      try {
        const lock = JSON.parse(fs.readFileSync(paths.inboxLockFile, "utf8"))
        is24x7BotActive = Boolean(lock && lock.activeJobId)
      } catch {}
    }

    return NextResponse.json({
      success: true,
      session: {
        hasCookie: Boolean(session.cookieString && session.cookieString.includes("c_user=")),
        hasAccessToken: Boolean(session.accessToken && session.accessToken.length > 15),
        authMode: session.authMode || "COOKIE",
        cUserId,
        updatedAt: session.updatedAt || null,
        is24x7BotActive,
      },
      connectedAccounts,
      liveGroups,
      campaigns,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const paths = getBotPaths()
    const { action } = body

    // 1. Sync Live Messenger Groups & Threads from Real Facebook Account / Page
    if (action === "SYNC_LIVE_GROUPS") {
      const targetId = String(body.targetId || "61595136714776").trim()
      const targetName = String(body.targetName || "Test Next").trim()
      const sourceType = String(body.sourceType || "Page").trim()

      // Check if 24/7 Inbox Bot is already watching this channel
      let alreadyWatching = false
      if (fs.existsSync(paths.inboxLockFile)) {
        try {
          const lock = JSON.parse(fs.readFileSync(paths.inboxLockFile, "utf8"))
          if (lock && String(lock.targetId) === targetId) {
            alreadyWatching = true
          }
        } catch {}
      }

      if (!alreadyWatching) {
        const syncJobId = `msg-grp-sync-${Date.now()}`
        const configPath = path.join(paths.tempDir, `${syncJobId}-config.json`)
        fs.writeFileSync(
          configPath,
          JSON.stringify(
            {
              action: "SYNC_GROUPS",
              sourceType,
              targetId,
              targetName,
              headless: false,
            },
            null,
            2
          ),
          "utf8"
        )
        const scriptPath = path.join(paths.botDir, "facebook-messenger-group-bot.js")
        const child = spawn("node", [scriptPath, configPath], {
          cwd: paths.botDir,
          detached: true,
          stdio: "ignore",
        })
        child.unref()
      }

      const liveGroups = loadLiveGroups(paths)
      return NextResponse.json({
        success: true,
        alreadyWatching,
        message: alreadyWatching
          ? `✅ Synced ${liveGroups.length} live Messenger thread(s)/group(s) from active 24/7 session (${targetName})!`
          : `🔄 Launched Live Facebook Messenger Scanner for "${targetName}" — groups/threads will appear automatically in a few seconds!`,
        liveGroups,
      })
    }

    // 2. Add or Create a Real Messenger Group (with Real Thread URL/ID or Live Messenger Composer)
    if (action === "ADD_OR_CREATE_GROUP") {
      const existing = loadLiveGroups(paths)
      const rawThreadInput = String(body.threadUrlOrId || "").trim()
      let cleanThreadId = rawThreadInput
        .replace(/^https?:\/\/(www\.)?(facebook\.com\/messages\/t\/|m\.me\/j\/|m\.me\/)/i, "")
        .replace(/[/?#].*$/, "")
        .trim()

      if (!cleanThreadId) {
        cleanThreadId = `live_thread_${Date.now()}`
      }

      const newGroup = {
        id: `live-msg-${Date.now()}`,
        name: String(body.name || "New Messenger Group").trim(),
        threadId: cleanThreadId,
        threadUrl: rawThreadInput.startsWith("http")
          ? rawThreadInput
          : `https://www.facebook.com/messages/t/${cleanThreadId}/`,
        assignedAccountId: String(body.assignedAccountId || "61595136714776"),
        assignedAccountName: String(body.assignedAccountName || "Test Next (Page)"),
        memberCount: Number(body.memberCount) || 25,
        maxCapacity: 250,
        category: body.category || "Resellers Wholesale",
        lastMessageSent: "Just added",
        status: "Active",
        isLiveMessengerThread: true,
        sourceType: String(body.sourceType || "Page"),
        updatedAt: new Date().toISOString(),
      }

      const nextGroups = [newGroup, ...existing.filter((g) => g.name !== newGroup.name)]
      fs.writeFileSync(paths.liveGroupsFile, JSON.stringify(nextGroups, null, 2), "utf8")

      if (body.openLiveComposer) {
        const createJobId = `msg-grp-create-${Date.now()}`
        const configPath = path.join(paths.tempDir, `${createJobId}-config.json`)
        fs.writeFileSync(
          configPath,
          JSON.stringify(
            {
              action: "CREATE_GROUP",
              sourceType: newGroup.sourceType,
              targetId: newGroup.assignedAccountId,
              targetName: newGroup.assignedAccountName.replace(/\s*\(.*\)$/, ""),
              newGroupName: newGroup.name,
              welcomeMessage: body.welcomeMessage || `আসসালামু আলাইকুম সবাইকে! "${newGroup.name}" গ্রুপে স্বাগতম। 😊`,
              headless: false,
            },
            null,
            2
          ),
          "utf8"
        )
        const scriptPath = path.join(paths.botDir, "facebook-messenger-group-bot.js")
        const child = spawn("node", [scriptPath, configPath], {
          cwd: paths.botDir,
          detached: true,
          stdio: "ignore",
        })
        child.unref()
      }

      return NextResponse.json({
        success: true,
        group: newGroup,
        liveGroups: nextGroups,
      })
    }

    // 3. Invite Followers to Group
    if (action === "INVITE_FOLLOWERS") {
      const groupId = String(body.groupId || "")
      const count = Number(body.followerCount) || 10
      const existing = loadLiveGroups(paths)
      const updated = existing.map((g) => {
        if (g.id === groupId) {
          const newCount = Math.min(g.maxCapacity || 250, (Number(g.memberCount) || 2) + count)
          return {
            ...g,
            memberCount: newCount,
            status: newCount >= 250 ? "Full" : newCount >= 245 ? "Almost Full" : "Active",
          }
        }
        return g
      })
      fs.writeFileSync(paths.liveGroupsFile, JSON.stringify(updated, null, 2), "utf8")
      return NextResponse.json({ success: true, liveGroups: updated })
    }

    // 4. Delete Group
    if (action === "DELETE_GROUP") {
      const groupId = String(body.groupId || "")
      const existing = loadLiveGroups(paths).filter((g) => g.id !== groupId)
      fs.writeFileSync(paths.liveGroupsFile, JSON.stringify(existing, null, 2), "utf8")
      return NextResponse.json({ success: true, liveGroups: existing })
    }

    // 5. Dispatch Real Bulk Campaign to Selected Live Messenger Groups / Threads
    if (action === "DISPATCH_CAMPAIGN") {
      const {
        title = "Messenger Group Campaign",
        masterMessage = "",
        selectedGroups = [],
        messagesPerAccount = 3,
        delayMinutes = 1,
        aiVariantEnabled = true,
      } = body

      if (!Array.isArray(selectedGroups) || selectedGroups.length === 0) {
        return NextResponse.json({ success: false, error: "কমপক্ষে ১টি গ্রুপ সিলেক্ট করুন।" }, { status: 400 })
      }

      const campaignId = `camp-live-${Date.now()}`
      const logs = selectedGroups.map((grp: any, index: number) => {
        let textToSend = String(masterMessage).trim()
        if (aiVariantEnabled) {
          const variations = [
            `${textToSend} 😊`,
            `আসসালামু আলাইকুম! ${textToSend} বিস্তারিত জানতে বা অর্ডার করতে এখনই রিপ্লাই দিন! ✨`,
            `স্পেশাল আপডেট (${grp.name}): ${textToSend} 🔥`,
          ]
          textToSend = variations[index % variations.length]
        }

        return {
          id: `log-live-${Date.now()}-${index}`,
          groupId: grp.id,
          groupName: grp.name,
          threadId: grp.threadId || "",
          accountId: grp.assignedAccountId || "61595136714776",
          accountName: grp.assignedAccountName || "Test Next (Page)",
          sentMessageText: textToSend,
          isAiVariant: Boolean(aiVariantEnabled),
          sentAt: "Sending to Live Messenger...",
          status: "PENDING",
          latencyMs: 0,
        }
      })

      const newCampaign = {
        id: campaignId,
        title,
        masterMessage,
        targetGroupIds: selectedGroups.map((g: any) => g.id),
        messagesPerAccount,
        delayMinutes,
        aiVariantEnabled,
        status: "Sending",
        totalTarget: logs.length,
        sentCount: 0,
        progressPercent: 0,
        startedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        logs,
      }

      let existingCampaigns: any[] = []
      if (fs.existsSync(paths.campaignStateFile)) {
        try {
          const parsed = JSON.parse(fs.readFileSync(paths.campaignStateFile, "utf8"))
          if (parsed && Array.isArray(parsed.campaigns)) existingCampaigns = parsed.campaigns
        } catch {}
      }

      const nextCampaigns = [newCampaign, ...existingCampaigns]
      fs.writeFileSync(
        paths.campaignStateFile,
        JSON.stringify({ campaigns: nextCampaigns, updatedAt: new Date().toISOString() }, null, 2),
        "utf8"
      )

      // Check if 24/7 Live Messenger Bot is running — if so, queue directly into inbox-pending-replies.json for instant delivery!
      let activeBotRunning = false
      if (fs.existsSync(paths.inboxLockFile)) {
        try {
          const lock = JSON.parse(fs.readFileSync(paths.inboxLockFile, "utf8"))
          activeBotRunning = Boolean(lock && lock.activeJobId)
        } catch {}
      }

      if (activeBotRunning) {
        let pendingList: any[] = []
        if (fs.existsSync(paths.pendingRepliesFile)) {
          try {
            pendingList = JSON.parse(fs.readFileSync(paths.pendingRepliesFile, "utf8"))
            if (!Array.isArray(pendingList)) pendingList = []
          } catch {
            pendingList = []
          }
        }

        for (const logItem of logs) {
          pendingList.push({
            id: logItem.id,
            campaignId,
            logId: logItem.id,
            customerName: logItem.groupName,
            groupName: logItem.groupName,
            threadId: logItem.threadId,
            replyText: logItem.sentMessageText,
            status: "PENDING",
            createdAt: new Date().toISOString(),
          })
        }
        fs.writeFileSync(paths.pendingRepliesFile, JSON.stringify(pendingList, null, 2), "utf8")
      } else {
        // Spawn standalone facebook-messenger-group-bot.js to deliver on Live Messenger
        const dispatchJobId = `msg-grp-dispatch-${Date.now()}`
        const configPath = path.join(paths.tempDir, `${dispatchJobId}-config.json`)
        const firstGrp = selectedGroups[0] || {}
        fs.writeFileSync(
          configPath,
          JSON.stringify(
            {
              action: "DISPATCH_CAMPAIGN",
              sourceType: firstGrp.sourceType || "Page",
              targetId: firstGrp.assignedAccountId || "61595136714776",
              targetName: String(firstGrp.assignedAccountName || "Test Next").replace(/\s*\(.*\)$/, ""),
              campaignId,
              delaySeconds: Math.max(2, Number(delayMinutes) * 2),
              targets: logs.map((l) => ({
                logId: l.id,
                groupId: l.groupId,
                groupName: l.groupName,
                threadId: l.threadId,
                messageText: l.sentMessageText,
              })),
              headless: false,
            },
            null,
            2
          ),
          "utf8"
        )
        const scriptPath = path.join(paths.botDir, "facebook-messenger-group-bot.js")
        const child = spawn("node", [scriptPath, configPath], {
          cwd: paths.botDir,
          detached: true,
          stdio: "ignore",
        })
        child.unref()
      }

      return NextResponse.json({
        success: true,
        campaign: newCampaign,
        campaigns: nextCampaigns,
        deliveryMode: activeBotRunning ? "ACTIVE_24X7_BOT_QUEUE" : "STANDALONE_LIVE_BOT",
      })
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
