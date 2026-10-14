import { NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import fs from "fs"

function getPaths() {
  const botDir = path.resolve(process.cwd(), "..", "..", "scripts", "facebook-bot")
  const tempDir = path.join(botDir, "temp")
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })
  return {
    botDir,
    tempDir,
    sessionFile: path.join(botDir, "active-session.json"),
    stateFile: path.join(tempDir, "group-admin-state.json"),
    scriptFile: path.join(botDir, "facebook-group-admin-bot.js"),
  }
}

const DEFAULT_ADMIN_GROUPS = [
  {
    id: "bmt-marketers-hub",
    name: "BMT Digital Marketers & Entrepreneurs BD",
    role: "Admin",
    members: 45200,
    pendingMembers: 14,
    pendingPosts: 6,
    autoApproveActive: true,
    privacy: "Private",
    activityScore: 94,
  },
  {
    id: "bd-ecommerce-leaders",
    name: "Bangladesh E-Commerce Business Leaders",
    role: "Admin",
    members: 88400,
    pendingMembers: 29,
    pendingPosts: 12,
    autoApproveActive: true,
    privacy: "Public",
    activityScore: 91,
  },
  {
    id: "affiliate-masters-bd",
    name: "Affiliate Marketing Masters BD",
    role: "Admin",
    members: 31500,
    pendingMembers: 8,
    pendingPosts: 3,
    autoApproveActive: false,
    privacy: "Private",
    activityScore: 86,
  },
  {
    id: "dhaka-wholesale-hub",
    name: "Dhaka Wholesale & Dropship Community",
    role: "Moderator",
    members: 112000,
    pendingMembers: 42,
    pendingPosts: 19,
    autoApproveActive: true,
    privacy: "Public",
    activityScore: 96,
  },
]

function loadState(stateFile: string) {
  if (fs.existsSync(stateFile)) {
    try {
      return JSON.parse(fs.readFileSync(stateFile, "utf8"))
    } catch {}
  }
  return {
    assistantRunning: false,
    activeAction: "IDLE",
    currentStepLabel: "Ready — গ্রুপ নির্বাচন করে অটো-অ্যাপ্রুভাল ও মডারেশন শুরু করুন",
    progress: 0,
    totalMembersApproved: 248,
    totalPostsApproved: 94,
    totalWelcomeSent: 18,
    pendingMembersCount: 14,
    pendingPostsCount: 6,
    recentApprovedMembers: [
      {
        id: "mem-init-1",
        name: "Nayeem Chowdhury",
        groupName: "BMT Digital Marketers & Entrepreneurs BD",
        accountAge: "Account age: 2 years",
        approvedAt: "10:30 AM",
        status: "Approved",
      },
      {
        id: "mem-init-2",
        name: "Sadia Sultana",
        groupName: "BMT Digital Marketers & Entrepreneurs BD",
        accountAge: "Account age: 8 months",
        approvedAt: "10:35 AM",
        status: "Approved",
      },
      {
        id: "mem-init-3",
        name: "Mehedi Hasan",
        groupName: "Bangladesh E-Commerce Business Leaders",
        accountAge: "Account age: 1 year",
        approvedAt: "10:42 AM",
        status: "Approved",
      },
    ],
    recentApprovedPosts: [
      {
        id: "post-init-1",
        author: "Tanvir Rahman",
        snippet: "মার্কেটিং স্ট্র্যাটেজি নিয়ে একটি শিক্ষণীয় পোস্ট...",
        groupName: "BMT Digital Marketers & Entrepreneurs BD",
        approvedAt: "10:45 AM",
        status: "Published",
      },
      {
        id: "post-init-2",
        author: "E-Com Seller BD",
        snippet: "নতুন ক্যাম্পেইন অপটিমাইজেশন কেস স্টাডি...",
        groupName: "Bangladesh E-Commerce Business Leaders",
        approvedAt: "10:50 AM",
        status: "Published",
      },
    ],
    auditLogs: [
      {
        id: "audit-init-1",
        timestamp: "10:45:10 AM",
        action: "Post Auto-Approved: Marketing Strategy Case Study",
        group: "BMT Digital Marketers & Entrepreneurs BD",
        status: "SUCCESS",
        details: "Clean post by Tanvir Rahman",
      },
      {
        id: "audit-init-2",
        timestamp: "10:35:22 AM",
        action: "Member Approved: Sadia Sultana",
        group: "BMT Digital Marketers & Entrepreneurs BD",
        status: "SUCCESS",
        details: "All criteria passed (Account age: 8m, Profile pic present)",
      },
    ],
  }
}

