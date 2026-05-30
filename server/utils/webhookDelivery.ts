import { prisma } from '../lib/prisma'

export interface WebhookDeliveryRecord {
  id: string
  event: string
  success: boolean
  statusCode: number | null
  errorMessage: string | null
  createdAt: string
}

export async function getLatestWebhookDelivery(
  orgId: string,
  event?: string
): Promise<WebhookDeliveryRecord | null> {
  const rows = event
    ? await prisma.$queryRaw<Array<{
        id: string
        event: string
        success: boolean
        status_code: number | null
        error_message: string | null
        created_at: Date
      }>>`
        SELECT id, event, success, status_code, error_message, created_at
        FROM webhook_deliveries
        WHERE org_id = ${orgId}::uuid AND event = ${event}
        ORDER BY created_at DESC
        LIMIT 1
      `
    : await prisma.$queryRaw<Array<{
        id: string
        event: string
        success: boolean
        status_code: number | null
        error_message: string | null
        created_at: Date
      }>>`
        SELECT id, event, success, status_code, error_message, created_at
        FROM webhook_deliveries
        WHERE org_id = ${orgId}::uuid
        ORDER BY created_at DESC
        LIMIT 1
      `

  const row = rows[0]
  if (!row) return null

  return {
    id: row.id,
    event: row.event,
    success: row.success,
    statusCode: row.status_code,
    errorMessage: row.error_message,
    createdAt: row.created_at.toISOString()
  }
}
