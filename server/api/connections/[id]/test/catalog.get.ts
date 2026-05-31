import { requireMachineOrg } from '../../../../utils/authSession'
import {
  assertConnectionAccess,
  isSandboxTestConnection,
  isSystemSandboxConnection,
  resolveTestApiKey
} from '../../../../utils/connectionTest'
import { fetchWhileApi } from '../../../../utils/whileApiFetch'

const MOCK_CATALOG = {
  version: '2026-05-01',
  patients: [
    { id: 'pat_mock0001_01', name: 'Alex Rivera', mrn: 'MRN-1001' },
    { id: 'pat_mock0001_02', name: 'Jordan Lee', mrn: 'MRN-1002' }
  ],
  events: ['patient.admitted', 'patient.discharged', 'observation.created']
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
      body: MOCK_CATALOG
    }
  }

  const { machineOrgId } = await requireMachineOrg(event)
  const connection = await assertConnectionAccess(machineOrgId, connectionId)

  if (!isSandboxTestConnection(connection)) {
    throw createError({
      statusCode: 403,
      message: 'Catalog tests are only available for sandbox connections.'
    })
  }

  const apiKey = await resolveTestApiKey(event, machineOrgId, connectionId)
  const apiUrl = config.whileApiUrl || 'http://localhost:8000'

  const res = await fetchWhileApi(
    `${apiUrl}/v1/sandbox/catalog?connection_id=${encodeURIComponent(connectionId)}`,
    {
      headers: { Authorization: `Bearer ${apiKey}` }
    }
  )

  const body = res.ok ? await res.json() : await res.text()

  if (!res.ok) {
    throw createError({
      statusCode: res.status,
      message: typeof body === 'string' ? body : 'Catalog request failed'
    })
  }

  return { status: res.status, body }
})
