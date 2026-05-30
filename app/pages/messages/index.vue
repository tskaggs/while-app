<script setup lang="ts">
import type {
  MessageDirection,
  MessageFormat,
  MessageGranularity,
  MessageStatus
} from '~/types/while'

const { filterMessages, buildHistogram } = useMessages()
const { connections, operationalConnections, isLive } = useConnections()

const selectedDate = ref(new Date().toISOString().slice(0, 10))
const granularity = ref<MessageGranularity>('hour')
const selectedHour = ref<number | undefined>(undefined)
const connectionFilter = ref<string | undefined>()
const directionFilter = ref<MessageDirection | undefined>()
const formatFilter = ref<MessageFormat | undefined>()
const statusFilter = ref<MessageStatus | undefined>()
const search = ref('')
const page = ref(1)
const pageSize = 20
const detailOpen = ref(false)
const selectedMessage = ref<ReturnType<typeof filterMessages>[number] | null>(null)

useSeoMeta({ title: 'Messages' })

const sharedFilters = computed(() => ({
  date: selectedDate.value,
  hour: granularity.value === 'minute' ? selectedHour.value : undefined,
  connectionId: connectionFilter.value,
  direction: directionFilter.value,
  format: formatFilter.value,
  status: statusFilter.value,
  search: search.value || undefined
}))

const filteredMessages = computed(() => filterMessages(sharedFilters.value))

const paginatedMessages = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredMessages.value.slice(start, start + pageSize)
})

const histogramView = computed(() => {
  if (granularity.value === 'hour') return 'hour' as const
  return selectedHour.value === undefined ? 'hour' as const : 'minute' as const
})

const histogram = computed(() =>
  buildHistogram({
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

const connectionOptions = computed(() => {
  const list = isLive.value ? operationalConnections.value : connections.value
  return [
    { label: 'All connections', value: undefined },
    ...list.map(connection => ({
      label: connection.partnerName,
      value: connection.id
    }))
  ]
})

const directionOptions = [
  { label: 'All directions', value: undefined },
  { label: 'Inbound', value: 'inbound' as MessageDirection },
  { label: 'Outbound', value: 'outbound' as MessageDirection }
]

const formatOptions = [
  { label: 'All formats', value: undefined },
  { label: 'HL7', value: 'hl7' as MessageFormat },
  { label: 'FHIR', value: 'fhir' as MessageFormat }
]

const statusOptions = [
  { label: 'All statuses', value: undefined },
  { label: 'Success', value: 'success' as MessageStatus },
  { label: 'Pending', value: 'pending' as MessageStatus },
  { label: 'Failed', value: 'failed' as MessageStatus }
]

const granularityOptions = [
  { label: 'By hour', value: 'hour' as MessageGranularity },
  { label: 'By minute', value: 'minute' as MessageGranularity }
]

watch(granularity, (value) => {
  if (value === 'minute') selectedHour.value = undefined
})

watch([selectedDate, granularity, selectedHour, connectionFilter, directionFilter, formatFilter, statusFilter, search], () => {
  page.value = 1
})

function openMessageDetail(message: ReturnType<typeof filterMessages>[number]) {
  selectedMessage.value = message
  detailOpen.value = true
}
</script>

<template>
  <LiveViewGate>
  <div class="space-y-6">
    <PageHeader title="Messages">
      <template #filters>
        <UInput
          v-model="selectedDate"
          type="date"
          class="w-full sm:w-40"
          aria-label="Filter by date"
        />
        <USelectMenu
          v-model="granularity"
          :items="granularityOptions"
          value-key="value"
          class="w-full sm:w-36"
        />
        <USelectMenu
          v-if="granularity === 'minute'"
          v-model="selectedHour"
          :items="hourOptions"
          value-key="value"
          placeholder="Select hour"
          class="w-full sm:w-40"
        />
        <USelectMenu
          v-model="connectionFilter"
          :items="connectionOptions"
          value-key="value"
          placeholder="Connection"
          class="w-full sm:w-48"
        />
        <USelectMenu
          v-model="directionFilter"
          :items="directionOptions"
          value-key="value"
          placeholder="Direction"
          class="w-full sm:w-36"
        />
        <USelectMenu
          v-model="formatFilter"
          :items="formatOptions"
          value-key="value"
          placeholder="Format"
          class="w-full sm:w-32"
        />
        <USelectMenu
          v-model="statusFilter"
          :items="statusOptions"
          value-key="value"
          placeholder="Status"
          class="w-full sm:w-32"
        />
        <UInput
          v-model="search"
          icon="i-iconoir-search"
          placeholder="Search messages..."
          class="w-full sm:w-56"
        />
        <LiveMonitoringToggle />
        <UBadge color="neutral" variant="subtle">
          {{ filteredMessages.length.toLocaleString() }} messages
        </UBadge>
      </template>
    </PageHeader>

    <MessagesMessageHistogram
      :buckets="histogram.buckets"
      :connections="histogram.connections"
      :granularity="histogramView"
      :minute-mode="granularity === 'minute'"
      :selected-hour="selectedHour"
      :total="filteredMessages.length"
    />

    <UCard>
      <template #header>
        <div>
          <h3 class="font-semibold text-highlighted">
            Message Log
          </h3>
          <p class="text-sm text-muted mt-0.5">
            Individual messages matching the filters above — click a row for details
          </p>
        </div>
      </template>

      <MessagesMessageTable :messages="paginatedMessages" @select="openMessageDetail" />

      <template #footer>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-sm text-muted">
            Showing
            {{ filteredMessages.length ? (page - 1) * pageSize + 1 : 0 }}–{{
              Math.min(page * pageSize, filteredMessages.length)
            }}
            of {{ filteredMessages.length.toLocaleString() }}
          </p>
          <UPagination
            v-model:page="page"
            :total="filteredMessages.length"
            :items-per-page="pageSize"
            show-edges
          />
        </div>
      </template>
    </UCard>

    <USlideover
      v-model:open="detailOpen"
      title="Message details"
      description="Processed message metadata and connection context"
    >
      <template #body>
        <MessagesMessageDetail v-if="selectedMessage" :message="selectedMessage" />
      </template>
    </USlideover>
  </div>
  </LiveViewGate>
</template>
