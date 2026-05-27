<script setup lang="ts">
import type { Connection } from '~/types/while'

defineProps<{
  connection: Connection
}>()
</script>

<template>
  <UCard :ui="{ body: 'p-6' }">
    <div class="flex flex-col items-center gap-6 md:flex-row md:justify-between">
      <div class="flex flex-col items-center gap-2">
        <div class="flex size-16 items-center justify-center rounded-xl bg-primary/10 ring ring-inset ring-primary/25">
          <UIcon name="i-lucide-smartphone" class="size-7 text-primary" />
        </div>
        <span class="text-sm font-medium text-highlighted">Your App</span>
        <span class="text-xs text-muted">app.startup.co</span>
      </div>

      <div class="flex flex-col items-center gap-1">
        <UIcon name="i-lucide-arrow-right" class="size-5 text-muted hidden md:block" />
        <UIcon name="i-lucide-arrow-down" class="size-5 text-muted md:hidden" />
        <span class="text-xs text-dimmed">Secure API</span>
      </div>

      <div class="flex flex-col items-center gap-2">
        <div
          class="relative flex size-16 items-center justify-center rounded-xl ring ring-inset"
          :class="connection.tunnelStatus === 'active'
            ? 'bg-success/10 ring-success/25'
            : connection.tunnelStatus === 'pending'
              ? 'bg-warning/10 ring-warning/25'
              : 'bg-error/10 ring-error/25'"
        >
          <UIcon
            name="i-lucide-server"
            class="size-7"
            :class="connection.tunnelStatus === 'active' ? 'text-success' : connection.tunnelStatus === 'pending' ? 'text-warning' : 'text-error'"
          />
          <span
            class="absolute -top-1 -right-1 size-3 rounded-full ring-2 ring-bg"
            :class="connection.tunnelStatus === 'active' ? 'bg-success' : connection.tunnelStatus === 'pending' ? 'bg-warning' : 'bg-error'"
          />
        </div>
        <span class="text-sm font-medium text-highlighted">While Sidecar</span>
        <code class="text-xs text-muted">{{ connection.sidecarId }}</code>
      </div>

      <div class="flex flex-col items-center gap-1">
        <div
          class="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
          :class="connection.tunnelStatus === 'active'
            ? 'bg-success/10 text-success'
            : 'bg-warning/10 text-warning'"
        >
          <UIcon name="i-lucide-lock" class="size-3" />
          WireGuard
        </div>
        <UIcon name="i-lucide-arrow-right" class="size-5 text-muted hidden md:block" />
        <UIcon name="i-lucide-arrow-down" class="size-5 text-muted md:hidden" />
      </div>

      <div class="flex flex-col items-center gap-2">
        <div class="flex size-16 items-center justify-center rounded-xl bg-elevated ring ring-inset ring-default">
          <UIcon name="i-lucide-hospital" class="size-7 text-muted" />
        </div>
        <span class="text-sm font-medium text-highlighted">{{ connection.partnerName }}</span>
        <UBadge color="neutral" variant="subtle" class="text-xs">
          {{ connection.ehrVendor }}
        </UBadge>
      </div>
    </div>

    <UAlert
      v-if="connection.tunnelStatus !== 'active'"
      class="mt-6"
      :color="connection.tunnelStatus === 'pending' ? 'warning' : 'error'"
      variant="subtle"
      :icon="connection.tunnelStatus === 'pending' ? 'i-lucide-clock' : 'i-lucide-alert-triangle'"
      :title="connection.tunnelStatus === 'pending' ? 'Handshake pending' : 'Tunnel disconnected'"
      :description="connection.tunnelStatus === 'pending'
        ? 'Clinic IT must add the Sidecar public key to their WireGuard gateway.'
        : 'WireGuard peer unreachable. Check clinic gateway configuration.'"
    />
  </UCard>
</template>
