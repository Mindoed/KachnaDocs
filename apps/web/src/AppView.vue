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
    <!-- SidebarProvider is a flex row, so children sit side by side: ribbon, sidebar, page. -->
    <SidebarProvider :open="false">
      <LeftRibbon />
      <LeftSidebar :open="sidebarOpen" />
      <TitleBar :sidebar-open="sidebarOpen" @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <!-- The page body. min-w-0 lets it shrink instead of pushing the row past the
           viewport, which is what made the sidebars look like they leaked out. -->
      <SidebarInset class="min-w-0">
        <slot />
      </SidebarInset>
    </SidebarProvider>
  </main>
</template>
