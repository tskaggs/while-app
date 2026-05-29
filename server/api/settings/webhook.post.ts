import { requireMachineOrg } from '../../utils/authSession'
import { prisma } from '../../lib/prisma'

export default defineEventHandler(async (event) => {
  const { machineOrgId } = await requireMachineOrg(event)
  const body = await readBody<{ webhookUrl?: string }>(event)

  if (!body?.webhookUrl) {
    throw createError({ statusCode: 400, message: 'webhookUrl is required' })
  }

  const settings = await prisma.sandboxSettings.update({
    where: { orgId: machineOrgId },
    data: { webhookUrl: body.webhookUrl }
  })

  return { sandboxSettings: settings }
})
