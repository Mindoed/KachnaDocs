<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { DiscordUser } from '@kachnadocs/shared'

/** Shape of GET /api/auth/me — the user is nested under `user`. */
interface MeResponse {
  authenticated: boolean
  user: DiscordUser | null
}

const user = ref<DiscordUser | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/me', {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const body = (await response.json()) as MeResponse
    user.value = body.user
  } catch {
    error.value = 'Could not load authenticated user.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main>
    <p v-if="loading">Loading user...</p>

    <p v-else-if="error">{{ error }}</p>

    <div v-else-if="user">
      <h1>Welcome, {{ user.username }}!</h1>

      <p>Internal ID: {{ user.id }}</p>
      <p>Discord Avatar ID: {{ user.avatar }}</p>
      <p>Guild Icon ID: {{ user.guild?.icon }}</p>

      <h2>Backend response</h2>
      <pre>{{ JSON.stringify(user, null, 2) }}</pre>
    </div>
  </main>
</template>
