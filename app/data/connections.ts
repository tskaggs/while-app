import type { Connection, LiveActivationBlocker } from '~/types/while'

export const LIVE_BLOCKER_LABELS: Record<LiveActivationBlocker, string> = {
  customer_action: 'Waiting on customer',
  while_documents: 'While — documents',
  clinic_approval: 'Clinic approval',
  clinic_connectivity: 'Clinic connectivity'
}

export const sandboxConnections: Connection[] = [
  {
    id: 'conn-sb-001',
    partnerName: 'North Valley Clinic',
    ehrVendor: 'Epic',
    environment: 'sandbox',
    pairedConnectionId: 'conn-lv-001',
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
    pairedConnectionId: 'conn-lv-002',
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
    pairedConnectionId: 'conn-lv-003',
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
    partnerName: 'North Valley Clinic',
    ehrVendor: 'Epic',
    environment: 'live',
    pairedConnectionId: 'conn-sb-001',
    sidecarId: 'sidecar-lv-a7f2',
    tunnelStatus: 'active',
    wireguardPublicKey: 'qR5sT7uV9wX1yZ3aB5cD7eF9gH1jK3lM5nO7pQ9rS1t=',
    ehrEndpoint: 'https://fhir.northvalley.org/R4',
    lastSyncAt: '2026-05-20T14:55:00Z',
    flightCheck: { mtu: true, handshake: true, hl7Ack: true },
    region: 'us-east-1',
    messagesProcessed24h: 4820,
    liveActivation: {
      activated: true,
      title: 'Live activated',
      detail: 'Production tunnel is active. FHIR and HL7 traffic is flowing through the isolated sidecar.'
    }
  },
  {
    id: 'conn-lv-002',
    partnerName: 'Summit Health Partners',
    ehrVendor: 'Cerner',
    environment: 'live',
    pairedConnectionId: 'conn-sb-002',
    sidecarId: 'sidecar-lv-b3c8',
    tunnelStatus: 'pending',
    wireguardPublicKey: 'mK7jH5gF3dS1aZ9xC8vB6nM4lK2jH0gF8dS6aZ4xC2v=',
    ehrEndpoint: 'https://fhir.summithealth.org/R4',
    lastSyncAt: '2026-05-19T09:15:00Z',
    flightCheck: { mtu: true, handshake: false, hl7Ack: false },
    region: 'us-west-2',
    messagesProcessed24h: 0,
    liveActivation: {
      activated: false,
      blocker: 'customer_action',
      title: 'Customer onboarding in progress',
      detail: 'Summit Health has not completed the Live go-live checklist. BAA countersignature and production webhook URL are still outstanding on the customer side.',
      waitingOn: 'Summit Health Partners'
    }
  },
  {
    id: 'conn-lv-003',
    partnerName: 'Riverside Medical Group',
    ehrVendor: 'Meditech',
    environment: 'live',
    pairedConnectionId: 'conn-sb-003',
    sidecarId: 'sidecar-lv-c9d1',
    tunnelStatus: 'pending',
    wireguardPublicKey: 'pL3mN5oP7qR9sT1uV3wX5yZ7aB9cD1eF3gH5jK7mN9o=',
    ehrEndpoint: 'https://fhir.riversidemedical.org/R4',
    lastSyncAt: '2026-05-20T08:00:00Z',
    flightCheck: { mtu: true, handshake: false, hl7Ack: false },
    region: 'us-east-1',
    messagesProcessed24h: 0,
    liveActivation: {
      activated: false,
      blocker: 'while_documents',
      title: 'While — awaiting signed documents',
      detail: 'Live promotion is paused until While receives the executed BAA amendment for Riverside. Clinic WireGuard work cannot begin until compliance clears the packet.',
      waitingOn: 'While Compliance'
    }
  }
]

/** Optional fourth live pair — blocked by While waiting on documents */
export const liveConnectionWhileDocuments: Connection = {
  id: 'conn-lv-004',
  partnerName: 'Lakeview Pediatrics',
  ehrVendor: 'Epic',
  environment: 'live',
  pairedConnectionId: 'conn-sb-004',
  sidecarId: 'sidecar-lv-w3n8',
  tunnelStatus: 'pending',
  wireguardPublicKey: 'aB5cD7eF9gH1jK3lM5nO7pQ9rS1tU3vW5xY7zA9bC1dE3f=',
  ehrEndpoint: 'https://fhir.lakeviewpeds.org/R4',
  lastSyncAt: '2026-05-18T12:00:00Z',
  flightCheck: { mtu: false, handshake: false, hl7Ack: false },
  region: 'us-east-1',
  messagesProcessed24h: 0,
    liveActivation: {
      activated: false,
      blocker: 'clinic_connectivity',
      title: 'Clinic WireGuard setup delayed',
      detail: 'Lakeview’s clinic IT team has not finished adding While’s public key to their gateway. UDP 51820 was opened, but the peer configuration is still pending on their firewall team.',
      waitingOn: 'Lakeview Pediatrics IT'
    }
}

// Lakeview exists only in live for demo of while_documents — add matching sandbox
export const sandboxConnectionLakeview: Connection = {
  id: 'conn-sb-004',
  partnerName: 'Lakeview Pediatrics',
  ehrVendor: 'Epic',
  environment: 'sandbox',
  pairedConnectionId: 'conn-lv-004',
  sidecarId: 'sidecar-sb-w3n8',
  tunnelStatus: 'active',
  wireguardPublicKey: 'aB5cD7eF9gH1jK3lM5nO7pQ9rS1tU3vW5xY7zA9bC1dE3f=',
  ehrEndpoint: 'https://sandbox.epic.lakeviewpeds.test/fhir/R4',
  lastSyncAt: '2026-05-20T10:00:00Z',
  flightCheck: { mtu: true, handshake: true, hl7Ack: true },
  region: 'us-east-1',
  messagesProcessed24h: 420
}

// Export full lists including Lakeview pair (every sandbox has a live counterpart)
export const allSandboxConnections: Connection[] = [
  ...sandboxConnections,
  sandboxConnectionLakeview
]

export const allLiveConnections: Connection[] = [
  ...liveConnections,
  liveConnectionWhileDocuments
]
