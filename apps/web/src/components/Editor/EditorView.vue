<script setup lang="ts">
import EditorWindow from './EditorWindow.vue'
import EditorFloatingMenu from './EditorFloatingMenu.vue'

import { onMounted, onBeforeUnmount, ref, shallowRef } from 'vue'

import { Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'

const content = ref(
  '<h1>H1</h1>' +
    '<h2>H2</h2>' +
    '<h3>H3</h3>' +
    '<p>Paragraph</p>' +
    '<ul><li>List item</li></ul>' +
    '<ol><li>Ordered list item</li></ol>' +
    '<blockquote>Blockquote</blockquote>' +
    '<pre><code>Code block</code></pre>' +
    '<hr />' +
    '<a href="https://example.com">Link</a>' +
    '<img src="https://via.placeholder.com/150" alt="Placeholder image" />',
)

const editor = shallowRef<Editor | null>(null)
onMounted(() => {
  editor.value = new Editor({
    extensions: [StarterKit],
    content: content.value,
    editorProps: {
      attributes: {
        class: 'tiptap',
      },
    },
    injectCSS: false,
  })
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <div class="tiptap-container">
    <EditorWindow :editor="editor" />
    <EditorFloatingMenu :editor="editor" />
  </div>
</template>
