<script setup lang="ts">
const { stats } = useUsageMetrics()
</script>

<template>
  <UPageGrid class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px">
    <UPageCard
      v-for="(stat, index) in stats"
      :key="index"
      :to="stat.to ?? '/connections'"
      variant="subtle"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
    >
      <div class="min-w-0">
        <div class="inline-block w-11 align-top">
          <div class="inline-flex items-center justify-center rounded-full bg-primary/10 p-2.5 ring ring-inset ring-primary/25">
            <UIcon :name="stat.icon" class="size-5 shrink-0 text-primary" />
          </div>
        </div>
        <div class="inline-block w-[calc(100%-3.5rem)] min-w-0 align-top pl-3">
          <p class="text-xs font-normal uppercase text-muted">
            {{ stat.title }}
          </p>
          <div class="mt-1.5 flex items-center gap-2">
            <span class="text-2xl font-semibold text-highlighted">
              {{ stat.value }}
            </span>
            <UBadge
              :color="stat.variation >= 0 ? 'success' : 'error'"
              variant="subtle"
              class="text-xs"
            >
              {{ stat.variation >= 0 ? '+' : '' }}{{ stat.variation }}%
            </UBadge>
          </div>
          <p v-if="stat.description" class="mt-1.5 text-xs text-muted">
            {{ stat.description }}
          </p>
        </div>
      </div>
    </UPageCard>
  </UPageGrid>
</template>