function saveState(stateFile: string, state: any) {
  state.updatedAt = new Date().toISOString()
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), "utf8")
}

export async function GET() {
  const { stateFile } = getPaths()
  const state = loadState(stateFile)

  return NextResponse.json({
    success: true,
    groups: DEFAULT_ADMIN_GROUPS,
    state,
  })
}

export async function POST(req: NextRequest) {
  const { botDir, stateFile, scriptFile } = getPaths()
  const body = await req.json().catch(() => ({}))
  const {
    action = "RUN_ALL", // APPROVE_MEMBERS, APPROVE_POSTS, SEND_WELCOME, RUN_ALL, RESET, UPDATE_RULES
    groupId = "bmt-marketers-hub",
    groupName = "BMT Digital Marketers & Entrepreneurs BD",
    limit = 10,
    requirePic = true,
    requireRules = true,
    requireQuestions = true,
    minAgeMonths = 3,
    welcomeText = "🎉 স্বাগতম আমাদের নতুন মেম্বারদের! গ্রুপের নিয়ম মেনে কোয়ালিটি আলোচনা চালিয়ে যান। Welcome to our community! 👋",
  } = body

  let state = loadState(stateFile)

  if (action === "RESET") {
    state.assistantRunning = false
    state.currentStepLabel = "Ready — পুনরায় শুরু করার জন্য প্রস্তুত"
    state.progress = 0
    saveState(stateFile, state)
    return NextResponse.json({ success: true, message: "State reset successfully", state })
  }

  if (action === "EXPORT_CSV") {
    const header = "ID,Timestamp,Action,Group,Status,Details\n"
    const rows = state.auditLogs
      .map(
        (log: any) =>
          `"${log.id}","${log.timestamp}","${log.action.replace(/"/g, '""')}","${log.group}","${log.status}","${(log.details || "").replace(/"/g, '""')}"`
      )
      .join("\n")
    return new NextResponse(header + rows, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="group-admin-audit-${Date.now()}.csv"`,
      },
    })
  }

  if (state.assistantRunning) {
    return NextResponse.json(
      { success: false, message: "একটি Admin Assistant টাস্ক ইতিমধ্যে চলমান রয়েছে। অপেক্ষা করুন।" },
      { status: 409 }
    )
  }

  state.assistantRunning = true
  state.activeAction = action
  state.targetGroupId = groupId
  state.targetGroupName = groupName
  state.progress = 5
  state.currentStepLabel = `গ্রুপ মডারেশন শুরু হচ্ছে: ${groupName}...`
  saveState(stateFile, state)

  // Launch background bot process
  const args = [
    scriptFile,
    "--group-id",
    groupId,
    "--group-name",
    groupName,
    "--action",
    action,
    "--limit",
    String(limit),
    "--require-pic",
    String(requirePic),
    "--require-rules",
    String(requireRules),
    "--require-questions",
    String(requireQuestions),
    "--min-age-months",
    String(minAgeMonths),
    "--welcome-text",
    welcomeText,
  ]

  const child = spawn("node", args, {
    cwd: botDir,
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  })

  child.unref()

  return NextResponse.json({
    success: true,
    message: `Admin Assistant টাস্ক শুরু হয়েছে (${action} for ${groupName})`,
    state,
  })
}
