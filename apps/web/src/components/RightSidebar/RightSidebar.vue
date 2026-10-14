<script setup lang="ts">
import { computed } from 'vue'
import { GalleryVerticalEnd, Home } from '@lucide/vue'
import { cn } from '@/lib/utils'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

// Visibility is owned by the parent, not by the shared SidebarProvider state: that state
// belongs to the ribbon (which is collapsible="icon"), so reacting to it would resize the
// ribbon instead of this panel.
const props = defineProps<{ open?: boolean }>()

// ml-auto pins the panel to the right end of the SidebarProvider row, so it grows out of the
// right edge as it opens instead of sitting next to LeftSidebar. It also means the width
// transition moves the inner (left) edge, which is the direction you want here. Harmless once
// a SidebarInset page body comes back: that element is flex-1, so it soaks up the slack first.
// w-0 overrides the base w-(--sidebar-width); tailwind-merge resolves the conflict because
// this lands after the base classes in Sidebar's own cn() call.
// border-l, not border-r: the visible seam faces the content, i.e. the panel's left edge.
// Same offset as the ribbon: the TitleBar occupies the top --titlebar-height of the viewport,
// so this panel sticks below it and is that much shorter.
const sidebarClass = computed(() =>
  cn(
    'sticky top-(--titlebar-height) ml-auto h-[calc(100svh-var(--titlebar-height))] overflow-hidden transition-[width] duration-200 ease-linear',
    props.open ? 'border-l' : 'w-0 border-l-0',
  ),
)
</script>

<template>
  <!-- No SidebarProvider here: AppView already provides one, and a nested provider would
     give this sidebar its own open state. No SidebarInset either — that element is the
     page body and belongs in AppView, not beside the ribbon. `none` keeps it in flow rather
     than fixed to the viewport's right edge, which also makes it ignore the provider's state
     — so collapsing is driven by the `open` prop below, and ml-auto above does the docking. -->
  <Sidebar collapsible="none" side="right" :class="sidebarClass">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <div
              class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
            >
              <GalleryVerticalEnd class="size-4" />
            </div>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-semibold">Acme Inc</span>
              <span class="truncate text-xs">Enterprise</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Platform</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <a href="#">
                  <Home />
                  <span>Home</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter />
  </Sidebar>
</template>
