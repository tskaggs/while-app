<script setup lang="ts">
import type { Connection, FlightCheck } from '~/types/while'

const props = defineProps<{
  connection: Connection
  stage?: string
  progressPercent?: number
  interactive?: boolean
}>()

const emit = defineEmits<{
  complete: []
}>()

const displayStage = ref(props.stage ?? 'queued')
const displayProgress = ref(props.progressPercent ?? 0)
const displayFlightCheck = ref<FlightCheck>(props.connection.flightCheck)

watch(() => props.stage, (v) => { if (v) displayStage.value = v })
watch(() => props.progressPercent, (v) => { if (v !== undefined) displayProgress.value = v })
watch(() => props.connection.flightCheck, (v) => { displayFlightCheck.value = v }, { deep: true })

const stages = [
  { key: 'vm_create', label: 'Sidecar VM', icon: 'i-lucide-server' },
  { key: 'wireguard', label: 'WireGuard tunnel', icon: 'i-lucide-shield' },
  { key: 'sidecar_boot', label: 'Sidecar boot', icon: 'i-lucide-cpu' },
  { key: 'health_check', label: 'Flight Check', icon: 'i-lucide-plane-takeoff' }
]

function stageIndex(key: string) {
  const order = ['queued', 'vm_create', 'wireguard', 'sidecar_boot', 'health_check', 'completed']
  return order.indexOf(key)
}

const currentIndex = computed(() => stageIndex(displayStage.value))

const isComplete = computed(() =>
  displayStage.value === 'completed'
  || props.connection.provisioningStatus === 'active'
)

watch(isComplete, (done) => {
  if (done && props.interactive) {
    setTimeout(() => emit('complete'), 1200)
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-highlighted">
          {{ isComplete ? 'Your sandbox is ready' : 'Building your isolated sandbox' }}
        </h2>
        <p class="text-sm text-muted mt-1">
          {{ connection.partnerName }} · {{ connection.sidecarId }}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <UProgress :model-value="displayProgress" class="w-32" />
        <span class="text-sm tabular-nums text-muted">{{ displayProgress }}%</span>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-4">
      <div
        v-for="(stage, index) in stages"
        :key="stage.key"
        class="rounded-xl border p-4 transition-all duration-500"
        :class="[
          currentIndex > stageIndex(stage.key)
            ? 'border-success/40 bg-success/5'
            : currentIndex === stageIndex(stage.key)
              ? 'border-primary/50 bg-primary/5 scale-[1.02] shadow-sm'
              : 'border-default bg-elevated/50 opacity-60'
        ]"
      >
        <div class="flex items-center gap-2 mb-2">
          <UIcon
            :name="stage.icon"
            class="size-5"
            :class="currentIndex >= stageIndex(stage.key) ? 'text-primary' : 'text-muted'"
          />
          <span class="text-sm font-medium">{{ stage.label }}</span>
        </div>
        <p class="text-xs text-muted">
          <template v-if="currentIndex > stageIndex(stage.key)">Complete</template>
          <template v-else-if="currentIndex === stageIndex(stage.key)">In progress…</template>
          <template v-else>Waiting</template>
        </p>
      </div>
    </div>

    <ConnectionsTopologyMap :connection="{ ...connection, flightCheck: displayFlightCheck }" />

    <ConnectionsFlightCheckList :flight-check="displayFlightCheck" :in-progress="!isComplete" />

    <UAlert
      v-if="isComplete"
      color="success"
      variant="subtle"
      title="Flight Check passed"
      description="Your dedicated VM is isolated and ready for integration work."
      icon="i-lucide-check-circle"
    />
  </div>
</template>
