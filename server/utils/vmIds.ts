export function sandboxVmId(connectionId: string) {
  return `fc-sa-${connectionId}`
}

export function liveVmId(connectionId: string) {
  return `fc-li-${connectionId}`
}

export function vmIdForConnection(connectionId: string, environment: string) {
  return environment === 'live' ? liveVmId(connectionId) : sandboxVmId(connectionId)
}
