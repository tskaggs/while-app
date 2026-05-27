import { createSharedComposable } from '@vueuse/core'
import {
  computeUptimePercent,
  getConnectionBaseline,
  liveIncidentMessages,
  liveIncidents,
  liveTunnelLogs,
  sandboxIncidentMessages,
  sandboxIncidents,
  sandboxTunnelLogs
} from '~/data/uptime'
import { getChartColor } from '~/utils/unovis'
import type {
  IncidentReport,
  LogSeverity,
  TunnelEventType,
  TunnelLogEntry,
  TunnelUptimeBucket,
  TunnelUptimeGranularity
} from '~/types/while'

export interface TunnelLogFilters {
  date?: string
  hour?: number
  connectionId?: string
  severity?: LogSeverity
  eventType?: TunnelEventType
  search?: string
}

export interface UptimeChartOptions extends TunnelLogFilters {
  granularity: TunnelUptimeGranularity
}

function isSameDay(timestamp: string, date: string) {
  return timestamp.startsWith(date)
}

function filterTunnelLogs(logs: TunnelLogEntry[], options: TunnelLogFilters) {
  const query = options.search?.trim().toLowerCase()

  return logs.filter((log) => {
    if (options.date && !isSameDay(log.timestamp, options.date)) return false
    if (options.hour !== undefined) {
      const date = new Date(log.timestamp)
      if (date.getUTCHours() !== options.hour) return false
    }
    if (options.connectionId && log.connectionId !== options.connectionId) return false
    if (options.severity && log.severity !== options.severity) return false
    if (options.eventType && log.eventType !== options.eventType) return false
    if (query) {
      return log.message.toLowerCase().includes(query)
        || log.partnerName.toLowerCase().includes(query)
        || log.eventType.toLowerCase().includes(query)
        || log.connectionId.toLowerCase().includes(query)
    }
    return true
  })
}

function buildUptimeChart(
  logs: TunnelLogEntry[],
  connections: Array<{ id: string, partnerName: string, tunnelStatus: string }>,
  options: UptimeChartOptions
): {
  buckets: TunnelUptimeBucket[]
  connections: Array<{ id: string, partnerName: string, color: string }>
  averageUptime: number
} {
  const scopedConnections = options.connectionId
    ? connections.filter(connection => connection.id === options.connectionId)
    : connections

  const chartConnections = scopedConnections.map((connection, index) => ({
    id: connection.id,
    partnerName: connection.partnerName,
    color: getChartColor(index)
  }))

  const buckets: TunnelUptimeBucket[] = []
  const date = options.date ?? '2026-05-20'
  const showHourlyBuckets = options.granularity === 'hour'
    || (options.granularity === 'minute' && options.hour === undefined)

  if (showHourlyBuckets) {
    for (let hour = 0; hour < 24; hour++) {
      const bucketStart = `${date}T${String(hour).padStart(2, '0')}:00:00.000Z`
      const bucketEndMs = new Date(bucketStart).getTime() + 3600000
      const uptime: Record<string, number> = {}

      for (const [index, connection] of scopedConnections.entries()) {
        const baseline = getConnectionBaseline(
          connection.tunnelStatus as 'active' | 'pending' | 'error',
          index + hour + 1
        )
        uptime[connection.id] = computeUptimePercent(
          logs,
          connection.id,
          bucketStart,
          bucketEndMs,
          baseline
        )
      }

      buckets.push({
        label: `${String(hour).padStart(2, '0')}:00`,
        bucketStart,
        uptime
      })
    }
  } else {
    const hour = options.hour ?? 0
    for (let minute = 0; minute < 60; minute++) {
      const bucketStart = `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`
      const bucketEndMs = new Date(bucketStart).getTime() + 60000
      const uptime: Record<string, number> = {}

      for (const [index, connection] of scopedConnections.entries()) {
        const baseline = getConnectionBaseline(
          connection.tunnelStatus as 'active' | 'pending' | 'error',
          index + hour + minute + 1
        )
        uptime[connection.id] = computeUptimePercent(
          logs,
          connection.id,
          bucketStart,
          bucketEndMs,
          baseline
        )
      }

      buckets.push({
        label: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        bucketStart,
        uptime
      })
    }
  }

  const values = buckets.flatMap(bucket =>
    chartConnections.map(connection => bucket.uptime[connection.id] ?? 0)
  )
  const averageUptime = values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0

  return { buckets, connections: chartConnections, averageUptime }
}

const _useTunnelUptime = () => {
  const { environment } = useEnvironment()
  const { connections } = useConnections()

  const tunnelLogs = computed(() =>
    environment.value === 'sandbox' ? sandboxTunnelLogs : liveTunnelLogs
  )

  const incidents = computed(() =>
    environment.value === 'sandbox' ? sandboxIncidents : liveIncidents
  )

  const incidentMessages = computed(() =>
    environment.value === 'sandbox' ? sandboxIncidentMessages : liveIncidentMessages
  )

  return {
    tunnelLogs,
    incidents,
    incidentMessages,
    filterTunnelLogs: (options: TunnelLogFilters) => filterTunnelLogs(tunnelLogs.value, options),
    buildUptimeChart: (options: UptimeChartOptions) =>
      buildUptimeChart(tunnelLogs.value, connections.value, options),
    getIncident: (incidentId: string) =>
      incidents.value.find(incident => incident.id === incidentId),
    getIncidentForLog: (log: TunnelLogEntry) =>
      log.incidentId
        ? incidents.value.find(incident => incident.id === log.incidentId)
        : incidents.value.find(incident => incident.relatedLogIds.includes(log.id)),
    getIncidentMessages: (incidentId: string) =>
      incidentMessages.value.filter(message => message.incidentId === incidentId),
    getRelatedLogs: (incident: IncidentReport) =>
      tunnelLogs.value.filter(log => incident.relatedLogIds.includes(log.id))
  }
}

export const useTunnelUptime = createSharedComposable(_useTunnelUptime)
