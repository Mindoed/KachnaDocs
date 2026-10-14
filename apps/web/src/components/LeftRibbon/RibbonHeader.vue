<script setup lang="ts">
import { SidebarHeader } from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DiscordIcon } from '@kachnadocs/shared'
import type { DiscordUser } from '@kachnadocs/shared'
defineProps<{
  user: DiscordUser | null
}>()
</script>

<template>
  <SidebarHeader>
    <Avatar class="rounded-sm size-7 m-auto">
      <AvatarImage :src="DiscordIcon.getUrl(user?.guild.id, user?.guild.icon)" />
      <AvatarFallback>G</AvatarFallback>
    </Avatar>
  </SidebarHeader>
</template>
