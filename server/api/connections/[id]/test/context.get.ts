import { requireMachineOrg } from '../../../../utils/authSession'
import { prisma } from '../../../../lib/prisma'
import {
  assertConnectionAccess,
  isSystemSandboxConnection,
  samplePatientIdForOrg
} from '../../../../utils/connectionTest'
import { dockerReceiverUrl, isLocalhostWebhookUrl, siteReceiverUrl } from '../../../../utils/webhookUrl'
import { loadConnectionWebhookConfig } from '../../../../utils/connectionWebhook'

const MOCK_KEY_PREFIX = 'wh_test_mock'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const connectionId = getRouterParam(event, 'id')

  if (!connectionId) {
    throw createError({ statusCode: 400, message: 'Connection id is required' })
  }

  const siteUrl = config.public.siteUrl || config.betterAuthUrl || 'http://localhost:3000'
  const receiverUrl = siteReceiverUrl(siteUrl)
  const dockerUrl = dockerReceiverUrl(siteUrl)

  if (config.public.mockMode) {
    const apiBaseUrl = config.public.whileApiUrl || 'http://localhost:8000'
    const isSystemSandbox = connectionId.startsWith('conn-sa') || connectionId.includes('sandbox')

    return {
      connectionId,
      partnerName: isSystemSandbox ? 'While Sandbox' : 'North Valley Clinic',
      isSystemSandbox,
      apiBaseUrl,
      orgDefaultWebhookUrl: receiverUrl,
      connectionWebhookUrl: null,
      webhookUrl: receiverUrl,
      inheritsDefault: true,
      urlSource: 'org',
      hasCustomSecret: false,
      webhookSecretConfigured: true,
      samplePatientId: 'pat_mock0001_01',
      keyPrefix: MOCK_KEY_PREFIX,
      siteReceiverUrl: receiverUrl,
      dockerReceiverUrl: dockerUrl,
      webhookUrlNeedsDockerFix: false
    }
  }

  const { machineOrgId } = await requireMachineOrg(event)
  const connection = await assertConnectionAccess(machineOrgId, connectionId)

  const [keys, webhookConfig] = await Promise.all([
    prisma.apiKey.findFirst({
      where: {
        orgId: machineOrgId,
        connectionId: connection.id,
        environment: 'sandbox',
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    loadConnectionWebhookConfig(machineOrgId, connectionId)
  ])

  const { org, connectionOverride, resolved } = webhookConfig
  const effectiveUrl = resolved.webhookUrl

  const apiBaseUrl = config.whileApiUrl || 'http://localhost:8000'

  return {
    connectionId: connection.id,
    partnerName: connection.name,
    isSystemSandbox: isSystemSandboxConnection(connection),
    apiBaseUrl,
    orgDefaultWebhookUrl: org.webhookUrl,
    connectionWebhookUrl: connectionOverride.webhookUrl,
    webhookUrl: effectiveUrl,
    inheritsDefault: resolved.inheritsDefault,
    urlSource: resolved.urlSource,
    secretSource: resolved.secretSource,
    hasCustomSecret: Boolean(connectionOverride.webhookSecret),
    webhookSecretConfigured: Boolean(resolved.webhookSecret),
    samplePatientId: samplePatientIdForOrg(machineOrgId),
    keyPrefix: keys?.keyPrefix ?? null,
    siteReceiverUrl: receiverUrl,
    dockerReceiverUrl: dockerUrl,
    webhookUrlNeedsDockerFix: isLocalhostWebhookUrl(effectiveUrl)
  }
})
