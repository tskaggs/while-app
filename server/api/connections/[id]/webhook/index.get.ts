import { requireMachineOrg } from '../../../../utils/authSession'
import { assertConnectionAccess } from '../../../../utils/connectionTest'
import {
  loadConnectionWebhookConfig,
  serializeConnectionWebhookResponse
} from '../../../../utils/connectionWebhook'
import { maskWebhookSecret } from '../../../../utils/webhookResolve'

export default defineEventHandler(async (event) => {
  const connectionId = getRouterParam(event, 'id')

  if (!connectionId) {
    throw createError({ statusCode: 400, message: 'Connection id is required' })
  }

  const { machineOrgId } = await requireMachineOrg(event)
  await assertConnectionAccess(machineOrgId, connectionId)

  const { org, connectionOverride, resolved } = await loadConnectionWebhookConfig(
    machineOrgId,
    connectionId
  )

  return serializeConnectionWebhookResponse(org, connectionOverride, resolved, {
    revealSecret: maskWebhookSecret(resolved.webhookSecret)
  })
})
