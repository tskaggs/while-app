import { prisma } from '../../lib/prisma'
import { requireTelemetryOrg, dayRangeUtc, parseDateQuery } from '../../utils/telemetry/query'
import { toIncidentReport, toTunnelLogEntry } from '../../utils/telemetry/serializers'

export default defineEventHandler(async (event) => {
  const { machineOrgId, environment, query } = await requireTelemetryOrg(event)
  const since = new Date(Date.now() - 30 * 86400000)

  let timestampFilter: { gte: Date, lte?: Date } = { gte: since }
  if (query.date) {
    const date = parseDateQuery(query.date)
    const { start, end } = dayRangeUtc(date)
    timestampFilter = { gte: start, lte: end }
  }

  const [tunnelRows, incidents] = await Promise.all([
    prisma.tunnelLog.findMany({
      where: {
        orgId: machineOrgId,
        environment,
        timestamp: timestampFilter
      },
      orderBy: { timestamp: 'desc' },
      take: 5000
    }),
    prisma.tunnelIncident.findMany({
      where: { orgId: machineOrgId, environment },
      orderBy: { startedAt: 'desc' },
      take: 100
    })
  ])

  return {
    tunnelLogs: tunnelRows.map(toTunnelLogEntry),
    incidents: incidents.map(toIncidentReport),
    incidentMessages: []
  }
})
