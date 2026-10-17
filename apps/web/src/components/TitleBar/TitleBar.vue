<script setup lang="ts">
import { ref } from 'vue'

import { InputGroup, InputGroupInput, InputGroupAddon } from '@/components/ui/input-group'
import { useMagicKeys, whenever } from '@vueuse/core'
import { ButtonGroup } from '../ui/button-group'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DiscordIcon } from '@kachnadocs/shared'

import {
  ArrowLeft,
  ArrowRight,
  PanelLeft,
  PanelLeftClose,
  PanelRight,
  PanelRightClose,
  Search,
} from '@lucide/vue'
import type { DiscordUser } from '@kachnadocs/shared/discord.type'

// The ui SidebarTrigger can't be used here: it calls the shared provider's toggleSidebar,
// which belongs to the ribbon. AppView owns the LeftSidebar's own state and forwards it back.
const emit = defineEmits<{ toggleLeftSidebar: []; toggleRightSidebar: [] }>()

// Drives the trigger's left offset so it sits at the content edge: the bar is viewport-fixed,
// so it must clear the 3rem ribbon rail plus the 16rem sidebar while that is open.
defineProps<{ leftSidebarOpen?: boolean; rightSidebarOpen?: boolean; user: DiscordUser | null }>()

const open = ref(false)

const { meta_j } = useMagicKeys()

whenever(meta_j!, () => {
  open.value = true
})
</script>

<template>
  <!-- Fixed to the viewport, so the bar spans the window width and adds no scroll. The
       ribbon, the sidebar and the page body all start below --titlebar-height (AppView). -->
  <div
    class="border-border fixed inset-x-0 top-0 h-(--titlebar-height) border-b flex z-20 flex-row"
  >
    <div class="flex flex-1 flex-row items-center gap-1">
      <!-- At the content edge: clear of the 3rem ribbon rail, plus the sidebar while it is
         open. The provider's width vars are inherited here even though this bar is fixed. -->
      <div class="border-b">
        <Avatar class="size-(--titlebar-height) rounded-none box-content border-r-2">
          <AvatarImage :src="DiscordIcon.getUrl(user?.guild.id, user?.guild.icon)" />
          <AvatarFallback>G</AvatarFallback>
        </Avatar>
      </div>
      <Button
        variant="ghost"
        size="icon"
        class="ml-1"
        aria-label="Toggle sidebar"
        @click="emit('toggleLeftSidebar')"
      >
        <div v-if="!leftSidebarOpen">
          <PanelLeft />
        </div>
        <div v-else>
          <PanelLeftClose />
        </div>
      </Button>
    </div>

    <div class="flex-1">
      <!-- Anchored to the InputGroup's left edge: that box is centred and w-1/4, so its
         left edge sits 5/8 of the bar in from the right. mr-2 is the gap. -->
      <ButtonGroup class="absolute inset-y-0 right-5/8 mr-2 items-center">
        <Button variant="ghost" size="xs"> <ArrowLeft /> </Button>
        <Button variant="ghost" size="xs"> <ArrowRight /> </Button>
      </ButtonGroup>
      <!-- Centered on the window: left-1/2 of the viewport-wide bar, pulled back half its own width. -->
      <InputGroup class="absolute top-1/2 left-1/2 w-1/4 min-w-0 -translate-x-1/2 -translate-y-1/2">
        <InputGroupInput placeholder="Search..." />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
      </InputGroup>
    </div>

    <div class="flex flex-1 content-center flex-row-reverse mr-1 gap-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle sidebar"
        :class="'self-center'"
        @click="emit('toggleRightSidebar')"
      >
        <div v-if="!rightSidebarOpen">
          <PanelRight />
        </div>
        <div v-else>
          <PanelRightClose />
        </div>
      </Button>
    </div>
  </div>
</template>
