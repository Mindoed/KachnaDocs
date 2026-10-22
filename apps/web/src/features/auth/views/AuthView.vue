<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { apiUrl } from '@/lib/paths'
import { Spinner } from '@/components/ui/spinner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Origin the popup's postMessage must come from. The API is same-origin now: the
 * popup's final page is served by the API through the same nginx that served this
 * page, so it always equals the SPA's own origin.
 */
const APP_ORIGIN = window.location.origin

const router = useRouter()
const popup = ref<Window | null>(null)
const error = ref<string | null>(null)

function handleAuth() {
  error.value = null

  // Relative for the same reason as AppView.vue: it resolves against this page's
  // origin, so the OAuth flow starts wherever we are actually being served from —
  // including under a sub-path mount, which apiUrl() accounts for.
  // No features string (in particular no 'noopener') is what keeps window.open()
  // returning a handle we can call window.close() on.
  popup.value = window.open(apiUrl('/auth/discord'), 'kachnadocs-discord-auth')

  if (!popup.value) {
    error.value = 'Popup was blocked by the browser. Allow popups for this site.'
  }
}

function onMessage(event: MessageEvent) {
  // The popup's final page is served by the API through the same nginx that
  // served this page, so its origin is always our own. Exactly one acceptable
  // origin now - stricter than when the API had a separate one and both passed.
  if (event.origin !== APP_ORIGIN) return
  if (event.data?.type !== 'kachnadocs:auth-done') return

  popup.value?.close()
  popup.value = null
  void router.push({ name: 'home' })
}

onMounted(() => window.addEventListener('message', onMessage))
onBeforeUnmount(() => window.removeEventListener('message', onMessage))
</script>

<template>
  <div class="flex h-screen items-center justify-center">
    <Card class="w-96">
      <CardHeader>
        <CardTitle>Discord Authentication</CardTitle>
      </CardHeader>

      <CardContent>
        <Button v-if="!popup" style="cursor: pointer" @click="handleAuth"
          >Login with Discord</Button
        >
        <Button v-if="popup" variant="outline" disabled>
          <Spinner class="animate-spin" />
          Login with Discord</Button
        >
        <p v-if="error" class="mt-2 text-sm text-red-600">{{ error }}</p>
      </CardContent>
    </Card>
  </div>
</template>
