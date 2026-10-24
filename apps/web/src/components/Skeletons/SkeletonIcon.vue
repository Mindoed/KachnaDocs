<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'
import { roundValues, type IconProps } from './lib'

withDefaults(defineProps<IconProps>(), {
  /** Icon size. */
  iconSize: 8,
  /** Border Radius. */
  roundValue: 3,
})
</script>

<template>
  <div class="flex flex-row gap-1 items-center">
    <Skeleton
      :class="`
        w-${String(iconSize)}
        h-${String(iconSize)}
        ${roundValues[roundValue]}
      `"
    />
  </div>
</template>
