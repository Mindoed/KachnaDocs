<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { DiscordData } from '@kachnadocs/shared'

const user = ref<DiscordData | null>(null)
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

    user.value = await response.json()
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
      <h1>Welcome, {{ user.user.username }}!</h1>

      <p>Internal ID: {{ user.user?.id }}</p>
      <p>Discord Avatar ID: {{ user.user.avatar }}</p>

      <h2>Backend response</h2>
      <pre>{{ JSON.stringify(user, null, 2) }}</pre>
    </div>
  </main>
</template>
