<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { DiscordUser } from '@kachnadocs/shared'

const data = ref<DiscordUser | null>(null)
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

    data.value = await response.json()
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

    <div v-else-if="data">
      <h1>Welcome, {{ data.username }}!</h1>

      <p>Internal ID: {{ data.id }}</p>
      <p>Discord Avatar ID: {{ data.avatar }}</p>
      <p>Guild Icon ID: {{ data.guild?.icon }}</p>

      <h2>Backend response</h2>
      <pre>{{ JSON.stringify(data, null, 2) }}</pre>
    </div>
  </main>
</template>
