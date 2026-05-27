<script setup lang="ts">
import type { IncidentReport, TunnelLogEntry } from '~/types/while'

const props = defineProps<{
  log: TunnelLogEntry
}>()

const { getIncidentForLog, getIncidentMessages, getRelatedLogs } = useTunnelUptime()

const incident = computed(() => getIncidentForLog(props.log))
const messages = computed(() =>
  incident.value ? getIncidentMessages(incident.value.id) : []
)
const relatedLogs = computed(() =>
  incident.value ? getRelatedLogs(incident.value) : []
)

const logSeverityColors: Record<TunnelLogEntry['severity'], 'success' | 'info' | 'warning' | 'error'> = {
  success: 'success',
  info: 'info',
  warn: 'warning',
  error: 'error'
}

const incidentSeverityColors: Record<IncidentReport['severity'], 'error' | 'warning' | 'info'> = {
  critical: 'error',
  major: 'warning',
  minor: 'info'
}

const statusColors: Record<IncidentReport['status'], 'error' | 'warning' | 'success'> = {
  open: 'error',
  investigating: 'warning',
  resolved: 'success'
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
        <UBadge :color="logSeverityColors[log.severity]" variant="subtle" class="capitalize">
          {{ log.severity }}
        </UBadge>
        <UBadge color="neutral" variant="subtle" class="capitalize">
          {{ log.eventType }}
        </UBadge>
      </div>

      <div>
        <p class="text-xs text-muted uppercase">Timestamp</p>
        <p class="text-sm text-highlighted mt-0.5">{{ formatTimestamp(log.timestamp) }}</p>
      </div>

      <div>
        <p class="text-xs text-muted uppercase">Connection</p>
        <NuxtLink
          :to="`/connections/${log.connectionId}`"
          class="text-sm text-primary hover:underline mt-0.5 inline-flex items-center gap-1"
        >
          {{ log.partnerName }}
          <UIcon name="i-iconoir-arrow-up-right" class="size-3.5" />
        </NuxtLink>
        <p class="text-xs text-muted">{{ log.connectionId }}</p>
      </div>

      <div>
        <p class="text-xs text-muted uppercase">Message</p>
        <p class="text-sm text-default mt-0.5">{{ log.message }}</p>
      </div>
    </section>

    <section v-if="incident" class="space-y-4 border-t border-default pt-6">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-xs text-muted uppercase">Incident Report</p>
          <h4 class="font-semibold text-highlighted mt-1">{{ incident.title }}</h4>
        </div>
        <div class="flex flex-wrap gap-2">
          <UBadge :color="incidentSeverityColors[incident.severity]" variant="subtle" class="capitalize">
            {{ incident.severity }}
          </UBadge>
          <UBadge :color="statusColors[incident.status]" variant="subtle" class="capitalize">
            {{ incident.status }}
          </UBadge>
        </div>
      </div>

      <p class="text-sm text-default">{{ incident.summary }}</p>

      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p class="text-xs text-muted uppercase">Started</p>
          <p class="text-highlighted mt-0.5">{{ formatTimestamp(incident.startedAt) }}</p>
        </div>
        <div v-if="incident.resolvedAt">
          <p class="text-xs text-muted uppercase">Resolved</p>
          <p class="text-highlighted mt-0.5">{{ formatTimestamp(incident.resolvedAt) }}</p>
        </div>
      </div>

      <div v-if="relatedLogs.length" class="space-y-2">
        <p class="text-xs text-muted uppercase">Related Logs</p>
        <ul class="space-y-2">
          <li
            v-for="related in relatedLogs"
            :key="related.id"
            class="rounded-lg border border-default px-3 py-2 text-sm"
            :class="related.id === log.id ? 'bg-elevated/50' : ''"
          >
            <p class="text-xs text-muted">{{ formatTimestamp(related.timestamp) }}</p>
            <p class="text-default mt-0.5">{{ related.message }}</p>
          </li>
        </ul>
      </div>

      <div v-if="messages.length" class="space-y-3">
        <p class="text-xs text-muted uppercase">Incident Messaging</p>
        <div class="space-y-3">
          <article
            v-for="message in messages"
            :key="message.id"
            class="rounded-lg border border-default px-3 py-3"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="text-sm font-medium text-highlighted">{{ message.author }}</p>
              <p class="text-xs text-muted">{{ formatTimestamp(message.timestamp) }}</p>
            </div>
            <p class="text-sm text-default mt-2">{{ message.body }}</p>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>
