<script setup lang="ts">
import { authClient } from '~/lib/auth-client'

definePageMeta({ layout: 'auth' })

const route = useRoute()
const invitationId = computed(() => route.params.id as string)
const loading = ref(false)
const error = ref('')
const success = ref(false)

async function acceptInvite() {
  loading.value = true
  error.value = ''
  try {
    const { data: session } = await authClient.useSession(useFetch)
    if (!session.value) {
      await navigateTo({ path: '/login', query: { redirect: route.fullPath } })
      return
    }

    const { error: acceptError } = await authClient.organization.acceptInvitation({
      invitationId: invitationId.value
    })

    if (acceptError) {
      error.value = acceptError.message ?? 'Failed to accept invitation'
      return
    }

    success.value = true
    await navigateTo('/')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  acceptInvite()
})

useSeoMeta({ title: 'Accept invitation' })
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-6 bg-default">
    <UCard class="w-full max-w-md while-card overflow-hidden">
      <template #header>
        <h1 class="text-xl font-semibold text-highlighted">
          Accept team invitation
        </h1>
      </template>
      <div v-if="loading" class="text-sm text-muted">
        Accepting invitation…
      </div>
      <UAlert v-else-if="error" color="error" variant="subtle" :title="error" />
      <UAlert v-else-if="success" color="success" variant="subtle" title="Invitation accepted. Redirecting…" />
    </UCard>
  </div>
</template>
