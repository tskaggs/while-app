import { requireMachineOrg } from '../../../../utils/authSession'
import { prisma } from '../../../../lib/prisma'
import { buildApiKeyHistoryEvents } from '../../../../utils/apiKeyHistory'
import {
  assertConnectionAccess,
  isSystemSandboxConnection
} from '../../../../utils/connectionTest'
import { rotateOrgSandboxApiKey } from '../../../../utils/provisionOrg'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const connectionId = getRouterParam(event, 'id')

  if (!connectionId) {
    throw createError({ statusCode: 400, message: 'Connection id is required' })
  }

  if (config.public.mockMode) {
    const now = new Date().toISOString()
    return {
      sandboxApiKey: 'wh_test_mock_rotated_key0001',
      activeKey: {
        id: 'mock-active-key',
        keyPrefix: 'wh_test_',
        environment: 'sandbox',
        createdAt: now
      },
      history: [
        {
          id: 'mock-key-3-created',
          type: 'created' as const,
          keyPrefix: 'wh_test_',
          environment: 'sandbox',
          occurredAt: now,
          isActive: true
        },
        ...[
          {
            id: 'mock-key-2-revoked',
            type: 'revoked' as const,
            keyPrefix: 'wh_test_',
            environment: 'sandbox',
            occurredAt: now,
            isActive: false
          }
        ]
      ]
    }
  }

  const { machineOrgId } = await requireMachineOrg(event)
  const connection = await assertConnectionAccess(machineOrgId, connectionId)

  if (!isSystemSandboxConnection(connection)) {
    throw createError({
      statusCode: 403,
      message: 'Sandbox API keys can only be rotated from the While Sandbox connection.'
    })
  }

  const sandboxApiKey = await rotateOrgSandboxApiKey(machineOrgId)

  const keys = await prisma.apiKey.findMany({
    where: { orgId: machineOrgId, environment: 'sandbox' },
    orderBy: { createdAt: 'desc' }
  })

  const activeKey = keys.find(key => key.isActive)

  return {
    sandboxApiKey,
    activeKey: activeKey
      ? {
          id: activeKey.id,
          keyPrefix: activeKey.keyPrefix,
          environment: activeKey.environment,
          createdAt: activeKey.createdAt.toISOString()
        }
      : null,
    history: buildApiKeyHistoryEvents(keys)
  }
})
