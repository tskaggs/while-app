import { createSharedComposable } from '@vueuse/core'
import {
  auditToLogEntry,
  liveAuditLogs,
  liveLogs,
  sandboxAuditLogs,
  sandboxLogs,
  tunnelToLogEntry
} from '~/data/logs'
import { liveTunnelLogs, sandboxTunnelLogs } from '~/data/uptime'
import type { LogCategory, LogEntry, LogSeverity, LogTimeRange } from '~/types/while'

export type DisplayLogEntry = LogEntry & { displayMessage: string }

export interface LogFilters {
  connectionId?: string
  category?: LogCategory
  severity?: LogSeverity
  resourceType?: string
  timeRange?: LogTimeRange
  search?: string
}

export const LOG_CATEGORY_OPTIONS: { label: string, value: LogCategory | undefined }[] = [
  { label: 'All categories', value: undefined },
  { label: 'Integration', value: 'integration' },
  { label: 'Tunnel', value: 'tunnel' },
  { label: 'Webhook', value: 'webhook' },
  { label: 'Mapping', value: 'mapping' },
  { label: 'Credential', value: 'credential' },
  { label: 'Sidecar', value: 'sidecar' },
  { label: 'API', value: 'api' },
  { label: 'Audit', value: 'audit' },
  { label: 'System', value: 'system' }
]

export const LOG_SEVERITY_OPTIONS: { label: string, value: LogSeverity | undefined }[] = [
  { label: 'All severities', value: undefined },
  { label: 'Success', value: 'success' },
  { label: 'Info', value: 'info' },
  { label: 'Warning', value: 'warn' },
  { label: 'Error', value: 'error' }
]

export const LOG_TIME_RANGE_OPTIONS: { label: string, value: LogTimeRange }[] = [
  { label: 'Last hour', value: '1h' },
  { label: 'Last 6 hours', value: '6h' },
  { label: 'Last 24 hours', value: '24h' },
  { label: 'All time', value: 'all' }
]

const rangeMs: Record<LogTimeRange, number> = {
  '1h': 3600000,
  '6h': 21600000,
  '24h': 86400000,
  all: Infinity
}

const _useLogs = () => {
  const { environment } = useEnvironment()
  const { operationalConnections, isLive } = useConnections()
  const anonymize = ref(true)

  const rawLogs = computed(() => {
    const integration = environment.value === 'sandbox' ? sandboxLogs : liveLogs
    const tunnel = (environment.value === 'sandbox' ? sandboxTunnelLogs : liveTunnelLogs)
      .map(tunnelToLogEntry)
    const audit = (environment.value === 'sandbox' ? sandboxAuditLogs : liveAuditLogs)
      .map(entry => auditToLogEntry(entry))

    const merged = [...integration, ...tunnel, ...audit]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))

    if (!isLive.value) return merged
    const allowed = new Set(operationalConnections.value.map(c => c.id))
    return merged.filter(log => log.connectionId === '—' || allowed.has(log.connectionId))
  })

  const displayLogs = computed<DisplayLogEntry[]>(() =>
    rawLogs.value.map(log => ({
      ...log,
      displayMessage: anonymize.value ? log.anonymizedMessage : log.message
    }))
  )

  const resourceTypeOptions = computed(() => {
    const types = new Set<string>()
    for (const log of rawLogs.value) {
      if (log.resourceType) types.add(log.resourceType)
    }
    return [
      { label: 'All resource types', value: undefined as string | undefined },
      { label: 'No resource (connectivity / system)', value: '__none__' },
      ...[...types].sort().map(type => ({ label: type, value: type }))
    ]
  })

  function filterLogs(options: LogFilters): DisplayLogEntry[] {
    const now = Date.now()

    return displayLogs.value.filter((log) => {
      if (options.connectionId && log.connectionId !== options.connectionId) return false
      if (options.category && log.category !== options.category) return false
      if (options.severity && log.severity !== options.severity) return false
      if (options.resourceType === '__none__' && log.resourceType) return false
      if (options.resourceType && options.resourceType !== '__none__' && log.resourceType !== options.resourceType) return false
      if (options.timeRange && options.timeRange !== 'all') {
        const cutoff = now - rangeMs[options.timeRange]
        if (new Date(log.timestamp).getTime() < cutoff) return false
      }
      if (options.search) {
        const q = options.search.toLowerCase()
        return log.displayMessage.toLowerCase().includes(q)
          || log.message.toLowerCase().includes(q)
          || log.partnerName.toLowerCase().includes(q)
          || log.connectionId.toLowerCase().includes(q)
          || log.category.toLowerCase().includes(q)
          || log.resourceType?.toLowerCase().includes(q)
          || log.eventType?.toLowerCase().includes(q)
          || log.correlationId?.toLowerCase().includes(q)
          || log.actor?.toLowerCase().includes(q)
      }
      return true
    })
  }

  function getLog(id: string): DisplayLogEntry | undefined {
    return displayLogs.value.find(log => log.id === id)
  }

  function categoryLabel(category: LogCategory): string {
    return LOG_CATEGORY_OPTIONS.find(o => o.value === category)?.label ?? category
  }

  return {
    logs: rawLogs,
    displayLogs,
    anonymize,
    filterLogs,
    getLog,
    categoryLabel,
    resourceTypeOptions
  }
}

export const useLogs = createSharedComposable(_useLogs)
