export interface ConnectionTestSnippetContext {
  apiBaseUrl: string
  connectionId: string
  samplePatientId: string
  apiKey?: string
}

export interface EndpointSnippets {
  curl: string
  typescript: string
}

const PLACEHOLDER_KEY = 'wh_test_your_key'

function resolveKey(apiKey?: string) {
  return apiKey?.trim() || PLACEHOLDER_KEY
}

export function useConnectionTestSnippets(context: Ref<ConnectionTestSnippetContext>) {
  const catalogSnippets = computed<EndpointSnippets>(() => {
    const { apiBaseUrl, connectionId, apiKey } = context.value
    const key = resolveKey(apiKey)
    return {
      curl: `# connection_id: ${connectionId}
curl -s -H "Authorization: Bearer ${key}" \\
  ${apiBaseUrl}/v1/sandbox/catalog | jq .`,
      typescript: `// connection_id: ${connectionId}
const res = await fetch("${apiBaseUrl}/v1/sandbox/catalog", {
  headers: { Authorization: "Bearer ${key}" },
});
const catalog = await res.json();`
    }
  })

  const patientSnippets = computed<EndpointSnippets>(() => {
    const { apiBaseUrl, connectionId, samplePatientId, apiKey } = context.value
    const key = resolveKey(apiKey)
    return {
      curl: `# connection_id: ${connectionId}
curl -s -H "Authorization: Bearer ${key}" \\
  ${apiBaseUrl}/v1/patients/${samplePatientId} | jq .`,
      typescript: `// connection_id: ${connectionId}
const res = await fetch("${apiBaseUrl}/v1/patients/${samplePatientId}", {
  headers: { Authorization: "Bearer ${key}" },
});
const patient = await res.json();`
    }
  })

  const webhookTriggerSnippets = computed(() => {
    const { apiBaseUrl, connectionId, samplePatientId, apiKey } = context.value
    const key = resolveKey(apiKey)
    const curl = `# connection_id: ${connectionId}
curl -s -X POST \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{"event":"patient.admitted","patient_id":"${samplePatientId}"}' \\
  ${apiBaseUrl}/v1/webhooks/trigger-mock-event | jq .`
    const typescript = `// connection_id: ${connectionId}
await fetch("${apiBaseUrl}/v1/webhooks/trigger-mock-event", {
  method: "POST",
  headers: {
    Authorization: "Bearer ${key}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    event: "patient.admitted",
    patient_id: "${samplePatientId}",
  }),
});`
    return { curl, typescript }
  })

  const webhookVerifySnippet = computed(() => {
    const { connectionId } = context.value
    return `import { createHmac, timingSafeEqual } from 'crypto'

const webhookSecret = process.env.WHILE_WEBHOOK_SECRET!

export function verifyWhileWebhook(rawBody: Buffer, signature: string) {
  const expected = createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex')

  const sigBuffer = Buffer.from(signature, 'hex')
  const expectedBuffer = Buffer.from(expected, 'hex')

  if (sigBuffer.length !== expectedBuffer.length) return false
  if (!timingSafeEqual(sigBuffer, expectedBuffer)) return false

  const payload = JSON.parse(rawBody.toString('utf8'))
  // Expect connection_id "${connectionId}" for this connection's events
  if (payload.connection_id !== '${connectionId}') {
    throw new Error('Unexpected connection_id')
  }

  return payload
}`
  })

  return {
    catalogSnippets,
    patientSnippets,
    webhookTriggerSnippets,
    webhookVerifySnippet
  }
}
