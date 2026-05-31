<script setup lang="ts">
import type { SupportInboxKind, SupportRequestStatus, WhileEnvironment } from '~/types/while'

const route = useRoute()
const router = useRouter()
const { filterInbox, getInboxItem } = useSupportRequests()

useSeoMeta({ title: 'Support' })

const search = ref('')
const statusFilter = ref<SupportRequestStatus | undefined>()
const kindFilter = ref<SupportInboxKind | undefined>()
const environmentFilter = ref<WhileEnvironment | undefined>()

const statusOptions = [
  { label: 'All statuses', value: undefined },
  { label: 'Submitted', value: 'submitted' as SupportRequestStatus },
  { label: 'In review', value: 'in_review' as SupportRequestStatus },
  { label: 'In progress', value: 'in_progress' as SupportRequestStatus },
  { label: 'Completed', value: 'completed' as SupportRequestStatus }
]

const kindOptions = [
  { label: 'All types', value: undefined },
  { label: 'Onboarding', value: 'connection' as SupportInboxKind },
  { label: 'Tickets', value: 'ticket' as SupportInboxKind }
]

const environmentOptions = [
  { label: 'All environments', value: undefined },
  { label: 'Sandbox', value: 'sandbox' as WhileEnvironment },
  { label: 'Live', value: 'live' as WhileEnvironment }
]

const filteredItems = computed(() =>
  filterInbox({
    search: search.value,
    status: statusFilter.value,
    kind: kindFilter.value,
    environment: environmentFilter.value
  })
)

const selectedKey = computed(() => {
  const key = route.query.selected as string | undefined
  if (key && getInboxItem(key)) return key
  return undefined
})

const composeMode = computed(() => {
  const mode = route.query.compose as string | undefined
  if (mode === 'ticket' || mode === 'connection') return mode
  return undefined
})

const selectedItem = computed(() =>
  selectedKey.value ? getInboxItem(selectedKey.value) : undefined
)

watch(filteredItems, (items) => {
  if (selectedKey.value && !items.some(i => i.key === selectedKey.value)) {
    clearSelection()
  }
})

function selectItem(key: string) {
  router.replace({ path: '/support', query: { selected: key } })
}

function clearSelection() {
  router.replace({ path: '/support', query: {} })
}

function openCompose(mode: 'ticket' | 'connection') {
  router.replace({ path: '/support', query: { compose: mode } })
}

function onSubmitted(key: string) {
  router.replace({ path: '/support', query: { selected: key } })
}

const newRequestItems = [
  [{
    label: 'Support ticket',
    icon: 'i-iconoir-headset',
    onSelect: () => openCompose('ticket')
  }, {
    label: 'New connection',
    icon: 'i-iconoir-network',
    onSelect: () => openCompose('connection')
  }]
]
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Support"
      description="Track onboarding and tickets — search, filter, and open new requests from one place."
    >
      <template #actions>
        <UDropdownMenu :items="newRequestItems">
          <UButton
            label="New request"
            icon="i-iconoir-plus"
            size="sm"
          />
        </UDropdownMenu>
      </template>
      <template #filters>
        <UInput
          v-model="search"
          icon="i-iconoir-search"
          placeholder="Search requests..."
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
          v-model="kindFilter"
          :items="kindOptions"
          value-key="value"
          placeholder="Type"
          class="w-full sm:w-36"
        />
        <USelectMenu
          v-model="environmentFilter"
          :items="environmentOptions"
          value-key="value"
          placeholder="Environment"
          class="w-full sm:w-40"
        />
        <UBadge color="neutral" variant="subtle">
          {{ filteredItems.length }} request{{ filteredItems.length === 1 ? '' : 's' }}
        </UBadge>
      </template>
    </PageHeader>

    <div class="while-card flex min-h-[32rem] flex-col overflow-hidden lg:flex-row">
      <aside class="flex w-full flex-col border-b border-default lg:w-96 lg:shrink-0 lg:border-b-0 lg:border-r">
        <SupportInboxList
          :items="filteredItems"
          :selected-key="selectedKey"
          @select="selectItem"
        />
      </aside>

      <main class="flex min-h-80 flex-1 flex-col lg:min-h-0">
        <SupportItemDetail
          v-if="selectedItem"
          :item="selectedItem"
        />

        <div
          v-else-if="composeMode"
          class="flex h-full min-h-0 flex-col"
        >
          <div class="shrink-0 flex items-center justify-between border-b border-default px-6 py-4">
            <div>
              <h2 class="text-lg font-semibold text-highlighted">
                {{ composeMode === 'ticket' ? 'New support ticket' : 'New connection request' }}
              </h2>
              <p class="text-sm text-muted mt-0.5">
                {{ composeMode === 'ticket'
                  ? 'Billing, connection issues, or general questions'
                  : 'Onboard a healthcare partner with tunnel and mapping setup' }}
              </p>
            </div>
            <UButton
              icon="i-iconoir-xmark"
              color="neutral"
              variant="ghost"
              size="sm"
              square
              aria-label="Close"
              @click="clearSelection"
            />
          </div>
          <div class="flex-1 min-h-0 overflow-y-auto p-6">
            <SupportTicketForm
              v-if="composeMode === 'ticket'"
              embedded
              @submitted="onSubmitted"
            />
            <SupportRequestForm
              v-else
              embedded
              @submitted="onSubmitted"
            />
          </div>
        </div>

        <div
          v-else
          class="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center"
        >
          <UIcon name="i-iconoir-mail-in" class="size-12 text-dimmed" />
          <div>
            <p class="font-medium text-highlighted">
              Select a request
            </p>
            <p class="mt-1 max-w-sm text-sm text-muted">
              Choose an item from the inbox to view details, or create a new support ticket or connection request.
            </p>
          </div>
          <div class="flex flex-wrap justify-center gap-2">
            <UButton
              label="New ticket"
              icon="i-iconoir-headset"
              color="neutral"
              variant="outline"
              size="sm"
              @click="openCompose('ticket')"
            />
            <UButton
              label="New connection"
              icon="i-iconoir-network"
              size="sm"
              @click="openCompose('connection')"
            />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
