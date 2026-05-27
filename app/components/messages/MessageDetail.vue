<script setup lang="ts">
import type { ProcessedMessage } from '~/types/while'

const props = defineProps<{
  message: ProcessedMessage
}>()

const { getConnection } = useConnections()

const connection = computed(() => getConnection(props.message.connectionId))

const statusColors: Record<ProcessedMessage['status'], 'success' | 'warning' | 'error'> = {
  success: 'success',
  pending: 'warning',
  failed: 'error'
}

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
    timeZoneName: 'short'
  })
}
</script>

<template>
  <div class="space-y-6">
    <section class="space-y-3">
      <div class="flex flex-wrap items-center gap-2">
        <UBadge :color="statusColors[message.status]" variant="subtle" class="capitalize">
          {{ message.status }}
        </UBadge>
        <UBadge
          :color="message.direction === 'inbound' ? 'info' : 'primary'"
          variant="subtle"
          class="capitalize"
        >
          <UIcon
            :name="message.direction === 'inbound' ? 'i-lucide-arrow-down-left' : 'i-lucide-arrow-up-right'"
            class="size-3"
          />
          {{ message.direction }}
        </UBadge>
        <UBadge color="neutral" variant="subtle" class="uppercase">
          {{ message.format }}
        </UBadge>
      </div>

      <div>
        <p class="text-xs text-muted uppercase">Timestamp</p>
        <p class="text-sm text-highlighted mt-0.5">{{ formatTimestamp(message.timestamp) }}</p>
      </div>

      <div>
        <p class="text-xs text-muted uppercase">Message ID</p>
        <code class="text-sm text-default mt-0.5 block">{{ message.id }}</code>
      </div>

      <div>
        <p class="text-xs text-muted uppercase">Connection</p>
        <NuxtLink
          :to="`/connections/${message.connectionId}`"
          class="text-sm text-primary hover:underline mt-0.5 inline-flex items-center gap-1"
        >
          {{ message.partnerName }}
          <UIcon name="i-lucide-arrow-up-right" class="size-3.5" />
        </NuxtLink>
        <p class="text-xs text-muted">{{ message.connectionId }}</p>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <p class="text-xs text-muted uppercase">Message Type</p>
          <code class="text-sm text-default mt-0.5 block">{{ message.messageType }}</code>
        </div>
        <div v-if="message.resourceType">
          <p class="text-xs text-muted uppercase">Resource Type</p>
          <p class="text-sm text-highlighted mt-0.5">{{ message.resourceType }}</p>
        </div>
      </div>

      <div>
        <p class="text-xs text-muted uppercase">Summary</p>
        <p class="text-sm text-default mt-0.5">{{ message.summary }}</p>
      </div>
    </section>

    <section v-if="connection" class="space-y-4 border-t border-default pt-6">
      <p class="text-xs text-muted uppercase">Connection Context</p>

      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p class="text-xs text-muted uppercase">EHR Vendor</p>
          <p class="text-highlighted mt-0.5">{{ connection.ehrVendor }}</p>
        </div>
        <div>
          <p class="text-xs text-muted uppercase">Region</p>
          <p class="text-highlighted mt-0.5">{{ connection.region }}</p>
        </div>
        <div>
          <p class="text-xs text-muted uppercase">Tunnel Status</p>
          <ConnectionsConnectionStatusBadge :status="connection.tunnelStatus" class="mt-1" />
        </div>
        <div>
          <p class="text-xs text-muted uppercase">Last Sync</p>
          <p class="text-highlighted mt-0.5">{{ formatTimestamp(connection.lastSyncAt) }}</p>
        </div>
      </div>
    </section>
  </div>
</template>
