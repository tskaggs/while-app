<script setup lang="ts">
import type { LogSeverity, TunnelEventType, TunnelUptimeGranularity } from '~/types/while'

const {
  filterTunnelLogs,
  buildUptimeChart
} = useTunnelUptime()
const { connections } = useConnections()

const selectedDate = ref('2026-05-20')
const granularity = ref<TunnelUptimeGranularity>('hour')
const selectedHour = ref<number | undefined>(undefined)
const connectionFilter = ref<string | undefined>()
const severityFilter = ref<LogSeverity | undefined>()
const eventTypeFilter = ref<TunnelEventType | undefined>()
const search = ref('')
const page = ref(1)
const pageSize = 20
const detailOpen = ref(false)
const selectedLog = ref<ReturnType<typeof filterTunnelLogs>[number] | null>(null)

useSeoMeta({ title: 'Tunnel Uptime' })

const sharedFilters = computed(() => ({
  date: selectedDate.value,
  hour: granularity.value === 'minute' ? selectedHour.value : undefined,
  connectionId: connectionFilter.value,
  severity: severityFilter.value,
  eventType: eventTypeFilter.value,
  search: search.value || undefined
}))

const filteredLogs = computed(() => filterTunnelLogs(sharedFilters.value))

const paginatedLogs = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredLogs.value.slice(start, start + pageSize)
})

const chartView = computed(() => {
  if (granularity.value === 'hour') return 'hour' as const
  return selectedHour.value === undefined ? 'hour' as const : 'minute' as const
})

const uptimeChart = computed(() =>
  buildUptimeChart({
    ...sharedFilters.value,
    granularity: granularity.value
  })
)

const hourOptions = computed(() => [
  { label: 'Full day', value: undefined },
  ...Array.from({ length: 24 }, (_, hour) => ({
    label: `${String(hour).padStart(2, '0')}:00 UTC`,
    value: hour
  }))
])

const connectionOptions = computed(() => [
  { label: 'All connections', value: undefined },
  ...connections.value.map(connection => ({
    label: connection.partnerName,
    value: connection.id
  }))
])

const severityOptions = [
  { label: 'All severities', value: undefined },
  { label: 'Success', value: 'success' as LogSeverity },
  { label: 'Info', value: 'info' as LogSeverity },
  { label: 'Warning', value: 'warn' as LogSeverity },
  { label: 'Error', value: 'error' as LogSeverity }
]

const eventTypeOptions = [
  { label: 'All events', value: undefined },
  { label: 'Handshake', value: 'handshake' as TunnelEventType },
  { label: 'Disconnect', value: 'disconnect' as TunnelEventType },
  { label: 'Reconnect', value: 'reconnect' as TunnelEventType },
  { label: 'Latency', value: 'latency' as TunnelEventType },
  { label: 'Credential', value: 'credential' as TunnelEventType },
  { label: 'Health', value: 'health' as TunnelEventType },
  { label: 'Ack', value: 'ack' as TunnelEventType }
]

const granularityOptions = [
  { label: 'By hour', value: 'hour' as TunnelUptimeGranularity },
  { label: 'By minute', value: 'minute' as TunnelUptimeGranularity }
]

watch(granularity, (value) => {
  if (value === 'minute') selectedHour.value = undefined
})

watch([selectedDate, granularity, selectedHour, connectionFilter, severityFilter, eventTypeFilter, search], () => {
  page.value = 1
})

function openLogDetail(log: ReturnType<typeof filterTunnelLogs>[number]) {
  selectedLog.value = log
  detailOpen.value = true
}
</script>

<template>
  <UDashboardPanel id="uptime">
    <template #header>
      <UDashboardNavbar :ui="{ right: 'gap-3' }">
        <template #title>
          <NavTitle title="Tunnel Uptime" />
        </template>
        <template #right>
          <EnvironmentSwitcher />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UInput
            v-model="selectedDate"
            type="date"
            class="w-40"
            aria-label="Filter by date"
          />
          <USelectMenu
            v-model="granularity"
            :items="granularityOptions"
            value-key="value"
            class="w-36"
          />
          <USelectMenu
            v-if="granularity === 'minute'"
            v-model="selectedHour"
            :items="hourOptions"
            value-key="value"
            placeholder="Select hour"
            class="w-40"
          />
          <USelectMenu
            v-model="connectionFilter"
            :items="connectionOptions"
            value-key="value"
            placeholder="Connection"
            class="w-48"
          />
          <USelectMenu
            v-model="severityFilter"
            :items="severityOptions"
            value-key="value"
            placeholder="Severity"
            class="w-36"
          />
          <USelectMenu
            v-model="eventTypeFilter"
            :items="eventTypeOptions"
            value-key="value"
            placeholder="Event type"
            class="w-36"
          />
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Search tunnel logs..."
            class="w-56"
          />
          <UBadge color="neutral" variant="subtle">
            {{ filteredLogs.length.toLocaleString() }} logs
          </UBadge>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <UptimeTunnelUptimeChart
          :buckets="uptimeChart.buckets"
          :connections="uptimeChart.connections"
          :granularity="chartView"
          :minute-mode="granularity === 'minute'"
          :selected-hour="selectedHour"
          :average-uptime="uptimeChart.averageUptime"
        />

        <UCard>
          <template #header>
            <div>
              <h3 class="font-semibold text-highlighted">Tunnel Log</h3>
              <p class="text-sm text-muted mt-0.5">
                Connectivity events matching the filters above — click a row for details
              </p>
            </div>
          </template>

          <UptimeTunnelLogTable :logs="paginatedLogs" @select="openLogDetail" />

          <template #footer>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p class="text-sm text-muted">
                Showing
                {{ filteredLogs.length ? (page - 1) * pageSize + 1 : 0 }}–{{
                  Math.min(page * pageSize, filteredLogs.length)
                }}
                of {{ filteredLogs.length.toLocaleString() }}
              </p>
              <UPagination
                v-model:page="page"
                :total="filteredLogs.length"
                :items-per-page="pageSize"
                show-edges
              />
            </div>
          </template>
        </UCard>
      </div>

      <USlideover
        v-model:open="detailOpen"
        title="Tunnel log details"
        description="Connectivity event details and related incident reports"
      >
        <template #body>
          <UptimeTunnelLogDetail v-if="selectedLog" :log="selectedLog" />
        </template>
      </USlideover>
    </template>
  </UDashboardPanel>
</template>
