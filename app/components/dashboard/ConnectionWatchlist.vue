<script setup lang="ts">
import type { EhrVendor, TunnelStatus } from '~/types/while'

const PAGE_SIZE = 12
const SPARKLINE_BUCKETS = 12

const { connections } = useConnections()
const { messages } = useMessages()
const { chartData } = useUsageMetrics()

const search = ref('')
const statusFilter = ref<TunnelStatus | undefined>()
const vendorFilter = ref<EhrVendor | undefined>()
const page = ref(1)
const viewMode = useLocalStorage<'cards' | 'table'>('while-overview-connection-view', 'cards')

const statusOptions = [
  { label: 'All statuses', value: undefined },
  { label: 'Active', value: 'active' as TunnelStatus },
  { label: 'Pending', value: 'pending' as TunnelStatus },
  { label: 'Error', value: 'error' as TunnelStatus }
]

const vendorOptions = [
  { label: 'All EHR systems', value: undefined },
  { label: 'Epic', value: 'Epic' as EhrVendor },
  { label: 'Cerner', value: 'Cerner' as EhrVendor },
  { label: 'Meditech', value: 'Meditech' as EhrVendor },
  { label: 'Athena', value: 'Athena' as EhrVendor },
  { label: 'Other', value: 'Other' as EhrVendor }
]

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()

  return connections.value.filter((connection) => {
    if (statusFilter.value && connection.tunnelStatus !== statusFilter.value) return false
    if (vendorFilter.value && connection.ehrVendor !== vendorFilter.value) return false
    if (q) {
      return connection.partnerName.toLowerCase().includes(q)
        || connection.ehrVendor.toLowerCase().includes(q)
        || connection.id.toLowerCase().includes(q)
        || connection.sidecarId.toLowerCase().includes(q)
    }
    return true
  })
})

const paginated = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filtered.value.slice(start, start + PAGE_SIZE)
})

watch([search, statusFilter, vendorFilter], () => {
  page.value = 1
})

function connectionSparklineValues(connectionId: string): number[] {
  const now = Date.now()
  const since24h = now - 86400000
  const bucketMs = 86400000 / SPARKLINE_BUCKETS
  const counts = Array.from({ length: SPARKLINE_BUCKETS }, () => 0)
  let hasRecentMessages = false

  for (const message of messages.value) {
    if (message.connectionId !== connectionId) continue
    const timestamp = new Date(message.timestamp).getTime()
    if (timestamp < since24h) continue
    hasRecentMessages = true
    const bucketIndex = Math.min(
      SPARKLINE_BUCKETS - 1,
      Math.floor((timestamp - since24h) / bucketMs)
    )
    counts[bucketIndex]++
  }

  if (hasRecentMessages) return counts

  return chartData.value
    .slice(-SPARKLINE_BUCKETS)
    .map(point => point.byConnection[connectionId] ?? 0)
}

function valuesToSparklinePoints(values: number[]): string {
  if (!values.length) return '0,12 80,12'

  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1

  return values
    .map((value, index) => {
      const x = values.length === 1 ? 40 : (index / (values.length - 1)) * 80
      const y = 24 - ((value - min) / range) * 20
      return `${x},${y}`
    })
    .join(' ')
}

function sparklinePoints(connectionId: string): string {
  return valuesToSparklinePoints(connectionSparklineValues(connectionId))
}
</script>

<template>
  <div>
    <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <UInput
        v-model="search"
        icon="i-iconoir-search"
        placeholder="Search connections..."
        class="w-full sm:w-56"
      />
      <USelectMenu
        v-model="statusFilter"
        :items="statusOptions"
        value-key="value"
        placeholder="Status"
        class="w-full sm:w-36"
      />
      <USelectMenu
        v-model="vendorFilter"
        :items="vendorOptions"
        value-key="value"
        placeholder="EHR"
        class="w-full sm:w-40"
      />
      <UBadge color="neutral" variant="subtle" class="shrink-0">
        {{ filtered.length }} connection{{ filtered.length === 1 ? '' : 's' }}
      </UBadge>
      <UFieldGroup size="sm" class="shrink-0 sm:ml-auto">
        <UTooltip text="Cards">
          <UButton
            icon="i-iconoir-view-grid"
            color="neutral"
            :variant="viewMode === 'cards' ? 'subtle' : 'outline'"
            aria-label="Cards view"
            @click="viewMode = 'cards'"
          />
        </UTooltip>
        <UTooltip text="Table">
          <UButton
            icon="i-iconoir-list"
            color="neutral"
            :variant="viewMode === 'table' ? 'subtle' : 'outline'"
            aria-label="Table view"
            @click="viewMode = 'table'"
          />
        </UTooltip>
      </UFieldGroup>
    </div>

    <template v-if="filtered.length">
      <div
        v-if="viewMode === 'cards'"
        class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <NuxtLink
          v-for="conn in paginated"
          :key="conn.id"
          :to="`/connections/${conn.id}`"
          class="while-card flex flex-col gap-2 p-3 transition-shadow hover:ring-primary/40"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="text-sm font-medium text-highlighted truncate">
                {{ conn.partnerName }}
              </p>
              <p class="text-xs text-muted">
                {{ conn.ehrVendor }} · {{ conn.region }}
              </p>
            </div>
            <ConnectionsConnectionStatusBadge :status="conn.tunnelStatus" />
          </div>
          <p class="text-sm font-semibold tabular-nums text-highlighted">
            {{ conn.messagesProcessed24h.toLocaleString() }}
            <span class="text-xs font-normal text-muted">msgs/24h</span>
          </p>
          <svg
            viewBox="0 0 80 24"
            class="h-6 w-full text-primary"
            aria-hidden="true"
          >
            <polyline
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              :points="sparklinePoints(conn.id)"
            />
          </svg>
        </NuxtLink>
      </div>

      <ConnectionsConnectionTable
        v-else
        :connections="paginated"
      />

      <div
        v-if="filtered.length > PAGE_SIZE"
        class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <p class="text-sm text-muted">
          Showing
          {{ (page - 1) * PAGE_SIZE + 1 }}–{{ Math.min(page * PAGE_SIZE, filtered.length) }}
          of {{ filtered.length }}
        </p>
        <UPagination
          v-model:page="page"
          :total="filtered.length"
          :items-per-page="PAGE_SIZE"
          show-edges
        />
      </div>
    </template>

    <p
      v-else
      class="rounded-xl border border-dashed border-default py-12 text-center text-sm text-muted"
    >
      No connections match your search or filters.
    </p>
  </div>
</template>
