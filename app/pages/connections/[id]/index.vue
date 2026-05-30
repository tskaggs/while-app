<script setup lang="ts">
const { connection, connectionId, useConnectionPageMeta, isSystemSandbox } = useConnectionDetail()
const config = useRuntimeConfig()
const requestFetch = useRequestFetch()

useConnectionPageMeta()

interface ConnectionWebhookSummary {
  effective: { webhookUrl: string | null, urlSource: 'org' | 'connection' | null }
  inheritsDefault: boolean
}

const { data: webhookSummary } = await useAsyncData(
  () => `connection-webhook-${connectionId.value}`,
  () => {
    if (!connectionId.value || config.public.mockMode) return Promise.resolve(null)
    return requestFetch<ConnectionWebhookSummary>(`/api/connections/${connectionId.value}/webhook`)
  },
  { watch: [connectionId] }
)

const webhookUrlLabel = computed(() => {
  const url = webhookSummary.value?.effective.webhookUrl
  if (!url) return 'Not configured'
  try {
    const parsed = new URL(url)
    return parsed.hostname + parsed.pathname
  } catch {
    return url
  }
})

const webhookSourceLabel = computed(() => {
  if (webhookSummary.value?.inheritsDefault) return 'Inherits org default'
  if (webhookSummary.value?.effective.urlSource === 'connection') return 'Connection override'
  return 'Org default'
})
</script>

<template>
  <div v-if="connection" class="space-y-6">
    <ConnectionsSystemSandboxPanel
      v-if="isSystemSandbox(connection)"
      :connection="connection"
    />
    <ConnectionsTopologyMap v-else :connection="connection" />

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <UCard class="lg:col-span-2 rounded-xl border border-default bg-elevated">
        <template #header>
          <h3 class="font-semibold text-highlighted">
            Integration Details
          </h3>
        </template>
        <dl class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt class="text-muted">
              Messages (24h)
            </dt>
            <dd class="text-lg font-semibold text-highlighted">
              <NuxtLink
                :to="`/connections/${connection.id}/messages`"
                class="hover:underline"
              >
                {{ connection.messagesProcessed24h.toLocaleString() }}
              </NuxtLink>
            </dd>
          </div>
          <div>
            <dt class="text-muted">
              Region
            </dt>
            <dd class="text-lg font-semibold text-highlighted">
              {{ connection.region }}
            </dd>
          </div>
          <div>
            <dt class="text-muted">
              Last Sync
            </dt>
            <dd class="text-highlighted">
              {{ new Date(connection.lastSyncAt).toLocaleString() }}
            </dd>
          </div>
          <div>
            <dt class="text-muted">
              Environment
            </dt>
            <dd class="capitalize text-highlighted">
              {{ connection.environment }}
            </dd>
          </div>
          <div v-if="webhookSummary || config.public.mockMode" class="col-span-2">
            <dt class="text-muted">
              Webhook destination
            </dt>
            <dd class="flex flex-wrap items-center gap-2 mt-1">
              <span class="font-mono text-xs text-highlighted break-all">
                {{ webhookUrlLabel }}
              </span>
              <UBadge variant="subtle" size="sm">
                {{ webhookSourceLabel }}
              </UBadge>
              <NuxtLink
                :to="`/connections/${connection.id}/test`"
                class="text-xs text-primary hover:underline"
              >
                Configure on Test
              </NuxtLink>
            </dd>
          </div>
          <div v-if="connection.pairedConnectionId">
            <dt class="text-muted">
              Paired connection
            </dt>
            <dd>
              <NuxtLink
                :to="`/connections/${connection.pairedConnectionId}`"
                class="text-sm text-primary hover:underline font-mono"
              >
                {{ connection.pairedConnectionId }}
              </NuxtLink>
            </dd>
          </div>
          <div v-else-if="isSystemSandbox(connection)">
            <dt class="text-muted">
              Live twin
            </dt>
            <dd class="text-muted">
              None — system sandbox is sandbox-only
            </dd>
          </div>
        </dl>
      </UCard>
      <ConnectionsFlightCheckList :flight-check="connection.flightCheck" />
    </div>
  </div>
</template>
