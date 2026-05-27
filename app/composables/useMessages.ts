import { createSharedComposable } from '@vueuse/core'
import { sandboxMessages, liveMessages } from '~/data/messages'
import { getChartColor } from '~/utils/unovis'
import type {
  MessageDirection,
  MessageFormat,
  MessageGranularity,
  MessageHistogramBucket,
  MessageStatus,
  ProcessedMessage
} from '~/types/while'

export interface MessageFilters {
  date?: string
  hour?: number
  connectionId?: string
  direction?: MessageDirection
  format?: MessageFormat
  status?: MessageStatus
  search?: string
}

export interface HistogramOptions extends MessageFilters {
  granularity: MessageGranularity
}


function isSameDay(timestamp: string, date: string) {
  return timestamp.startsWith(date)
}

function filterMessages(messages: ProcessedMessage[], options: MessageFilters) {
  const query = options.search?.trim().toLowerCase()

  return messages.filter((message) => {
    if (options.date && !isSameDay(message.timestamp, options.date)) return false
    if (options.hour !== undefined) {
      const date = new Date(message.timestamp)
      if (date.getUTCHours() !== options.hour) return false
    }
    if (options.connectionId && message.connectionId !== options.connectionId) return false
    if (options.direction && message.direction !== options.direction) return false
    if (options.format && message.format !== options.format) return false
    if (options.status && message.status !== options.status) return false
    if (query) {
      return message.summary.toLowerCase().includes(query)
        || message.partnerName.toLowerCase().includes(query)
        || message.messageType.toLowerCase().includes(query)
        || message.connectionId.toLowerCase().includes(query)
    }
    return true
  })
}

function buildHistogram(
  messages: ProcessedMessage[],
  options: HistogramOptions
): { buckets: MessageHistogramBucket[], connections: Array<{ id: string, partnerName: string, color: string }> } {
  const scoped = filterMessages(messages, options)

  const connectionMap = new Map<string, string>()
  for (const message of scoped) {
    connectionMap.set(message.connectionId, message.partnerName)
  }

  const connections = [...connectionMap.entries()].map(([id, partnerName], index) => ({
    id,
    partnerName,
    color: getChartColor(index)
  }))

  const buckets: MessageHistogramBucket[] = []
  const showHourlyBuckets = options.granularity === 'hour'
    || (options.granularity === 'minute' && options.hour === undefined)

  if (showHourlyBuckets) {
    for (let hour = 0; hour < 24; hour++) {
      const counts = Object.fromEntries(connections.map(({ id }) => [id, 0]))
      for (const message of scoped) {
        const date = new Date(message.timestamp)
        if (date.getUTCHours() !== hour) continue
        counts[message.connectionId] = (counts[message.connectionId] ?? 0) + 1
      }
      buckets.push({
        label: `${String(hour).padStart(2, '0')}:00`,
        bucketStart: `${options.date}T${String(hour).padStart(2, '0')}:00:00.000Z`,
        counts
      })
    }
  } else {
    const hour = options.hour ?? 0
    for (let minute = 0; minute < 60; minute++) {
      const counts = Object.fromEntries(connections.map(({ id }) => [id, 0]))
      for (const message of scoped) {
        const date = new Date(message.timestamp)
        if (date.getUTCHours() !== hour || date.getUTCMinutes() !== minute) continue
        counts[message.connectionId] = (counts[message.connectionId] ?? 0) + 1
      }
      buckets.push({
        label: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        bucketStart: `${options.date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`,
        counts
      })
    }
  }

  return { buckets, connections }
}

const _useMessages = () => {
  const { environment } = useEnvironment()
  const { operationalConnections, isLive } = useConnections()

  const messages = computed(() => {
    const base = environment.value === 'sandbox' ? sandboxMessages : liveMessages
    if (!isLive.value) return base
    const allowed = new Set(operationalConnections.value.map(c => c.id))
    return base.filter(m => allowed.has(m.connectionId))
  })

  return {
    messages,
    filterMessages: (options: MessageFilters) => filterMessages(messages.value, options),
    buildHistogram: (options: HistogramOptions) => buildHistogram(messages.value, options)
  }
}

export const useMessages = createSharedComposable(_useMessages)
