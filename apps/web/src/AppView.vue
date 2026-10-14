<script setup lang="ts">
import { ref } from 'vue'
import LeftRibbon from '@/components/LeftRibbon/LeftRibbon.vue'
import LeftSidebar from '@/components/LeftSidebar/LeftSidebar.vue'
import TitleBar from '@/components/TitleBar/TitleBar.vue'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

// Separate from the SidebarProvider's `open`, which drives the ribbon only.
const sidebarOpen = ref(true)
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
      <LeftRibbon class="z-10" />
      <LeftSidebar :open="sidebarOpen" />
      <TitleBar
        class="z-5"
        :sidebar-open="sidebarOpen"
        @toggle-sidebar="sidebarOpen = !sidebarOpen"
      />
      <!-- The page body. min-w-0 lets it shrink instead of pushing the row past the
           viewport, which is what made the sidebars look like they leaked out. -->
      <SidebarInset class="min-w-0">
        <slot />
      </SidebarInset>
    </SidebarProvider>
  </main>
</template>
