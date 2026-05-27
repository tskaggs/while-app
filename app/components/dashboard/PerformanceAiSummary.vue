<script setup lang="ts">
const { environmentLabel, isLive } = useEnvironment()
const { connections } = useConnections()
const { stats } = useUsageMetrics()

const pendingConnection = computed(() =>
  connections.value.find(c => c.tunnelStatus === 'pending')
)

const messagesStat = computed(() => stats.value.find(s => s.title === 'Messages Processed'))

const generatedAt = computed(() =>
  new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
)
</script>

<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-primary/25 bg-elevated ring-1 ring-default">
    <div class="flex shrink-0 items-center gap-2 border-b border-primary/15 bg-primary/5 px-4 py-3">
      <UIcon name="i-lucide-sparkles" class="size-4 text-primary shrink-0" />
      <span class="text-sm font-semibold text-highlighted">AI summary</span>
      <span class="text-xs text-dimmed ml-auto">{{ environmentLabel }} · {{ generatedAt }}</span>
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4 text-sm leading-relaxed">
      <p class="text-muted">
        <span class="text-highlighted font-medium">Overall:</span>
        Throughput is
        <span :class="isLive ? 'text-success' : 'text-warning'">
          {{ isLive ? 'healthy' : 'stable for sandbox testing' }}
        </span>
        across active tunnels. Message volume
        <template v-if="messagesStat">
          is at <span class="text-highlighted font-medium tabular-nums">{{ messagesStat.value }}</span>
          in the last 24h
          <span class="text-success font-medium">(+{{ messagesStat.variation }}%)</span>.
        </template>
        <template v-else>
          is within expected range for this environment.
        </template>
      </p>

      <div v-if="pendingConnection" class="rounded-md border border-warning/30 bg-warning/5 px-3 py-2.5">
        <p class="text-xs font-medium text-warning mb-1">
          Needs attention
        </p>
        <p class="text-muted text-xs leading-relaxed">
          <span class="text-highlighted">{{ pendingConnection.partnerName }}</span>
          ({{ pendingConnection.ehrVendor }}) is still pending — handshake and HL7 ACK checks have not passed.
          Complete WireGuard pairing or review flight checks before go-live.
        </p>
      </div>

      <p class="text-muted">
        <span class="text-highlighted font-medium">Watch:</span>
        Peak traffic clusters between 09:00–11:00 UTC; consider scaling sidecar capacity if live volume grows another 15%.
        No credential rotation or BAA expiry blockers in the next 30 days.
      </p>

      <p class="text-muted">
        <span class="text-highlighted font-medium">Suggested next steps:</span>
        Review tunnel logs for any reconnect spikes, validate FHIR mapping on new partners, and run a sandbox → live promotion checklist when ready.
      </p>
    </div>
  </div>
</template>
