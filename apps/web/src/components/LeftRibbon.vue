<script setup lang="ts">
import { Calendar, Home, Inbox, Search, Settings } from '@lucide/vue'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import Avatar from './ui/avatar/Avatar.vue'
import AvatarImage from './ui/avatar/AvatarImage.vue'
import AvatarFallback from './ui/avatar/AvatarFallback.vue'

import { DiscordAvatar, DiscordIcon } from '@kachnadocs/shared'
import SidebarFooter from './ui/sidebar/SidebarFooter.vue'

import { ref, onMounted } from 'vue'
import type { DiscordUser } from '@kachnadocs/shared'
import SidebarHeader from './ui/sidebar/SidebarHeader.vue'

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
const loading = ref(true)
const error = ref<string | null>(null)

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
    error.value = 'Could not load authenticated user.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader>
      <Avatar class="rounded-sm size-7 mx-auto">
        <AvatarImage :src="DiscordIcon.getUrl(user?.guild.id, user?.guild.icon)" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Application</SidebarGroupLabel>
        <SidebarGroupContent>
          <TooltipProvider>
            <SidebarMenu>
              <SidebarMenuItem v-for="item in items" :key="item.title">
                <Tooltip>
                  <TooltipTrigger as-child>
                    <SidebarMenuButton as-child>
                      <a :href="item.url">
                        <component :is="item.icon" />
                      </a>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{{ item.title }}</p>
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>
            </SidebarMenu>
          </TooltipProvider>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>
      <Avatar>
        <AvatarImage :src="DiscordAvatar.getUrl(user?.id, user?.avatar)" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    </SidebarFooter>
  </Sidebar>
</template>
