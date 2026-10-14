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

// w-0 overrides the base w-(--sidebar-width); tailwind-merge resolves the conflict because
// this lands after the base classes in Sidebar's own cn() call.
// Same offset as the ribbon: the TitleBar occupies the top --titlebar-height of the viewport,
// so this panel sticks below it and is that much shorter.
const sidebarClass = computed(() =>
  cn(
    'sticky top-(--titlebar-height) h-[calc(100svh-var(--titlebar-height))] overflow-hidden transition-[width] duration-200 ease-linear',
    props.open ? 'border-r' : 'w-0 border-r-0',
  ),
)
</script>

<template>
  <!-- No SidebarProvider here: AppView already provides one, and a nested provider would
     give this sidebar its own open state. No SidebarInset either — that element is the
     page body and belongs in AppView, not beside the ribbon. `none` keeps it in flow
     right after the ribbon instead of fixed to the viewport's left edge, which also makes
     it ignore the provider's state — so collapsing is driven by the `open` prop below. -->
  <Sidebar collapsible="none" side="left" :class="sidebarClass">
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
