<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { environment } = useEnvironment()
const { getConnectionForCurrentEnvironment, isLiveActivated } = useConnections()

const connectionId = computed(() => route.params.id as string)

const connection = computed(() =>
  getConnectionForCurrentEnvironment(connectionId.value)
)

/** Keep URL on the connection id for the active environment when switching Sandbox ↔ Live */
watch(
  [environment, connectionId],
  () => {
    const resolved = getConnectionForCurrentEnvironment(connectionId.value)
    if (resolved && resolved.id !== connectionId.value) {
      router.replace(`/connections/${resolved.id}`)
    }
  },
  { immediate: true }
)

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
                <span class="capitalize"> · {{ connection.environment }}</span>
              </p>
            </div>
            <ConnectionsConnectionStatusBadge :status="connection.tunnelStatus" />
            <UBadge
              v-if="connection.environment === 'live' && connection.liveActivation"
              :color="isLiveActivated(connection) ? 'success' : 'warning'"
              variant="subtle"
            >
              {{ isLiveActivated(connection) ? 'Live activated' : 'Live not activated' }}
            </UBadge>
          </div>
        </NavTitle>
      </template>
    </PageHeader>

    <LiveActivationRequired
      v-if="connection.environment === 'live' && !isLiveActivated(connection)"
      :connection="connection"
      variant="connection"
    />

    <template v-else>
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
                <div>
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
    </template>
  </div>

  <div v-else class="flex flex-col items-center gap-4 py-20">
    <UIcon name="i-iconoir-file-not-found" class="size-12 text-muted" />
    <h2 class="text-lg font-semibold text-highlighted">
      Connection not found
    </h2>
    <UButton to="/connections" label="Back to Connections" icon="i-iconoir-arrow-left" />
  </div>
</template>
