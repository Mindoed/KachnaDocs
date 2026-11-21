import { defineStore } from 'pinia'

import { apiUrl } from '@/lib/paths'
import type { CollaborationTokenDto, DocumentDto } from '@kachnadocs/shared'

/** Which document the editor should reopen after a page reload. */
const ACTIVE_DOCUMENT_KEY = 'kachnadocs.activeDocument'

/**
 * Everything REST about documents: the list, the active document's metadata,
 * and the short-lived collaboration tokens.
 *
 * The store deliberately knows nothing about Yjs, Tiptap or the provider —
 * per the state-ownership split, the document body belongs to the Y.Doc and
 * the connection belongs to the provider; duplicating either here is how
 * feedback loops get built.
 */
export const useDocumentStore = defineStore('document', {
  state: () => ({
    documents: [] as DocumentDto[],
    activeId: null as string | null,
    loadingList: false,
    loadingActive: false,
    error: null as string | null,
  }),

  getters: {
    active(state): DocumentDto | null {
      return state.documents.find((doc) => doc.id === state.activeId) ?? null
    },

    /** The ACL's answer, not the user's wish: viewers get a read-only editor. */
    canEdit(state): boolean {
      const doc = state.documents.find((d) => d.id === state.activeId)
      return doc != null && doc.role !== 'viewer'
    },
  },

  actions: {
    /** One fetch shape for all document calls: session cookie in, JSON or a thrown Error out. */
    async request<T>(path: string, init?: RequestInit): Promise<T> {
      const response = await fetch(apiUrl(path), {
        credentials: 'include',
        ...init,
        headers: { 'Content-Type': 'application/json', ...init?.headers },
      })

      if (!response.ok) {
        const detail = await response.json().catch(() => null)
        throw new Error(
          (detail as { message?: string | string[] } | null)?.message?.toString() ??
            `HTTP ${response.status}`,
        )
      }

      return (await response.json()) as T
    },

    async fetchDocuments(): Promise<DocumentDto[]> {
      this.loadingList = true
      this.error = null

      try {
        this.documents = await this.request<DocumentDto[]>('/documents')
        return this.documents
      } catch (error) {
        this.error = error instanceof Error ? error.message : String(error)
        throw error
      } finally {
        this.loadingList = false
      }
    },

    async getDocument(id: string): Promise<DocumentDto> {
      const doc = await this.request<DocumentDto>(`/documents/${id}`)

      // Keep the list entry honest about role/title changes made elsewhere.
      const index = this.documents.findIndex((d) => d.id === doc.id)
      if (index >= 0) this.documents[index] = doc
      else this.documents.push(doc)

      return doc
    },

    async createDocument(title: string): Promise<DocumentDto> {
      const doc = await this.request<DocumentDto>('/documents', {
        method: 'POST',
        body: JSON.stringify({ title }),
      })

      this.documents.unshift(doc)
      this.setActive(doc.id)
      return doc
    },

    /** Mints a fresh short-lived token; the provider calls this again when its current one expires. */
    async fetchCollaborationToken(id: string): Promise<CollaborationTokenDto> {
      return this.request<CollaborationTokenDto>(`/documents/${id}/collaboration-token`, {
        method: 'POST',
      })
    },

    setActive(id: string | null) {
      this.activeId = id

      if (id) localStorage.setItem(ACTIVE_DOCUMENT_KEY, id)
      else localStorage.removeItem(ACTIVE_DOCUMENT_KEY)
    },

    /**
     * Resolve which document the editor should open, in order of specificity:
     * an explicit `?doc=` link, the last document opened in this browser, or a
     * brand-new one so first run lands in an editable page instead of an error.
     *
     * A stored id the API rejects (deleted, access revoked) is cleared and
     * falls through to the next choice rather than wedging the editor.
     */
    async ensureActiveDocument(preferId?: string | null): Promise<DocumentDto | null> {
      this.loadingActive = true

      try {
        const candidates = [
          preferId,
          new URLSearchParams(window.location.search).get('doc'),
          this.activeId,
          localStorage.getItem(ACTIVE_DOCUMENT_KEY),
        ]

        for (const id of candidates) {
          if (!id) continue

          try {
            const doc = await this.getDocument(id)
            this.setActive(doc.id)
            return doc
          } catch {
            // Not found, not ours, or the API is down — try the next candidate.
            if (id === localStorage.getItem(ACTIVE_DOCUMENT_KEY)) {
              localStorage.removeItem(ACTIVE_DOCUMENT_KEY)
            }
          }
        }

        const docs = await this.fetchDocuments()
        const first = docs[0]
        if (first) {
          this.setActive(first.id)
          return first
        }

        return await this.createDocument('Untitled')
      } finally {
        this.loadingActive = false
      }
    },
  },
})
