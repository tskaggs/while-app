import type { Connection } from '~/types/while'

export const sandboxConnections: Connection[] = [
  {
    id: 'conn-sb-001',
    partnerName: 'North Valley Clinic',
    ehrVendor: 'Epic',
    environment: 'sandbox',
    sidecarId: 'sidecar-sb-a7f2',
    tunnelStatus: 'active',
    wireguardPublicKey: 'xT9kP2mN8vQ4rL6wY1zA3bC5dE7fG0hJ2kM4nP6qR8s=',
    ehrEndpoint: 'https://sandbox.epic.northvalley.test/fhir/R4',
    lastSyncAt: '2026-05-20T14:32:00Z',
    flightCheck: { mtu: true, handshake: true, hl7Ack: true },
    region: 'us-east-1',
    messagesProcessed24h: 1240
  },
  {
    id: 'conn-sb-002',
    partnerName: 'Summit Health Partners',
    ehrVendor: 'Cerner',
    environment: 'sandbox',
    sidecarId: 'sidecar-sb-b3c8',
    tunnelStatus: 'pending',
    wireguardPublicKey: 'mK7jH5gF3dS1aZ9xC8vB6nM4lK2jH0gF8dS6aZ4xC2v=',
    ehrEndpoint: 'https://sandbox.cerner.summithealth.test/fhir/R4',
    lastSyncAt: '2026-05-19T09:15:00Z',
    flightCheck: { mtu: true, handshake: false, hl7Ack: false },
    region: 'us-west-2',
    messagesProcessed24h: 0
  },
  {
    id: 'conn-sb-003',
    partnerName: 'Riverside Medical Group',
    ehrVendor: 'Meditech',
    environment: 'sandbox',
    sidecarId: 'sidecar-sb-c9d1',
    tunnelStatus: 'active',
    wireguardPublicKey: 'pL3mN5oP7qR9sT1uV3wX5yZ7aB9cD1eF3gH5jK7mN9o=',
    ehrEndpoint: 'https://sandbox.meditech.riverside.test/fhir/R4',
    lastSyncAt: '2026-05-20T11:48:00Z',
    flightCheck: { mtu: true, handshake: true, hl7Ack: true },
    region: 'us-east-1',
    messagesProcessed24h: 856
  }
]

export const liveConnections: Connection[] = [
  {
    id: 'conn-lv-001',
    partnerName: 'MetroCare Health System',
    ehrVendor: 'Epic',
    environment: 'live',
    sidecarId: 'sidecar-lv-x4k9',
    tunnelStatus: 'active',
    wireguardPublicKey: 'qR5sT7uV9wX1yZ3aB5cD7eF9gH1jK3lM5nO7pQ9rS1t=',
    ehrEndpoint: 'https://fhir.metrocare.org/R4',
    lastSyncAt: '2026-05-20T14:55:00Z',
    flightCheck: { mtu: true, handshake: true, hl7Ack: true },
    region: 'us-east-1',
    messagesProcessed24h: 4820
  },
  {
    id: 'conn-lv-002',
    partnerName: 'Coastal Wellness Network',
    ehrVendor: 'Athena',
    environment: 'live',
    sidecarId: 'sidecar-lv-y7m2',
    tunnelStatus: 'active',
    wireguardPublicKey: 'uV3wX5yZ7aB9cD1eF3gH5jK7lM9nO1pQ3rS5tU7vW9x=',
    ehrEndpoint: 'https://api.athenahealth.com/coastal/fhir/R4',
    lastSyncAt: '2026-05-20T14:50:00Z',
    flightCheck: { mtu: true, handshake: true, hl7Ack: true },
    region: 'us-west-2',
    messagesProcessed24h: 3150
  },
  {
    id: 'conn-lv-003',
    partnerName: 'Prairie Community Hospital',
    ehrVendor: 'Cerner',
    environment: 'live',
    sidecarId: 'sidecar-lv-z1p6',
    tunnelStatus: 'error',
    wireguardPublicKey: 'yZ7aB9cD1eF3gH5jK7lM9nO1pQ3rS5tU7vW9xY1zA3bC5d=',
    ehrEndpoint: 'https://fhir.prairiecommunity.org/R4',
    lastSyncAt: '2026-05-18T22:10:00Z',
    flightCheck: { mtu: true, handshake: false, hl7Ack: false },
    region: 'us-central-1',
    messagesProcessed24h: 0
  },
  {
    id: 'conn-lv-004',
    partnerName: 'Lakeview Pediatrics',
    ehrVendor: 'Epic',
    environment: 'live',
    sidecarId: 'sidecar-lv-w3n8',
    tunnelStatus: 'pending',
    wireguardPublicKey: 'aB5cD7eF9gH1jK3lM5nO7pQ9rS1tU3vW5xY7zA9bC1dE3f=',
    ehrEndpoint: 'https://fhir.lakeviewpeds.org/R4',
    lastSyncAt: '2026-05-20T08:00:00Z',
    flightCheck: { mtu: true, handshake: true, hl7Ack: false },
    region: 'us-east-1',
    messagesProcessed24h: 420
  }
]
