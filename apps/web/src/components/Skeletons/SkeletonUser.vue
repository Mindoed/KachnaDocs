<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'

type Fraction = `${number}/${number}`

withDefaults(
  defineProps<{
    /** Icon size. */
    iconSize?: number
    /** Row height. */
    height?: number
    /** Text widths. */
    fractions?: Fraction[]
    /** Width start index. - Use to randomize widths*/
    index?: number
  }>(),
  {
    iconSize: 8,
    height: 3,
    fractions: () => ['4/9', '8/9', '1/3', '2/3', '1/2', '1/4', '3/4'] as Fraction[],
    index: 0,
  },
)
</script>

<template>
  <div class="flex flex-row gap-1 items-center">
    <Skeleton :class="`w-${String(iconSize)} h-${String(iconSize)}`" class="rounded-full" />
    <div class="flex-1 flex-col space-y-1 items-center">
      <div v-for="n in Math.floor(iconSize / height)" :key="n">
        <Skeleton :class="`w-${fractions[(n + index) % fractions.length]} h-${height}`" />
      </div>
    </div>
  </div>
</template>
