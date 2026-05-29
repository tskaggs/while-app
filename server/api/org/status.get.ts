import { requireMachineOrg } from '../../utils/authSession'
import { prisma } from '../../lib/prisma'

export default defineEventHandler(async (event) => {
  const { machineOrgId } = await requireMachineOrg(event)

  const [onboarding, org, keys, settings, connections] = await Promise.all([
    prisma.orgOnboarding.findUnique({ where: { orgId: machineOrgId } }),
    prisma.machineOrganization.findUnique({ where: { id: machineOrgId } }),
    prisma.apiKey.findMany({ where: { orgId: machineOrgId, isActive: true } }),
    prisma.sandboxSettings.findUnique({ where: { orgId: machineOrgId } }),
    prisma.dashboardConnection.findMany({ where: { orgId: machineOrgId } })
  ])

  return {
    onboardingComplete: Boolean(onboarding?.completedAt),
    organization: org,
    apiKeys: keys.map(k => ({
      id: k.id,
      environment: k.environment,
      keyPrefix: k.keyPrefix,
      isActive: k.isActive,
      createdAt: k.createdAt
    })),
    sandboxSettings: settings,
    connections
  }
})
