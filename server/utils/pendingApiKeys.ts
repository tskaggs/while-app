const pendingKeys = new Map<string, string>()

export function storePendingApiKey(orgId: string, rawKey: string) {
  pendingKeys.set(orgId, rawKey)
}

export function getPendingApiKey(orgId: string) {
  return pendingKeys.get(orgId) ?? null
}

export function clearPendingApiKey(orgId: string) {
  pendingKeys.delete(orgId)
}
