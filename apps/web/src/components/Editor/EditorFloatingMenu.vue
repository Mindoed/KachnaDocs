<script setup lang="ts">
import { Editor } from '@tiptap/vue-3'

defineProps<{
  editor: Editor | null
}>()
</script>

<template>
  <slot />
</template>
