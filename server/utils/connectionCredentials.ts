import { prisma } from '../lib/prisma'
import {
  defaultConnectionId,
  generateSandboxApiKey,
  generateWebhookSecret
} from './provisionOrg'

export interface ConnectionCredentialsResult {
  sandboxApiKey: string
  webhookSecret: string
  webhookUrl: string | null
}

export async function loadOrgDefaultWebhookUrl(orgId: string): Promise<string | null> {
  const settings = await prisma.sandboxSettings.findUnique({ where: { orgId } })
  return settings?.webhookUrl ?? null
}

/** Create sandbox API key + webhook secret for a connection; returns plaintext once. */
export async function provisionConnectionSandboxCredentials(
  orgId: string,
  connectionId: string,
  tx?: Pick<typeof prisma, 'apiKey' | 'dashboardConnection' | 'sandboxSettings'>
): Promise<ConnectionCredentialsResult> {
  const db = tx ?? prisma
  const existing = await db.apiKey.findFirst({
    where: { orgId, connectionId, environment: 'sandbox', isActive: true }
  })
  if (existing) {
    const connection = await db.dashboardConnection.findUnique({ where: { id: connectionId } })
    return {
      sandboxApiKey: '',
      webhookSecret: connection?.webhookSecret ?? '',
      webhookUrl: connection?.webhookUrl ?? null
    }
  }

  const { rawKey, hashedKey } = generateSandboxApiKey()
  const webhookSecret = generateWebhookSecret()
  const orgWebhookUrl = await loadOrgDefaultWebhookUrl(orgId)

  if (tx) {
    await tx.apiKey.create({
      data: {
        orgId,
        connectionId,
        hashedKey,
        keyPrefix: 'wh_test_',
        environment: 'sandbox',
        isActive: true
      }
    })
    await tx.dashboardConnection.update({
      where: { id: connectionId },
      data: {
        webhookSecret,
        webhookUrl: orgWebhookUrl,
        pendingSandboxKey: rawKey,
        pendingWebhookSecret: webhookSecret
      }
    })
  } else {
    await prisma.$transaction(async (inner) => {
      await inner.apiKey.create({
        data: {
          orgId,
          connectionId,
          hashedKey,
          keyPrefix: 'wh_test_',
          environment: 'sandbox',
          isActive: true
        }
      })
      await inner.dashboardConnection.update({
        where: { id: connectionId },
        data: {
          webhookSecret,
          webhookUrl: orgWebhookUrl,
          pendingSandboxKey: rawKey,
          pendingWebhookSecret: webhookSecret
        }
      })
    })
  }

  return {
    sandboxApiKey: rawKey,
    webhookSecret,
    webhookUrl: orgWebhookUrl
  }
}

/** Rotate sandbox API key scoped to one connection. */
export async function rotateConnectionSandboxApiKey(orgId: string, connectionId: string) {
  const { rawKey, hashedKey } = generateSandboxApiKey()
  const revokedAt = new Date()

  await prisma.$transaction(async (tx) => {
    await tx.apiKey.updateMany({
      where: { orgId, connectionId, environment: 'sandbox', isActive: true },
      data: { isActive: false, revokedAt }
    })

    await tx.apiKey.create({
      data: {
        orgId,
        connectionId,
        hashedKey,
        keyPrefix: 'wh_test_',
        environment: 'sandbox',
        isActive: true
      }
    })

    await tx.dashboardConnection.update({
      where: { id: connectionId },
      data: { pendingSandboxKey: rawKey }
    })
  })

  return rawKey
}

/** Return pending plaintext credentials once, then clear pending fields. */
export async function revealConnectionPendingCredentials(orgId: string, connectionId: string) {
  const connection = await prisma.dashboardConnection.findFirst({
    where: { id: connectionId, orgId }
  })
  if (!connection) return null

  const sandboxApiKey = connection.pendingSandboxKey
  const webhookSecret = connection.pendingWebhookSecret

  if (!sandboxApiKey && !webhookSecret) return null

  await prisma.dashboardConnection.update({
    where: { id: connectionId },
    data: {
      pendingSandboxKey: null,
      pendingWebhookSecret: null
    }
  })

  return {
    sandboxApiKey: sandboxApiKey ?? '',
    webhookSecret: webhookSecret ?? '',
    webhookUrl: connection.webhookUrl
  }
}

/** Lazy backfill for partner sandbox connections created before per-connection credentials. */
export async function ensureConnectionSandboxCredentials(orgId: string, connectionId: string) {
  const connection = await prisma.dashboardConnection.findFirst({
    where: { id: connectionId, orgId, environment: 'sandbox' }
  })
  if (!connection) return null

  const existingKey = await prisma.apiKey.findFirst({
    where: { orgId, connectionId, environment: 'sandbox', isActive: true }
  })
  if (existingKey) return null

  return provisionConnectionSandboxCredentials(orgId, connectionId)
}

export async function backfillSystemSandboxKeyBinding(orgId: string) {
  const connectionId = defaultConnectionId(orgId)
  await prisma.apiKey.updateMany({
    where: {
      orgId,
      environment: 'sandbox',
      connectionId: null,
      isActive: true
    },
    data: { connectionId }
  })
}
