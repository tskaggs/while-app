import { createSharedComposable } from '@vueuse/core'
import {
  attachConnectionBreakdown,
  sandboxUsageStats,
  liveUsageStats,
  sandboxUsageChart,
  liveUsageChart
} from '~/data/usage'
import type { UsageDataPoint, UsageStat } from '~/types/while'

const _useUsageMetrics = () => {
  const config = useRuntimeConfig()
  const { environment } = useEnvironment()
  const { operationalConnections } = useConnections()

  const { data: telemetryData, refresh: refreshMetrics } = useFetch<{
    stats: UsageStat[]
    chartData: UsageDataPoint[]
  }>(
    '/api/telemetry/metrics',
    {
      immediate: !config.public.mockMode,
      query: computed(() => ({ environment: environment.value })),
      watch: [environment]
    }
  )

  const stats = computed(() => {
    if (config.public.mockMode) {
      return environment.value === 'sandbox' ? sandboxUsageStats : liveUsageStats
    }
    return telemetryData.value?.stats ?? []
  })

  const chartData = computed(() => {
    if (config.public.mockMode) {
      const base = environment.value === 'sandbox' ? sandboxUsageChart : liveUsageChart
      return attachConnectionBreakdown(base, operationalConnections.value)
    }
    const base = telemetryData.value?.chartData ?? []
    return attachConnectionBreakdown(base, operationalConnections.value)
  })

  return { stats, chartData, refreshMetrics }
}

export const useUsageMetrics = createSharedComposable(_useUsageMetrics)
