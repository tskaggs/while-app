<script setup lang="ts">
useSeoMeta({ title: 'Logs' })
</script>

<template>
  <UDashboardPanel id="logs">
    <template #header>
      <UDashboardNavbar :ui="{ right: 'gap-3' }">
        <template #title>
          <NavTitle title="Integration Logs" />
        </template>
        <template #right>
          <EnvironmentSwitcher />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <p class="text-sm text-muted">
            Clean room log viewer — search, filter, and toggle PHI anonymization below.
          </p>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <LogsLogStream />
    </template>
  </UDashboardPanel>
</template>
