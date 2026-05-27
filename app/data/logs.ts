import type { AuditLogEntry, LogEntry, TunnelLogEntry } from '~/types/while'

const sandboxIntegration: LogEntry[] = [
  {
    id: 'log-sb-001',
    timestamp: '2026-05-20T14:55:12Z',
    connectionId: 'conn-sb-001',
    partnerName: 'North Valley Clinic',
    severity: 'success',
    category: 'integration',
    resourceType: 'Patient',
    hl7MessageType: 'ADT^A01',
    message: 'FHIR R4 Patient resource normalized from HL7 ADT^A01 for John Smith (MRN: 4829103)',
    anonymizedMessage: 'FHIR R4 Patient resource normalized from HL7 ADT^A01 for [REDACTED] (MRN: [REDACTED])',
    correlationId: 'msg-sb-1042',
    durationMs: 42,
    metadata: { fhirVersion: 'R4', resourceId: 'Patient/example-001' }
  },
  {
    id: 'log-sb-002',
    timestamp: '2026-05-20T14:54:38Z',
    connectionId: 'conn-sb-001',
    partnerName: 'North Valley Clinic',
    severity: 'info',
    category: 'mapping',
    message: 'HL7 ADT^A01 segment mapping applied — PID, PV1 fields mapped to FHIR Patient + Encounter',
    anonymizedMessage: 'HL7 ADT^A01 segment mapping applied — PID, PV1 fields mapped to FHIR Patient + Encounter',
    correlationId: 'msg-sb-1042',
    details: 'Mapping profile: epic-adt-v2. No validation warnings.'
  },
  {
    id: 'log-sb-003',
    timestamp: '2026-05-20T14:54:40Z',
    connectionId: 'conn-sb-001',
    partnerName: 'North Valley Clinic',
    severity: 'success',
    category: 'webhook',
    message: 'Webhook delivery succeeded — patient.created (HTTP 204)',
    anonymizedMessage: 'Webhook delivery succeeded — patient.created (HTTP 204)',
    correlationId: 'msg-sb-1042',
    statusCode: 204,
    durationMs: 118
  },
  {
    id: 'log-sb-004',
    timestamp: '2026-05-20T14:52:01Z',
    connectionId: 'conn-sb-003',
    partnerName: 'Riverside Medical Group',
    severity: 'success',
    category: 'integration',
    resourceType: 'Encounter',
    message: 'Encounter bundle delivered to webhook for Maria Garcia (MRN: 7734521)',
    anonymizedMessage: 'Encounter bundle delivered to webhook for [REDACTED] (MRN: [REDACTED])',
    correlationId: 'msg-sb-1038'
  },
  {
    id: 'log-sb-005',
    timestamp: '2026-05-20T14:48:22Z',
    connectionId: 'conn-sb-002',
    partnerName: 'Summit Health Partners',
    severity: 'warn',
    category: 'tunnel',
    eventType: 'handshake',
    message: 'WireGuard handshake pending — clinic gateway has not added public key',
    anonymizedMessage: 'WireGuard handshake pending — clinic gateway has not added public key',
    correlationId: 'inc-sb-001'
  },
  {
    id: 'log-sb-006',
    timestamp: '2026-05-20T14:45:00Z',
    connectionId: 'conn-sb-001',
    partnerName: 'North Valley Clinic',
    severity: 'info',
    category: 'integration',
    resourceType: 'DiagnosticReport',
    hl7MessageType: 'ORU^R01',
    message: 'HL7 ORU^R01 message received, mapping to FHIR DiagnosticReport',
    anonymizedMessage: 'HL7 ORU^R01 message received, mapping to FHIR DiagnosticReport',
    correlationId: 'msg-sb-1031'
  },
  {
    id: 'log-sb-007',
    timestamp: '2026-05-20T14:40:15Z',
    connectionId: 'conn-sb-003',
    partnerName: 'Riverside Medical Group',
    severity: 'error',
    category: 'integration',
    hl7MessageType: 'ORM^O01',
    message: 'HL7 ACK timeout after 30s — retry scheduled',
    anonymizedMessage: 'HL7 ACK timeout after 30s — retry scheduled',
    correlationId: 'msg-sb-1025',
    details: 'Clinic gateway did not respond to ORM^O01 within configured SLA.'
  },
  {
    id: 'log-sb-008',
    timestamp: '2026-05-20T14:38:00Z',
    connectionId: 'conn-sb-001',
    partnerName: 'North Valley Clinic',
    severity: 'info',
    category: 'sidecar',
    message: 'Sidecar heartbeat received — tunnel latency 11ms',
    anonymizedMessage: 'Sidecar heartbeat received — tunnel latency 11ms',
    durationMs: 11,
    source: 'sidecar-sb-001'
  },
  {
    id: 'log-sb-009',
    timestamp: '2026-05-20T14:35:22Z',
    connectionId: 'conn-sb-001',
    partnerName: 'North Valley Clinic',
    severity: 'success',
    category: 'integration',
    resourceType: 'Encounter',
    message: 'Encounter bundle normalized and delivered to webhook',
    anonymizedMessage: 'Encounter bundle normalized and delivered to webhook'
  },
  {
    id: 'log-sb-010',
    timestamp: '2026-05-20T14:30:10Z',
    connectionId: 'conn-sb-002',
    partnerName: 'Summit Health Partners',
    severity: 'info',
    category: 'system',
    message: 'Onboarding checklist reminder sent to partner IT contact',
    anonymizedMessage: 'Onboarding checklist reminder sent to partner IT contact',
    actor: 'system@while.health'
  },
  {
    id: 'log-sb-011',
    timestamp: '2026-05-20T14:28:45Z',
    connectionId: 'conn-sb-003',
    partnerName: 'Riverside Medical Group',
    severity: 'success',
    category: 'integration',
    resourceType: 'Patient',
    message: 'FHIR Patient resource read completed for follow-up visit',
    anonymizedMessage: 'FHIR Patient resource read completed for [REDACTED] visit',
    correlationId: 'msg-sb-1018'
  },
  {
    id: 'log-sb-012',
    timestamp: '2026-05-20T14:25:00Z',
    connectionId: 'conn-sb-001',
    partnerName: 'North Valley Clinic',
    severity: 'info',
    category: 'api',
    message: 'GET /v1/Patient/example-001 — 200 OK (sandbox)',
    anonymizedMessage: 'GET /v1/Patient/example-001 — 200 OK (sandbox)',
    statusCode: 200,
    durationMs: 64,
    source: 'api-gateway'
  },
  {
    id: 'log-sb-013',
    timestamp: '2026-05-20T14:22:30Z',
    connectionId: 'conn-sb-003',
    partnerName: 'Riverside Medical Group',
    severity: 'warn',
    category: 'webhook',
    message: 'Webhook delivery retry #2 — transient 503 from destination',
    anonymizedMessage: 'Webhook delivery retry #2 — transient 503 from destination',
    statusCode: 503,
    correlationId: 'msg-sb-1012'
  },
  {
    id: 'log-sb-014',
    timestamp: '2026-05-20T14:20:00Z',
    connectionId: 'conn-sb-001',
    partnerName: 'North Valley Clinic',
    severity: 'info',
    category: 'credential',
    eventType: 'rotation',
    message: 'Sandbox API key rotated — previous key revoked',
    anonymizedMessage: 'Sandbox API key rotated — previous key revoked',
    actor: 'Sarah Chen',
    ipAddress: '10.0.12.44'
  },
  {
    id: 'log-sb-015',
    timestamp: '2026-05-20T14:18:00Z',
    connectionId: 'conn-sb-002',
    partnerName: 'Summit Health Partners',
    severity: 'info',
    category: 'mapping',
    resourceType: 'MedicationRequest',
    message: 'RDE^O11 medication order mapped to FHIR MedicationRequest',
    anonymizedMessage: 'RDE^O11 medication order mapped to FHIR MedicationRequest',
    hl7MessageType: 'RDE^O11'
  },
  {
    id: 'log-sb-016',
    timestamp: '2026-05-20T14:15:00Z',
    connectionId: 'conn-sb-001',
    partnerName: 'North Valley Clinic',
    severity: 'success',
    category: 'integration',
    resourceType: 'Observation',
    message: 'Observation bundle created from ORU^R01 — LOINC 718-7',
    anonymizedMessage: 'Observation bundle created from ORU^R01 — LOINC 718-7'
  },
  {
    id: 'log-sb-017',
    timestamp: '2026-05-20T14:12:00Z',
    connectionId: 'conn-sb-003',
    partnerName: 'Riverside Medical Group',
    severity: 'error',
    category: 'mapping',
    message: 'Mapping validation failed — unsupported OBX segment in ORU^R01',
    anonymizedMessage: 'Mapping validation failed — unsupported OBX segment in ORU^R01',
    details: 'Field OBX-5 value type NM not mapped in profile cerner-oru-v1.'
  },
  {
    id: 'log-sb-018',
    timestamp: '2026-05-20T14:10:00Z',
    connectionId: 'conn-sb-001',
    partnerName: 'North Valley Clinic',
    severity: 'info',
    category: 'audit',
    message: 'User viewed integration logs for conn-sb-001',
    anonymizedMessage: 'User viewed integration logs for conn-sb-001',
    actor: 'Sarah Chen',
    ipAddress: '10.0.12.44',
    source: 'dashboard'
  }
]

