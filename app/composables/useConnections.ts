import { createSharedComposable } from '@vueuse/core'
import { allLiveConnections, allSandboxConnections } from '~/data/connections'
import type { Connection, TunnelStatus } from '~/types/while'

function isLiveActivated(connection: Connection): boolean {
  if (connection.environment === 'sandbox') return true
  return connection.liveActivation?.activated === true
}

const _useConnections = () => {
  const { environment, isLive, isSandbox } = useEnvironment()
  const pendingConnections = useState<Connection[]>('pending-connections', () => [])

  const connections = computed(() => {
    const base = environment.value === 'sandbox' ? allSandboxConnections : allLiveConnections
    return [...base, ...pendingConnections.value.filter(c => c.environment === environment.value)]
  })

  /** Live connections that are activated — used for operational views (messages, charts, logs) */
  const operationalConnections = computed(() =>
    connections.value.filter(isLiveActivated)
  )

  const blockedLiveConnections = computed(() =>
    isLive.value
      ? connections.value.filter(c => c.environment === 'live' && !isLiveActivated(c))
      : []
  )

  const hasActivatedLiveConnections = computed(() =>
    !isLive.value || operationalConnections.value.length > 0
  )

  const activatedLiveCount = computed(() =>
    allLiveConnections.filter(c => c.liveActivation?.activated).length
  )

  function getConnection(id: string) {
    return connections.value.find(c => c.id === id)
      ?? pendingConnections.value.find(c => c.id === id)
  }

  /** Resolve a route id to the connection for the active environment (follows sandbox ↔ live pair). */
  function getConnectionForCurrentEnvironment(id: string): Connection | undefined {
    const direct = getConnection(id)
    if (direct) return direct

    const sandbox = allSandboxConnections.find(c => c.id === id)
    const live = allLiveConnections.find(c => c.id === id)

    if (isLive.value) {
      if (live) return live
      if (sandbox) return allLiveConnections.find(c => c.id === sandbox.pairedConnectionId)
    } else {
      if (sandbox) return sandbox
      if (live) return allSandboxConnections.find(c => c.id === live.pairedConnectionId)
    }

    return undefined
  }

  function getPairedConnection(connection: Connection): Connection | undefined {
    return getConnectionForCurrentEnvironment(connection.pairedConnectionId)
  }

  function getConnectionsByStatus(status: TunnelStatus) {
    return connections.value.filter(c => c.tunnelStatus === status)
  }

  function addPendingConnection(connection: Connection) {
    pendingConnections.value = [...pendingConnections.value, connection]
  }

  const activeCount = computed(() =>
    operationalConnections.value.filter(c => c.tunnelStatus === 'active').length
  )

  return {
    connections,
    operationalConnections,
    blockedLiveConnections,
    hasActivatedLiveConnections,
    activatedLiveCount,
    activeCount,
    isLive,
    isSandbox,
    isLiveActivated,
    getConnection,
    getConnectionForCurrentEnvironment,
    getPairedConnection,
    getConnectionsByStatus,
    addPendingConnection
  }
}

export const useConnections = createSharedComposable(_useConnections)
