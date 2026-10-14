"use client"

import { useState, useEffect, useCallback } from "react"

export interface FinanceTransaction {
  id: string
  date: string
  description: string
  category: string
  type: "INCOME" | "EXPENSE"
  amount: number
  paymentMethod: string
  status: string
  recordedBy: string
}

export function useCompanyFinance() {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([])
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)
  const [netProfit, setNetProfit] = useState(0)
  const [profitMargin, setProfitMargin] = useState("0")
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL")
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL")
  const [loading, setLoading] = useState(false)

  const fetchFinance = useCallback(async () => {
    try {
      setLoading(true)
      const query = new URLSearchParams()
      if (typeFilter !== "ALL") query.append("type", typeFilter)
      if (categoryFilter !== "ALL") query.append("category", categoryFilter)

      const res = await fetch(`/api/admin/finance?${query.toString()}`)
      const data = await res.json()
      if (data.success) {
        setTransactions(data.transactions || [])
        setTotalIncome(data.totalIncome || 0)
        setTotalExpense(data.totalExpense || 0)
        setNetProfit(data.netProfit || 0)
        setProfitMargin(data.profitMargin || "0")
      }
    } catch (e) {
      console.error("Failed to load company finance data", e)
    } finally {
      setLoading(false)
    }
  }, [typeFilter, categoryFilter])

  useEffect(() => {
    fetchFinance()
  }, [fetchFinance])

  const addTransaction = async (tx: Partial<FinanceTransaction>) => {
    try {
      const res = await fetch("/api/admin/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ADD_TRANSACTION", transaction: tx }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchFinance()
        return data.transaction
      }
    } catch (e) {
      console.error("Failed to add finance transaction", e)
    }
  }

  const deleteTransaction = async (id: string) => {
    try {
      const res = await fetch("/api/admin/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE_TRANSACTION", id }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchFinance()
      }
    } catch (e) {
      console.error("Failed to delete transaction", e)
    }
  }

  const exportCsv = () => {
    const query = new URLSearchParams({ format: "csv" })
    if (typeFilter !== "ALL") query.append("type", typeFilter)
    if (categoryFilter !== "ALL") query.append("category", categoryFilter)
    window.open(`/api/admin/finance?${query.toString()}`, "_blank")
  }

  return {
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
    refresh: fetchFinance,
  }
}
