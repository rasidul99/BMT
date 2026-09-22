import { create } from "zustand"

interface SidebarState {
  isCollapsed: boolean
  toggleSidebar: () => void
  setCollapsed: (collapsed: boolean) => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: typeof window !== "undefined" ? localStorage.getItem("bmt_sidebar_collapsed") === "true" : false,
  toggleSidebar: () =>
    set((state) => {
      const next = !state.isCollapsed
      if (typeof window !== "undefined") {
        localStorage.setItem("bmt_sidebar_collapsed", String(next))
      }
      return { isCollapsed: next }
    }),
  setCollapsed: (collapsed: boolean) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("bmt_sidebar_collapsed", String(collapsed))
    }
    set({ isCollapsed: collapsed })
  },
}))
