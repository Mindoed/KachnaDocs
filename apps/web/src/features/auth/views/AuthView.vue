<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/** Origin of the API the popup is sent to, and of the SPA that may postMessage back. */
const API_URL = 'http://localhost:3000'
const APP_ORIGIN = window.location.origin

const router = useRouter()
const popup = ref<Window | null>(null)
const error = ref<string | null>(null)

function handleAuth() {
  error.value = null

  // A features string (no 'noopener') is what keeps window.open() returning a
  // handle we can call window.close() on.
  popup.value = window.open(`${API_URL}/api/auth/discord`, 'kachnadocs-discord-auth')

  if (!popup.value) {
    error.value = 'Popup was blocked by the browser. Allow popups for this site.'
  }
}

function onMessage(event: MessageEvent) {
  // The popup's final page is served by the API, so the signal arrives with
  // the API's origin. Accept it (and our own, in case the popup is ever
  // redirected to an SPA page that relays the message instead).
  if (event.origin !== API_URL && event.origin !== APP_ORIGIN) return
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
