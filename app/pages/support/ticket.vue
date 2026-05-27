<script setup lang="ts">
useSeoMeta({ title: 'Support Ticket' })
</script>

<template>
  <UDashboardPanel id="support-ticket">
    <template #header>
      <UDashboardNavbar :ui="{ right: 'gap-3' }">
        <template #title>
          <NavTitle title="Support Ticket" />
        </template>
        <template #right>
          <EnvironmentSwitcher />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <p class="text-sm text-muted">
            Send a request for general help, billing questions, or connection-specific support.
          </p>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <SupportTicketForm />
    </template>
  </UDashboardPanel>
</template>
