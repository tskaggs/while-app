import type { H3Event } from 'h3'

const events = new Map<string, Array<{
  id: string
  receivedAt: string
  event: string
  payload: unknown
  signatureValid: boolean
}>>()

const MAX_EVENTS = 20

export function storeWebhookEvent(orgId: string, data: {
  event: string
  payload: unknown
  signatureValid: boolean
}) {
  const list = events.get(orgId) ?? []
  list.unshift({
    id: crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
    event: data.event,
    payload: data.payload,
    signatureValid: data.signatureValid
  })
  events.set(orgId, list.slice(0, MAX_EVENTS))
}

export function getWebhookEvents(orgId: string) {
  return events.get(orgId) ?? []
}

export function getOrgIdFromWebhookEvent(_event: H3Event) {
  return null as string | null
}
