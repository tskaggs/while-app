<script setup lang="ts">
import type { LogCategory, LogSeverity, LogTimeRange } from '~/types/while'
import {
  LOG_CATEGORY_OPTIONS,
  LOG_SEVERITY_OPTIONS,
  LOG_TIME_RANGE_OPTIONS
} from '~/composables/useLogs'

const { anonymize, filterLogs, resourceTypeOptions } = useLogs()
const { connections } = useConnections()

const categoryFilter = ref<LogCategory | undefined>()
const severityFilter = ref<LogSeverity | undefined>()
const connectionFilter = ref<string | undefined>()
const resourceTypeFilter = ref<string | undefined>()
const timeRange = ref<LogTimeRange>('24h')
const search = ref('')
const page = ref(1)
const pageSize = 20
const detailOpen = ref(false)
const selectedLog = ref<ReturnType<typeof filterLogs>[number] | null>(null)

const connectionOptions = computed(() => [
  { label: 'All connections', value: undefined },
  ...connections.value.map(c => ({
    label: c.partnerName,
    value: c.id
  }))
])

const filteredLogs = computed(() =>
  filterLogs({
    category: categoryFilter.value,
    severity: severityFilter.value,
    connectionId: connectionFilter.value,
    resourceType: resourceTypeFilter.value,
    timeRange: timeRange.value,
    search: search.value || undefined
  })
)

const paginatedLogs = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredLogs.value.slice(start, start + pageSize)
})

watch([categoryFilter, severityFilter, connectionFilter, resourceTypeFilter, timeRange, search], () => {
  page.value = 1
})

function openLogDetail(log: ReturnType<typeof filterLogs>[number]) {
  selectedLog.value = log
  detailOpen.value = true
}

useSeoMeta({ title: 'Logs' })
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Integration Logs"
      description="All integration, tunnel, webhook, mapping, API, audit, and system events — search, filter, and open any entry for full context."
    >
      <template #filters>
        <USelectMenu
          v-model="categoryFilter"
          :items="LOG_CATEGORY_OPTIONS"
          value-key="value"
          placeholder="Category"
          class="w-full sm:w-40"
        />
        <USelectMenu
          v-model="severityFilter"
          :items="LOG_SEVERITY_OPTIONS"
          value-key="value"
          placeholder="Severity"
          class="w-full sm:w-36"
        />
        <USelectMenu
          v-model="connectionFilter"
          :items="connectionOptions"
          value-key="value"
          placeholder="Connection"
          class="w-full sm:w-48"
        />
        <USelectMenu
          v-model="resourceTypeFilter"
          :items="resourceTypeOptions"
          value-key="value"
          placeholder="Resource type"
          class="w-full sm:w-44"
        />
        <USelectMenu
          v-model="timeRange"
          :items="LOG_TIME_RANGE_OPTIONS"
          value-key="value"
          class="w-full sm:w-36"
        />
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Search logs..."
          class="w-full sm:w-56"
        />
        <UButton
          :icon="anonymize ? 'i-lucide-eye-off' : 'i-lucide-eye'"
          :label="anonymize ? 'PHI anonymized' : 'PHI visible'"
          color="neutral"
          variant="outline"
          size="sm"
          @click="anonymize = !anonymize"
        />
        <UBadge color="neutral" variant="subtle">
          {{ filteredLogs.length.toLocaleString() }} entries
        </UBadge>
      </template>
    </PageHeader>

    <UCard :ui="{ body: 'p-0' }">
      <LogsLogTable
        v-if="paginatedLogs.length"
        :logs="paginatedLogs"
        @select="openLogDetail"
      />
      <p v-else class="px-4 py-12 text-center text-sm text-muted">
        No logs match your filters.
      </p>

      <template v-if="filteredLogs.length" #footer>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3">
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

    <USlideover
      v-model:open="detailOpen"
      title="Log details"
      description="Full event context, correlation IDs, and connection metadata"
    >
      <template #body>
        <LogsLogDetail v-if="selectedLog" :log="selectedLog" />
      </template>
    </USlideover>
  </div>
</template>
