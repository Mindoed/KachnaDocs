<script setup lang="ts">
import { Sidebar } from '@/components/ui/sidebar'

import type { DiscordUser } from '@kachnadocs/shared'

import RibbonFooter from './RibbonFooter.vue'
import RibbonContent from './RibbonContent.vue'

defineProps<{
  user: DiscordUser | null
}>()
</script>

<template>
  <Sidebar collapsible="none" class="w-auto border-r-2">
    <!-- <RibbonHeader :user="user" /> -->
    <RibbonContent />
    <RibbonFooter :user="user" />
  </Sidebar>
</template>