const liveIntegration: LogEntry[] = [
  {
    id: 'log-lv-001',
    timestamp: '2026-05-20T14:58:01Z',
    connectionId: 'conn-lv-001',
    partnerName: 'North Valley Clinic',
    severity: 'success',
    category: 'integration',
    resourceType: 'Patient',
    message: 'FHIR Patient read completed for Robert Johnson (MRN: 9910234)',
    anonymizedMessage: 'FHIR Patient read completed for [REDACTED] (MRN: [REDACTED])',
    correlationId: 'msg-lv-2201'
  },
  {
    id: 'log-lv-002',
    timestamp: '2026-05-20T14:57:30Z',
    connectionId: 'conn-lv-002',
    partnerName: 'Summit Health Partners',
    severity: 'success',
    category: 'integration',
    resourceType: 'Observation',
    message: 'Lab result Observation bundle forwarded — LOINC 718-7',
    anonymizedMessage: 'Lab result Observation bundle forwarded — LOINC 718-7'
  },
  {
    id: 'log-lv-003',
    timestamp: '2026-05-20T14:55:00Z',
    connectionId: 'conn-lv-003',
    partnerName: 'Riverside Medical Group',
    severity: 'error',
    category: 'tunnel',
    eventType: 'disconnect',
    message: 'Tunnel connection lost — WireGuard peer unreachable for 15 minutes',
    anonymizedMessage: 'Tunnel connection lost — WireGuard peer unreachable for 15 minutes',
    correlationId: 'inc-lv-001'
  },
  {
    id: 'log-lv-004',
    timestamp: '2026-05-20T14:52:18Z',
    connectionId: 'conn-lv-001',
    partnerName: 'North Valley Clinic',
    severity: 'info',
    category: 'credential',
    eventType: 'rotation',
    message: 'Automated credential rotation completed — new WireGuard keys deployed',
    anonymizedMessage: 'Automated credential rotation completed — new WireGuard keys deployed',
    source: 'sidecar-lv-001'
  },
  {
    id: 'log-lv-005',
    timestamp: '2026-05-20T14:50:44Z',
    connectionId: 'conn-lv-004',
    partnerName: 'Lakeview Pediatrics',
    severity: 'warn',
    category: 'mapping',
    resourceType: 'MedicationRequest',
    message: 'Schema drift detected in MedicationRequest — mapping patch suggested',
    anonymizedMessage: 'Schema drift detected in MedicationRequest — mapping patch suggested',
    details: 'Optional field dosageInstruction.text added in upstream FHIR profile.'
  },
  {
    id: 'log-lv-006',
    timestamp: '2026-05-20T14:48:00Z',
    connectionId: 'conn-lv-002',
    partnerName: 'Summit Health Partners',
    severity: 'info',
    category: 'integration',
    resourceType: 'Encounter',
    message: 'FHIR Subscription notification received — 3 new Encounter resources',
    anonymizedMessage: 'FHIR Subscription notification received — 3 new Encounter resources'
  },
  {
    id: 'log-lv-007',
    timestamp: '2026-05-20T14:46:30Z',
    connectionId: 'conn-lv-001',
    partnerName: 'North Valley Clinic',
    severity: 'success',
    category: 'integration',
    resourceType: 'DiagnosticReport',
    hl7MessageType: 'ORU^R01',
    message: 'DiagnosticReport bundle forwarded after HL7 ORU^R01 mapping',
    anonymizedMessage: 'DiagnosticReport bundle forwarded after HL7 ORU^R01 mapping'
  },
  {
    id: 'log-lv-008',
    timestamp: '2026-05-20T14:44:00Z',
    connectionId: 'conn-lv-003',
    partnerName: 'Riverside Medical Group',
    severity: 'warn',
    category: 'tunnel',
    eventType: 'latency',
    message: 'WireGuard keepalive missed — investigating peer reachability',
    anonymizedMessage: 'WireGuard keepalive missed — investigating peer reachability'
  },
  {
    id: 'log-lv-009',
    timestamp: '2026-05-20T14:42:15Z',
    connectionId: 'conn-lv-004',
    partnerName: 'Lakeview Pediatrics',
    severity: 'info',
    category: 'integration',
    hl7MessageType: 'ACK',
    message: 'HL7 ACK probe sent — awaiting clinic gateway response',
    anonymizedMessage: 'HL7 ACK probe sent — awaiting clinic gateway response'
  },
  {
    id: 'log-lv-010',
    timestamp: '2026-05-20T14:40:00Z',
    connectionId: 'conn-lv-001',
    partnerName: 'North Valley Clinic',
    severity: 'info',
    category: 'tunnel',
    eventType: 'health',
    message: 'Tunnel health check passed — latency 9ms',
    anonymizedMessage: 'Tunnel health check passed — latency 9ms',
    durationMs: 9
  },
  {
    id: 'log-lv-011',
    timestamp: '2026-05-20T14:38:00Z',
    connectionId: 'conn-lv-002',
    partnerName: 'Summit Health Partners',
    severity: 'success',
    category: 'webhook',
    message: 'Webhook patient.updated delivered — HMAC verified (HTTP 200)',
    anonymizedMessage: 'Webhook patient.updated delivered — HMAC verified (HTTP 200)',
    statusCode: 200,
    durationMs: 95
  },
  {
    id: 'log-lv-012',
    timestamp: '2026-05-20T14:36:00Z',
    connectionId: 'conn-lv-001',
    partnerName: 'North Valley Clinic',
    severity: 'info',
    category: 'api',
    message: 'POST /v1/Observation — 201 Created',
    anonymizedMessage: 'POST /v1/Observation — 201 Created',
    statusCode: 201,
    durationMs: 88
  },
  {
    id: 'log-lv-013',
    timestamp: '2026-05-20T14:34:00Z',
    connectionId: 'conn-lv-004',
    partnerName: 'Lakeview Pediatrics',
    severity: 'error',
    category: 'api',
    message: 'GET /v1/Patient/unknown — 404 Not Found',
    anonymizedMessage: 'GET /v1/Patient/unknown — 404 Not Found',
    statusCode: 404,
    durationMs: 22
  },
  {
    id: 'log-lv-014',
    timestamp: '2026-05-20T14:32:00Z',
    connectionId: 'conn-lv-003',
    partnerName: 'Riverside Medical Group',
    severity: 'info',
    category: 'sidecar',
    message: 'Sidecar VM metrics — CPU 12%, memory 41%, disk OK',
    anonymizedMessage: 'Sidecar VM metrics — CPU 12%, memory 41%, disk OK',
    source: 'sidecar-lv-003'
  },
  {
    id: 'log-lv-015',
    timestamp: '2026-05-20T14:30:00Z',
    connectionId: 'conn-lv-001',
    partnerName: 'North Valley Clinic',
    severity: 'info',
    category: 'audit',
    message: 'API key scope changed — added Patient.read',
    anonymizedMessage: 'API key scope changed — added Patient.read',
    actor: 'Sarah Chen',
    ipAddress: '10.0.12.44'
  },
  {
    id: 'log-lv-016',
    timestamp: '2026-05-20T14:28:00Z',
    connectionId: 'conn-lv-002',
    partnerName: 'Summit Health Partners',
    severity: 'success',
    category: 'integration',
    resourceType: 'Condition',
    message: 'Condition resource normalized from ADT^A08 problem list segment',
    anonymizedMessage: 'Condition resource normalized from ADT^A08 problem list segment',
    hl7MessageType: 'ADT^A08'
  },
  {
    id: 'log-lv-017',
    timestamp: '2026-05-20T14:26:00Z',
    connectionId: 'conn-lv-001',
    partnerName: 'North Valley Clinic',
    severity: 'warn',
    category: 'system',
    message: 'Rate limit threshold at 82% for connection message throughput',
    anonymizedMessage: 'Rate limit threshold at 82% for connection message throughput'
  },
  {
    id: 'log-lv-018',
    timestamp: '2026-05-20T14:24:00Z',
    connectionId: 'conn-lv-004',
    partnerName: 'Lakeview Pediatrics',
    severity: 'error',
    category: 'webhook',
    message: 'Webhook delivery failed — connection timeout after 30s',
    anonymizedMessage: 'Webhook delivery failed — connection timeout after 30s',
    statusCode: 0,
    correlationId: 'msg-lv-2190'
  }
]

