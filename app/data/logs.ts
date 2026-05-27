import type { LogEntry } from '~/types/while'

export const sandboxLogs: LogEntry[] = [
  {
    id: 'log-sb-001',
    timestamp: '2026-05-20T14:55:12Z',
    connectionId: 'conn-sb-001',
    partnerName: 'North Valley Clinic',
    severity: 'success',
    resourceType: 'Patient',
    message: 'FHIR R4 Patient resource normalized from HL7 ADT^A01 for John Smith (MRN: 4829103)',
    anonymizedMessage: 'FHIR R4 Patient resource normalized from HL7 ADT^A01 for [REDACTED] (MRN: [REDACTED])'
  },
  {
    id: 'log-sb-002',
    timestamp: '2026-05-20T14:54:38Z',
    connectionId: 'conn-sb-001',
    partnerName: 'North Valley Clinic',
    severity: 'info',
    resourceType: 'Observation',
    message: 'WireGuard tunnel handshake verified — latency 12ms',
    anonymizedMessage: 'WireGuard tunnel handshake verified — latency 12ms'
  },
  {
    id: 'log-sb-003',
    timestamp: '2026-05-20T14:52:01Z',
    connectionId: 'conn-sb-003',
    partnerName: 'Riverside Medical Group',
    severity: 'success',
    resourceType: 'Encounter',
    message: 'Encounter bundle delivered to webhook for Maria Garcia (MRN: 7734521)',
    anonymizedMessage: 'Encounter bundle delivered to webhook for [REDACTED] (MRN: [REDACTED])'
  },
  {
    id: 'log-sb-004',
    timestamp: '2026-05-20T14:48:22Z',
    connectionId: 'conn-sb-002',
    partnerName: 'Summit Health Partners',
    severity: 'warn',
    message: 'WireGuard handshake pending — clinic gateway has not added public key',
    anonymizedMessage: 'WireGuard handshake pending — clinic gateway has not added public key'
  },
  {
    id: 'log-sb-005',
    timestamp: '2026-05-20T14:45:00Z',
    connectionId: 'conn-sb-001',
    partnerName: 'North Valley Clinic',
    severity: 'info',
    resourceType: 'DiagnosticReport',
    message: 'HL7 ORU^R01 message received, mapping to FHIR DiagnosticReport',
    anonymizedMessage: 'HL7 ORU^R01 message received, mapping to FHIR DiagnosticReport'
  },
  {
    id: 'log-sb-006',
    timestamp: '2026-05-20T14:40:15Z',
    connectionId: 'conn-sb-003',
    partnerName: 'Riverside Medical Group',
    severity: 'error',
    message: 'HL7 ACK timeout after 30s — retry scheduled',
    anonymizedMessage: 'HL7 ACK timeout after 30s — retry scheduled'
  },
  {
    id: 'log-sb-007',
    timestamp: '2026-05-20T14:38:00Z',
    connectionId: 'conn-sb-001',
    partnerName: 'North Valley Clinic',
    severity: 'info',
    message: 'Sidecar heartbeat received — tunnel latency 11ms',
    anonymizedMessage: 'Sidecar heartbeat received — tunnel latency 11ms'
  },
  {
    id: 'log-sb-008',
    timestamp: '2026-05-20T14:35:22Z',
    connectionId: 'conn-sb-001',
    partnerName: 'North Valley Clinic',
    severity: 'success',
    resourceType: 'Encounter',
    message: 'Encounter bundle normalized and delivered to webhook',
    anonymizedMessage: 'Encounter bundle normalized and delivered to webhook'
  },
  {
    id: 'log-sb-009',
    timestamp: '2026-05-20T14:30:10Z',
    connectionId: 'conn-sb-002',
    partnerName: 'Summit Health Partners',
    severity: 'info',
    message: 'Onboarding checklist reminder sent to partner IT contact',
    anonymizedMessage: 'Onboarding checklist reminder sent to partner IT contact'
  },
  {
    id: 'log-sb-010',
    timestamp: '2026-05-20T14:28:45Z',
    connectionId: 'conn-sb-003',
    partnerName: 'Riverside Medical Group',
    severity: 'success',
    resourceType: 'Patient',
    message: 'FHIR Patient resource read completed for follow-up visit',
    anonymizedMessage: 'FHIR Patient resource read completed for [REDACTED] visit'
  }
]

