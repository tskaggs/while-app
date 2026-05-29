import { auth } from '../../lib/auth'
import { requireMachineOrg } from '../../utils/authSession'
import { prisma } from '../../lib/prisma'
import {
  defaultConnectionId,
  defaultPatientId,
  isOnboardingComplete,
  resolveOnboardingSandboxKey
} from '../../utils/provisionOrg'

export default defineEventHandler(async (event) => {
  const { machineOrgId, authOrgId } = await requireMachineOrg(event)

  const org = await auth.api.getFullOrganization({
    headers: event.headers,
    query: { organizationId: authOrgId }
  })

  if (!org) {
    throw createError({ statusCode: 400, message: 'Organization not found' })
  }

  const [existing, completed] = await Promise.all([
    prisma.machineOrganization.findUnique({
      where: { id: machineOrgId },
      include: { sandboxSettings: true }
    }),
    isOnboardingComplete(machineOrgId)
  ])

  if (!existing) {
    return { provisioned: false, onboardingComplete: completed }
  }

  const { sandboxApiKey, keyRegenerated } = await resolveOnboardingSandboxKey(machineOrgId)

  return {
    provisioned: true,
    onboardingComplete: completed,
    orgId: machineOrgId,
    orgName: existing.name,
    sandboxApiKey,
    webhookSecret: existing.sandboxSettings?.webhookSecret ?? '',
    connectionId: defaultConnectionId(machineOrgId),
    samplePatientId: defaultPatientId(machineOrgId, 1),
    alreadyProvisioned: true,
    keyRegenerated
  }
})
