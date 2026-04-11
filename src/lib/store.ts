import { create } from 'zustand'
import type { Organization, ErgoUser } from '@/types'

interface AppStore {
  // Auth
  user: ErgoUser | null
  org: Organization | null
  loading: boolean
  setUser: (user: ErgoUser | null) => void
  setOrg: (org: Organization | null) => void
  setLoading: (loading: boolean) => void

  // UI
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  org: null,
  loading: true,
  setUser: (user) => set({ user }),
  setOrg: (org) => set({ org }),
  setLoading: (loading) => set({ loading }),

  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
