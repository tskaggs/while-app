import { requireMachineOrg } from '../../../../utils/authSession'
import {
  assertConnectionAccess,
  isSandboxTestConnection
} from '../../../../utils/connectionTest'
import { revealConnectionPendingCredentials } from '../../../../utils/connectionCredentials'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const connectionId = getRouterParam(event, 'id')

  if (!connectionId) {
    throw createError({ statusCode: 400, message: 'Connection id is required' })
  }

  if (config.public.mockMode) {
    return {
      sandboxApiKey: 'wh_test_mock_partner_key0001',
      webhookSecret: 'whsec_mock_partner_secret0001',
      webhookUrl: 'http://localhost:3000/api/webhooks/while'
    }
  }

  const { machineOrgId } = await requireMachineOrg(event)
  const connection = await assertConnectionAccess(machineOrgId, connectionId)

  if (!isSandboxTestConnection(connection)) {
    throw createError({
      statusCode: 403,
      message: 'Pending credentials can only be revealed for sandbox connections.'
    })
  }

  const revealed = await revealConnectionPendingCredentials(machineOrgId, connectionId)
  if (!revealed) {
    throw createError({
      statusCode: 404,
      message: 'No pending credentials to reveal for this connection.'
    })
  }

  return revealed
})
