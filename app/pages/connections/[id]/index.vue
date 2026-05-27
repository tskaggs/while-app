<script setup lang="ts">
const { connection, useConnectionPageMeta } = useConnectionDetail()

useConnectionPageMeta()
</script>

<template>
  <div v-if="connection" class="space-y-6">
    <ConnectionsTopologyMap :connection="connection" />

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
  </div>
</template>
