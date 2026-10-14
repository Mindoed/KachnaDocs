<script setup lang="ts">
import { ref } from 'vue'

import { InputGroup, InputGroupInput, InputGroupAddon } from '@/components/ui/input-group'
import { useMagicKeys, whenever } from '@vueuse/core'
import { Search } from '@lucide/vue'
import { ButtonGroup } from '../ui/button-group'
import { Button } from '../ui/button'

import { ArrowLeft, ArrowRight } from '@lucide/vue'

const open = ref(false)

const { meta_j } = useMagicKeys()

whenever(meta_j!, () => {
  open.value = true
})
</script>

<template>
  <!-- Fixed to the viewport, so the bar spans the window width and adds no scroll. -->
  <div class="fixed inset-x-0 top-0 z-20 h-11">
    <!-- Anchored to the InputGroup's left edge: that box is centred and w-1/3, so its
         left edge sits 1/3 of the bar in from the right — hence right-2/3. mr-2 is the gap. -->
    <ButtonGroup class="absolute inset-y-0 right-5/8 mr-2 items-center">
      <Button variant="ghost" size="xs"> <ArrowLeft /> </Button>
      <Button variant="ghost" size="xs"> <ArrowRight /> </Button>
    </ButtonGroup>
    <!-- Centered on the window: left-1/2 of the viewport-wide bar, pulled back half its own width. -->
    <InputGroup class="absolute top-1/2 left-1/2 w-1/4 min-w-0 -translate-x-1/2 -translate-y-1/2">
      <InputGroupInput placeholder="Search..." />
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
    </InputGroup>
  </div>
</template>
