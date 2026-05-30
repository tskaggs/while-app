import { requireMachineOrg } from '../../../../utils/authSession'
import { assertConnectionAccess } from '../../../../utils/connectionTest'
import { saveConnectionMappings } from '../../../../utils/connectionMapping'

export default defineEventHandler(async (event) => {
  const connectionId = getRouterParam(event, 'id')
  if (!connectionId) {
    throw createError({ statusCode: 400, message: 'Connection id is required' })
  }

  const body = await readBody<{
    mappings?: Array<{
      sourcePath: string
      targetFhirPath: string
      status?: string
      isRequired?: boolean
      sortOrder?: number
    }>
  }>(event)

  if (!body?.mappings?.length) {
    throw createError({ statusCode: 400, message: 'mappings array is required' })
  }

  const { machineOrgId } = await requireMachineOrg(event)
  await assertConnectionAccess(machineOrgId, connectionId)

  return saveConnectionMappings(machineOrgId, connectionId, body.mappings)
})
