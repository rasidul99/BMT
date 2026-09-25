import { create } from "zustand"

interface SidebarState {
  isCollapsed: boolean
  isMobileOpen: boolean
  toggleSidebar: () => void
  setCollapsed: (collapsed: boolean) => void
  toggleMobileSidebar: () => void
  closeMobileSidebar: () => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: typeof window !== "undefined" ? localStorage.getItem("bmt_sidebar_collapsed") === "true" : false,
  isMobileOpen: false,
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
  toggleMobileSidebar: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
  closeMobileSidebar: () => set({ isMobileOpen: false }),
}))
