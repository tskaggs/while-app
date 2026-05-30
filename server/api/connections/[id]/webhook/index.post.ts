import { requireMachineOrg } from '../../../../utils/authSession'
import { prisma } from '../../../../lib/prisma'
import { assertConnectionAccess } from '../../../../utils/connectionTest'
import {
  loadConnectionWebhookConfig,
  serializeConnectionWebhookResponse
} from '../../../../utils/connectionWebhook'

export default defineEventHandler(async (event) => {
  const connectionId = getRouterParam(event, 'id')

  if (!connectionId) {
    throw createError({ statusCode: 400, message: 'Connection id is required' })
  }

  const body = await readBody<{
    inheritDefault?: boolean
    webhookUrl?: string | null
    webhookSecret?: string | null
  }>(event)

  const { machineOrgId } = await requireMachineOrg(event)
  await assertConnectionAccess(machineOrgId, connectionId)

  if (body?.inheritDefault) {
    await prisma.dashboardConnection.update({
      where: { id: connectionId },
      data: {
        webhookUrl: null,
        webhookSecret: null
      }
    })
  } else {
    const data: { webhookUrl?: string | null, webhookSecret?: string | null } = {}

    if (body?.webhookUrl !== undefined) {
      const trimmed = body.webhookUrl?.trim()
      data.webhookUrl = trimmed || null
    }

    if (body?.webhookSecret !== undefined) {
      const trimmed = body.webhookSecret?.trim()
      data.webhookSecret = trimmed || null
    }

    if (!Object.keys(data).length) {
      throw createError({ statusCode: 400, message: 'No webhook fields to update' })
    }

    await prisma.dashboardConnection.update({
      where: { id: connectionId },
      data
    })
  }

  const { org, connectionOverride, resolved } = await loadConnectionWebhookConfig(
    machineOrgId,
    connectionId
  )

  return serializeConnectionWebhookResponse(org, connectionOverride, resolved)
})
