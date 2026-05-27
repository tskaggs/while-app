import { createSharedComposable } from '@vueuse/core'
import { sandboxConnections, liveConnections } from '~/data/connections'
import type { Connection, TunnelStatus } from '~/types/while'

const _useConnections = () => {
  const { environment } = useEnvironment()
  const pendingConnections = useState<Connection[]>('pending-connections', () => [])

  const connections = computed(() => {
    const base = environment.value === 'sandbox' ? sandboxConnections : liveConnections
    return [...base, ...pendingConnections.value.filter(c => c.environment === environment.value)]
  })

  function getConnection(id: string) {
    return connections.value.find(c => c.id === id)
  }

  function getConnectionsByStatus(status: TunnelStatus) {
    return connections.value.filter(c => c.tunnelStatus === status)
  }

  function addPendingConnection(connection: Connection) {
    pendingConnections.value = [...pendingConnections.value, connection]
  }

  const activeCount = computed(() =>
    connections.value.filter(c => c.tunnelStatus === 'active').length
  )

  return {
    connections,
    activeCount,
    getConnection,
    getConnectionsByStatus,
    addPendingConnection
  }
}

export const useConnections = createSharedComposable(_useConnections)
