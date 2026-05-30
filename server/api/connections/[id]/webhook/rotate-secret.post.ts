import { requireMachineOrg } from '../../../../utils/authSession'
import { prisma } from '../../../../lib/prisma'
import { assertConnectionAccess } from '../../../../utils/connectionTest'
import {
  loadConnectionWebhookConfig,
  serializeConnectionWebhookResponse
} from '../../../../utils/connectionWebhook'
import { rotateConnectionWebhookSecret } from '../../../../utils/webhookResolve'

export default defineEventHandler(async (event) => {
  const connectionId = getRouterParam(event, 'id')

  if (!connectionId) {
    throw createError({ statusCode: 400, message: 'Connection id is required' })
  }

  const { machineOrgId } = await requireMachineOrg(event)
  await assertConnectionAccess(machineOrgId, connectionId)

  const webhookSecret = rotateConnectionWebhookSecret()

  await prisma.dashboardConnection.update({
    where: { id: connectionId },
    data: { webhookSecret }
  })

  const { org, connectionOverride, resolved } = await loadConnectionWebhookConfig(
    machineOrgId,
    connectionId
  )

  return {
    webhookSecret,
    ...serializeConnectionWebhookResponse(org, connectionOverride, resolved)
  }
})
