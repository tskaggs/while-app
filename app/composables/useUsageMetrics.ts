import { createSharedComposable } from '@vueuse/core'
import {
  attachConnectionBreakdown,
  sandboxUsageStats,
  liveUsageStats,
  sandboxUsageChart,
  liveUsageChart
} from '~/data/usage'

const _useUsageMetrics = () => {
  const { environment } = useEnvironment()
  const { connections } = useConnections()

  const stats = computed(() =>
    environment.value === 'sandbox' ? sandboxUsageStats : liveUsageStats
  )

  const chartData = computed(() => {
    const base = environment.value === 'sandbox' ? sandboxUsageChart : liveUsageChart
    return attachConnectionBreakdown(base, connections.value)
  })

  return { stats, chartData }
}

export const useUsageMetrics = createSharedComposable(_useUsageMetrics)
