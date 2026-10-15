<script setup lang="ts">
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/ui/sidebar'
import LeftSidebarContent from './LeftSidebarContent.vue'
import LeftSidebarHeader from './LeftSidebarHeader.vue'
import LeftSidebarFooter from './LeftSidebarFooter.vue'

// Width is no longer ours: AppView's ResizablePanel sizes this one, so the panel fills whatever
// the handle left it and only the border is decided here. `w-full` overrides the base
// w-(--sidebar-width); tailwind-merge resolves the conflict because this lands after the base
// classes in Sidebar's own cn() call.
const sidebarClass = cn(
  'h-full w-full overflow-hidden border-r',
  'text-nowrap',
)
</script>

<template>
  <!-- No SidebarProvider here: AppView already provides one, and a nested provider would
       give this sidebar its own open state. No SidebarInset either — that element is the
       page body and belongs in AppView, not beside the ribbon. `none` keeps it in flow
       right after the ribbon instead of fixed to the viewport's left edge, which also makes
       it ignore the provider's state. Collapsing is the panel's job now: AppView collapses
       the panel to 0px, so this element does not need an `open` prop. -->
  <Sidebar collapsible="none" side="left" :class="sidebarClass">
    <LeftSidebarHeader />

    <LeftSidebarContent />

    <LeftSidebarFooter />
  </Sidebar>
</template>
