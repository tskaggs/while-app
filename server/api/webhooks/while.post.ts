import { createHmac, timingSafeEqual } from 'crypto'
import { prisma } from '../../lib/prisma'
import { ingestWebhookEnvelope } from '../../utils/telemetry/ingestWebhook'
import { resolveEffectiveWebhookSecret } from '../../utils/webhookResolve'

function verifyWebhookSignature(rawBody: Buffer, webhookSecret: string, signatureHeader: string | undefined) {
  if (!signatureHeader) return { valid: false, reason: 'missing_signature' as const }

  const expected = createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex')

  try {
    const valid = expected.length === signatureHeader.length
      && timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(signatureHeader, 'utf8'))
    return valid
      ? { valid: true as const }
      : { valid: false as const, reason: 'invalid_signature' as const }
  } catch {
    return { valid: false, reason: 'invalid_signature' as const }
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const rawBody = await readRawBody(event, false)
  if (!rawBody) {
    throw createError({ statusCode: 400, message: 'Empty body' })
  }

  const signature = getHeader(event, 'x-while-signature')
  const eventType = getHeader(event, 'x-while-event') ?? 'unknown'

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody.toString('utf8'))
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid JSON' })
  }

  const orgId = typeof payload.org_id === 'string' ? payload.org_id : null
  if (!orgId) {
    throw createError({ statusCode: 400, message: 'Missing org_id in payload' })
  }

  const connectionId = typeof payload.connection_id === 'string' ? payload.connection_id : ''

  const [settings, connection] = await Promise.all([
    prisma.sandboxSettings.findUnique({ where: { orgId } }),
    connectionId
      ? prisma.dashboardConnection.findFirst({
          where: { id: connectionId, orgId }
        })
      : Promise.resolve(null)
  ])

  const webhookSecret = resolveEffectiveWebhookSecret(
    settings?.webhookSecret,
    connection?.webhookSecret
  )

  if (!webhookSecret) {
    throw createError({ statusCode: 422, message: 'Webhook secret not configured' })
  }

  const verification = verifyWebhookSignature(rawBody, webhookSecret, signature)
  if (!verification.valid) {
    if (config.public.mockMode !== true && process.env.NODE_ENV !== 'production') {
      console.warn('[webhook/while] signature rejected:', verification.reason, { orgId, connectionId })
    }
    throw createError({
      statusCode: 401,
      message: verification.reason === 'missing_signature'
        ? 'Missing X-While-Signature header'
        : 'Invalid webhook signature'
    })
  }

  const envelope = {
    event: eventType,
    resource: payload.resource as Record<string, unknown> | undefined,
    connection_id: connectionId,
    environment: (payload.environment === 'live' ? 'live' : 'sandbox') as 'sandbox' | 'live',
    timestamp: String(payload.timestamp ?? new Date().toISOString()),
    org_id: orgId,
    method: typeof payload.method === 'string' ? payload.method : undefined,
    path: typeof payload.path === 'string' ? payload.path : undefined,
    status_code: typeof payload.status_code === 'number' ? payload.status_code : undefined,
    latency_ms: typeof payload.latency_ms === 'number' ? payload.latency_ms : undefined
  }

  await ingestWebhookEnvelope(envelope)

  return { received: true }
})
