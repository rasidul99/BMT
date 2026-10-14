"use client"

import React, { useState } from "react"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  Download,
  Printer,
  Plus,
  Filter,
  Trash2,
  Calendar,
  CreditCard,
  Building2,
  FileText,
  CheckCircle2,
  RotateCw,
  PieChart,
  ShieldAlert,
} from "lucide-react"
import { useCompanyFinance, FinanceTransaction } from "../../hooks/useCompanyFinance"

export function CompanyFinanceCenter() {
  const {
    transactions,
    totalIncome,
    totalExpense,
    netProfit,
    profitMargin,
    typeFilter,
    setTypeFilter,
    categoryFilter,
    setCategoryFilter,
    loading,
    addTransaction,
    deleteTransaction,
    exportCsv,
    refresh,
  } = useCompanyFinance()

  const [showAddModal, setShowAddModal] = useState(false)
  const [desc, setDesc] = useState("")
  const [amount, setAmount] = useState("")
  const [txType, setTxType] = useState<"INCOME" | "EXPENSE">("INCOME")
  const [category, setCategory] = useState("Subscription Revenue")
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer")

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print()
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!desc || !amount) return
    await addTransaction({
      description: desc,
      amount: parseFloat(amount),
      type: txType,
      category,
      paymentMethod,
    })
    setDesc("")
    setAmount("")
    setShowAddModal(false)
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 mb-2">
            <Building2 className="h-3.5 w-3.5" />
            <span>Platform Financial Ledger & Accounting</span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300">
              Super Admin & Finance
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Company Income & Expense Report
          </h1>
          <p className="text-sm text-slate-400">
            কোম্পানির মোট আয়, ব্যয়, নিট লাভ এবং লাইভ আর্থিক বিবরণীর সম্পূর্ণ রিয়েল-টাইম হিসেব।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 shadow-sm"
          >
            <Printer className="h-4 w-4 text-blue-400" />
            <span>প্রিন্ট / PDF রিপোর্ট</span>
          </button>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 shadow-sm"
          >
            <Download className="h-4 w-4 text-emerald-400" />
            <span>Excel / CSV</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>নতুন লেনদেন রেকর্ড</span>
          </button>
        </div>
      </div>

      {/* Printable Company Header (Only visible when printing or in export) */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 text-black">
        <h2 className="text-2xl font-black tracking-tight">BMT AUTOMATION TECHNOLOGIES LTD.</h2>
        <p className="text-xs text-gray-600">Company Income, Expense & Net Profit Financial Statement</p>
        <p className="text-xs text-gray-500 mt-1">Generated: {new Date().toLocaleString()}</p>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total Income */}
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 to-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">মোট আয় (Total Revenue)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400">${totalIncome.toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-slate-400">
            ≈ ৳{(totalIncome * 122).toLocaleString()} BDT
          </div>
        </div>

        {/* Total Expenses */}
        <div className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-950/30 to-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">মোট খরচ (Total Expenses)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-red-400">${totalExpense.toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-slate-400">
            ≈ ৳{(totalExpense * 122).toLocaleString()} BDT
          </div>
        </div>

        {/* Net Profit */}
        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/30 to-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">নিট লাভ (Net Profit)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-white">${netProfit.toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>পজিটিভ ক্যাশফ্লো</span>
          </div>
        </div>

        {/* Profit Margin */}
        <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/30 to-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">প্রফিট মার্জিন (Profit Margin)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300">{profitMargin}%</div>
          <div className="mt-1 text-[11px] text-purple-400">হাই-মার্জিন SaaS অপারেশন</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-3 print:hidden">
        {/* Type Tabs */}
        <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800">
          <button
            onClick={() => setTypeFilter("ALL")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              typeFilter === "ALL" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            সকল লেনদেন ({transactions.length})
          </button>
          <button
            onClick={() => setTypeFilter("INCOME")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              typeFilter === "INCOME" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            শুধুমাত্র আয় (Income)
          </button>
          <button
            onClick={() => setTypeFilter("EXPENSE")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              typeFilter === "EXPENSE" ? "bg-red-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            শুধুমাত্র ব্যয় (Expense)
          </button>
        </div>

        {/* Category Dropdown & Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="h-3.5 w-3.5" />
            <span>ক্যাটাগরি:</span>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="ALL">সকল ক্যাটাগরি</option>
            <option value="Subscription Revenue">Subscription Revenue</option>
            <option value="Infrastructure & Proxies">Infrastructure & Proxies</option>
            <option value="Server & Cloud Hosting">Server & Cloud Hosting</option>
            <option value="Payroll & Salaries">Payroll & Salaries</option>
            <option value="Affiliate Commissions">Affiliate Commissions</option>
            <option value="Add-on Sales">Add-on Sales</option>
          </select>
          <button
            onClick={() => refresh()}
            className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-400 hover:text-white"
            title="রিফ্রেশ"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Financial Ledger Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5">তারিখ</th>
                <th className="p-3.5">বিবরণ / লেনদেন</th>
                <th className="p-3.5">ক্যাটাগরি</th>
                <th className="p-3.5">পেমেন্ট মেথড</th>
                <th className="p-3.5">টাইপ</th>
                <th className="p-3.5 text-right">পরিমাণ (USD)</th>
                <th className="p-3.5 text-right">পরিমাণ (BDT)</th>
                <th className="p-3.5 text-center print:hidden">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-3.5 font-mono text-[11px] text-slate-400">{tx.date}</td>
                  <td className="p-3.5 font-medium text-white max-w-xs">{tx.description}</td>
                  <td className="p-3.5">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                      {tx.category}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-400">{tx.paymentMethod}</td>
                  <td className="p-3.5">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        tx.type === "INCOME"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td
                    className={`p-3.5 text-right font-mono font-bold ${
                      tx.type === "INCOME" ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {tx.type === "INCOME" ? "+" : "-"}${tx.amount.toLocaleString()}
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-400">
                    ৳{(tx.amount * 122).toLocaleString()}
                  </td>
                  <td className="p-3.5 text-center print:hidden">
                    <button
                      onClick={() => deleteTransaction(tx.id)}
                      className="rounded p-1 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition"
                      title="মুছুন"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Table Footer Totals */}
            <tfoot className="bg-slate-950 font-bold border-t-2 border-slate-700 text-xs text-white">
              <tr>
                <td colSpan={5} className="p-3.5 text-right">
                  সর্বমোট নিট লাভ (Net Balance):
                </td>
                <td className="p-3.5 text-right font-mono text-blue-400 font-black">
                  ${netProfit.toLocaleString()}
                </td>
                <td className="p-3.5 text-right font-mono text-slate-300">
                  ৳{(netProfit * 122).toLocaleString()}
                </td>
                <td className="print:hidden"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-white">নতুন আর্থিক লেনদেন যুক্ত করুন</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">লেনদেনের ধরন (Type)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxType("INCOME")}
                    className={`rounded-lg py-2 text-xs font-semibold border ${
                      txType === "INCOME"
                        ? "bg-emerald-600 text-white border-emerald-500"
                        : "bg-slate-950 text-slate-400 border-slate-800"
                    }`}
                  >
                    + আয় (Income)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType("EXPENSE")}
                    className={`rounded-lg py-2 text-xs font-semibold border ${
                      txType === "EXPENSE"
                        ? "bg-red-600 text-white border-red-500"
                        : "bg-slate-950 text-slate-400 border-slate-800"
                    }`}
                  >
                    - ব্যয় (Expense)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">বিবরণ (Description)</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মাসিক প্রক্সি সার্ভিস খরচ"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">পরিমাণ (USD $)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">ক্যাটাগরি</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Subscription Revenue">Subscription Revenue</option>
                  <option value="Infrastructure & Proxies">Infrastructure & Proxies</option>
                  <option value="Server & Cloud Hosting">Server & Cloud Hosting</option>
                  <option value="Payroll & Salaries">Payroll & Salaries</option>
                  <option value="Affiliate Commissions">Affiliate Commissions</option>
                  <option value="Add-on Sales">Add-on Sales</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">পেমেন্ট মেথড</label>
                <input
                  type="text"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  placeholder="যেমন: Bank Wire / Stripe / bKash"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  রেকর্ড সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
