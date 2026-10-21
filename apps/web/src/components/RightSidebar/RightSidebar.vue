<script setup lang="ts">
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/ui/sidebar'
import { getAllPanelsByLocation } from '@/features/panels/registry/panelRegistry'
import { PanelLocation } from '@/types/panel.ts'
import { usePanelsStore } from '@/stores/panelsStorage.ts'

const sidebarClass = cn('h-full overflow-hidden border-l', 'text-nowrap', 'w-full')
const store = usePanelsStore()
</script>

<template>
  <Sidebar collapsible="none" side="right" :class="sidebarClass">
    <component
      :is="p.component"
      v-for="p in getAllPanelsByLocation(PanelLocation.LeftSidebar)"
      v-show="store.activePanelIdLeftSidebar === p.id"
      :key="p.id"
    />
  </Sidebar>
</template>