export const sandboxAuditLogs: AuditLogEntry[] = [
  {
    id: 'audit-sb-001',
    timestamp: '2026-05-20T14:10:00Z',
    actor: 'Sarah Chen',
    action: 'logs.view',
    resource: 'conn-sb-001',
    ipAddress: '10.0.12.44'
  },
  {
    id: 'audit-sb-002',
    timestamp: '2026-05-20T13:55:00Z',
    actor: 'Sarah Chen',
    action: 'api_key.rotate',
    resource: 'wh_test_••••7m2p',
    ipAddress: '10.0.12.44'
  }
]

export const liveAuditLogs: AuditLogEntry[] = [
  {
    id: 'audit-lv-001',
    timestamp: '2026-05-20T14:30:00Z',
    actor: 'Sarah Chen',
    action: 'api_key.scope_update',
    resource: 'wh_live_••••4k9f',
    ipAddress: '10.0.12.44'
  },
  {
    id: 'audit-lv-002',
    timestamp: '2026-05-20T14:05:00Z',
    actor: 'system',
    action: 'baa.renewal_reminder',
    resource: 'Acme Health Inc.',
    ipAddress: '—'
  }
]

export function auditToLogEntry(entry: AuditLogEntry, partnerName = 'Organization'): LogEntry {
  return {
    id: entry.id,
    timestamp: entry.timestamp,
    connectionId: '—',
    partnerName,
    severity: 'info',
    category: 'audit',
    message: `${entry.action} on ${entry.resource}`,
    anonymizedMessage: `${entry.action} on ${entry.resource}`,
    actor: entry.actor,
    ipAddress: entry.ipAddress,
    eventType: entry.action,
    source: 'compliance',
    details: `Audit trail entry for ${entry.resource}.`
  }
}

export function tunnelToLogEntry(entry: TunnelLogEntry): LogEntry {
  return {
    id: entry.id,
    timestamp: entry.timestamp,
    connectionId: entry.connectionId,
    partnerName: entry.partnerName,
    severity: entry.severity,
    category: 'tunnel',
    message: entry.message,
    anonymizedMessage: entry.message,
    eventType: entry.eventType,
    correlationId: entry.incidentId,
    source: 'tunnel-monitor'
  }
}

export const sandboxLogs: LogEntry[] = sandboxIntegration
export const liveLogs: LogEntry[] = liveIntegration
