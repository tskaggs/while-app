<script setup lang="ts">
import type { EhrVendor } from '~/types/while'

const { connections } = useConnections()
const { environmentLabel } = useEnvironment()

const statusFilter = ref<string | undefined>()
const vendorFilter = ref<EhrVendor | undefined>()

const filtered = computed(() => {
  return connections.value.filter((c) => {
    if (statusFilter.value && c.tunnelStatus !== statusFilter.value) return false
    if (vendorFilter.value && c.ehrVendor !== vendorFilter.value) return false
    return true
  })
})

const statusOptions = [
  { label: 'All statuses', value: undefined },
  { label: 'Active', value: 'active' },
  { label: 'Pending', value: 'pending' },
  { label: 'Error', value: 'error' }
]

const vendorOptions = [
  { label: 'All EHR systems', value: undefined },
  { label: 'Epic', value: 'Epic' as EhrVendor },
  { label: 'Cerner', value: 'Cerner' as EhrVendor },
  { label: 'Meditech', value: 'Meditech' as EhrVendor },
  { label: 'Athena', value: 'Athena' as EhrVendor },
  { label: 'Other', value: 'Other' as EhrVendor }
]

useSeoMeta({ title: 'Connections' })
</script>

<template>
  <UDashboardPanel id="connections">
    <template #header>
      <UDashboardNavbar :ui="{ right: 'gap-3' }">
        <template #title>
          <NavTitle title="Connections" />
        </template>
        <template #right>
          <EnvironmentSwitcher />
          <UButton to="/support/new-connection" label="New Connection" icon="i-lucide-plus" size="sm" />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <USelectMenu
            v-model="statusFilter"
            :items="statusOptions"
            value-key="value"
            placeholder="Filter by status"
            class="w-44"
          />
          <USelectMenu
            v-model="vendorFilter"
            :items="vendorOptions"
            value-key="value"
            placeholder="Filter by EHR"
            class="w-44"
          />
          <UBadge color="neutral" variant="subtle">
            {{ filtered.length }} in {{ environmentLabel }}
          </UBadge>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <ConnectionsConnectionTable :connections="filtered" />
    </template>
  </UDashboardPanel>
</template>
