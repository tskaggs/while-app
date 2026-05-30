import { requireMachineOrg } from '../../../../utils/authSession'
import { prisma } from '../../../../lib/prisma'
import { buildApiKeyHistoryEvents } from '../../../../utils/apiKeyHistory'
import {
  assertConnectionAccess,
  isSystemSandboxConnection
} from '../../../../utils/connectionTest'

const MOCK_HISTORY = [
  {
    id: 'mock-key-2-created',
    type: 'created' as const,
    keyPrefix: 'wh_test_',
    environment: 'sandbox',
    occurredAt: '2026-05-28T16:42:00.000Z',
    isActive: true
  },
  {
    id: 'mock-key-1-revoked',
    type: 'revoked' as const,
    keyPrefix: 'wh_test_',
    environment: 'sandbox',
    occurredAt: '2026-05-28T16:42:00.000Z',
    isActive: false
  },
  {
    id: 'mock-key-1-created',
    type: 'created' as const,
    keyPrefix: 'wh_test_',
    environment: 'sandbox',
    occurredAt: '2026-05-20T09:15:00.000Z',
    isActive: false
  }
]

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const connectionId = getRouterParam(event, 'id')

  if (!connectionId) {
    throw createError({ statusCode: 400, message: 'Connection id is required' })
  }

  if (config.public.mockMode) {
    return {
      connectionId,
      partnerName: 'While Sandbox',
      isSystemSandbox: true,
      canRotate: true,
      activeKey: {
        id: 'mock-active-key',
        keyPrefix: 'wh_test_',
        environment: 'sandbox',
        createdAt: '2026-05-28T16:42:00.000Z'
      },
      history: MOCK_HISTORY
    }
  }

  const { machineOrgId } = await requireMachineOrg(event)
  const connection = await assertConnectionAccess(machineOrgId, connectionId)
  const isSystemSandbox = isSystemSandboxConnection(connection)

  const keys = await prisma.apiKey.findMany({
    where: { orgId: machineOrgId, environment: 'sandbox' },
    orderBy: { createdAt: 'desc' }
  })

  const activeKey = keys.find(key => key.isActive) ?? null
  const history = buildApiKeyHistoryEvents(keys)

  return {
    connectionId: connection.id,
    partnerName: connection.name,
    isSystemSandbox,
    canRotate: isSystemSandbox,
    activeKey: activeKey
      ? {
          id: activeKey.id,
          keyPrefix: activeKey.keyPrefix,
          environment: activeKey.environment,
          createdAt: activeKey.createdAt.toISOString()
        }
      : null,
    history
  }
})
