import { ref, shallowRef } from 'vue'

import { HocuspocusProvider, WebSocketStatus } from '@hocuspocus/provider'
import * as Y from 'yjs'

import { collabUrl } from '@/lib/collab'
import { collabDocumentName } from '@kachnadocs/shared'

/**
 * Owns the pieces of collaborative state that belong to nobody else: the
 * local Y.Doc, the Hocuspocus provider, and what the connection currently
 * reports. Everything document-level (metadata, roles, tokens) stays in the
 * document store; everything document-*body*-level stays in the Y.Doc —
 * mirroring the backend split, where the API answers "who may open this"
 * and Hocuspocus answers "what does it contain".
 *
 * One handle per mounted editor component: the provider is coupled to the
 * editor's lifecycle (created on mount, destroyed on unmount), and reusing
 * one across documents would leak the previous Y.Doc into the next.
 */
export function useCollaboration(getToken: (documentId: string) => Promise<string>) {
  const ydoc = new Y.Doc()
  const provider = shallowRef<HocuspocusProvider | null>(null)
  const status = ref<WebSocketStatus>(WebSocketStatus.Connecting)
  const synced = ref(false)
  const unauthorized = ref(false)

  function connect(documentId: string): HocuspocusProvider {
    disconnect()
    unauthorized.value = false

    const created = new HocuspocusProvider({
      url: collabUrl(),
      name: collabDocumentName(documentId),
      document: ydoc,

      // A function rather than a fixed string: the provider calls it for
      // every authentication, including re-authentication when the previous
      // token expires. That refresh round-trip through the API is what turns
      // a revoked document grant into a dropped or downgraded connection.
      token: () => getToken(documentId),

      onStatus: ({ status: next }) => {
        status.value = next
      },

      onSynced: ({ state }) => {
        synced.value = state
      },

      onAuthenticationFailed: () => {
        unauthorized.value = true
      },
    })

    provider.value = created
    // connect() may run after a disconnect() set the flag; the new provider
    // only reports *changes*, and it starts out already "connecting" — so
    // that first transition may never be announced.
    status.value = WebSocketStatus.Connecting
    return created
  }

  function disconnect() {
    provider.value?.destroy()
    provider.value = null
    synced.value = false
    status.value = WebSocketStatus.Disconnected
  }

  /** Full teardown for onBeforeUnmount — a Y.Doc left alive leaks its update handlers. */
  function destroy() {
    disconnect()
    ydoc.destroy()
  }

  return { ydoc, provider, status, synced, unauthorized, connect, disconnect, destroy }
}
