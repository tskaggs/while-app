import { requireMachineOrgOrPat } from '../../utils/machineAuth'
import { createConnectionPair } from '../../utils/connectionPairs'

export default defineEventHandler(async (event) => {
  const { machineOrgId } = await requireMachineOrgOrPat(event, ['connections:provision'])
  const body = await readBody<{
    name: string
    ehrVendor?: string
    dataFormat?: string
    resourceTypes?: string[]
  }>(event)

  if (!body?.name?.trim()) {
    throw createError({ statusCode: 400, message: 'name is required' })
  }

  const pair = await createConnectionPair({
    orgId: machineOrgId,
    name: body.name.trim(),
    ehrVendor: body.ehrVendor ?? 'Other',
    dataFormat: body.dataFormat ?? 'fhir',
    resourceTypes: body.resourceTypes ?? ['Patient']
  })

  return {
    sandboxConnectionId: pair.sandboxConnectionId,
    liveConnectionId: pair.liveConnectionId,
    provisioningUrl: `/connections/${pair.sandboxConnectionId}/provisioning`
  }
})
