import { requireMachineOrg } from '../../utils/authSession'
import { prisma } from '../../lib/prisma'

export default defineEventHandler(async (event) => {
  const { machineOrgId } = await requireMachineOrg(event)
  const query = getQuery(event)
  const includeHidden = query.includeHidden === 'true'

  const connections = await prisma.dashboardConnection.findMany({
    where: {
      orgId: machineOrgId,
      ...(includeHidden ? {} : { isHidden: false })
    },
    orderBy: { createdAt: 'asc' }
  })

  return { connections }
})
