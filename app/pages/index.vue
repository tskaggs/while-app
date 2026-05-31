<script setup lang="ts">
useSeoMeta({ title: 'Connections' })
</script>

<template>
  <LiveViewGate>
  <div class="space-y-6">
    <PageHeader title="Connections">
      <template #actions>
        <UButton
          to="/support?compose=connection"
          label="Connection"
          icon="i-iconoir-plus"
          size="sm"
        />
      </template>
    </PageHeader>

    <DashboardConnectionWatchlist />
  </div>
  </LiveViewGate>
</template>
