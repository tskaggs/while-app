import { prisma } from '../lib/prisma'
import { resolveWebhookDestination } from './webhookResolve'

export async function loadConnectionWebhookConfig(machineOrgId: string, connectionId: string) {
  const [settings, connection] = await Promise.all([
    prisma.sandboxSettings.findUnique({ where: { orgId: machineOrgId } }),
    prisma.dashboardConnection.findFirst({
      where: { id: connectionId, orgId: machineOrgId }
    })
  ])

  if (!connection) {
    throw createError({ statusCode: 404, message: 'Connection not found' })
  }

  const org = {
    webhookUrl: settings?.webhookUrl ?? null,
    webhookSecret: settings?.webhookSecret ?? null
  }

  const connectionOverride = {
    webhookUrl: connection.webhookUrl,
    webhookSecret: connection.webhookSecret
  }

  const resolved = resolveWebhookDestination(org, connectionOverride)

  return {
    settings,
    connection,
    org,
    connectionOverride,
    resolved
  }
}

export function serializeConnectionWebhookResponse(
  org: { webhookUrl: string | null, webhookSecret: string | null },
  connectionOverride: { webhookUrl: string | null, webhookSecret: string | null },
  resolved: ReturnType<typeof resolveWebhookDestination>,
  options?: { revealSecret?: string | null }
) {
  return {
    orgDefault: {
      webhookUrl: org.webhookUrl,
      hasSecret: Boolean(org.webhookSecret)
    },
    connectionOverride: {
      webhookUrl: connectionOverride.webhookUrl,
      hasCustomSecret: Boolean(connectionOverride.webhookSecret)
    },
    effective: {
      webhookUrl: resolved.webhookUrl,
      webhookSecret: options?.revealSecret ?? null,
      urlSource: resolved.urlSource,
      secretSource: resolved.secretSource
    },
    inheritsDefault: resolved.inheritsDefault,
    webhookSecretConfigured: Boolean(resolved.webhookSecret)
  }
}
