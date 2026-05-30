import { requireMachineOrg } from '../../utils/authSession'
import { prisma } from '../../lib/prisma'
import { defaultConnectionId, defaultPatientId } from '../../utils/provisionOrg'
import { readSandboxApiKeyFromEvent, resolveTestApiKey } from '../../utils/connectionTest'
import { getLatestWebhookDelivery } from '../../utils/webhookDelivery'
import { getRecentWebhookEvents, getLatestProcessedMessage } from '../../utils/telemetry/ingestWebhook'
import { fetchWhileApi } from '../../utils/whileApiFetch'

export default defineEventHandler(async (event) => {
  const { machineOrgId } = await requireMachineOrg(event)
  const config = useRuntimeConfig()
  const body = await readBody<{ event?: string, patient_id?: string, apiKey?: string }>(event)
  const providedKey = body?.apiKey ?? readSandboxApiKeyFromEvent(event)

  const apiKey = await resolveTestApiKey(event, machineOrgId, providedKey)

  const patientId = body?.patient_id ?? defaultPatientId(machineOrgId, 1)
  const webhookEvent = body?.event ?? 'patient.admitted'
  const apiUrl = config.whileApiUrl || 'http://localhost:8000'

  const settings = await prisma.sandboxSettings.findUnique({ where: { orgId: machineOrgId } })
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
    : defaultConnectionId(machineOrgId)

  const received = delivery?.success
    ? await getRecentWebhookEvents(machineOrgId, 5, triggerStartedAt)
    : []

  const message = delivery?.success
    ? await getLatestProcessedMessage(machineOrgId, triggerConnectionId)
    : null

  return {
    trigger: responseBody,
    delivery: delivery
      ? {
          success: delivery.success,
          statusCode: delivery.statusCode,
          errorMessage: delivery.errorMessage,
          webhookUrl: settings?.webhookUrl ?? null
        }
      : {
          success: false,
          statusCode: null,
          errorMessage: 'No delivery record found — check ultra-a logs',
          webhookUrl: settings?.webhookUrl ?? null
        },
    received,
    message
  }
})
