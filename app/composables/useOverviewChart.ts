import { createSharedComposable } from '@vueuse/core'
import {
  computeUptimePercent,
  getConnectionBaseline,
  liveTunnelLogs,
  sandboxTunnelLogs
} from '~/data/uptime'
import type { UsageDataPoint } from '~/types/while'

const _useOverviewChart = () => {
  const { environment } = useEnvironment()
  const { connections } = useConnections()

  const tunnelLogs = computed(() =>
    environment.value === 'sandbox' ? sandboxTunnelLogs : liveTunnelLogs
  )

  function enrichPoints(points: UsageDataPoint[]): UsageDataPoint[] {
    return points.map((point, index) => {
      const bucketStart = `${point.date}T00:00:00.000Z`
      const bucketEndMs = new Date(`${point.date}T23:59:59.999Z`).getTime()

      if (!connections.value.length) return point

      let uptimeSum = 0
      connections.value.forEach((connection, seed) => {
        const baseline = getConnectionBaseline(connection.tunnelStatus, seed + index)
        uptimeSum += computeUptimePercent(
          tunnelLogs.value,
          connection.id,
          bucketStart,
          bucketEndMs,
          baseline
        )
      })

      const computedUptime = Math.round((uptimeSum / connections.value.length) * 10) / 10

      return {
        ...point,
        uptime: computedUptime
      }
    })
  }

  return { enrichPoints }
}

export const useOverviewChart = createSharedComposable(_useOverviewChart)
