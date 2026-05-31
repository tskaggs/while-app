<script setup lang="ts">
import type { Connection } from '~/types/while'

interface ActiveKey {
  id: string
  keyPrefix: string
  environment: string
  createdAt: string
}

interface HistoryEvent {
  id: string
  type: 'created' | 'revoked'
  keyPrefix: string
  environment: string
  occurredAt: string
  isActive: boolean
}

interface CredentialsContext {
  connectionId: string
  partnerName: string
  isSystemSandbox: boolean
  canRotate: boolean
  activeKey: ActiveKey | null
  history: HistoryEvent[]
  webhookUrl?: string | null
  webhookSecretConfigured?: boolean
  hasPendingCredentials?: boolean
}

const props = defineProps<{
  connection: Connection
}>()

const config = useRuntimeConfig()
const toast = useToast()
const requestFetch = useRequestFetch()

const rotatedKey = ref<string | null>(null)
const revealedWebhookSecret = ref<string | null>(null)
const rotating = ref(false)

const { data: credentials, pending } = await useAsyncData(
  () => `connection-credentials-${props.connection.id}`,
  () => {
    if (config.public.mockMode) {
      return Promise.resolve({
        connectionId: props.connection.id,
        partnerName: props.connection.partnerName,
        isSystemSandbox: props.connection.partnerName === 'While Sandbox',
        canRotate: props.connection.environment === 'sandbox',
        activeKey: {
          id: 'mock-active-key',
          keyPrefix: 'wh_test_',
          environment: 'sandbox',
          createdAt: '2026-05-28T16:42:00.000Z'
        },
        webhookUrl: 'http://localhost:3000/api/webhooks/while',
        webhookSecretConfigured: true,
        hasPendingCredentials: false,
        history: [
          {
            id: 'mock-key-2-created',
            type: 'created' as const,
            keyPrefix: 'wh_test_',
            environment: 'sandbox',
            occurredAt: '2026-05-28T16:42:00.000Z',
            isActive: true
          }
        ]
      } satisfies CredentialsContext)
    }

    return requestFetch<CredentialsContext>(`/api/connections/${props.connection.id}/credentials`)
  },
  { watch: () => props.connection.id }
)

onMounted(async () => {
  if (config.public.mockMode || !credentials.value?.hasPendingCredentials) return
  try {
    const revealed = await requestFetch<{
      sandboxApiKey: string
      webhookSecret: string
      webhookUrl: string | null
    }>(`/api/connections/${props.connection.id}/credentials/reveal`)
    if (revealed.sandboxApiKey) rotatedKey.value = revealed.sandboxApiKey
    if (revealed.webhookSecret) revealedWebhookSecret.value = revealed.webhookSecret
    if (credentials.value) {
      credentials.value = { ...credentials.value, hasPendingCredentials: false }
    }
  } catch {
    // Pending credentials already revealed or unavailable
  }
})

async function rotateKey() {
  if (!credentials.value?.canRotate) return

  rotating.value = true
  try {
    const result = await $fetch<{
      sandboxApiKey: string
      activeKey: ActiveKey | null
      history: HistoryEvent[]
    }>(`/api/connections/${props.connection.id}/credentials/rotate`, {
      method: 'POST'
    })

    rotatedKey.value = result.sandboxApiKey
    credentials.value = {
      ...credentials.value,
      activeKey: result.activeKey,
      history: result.history
    }

    toast.add({
      title: 'Sandbox API key rotated',
      description: 'Copy the new key now — it will not be shown again.',
      color: 'success'
    })
  } catch (error) {
    const fetchError = error as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'Rotation failed',
      description: fetchError.data?.message ?? fetchError.message ?? 'Unable to rotate sandbox API key.',
      color: 'error'
    })
  } finally {
    rotating.value = false
  }
}
</script>

<template>
  <div v-if="pending" class="flex justify-center py-12">
    <UIcon name="i-iconoir-refresh-double" class="size-6 animate-spin text-muted" />
  </div>

  <div v-else-if="credentials" class="space-y-5">
    <ConnectionsConnectivitySectionIntro
      title="Credentials"
      description="Per-connection API keys and webhook secrets for sandbox testing."
      icon="i-iconoir-key"
    />

    <ConnectionsCredentialsConnectionCredentialsPanel
      :connection-id="credentials.connectionId"
      :partner-name="credentials.partnerName"
      :is-system-sandbox="credentials.isSystemSandbox"
      :can-rotate="credentials.canRotate"
      :active-key="credentials.activeKey"
      :history="credentials.history"
      :rotated-key="rotatedKey"
      :revealed-webhook-secret="revealedWebhookSecret"
      :webhook-url="credentials.webhookUrl"
      :webhook-secret-configured="credentials.webhookSecretConfigured"
      :rotating="rotating"
      :mock-mode="config.public.mockMode"
      embedded
      @rotate="rotateKey"
    />
  </div>
</template>
