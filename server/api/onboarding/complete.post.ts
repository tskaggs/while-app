import { requireMachineOrg } from '../../utils/authSession'
import { completeOnboarding, markApiKeyShown } from '../../utils/provisionOrg'
import { clearPendingApiKey } from '../../utils/pendingApiKeys'

export default defineEventHandler(async (event) => {
  const { machineOrgId } = await requireMachineOrg(event)
  const body = await readBody<{ apiKeyAcknowledged?: boolean }>(event)

  if (body?.apiKeyAcknowledged) {
    await markApiKeyShown(machineOrgId)
  }

  await completeOnboarding(machineOrgId)
  clearPendingApiKey(machineOrgId)

  return { success: true }
})
