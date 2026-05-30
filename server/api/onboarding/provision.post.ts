import { auth } from '../../lib/auth'
import { requireMachineOrg } from '../../utils/authSession'
import { provisionOrganization, isOnboardingComplete } from '../../utils/provisionOrg'
import { provisionAccountSandboxVm } from '../../utils/provisioningWorker'

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

  const webhookBase = config.webhookBaseUrl
    || config.betterAuthUrl
    || config.public.siteUrl
    || 'http://localhost:3000'

  const body = await readBody<{
    ehrVendor?: string
    dataFormat?: string
    resourceTypes?: string[]
  }>(event).catch(() => undefined)

  const result = await provisionOrganization(
    machineOrgId,
    org.name,
    webhookBase,
    body
      ? {
          ehrVendor: body.ehrVendor,
          dataFormat: body.dataFormat,
          resourceTypes: body.resourceTypes
        }
      : undefined
  )

  const completed = await isOnboardingComplete(machineOrgId)

  if (!completed && !result.sandboxApiKey) {
    throw createError({
      statusCode: 500,
      message: 'Unable to issue a sandbox API key. Try again.'
    })
  }

  if (!result.alreadyProvisioned) {
    void provisionAccountSandboxVm(machineOrgId).catch(() => {})
  }

  return {
    ...result,
    onboardingComplete: completed
  }
})
