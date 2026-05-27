import { liveConnections, sandboxConnections } from '~/data/connections'
import type {
  Connection,
  IncidentMessage,
  IncidentReport,
  LogSeverity,
  TunnelEventType,
  TunnelLogEntry,
  TunnelStatus
} from '~/types/while'

function pseudoRandom(seed: number) {
  return ((seed * 9301 + 49297) % 233280) / 233280
}

const eventTemplates: Array<{
  eventType: TunnelEventType
  severity: LogSeverity
  message: string
}> = [
  {
    eventType: 'handshake',
    severity: 'success',
    message: 'WireGuard tunnel handshake verified'
  },
  {
    eventType: 'latency',
    severity: 'info',
    message: 'Tunnel latency within SLA — round-trip 12ms'
  },
  {
    eventType: 'health',
    severity: 'info',
    message: 'Periodic tunnel health check passed'
  },
  {
    eventType: 'credential',
    severity: 'info',
    message: 'WireGuard key rotation completed successfully'
  },
  {
    eventType: 'ack',
    severity: 'success',
    message: 'Sidecar connectivity probe acknowledged by peer'
  },
  {
    eventType: 'handshake',
    severity: 'warn',
    message: 'WireGuard handshake pending — clinic gateway has not added public key'
  },
  {
    eventType: 'latency',
    severity: 'warn',
    message: 'Tunnel latency elevated — round-trip 340ms'
  },
  {
    eventType: 'disconnect',
    severity: 'error',
    message: 'Tunnel connection lost — WireGuard peer unreachable'
  },
  {
    eventType: 'reconnect',
    severity: 'success',
    message: 'Tunnel re-established after peer recovery'
  }
]

function baseUptimeForStatus(status: TunnelStatus, seed: number): number {
  if (status === 'active') return 98 + pseudoRandom(seed) * 1.9
  if (status === 'pending') return 82 + pseudoRandom(seed) * 10
  return 55 + pseudoRandom(seed) * 25
}

