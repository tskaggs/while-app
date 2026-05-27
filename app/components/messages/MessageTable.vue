<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { ProcessedMessage } from '~/types/while'

defineProps<{
  messages: ProcessedMessage[]
}>()

const emit = defineEmits<{
  select: [message: ProcessedMessage]
}>()

const columns: TableColumn<ProcessedMessage>[] = [
  { accessorKey: 'timestamp', header: 'Time' },
  { accessorKey: 'partnerName', header: 'Connection' },
  { accessorKey: 'direction', header: 'Direction' },
  { accessorKey: 'format', header: 'Format' },
  { accessorKey: 'messageType', header: 'Type' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'summary', header: 'Summary' }
]

const statusColors: Record<ProcessedMessage['status'], 'success' | 'warning' | 'error'> = {
  success: 'success',
  pending: 'warning',
  failed: 'error'
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
    :data="messages"
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

    <template #direction-cell="{ row }">
      <UBadge
        :color="row.original.direction === 'inbound' ? 'info' : 'primary'"
        variant="subtle"
        class="capitalize"
      >
        <UIcon
          :name="row.original.direction === 'inbound' ? 'i-iconoir-arrow-down-left' : 'i-iconoir-arrow-up-right'"
          class="size-3"
        />
        {{ row.original.direction }}
      </UBadge>
    </template>

    <template #format-cell="{ row }">
      <UBadge color="neutral" variant="subtle" class="uppercase">
        {{ row.original.format }}
      </UBadge>
    </template>

    <template #messageType-cell="{ row }">
      <code class="text-xs text-muted">{{ row.original.messageType }}</code>
    </template>

    <template #status-cell="{ row }">
      <UBadge :color="statusColors[row.original.status]" variant="subtle" class="capitalize">
        {{ row.original.status }}
      </UBadge>
    </template>

    <template #summary-cell="{ row }">
      <p class="text-sm text-default max-w-md truncate">
        {{ row.original.summary }}
      </p>
    </template>

    <template #empty>
      <div class="flex flex-col items-center gap-3 py-12">
        <UIcon name="i-iconoir-mail-in" class="size-10 text-muted" />
        <p class="text-muted">No messages match your filters.</p>
      </div>
    </template>
  </UTable>
</template>
