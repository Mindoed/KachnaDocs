<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { DiscordUser } from '@kachnadocs/shared'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

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
    if (!body.authenticated) {
      throw new Error('User is not authenticated.')
    }

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
      <h1 style="display: flex; column-gap: 10px">
        Welcome, {{ user.username }}!
        <Avatar>
          <AvatarImage
            :src="`https://cdn.discordapp.com/avatars/${user!.id}/${user!.avatar}.png`"
          /><AvatarFallback>{{ user!.username.substring(0, 2).toUpperCase() }}</AvatarFallback>
        </Avatar>
      </h1>

      <p style="display: flex; column-gap: 10px">
        Guild Icon ID: {{ user!.guild?.icon }}
        <Avatar>
          <AvatarImage
            :src="`https://cdn.discordapp.com/icons/${user!.guild?.id}/${user!.guild?.icon}.png`"
          /><AvatarFallback>{{
            user!.guild?.name.substring(0, 2).toUpperCase() ?? 'GD'
          }}</AvatarFallback>
        </Avatar>
      </p>

      <h2>Backend response</h2>
      <pre>{{ JSON.stringify(user, null, 2) }}</pre>
    </div>
  </main>
</template>
