import { prisma } from '../../lib/prisma'
import { requireTelemetryOrg } from '../../utils/telemetry/query'

export default defineEventHandler(async (event) => {
  const { machineOrgId, environment } = await requireTelemetryOrg(event)

  const since24h = new Date(Date.now() - 86400000)
  const since14d = new Date(Date.now() - 14 * 86400000)

  const [messages24h, rollups, tunnelLogs24h, connections] = await Promise.all([
    prisma.processedMessage.count({
      where: { orgId: machineOrgId, environment, timestamp: { gte: since24h } }
    }),
    prisma.dailyMetricRollup.findMany({
      where: {
        orgId: machineOrgId,
        environment,
        date: { gte: since14d }
      },
      orderBy: { date: 'asc' }
    }),
    prisma.tunnelLog.findMany({
      where: {
        orgId: machineOrgId,
        environment,
        timestamp: { gte: since24h }
      }
    }),
    prisma.dashboardConnection.findMany({
      where: { orgId: machineOrgId, environment, isHidden: false }
    })
  ])

  const disconnects = tunnelLogs24h.filter((l: { eventType: string }) => l.eventType === 'disconnect').length
  const uptimePct = Math.max(0, Math.min(100, 100 - disconnects * 2))

  const stats = [
    {
      title: 'Messages (24h)',
      icon: 'i-lucide-activity',
      value: messages24h,
      variation: 0,
      description: 'Processed in the last 24 hours',
      to: '/messages'
    },
    {
      title: 'Tunnel Uptime',
      icon: 'i-lucide-shield-check',
      value: `${uptimePct.toFixed(1)}%`,
      variation: 0,
      description: 'Rolling 24h WireGuard availability',
      to: '/uptime'
    },
    {
      title: 'Active Connections',
      icon: 'i-lucide-plug-zap',
      value: connections.filter((c: { tunnelStatus: string }) => c.tunnelStatus === 'active').length,
      variation: 0,
      description: 'Connections with healthy tunnels',
      to: '/connections'
    },
    {
      title: 'FHIR Resources',
      icon: 'i-lucide-database',
      value: rollups.reduce((sum: number, r: { fhirResources: number }) => sum + r.fhirResources, 0),
      variation: 0,
      description: 'Synthetic resources this period',
      to: '/messages'
    }
  ]

  const rollupByDate = new Map<string, { messages: number, fhir: number, uptime: number, byConnection: Record<string, number> }>()
  for (const row of rollups) {
    const key = row.date.toISOString().slice(0, 10)
    const existing = rollupByDate.get(key) ?? { messages: 0, fhir: 0, uptime: 100, byConnection: {} }
    existing.messages += row.messageCount
    existing.fhir += row.fhirResources
    existing.uptime = row.uptimePct
    existing.byConnection[row.connectionId] = (existing.byConnection[row.connectionId] ?? 0) + row.messageCount
    rollupByDate.set(key, existing)
  }

  const chartData = [...rollupByDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      messages: data.messages,
      fhirResources: data.fhir,
      uptime: data.uptime,
      byConnection: data.byConnection
    }))

  return { stats, chartData }
})
