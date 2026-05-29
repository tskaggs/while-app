<script setup lang="ts">
import { authClient } from '~/lib/auth-client'

definePageMeta({ layout: 'auth' })

const name = ref('')
const email = ref('')
const password = ref('')
const orgName = ref('')
const loading = ref(false)
const error = ref('')

function slugify(value: string) {
  const base = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `${base || 'org'}-${Math.random().toString(36).slice(2, 8)}`
}

async function onSubmit() {
  loading.value = true
  error.value = ''
  try {
    const { error: signUpError } = await authClient.signUp.email({
      email: email.value,
      password: password.value,
      name: name.value
    })
    if (signUpError) {
      error.value = signUpError.message ?? 'Sign up failed'
      return
    }

    const { error: orgError } = await authClient.organization.create({
      name: orgName.value,
      slug: slugify(orgName.value)
    })
    if (orgError) {
      error.value = orgError.message ?? 'Organization creation failed'
      return
    }

    await navigateTo('/onboarding')
  } finally {
    loading.value = false
  }
}

useSeoMeta({ title: 'Sign up' })
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-6 bg-default">
    <UCard class="w-full max-w-md rounded-xl border border-default bg-elevated">
      <template #header>
        <div class="space-y-1">
          <h1 class="text-xl font-semibold text-highlighted">
            Create your account
          </h1>
          <p class="text-sm text-muted">
            Get started with the While sandbox in minutes
          </p>
        </div>
      </template>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <UAlert v-if="error" color="error" variant="subtle" :title="error" />
        <UFormField label="Your name">
          <UInput v-model="name" required autocomplete="name" class="w-full" />
        </UFormField>
        <UFormField label="Email">
          <UInput v-model="email" type="email" required autocomplete="email" class="w-full" />
        </UFormField>
        <UFormField label="Password">
          <UInput v-model="password" type="password" required autocomplete="new-password" class="w-full" />
        </UFormField>
        <UFormField label="Organization name">
          <UInput v-model="orgName" required placeholder="Acme Health Inc." class="w-full" />
        </UFormField>
        <UButton type="submit" block :loading="loading">
          Create account
        </UButton>
      </form>

      <template #footer>
        <p class="text-sm text-muted text-center">
          Already have an account?
          <NuxtLink to="/login" class="text-primary hover:underline">
            Sign in
          </NuxtLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
