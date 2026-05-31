<script setup lang="ts">
import { authClient } from '~/lib/auth-client'

definePageMeta({ layout: 'auth' })

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const route = useRoute()

async function onSubmit() {
  loading.value = true
  error.value = ''
  try {
    const { error: signInError } = await authClient.signIn.email({
      email: email.value,
      password: password.value
    })
    if (signInError) {
      error.value = signInError.message ?? 'Sign in failed'
      return
    }

    const { data: organizations } = await authClient.organization.list()
    if (organizations?.length) {
      await authClient.organization.setActive({
        organizationId: organizations[0]!.id
      })
    }

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await navigateTo(redirect)
  } finally {
    loading.value = false
  }
}

useSeoMeta({ title: 'Sign in' })
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-6 bg-default">
    <UCard class="w-full max-w-md while-card overflow-hidden">
      <template #header>
        <div class="space-y-1">
          <h1 class="text-xl font-semibold text-highlighted">
            Sign in to While
          </h1>
          <p class="text-sm text-muted">
            Healthcare integration operator console
          </p>
        </div>
      </template>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <UAlert v-if="error" color="error" variant="subtle" :title="error" />
        <UFormField label="Email">
          <UInput v-model="email" type="email" required autocomplete="email" class="w-full" />
        </UFormField>
        <UFormField label="Password">
          <UInput v-model="password" type="password" required autocomplete="current-password" class="w-full" />
        </UFormField>
        <UButton type="submit" block :loading="loading">
          Sign in
        </UButton>
      </form>

      <template #footer>
        <p class="text-sm text-muted text-center">
          No account?
          <NuxtLink to="/signup" class="text-primary hover:underline">
            Create one
          </NuxtLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
