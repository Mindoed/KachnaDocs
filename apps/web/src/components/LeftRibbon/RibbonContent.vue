<script setup lang="ts">
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { getAllPanelsByLocation } from '@/features/panels/registry/panelRegistry'
import { usePanelsStore } from '@/stores/panelsStorage'
import { PanelLocation } from '@/types/panel'

const store = usePanelsStore()

const ribbonPanels = getAllPanelsByLocation(PanelLocation.MainView)
</script>

<template>
  <SidebarContent>
    <SidebarGroup>
      <SidebarGroupContent>
        <TooltipProvider :delay-duration="500">
          <SidebarMenu>
            <SidebarMenuItem v-for="p in ribbonPanels" :key="p.title">
              <SidebarMenuButton as-child :tooltip="p.title">
                <a @click.prevent="store.setActiveMainView(p.id)" href="#">
                  <component :is="p.icon" />
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </TooltipProvider>
      </SidebarGroupContent>
    </SidebarGroup>
  </SidebarContent>
</template>
