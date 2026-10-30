<script setup lang="ts">
import { EditorContent, Editor } from '@tiptap/vue-3'

defineProps<{
  editor: Editor | null
}>()
</script>

<template>
  <EditorContent v-if="editor" :editor="editor" />
</template>
