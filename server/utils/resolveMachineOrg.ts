import { randomUUID } from 'crypto'
import { prisma } from '../lib/prisma'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string) {
  return UUID_RE.test(value)
}

type AuthOrgMetadata = {
  machineOrgId?: string
  [key: string]: unknown
}

function parseMetadata(raw: string | null | undefined): AuthOrgMetadata {
  if (!raw) return {}
  try {
    return JSON.parse(raw) as AuthOrgMetadata
  } catch {
    return {}
  }
}

/** Map Better Auth organization id → machine-plane UUID (organizations.id). */
export async function resolveMachineOrgId(authOrgId: string): Promise<string> {
  if (isUuid(authOrgId)) {
    const existing = await prisma.machineOrganization.findUnique({
      where: { id: authOrgId }
    })
    if (existing) return authOrgId
  }

  const authOrg = await prisma.organization.findUnique({
    where: { id: authOrgId }
  })

  if (!authOrg) {
    throw createError({ statusCode: 404, message: 'Organization not found' })
  }

  const metadata = parseMetadata(authOrg.metadata)
  if (metadata.machineOrgId && isUuid(metadata.machineOrgId)) {
    return metadata.machineOrgId
  }

  const machineOrgId = isUuid(authOrgId) ? authOrgId : randomUUID()

  await prisma.organization.update({
    where: { id: authOrgId },
    data: {
      metadata: JSON.stringify({ ...metadata, machineOrgId })
    }
  })

  return machineOrgId
}
