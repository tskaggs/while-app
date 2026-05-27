<script setup lang="ts">
import type { TunnelStatus } from '~/types/while'

defineProps<{
  status: TunnelStatus
}>()

const config: Record<TunnelStatus, { label: string, color: 'success' | 'warning' | 'error', icon: string }> = {
  active: { label: 'Active', color: 'success', icon: 'i-lucide-check-circle' },
  pending: { label: 'Pending', color: 'warning', icon: 'i-lucide-clock' },
  error: { label: 'Error', color: 'error', icon: 'i-lucide-x-circle' }
}
</script>

<template>
  <UBadge :color="config[status].color" variant="subtle" class="gap-1">
    <UIcon :name="config[status].icon" class="size-3" />
    {{ config[status].label }}
  </UBadge>
</template>
