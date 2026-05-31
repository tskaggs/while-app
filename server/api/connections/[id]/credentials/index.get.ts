import { requireMachineOrg } from '../../../../utils/authSession'
import { prisma } from '../../../../lib/prisma'
import { buildApiKeyHistoryEvents } from '../../../../utils/apiKeyHistory'
import {
  assertConnectionAccess,
  isSandboxTestConnection,
  isSystemSandboxConnection
} from '../../../../utils/connectionTest'
import {
  ensureConnectionSandboxCredentials
} from '../../../../utils/connectionCredentials'
import { loadConnectionWebhookConfig } from '../../../../utils/connectionWebhook'

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
      webhookUrl: 'http://localhost:3000/api/webhooks/while',
      webhookSecretConfigured: true,
      hasPendingCredentials: false,
      history: MOCK_HISTORY
    }
  }

  const { machineOrgId } = await requireMachineOrg(event)
  const connection = await assertConnectionAccess(machineOrgId, connectionId)

  if (!isSandboxTestConnection(connection)) {
    throw createError({
      statusCode: 403,
      message: 'Credentials are only available for sandbox connections.'
    })
  }

  await ensureConnectionSandboxCredentials(machineOrgId, connectionId)

  const [keys, webhookConfig, connectionRow] = await Promise.all([
    prisma.apiKey.findMany({
      where: { orgId: machineOrgId, connectionId, environment: 'sandbox' },
      orderBy: { createdAt: 'desc' }
    }),
    loadConnectionWebhookConfig(machineOrgId, connectionId),
    prisma.dashboardConnection.findUnique({ where: { id: connectionId } })
  ])

  const activeKey = keys.find(key => key.isActive) ?? null
  const history = buildApiKeyHistoryEvents(keys)
  const isSystemSandbox = isSystemSandboxConnection(connection)

  return {
    connectionId: connection.id,
    partnerName: connection.name,
    isSystemSandbox,
    canRotate: true,
    activeKey: activeKey
      ? {
          id: activeKey.id,
          keyPrefix: activeKey.keyPrefix,
          environment: activeKey.environment,
          createdAt: activeKey.createdAt.toISOString()
        }
      : null,
    webhookUrl: webhookConfig.resolved.webhookUrl,
    webhookSecretConfigured: Boolean(webhookConfig.resolved.webhookSecret),
    hasPendingCredentials: Boolean(
      connectionRow?.pendingSandboxKey || connectionRow?.pendingWebhookSecret
    ),
    history
  }
})
