import { prisma } from '../../lib/prisma'
import { requireTelemetryOrg, timeRangeCutoff } from '../../utils/telemetry/query'
import { toLogEntry } from '../../utils/telemetry/serializers'

export default defineEventHandler(async (event) => {
  const { machineOrgId, environment, query } = await requireTelemetryOrg(event)
  const cutoff = timeRangeCutoff(typeof query.timeRange === 'string' ? query.timeRange : undefined)

  const rows = await prisma.integrationLog.findMany({
    where: {
      orgId: machineOrgId,
      environment,
      ...(cutoff ? { timestamp: { gte: cutoff } } : {})
    },
    orderBy: { timestamp: 'desc' },
    take: 5000
  })

  return {
    logs: rows.map(toLogEntry)
  }
})
