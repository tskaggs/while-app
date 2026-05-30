import { requireMachineOrg } from '../../../../utils/authSession'
import { assertConnectionAccess } from '../../../../utils/connectionTest'
import { getConnectionMappingBundle } from '../../../../utils/connectionMapping'

export default defineEventHandler(async (event) => {
  const connectionId = getRouterParam(event, 'id')
  if (!connectionId) {
    throw createError({ statusCode: 400, message: 'Connection id is required' })
  }

  const { machineOrgId } = await requireMachineOrg(event)
  await assertConnectionAccess(machineOrgId, connectionId)

  const bundle = await getConnectionMappingBundle(machineOrgId, connectionId)
  return { suggestions: bundle.suggestions }
})
