<script setup lang="ts">
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
}

const config = useRuntimeConfig()
const toast = useToast()
const requestFetch = useRequestFetch()

const {
  connection,
  connectionId,
  useConnectionPageMeta,
  isSystemSandbox
} = useConnectionDetail()
const { connections } = useConnections()

useConnectionPageMeta('Credentials')

const rotatedKey = ref<string | null>(null)
const rotating = ref(false)

const { data: credentials } = await useAsyncData(
  () => `connection-credentials-${connectionId.value}`,
  () => {
    if (!connectionId.value) return Promise.resolve(null)

    if (config.public.mockMode) {
      const conn = connection.value
      const system = conn ? isSystemSandbox(conn) : false
      return Promise.resolve({
        connectionId: connectionId.value,
        partnerName: conn?.partnerName ?? 'While Sandbox',
        isSystemSandbox: system,
        canRotate: system,
        activeKey: {
          id: 'mock-active-key',
          keyPrefix: 'wh_test_',
          environment: 'sandbox',
          createdAt: '2026-05-28T16:42:00.000Z'
        },
        history: [
          {
            id: 'mock-key-2-created',
            type: 'created' as const,
            keyPrefix: 'wh_test_',
            environment: 'sandbox',
            occurredAt: '2026-05-28T16:42:00.000Z',
            isActive: true
          },
          {
            id: 'mock-key-1-revoked',
            type: 'revoked' as const,
            keyPrefix: 'wh_test_',
            environment: 'sandbox',
            occurredAt: '2026-05-28T16:42:00.000Z',
            isActive: false
          },
          {
            id: 'mock-key-1-created',
            type: 'created' as const,
            keyPrefix: 'wh_test_',
            environment: 'sandbox',
            occurredAt: '2026-05-20T09:15:00.000Z',
            isActive: false
          }
        ]
      } satisfies CredentialsContext)
    }

    return requestFetch<CredentialsContext>(`/api/connections/${connectionId.value}/credentials`)
  },
  { watch: [connectionId] }
)

const systemSandboxConnection = computed(() =>
  connections.value.find(c => isSystemSandbox(c))
)

const sandboxCredentialsLink = computed(() => {
  if (!connection.value || isSystemSandbox(connection.value)) return null
  if (systemSandboxConnection.value) {
    return `/connections/${systemSandboxConnection.value.id}/credentials`
  }
  return null
})

async function rotateKey() {
  if (!credentials.value?.canRotate) return

  rotating.value = true
  try {
    const result = await $fetch<{
      sandboxApiKey: string
      activeKey: ActiveKey | null
      history: HistoryEvent[]
    }>(`/api/connections/${connectionId.value}/credentials/rotate`, {
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
  <div v-if="connection && credentials">
    <ConnectionsCredentialsConnectionCredentialsPanel
      :connection-id="credentials.connectionId"
      :partner-name="credentials.partnerName"
      :is-system-sandbox="credentials.isSystemSandbox"
      :can-rotate="credentials.canRotate"
      :active-key="credentials.activeKey"
      :history="credentials.history"
      :rotated-key="rotatedKey"
      :rotating="rotating"
      :mock-mode="config.public.mockMode"
      :sandbox-credentials-link="sandboxCredentialsLink"
      @rotate="rotateKey"
    />
  </div>

  <div v-else-if="connection" class="flex justify-center py-16">
    <UIcon name="i-iconoir-refresh-double" class="size-6 animate-spin text-muted" />
  </div>
</template>
