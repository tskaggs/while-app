import { requireMachineOrgOrPat } from '../../utils/machineAuth'
import { prisma } from '../../lib/prisma'
import { createPartnerConnectionFromRequest } from '../../utils/connectionPairs'

export default defineEventHandler(async (event) => {
  const { machineOrgId } = await requireMachineOrgOrPat(event, ['connections:provision'])
  const body = await readBody<{
    partnerName: string
    ehrVendor: string
    contactEmail: string
    targetGoLive: string
    scope: string
    resourceTypes: string[]
    dataFormat: string
    environment: string
    estimatedVolume: string
    notes?: string
  }>(event)

  if (!body?.partnerName || !body?.ehrVendor || !body?.contactEmail) {
    throw createError({ statusCode: 400, message: 'Missing required connection request fields' })
  }

  const request = await prisma.connectionRequest.create({
    data: {
      orgId: machineOrgId,
      partnerName: body.partnerName,
      ehrVendor: body.ehrVendor,
      contactEmail: body.contactEmail,
      targetGoLive: body.targetGoLive,
      scope: body.scope,
      resourceTypes: body.resourceTypes ?? ['Patient'],
      dataFormat: body.dataFormat,
      environment: body.environment,
      estimatedVolume: body.estimatedVolume,
      notes: body.notes,
      status: 'pending'
    }
  })

  return createPartnerConnectionFromRequest(request.id)
})
