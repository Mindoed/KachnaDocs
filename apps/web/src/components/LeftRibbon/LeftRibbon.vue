<script setup lang="ts">
import { Calendar, Home, Inbox, Search, Settings } from '@lucide/vue'
import { Sidebar } from '@/components/ui/sidebar'

import type { DiscordUser } from '@kachnadocs/shared'

import RibbonFooter from './RibbonFooter.vue'
import RibbonContent from './RibbonContent.vue'

// Menu items.
const items = [
  {
    title: 'Home',
    url: '#',
    icon: Home,
  },
  {
    title: 'Inbox',
    url: '#',
    icon: Inbox,
  },
  {
    title: 'Calendar',
    url: '#',
    icon: Calendar,
  },
  {
    title: 'Search',
    url: '#',
    icon: Search,
  },
  {
    title: 'Settings',
    url: '#',
    icon: Settings,
  },
]

defineProps<{
  user: DiscordUser | null
}>()
</script>

<template>
  <Sidebar collapsible="none" class="w-auto border-r-2">
    <!-- <RibbonHeader :user="user" /> -->
    <RibbonContent :items="items" />
    <RibbonFooter :user="user" />
  </Sidebar>
</template>
