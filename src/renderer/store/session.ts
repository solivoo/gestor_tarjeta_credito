import { create } from 'zustand'
import type { AuthUser } from '../lib/api'

interface SessionState {
  user: AuthUser | null
  authReady: boolean
  selectedCardId: string | null
  setUser: (user: AuthUser | null) => void
  setAuthReady: (ready: boolean) => void
  setSelectedCardId: (id: string | null) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  authReady: false,
  selectedCardId: null,
  setUser: (user) => set({ user }),
  setAuthReady: (authReady) => set({ authReady }),
  setSelectedCardId: (id) => set({ selectedCardId: id }),
}))
