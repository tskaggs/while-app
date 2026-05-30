import type {
  IntegrationLog,
  ProcessedMessage,
  TunnelIncident,
  TunnelLog
} from '@prisma/client'
import type {
  IncidentReport,
  LogEntry,
  ProcessedMessage as UiProcessedMessage,
  TunnelLogEntry
} from '~/types/while'

export function toProcessedMessage(row: ProcessedMessage): UiProcessedMessage {
  return {
    id: row.id,
    timestamp: row.timestamp.toISOString(),
    connectionId: row.connectionId,
    partnerName: row.partnerName,
    direction: row.direction as UiProcessedMessage['direction'],
    format: row.format as UiProcessedMessage['format'],
    messageType: row.messageType,
    resourceType: row.resourceType ?? undefined,
    status: row.status as UiProcessedMessage['status'],
    summary: row.summary
  }
}

export function toLogEntry(row: IntegrationLog): LogEntry {
  return {
    id: row.id,
    timestamp: row.timestamp.toISOString(),
    connectionId: row.connectionId,
    partnerName: row.partnerName,
    severity: row.severity as LogEntry['severity'],
    category: row.category as LogEntry['category'],
    message: row.message,
    anonymizedMessage: row.anonymizedMessage,
    resourceType: row.resourceType ?? undefined,
    eventType: row.eventType ?? undefined,
    hl7MessageType: row.hl7MessageType ?? undefined,
    correlationId: row.correlationId ?? undefined,
    durationMs: row.durationMs ?? undefined,
    statusCode: row.statusCode ?? undefined,
    actor: row.actor ?? undefined,
    ipAddress: row.ipAddress ?? undefined,
    source: row.source ?? undefined,
    details: row.details ?? undefined,
    metadata: row.metadata as Record<string, string | number | boolean> | undefined
  }
}

export function toTunnelLogEntry(row: TunnelLog): TunnelLogEntry {
  return {
    id: row.id,
    timestamp: row.timestamp.toISOString(),
    connectionId: row.connectionId,
    partnerName: row.partnerName,
    severity: row.severity as TunnelLogEntry['severity'],
    eventType: row.eventType as TunnelLogEntry['eventType'],
    message: row.message,
    incidentId: row.incidentId ?? undefined
  }
}

export function toIncidentReport(row: TunnelIncident): IncidentReport {
  return {
    id: row.id,
    connectionId: row.connectionId,
    partnerName: row.partnerName,
    title: row.title,
    summary: row.summary,
    severity: row.severity as IncidentReport['severity'],
    status: row.status as IncidentReport['status'],
    startedAt: row.startedAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString(),
    relatedLogIds: row.relatedLogIds
  }
}
