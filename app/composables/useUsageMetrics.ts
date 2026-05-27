import { createSharedComposable } from '@vueuse/core'
import { sandboxUsageStats, liveUsageStats, sandboxUsageChart, liveUsageChart } from '~/data/usage'

const _useUsageMetrics = () => {
  const { environment } = useEnvironment()

  const stats = computed(() =>
    environment.value === 'sandbox' ? sandboxUsageStats : liveUsageStats
  )

  const chartData = computed(() =>
    environment.value === 'sandbox' ? sandboxUsageChart : liveUsageChart
  )

  return { stats, chartData }
}

export const useUsageMetrics = createSharedComposable(_useUsageMetrics)
