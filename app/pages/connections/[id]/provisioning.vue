<script setup lang="ts">
import type { FlightCheck } from '~/types/while'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const connectionId = computed(() => String(route.params.id))
const isOnboarding = computed(() => route.query.onboarding === '1')

const { getConnection, refreshConnections } = useConnections()

const stage = ref('queued')
const progressPercent = ref(0)
const flightCheck = ref<FlightCheck>({ mtu: false, handshake: false, hl7Ack: false })
const provisioningStatus = ref('provisioning')
const showOverview = ref(false)

const connection = computed(() => getConnection(connectionId.value))

async function loadProvisioningState() {
  try {
    const data = await $fetch<{
      connection: { provisioningStatus: string, tunnelStatus: string }
      jobs: Array<{ stage: string, progressPercent: number, status: string }>
      flightCheck: FlightCheck
    }>(`/api/connections/${connectionId.value}/provisioning`)

    provisioningStatus.value = data.connection.provisioningStatus
    flightCheck.value = data.flightCheck
    const activeJob = data.jobs.find(j => j.status === 'running' || j.status === 'queued')
      ?? data.jobs[data.jobs.length - 1]
    if (activeJob) {
      stage.value = activeJob.stage
      progressPercent.value = activeJob.progressPercent
    }
    if (['active', 'pending_customer'].includes(data.connection.provisioningStatus)) {
      stage.value = 'completed'
      progressPercent.value = 100
    }
    await refreshConnections()
  } catch {
    // polling will retry
  }
}

function connectStream() {
  if (import.meta.server) return

  const es = new EventSource(`/api/provisioning/stream?connectionId=${encodeURIComponent(connectionId.value)}`)

  es.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data)
      if (payload.type === 'provisioning') {
        stage.value = payload.stage
        progressPercent.value = payload.progressPercent ?? progressPercent.value
        if (payload.provisioningStatus) {
          provisioningStatus.value = payload.provisioningStatus
        }
        if (payload.stage === 'completed') {
          progressPercent.value = 100
          loadProvisioningState()
        }
      }
    } catch {
      // ignore malformed events
    }
  }

  onUnmounted(() => es.close())
}

onMounted(() => {
  loadProvisioningState()
  connectStream()
  const poll = setInterval(loadProvisioningState, 4000)
  onUnmounted(() => clearInterval(poll))
})

function onProvisioningComplete() {
  showOverview.value = true
  setTimeout(async () => {
    if (isOnboarding.value) {
      await navigateTo({ path: '/onboarding', query: { step: '2' } })
    } else {
      await router.push(`/connections/${connectionId.value}`)
    }
  }, 1500)
}

watch(provisioningStatus, (status) => {
  if (['active', 'pending_customer'].includes(status) && stage.value === 'completed') {
    onProvisioningComplete()
  }
})
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <Transition name="fade" mode="out-in">
      <div v-if="connection && !showOverview" key="canvas">
        <ConnectionsProvisioningCanvas
          :connection="{ ...connection, flightCheck, provisioningStatus: provisioningStatus as typeof connection.provisioningStatus }"
          :stage="stage"
          :progress-percent="progressPercent"
          interactive
          @complete="onProvisioningComplete"
        />
      </div>
      <div v-else-if="showOverview && connection" key="overview" class="text-center py-16">
        <UIcon name="i-lucide-check-circle" class="size-16 text-success mx-auto mb-4" />
        <h2 class="text-xl font-semibold">Opening connection overview…</h2>
      </div>
      <div v-else key="loading" class="py-16 text-center text-muted">
        Loading connection…
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.6s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
