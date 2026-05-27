<script setup lang="ts">
useSeoMeta({ title: 'Compliance' })
</script>

<template>
  <UDashboardPanel id="compliance">
    <template #header>
      <UDashboardNavbar :ui="{ right: 'gap-3' }">
        <template #title>
          <NavTitle title="Compliance" />
        </template>
        <template #right>
          <EnvironmentSwitcher />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <p class="text-sm text-muted">
            Real-time compliance status, BAA management, and immutable audit logs.
          </p>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <ComplianceCompliancePanel />
    </template>
  </UDashboardPanel>
</template>
