import { createSharedComposable } from '@vueuse/core'
import { allLiveConnections, allSandboxConnections } from '~/data/connections'
import type { Connection, TunnelStatus, WhileEnvironment } from '~/types/while'

interface DashboardConnectionRecord {
  id: string
  orgId: string
  name: string
  connectionType: string
  environment: string
  pairedConnectionId: string | null
  isHidden: boolean
  isDeletable: boolean
}

function mapDashboardConnection(record: DashboardConnectionRecord): Connection {
  const isSystem = record.connectionType === 'system_sandbox'
  return {
    id: record.id,
    partnerName: record.name,
    ehrVendor: isSystem ? 'Other' : 'Epic',
    environment: record.environment as WhileEnvironment,
    pairedConnectionId: record.pairedConnectionId ?? '',
    sidecarId: isSystem ? 'while-sandbox' : `sidecar-${record.id.slice(-4)}`,
    tunnelStatus: isSystem ? 'active' : 'pending',
    wireguardPublicKey: isSystem ? 'n/a' : '—',
    ehrEndpoint: isSystem ? 'While Control Plane Sandbox API' : 'https://sandbox.example.test/fhir/R4',
    lastSyncAt: new Date().toISOString(),
    flightCheck: { mtu: true, handshake: isSystem, hl7Ack: isSystem },
    region: isSystem ? 'control-plane' : 'us-east-1',
    messagesProcessed24h: 0
  }
}

function isLiveActivated(connection: Connection): boolean {
  if (connection.environment === 'sandbox') return true
  return connection.liveActivation?.activated === true
}

const _useConnections = () => {
  const config = useRuntimeConfig()
  const { environment, isLive, isSandbox } = useEnvironment()
  const pendingConnections = useState<Connection[]>('pending-connections', () => [])
  const showSystemSandbox = useLocalStorage('while-show-system-sandbox', true)

  const { data: serverData, refresh: refreshConnections } = useFetch<{ connections: DashboardConnectionRecord[] }>(
    '/api/connections',
    {
      immediate: !config.public.mockMode,
      default: () => ({ connections: [] })
    }
  )

  const realConnections = computed(() => {
    if (config.public.mockMode) return []
    return (serverData.value?.connections ?? [])
      .filter(c => showSystemSandbox.value || c.connectionType !== 'system_sandbox')
      .filter(c => !c.isHidden)
      .filter(c => c.environment === environment.value)
      .map(mapDashboardConnection)
  })

  const connections = computed(() => {
    if (config.public.mockMode) {
      const base = environment.value === 'sandbox' ? allSandboxConnections : allLiveConnections
      return [...base, ...pendingConnections.value.filter(c => c.environment === environment.value)]
    }
    return [...realConnections.value, ...pendingConnections.value.filter(c => c.environment === environment.value)]
  })

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
    config.public.mockMode
      ? allLiveConnections.filter(c => c.liveActivation?.activated).length
      : connections.value.filter(c => c.environment === 'live' && isLiveActivated(c)).length
  )

  function getConnection(id: string) {
    return connections.value.find(c => c.id === id)
      ?? pendingConnections.value.find(c => c.id === id)
  }

  function getConnectionForCurrentEnvironment(id: string): Connection | undefined {
    const direct = getConnection(id)
    if (direct) return direct

    if (config.public.mockMode) {
      const sandbox = allSandboxConnections.find(c => c.id === id)
      const live = allLiveConnections.find(c => c.id === id)

      if (isLive.value) {
        if (live) return live
        if (sandbox) return allLiveConnections.find(c => c.id === sandbox.pairedConnectionId)
      } else {
        if (sandbox) return sandbox
        if (live) return allSandboxConnections.find(c => c.id === live.pairedConnectionId)
      }
    }

    return undefined
  }

  function getPairedConnection(connection: Connection): Connection | undefined {
    if (!connection.pairedConnectionId) return undefined
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

  function isSystemSandbox(connection: Connection) {
    return connection.sidecarId === 'while-sandbox'
  }

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
    isSystemSandbox,
    showSystemSandbox,
    refreshConnections,
    getConnection,
    getConnectionForCurrentEnvironment,
    getPairedConnection,
    getConnectionsByStatus,
    addPendingConnection
  }
}

export const useConnections = createSharedComposable(_useConnections)
