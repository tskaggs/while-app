import { requireMachineOrgOrPat } from '../../utils/machineAuth'
import { upsertOrgSandboxProfile } from '../../utils/connectionMapping'

export default defineEventHandler(async (event) => {
  const { machineOrgId } = await requireMachineOrgOrPat(event, ['mapping:write'])
  const body = await readBody<{
    ehrVendor?: string
    dataFormat?: string
    resourceTypes?: string[]
  }>(event)

  const profile = await upsertOrgSandboxProfile(machineOrgId, body ?? {})
  return { profile }
})
