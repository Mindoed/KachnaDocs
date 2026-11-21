<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef } from 'vue'

import { Editor } from '@tiptap/vue-3'
import { WebSocketStatus } from '@hocuspocus/provider'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCaret from '@tiptap/extension-collaboration-caret'

import EditorWindow from './EditorWindow.vue'
import EditorFloatingMenu from './EditorFloatingMenu.vue'

import { useCollaboration } from '@/features/editor/useCollaboration'
import { useDocumentStore } from '@/stores/document'
import { useUserStore } from '@/stores/user'

const docStore = useDocumentStore()
const userStore = useUserStore()

const editor = shallowRef<Editor | null>(null)

// The Y.Doc arrives synced-or-not; until it has synced, an editable editor
// would let local keystrokes race the server state that is still on its way.
const { ydoc, status, synced, unauthorized, connect, destroy } = useCollaboration(
  async (documentId) => (await docStore.fetchCollaborationToken(documentId)).token,
)

const statusText = computed(() => {
  if (docStore.error) return docStore.error
  if (unauthorized.value) return 'The server rejected this session.'
  if (!docStore.active) return 'Opening document…'
  if (synced.value) return docStore.canEdit ? 'Synced' : 'View only'
  if (status.value === WebSocketStatus.Connected) return 'Loading…'
  return status.value === WebSocketStatus.Connecting ? 'Connecting…' : 'Disconnected — retrying…'
})

function applyEditable() {
  // Read-only is a *server* decision (the role from the ACL, enforced again
  // by Hocuspocus on the wire); this only reflects it in the UI.
  editor.value?.setEditable(synced.value && docStore.canEdit)
}

onMounted(async () => {
  await userStore.fetchMe()

  const doc = await docStore.ensureActiveDocument().catch((error: unknown) => {
    docStore.error = error instanceof Error ? error.message : String(error)
    return null
  })
  if (!doc) return

  const hocuspocus = connect(doc.id)

  editor.value = new Editor({
    // Until the first sync completes — see applyEditable.
    editable: false,

    extensions: [
      // Undo/redo comes from Yjs (Collaboration), not from the local history:
      // a plain undo stack would revert other users' edits as if they were ours.
      StarterKit.configure({ undoRedo: false }),

      Collaboration.configure({
        document: ydoc,
        field: 'default',
      }),

      CollaborationCaret.configure({
        provider: hocuspocus,
        user: {
          name: userStore.displayName,
          color: userStore.caretColor,
        },
      }),
    ],

    editorProps: {
      attributes: {
        class: 'tiptap',
      },
    },
    injectCSS: false,
  })

  hocuspocus.on('synced', applyEditable)
  hocuspocus.on('unsynced', applyEditable)

  // A sync that completed during initialization has already fired its event.
  if (hocuspocus.isSynced) applyEditable()
})

onBeforeUnmount(() => {
  editor.value?.destroy()
  destroy()
})
</script>

<template>
  <!-- <div class="flex min-h-0 grow flex-col">
    <div
      class="flex shrink-0 items-baseline gap-2 border-b border-black/10 px-4 py-1.5 text-xs opacity-60 dark:border-white/10"
    >
      <div class="absolute">
        <span class="truncate">{{ docStore.active?.title ?? 'Untitled' }}</span>
        <span aria-hidden="true">·</span>
        <span>{{ statusText }}</span>
      </div>
    </div>
  </div> -->

  <div class="tiptap-container">
    <EditorWindow :editor="editor" />
    <EditorFloatingMenu :editor="editor" />
  </div>
</template>
