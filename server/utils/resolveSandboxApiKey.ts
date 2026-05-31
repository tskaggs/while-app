import { prisma } from '../lib/prisma'
import { getPendingApiKey, storePendingApiKey } from './pendingApiKeys'
import { hashApiKey } from './provisionOrg'

export function normalizeSandboxApiKey(raw?: string | null): string | null {
  if (!raw?.trim()) return null

  let key = raw.trim()
  const bearerMatch = key.match(/^Bearer\s+(.+)$/i)
  if (bearerMatch?.[1]) {
    key = bearerMatch[1].trim()
  }

  return key || null
}

export async function resolveSandboxApiKey(
  machineOrgId: string,
  providedKey?: string | null,
  connectionId?: string
): Promise<string | null> {
  if (connectionId) {
    const connection = await prisma.dashboardConnection.findFirst({
      where: { id: connectionId, orgId: machineOrgId }
    })
    if (connection?.pendingSandboxKey) {
      const normalized = normalizeSandboxApiKey(providedKey)
      if (!normalized || normalized === connection.pendingSandboxKey) {
        storePendingApiKey(`${machineOrgId}:${connectionId}`, connection.pendingSandboxKey)
        return connection.pendingSandboxKey
      }
    }
  }

  const pendingKey = connectionId
    ? getPendingApiKey(`${machineOrgId}:${connectionId}`)
    : getPendingApiKey(machineOrgId)
  if (pendingKey) return pendingKey

  const normalizedKey = normalizeSandboxApiKey(providedKey)
  if (!normalizedKey) {
    if (!connectionId) {
      const onboarding = await prisma.orgOnboarding.findUnique({ where: { orgId: machineOrgId } })
      const storedPending = onboarding?.pendingSandboxKey
      if (storedPending) {
        storePendingApiKey(machineOrgId, storedPending)
        return storedPending
      }
    }
    return null
  }

  if (!connectionId) {
    const onboarding = await prisma.orgOnboarding.findUnique({ where: { orgId: machineOrgId } })
    if (onboarding?.pendingSandboxKey === normalizedKey) {
      storePendingApiKey(machineOrgId, normalizedKey)
      return normalizedKey
    }
  }

  const hashedKey = hashApiKey(normalizedKey)
  const stored = await prisma.apiKey.findFirst({
    where: {
      orgId: machineOrgId,
      hashedKey,
      environment: 'sandbox',
      isActive: true,
      ...(connectionId ? { connectionId } : {})
    }
  })

  if (!stored) return null

  const cacheKey = connectionId ? `${machineOrgId}:${connectionId}` : machineOrgId
  storePendingApiKey(cacheKey, normalizedKey)
  return normalizedKey
}
