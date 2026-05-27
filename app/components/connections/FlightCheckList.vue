<script setup lang="ts">
import type { FlightCheck } from '~/types/while'

defineProps<{
  flightCheck: FlightCheck
}>()

const checks = [
  { key: 'mtu' as const, label: 'MTU Discovery', description: 'Path MTU verified across tunnel' },
  { key: 'handshake' as const, label: 'WireGuard Handshake', description: 'Encrypted tunnel established with clinic gateway' },
  { key: 'hl7Ack' as const, label: 'HL7 ACK Test', description: 'End-to-end message acknowledgment from EHR' }
]
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-plane-takeoff" class="size-5 text-primary" />
        <h3 class="font-semibold text-highlighted">Flight Check</h3>
      </div>
    </template>

    <div class="space-y-3">
      <div
        v-for="check in checks"
        :key="check.key"
        class="flex items-start gap-3 rounded-lg border border-default p-3"
      >
        <UIcon
          :name="flightCheck[check.key] ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
          class="size-5 shrink-0 mt-0.5"
          :class="flightCheck[check.key] ? 'text-success' : 'text-error'"
        />
        <div>
          <p class="text-sm font-medium text-highlighted">{{ check.label }}</p>
          <p class="text-xs text-muted">{{ check.description }}</p>
        </div>
        <UBadge
          :color="flightCheck[check.key] ? 'success' : 'error'"
          variant="subtle"
          class="ml-auto shrink-0"
        >
          {{ flightCheck[check.key] ? 'Pass' : 'Fail' }}
        </UBadge>
      </div>
    </div>
  </UCard>
</template>
