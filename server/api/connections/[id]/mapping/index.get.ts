import { requireMachineOrgOrPat } from '../../../../utils/machineAuth'
import { assertConnectionAccess } from '../../../../utils/connectionTest'
import { getConnectionMappingBundle } from '../../../../utils/connectionMapping'

export default defineEventHandler(async (event) => {
  const connectionId = getRouterParam(event, 'id')
  if (!connectionId) {
    throw createError({ statusCode: 400, message: 'Connection id is required' })
  }

  const { machineOrgId } = await requireMachineOrgOrPat(event, ['mapping:read'])
  await assertConnectionAccess(machineOrgId, connectionId)

  return getConnectionMappingBundle(machineOrgId, connectionId)
})
