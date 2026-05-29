import { requireMachineOrg } from '../../utils/authSession'
import { defaultPatientId } from '../../utils/provisionOrg'
import { resolveSandboxApiKey } from '../../utils/resolveSandboxApiKey'
import { getWebhookEvents } from '../../utils/webhookEvents'

export default defineEventHandler(async (event) => {
  const { machineOrgId } = await requireMachineOrg(event)
  const config = useRuntimeConfig()
  const body = await readBody<{ event?: string, patient_id?: string, apiKey?: string }>(event)
  const providedKey = body?.apiKey ?? getHeader(event, 'x-sandbox-api-key')

  const apiKey = await resolveSandboxApiKey(machineOrgId, providedKey)
  if (!apiKey) {
    throw createError({
      statusCode: 400,
      message: 'Sandbox API key not available for webhook test.'
    })
  }

  const patientId = body?.patient_id ?? defaultPatientId(machineOrgId, 1)
  const webhookEvent = body?.event ?? 'patient.admitted'
  const apiUrl = config.whileApiUrl || 'http://localhost:8000'

  const res = await fetch(`${apiUrl}/v1/webhooks/trigger-mock-event`, {
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

  await new Promise(resolve => setTimeout(resolve, 1500))

  const received = getWebhookEvents(machineOrgId)

  return {
    trigger: responseBody,
    received
  }
})