function generateTunnelLogs(connections: Connection[], prefix: string): TunnelLogEntry[] {
  const logs: TunnelLogEntry[] = []
  let seed = 1

  for (const connection of connections) {
    const eventsPerDay = connection.tunnelStatus === 'active' ? 8 : connection.tunnelStatus === 'pending' ? 5 : 10

    for (let eventIndex = 0; eventIndex < eventsPerDay; eventIndex++) {
      const template = eventTemplates[Math.floor(pseudoRandom(seed++) * eventTemplates.length)]!
      const hour = Math.floor(pseudoRandom(seed++) * 24)
      const minute = Math.floor(pseudoRandom(seed++) * 60)
      const second = Math.floor(pseudoRandom(seed++) * 60)

      logs.push({
        id: `tlog-${prefix}-${connection.id.slice(-3)}-${String(eventIndex).padStart(2, '0')}`,
        timestamp: `2026-05-20T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}Z`,
        connectionId: connection.id,
        partnerName: connection.partnerName,
        severity: connection.tunnelStatus === 'error' && eventIndex % 3 === 0 ? 'error' : template.severity,
        eventType: template.eventType,
        message: template.message
      })
    }
  }

  return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

function withScriptedEvents(logs: TunnelLogEntry[], prefix: string): TunnelLogEntry[] {
  const scripted: TunnelLogEntry[] = [
    {
      id: `tlog-${prefix}-lv3-00`,
      timestamp: '2026-05-20T14:55:00Z',
      connectionId: 'conn-lv-003',
      partnerName: 'Prairie Community Hospital',
      severity: 'error',
      eventType: 'disconnect',
      message: 'Tunnel connection lost — WireGuard peer unreachable for 15 minutes',
      incidentId: `inc-${prefix}-001`
    },
    {
      id: `tlog-${prefix}-lv3-01`,
      timestamp: '2026-05-20T14:40:12Z',
      connectionId: 'conn-lv-003',
      partnerName: 'Prairie Community Hospital',
      severity: 'warn',
      eventType: 'latency',
      message: 'Tunnel latency spike detected — round-trip 2.4s before disconnect',
      incidentId: `inc-${prefix}-001`
    },
    {
      id: `tlog-${prefix}-sb2-00`,
      timestamp: '2026-05-20T14:48:22Z',
      connectionId: 'conn-sb-002',
      partnerName: 'Summit Health Partners',
      severity: 'warn',
      eventType: 'handshake',
      message: 'WireGuard handshake pending — clinic gateway has not added public key',
      incidentId: `inc-${prefix}-001`
    },
    {
      id: `tlog-${prefix}-lv1-00`,
      timestamp: '2026-05-20T14:52:18Z',
      connectionId: 'conn-lv-001',
      partnerName: 'MetroCare Health System',
      severity: 'info',
      eventType: 'credential',
      message: 'Automated credential rotation completed — new WireGuard keys deployed'
    }
  ]

  const withoutDupes = logs.filter(log =>
    !scripted.some(item => item.connectionId === log.connectionId && item.timestamp.slice(0, 13) === log.timestamp.slice(0, 13))
  )

  return [...scripted, ...withoutDupes].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

function generateIncidents(prefix: string, connections: Connection[]): IncidentReport[] {
  if (prefix === 'sb') {
    return [
      {
        id: `inc-${prefix}-001`,
        connectionId: 'conn-sb-002',
        partnerName: 'Summit Health Partners',
        title: 'WireGuard handshake pending',
        summary: 'Summit Health Partners has not added the While public key to their clinic gateway. Tunnel remains in pending state and onboarding support is coordinating with their IT team.',
        severity: 'major',
        status: 'investigating',
        startedAt: '2026-05-20T14:48:22Z',
        relatedLogIds: [`tlog-${prefix}-sb2-00`]
      }
    ]
  }

  return [
    {
      id: `inc-${prefix}-001`,
      connectionId: 'conn-lv-003',
      partnerName: 'Prairie Community Hospital',
      title: 'WireGuard tunnel unreachable',
      summary: 'The sidecar lost connectivity to the clinic WireGuard peer for approximately 15 minutes. Initial latency spike preceded the disconnect. Partner IT notified and investigating firewall changes on their gateway.',
      severity: 'critical',
      status: 'investigating',
      startedAt: '2026-05-20T14:40:12Z',
      relatedLogIds: [`tlog-${prefix}-lv3-00`, `tlog-${prefix}-lv3-01`]
    }
  ]
}

function generateIncidentMessages(prefix: string): IncidentMessage[] {
  if (prefix === 'sb') {
    return [
      {
        id: `imsg-${prefix}-001`,
        incidentId: `inc-${prefix}-001`,
        author: 'While Platform',
        timestamp: '2026-05-20T14:49:00Z',
        body: 'Automated alert: WireGuard handshake still pending for Summit Health Partners after 48 hours.'
      },
      {
        id: `imsg-${prefix}-002`,
        incidentId: `inc-${prefix}-001`,
        author: 'Alex Rivera (While Support)',
        timestamp: '2026-05-20T15:05:00Z',
        body: 'Sent setup guide and public key to Summit IT contact. Awaiting confirmation that UDP 51820 is open on their gateway.'
      }
    ]
  }

  return [
    {
      id: `imsg-${prefix}-001`,
      incidentId: `inc-${prefix}-001`,
      author: 'While Platform',
      timestamp: '2026-05-20T14:55:30Z',
      body: 'Automated alert: tunnel disconnect detected for Prairie Community Hospital. Incident opened and partner contacts notified.'
    },
    {
      id: `imsg-${prefix}-002`,
      incidentId: `inc-${prefix}-001`,
      author: 'Sarah Chen (While Support)',
      timestamp: '2026-05-20T15:02:00Z',
      body: 'Reached Prairie IT — they report a firewall rule change during maintenance. Rollback in progress. Monitoring sidecar reconnect attempts.'
    },
    {
      id: `imsg-${prefix}-003`,
      incidentId: `inc-${prefix}-001`,
      author: 'Prairie IT (via portal)',
      timestamp: '2026-05-20T15:18:45Z',
      body: 'Firewall rule reverted. Please confirm tunnel handshake from your side. We see UDP 51820 open again.'
    }
  ]
}

export const sandboxTunnelLogs = withScriptedEvents(generateTunnelLogs(sandboxConnections, 'sb'), 'sb')
export const liveTunnelLogs = withScriptedEvents(generateTunnelLogs(liveConnections, 'lv'), 'lv')

export const sandboxIncidents = generateIncidents('sb', sandboxConnections)
export const liveIncidents = generateIncidents('lv', liveConnections)

export const sandboxIncidentMessages = generateIncidentMessages('sb')
export const liveIncidentMessages = generateIncidentMessages('lv')

export function computeUptimePercent(
  logs: TunnelLogEntry[],
  connectionId: string,
  bucketStart: string,
  bucketEndMs: number,
  baseline: number
): number {
  const bucketStartMs = new Date(bucketStart).getTime()
  const bucketLogs = logs.filter((log) => {
    if (log.connectionId !== connectionId) return false
    const ts = new Date(log.timestamp).getTime()
    return ts >= bucketStartMs && ts < bucketEndMs
  })

  if (!bucketLogs.length) return baseline

  let penalty = 0
  for (const log of bucketLogs) {
    if (log.eventType === 'disconnect') penalty += 35
    else if (log.severity === 'error') penalty += 20
    else if (log.severity === 'warn') penalty += 8
    else if (log.eventType === 'reconnect') penalty -= 10
  }

  return Math.max(0, Math.min(100, baseline - penalty))
}

export function getConnectionBaseline(status: TunnelStatus, seed: number): number {
  return baseUptimeForStatus(status, seed)
}
