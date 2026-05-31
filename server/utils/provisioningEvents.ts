import type { ProvisioningStage } from './orchestratorClient'

export interface ProvisioningEventPayload {
  jobId: string
  connectionId: string
  environment: string
  stage: ProvisioningStage | string
  progressPercent: number
  status: string
  provisioningStatus?: string
  tunnelStatus?: string
  errorMessage?: string
  flightCheck?: {
    mtu: boolean
    handshake: boolean
    hl7Ack: boolean
  }
}

type Listener = (payload: ProvisioningEventPayload) => void

const listeners = new Map<string, Set<Listener>>()

export function subscribeProvisioningEvents(connectionId: string, listener: Listener) {
  if (!listeners.has(connectionId)) {
    listeners.set(connectionId, new Set())
  }
  listeners.get(connectionId)!.add(listener)
  return () => {
    listeners.get(connectionId)?.delete(listener)
  }
}

export function emitProvisioningEvent(connectionId: string, payload: ProvisioningEventPayload) {
  const set = listeners.get(connectionId)
  if (!set) return
  for (const listener of set) {
    listener(payload)
  }
}
