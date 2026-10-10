<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

function handleAuth() {
  console.log('Login btn clicked')
}
</script>

<template>
  <div class="flex h-screen items-center justify-center">
    <Card class="w-96">
      <CardHeader>
        <CardTitle>Discord Authentication</CardTitle>
      </CardHeader>

      <CardContent>
        <Button @click="handleLogin">Login with Discord</Button>
      </CardContent>
    </Card>
  </div>
</template>
