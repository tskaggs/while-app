<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { TunnelLogEntry } from '~/types/while'

defineProps<{
  logs: TunnelLogEntry[]
}>()

const emit = defineEmits<{
  select: [log: TunnelLogEntry]
}>()

const columns: TableColumn<TunnelLogEntry>[] = [
  { accessorKey: 'timestamp', header: 'Time' },
  { accessorKey: 'partnerName', header: 'Connection' },
  { accessorKey: 'eventType', header: 'Event' },
  { accessorKey: 'severity', header: 'Severity' },
  { accessorKey: 'message', header: 'Message' }
]

const severityColors: Record<TunnelLogEntry['severity'], 'success' | 'info' | 'warning' | 'error'> = {
  success: 'success',
  info: 'info',
  warn: 'warning',
  error: 'error'
}

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}
</script>

<template>
  <UTable
    :data="logs"
    :columns="columns"
    :on-select="(_event, row) => emit('select', row.original)"
    :ui="{ tr: 'cursor-pointer hover:bg-elevated/50' }"
  >
    <template #timestamp-cell="{ row }">
      <span class="text-sm text-muted whitespace-nowrap">{{ formatTimestamp(row.original.timestamp) }}</span>
    </template>

    <template #partnerName-cell="{ row }">
      <div>
        <p class="font-medium text-highlighted">{{ row.original.partnerName }}</p>
        <p class="text-xs text-muted">{{ row.original.connectionId }}</p>
      </div>
    </template>

    <template #eventType-cell="{ row }">
      <UBadge color="neutral" variant="subtle" class="capitalize">
        {{ row.original.eventType }}
      </UBadge>
    </template>

    <template #severity-cell="{ row }">
      <UBadge :color="severityColors[row.original.severity]" variant="subtle" class="capitalize">
        {{ row.original.severity }}
      </UBadge>
    </template>

    <template #message-cell="{ row }">
      <div class="flex items-center gap-2 max-w-xl">
        <p class="text-sm text-default truncate">
          {{ row.original.message }}
        </p>
        <UIcon
          v-if="row.original.incidentId"
          name="i-iconoir-warning-triangle"
          class="size-4 shrink-0 text-warning"
        />
      </div>
    </template>

    <template #empty>
      <div class="flex flex-col items-center gap-3 py-12">
        <UIcon name="i-iconoir-shield-broken" class="size-10 text-muted" />
        <p class="text-muted">No tunnel logs match your filters.</p>
      </div>
    </template>
  </UTable>
</template>
