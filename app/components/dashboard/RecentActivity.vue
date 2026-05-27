<script setup lang="ts">
const { connections } = useConnections()
const { requests } = useSupportRequests()

const statusColors: Record<string, 'success' | 'warning' | 'info' | 'neutral'> = {
  active: 'success',
  pending: 'warning',
  error: 'error' as 'warning',
  submitted: 'info',
  in_review: 'warning',
  in_progress: 'info',
  completed: 'success'
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
    <UCard class="rounded-xl border border-default bg-elevated">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-highlighted">
            Connection health
          </h3>
          <UButton
            to="/connections"
            label="View all"
            color="neutral"
            variant="ghost"
            size="xs"
          />
        </div>
      </template>

      <div class="space-y-3">
        <NuxtLink
          v-for="conn in connections.slice(0, 5)"
          :key="conn.id"
          :to="`/connections/${conn.id}`"
          class="flex items-center gap-3 rounded-lg border border-default p-3 transition-colors hover:bg-accented/40"
        >
          <div
            class="size-2 rounded-full shrink-0"
            :class="conn.tunnelStatus === 'active' ? 'bg-success' : conn.tunnelStatus === 'pending' ? 'bg-warning' : 'bg-error'"
          />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-highlighted truncate">
              {{ conn.partnerName }}
            </p>
            <p class="text-xs text-muted">
              {{ conn.ehrVendor }} · {{ conn.messagesProcessed24h.toLocaleString() }} msgs/24h
            </p>
          </div>
          <ConnectionsConnectionStatusBadge :status="conn.tunnelStatus" />
        </NuxtLink>
      </div>
    </UCard>

    <UCard class="rounded-xl border border-default bg-elevated">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-highlighted">
            Support requests
          </h3>
          <UButton
            to="/support"
            label="New"
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-iconoir-plus"
          />
        </div>
      </template>

      <div class="space-y-3">
        <div
          v-for="req in requests.slice(0, 4)"
          :key="req.id"
          class="flex items-center gap-3 rounded-lg border border-default p-3"
        >
          <UIcon name="i-iconoir-headset" class="size-5 text-primary shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-highlighted truncate">
              {{ req.partnerName }}
            </p>
            <p class="text-xs text-muted">
              Target: {{ formatDate(req.targetGoLive) }}
            </p>
          </div>
          <UBadge :color="statusColors[req.status] ?? 'neutral'" variant="subtle" class="capitalize shrink-0">
            {{ req.status.replace('_', ' ') }}
          </UBadge>
        </div>
      </div>
    </UCard>
  </div>
</template>
