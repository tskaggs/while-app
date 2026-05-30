import { requireMachineOrg } from '../../utils/authSession'
import { prisma } from '../../lib/prisma'

export default defineEventHandler(async (event) => {
  const { machineOrgId } = await requireMachineOrg(event)

  const requests = await prisma.connectionRequest.findMany({
    where: { orgId: machineOrgId },
    orderBy: { createdAt: 'desc' }
  })

  const jobs = await prisma.provisioningJob.findMany({
    where: { orgId: machineOrgId },
    orderBy: { createdAt: 'desc' }
  })

  return { requests, jobs }
})
