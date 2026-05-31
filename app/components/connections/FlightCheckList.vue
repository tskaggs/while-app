<script setup lang="ts">
import type { FlightCheck } from '~/types/while'

defineProps<{
  flightCheck: FlightCheck
  /** When true, pending checks show as in progress instead of failed. */
  inProgress?: boolean
}>()

const checks = [
  { key: 'mtu' as const, label: 'MTU Discovery', description: 'Path MTU verified across tunnel' },
  { key: 'handshake' as const, label: 'WireGuard Handshake', description: 'Encrypted tunnel established with clinic gateway' },
  { key: 'hl7Ack' as const, label: 'HL7 ACK Test', description: 'End-to-end message acknowledgment from EHR' }
]
</script>

<template>
  <UCard class="while-card overflow-hidden">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-iconoir-airplane" class="size-5 text-primary" />
        <h3 class="font-semibold text-highlighted">Flight Check</h3>
      </div>
    </template>

    <div class="space-y-3">
      <div
        v-for="check in checks"
        :key="check.key"
        class="while-card-inset flex items-start gap-3 p-3"
      >
        <UIcon
          v-if="inProgress && !flightCheck[check.key]"
          name="i-iconoir-refresh-double"
          class="size-5 shrink-0 mt-0.5 animate-spin text-primary"
        />
        <UIcon
          v-else
          :name="flightCheck[check.key] ? 'i-iconoir-check-circle' : 'i-iconoir-xmark-circle'"
          class="size-5 shrink-0 mt-0.5"
          :class="flightCheck[check.key] ? 'text-success' : 'text-error'"
        />
        <div>
          <p class="text-sm font-medium text-highlighted">{{ check.label }}</p>
          <p class="text-xs text-muted">{{ check.description }}</p>
        </div>
        <UBadge
          v-if="inProgress && !flightCheck[check.key]"
          color="primary"
          variant="subtle"
          class="ml-auto shrink-0"
        >
          Running
        </UBadge>
        <UBadge
          v-else
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
