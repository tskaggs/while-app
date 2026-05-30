import { requireMachineOrg } from '../../utils/authSession'
import { loadOrgSandboxProfile } from '../../utils/connectionMapping'

export default defineEventHandler(async (event) => {
  const { machineOrgId } = await requireMachineOrg(event)
  const profile = await loadOrgSandboxProfile(machineOrgId)
  return { profile }
})
