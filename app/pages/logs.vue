<script setup lang="ts">
import type { LogSeverity, LogTimeRange } from '~/types/while'

const { anonymize, filterLogs } = useLogs()

const severityFilter = ref<LogSeverity | undefined>()
const timeRange = ref<LogTimeRange>('24h')
const resourceTypeFilter = ref<string | undefined>()
const search = ref('')

const resourceTypeOptions = [
  { label: 'All types', value: undefined },
  { label: 'Patient', value: 'Patient' },
  { label: 'Observation', value: 'Observation' },
  { label: 'Encounter', value: 'Encounter' }
]

const severityOptions = [
  { label: 'All severities', value: undefined },
  { label: 'Info', value: 'info' as LogSeverity },
  { label: 'Warning', value: 'warn' as LogSeverity },
  { label: 'Error', value: 'error' as LogSeverity }
]

const timeRangeOptions = [
  { label: 'Last hour', value: '1h' as LogTimeRange },
  { label: 'Last 6 hours', value: '6h' as LogTimeRange },
  { label: 'Last 24 hours', value: '24h' as LogTimeRange },
  { label: 'All time', value: 'all' as LogTimeRange }
]

const filteredLogs = computed(() =>
  filterLogs({
    severity: severityFilter.value,
    resourceType: resourceTypeFilter.value,
    timeRange: timeRange.value,
    search: search.value || undefined
  })
)

const severityColors: Record<LogSeverity, 'info' | 'warning' | 'error' | 'success' | 'neutral'> = {
  info: 'info',
  warn: 'warning',
  error: 'error',
  success: 'success'
}

useSeoMeta({ title: 'Logs' })
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Integration Logs"
      description="Clean room log viewer — search, filter, and toggle PHI anonymization below."
    >
      <template #filters>
        <USelectMenu
          v-model="resourceTypeFilter"
          :items="resourceTypeOptions"
          value-key="value"
          placeholder="Resource type"
          class="w-full sm:w-40"
        />
        <USelectMenu
          v-model="severityFilter"
          :items="severityOptions"
          value-key="value"
          placeholder="Severity"
          class="w-full sm:w-36"
        />
        <USelectMenu
          v-model="timeRange"
          :items="timeRangeOptions"
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
      <div class="divide-y divide-default max-h-[32rem] overflow-y-auto">
        <div
          v-for="log in filteredLogs.slice(0, 100)"
          :key="log.id"
          class="flex gap-3 px-4 py-3 text-sm hover:bg-elevated/50"
        >
          <UBadge
            :color="severityColors[log.severity] ?? 'neutral'"
            variant="subtle"
            class="shrink-0 capitalize w-16 justify-center"
          >
            {{ log.severity }}
          </UBadge>
          <div class="min-w-0 flex-1 font-mono text-xs text-muted">
            <span class="text-dimmed">{{ new Date(log.timestamp).toLocaleString() }}</span>
            <span class="mx-2 text-highlighted">{{ log.partnerName }}</span>
            <p class="mt-1 text-highlighted break-all">{{ log.displayMessage }}</p>
          </div>
        </div>
        <p v-if="!filteredLogs.length" class="px-4 py-8 text-center text-sm text-muted">
          No logs match your filters.
        </p>
      </div>
    </UCard>
  </div>
</template>
