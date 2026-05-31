import type { H3Event } from 'h3'
import { createHash, randomBytes } from 'node:crypto'
import { prisma } from '../lib/prisma'

const PAT_PREFIX = 'wh_pat_'

export const MACHINE_TOKEN_SCOPES = [
  'connections:read',
  'connections:write',
  'connections:provision',
  'mapping:read',
  'mapping:write'
] as const

export type MachineTokenScope = (typeof MACHINE_TOKEN_SCOPES)[number]

function hashPat(raw: string) {
  const secret = raw.startsWith(PAT_PREFIX) ? raw.slice(PAT_PREFIX.length) : raw
  return createHash('sha256').update(secret).digest('hex')
}

export function generateMachinePat() {
  const secret = randomBytes(32).toString('hex')
  return {
    rawToken: `${PAT_PREFIX}${secret}`,
    tokenHash: hashPat(`${PAT_PREFIX}${secret}`),
    tokenPrefix: PAT_PREFIX
  }
}

export async function requireMachinePat(event: H3Event, scopes: MachineTokenScope[] = []) {
  const authHeader = getRequestHeader(event, 'authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
  if (!token?.startsWith(PAT_PREFIX)) {
    throw createError({ statusCode: 401, message: 'Missing or invalid machine token' })
  }

  const tokenHash = hashPat(token)
  const record = await prisma.machineApiToken.findUnique({ where: { tokenHash } })
  if (!record || record.revokedAt) {
    throw createError({ statusCode: 401, message: 'Invalid machine token' })
  }
  if (record.expiresAt && record.expiresAt < new Date()) {
    throw createError({ statusCode: 401, message: 'Machine token expired' })
  }

  for (const scope of scopes) {
    if (!record.scopes.includes(scope)) {
      throw createError({ statusCode: 403, message: `Missing scope: ${scope}` })
    }
  }

  await prisma.machineApiToken.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() }
  })

  return { orgId: record.orgId, tokenId: record.id, scopes: record.scopes }
}

export async function requireMachineOrgOrPat(
  event: H3Event,
  scopes: MachineTokenScope[] = []
) {
  const authHeader = getRequestHeader(event, 'authorization') ?? ''
  if (authHeader.startsWith('Bearer wh_pat_')) {
    const pat = await requireMachinePat(event, scopes)
    return { machineOrgId: pat.orgId, viaPat: true as const }
  }

  const { requireMachineOrg } = await import('./authSession')
  const session = await requireMachineOrg(event)
  return { ...session, viaPat: false as const }
}
