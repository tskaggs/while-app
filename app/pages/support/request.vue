<script setup lang="ts">
useSeoMeta({ title: 'Request Support' })
</script>

<template>
  <UDashboardPanel id="support-request">
    <template #header>
      <UDashboardNavbar :ui="{ right: 'gap-3' }">
        <template #title>
          <NavTitle title="Request Support" />
        </template>
        <template #right>
          <EnvironmentSwitcher />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <p class="text-sm text-muted">
            Choose how we can help — open a support ticket or start a new connection onboarding request.
          </p>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <SupportTypeSelector />
    </template>
  </UDashboardPanel>
</template>
