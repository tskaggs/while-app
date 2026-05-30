import { requireMachineOrg } from '../../../../utils/authSession'
import { orgShortId } from '../../../../utils/provisionOrg'
import {
  assertConnectionAccess,
  isSystemSandboxConnection,
  resolveTestApiKey,
  samplePatientIdForOrg
} from '../../../../utils/connectionTest'
import { fetchWhileApi } from '../../../../utils/whileApiFetch'

const MOCK_PATIENT = {
  resourceType: 'Patient',
  id: 'pat_mock0001_01',
  name: [{ family: 'Rivera', given: ['Alex'] }],
  gender: 'unknown',
  birthDate: '1985-03-12'
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const connectionId = getRouterParam(event, 'id')

  if (!connectionId) {
    throw createError({ statusCode: 400, message: 'Connection id is required' })
  }

  if (config.public.mockMode) {
    return {
      status: 200,
      body: {
        patientId: 'pat_mock0001_01',
        orgShortId: 'mock0001',
        patient: MOCK_PATIENT,
        catalog: null
      }
    }
  }

  const { machineOrgId } = await requireMachineOrg(event)
  const connection = await assertConnectionAccess(machineOrgId, connectionId)

  if (!isSystemSandboxConnection(connection)) {
    throw createError({
      statusCode: 403,
      message: 'Patient tests are only available for the While Sandbox connection.'
    })
  }

  const apiKey = await resolveTestApiKey(event, machineOrgId)
  const patientId = samplePatientIdForOrg(machineOrgId)
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
    status: res.status,
    body: {
      patientId,
      orgShortId: orgShortId(machineOrgId),
      patient,
      catalog
    }
  }
})
