<script setup lang="ts">
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/ui/sidebar'

import RightSidebarContent from './RightSidebarContent.vue'
import RightSidebarHeader from './RightSidebarHeader.vue'
import RightSidebarFooter from './RightSidebarFooter.vue'

// Width is no longer ours: AppView's ResizablePanel sizes this one, so the panel fills whatever
// the handle left it and only the border is decided here. border-l, not border-r: the visible
// seam faces the content, i.e. the panel's left edge. `w-full` overrides the base
// w-(--sidebar-width); tailwind-merge resolves the conflict because this lands after the base
// classes in Sidebar's own cn() call.
const sidebarClass = cn('h-full overflow-hidden border-l', 'text-nowrap', 'w-full')
</script>

<template>
  <!-- No SidebarProvider here: AppView already provides one, and a nested provider would
       give this sidebar its own open state. No SidebarInset either — that element is the
       page body and belongs in AppView, not beside the ribbon. `none` keeps it in flow rather
       than fixed to the viewport's right edge, which also makes it ignore the provider's
       state. Collapsing is the panel's job now: AppView collapses the panel to 0px, so this
       element does not need an `open` prop, and ml-auto is gone because the panel already
       docks this element to the right edge. -->
  <Sidebar collapsible="none" side="right" :class="sidebarClass">
    <RightSidebarHeader />
    <RightSidebarContent />
    <RightSidebarFooter />
  </Sidebar>
</template>
