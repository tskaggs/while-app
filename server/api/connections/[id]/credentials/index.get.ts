import { requireMachineOrg } from '../../../../utils/authSession'
import { prisma } from '../../../../lib/prisma'
import { buildApiKeyHistoryEvents } from '../../../../utils/apiKeyHistory'
import { isSandboxTestConnection } from '../../../../utils/connectionTest'
import { ensureConnectionSandboxCredentials, loadSandboxApiKeysForConnection } from '../../../../utils/connectionCredentials'
import {
  buildCredentialsResponse,
  credentialsConnectionSelect,
  type ConnectionCredentialsResponse
} from '../../../../utils/connectionCredentialsTypes'
import { loadConnectionWebhookConfig } from '../../../../utils/connectionWebhook'

const MOCK_RESPONSE: ConnectionCredentialsResponse = {
  connectionId: 'conn-sa-mock',
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
  history: [
    {
      id: 'mock-key-2-created',
      type: 'created',
      keyPrefix: 'wh_test_',
      environment: 'sandbox',
      occurredAt: '2026-05-28T16:42:00.000Z',
      isActive: true
    },
    {
      id: 'mock-key-1-revoked',
      type: 'revoked',
      keyPrefix: 'wh_test_',
      environment: 'sandbox',
      occurredAt: '2026-05-28T16:42:00.000Z',
      isActive: false
    },
    {
      id: 'mock-key-1-created',
      type: 'created',
      keyPrefix: 'wh_test_',
      environment: 'sandbox',
      occurredAt: '2026-05-20T09:15:00.000Z',
      isActive: false
    }
  ]
}

export default defineEventHandler(async (event): Promise<ConnectionCredentialsResponse> => {
  const config = useRuntimeConfig()
  const connectionId = getRouterParam(event, 'id')

  if (!connectionId) {
    throw createError({ statusCode: 400, message: 'Connection id is required' })
  }

  if (config.public.mockMode) {
    return {
      ...MOCK_RESPONSE,
      connectionId
    }
  }

  const { machineOrgId } = await requireMachineOrg(event)

  const connection = await prisma.dashboardConnection.findFirst({
    where: { id: connectionId, orgId: machineOrgId },
    select: credentialsConnectionSelect
  })

  if (!connection) {
    throw createError({ statusCode: 404, message: 'Connection not found' })
  }

  if (!isSandboxTestConnection(connection)) {
    throw createError({
      statusCode: 403,
      message: 'Credentials are only available for sandbox connections.'
    })
  }

  await ensureConnectionSandboxCredentials(machineOrgId, connectionId)

  const [keys, webhookConfig] = await Promise.all([
    loadSandboxApiKeysForConnection(machineOrgId, connectionId),
    loadConnectionWebhookConfig(machineOrgId, connectionId)
  ])

  const activeKey = keys.find(key => key.isActive) ?? null

  return buildCredentialsResponse({
    connection,
    activeKey,
    webhookUrl: webhookConfig.resolved.webhookUrl,
    webhookSecret: webhookConfig.resolved.webhookSecret,
    history: buildApiKeyHistoryEvents(keys)
  })
})
