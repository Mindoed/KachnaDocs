<script setup lang="ts">
import { SidebarHeader, SidebarContent, SidebarFooter, SidebarGroup } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import SkeletonUser from '@/components/Skeletons/SkeletonUser.vue'
import SkeletonIcon from '@/components/Skeletons/SkeletonIcon.vue'
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <SidebarHeader>
      <div class="flex flex-row gap-1 items-center m-auto">
        <SkeletonIcon />
        <SkeletonIcon />
        <SkeletonIcon />
        <SkeletonIcon />
      </div>
      <Skeleton class="h-8" />
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup class="min-h-0 space-y-2">
        <div v-for="n in 5" :key="n">
          <SkeletonUser :index="n + n" />
        </div>
      </SidebarGroup>
      <SidebarGroup class="min-h-0 flex-1"> </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <Skeleton class="h-10" />
    </SidebarFooter>
  </div>
</template>
