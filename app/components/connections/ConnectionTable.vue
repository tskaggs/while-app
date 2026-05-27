<script setup lang="ts">
import type { Connection, EhrVendor } from '~/types/while'
import type { TableColumn } from '@nuxt/ui'
import { LIVE_BLOCKER_LABELS } from '~/data/connections'

defineProps<{
  connections: Connection[]
}>()

const { isLive, isLiveActivated } = useConnections()

const columns = computed<TableColumn<Connection>[]>(() => {
  const cols: TableColumn<Connection>[] = [
    { accessorKey: 'partnerName', header: 'Partner' },
    { accessorKey: 'ehrVendor', header: 'EHR' }
  ]
  if (!isLive.value) {
    cols.push({ accessorKey: 'environment', header: 'Environment' })
  } else {
    cols.push({ accessorKey: 'liveActivation', header: 'Live' })
  }
  cols.push(
    { accessorKey: 'sidecarId', header: 'Sidecar' },
    { accessorKey: 'tunnelStatus', header: 'Tunnel' },
    { accessorKey: 'lastSyncAt', header: 'Last Sync' },
    { id: 'actions', header: '' }
  )
  return cols
})

function formatRelative(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
</script>

<template>
  <UTable :data="connections" :columns="columns">
    <template #partnerName-cell="{ row }">
      <div>
        <p class="font-medium text-highlighted">
          {{ row.original.partnerName }}
        </p>
        <p class="text-xs text-muted">
          {{ row.original.region }}
        </p>
      </div>
    </template>

    <template #ehrVendor-cell="{ row }">
      <UBadge color="neutral" variant="subtle">
        {{ row.original.ehrVendor }}
      </UBadge>
    </template>

    <template #environment-cell="{ row }">
      <UBadge
        :color="row.original.environment === 'sandbox' ? 'warning' : 'success'"
        variant="subtle"
        class="capitalize"
      >
        {{ row.original.environment }}
      </UBadge>
    </template>

    <template #liveActivation-cell="{ row }">
      <UBadge
        v-if="isLiveActivated(row.original)"
        color="success"
        variant="subtle"
      >
        Activated
      </UBadge>
      <div
        v-else
        class="space-y-0.5"
      >
        <UBadge
          color="warning"
          variant="subtle"
        >
          Not activated
        </UBadge>
        <p
          v-if="row.original.liveActivation?.blocker"
          class="text-[10px] text-dimmed"
        >
          {{ LIVE_BLOCKER_LABELS[row.original.liveActivation.blocker] }}
        </p>
      </div>
    </template>

    <template #sidecarId-cell="{ row }">
      <code class="text-xs text-muted">{{ row.original.sidecarId }}</code>
    </template>

    <template #tunnelStatus-cell="{ row }">
      <ConnectionsConnectionStatusBadge :status="row.original.tunnelStatus" />
    </template>

    <template #lastSyncAt-cell="{ row }">
      <span class="text-sm text-muted">{{ formatRelative(row.original.lastSyncAt) }}</span>
    </template>

    <template #actions-cell="{ row }">
      <UButton
        :to="`/connections/${row.original.id}`"
        color="neutral"
        variant="ghost"
        icon="i-iconoir-arrow-right"
        size="xs"
      />
    </template>

    <template #empty>
      <div class="flex flex-col items-center gap-3 py-12">
        <UIcon name="i-iconoir-network" class="size-10 text-muted" />
        <p class="text-muted">No connections in this environment yet.</p>
        <UButton to="/support?compose=connection" label="Request Connection Support" icon="i-iconoir-plus" />
      </div>
    </template>
  </UTable>
</template>
