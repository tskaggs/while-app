import type { H3Event } from 'h3'
import { requireMachineOrg } from '../authSession'

export type TelemetryEnvironment = 'sandbox' | 'live'

export function parseTelemetryQuery(event: H3Event) {
  const query = getQuery(event)
  const environment = query.environment === 'live' ? 'live' : 'sandbox'
  return { environment, query }
}

export async function requireTelemetryOrg(event: H3Event) {
  const { machineOrgId } = await requireMachineOrg(event)
  const { environment, query } = parseTelemetryQuery(event)
  return { machineOrgId, environment, query }
}

export function parseDateQuery(value: unknown, fallback = new Date()): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }
  return fallback.toISOString().slice(0, 10)
}

export function dayRangeUtc(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00.000Z`)
  const end = new Date(`${dateStr}T23:59:59.999Z`)
  return { start, end }
}

export function timeRangeCutoff(range: string | undefined): Date | null {
  const now = Date.now()
  switch (range) {
    case '1h': return new Date(now - 3600000)
    case '6h': return new Date(now - 21600000)
    case '24h': return new Date(now - 86400000)
    default: return null
  }
}
