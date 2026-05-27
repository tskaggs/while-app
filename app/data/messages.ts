import { allLiveConnections, allSandboxConnections } from '~/data/connections'
import type {
  Connection,
  MessageDirection,
  MessageFormat,
  MessageStatus,
  ProcessedMessage
} from '~/types/while'

const messageTemplates: Array<{
  format: MessageFormat
  direction: MessageDirection
  messageType: string
  resourceType?: string
  summary: string
}> = [
  {
    format: 'hl7',
    direction: 'inbound',
    messageType: 'ADT^A01',
    summary: 'Patient admit notification received from EHR'
  },
  {
    format: 'hl7',
    direction: 'inbound',
    messageType: 'ORU^R01',
    resourceType: 'DiagnosticReport',
    summary: 'Lab result ORU message received for mapping'
  },
  {
    format: 'hl7',
    direction: 'outbound',
    messageType: 'ACK',
    summary: 'HL7 ACK sent to confirm message receipt'
  },
  {
    format: 'fhir',
    direction: 'inbound',
    messageType: 'Patient',
    resourceType: 'Patient',
    summary: 'FHIR Patient resource read from partner endpoint'
  },
  {
    format: 'fhir',
    direction: 'outbound',
    messageType: 'Observation',
    resourceType: 'Observation',
    summary: 'Observation bundle delivered to partner webhook'
  },
  {
    format: 'fhir',
    direction: 'outbound',
    messageType: 'Encounter',
    resourceType: 'Encounter',
    summary: 'Encounter bundle forwarded after normalization'
  },
  {
    format: 'fhir',
    direction: 'inbound',
    messageType: 'MedicationRequest',
    resourceType: 'MedicationRequest',
    summary: 'MedicationRequest subscription notification received'
  },
  {
    format: 'hl7',
    direction: 'outbound',
    messageType: 'SIU^S12',
    resourceType: 'Appointment',
    summary: 'Scheduling update forwarded to partner system'
  }
]

function pseudoRandom(seed: number) {
  return ((seed * 9301 + 49297) % 233280) / 233280
}

function generateMessages(connections: Connection[], prefix: string): ProcessedMessage[] {
  const messages: ProcessedMessage[] = []
  let seed = 1

  for (const connection of connections) {
    const volume = Math.max(18, Math.floor(connection.messagesProcessed24h / 25))

    for (let index = 0; index < volume; index++) {
      const template = messageTemplates[Math.floor(pseudoRandom(seed++) * messageTemplates.length)]!
      const dayOffset = Math.floor(pseudoRandom(seed++) * 3)
      const hour = Math.floor(pseudoRandom(seed++) * 24)
      const minute = Math.floor(pseudoRandom(seed++) * 60)
      const second = Math.floor(pseudoRandom(seed++) * 60)
      const date = new Date(Date.UTC(2026, 4, 20 - dayOffset, hour, minute, second))
      const failed = pseudoRandom(seed++) < 0.06

      messages.push({
        id: `${prefix}-${String(messages.length + 1).padStart(4, '0')}`,
        timestamp: date.toISOString(),
        connectionId: connection.id,
        partnerName: connection.partnerName,
        direction: template.direction,
        format: template.format,
        messageType: template.messageType,
        resourceType: template.resourceType,
        status: failed ? 'failed' : pseudoRandom(seed++) < 0.04 ? 'pending' : 'success',
        summary: failed
          ? `${template.summary} — delivery failed, retry scheduled`
          : template.summary
      })
    }
  }

  return messages.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

export const sandboxMessages = generateMessages(allSandboxConnections, 'msg-sb')
export const liveMessages = generateMessages(allLiveConnections, 'msg-lv')
