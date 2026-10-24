<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'
import { type IconProps } from './lib'
import SkeletonIcon from '@/components/Skeletons/SkeletonIcon.vue'

type Fraction = `${number}/${number}`

withDefaults(
  defineProps<
    IconProps & {
      /** Icon size. */
      iconSize?: number
      /** Border Radius. */
      roundValue?: number
      /** Row height. */
      height?: number
      /** Text widths. */
      fractions?: Fraction[]
      /** Width start index. - Use to randomize widths*/
      index?: number
    }
  >(),
  {
    iconSize: 8,
    roundValue: 9,
    height: 3,
    fractions: () => ['4/9', '8/9', '1/3', '2/3', '1/2', '1/4', '3/4'] as Fraction[],
    index: 0,
  },
)
</script>

<template>
  <div class="flex flex-row gap-1 items-center">
    <SkeletonIcon :iconSize="iconSize" :roundValue="roundValue" />
    <div class="flex-1 flex-col space-y-1 items-center">
      <div v-for="n in Math.floor(iconSize / height)" :key="n">
        <Skeleton :class="`w-${fractions[(n + index) % fractions.length]} h-${height}`" />
      </div>
    </div>
  </div>
</template>
