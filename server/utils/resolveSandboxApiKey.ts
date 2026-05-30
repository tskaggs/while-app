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
  providedKey?: string | null
): Promise<string | null> {
  const pending = getPendingApiKey(machineOrgId)
  if (pending) return pending

  const normalizedKey = normalizeSandboxApiKey(providedKey)
  if (!normalizedKey) {
    const onboarding = await prisma.orgOnboarding.findUnique({ where: { orgId: machineOrgId } })
    const storedPending = onboarding?.pendingSandboxKey
    if (storedPending) {
      storePendingApiKey(machineOrgId, storedPending)
      return storedPending
    }
    return null
  }

  const onboarding = await prisma.orgOnboarding.findUnique({ where: { orgId: machineOrgId } })
  if (onboarding?.pendingSandboxKey === normalizedKey) {
    storePendingApiKey(machineOrgId, normalizedKey)
    return normalizedKey
  }

  const hashedKey = hashApiKey(normalizedKey)
  const stored = await prisma.apiKey.findFirst({
    where: {
      orgId: machineOrgId,
      hashedKey,
      environment: 'sandbox',
      isActive: true
    }
  })

  if (!stored) return null

  storePendingApiKey(machineOrgId, normalizedKey)
  return normalizedKey
}
