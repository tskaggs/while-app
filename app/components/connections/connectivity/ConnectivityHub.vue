<script setup lang="ts">
import type { Connection } from '~/types/while'

export type ConnectivitySection = 'vpn' | 'ehr' | 'credential' | 'tests'

defineProps<{
  connection: Connection
}>()

const route = useRoute()
const router = useRouter()

const sections = [
  { id: 'vpn' as const, label: 'VPN', icon: 'i-iconoir-shield-check' },
  { id: 'ehr' as const, label: 'EHR', icon: 'i-iconoir-hospital' },
  { id: 'credential' as const, label: 'Credential', icon: 'i-iconoir-key' },
  { id: 'tests' as const, label: 'Tests', icon: 'i-iconoir-flask' }
]

function parseSection(raw: unknown): ConnectivitySection {
  if (raw === 'vpn' || raw === 'ehr' || raw === 'credential' || raw === 'tests') return raw
  return 'vpn'
}

const activeSection = computed(() => parseSection(route.query.section))

function setSection(section: ConnectivitySection) {
  router.replace({ query: { ...route.query, section } })
}

watch(
  () => route.query.section,
  (section) => {
    if (section && !['vpn', 'ehr', 'credential', 'tests'].includes(String(section))) {
      setSection('vpn')
    }
  },
  { immediate: true }
)
</script>

<template>
  <UCard
    class="while-card overflow-hidden"
    :ui="{ body: 'p-0!' }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/5">
          <UIcon name="i-iconoir-network-right" class="size-5 text-primary" />
        </div>
        <div>
          <h2 class="font-semibold text-highlighted">
            Connectivity
          </h2>
          <p class="mt-0.5 text-sm text-muted">
            VPN tunnel, EHR endpoints, credentials, and integration tests for
            {{ connection.partnerName }}.
          </p>
        </div>
      </div>
    </template>

    <div class="flex flex-col lg:flex-row">
      <nav
        class="while-card-muted flex shrink-0 gap-1 overflow-x-auto border-b border-default p-3 lg:w-48 lg:flex-col lg:rounded-none lg:border-b-0 lg:border-r lg:ring-0"
        aria-label="Connectivity sections"
      >
        <UButton
          v-for="section in sections"
          :key="section.id"
          :icon="section.icon"
          :label="section.label"
          :color="activeSection === section.id ? 'primary' : 'neutral'"
          :variant="activeSection === section.id ? 'soft' : 'ghost'"
          class="justify-start shrink-0"
          @click="setSection(section.id)"
        />
      </nav>

      <div class="min-w-0 flex-1 p-4 lg:p-5">
        <ConnectionsConnectivityVpnSection
          v-if="activeSection === 'vpn'"
          :connection="connection"
        />
        <ConnectionsConnectivityEhrSection
          v-else-if="activeSection === 'ehr'"
          :connection="connection"
        />
        <ConnectionsConnectivityCredentialsSection
          v-else-if="activeSection === 'credential'"
          :connection="connection"
        />
        <ConnectionsConnectivityTestsSection
          v-else-if="activeSection === 'tests'"
          :connection="connection"
        />
      </div>
    </div>
  </UCard>
</template>
