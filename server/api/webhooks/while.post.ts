import { createHmac, timingSafeEqual } from 'crypto'
import { prisma } from '../../lib/prisma'
import { storeWebhookEvent } from '../../utils/webhookEvents'

export default defineEventHandler(async (event) => {
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

  const settings = await prisma.sandboxSettings.findUnique({ where: { orgId } })
  if (!settings?.webhookSecret) {
    throw createError({ statusCode: 422, message: 'Webhook secret not configured' })
  }

  let signatureValid = false
  if (signature) {
    const expected = createHmac('sha256', settings.webhookSecret)
      .update(rawBody)
      .digest('hex')
    try {
      signatureValid = timingSafeEqual(
        Buffer.from(expected, 'utf8'),
        Buffer.from(signature, 'utf8')
      )
    } catch {
      signatureValid = false
    }
  }

  if (!signatureValid) {
    throw createError({ statusCode: 401, message: 'Invalid webhook signature' })
  }

  storeWebhookEvent(orgId, {
    event: eventType,
    payload,
    signatureValid: true
  })

  return { received: true }
})
