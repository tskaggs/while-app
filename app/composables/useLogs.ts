import { createSharedComposable } from '@vueuse/core'
import { sandboxLogs, liveLogs } from '~/data/logs'
import type { LogEntry, LogSeverity, LogTimeRange } from '~/types/while'

const _useLogs = () => {
  const { environment } = useEnvironment()
  const anonymize = ref(true)

  const logs = computed(() =>
    environment.value === 'sandbox' ? sandboxLogs : liveLogs
  )

  const displayLogs = computed(() =>
    logs.value.map((log: LogEntry) => ({
      ...log,
      displayMessage: anonymize.value ? log.anonymizedMessage : log.message
    }))
  )

  function filterLogs(options: {
    connectionId?: string
    severity?: LogSeverity
    resourceType?: string
    timeRange?: LogTimeRange
    search?: string
  }) {
    const now = Date.now()
    const rangeMs: Record<LogTimeRange, number> = {
      '1h': 3600000,
      '6h': 21600000,
      '24h': 86400000,
      all: Infinity
    }

    return displayLogs.value.filter((log) => {
      if (options.connectionId && log.connectionId !== options.connectionId) return false
      if (options.severity && log.severity !== options.severity) return false
      if (options.resourceType && log.resourceType !== options.resourceType) return false
      if (options.timeRange && options.timeRange !== 'all') {
        const cutoff = now - rangeMs[options.timeRange]
        if (new Date(log.timestamp).getTime() < cutoff) return false
      }
      if (options.search) {
        const q = options.search.toLowerCase()
        return log.displayMessage.toLowerCase().includes(q)
          || log.partnerName.toLowerCase().includes(q)
          || log.connectionId.toLowerCase().includes(q)
          || log.resourceType?.toLowerCase().includes(q)
      }
      return true
    })
  }

  return { logs, displayLogs, anonymize, filterLogs }
}

export const useLogs = createSharedComposable(_useLogs)
