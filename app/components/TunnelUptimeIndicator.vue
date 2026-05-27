<script setup lang="ts">
const { stats } = useUsageMetrics()

const uptimeStat = computed(() => stats.value.find(s => s.title === 'Tunnel Uptime'))

const uptimeScore = computed(() => {
  const stat = uptimeStat.value
  if (!stat || typeof stat.value !== 'string') return 72
  const match = stat.value.match(/([\d.]+)/)
  return match ? Math.round(parseFloat(match[1]!)) : 72
})

const uptimeVariation = computed(() => uptimeStat.value?.variation ?? 0)

const uptimeDisplay = computed(() => uptimeStat.value?.value ?? `${uptimeScore.value}%`)
</script>

<template>
  <NuxtLink
    to="/uptime"
    class="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-default bg-accented/60 px-2 py-1 sm:px-2.5 transition-colors hover:bg-accented hover:border-primary/30 shrink-0"
    title="Tunnel uptime — 30-day rolling average"
  >
    <div class="relative size-8 shrink-0" aria-hidden="true">
      <svg viewBox="0 0 120 70" class="size-full">
        <path
          d="M 10 60 A 50 50 0 0 1 110 60"
          fill="none"
          stroke="var(--ui-border)"
          stroke-width="10"
          stroke-linecap="round"
        />
        <path
          d="M 10 60 A 50 50 0 0 1 110 60"
          fill="none"
          stroke="var(--color-while-500)"
          stroke-width="10"
          stroke-linecap="round"
          :stroke-dasharray="`${uptimeScore * 1.57} 157`"
        />
      </svg>
      <span class="absolute inset-x-0 bottom-0 text-center text-[10px] font-semibold tabular-nums text-highlighted leading-none">
        {{ uptimeScore }}
      </span>
    </div>
    <div class="min-w-0">
      <p class="text-[10px] font-medium uppercase tracking-wide text-muted leading-none">
        Uptime
      </p>
      <p class="text-sm font-semibold tabular-nums text-highlighted leading-tight">
        {{ uptimeDisplay }}
      </p>
    </div>
  </NuxtLink>
</template>
