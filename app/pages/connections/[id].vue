<script setup lang="ts">
const { connection, navItems } = useConnectionDetail()
const { isLiveActivated } = useConnections()
</script>

<template>
  <div v-if="connection" class="space-y-6">
    <PageHeader>
      <template #title>
        <NavTitle>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-3 min-w-0">
            <div class="min-w-0">
              <h1 class="text-xl font-semibold tracking-tight text-highlighted">
                {{ connection.partnerName }}
              </h1>
              <p class="text-xs text-muted mt-0.5">
                {{ connection.ehrVendor }} · {{ connection.sidecarId }}
                <span class="capitalize"> · {{ connection.environment }}</span>
              </p>
            </div>
            <ConnectionsConnectionDetailNav :items="navItems" />
            <UBadge
              v-if="connection.environment === 'live' && connection.liveActivation"
              :color="isLiveActivated(connection) ? 'success' : 'warning'"
              variant="subtle"
              class="shrink-0"
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

    <NuxtPage v-else />
  </div>

  <div v-else class="flex flex-col items-center gap-4 py-20">
    <UIcon name="i-iconoir-file-not-found" class="size-12 text-muted" />
    <h2 class="text-lg font-semibold text-highlighted">
      Connection not found
    </h2>
    <UButton to="/connections" label="Back to Connections" icon="i-iconoir-arrow-left" />
  </div>
</template>
