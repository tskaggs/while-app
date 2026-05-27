<script setup lang="ts">
useSeoMeta({ title: 'Overview' })
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Overview">
      <template #actions>
        <UButton
          to="/support"
          label="Support"
          icon="i-lucide-plus"
          size="sm"
        />
      </template>
    </PageHeader>

    <div class="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-5">
      <div class="flex min-h-80 flex-col lg:col-span-2 lg:min-h-0">
        <DashboardPerformanceAiSummary class="h-full min-h-0" />
      </div>
      <div class="flex min-h-80 flex-col lg:col-span-3 lg:min-h-0">
        <DashboardUsageChart class="h-full min-h-0" />
      </div>
    </div>

    <DashboardConnectionWatchlist />
  </div>
</template>
