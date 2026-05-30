import { requireMachineOrg } from '../../utils/authSession'
import { defaultPatientId, orgShortId } from '../../utils/provisionOrg'
import { readSandboxApiKeyFromEvent, resolveTestApiKey } from '../../utils/connectionTest'
import { fetchWhileApi } from '../../utils/whileApiFetch'

export default defineEventHandler(async (event) => {
  const { machineOrgId } = await requireMachineOrg(event)
  const config = useRuntimeConfig()

  const apiKey = await resolveTestApiKey(event, machineOrgId, readSandboxApiKeyFromEvent(event))

  const patientId = defaultPatientId(machineOrgId, 1)
  const apiUrl = config.whileApiUrl || 'http://localhost:8000'

  const res = await fetchWhileApi(`${apiUrl}/v1/patients/${patientId}`, {
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

  const catalogRes = await fetchWhileApi(`${apiUrl}/v1/sandbox/catalog`, {
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
