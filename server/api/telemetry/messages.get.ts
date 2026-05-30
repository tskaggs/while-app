import { prisma } from '../../lib/prisma'
import { requireTelemetryOrg, dayRangeUtc, parseDateQuery, timeRangeCutoff } from '../../utils/telemetry/query'
import { toProcessedMessage } from '../../utils/telemetry/serializers'

export default defineEventHandler(async (event) => {
  const { machineOrgId, environment, query } = await requireTelemetryOrg(event)
  const since = new Date(Date.now() - 30 * 86400000)
  const rangeSince = timeRangeCutoff(typeof query.range === 'string' ? query.range : undefined)
  const connectionId = typeof query.connectionId === 'string' ? query.connectionId : undefined

  let timestampFilter: { gte: Date, lte?: Date } = { gte: rangeSince ?? since }
  if (query.date) {
    const date = parseDateQuery(query.date)
    const { start, end } = dayRangeUtc(date)
    timestampFilter = { gte: start, lte: end }
  }

  const rows = await prisma.processedMessage.findMany({
    where: {
      orgId: machineOrgId,
      environment,
      ...(connectionId ? { connectionId } : {}),
      timestamp: timestampFilter
    },
    orderBy: { timestamp: 'desc' },
    take: 5000
  })

  return {
    messages: rows.map(toProcessedMessage)
  }
})