export const liveLogs: LogEntry[] = [
  {
    id: 'log-lv-001',
    timestamp: '2026-05-20T14:58:01Z',
    connectionId: 'conn-lv-001',
    partnerName: 'MetroCare Health System',
    severity: 'success',
    resourceType: 'Patient',
    message: 'FHIR Patient read completed for Robert Johnson (MRN: 9910234)',
    anonymizedMessage: 'FHIR Patient read completed for [REDACTED] (MRN: [REDACTED])'
  },
  {
    id: 'log-lv-002',
    timestamp: '2026-05-20T14:57:30Z',
    connectionId: 'conn-lv-002',
    partnerName: 'Coastal Wellness Network',
    severity: 'success',
    resourceType: 'Observation',
    message: 'Lab result Observation bundle forwarded — LOINC 718-7',
    anonymizedMessage: 'Lab result Observation bundle forwarded — LOINC 718-7'
  },
  {
    id: 'log-lv-003',
    timestamp: '2026-05-20T14:55:00Z',
    connectionId: 'conn-lv-003',
    partnerName: 'Prairie Community Hospital',
    severity: 'error',
    message: 'Tunnel connection lost — WireGuard peer unreachable for 15 minutes',
    anonymizedMessage: 'Tunnel connection lost — WireGuard peer unreachable for 15 minutes'
  },
  {
    id: 'log-lv-004',
    timestamp: '2026-05-20T14:52:18Z',
    connectionId: 'conn-lv-001',
    partnerName: 'MetroCare Health System',
    severity: 'info',
    message: 'Automated credential rotation completed — new WireGuard keys deployed',
    anonymizedMessage: 'Automated credential rotation completed — new WireGuard keys deployed'
  },
  {
    id: 'log-lv-005',
    timestamp: '2026-05-20T14:50:44Z',
    connectionId: 'conn-lv-004',
    partnerName: 'Lakeview Pediatrics',
    severity: 'warn',
    resourceType: 'MedicationRequest',
    message: 'Schema drift detected in MedicationRequest — mapping patch suggested',
    anonymizedMessage: 'Schema drift detected in MedicationRequest — mapping patch suggested'
  },
  {
    id: 'log-lv-006',
    timestamp: '2026-05-20T14:48:00Z',
    connectionId: 'conn-lv-002',
    partnerName: 'Coastal Wellness Network',
    severity: 'info',
    message: 'FHIR Subscription notification received — 3 new Encounter resources',
    anonymizedMessage: 'FHIR Subscription notification received — 3 new Encounter resources'
  },
  {
    id: 'log-lv-007',
    timestamp: '2026-05-20T14:46:30Z',
    connectionId: 'conn-lv-001',
    partnerName: 'MetroCare Health System',
    severity: 'success',
    resourceType: 'DiagnosticReport',
    message: 'DiagnosticReport bundle forwarded after HL7 ORU^R01 mapping',
    anonymizedMessage: 'DiagnosticReport bundle forwarded after HL7 ORU^R01 mapping'
  },
  {
    id: 'log-lv-008',
    timestamp: '2026-05-20T14:44:00Z',
    connectionId: 'conn-lv-003',
    partnerName: 'Prairie Community Hospital',
    severity: 'warn',
    message: 'WireGuard keepalive missed — investigating peer reachability',
    anonymizedMessage: 'WireGuard keepalive missed — investigating peer reachability'
  },
  {
    id: 'log-lv-009',
    timestamp: '2026-05-20T14:42:15Z',
    connectionId: 'conn-lv-004',
    partnerName: 'Lakeview Pediatrics',
    severity: 'info',
    message: 'HL7 ACK probe sent — awaiting clinic gateway response',
    anonymizedMessage: 'HL7 ACK probe sent — awaiting clinic gateway response'
  },
  {
    id: 'log-lv-010',
    timestamp: '2026-05-20T14:40:00Z',
    connectionId: 'conn-lv-001',
    partnerName: 'MetroCare Health System',
    severity: 'info',
    message: 'Tunnel health check passed — latency 9ms',
    anonymizedMessage: 'Tunnel health check passed — latency 9ms'
  }
]
