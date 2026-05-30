export interface WebhookEnvelope {
  event: string
  resource?: Record<string, unknown>
  connection_id: string
  environment: 'sandbox' | 'live'
  timestamp: string
  org_id: string
  method?: string
  path?: string
  status_code?: number
  latency_ms?: number
}

export interface IngestContext {
  orgId: string
  connectionId: string
  partnerName: string
  environment: 'sandbox' | 'live'
  correlationId: string
  event: string
  envelope: WebhookEnvelope
  receivedAt: Date
}
