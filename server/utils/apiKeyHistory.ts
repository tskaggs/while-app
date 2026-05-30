export interface ApiKeyRecord {
  id: string
  keyPrefix: string
  environment: string
  isActive: boolean
  createdAt: Date
  revokedAt?: Date | null
}

export interface ApiKeyHistoryEvent {
  id: string
  type: 'created' | 'revoked'
  keyPrefix: string
  environment: string
  occurredAt: string
  isActive: boolean
}

export function buildApiKeyHistoryEvents(keys: ApiKeyRecord[]): ApiKeyHistoryEvent[] {
  const sortedAsc = [...keys].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  )

  const events: ApiKeyHistoryEvent[] = []

  for (let index = 0; index < sortedAsc.length; index++) {
    const key = sortedAsc[index]!
    events.push({
      id: `${key.id}-created`,
      type: 'created',
      keyPrefix: key.keyPrefix,
      environment: key.environment,
      occurredAt: key.createdAt.toISOString(),
      isActive: key.isActive
    })

    if (!key.isActive) {
      const successor = sortedAsc[index + 1]
      const revokedAt = key.revokedAt ?? successor?.createdAt ?? key.createdAt
      events.push({
        id: `${key.id}-revoked`,
        type: 'revoked',
        keyPrefix: key.keyPrefix,
        environment: key.environment,
        occurredAt: revokedAt.toISOString(),
        isActive: false
      })
    }
  }

  return events.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  )
}
