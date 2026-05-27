<script setup lang="ts">
import type { EhrVendor, TunnelStatus } from '~/types/while'

const PAGE_SIZE = 12

const { connections } = useConnections()

const search = ref('')
const statusFilter = ref<TunnelStatus | undefined>()
const vendorFilter = ref<EhrVendor | undefined>()
const page = ref(1)

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

function sparklinePoints(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  const points: number[] = []
  for (let i = 0; i < 12; i++) {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff
    points.push(4 + (hash % 20))
  }
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1
  return points
    .map((y, i) => {
      const x = (i / (points.length - 1)) * 80
      const py = 24 - ((y - min) / range) * 20
      return `${x},${py}`
    })
    .join(' ')
}
</script>

<template>
  <div>
    <div class="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-sm font-semibold text-highlighted">
        Connections
      </h2>
      <UButton
        to="/connections"
        label="View all"
        color="neutral"
        variant="ghost"
        size="xs"
        class="self-start sm:self-auto"
      />
    </div>

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
    </div>

    <div
      v-if="paginated.length"
      class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <NuxtLink
        v-for="conn in paginated"
        :key="conn.id"
        :to="`/connections/${conn.id}`"
        class="flex flex-col gap-2 rounded-xl border border-default bg-elevated p-3 transition-colors hover:border-primary/40"
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

    <p
      v-else
      class="rounded-xl border border-dashed border-default py-12 text-center text-sm text-muted"
    >
      No connections match your search or filters.
    </p>

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
  </div>
</template>
