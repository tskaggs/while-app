import { auth } from '../../lib/auth'
import { requireMachineOrg } from '../../utils/authSession'
import { provisionOrganization, isOnboardingComplete } from '../../utils/provisionOrg'

export default defineEventHandler(async (event) => {
  const { machineOrgId, authOrgId } = await requireMachineOrg(event)
  const config = useRuntimeConfig()

  const org = await auth.api.getFullOrganization({
    headers: event.headers,
    query: { organizationId: authOrgId }
  })

  if (!org) {
    throw createError({ statusCode: 400, message: 'Organization not found' })
  }

  const result = await provisionOrganization(
    machineOrgId,
    org.name,
    config.betterAuthUrl || config.public.siteUrl || 'http://localhost:3000'
  )

  const completed = await isOnboardingComplete(machineOrgId)

  return {
    ...result,
    onboardingComplete: completed
  }
})
