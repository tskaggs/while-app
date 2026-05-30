import type { WebhookEnvelope } from './types'

const CLINICAL_EVENTS = new Set([
  'patient.created',
  'patient.updated',
  'patient.admitted',
  'patient.discharged',
  'encounter.created',
  'observation.created'
])

const TUNNEL_EVENTS = new Set([
  'tunnel.connected',
  'tunnel.disconnected',
  'tunnel.handshake',
  'tunnel.health',
  'tunnel.latency',
  'tunnel.reconnect'
])

export function isClinicalEvent(event: string) {
  return CLINICAL_EVENTS.has(event)
}

export function isTunnelEvent(event: string) {
  return TUNNEL_EVENTS.has(event) || event.startsWith('tunnel.')
}

export function mapTunnelEventType(event: string): string {
  if (event === 'tunnel.connected') return 'handshake'
  if (event === 'tunnel.disconnected') return 'disconnect'
  if (event === 'tunnel.reconnect') return 'reconnect'
  if (event === 'tunnel.latency') return 'latency'
  if (event === 'tunnel.health') return 'health'
  if (event === 'tunnel.handshake') return 'handshake'
  return 'health'
}

export function tunnelSeverity(event: string): 'info' | 'warn' | 'error' | 'success' {
  if (event === 'tunnel.disconnected') return 'warn'
  if (event === 'tunnel.reconnect') return 'success'
  if (event === 'tunnel.latency') return 'warn'
  return 'info'
}

export function clinicalMessageType(event: string): string {
  const map: Record<string, string> = {
    'patient.created': 'ADT^A04',
    'patient.updated': 'ADT^A08',
    'patient.admitted': 'ADT^A01',
    'patient.discharged': 'ADT^A03',
    'encounter.created': 'ORM^O01',
    'observation.created': 'ORU^R01'
  }
  return map[event] ?? event
}

export function buildMessageSummary(envelope: WebhookEnvelope): string {
  const resource = envelope.resource
  const resourceType = typeof resource?.resourceType === 'string' ? resource.resourceType : 'Resource'
  const resourceId = typeof resource?.id === 'string' ? resource.id : 'unknown'
  return `${envelope.event} — ${resourceType}/${resourceId}`
}

export function anonymizeSummary(summary: string, partnerName: string): string {
  return summary
    .replace(new RegExp(partnerName, 'gi'), '[Partner]')
    .replace(/pat_[a-z0-9_]+/gi, 'pat_[REDACTED]')
}
