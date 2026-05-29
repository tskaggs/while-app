import { prisma } from '../lib/prisma'
import { getPendingApiKey, storePendingApiKey } from './pendingApiKeys'
import { hashApiKey } from './provisionOrg'

export async function resolveSandboxApiKey(
  machineOrgId: string,
  providedKey?: string | null
): Promise<string | null> {
  const pending = getPendingApiKey(machineOrgId)
  if (pending) return pending

  if (!providedKey?.trim()) return null

  const hashedKey = hashApiKey(providedKey)
  const stored = await prisma.apiKey.findFirst({
    where: {
      orgId: machineOrgId,
      hashedKey,
      environment: 'sandbox',
      isActive: true
    }
  })

  if (!stored) return null

  storePendingApiKey(machineOrgId, providedKey)
  return providedKey
}
