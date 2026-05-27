<script setup lang="ts">
const route = useRoute()
const { getConnection } = useConnections()

const connectionId = computed(() => route.params.id as string)
const connection = computed(() => getConnection(connectionId.value))

useSeoMeta({ title: () => connection.value?.partnerName ?? 'Connection' })

const tabs = [
  { label: 'Overview', slot: 'overview' },
  { label: 'Connectivity', slot: 'connectivity' },
  { label: 'Mapping', slot: 'mapping' },
  { label: 'Logs', slot: 'logs' }
]
</script>

<template>
  <div v-if="connection" class="space-y-6">
    <PageHeader>
      <template #title>
        <NavTitle>
          <div class="flex items-center gap-3 min-w-0">
            <div>
              <h1 class="text-xl font-semibold tracking-tight text-highlighted">
                {{ connection.partnerName }}
              </h1>
              <p class="text-xs text-muted">
                {{ connection.ehrVendor }} · {{ connection.sidecarId }}
              </p>
            </div>
            <ConnectionsConnectionStatusBadge :status="connection.tunnelStatus" />
          </div>
        </NavTitle>
      </template>
    </PageHeader>

    <ConnectionsTopologyMap :connection="connection" />

    <UTabs :items="tabs" class="w-full">
      <template #overview>
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-3 pt-4">
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
                  {{ connection.messagesProcessed24h.toLocaleString() }}
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
            </dl>
          </UCard>
          <ConnectionsFlightCheckList :flight-check="connection.flightCheck" />
        </div>
      </template>

      <template #connectivity>
        <div class="pt-4">
          <ConnectionsConnectivityPanel :connection="connection" />
        </div>
      </template>

      <template #mapping>
        <ConnectionsMappingPanel :connection="connection" />
      </template>

      <template #logs>
        <div class="space-y-4 pt-4">
          <p class="text-sm text-muted">
            Search and filter logs for this connection
          </p>
          <LogsLogStream :connection-id="connection.id" />
        </div>
      </template>
    </UTabs>
  </div>

  <div v-else class="flex flex-col items-center gap-4 py-20">
    <UIcon name="i-lucide-search-x" class="size-12 text-muted" />
    <h2 class="text-lg font-semibold text-highlighted">
      Connection not found
    </h2>
    <UButton to="/connections" label="Back to Connections" icon="i-lucide-arrow-left" />
  </div>
</template>
