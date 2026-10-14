<script setup lang="ts">
import { ref } from 'vue'
import LeftRibbon from '@/components/LeftRibbon/LeftRibbon.vue'
import LeftSidebar from '@/components/LeftSidebar/LeftSidebar.vue'
import RightSidebar from '@/components/RightSidebar/RightSidebar.vue'
import TitleBar from '@/components/TitleBar/TitleBar.vue'
import { SidebarProvider } from '@/components/ui/sidebar'

// Separate from the SidebarProvider's `open`, which drives the ribbon only.
const leftSidebarOpen = ref(true)
const rightSidebarOpen = ref(true)
</script>

<template>
  <main class="overflow-x-clip">
    <!-- SidebarProvider is a flex row, so children sit side by side: ribbon, sidebar, page.
         The top padding pushes the whole row below the fixed TitleBar, so the bar spans the
         full width above it; the min-height shrinks by the same amount to keep the wrapper
         exactly one viewport tall. The two fixed panels (ribbon, and LeftSidebar when it is
         sticky) are out of flow and offset themselves. -->
    <SidebarProvider
      :open="false"
      class="min-h-[calc(100svh-var(--titlebar-height))] pt-(--titlebar-height)"
    >
      <TitleBar
        :leftSidebarOpen="leftSidebarOpen"
        @toggle-left-sidebar="leftSidebarOpen = !leftSidebarOpen"
        :rightSidebarOpen="rightSidebarOpen"
        @toggle-right-sidebar="rightSidebarOpen = !rightSidebarOpen"
      />
      <LeftRibbon />
      <LeftSidebar :open="leftSidebarOpen" />
      <RightSidebar :open="rightSidebarOpen" />
    </SidebarProvider>
  </main>
</template>
