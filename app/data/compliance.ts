import type { ComplianceData, SupportRequest, SupportTicket } from '~/types/while'

export const complianceData: ComplianceData = {
  baaStatus: 'signed',
  baaSignedAt: '2025-11-15T00:00:00Z',
  baaExpiresAt: '2026-11-15T00:00:00Z',
  checklist: [
    {
      id: 'hipaa-encryption',
      label: 'Encryption at Rest & in Transit',
      description: 'AES-256 at rest, TLS 1.3 + WireGuard for all data in transit',
      status: 'pass'
    },
    {
      id: 'mfa',
      label: 'Multi-Factor Authentication',
      description: 'MFA enforced for all dashboard users',
      status: 'pass'
    },
    {
      id: 'audit-logging',
      label: 'Audit Logging',
      description: 'Immutable audit trail for all control plane access',
      status: 'pass'
    },
    {
      id: 'key-rotation',
      label: 'Credential Rotation',
      description: 'WireGuard keys rotated every 30 days automatically',
      status: 'pass'
    },
    {
      id: 'phi-isolation',
      label: 'PHI Isolation',
      description: 'No PHI stored in control plane — verified by architecture review',
      status: 'pass'
    },
    {
      id: 'soc2',
      label: 'SOC 2 Type II',
      description: 'Annual SOC 2 audit — next review scheduled Q3 2026',
      status: 'pending'
    }
  ],
  auditLog: [
    {
      id: 'audit-001',
      timestamp: '2026-05-20T14:30:00Z',
      actor: 'sarah.chen@acmehealth.io',
      action: 'Viewed connection details',
      resource: 'conn-lv-001',
      ipAddress: '10.0.1.42'
    },
    {
      id: 'audit-002',
      timestamp: '2026-05-20T13:15:00Z',
      actor: 'devops-bot@acmehealth.io',
      action: 'Rotated API key',
      resource: 'api-key-prod-001',
      ipAddress: '10.0.2.18'
    },
    {
      id: 'audit-003',
      timestamp: '2026-05-20T11:00:00Z',
      actor: 'sarah.chen@acmehealth.io',
      action: 'Downloaded BAA document',
      resource: 'baa-acmehealth-2025',
      ipAddress: '10.0.1.42'
    },
    {
      id: 'audit-004',
      timestamp: '2026-05-19T16:45:00Z',
      actor: 'james.wilson@acmehealth.io',
      action: 'Submitted support request',
      resource: 'req-004',
      ipAddress: '192.168.1.105'
    },
    {
      id: 'audit-005',
      timestamp: '2026-05-19T09:30:00Z',
      actor: 'sarah.chen@acmehealth.io',
      action: 'Switched environment',
      resource: 'environment:live',
      ipAddress: '10.0.1.42'
    }
  ]
}

export const supportTickets: SupportTicket[] = [
  {
    id: 'tkt-001',
    category: 'connection',
    connectionId: 'conn-sb-002',
    partnerName: 'Summit Health Partners',
    message: 'Tunnel handshake keeps failing after key rotation. Can you verify our WireGuard config matches the sidecar endpoint?',
    status: 'in_progress',
    submittedAt: '2026-05-19T16:20:00Z'
  },
  {
    id: 'tkt-002',
    category: 'billing',
    message: 'Need to confirm whether live message volume tiers apply before our June go-live date.',
    status: 'in_review',
    submittedAt: '2026-05-17T11:05:00Z'
  },
  {
    id: 'tkt-003',
    category: 'general',
    message: 'Question about BAA renewal timeline and audit log retention for compliance review.',
    status: 'submitted',
    submittedAt: '2026-05-21T09:45:00Z'
  }
]

export const supportRequests: SupportRequest[] = [
  {
    id: 'req-001',
    partnerName: 'Summit Health Partners',
    ehrVendor: 'Cerner',
    environment: 'sandbox',
    status: 'in_progress',
    submittedAt: '2026-05-15T10:00:00Z',
    targetGoLive: '2026-06-01'
  },
  {
    id: 'req-002',
    partnerName: 'Lakeview Pediatrics',
    ehrVendor: 'Epic',
    environment: 'live',
    status: 'in_review',
    submittedAt: '2026-05-18T14:30:00Z',
    targetGoLive: '2026-06-15'
  },
  {
    id: 'req-003',
    partnerName: 'Prairie Community Hospital',
    ehrVendor: 'Cerner',
    environment: 'live',
    status: 'in_progress',
    submittedAt: '2026-05-10T09:00:00Z',
    targetGoLive: '2026-05-25'
  }
]
