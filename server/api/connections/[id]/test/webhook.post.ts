import { requireMachineOrg } from '../../../../utils/authSession'
import { defaultPatientId } from '../../../../utils/provisionOrg'
import {
  assertConnectionAccess,
  isSandboxTestConnection,
  readSandboxApiKeyFromEvent,
  resolveTestApiKey
} from '../../../../utils/connectionTest'
import { getLatestWebhookDelivery } from '../../../../utils/webhookDelivery'
import { loadConnectionWebhookConfig } from '../../../../utils/connectionWebhook'
import { getRecentWebhookEvents, getLatestProcessedMessage } from '../../../../utils/telemetry/ingestWebhook'
import { fetchWhileApi } from '../../../../utils/whileApiFetch'

const MOCK_TRIGGER = {
  status: 'accepted',
  event: 'patient.admitted',
  patient_id: 'pat_mock0001_01',
  connection_id: 'conn-sa-mock0001'
}

const MOCK_RECEIVED = [{
  id: 'wh_mock_001',
  event: 'patient.admitted',
  connectionId: 'conn-sa-mock0001',
  receivedAt: new Date().toISOString(),
  payload: { event: 'patient.admitted', connection_id: 'conn-sa-mock0001' }
}]

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const connectionId = getRouterParam(event, 'id')

  if (!connectionId) {
    throw createError({ statusCode: 400, message: 'Connection id is required' })
  }

  const body = await readBody<{ event?: string, patient_id?: string, apiKey?: string }>(event)
  const providedKey = body?.apiKey ?? readSandboxApiKeyFromEvent(event)

  if (config.public.mockMode) {
    return {
      status: 202,
      body: {
        trigger: { ...MOCK_TRIGGER, connection_id: connectionId },
        delivery: {
          success: true,
          statusCode: 200,
          errorMessage: null,
          webhookUrl: null
        },
        received: MOCK_RECEIVED.map(item => ({
          ...item,
          connectionId,
          payload: { ...item.payload, connection_id: connectionId }
        })),
        message: {
          id: 'mock-message-001',
          connectionId,
          summary: 'Patient admitted (mock)',
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  const { machineOrgId } = await requireMachineOrg(event)
  const connection = await assertConnectionAccess(machineOrgId, connectionId)

  if (!isSandboxTestConnection(connection)) {
    throw createError({
      statusCode: 403,
      message: 'Webhook trigger tests are only available for sandbox connections.'
    })
  }

  const apiKey = await resolveTestApiKey(event, machineOrgId, connectionId, providedKey)

  const patientId = body?.patient_id ?? defaultPatientId(machineOrgId, 1)
  const webhookEvent = body?.event ?? 'patient.admitted'
  const apiUrl = config.whileApiUrl || 'http://localhost:8000'

  const { resolved } = await loadConnectionWebhookConfig(machineOrgId, connection.id)
  const triggerStartedAt = new Date()

  const res = await fetchWhileApi(`${apiUrl}/v1/webhooks/trigger-mock-event`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ event: webhookEvent, patient_id: patientId })
  })

  const responseBody = res.ok ? await res.json() : await res.text()

  if (!res.ok) {
    throw createError({
      statusCode: res.status,
      message: typeof responseBody === 'string' ? responseBody : 'Webhook trigger failed'
    })
  }

  await new Promise(resolve => setTimeout(resolve, 2000))

  const delivery = await getLatestWebhookDelivery(machineOrgId, webhookEvent)
  const triggerConnectionId = typeof responseBody === 'object'
    && responseBody !== null
    && 'connection_id' in responseBody
    && typeof (responseBody as { connection_id?: string }).connection_id === 'string'
    ? (responseBody as { connection_id: string }).connection_id
    : connection.id

  const received = delivery?.success
    ? await getRecentWebhookEvents(machineOrgId, 5, triggerStartedAt)
    : []

  const message = delivery?.success
    ? await getLatestProcessedMessage(machineOrgId, triggerConnectionId)
    : null

  return {
    status: res.status,
    body: {
      trigger: responseBody,
      delivery: delivery
        ? {
            success: delivery.success,
            statusCode: delivery.statusCode,
            errorMessage: delivery.errorMessage,
            webhookUrl: resolved.webhookUrl,
            urlSource: resolved.urlSource
          }
        : {
            success: false,
            statusCode: null,
            errorMessage: 'No delivery record found — check ultra-a logs',
            webhookUrl: resolved.webhookUrl,
            urlSource: resolved.urlSource
          },
      received,
      message
    }
  }
})
