export type WhileEnvironment = 'sandbox' | 'live'

export type EhrVendor = 'Epic' | 'Cerner' | 'Meditech' | 'Athena' | 'Other'

export type TunnelStatus = 'active' | 'pending' | 'error'

export type SupportRequestStatus = 'submitted' | 'in_review' | 'in_progress' | 'completed'

export type LogSeverity = 'info' | 'warn' | 'error' | 'success'

export type LogTimeRange = '1h' | '6h' | '24h' | 'all'

export type LogCategory =
  | 'integration'
  | 'tunnel'
  | 'webhook'
  | 'mapping'
  | 'credential'
  | 'sidecar'
  | 'api'
  | 'audit'
  | 'system'

export interface FlightCheck {
  mtu: boolean
  handshake: boolean
  hl7Ack: boolean
}

export interface Connection {
  id: string
  partnerName: string
  ehrVendor: EhrVendor
  environment: WhileEnvironment
  sidecarId: string
  tunnelStatus: TunnelStatus
  wireguardPublicKey: string
  ehrEndpoint: string
  lastSyncAt: string
  flightCheck: FlightCheck
  region: string
  messagesProcessed24h: number
}

export interface UsageStat {
  title: string
  icon: string
  value: string | number
  variation: number
  description?: string
  to?: string
}

export interface UsageDataPoint {
  date: string
  messages: number
  fhirResources: number
  uptime: number
  byConnection: Record<string, number>
}

export interface LogEntry {
  id: string
  timestamp: string
  connectionId: string
  partnerName: string
  severity: LogSeverity
  category: LogCategory
  resourceType?: string
  message: string
  anonymizedMessage: string
  eventType?: string
  hl7MessageType?: string
  correlationId?: string
  durationMs?: number
  statusCode?: number
  actor?: string
  ipAddress?: string
  source?: string
  details?: string
  metadata?: Record<string, string | number | boolean>
}

export interface SupportRequest {
  id: string
  partnerName: string
  ehrVendor: EhrVendor
  environment: WhileEnvironment
  status: SupportRequestStatus
  submittedAt: string
  targetGoLive: string
}

export interface ComplianceChecklistItem {
  id: string
  label: string
  description: string
  status: 'pass' | 'pending' | 'fail'
}

export interface AuditLogEntry {
  id: string
  timestamp: string
  actor: string
  action: string
  resource: string
  ipAddress: string
}

export interface ComplianceData {
  baaStatus: 'signed' | 'pending' | 'expired'
  baaSignedAt?: string
  baaExpiresAt?: string
  checklist: ComplianceChecklistItem[]
  auditLog: AuditLogEntry[]
}

export interface SupportRequestForm {
  partnerName: string
  ehrVendor: EhrVendor
  contactEmail: string
  targetGoLive: string
  scope: 'read' | 'write' | 'read_write'
  resourceTypes: string[]
  dataFormat: 'fhir' | 'hl7' | 'both'
  environment: WhileEnvironment
  estimatedVolume: string
  notes: string
}

export type SupportTicketCategory = 'general' | 'billing' | 'connection'

export interface SupportTicketForm {
  category: SupportTicketCategory
  connectionId?: string
  message: string
}

export interface SupportTicket {
  id: string
  category: SupportTicketCategory
  connectionId?: string
  partnerName?: string
  message: string
  status: SupportRequestStatus
  submittedAt: string
}

export type SupportInboxKind = 'connection' | 'ticket'

export interface SupportInboxItem {
  key: string
  id: string
  kind: SupportInboxKind
  title: string
  preview: string
  status: SupportRequestStatus
  environment?: WhileEnvironment
  submittedAt: string
  ehrVendor?: EhrVendor
  targetGoLive?: string
  category?: SupportTicketCategory
  message?: string
  connectionId?: string
}

export type Period = 'daily' | 'weekly' | 'monthly'

export interface Range {
  start: Date
  end: Date
}

export type MessageDirection = 'inbound' | 'outbound'

export type MessageFormat = 'hl7' | 'fhir'

export type MessageStatus = 'success' | 'failed' | 'pending'

export type MessageGranularity = 'hour' | 'minute'

export interface ProcessedMessage {
  id: string
  timestamp: string
  connectionId: string
  partnerName: string
  direction: MessageDirection
  format: MessageFormat
  messageType: string
  resourceType?: string
  status: MessageStatus
  summary: string
}

export interface MessageHistogramBucket {
  label: string
  bucketStart: string
  counts: Record<string, number>
}

export type TunnelEventType = 'handshake' | 'disconnect' | 'reconnect' | 'latency' | 'credential' | 'health' | 'ack'

export type TunnelUptimeGranularity = 'hour' | 'minute'

export type IncidentSeverity = 'critical' | 'major' | 'minor'

export type IncidentStatus = 'open' | 'investigating' | 'resolved'

export interface TunnelLogEntry {
  id: string
  timestamp: string
  connectionId: string
  partnerName: string
  severity: LogSeverity
  eventType: TunnelEventType
  message: string
  incidentId?: string
}

export interface TunnelUptimeBucket {
  label: string
  bucketStart: string
  uptime: Record<string, number>
}

export interface IncidentReport {
  id: string
  connectionId: string
  partnerName: string
  title: string
  summary: string
  severity: IncidentSeverity
  status: IncidentStatus
  startedAt: string
  resolvedAt?: string
  relatedLogIds: string[]
}

export interface IncidentMessage {
  id: string
  incidentId: string
  author: string
  timestamp: string
  body: string
}
