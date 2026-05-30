<script setup lang="ts">
import type {
  MessageDirection,
  MessageFormat,
  MessageGranularity,
  MessageStatus
} from '~/types/while'

const config = useRuntimeConfig()
const { connection, useConnectionPageMeta, isSystemSandbox } = useConnectionDetail()
const { environment, isSandbox } = useEnvironment()
const { filterMessages, buildHistogram, refreshMessages, setConnectionScope } = useMessages()

useConnectionPageMeta('Messages')

const selectedDate = ref(new Date().toISOString().slice(0, 10))
const granularity = ref<MessageGranularity>('hour')
const selectedHour = ref<number | undefined>(undefined)
const directionFilter = ref<MessageDirection | undefined>()
const formatFilter = ref<MessageFormat | undefined>()
const statusFilter = ref<MessageStatus | undefined>()
const search = ref('')
const page = ref(1)
const pageSize = 20
const detailOpen = ref(false)
const refreshing = ref(false)
const selectedMessage = ref<ReturnType<typeof filterMessages>[number] | null>(null)

const sharedFilters = computed(() => ({
  date: selectedDate.value,
  hour: granularity.value === 'minute' ? selectedHour.value : undefined,
  connectionId: connection.value?.id,
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

const showEmptyHint = computed(() =>
  !config.public.mockMode
  && filteredMessages.value.length === 0
  && connection.value
  && isSystemSandbox(connection.value)
)

const hourOptions = computed(() => [
  { label: 'Full day', value: undefined },
  ...Array.from({ length: 24 }, (_, hour) => ({
    label: `${String(hour).padStart(2, '0')}:00 UTC`,
    value: hour
  }))
])

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

watch([selectedDate, granularity, selectedHour, directionFilter, formatFilter, statusFilter, search], () => {
  page.value = 1
})

watch(() => connection.value?.id, (id) => {
  setConnectionScope(id)
}, { immediate: true })

async function reloadMessages() {
  refreshing.value = true
  try {
    selectedDate.value = new Date().toISOString().slice(0, 10)
    await refreshMessages()
  } finally {
    refreshing.value = false
  }
}

onMounted(() => {
  selectedDate.value = new Date().toISOString().slice(0, 10)
  void reloadMessages()
})

onUnmounted(() => {
  setConnectionScope(undefined)
})

function openMessageDetail(message: ReturnType<typeof filterMessages>[number]) {
  selectedMessage.value = message
  detailOpen.value = true
}
</script>

<template>
  <div v-if="connection" class="space-y-6">
    <UAlert
      v-if="showEmptyHint"
      color="info"
      variant="subtle"
      title="No messages match your filters"
    >
      <template #description>
        <ul class="list-disc list-inside space-y-1 text-sm">
          <li>
            Confirm the environment toggle is set to
            <strong class="text-highlighted">Sandbox</strong>
            (currently {{ environment }}).
          </li>
          <li>
            Date filter uses <strong class="text-highlighted">UTC</strong>
            — today is {{ selectedDate }}.
          </li>
          <li>
            Send a clinical webhook from
            <NuxtLink :to="`/connections/${connection.id}/test`" class="text-primary hover:underline">
              Test
            </NuxtLink>
            with your webhook URL pointing at while-app's
            <code class="font-mono text-xs">/api/webhooks/while</code>
            receiver.
          </li>
        </ul>
      </template>
    </UAlert>

    <UCard class="rounded-xl border border-default bg-elevated">
      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end p-1">
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
          class="w-full sm:flex-1 sm:min-w-48"
        />
        <UButton
          icon="i-iconoir-refresh-double"
          variant="outline"
          :loading="refreshing"
          class="shrink-0"
          @click="reloadMessages"
        >
          Refresh
        </UButton>
        <UBadge color="neutral" variant="subtle" class="shrink-0">
          {{ filteredMessages.length.toLocaleString() }} messages
        </UBadge>
      </div>
      <p v-if="!isSandbox" class="text-xs text-muted mt-2 px-1">
        Sandbox webhook events only appear when the environment toggle is set to Sandbox.
      </p>
    </UCard>

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
            Message log
          </h3>
          <p class="text-sm text-muted mt-0.5">
            Processed messages for {{ connection.partnerName }} — click a row for details
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
      description="Processed message metadata for this connection"
    >
      <template #body>
        <MessagesMessageDetail v-if="selectedMessage" :message="selectedMessage" />
      </template>
    </USlideover>
  </div>
</template>
