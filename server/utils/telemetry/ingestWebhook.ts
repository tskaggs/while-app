import { randomUUID } from 'crypto'
import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import {
  anonymizeSummary,
  buildMessageSummary,
  clinicalMessageType,
  isClinicalEvent,
  isTunnelEvent,
  mapTunnelEventType,
  tunnelSeverity
} from './mappers'
import type { IngestContext, WebhookEnvelope } from './types'

function parseTimestamp(value: string | undefined): Date {
  if (!value) return new Date()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

async function upsertDailyRollup(
  tx: Prisma.TransactionClient,
  orgId: string,
  connectionId: string,
  environment: string,
  at: Date,
  delta: { messages?: number, fhir?: number, tunnel?: number, uptimeDelta?: number }
) {
  const date = startOfUtcDay(at)
  const existing = await tx.dailyMetricRollup.findUnique({
    where: {
      orgId_connectionId_environment_date: {
        orgId,
        connectionId,
        environment,
        date
      }
    }
  })

  if (existing) {
    const tunnelEvents = existing.tunnelEvents + (delta.tunnel ?? 0)
    const disconnectPenalty = delta.tunnel && delta.uptimeDelta ? delta.uptimeDelta : 0
    await tx.dailyMetricRollup.update({
      where: { id: existing.id },
      data: {
        messageCount: existing.messageCount + (delta.messages ?? 0),
        fhirResources: existing.fhirResources + (delta.fhir ?? 0),
        tunnelEvents,
        uptimePct: Math.max(0, Math.min(100, existing.uptimePct + disconnectPenalty))
      }
    })
    return
  }

  await tx.dailyMetricRollup.create({
    data: {
      orgId,
      connectionId,
      environment,
      date,
      messageCount: delta.messages ?? 0,
      fhirResources: delta.fhir ?? 0,
      tunnelEvents: delta.tunnel ?? 0,
      uptimePct: 100 + (delta.uptimeDelta ?? 0)
    }
  })
}

async function updateConnectionRuntime(
  tx: Prisma.TransactionClient,
  connectionId: string,
  orgId: string,
  at: Date,
  tunnelStatus?: string
) {
  const since24h = new Date(at.getTime() - 86400000)
  const count24h = await tx.processedMessage.count({
    where: {
      orgId,
      connectionId,
      timestamp: { gte: since24h }
    }
  })

  await tx.dashboardConnection.updateMany({
    where: { id: connectionId, orgId },
    data: {
      lastSyncAt: at,
      messagesProcessed24h: count24h,
      ...(tunnelStatus ? { tunnelStatus } : {})
    }
  })
}

async function handleTunnelIncident(
  tx: Prisma.TransactionClient,
  ctx: IngestContext,
  tunnelLogId: string
) {
  if (ctx.event === 'tunnel.disconnected') {
    const incident = await tx.tunnelIncident.create({
      data: {
        orgId: ctx.orgId,
        connectionId: ctx.connectionId,
        partnerName: ctx.partnerName,
        environment: ctx.environment,
        title: 'WireGuard tunnel disconnected',
        summary: 'Simulated sidecar lost WireGuard handshake with clinic endpoint.',
        severity: 'minor',
        status: 'investigating',
        startedAt: ctx.receivedAt,
        relatedLogIds: [tunnelLogId]
      }
    })
    await tx.tunnelLog.update({
      where: { id: tunnelLogId },
      data: { incidentId: incident.id }
    })
    await tx.dashboardConnection.updateMany({
      where: { id: ctx.connectionId, orgId: ctx.orgId },
      data: { tunnelStatus: 'error' }
    })
    return
  }

  if (ctx.event === 'tunnel.reconnect' || ctx.event === 'tunnel.connected') {
    const open = await tx.tunnelIncident.findFirst({
      where: {
        orgId: ctx.orgId,
        connectionId: ctx.connectionId,
        environment: ctx.environment,
        status: { in: ['open', 'investigating'] }
      },
      orderBy: { startedAt: 'desc' }
    })
    if (open) {
      await tx.tunnelIncident.update({
        where: { id: open.id },
        data: {
          status: 'resolved',
          resolvedAt: ctx.receivedAt,
          relatedLogIds: [...open.relatedLogIds, tunnelLogId]
        }
      })
    }
    await tx.dashboardConnection.updateMany({
      where: { id: ctx.connectionId, orgId: ctx.orgId },
      data: { tunnelStatus: 'active' }
    })
  }
}

export async function ingestWebhookEnvelope(envelope: WebhookEnvelope) {
  const orgId = envelope.org_id
  const connectionId = envelope.connection_id
  const environment = envelope.environment
  const event = envelope.event
  const receivedAt = parseTimestamp(envelope.timestamp)
  const correlationId = randomUUID()

  const connection = await prisma.dashboardConnection.findFirst({
    where: { id: connectionId, orgId }
  })
  const partnerName = connection?.name ?? 'While Sandbox'

  const ctx: IngestContext = {
    orgId,
    connectionId,
    partnerName,
    environment,
    correlationId,
    event,
    envelope,
    receivedAt
  }

  await prisma.$transaction(async (tx) => {
    const summary = buildMessageSummary(envelope)
    const anonSummary = anonymizeSummary(summary, partnerName)
    const resourceType = typeof envelope.resource?.resourceType === 'string'
      ? envelope.resource.resourceType
      : undefined

    await tx.integrationLog.create({
      data: {
        orgId,
        connectionId,
        partnerName,
        environment,
        timestamp: receivedAt,
        severity: 'success',
        category: 'webhook',
        message: `Webhook received: ${event}`,
        anonymizedMessage: `Webhook received: ${event}`,
        resourceType,
        eventType: event,
        correlationId,
        source: 'while-control-plane',
        metadata: { envelopeEvent: event }
      }
    })

    if (event === 'api.request') {
      const method = envelope.method ?? 'GET'
      const path = envelope.path ?? '/v1/patients'
      const statusCode = envelope.status_code ?? 200
      const latencyMs = envelope.latency_ms ?? 0

      await tx.processedMessage.create({
        data: {
          orgId,
          connectionId,
          partnerName,
          environment,
          timestamp: receivedAt,
          direction: 'outbound',
          format: 'fhir',
          messageType: `${method} ${path}`,
          resourceType: 'OperationOutcome',
          status: statusCode >= 400 ? 'failed' : 'success',
          summary: `API ${method} ${path} → ${statusCode} (${latencyMs}ms)`,
          correlationId
        }
      })

      await tx.integrationLog.create({
        data: {
          orgId,
          connectionId,
          partnerName,
          environment,
          timestamp: receivedAt,
          severity: statusCode >= 400 ? 'error' : 'info',
          category: 'api',
          message: `Sandbox API ${method} ${path} responded ${statusCode}`,
          anonymizedMessage: `Sandbox API ${method} ${path} responded ${statusCode}`,
          correlationId,
          durationMs: latencyMs,
          statusCode,
          source: 'ultra-a'
        }
      })

      await upsertDailyRollup(tx, orgId, connectionId, environment, receivedAt, {
        messages: 1,
        fhir: 1
      })
    }

    if (isClinicalEvent(event)) {
      await tx.processedMessage.create({
        data: {
          orgId,
          connectionId,
          partnerName,
          environment,
          timestamp: receivedAt,
          direction: 'inbound',
          format: 'fhir',
          messageType: clinicalMessageType(event),
          resourceType,
          status: 'success',
          summary,
          correlationId
        }
      })

      await tx.integrationLog.create({
        data: {
          orgId,
          connectionId,
          partnerName,
          environment,
          timestamp: receivedAt,
          severity: 'success',
          category: 'integration',
          message: summary,
          anonymizedMessage: anonSummary,
          resourceType,
          eventType: event,
          hl7MessageType: clinicalMessageType(event),
          correlationId,
          source: 'synthetic-ehr'
        }
      })

      await upsertDailyRollup(tx, orgId, connectionId, environment, receivedAt, {
        messages: 1,
        fhir: resourceType ? 1 : 0
      })
    }

    if (isTunnelEvent(event)) {
      const tunnelLog = await tx.tunnelLog.create({
        data: {
          orgId,
          connectionId,
          partnerName,
          environment,
          timestamp: receivedAt,
          severity: tunnelSeverity(event),
          eventType: mapTunnelEventType(event),
          message: `Sidecar ${event.replace('tunnel.', '')} on ${connectionId}`
        }
      })

      await tx.integrationLog.create({
        data: {
          orgId,
          connectionId,
          partnerName,
          environment,
          timestamp: receivedAt,
          severity: tunnelSeverity(event),
          category: 'tunnel',
          message: tunnelLog.message,
          anonymizedMessage: tunnelLog.message,
          eventType: mapTunnelEventType(event),
          correlationId,
          source: 'sovereign-sidecar'
        }
      })

      await handleTunnelIncident(tx, ctx, tunnelLog.id)

      await upsertDailyRollup(tx, orgId, connectionId, environment, receivedAt, {
        tunnel: 1,
        uptimeDelta: event === 'tunnel.disconnected' ? -2 : event === 'tunnel.reconnect' ? 0 : 0
      })
    }

    await updateConnectionRuntime(tx, connectionId, orgId, receivedAt)
  })
}

export async function getRecentWebhookEvents(orgId: string, limit = 20, since?: Date) {
  const logs = await prisma.integrationLog.findMany({
    where: {
      orgId,
      category: 'webhook',
      ...(since ? { timestamp: { gte: since } } : {})
    },
    orderBy: { timestamp: 'desc' },
    take: limit
  })

  return logs.map(log => ({
    id: log.id,
    receivedAt: log.timestamp.toISOString(),
    event: log.eventType ?? 'unknown',
    payload: log.metadata,
    signatureValid: true
  }))
}

export interface LatestProcessedMessageSummary {
  id: string
  connectionId: string
  summary: string
  timestamp: string
}

export async function getLatestProcessedMessage(
  orgId: string,
  connectionId?: string | null
): Promise<LatestProcessedMessageSummary | null> {
  const row = await prisma.processedMessage.findFirst({
    where: {
      orgId,
      ...(connectionId ? { connectionId } : {})
    },
    orderBy: { timestamp: 'desc' }
  })

  if (!row) return null

  return {
    id: row.id,
    connectionId: row.connectionId,
    summary: row.summary,
    timestamp: row.timestamp.toISOString()
  }
}
