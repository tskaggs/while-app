import { requireMachineOrgOrPat } from '../../utils/machineAuth'
import { loadOrgSandboxProfile } from '../../utils/connectionMapping'

export default defineEventHandler(async (event) => {
  const { machineOrgId } = await requireMachineOrgOrPat(event, ['mapping:read'])
  const profile = await loadOrgSandboxProfile(machineOrgId)
  return { profile }
})
