import { requireMachineOrg } from '../../utils/authSession'
import { upsertOrgSandboxProfile } from '../../utils/connectionMapping'

export default defineEventHandler(async (event) => {
  const { machineOrgId } = await requireMachineOrg(event)
  const body = await readBody<{
    ehrVendor?: string
    dataFormat?: string
    resourceTypes?: string[]
  }>(event)

  const profile = await upsertOrgSandboxProfile(machineOrgId, body ?? {})
  return { profile }
})
