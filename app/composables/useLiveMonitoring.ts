import { createSharedComposable, useDocumentVisibility, useIntervalFn, useLocalStorage } from '@vueuse/core'

const DEFAULT_INTERVAL_MS = 5000

const _useLiveMonitoring = () => {
  const config = useRuntimeConfig()
  const visibility = useDocumentVisibility()
  const isPaused = useLocalStorage('while-live-paused', false)
  const isRefreshing = ref(false)
  const pollingStarted = useState('while-live-polling-started', () => false)

  const { refreshMessages } = useMessages()
  const { refreshMetrics } = useUsageMetrics()
  const { refreshLogs } = useLogs()
  const { refreshTunnel } = useTunnelUptime()
  const { refreshConnections } = useConnections()

  const isLive = computed(() =>
    !config.public.mockMode
    && !isPaused.value
    && visibility.value !== 'hidden'
  )

  async function refreshAllTelemetry() {
    if (config.public.mockMode) return

    isRefreshing.value = true
    try {
      await Promise.all([
        refreshMessages(),
        refreshMetrics(),
        refreshLogs(),
        refreshTunnel(),
        refreshConnections()
      ])
    } finally {
      isRefreshing.value = false
    }
  }

  async function tick() {
    if (!isLive.value || isRefreshing.value) return
    await refreshAllTelemetry()
  }

  function startPolling() {
    if (!import.meta.client || pollingStarted.value || config.public.mockMode) return
    pollingStarted.value = true

    useIntervalFn(tick, DEFAULT_INTERVAL_MS, { immediate: true })

    watch(isLive, (live) => {
      if (live && !isRefreshing.value) {
        void refreshAllTelemetry()
      }
    })
  }

  function pause() {
    isPaused.value = true
  }

  function resume() {
    isPaused.value = false
  }

  function togglePause() {
    isPaused.value = !isPaused.value
  }

  return {
    isPaused,
    isLive,
    isRefreshing,
    refreshAllTelemetry,
    startPolling,
    pause,
    resume,
    togglePause
  }
}

export const useLiveMonitoring = createSharedComposable(_useLiveMonitoring)
