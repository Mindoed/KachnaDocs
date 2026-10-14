<script setup lang="ts">
import LeftRibbon from '@/components/LeftRibbon.vue'
import { SidebarProvider } from '@/components/ui/sidebar'
</script>

<template>
  <SidebarProvider :open="false">
    <LeftRibbon />
    <main>
      <slot />
    </main>
  </SidebarProvider>
</template>
