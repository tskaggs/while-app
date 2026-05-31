import { requireMachineOrg } from '../../../utils/authSession'
import { generateMachinePat, MACHINE_TOKEN_SCOPES } from '../../../utils/machineAuth'
import { prisma } from '../../../lib/prisma'

export default defineEventHandler(async (event) => {
  const { machineOrgId } = await requireMachineOrg(event)
  const body = await readBody<{ name?: string, scopes?: string[], expiresInDays?: number }>(event)

  const name = body?.name?.trim() || 'MCP token'
  const scopes = (body?.scopes?.length ? body.scopes : [...MACHINE_TOKEN_SCOPES])
    .filter(s => MACHINE_TOKEN_SCOPES.includes(s as typeof MACHINE_TOKEN_SCOPES[number]))

  const { rawToken, tokenHash, tokenPrefix } = generateMachinePat()
  const expiresAt = body?.expiresInDays
    ? new Date(Date.now() + body.expiresInDays * 86400000)
    : null

  const token = await prisma.machineApiToken.create({
    data: {
      orgId: machineOrgId,
      name,
      tokenHash,
      tokenPrefix,
      scopes,
      expiresAt
    }
  })

  return {
    id: token.id,
    name: token.name,
    token: rawToken,
    scopes: token.scopes,
    expiresAt: token.expiresAt,
    message: 'Copy this token now — it will not be shown again.'
  }
})
