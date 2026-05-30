<script setup lang="ts">
interface ActiveKey {
  id: string
  keyPrefix: string
  environment: string
  createdAt: string
}

interface HistoryEvent {
  id: string
  type: 'created' | 'revoked'
  keyPrefix: string
  environment: string
  occurredAt: string
  isActive: boolean
}

const props = defineProps<{
  connectionId: string
  partnerName: string
  isSystemSandbox: boolean
  canRotate: boolean
  activeKey: ActiveKey | null
  history: HistoryEvent[]
  rotatedKey?: string | null
  rotating?: boolean
  mockMode?: boolean
  sandboxCredentialsLink?: string | null
}>()

const emit = defineEmits<{
  rotate: []
}>()

const toast = useToast()
const rotateConfirmOpen = ref(false)

const historyRows = computed(() =>
  props.history.map(event => ({
    ...event,
    occurredAt: new Date(event.occurredAt).toLocaleString(),
    typeLabel: event.type === 'created' ? 'Key created' : 'Key stopped',
    typeColor: (event.type === 'created' ? 'success' : 'neutral') as 'success' | 'neutral',
    keyLabel: `${event.keyPrefix}••••••••••••`
  }))
)

async function copyRotatedKey() {
  if (!props.rotatedKey) return

  try {
    await navigator.clipboard.writeText(props.rotatedKey)
    toast.add({ title: 'Sandbox API key copied', color: 'success' })
  } catch {
    toast.add({ title: 'Copy failed', color: 'error' })
  }
}

function confirmRotate() {
  rotateConfirmOpen.value = false
  emit('rotate')
}
</script>

<template>
  <div class="space-y-6">
    <UCard class="rounded-xl border border-default bg-elevated">
      <p class="text-sm text-muted">
        Sandbox credentials for
        <span class="font-medium text-highlighted">{{ partnerName }}</span>
        ·
        <span class="font-mono text-xs">{{ connectionId }}</span>
      </p>
      <p class="text-sm text-muted mt-2">
        API keys are organization-scoped. Rotating a key stops the previous
        <code class="font-mono text-xs">wh_test_*</code>
        token immediately.
      </p>
    </UCard>

    <UCard
      v-if="!isSystemSandbox"
      class="rounded-xl border border-default bg-elevated"
    >
      <template #header>
        <h3 class="font-semibold text-highlighted">
          Partner connection
        </h3>
      </template>
      <p class="text-sm text-muted">
        Sandbox API keys are managed on the
        <strong class="text-highlighted">While Sandbox</strong>
        system connection. This clinic connection uses Sidecar credentials separately in production.
      </p>
      <UButton
        v-if="sandboxCredentialsLink"
        :to="sandboxCredentialsLink"
        class="mt-4"
        variant="outline"
        icon="i-iconoir-arrow-right"
      >
        Open While Sandbox credentials
      </UButton>
    </UCard>

    <UCard class="rounded-xl border border-default bg-elevated">
      <template #header>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 class="font-semibold text-highlighted">
              Active sandbox API key
            </h3>
            <p class="text-sm text-muted mt-1">
              Plaintext is shown once after creation or rotation. Store it in a secrets manager.
            </p>
          </div>
          <UButton
            v-if="canRotate"
            color="warning"
            variant="outline"
            icon="i-iconoir-refresh-double"
            :loading="rotating"
            @click="rotateConfirmOpen = true"
          >
            {{ activeKey ? 'Rotate key' : 'Create key' }}
          </UButton>
        </div>
      </template>

      <div v-if="rotatedKey" class="mb-4 space-y-3">
        <UAlert
          color="warning"
          variant="subtle"
          title="New sandbox API key"
          description="Copy this key now. It will not be shown again after you leave this page."
        />
        <div class="flex items-center gap-2">
          <UInput
            :model-value="rotatedKey"
            readonly
            class="flex-1 font-mono text-sm"
          />
          <UButton
            icon="i-iconoir-copy"
            color="neutral"
            variant="ghost"
            aria-label="Copy sandbox API key"
            @click="copyRotatedKey"
          />
        </div>
      </div>

      <div v-if="activeKey" class="rounded-lg border border-default p-4 space-y-3">
        <div class="flex flex-wrap items-center gap-2">
          <code class="font-mono text-sm text-highlighted">{{ activeKey.keyPrefix }}••••••••••••</code>
          <UBadge color="success" variant="subtle">
            Active
          </UBadge>
        </div>
        <p class="text-sm text-muted">
          Created {{ new Date(activeKey.createdAt).toLocaleString() }}
        </p>
      </div>
      <UAlert
        v-else
        color="warning"
        variant="subtle"
        title="No active sandbox key"
        description="Rotate to issue a new sandbox API key for this organization."
      />
    </UCard>

    <UCard class="rounded-xl border border-default bg-elevated">
      <template #header>
        <h3 class="font-semibold text-highlighted">
          Key history
        </h3>
        <p class="text-sm text-muted mt-1">
          Log of sandbox key creation and when previous keys were stopped.
        </p>
      </template>

      <div v-if="historyRows.length" class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-default text-left text-muted">
              <th class="py-2 pr-4 font-medium">
                When
              </th>
              <th class="py-2 pr-4 font-medium">
                Event
              </th>
              <th class="py-2 font-medium">
                Key
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in historyRows"
              :key="row.id"
              class="border-b border-default/60 last:border-0"
            >
              <td class="py-3 pr-4 text-highlighted whitespace-nowrap">
                {{ row.occurredAt }}
              </td>
              <td class="py-3 pr-4">
                <UBadge :color="row.typeColor" variant="subtle">
                  {{ row.typeLabel }}
                </UBadge>
              </td>
              <td class="py-3 font-mono text-xs text-muted">
                {{ row.keyLabel }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="text-sm text-muted">
        No key history yet.
      </p>
    </UCard>

    <UModal v-model:open="rotateConfirmOpen" title="Rotate sandbox API key">
      <template #body>
        <p class="text-sm text-muted">
          This will stop the current
          <code class="font-mono text-xs">wh_test_*</code>
          key immediately. Update any apps, scripts, and the Test view session field with the new key.
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" @click="rotateConfirmOpen = false">
            Cancel
          </UButton>
          <UButton color="warning" :loading="rotating" @click="confirmRotate">
            Rotate key
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
