<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SidebarFooter, SidebarSeparator } from '@/components/ui/sidebar'
import { DiscordAvatar } from '@kachnadocs/shared'
import type { DiscordUser } from '@kachnadocs/shared'

import { UserRound } from '@lucide/vue'

defineProps<{
  user: DiscordUser | null
}>()
</script>

<template>
  <SidebarFooter>
    <SidebarSeparator class="mx-auto" />
    <Avatar>
      <AvatarImage :src="DiscordAvatar.getUrl(user?.id, user?.avatar)" :alt="UserRound" />
      <AvatarFallback :delayMs="50">U</AvatarFallback>
    </Avatar>
  </SidebarFooter>
</template>
