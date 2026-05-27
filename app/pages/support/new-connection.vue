<script setup lang="ts">
useSeoMeta({ title: 'New Connection' })
</script>

<template>
  <UDashboardPanel id="support-new-connection">
    <template #header>
      <UDashboardNavbar :ui="{ right: 'gap-3' }">
        <template #title>
          <NavTitle title="New Connection" />
        </template>
        <template #right>
          <EnvironmentSwitcher />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <p class="text-sm text-muted">
            Fast-track your healthcare partner onboarding — our team handles WireGuard setup, EHR mapping, and compliance review.
          </p>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <SupportRequestForm />
    </template>
  </UDashboardPanel>
</template>
