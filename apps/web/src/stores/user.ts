import { defineStore } from 'pinia'

import { apiUrl } from '@/lib/paths'
import type { DiscordUser } from '@kachnadocs/shared'

/** Distinct enough on a shared screen without becoming a color-management problem. */
const CARET_COLORS = [
  '#e91e63',
  '#3f51b5',
  '#009688',
  '#ff9800',
  '#795548',
  '#607d8b',
  '#9c27b0',
  '#4caf50',
]

interface MeResponse {
  authenticated: boolean
  user: DiscordUser | null
}

/**
 * The signed-in user, for the pieces of UI that need an identity but sit
 * outside AppView's own fetch (the editor's caret, presence chips, …).
 * AppView keeps its own copy for now — one extra GET /auth/me is cheaper
 * than restructuring the app shell as a side effect of the editor.
 */
export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as DiscordUser | null,
    loaded: false,
  }),

  getters: {
    displayName(state): string {
      return state.user?.username ?? 'Anonymous'
    },

    /** Stable per user: everyone sees the same color for the same collaborator. */
    caretColor(state): string {
      const id = state.user?.id ?? ''
      let hash = 0
      for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
      return CARET_COLORS[hash % CARET_COLORS.length]!
    },
  },

  actions: {
    async fetchMe(): Promise<DiscordUser | null> {
      if (this.loaded) return this.user

      try {
        const response = await fetch(apiUrl('/auth/me'), { credentials: 'include' })
        if (response.ok) {
          const body = (await response.json()) as MeResponse
          this.user = body.authenticated ? body.user : null
        }
      } catch {
        // The editor shows its own connection state; a failed identity fetch
        // only costs the caret its name.
      } finally {
        this.loaded = true
      }

      return this.user
    },
  },
})
