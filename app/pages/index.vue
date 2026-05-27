<script setup lang="ts">
const { isLive } = useEnvironment()

useSeoMeta({ title: 'Overview' })
</script>

<template>
  <UDashboardPanel
    id="overview"
    :class="isLive ? 'ring-1 ring-success/20 rounded-lg' : undefined"
  >
    <template #header>
      <UDashboardNavbar :ui="{ right: 'gap-3' }">
        <template #title>
          <NavTitle title="Overview" />
        </template>
        <template #right>
          <EnvironmentSwitcher />
          <UButton
            to="/support/request"
            label="Request Support"
            icon="i-lucide-plus"
            size="sm"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <DashboardUsageStats />
        <DashboardUsageChart />
        <DashboardRecentActivity />
      </div>
    </template>
  </UDashboardPanel>
</template>
