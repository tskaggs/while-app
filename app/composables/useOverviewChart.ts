import { createSharedComposable } from '@vueuse/core'
import {
  computeUptimePercent,
  getConnectionBaseline,
  liveTunnelLogs,
  sandboxTunnelLogs
} from '~/data/uptime'
import type { UsageDataPoint } from '~/types/while'

const _useOverviewChart = () => {
  const config = useRuntimeConfig()
  const { environment } = useEnvironment()
  const { operationalConnections, isLive } = useConnections()
  const { tunnelLogs: liveTunnelData } = useTunnelUptime()

  const mockTunnelLogs = computed(() => {
    const base = environment.value === 'sandbox' ? sandboxTunnelLogs : liveTunnelLogs
    if (!isLive.value) return base
    const allowed = new Set(operationalConnections.value.map(c => c.id))
    return base.filter(log => allowed.has(log.connectionId))
  })

  const tunnelLogs = computed(() =>
    config.public.mockMode ? mockTunnelLogs.value : liveTunnelData.value
  )

  function enrichPoints(points: UsageDataPoint[]): UsageDataPoint[] {
    return points.map((point, index) => {
      const bucketStart = `${point.date}T00:00:00.000Z`
      const bucketEndMs = new Date(`${point.date}T23:59:59.999Z`).getTime()

      if (!operationalConnections.value.length) return point

      if (!config.public.mockMode && point.uptime > 0) {
        return point
      }

      let uptimeSum = 0
      operationalConnections.value.forEach((connection, seed) => {
        const baseline = getConnectionBaseline(connection.tunnelStatus, seed + index)
        uptimeSum += tunnelLogs.value.length
          ? computeUptimePercent(
              tunnelLogs.value,
              connection.id,
              bucketStart,
              bucketEndMs,
              baseline
            )
          : baseline
      })

      const computedUptime = Math.round((uptimeSum / operationalConnections.value.length) * 10) / 10

      return {
        ...point,
        uptime: computedUptime
      }
    })
  }

  return { enrichPoints }
}

export const useOverviewChart = createSharedComposable(_useOverviewChart)
