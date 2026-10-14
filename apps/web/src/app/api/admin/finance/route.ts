import { NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs"

function getStoragePath() {
  const tempDir = path.resolve(process.cwd(), "..", "..", "scripts", "facebook-bot", "temp")
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })
  return path.join(tempDir, "company-finance.json")
}

const DEFAULT_TRANSACTIONS = [
  {
    id: "tx-101",
    date: "2026-10-12",
    description: "Enterprise Agency Subscription (100 Accounts Plan)",
    category: "Subscription Revenue",
    type: "INCOME",
    amount: 1200,
    paymentMethod: "Bank Wire (Dhaka Bank)",
    status: "Completed",
    recordedBy: "Super Admin",
  },
  {
    id: "tx-102",
    date: "2026-10-11",
    description: "Dedicated 4G Mobile Proxy Pool (50 Dedicated IP Nodes)",
    category: "Infrastructure & Proxies",
    type: "EXPENSE",
    amount: 350,
    paymentMethod: "Corporate Credit Card",
    status: "Completed",
    recordedBy: "Employee Admin (DevOps)",
  },
  {
    id: "tx-103",
    date: "2026-10-10",
    description: "Pro Marketer Monthly Subscriptions (Batch Renewal 28 Users)",
    category: "Subscription Revenue",
    type: "INCOME",
    amount: 2772,
    paymentMethod: "Stripe / SSLCommerz",
    status: "Completed",
    recordedBy: "System Automated Billing",
  },
  {
    id: "tx-104",
    date: "2026-10-09",
    description: "AWS GPU Cluster & Cloud Server Hosting",
    category: "Server & Cloud Hosting",
    type: "EXPENSE",
    amount: 620,
    paymentMethod: "Corporate Credit Card",
    status: "Completed",
    recordedBy: "Super Admin",
  },
  {
    id: "tx-105",
    date: "2026-10-08",
    description: "Affiliate Partner Commission Payout (Q3)",
    category: "Affiliate Commissions",
    type: "EXPENSE",
    amount: 840,
    paymentMethod: "bKash / Bank Transfer",
    status: "Completed",
    recordedBy: "Super Admin",
  },
  {
    id: "tx-106",
    date: "2026-10-07",
    description: "Custom AI Content Generator API Add-on Licenses",
    category: "Add-on Sales",
    type: "INCOME",
    amount: 950,
    paymentMethod: "Stripe",
    status: "Completed",
    recordedBy: "System Automated Billing",
  },
  {
    id: "tx-107",
    date: "2026-10-05",
    description: "Customer Support & Moderation Team Monthly Payroll",
    category: "Payroll & Salaries",
    type: "EXPENSE",
    amount: 2400,
    paymentMethod: "Company Bank Account",
    status: "Completed",
    recordedBy: "Finance Director",
  },
  {
    id: "tx-108",
    date: "2026-10-04",
    description: "Annual Enterprise License — E-Com Brand Group",
    category: "Subscription Revenue",
    type: "INCOME",
    amount: 4500,
    paymentMethod: "Bank Wire Transfer",
    status: "Completed",
    recordedBy: "Super Admin",
  },
]

function loadData() {
  const file = getStoragePath()
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, "utf8"))
    } catch {}
  }
  return {
    transactions: DEFAULT_TRANSACTIONS,
  }
}

function saveData(data: any) {
  const file = getStoragePath()
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8")
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const category = url.searchParams.get("category")
  const type = url.searchParams.get("type") // INCOME, EXPENSE, ALL
  const format = url.searchParams.get("format")

  const data = loadData()
  let filtered = data.transactions

  if (category && category !== "ALL") {
    filtered = filtered.filter((t: any) => t.category === category)
  }
  if (type && type !== "ALL") {
    filtered = filtered.filter((t: any) => t.type === type)
  }

  const totalIncome = filtered
    .filter((t: any) => t.type === "INCOME")
    .reduce((sum: number, t: any) => sum + t.amount, 0)

  const totalExpense = filtered
    .filter((t: any) => t.type === "EXPENSE")
    .reduce((sum: number, t: any) => sum + t.amount, 0)

  const netProfit = totalIncome - totalExpense
  const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : "0"

  if (format === "csv") {
    const header = "ID,Date,Description,Category,Type,Amount (USD),Payment Method,Status,Recorded By\n"
    const rows = filtered
      .map(
        (t: any) =>
          `"${t.id}","${t.date}","${t.description.replace(/"/g, '""')}","${t.category}","${t.type}",${t.amount},"${t.paymentMethod}","${t.status}","${t.recordedBy}"`
      )
      .join("\n")
    return new NextResponse(header + rows, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="company-finance-ledger-${Date.now()}.csv"`,
      },
    })
  }

  return NextResponse.json({
    success: true,
    totalIncome,
    totalExpense,
    netProfit,
    profitMargin,
    count: filtered.length,
    transactions: filtered,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { action = "ADD_TRANSACTION", transaction, id } = body
    const data = loadData()

    if (action === "ADD_TRANSACTION") {
      const newTx = {
        id: `tx-${Date.now()}`,
        date: transaction.date || new Date().toISOString().split("T")[0],
        description: transaction.description || "Uncategorized Transaction",
        category: transaction.category || "General",
        type: transaction.type || "EXPENSE",
        amount: Number(transaction.amount || 0),
        paymentMethod: transaction.paymentMethod || "Bank Transfer",
        status: "Completed",
        recordedBy: transaction.recordedBy || "Super Admin",
      }
      data.transactions.unshift(newTx)
      saveData(data)
      return NextResponse.json({ success: true, transaction: newTx, message: "Transaction recorded successfully" })
    }

    if (action === "DELETE_TRANSACTION") {
      data.transactions = data.transactions.filter((t: any) => t.id !== id)
      saveData(data)
      return NextResponse.json({ success: true, message: "Transaction deleted" })
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
