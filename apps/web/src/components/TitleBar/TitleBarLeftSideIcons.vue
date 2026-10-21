<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { PanelLeft, PanelLeftClose } from '@lucide/vue'
import { getAllPanelsByLocation } from '@/features/panels/registry/panelRegistry'
import { PanelLocation } from '@/types/panel.ts'
import { usePanelsStore } from '../../stores/panelsStorage.ts'

defineProps<{ leftSidebarOpen?: boolean }>()
const emit = defineEmits<{ toggleLeftSidebar: [] }>()
const store = usePanelsStore()
</script>

<template>
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

  <Button
    variant="ghost"
    size="icon"
    class="ml-1"
    v-for="p in getAllPanelsByLocation(PanelLocation.LeftSidebar)"
    v-show="leftSidebarOpen && store.availablePanelsLeftSidebar?.includes(p.id)"
    :key="p.id"
    :class="{ 'bg-accent': store.activePanelIdLeftSidebar === p.id }"
    @click="store.setActiveSidePanel(PanelLocation.LeftSidebar, p.id)"
  >
    <component :is="p.icon" />
  </Button>
</template>
