<script setup lang="ts">
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import type { LucideIcon } from '@lucide/vue'

defineProps<{
  items: {
    title: string
    url: string
    icon: LucideIcon
  }[]
}>()
</script>

<template>
  <SidebarContent>
    <SidebarGroup>
      <SidebarGroupLabel>Application</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem v-for="item in items" :key="item.title">
            <SidebarMenuButton as-child :tooltip="item.title">
              <a :href="item.url">
                <component :is="item.icon" />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  </SidebarContent>
</template>
