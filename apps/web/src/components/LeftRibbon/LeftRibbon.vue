<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Calendar, Home, Inbox, Search, Settings } from '@lucide/vue'
import { Sidebar } from '@/components/ui/sidebar'

import type { DiscordUser } from '@kachnadocs/shared'

import SidebarSeparator from '../ui/sidebar/SidebarSeparator.vue'
import RibbonFooter from './RibbonFooter.vue'
import RibbonHeader from './RibbonHeader.vue'
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

/** Shape of GET /api/auth/me — the user is nested under `user`. */
interface MeResponse {
  authenticated: boolean
  user: DiscordUser | null
}

const user = ref<DiscordUser | null>(null)

onMounted(async () => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/me', {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const body = (await response.json()) as MeResponse
    if (!body.authenticated) {
      throw new Error('User is not authenticated.')
    }

    user.value = body.user
    console.log('Authenticated user loaded:', user.value)
  } catch {
    console.error('Could not load authenticated user.')

    window.location.href = '/auth'
  }
})
</script>

<template>
  <Sidebar collapsible="icon">
    <RibbonHeader :user="user" />
    <SidebarSeparator class="mx-auto" />
    <RibbonContent :items="items" />
    <RibbonFooter :user="user" />
  </Sidebar>
</template>
