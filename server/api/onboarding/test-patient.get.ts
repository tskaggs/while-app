import { requireMachineOrg } from '../../utils/authSession'
import { defaultPatientId, orgShortId } from '../../utils/provisionOrg'
import { resolveSandboxApiKey } from '../../utils/resolveSandboxApiKey'

export default defineEventHandler(async (event) => {
  const { machineOrgId } = await requireMachineOrg(event)
  const config = useRuntimeConfig()
  const providedKey = getHeader(event, 'x-sandbox-api-key')

  const apiKey = await resolveSandboxApiKey(machineOrgId, providedKey)
  if (!apiKey) {
    throw createError({
      statusCode: 400,
      message: 'Sandbox API key not available. Return to step 2 and copy your key, then try again.'
    })
  }

  const patientId = defaultPatientId(machineOrgId, 1)
  const apiUrl = config.whileApiUrl || 'http://localhost:8000'

  const res = await fetch(`${apiUrl}/v1/patients/${patientId}`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  })

  if (!res.ok) {
    const detail = await res.text()
    throw createError({
      statusCode: res.status,
      message: `API test failed: ${detail}`
    })
  }

  const patient = await res.json()

  const catalogRes = await fetch(`${apiUrl}/v1/sandbox/catalog`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  })

  const catalog = catalogRes.ok ? await catalogRes.json() : null

  return {
    patientId,
    orgShortId: orgShortId(machineOrgId),
    patient,
    catalog
  }
})
