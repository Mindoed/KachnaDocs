<script setup lang="ts">
import LeftRibbon from '@/components/LeftRibbon/LeftRibbon.vue'
import TitleBar from '@/components/TitleBar/TitleBar.vue'
import { SidebarProvider } from '@/components/ui/sidebar'
</script>

<template>
  <main class="overflow-x-clip">
    <SidebarProvider :open="false">
      <LeftRibbon />
      <TitleBar />
    </SidebarProvider>
    <slot />
  </main>
</template>
