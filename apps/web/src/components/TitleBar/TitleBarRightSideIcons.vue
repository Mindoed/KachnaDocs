<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { PanelRight, PanelRightClose } from '@lucide/vue'
import { getAllPanelsByLocation } from '@/features/panels/registry/panelRegistry'
import { PanelLocation } from '@/types/panel.ts'
import { usePanelsStore } from '../../stores/panelsStorage.ts'

defineProps<{ rightSidebarOpen?: boolean }>()
const emit = defineEmits<{ toggleRightSidebar: [] }>()
const store = usePanelsStore()
</script>

<template>
  <!-- Button for opening sidebar -->
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

  <Button variant="ghost" size="icon" :class="'self-center'">
    <component
      :is="p.icon"
      v-for="p in getAllPanelsByLocation(PanelLocation.RightSidebar)"
      v-show="rightSidebarOpen && store.availablePanelsRightSidebar?.includes(p.id)"
      :key="p.id"
      :aria-pressed="store.activePanelIdRightSidebar === p.id"
      @click="store.setActiveSidePanel(PanelLocation.RightSidebar, p.id)"
    />
  </Button>
</template>
