import { requireMachineOrgOrPat } from '../../utils/machineAuth'
import { prisma } from '../../lib/prisma'
import {
  deriveFlightCheckFromMapping,
  getConnectionMappingBundle
} from '../../utils/connectionMapping'

async function enrichConnection(orgId: string, record: Awaited<ReturnType<typeof prisma.dashboardConnection.findMany>>[number]) {
  const bundle = await getConnectionMappingBundle(orgId, record.id)
  const flightCheck = deriveFlightCheckFromMapping(
    record.tunnelStatus,
    bundle.completion,
    Boolean(bundle.requiredData?.completedAt || bundle.requiredData?.ehrEndpoint),
    record.connectionType
  )

  return {
    ...record,
    flightCheck,
    mappingCompletion: bundle.completion
  }
}

export default defineEventHandler(async (event) => {
  const { machineOrgId } = await requireMachineOrgOrPat(event, ['connections:read'])
  const query = getQuery(event)
  const includeHidden = query.includeHidden === 'true'

  const connections = await prisma.dashboardConnection.findMany({
    where: {
      orgId: machineOrgId,
      ...(includeHidden ? {} : { isHidden: false })
    },
    orderBy: { createdAt: 'asc' }
  })

  const enriched = await Promise.all(connections.map(c => enrichConnection(machineOrgId, c)))

  return { connections: enriched }
})
