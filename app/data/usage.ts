import type { Connection, UsageDataPoint, UsageStat } from '~/types/while'

function pseudoRandom(seed: number) {
  return ((seed * 9301 + 49297) % 233280) / 233280
}

function connectionDayVolume(
  connectionId: string,
  date: string,
  dailyBase: number,
  dayIndex: number
): number {
  let hash = 0
  const key = `${connectionId}:${date}:${dayIndex}`
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash)
  const variance = 0.55 + pseudoRandom(hash) * 0.9
  return Math.max(0, Math.floor(dailyBase * variance))
}

export function attachConnectionBreakdown(
  points: UsageDataPoint[],
  connections: Pick<Connection, 'id' | 'messagesProcessed24h' | 'tunnelStatus'>[]
): UsageDataPoint[] {
  const days = Math.max(points.length, 1)

  return points.map((point, dayIndex) => {
    const byConnection: Record<string, number> = {}
    let sum = 0

    for (const conn of connections) {
      const statusFactor = conn.tunnelStatus === 'active'
        ? 1
        : conn.tunnelStatus === 'pending'
          ? 0.12
          : 0.05
      const dailyBase = (conn.messagesProcessed24h / days) * statusFactor
      const value = connectionDayVolume(conn.id, point.date, dailyBase, dayIndex)
      byConnection[conn.id] = value
      sum += value
    }

    return {
      ...point,
      byConnection,
      messages: sum || point.messages,
      fhirResources: Math.floor((sum || point.messages) * 0.85)
    }
  })
}

export const sandboxUsageStats: UsageStat[] = [
  {
    title: 'Active Connections',
    icon: 'i-iconoir-network',
    value: 2,
    variation: 0,
    description: 'Tunnels with active handshake'
  },
  {
    title: 'Messages Processed',
    icon: 'i-iconoir-activity',
    value: '2,096',
    variation: 12,
    description: 'Last 24 hours',
    to: '/messages'
  },
  {
    title: 'Tunnel Uptime',
    icon: 'i-iconoir-shield-check',
    value: '99.2%',
    variation: 0.3,
    description: 'Rolling 30-day average',
    to: '/uptime'
  },
  {
    title: 'Pending Requests',
    icon: 'i-iconoir-clock',
    value: 1,
    variation: -25,
    description: 'Partner onboarding in progress'
  }
]

export const liveUsageStats: UsageStat[] = [
  {
    title: 'Active Connections',
    icon: 'i-iconoir-network',
    value: 1,
    variation: 0,
    description: 'Live activated with active tunnel'
  },
  {
    title: 'Messages Processed',
    icon: 'i-iconoir-activity',
    value: '4,820',
    variation: 8,
    description: 'Last 24 hours (activated Live only)',
    to: '/messages'
  },
  {
    title: 'Tunnel Uptime',
    icon: 'i-iconoir-shield-check',
    value: '99.8%',
    variation: 0.1,
    description: 'Rolling 30-day average',
    to: '/uptime'
  },
  {
    title: 'Pending Requests',
    icon: 'i-iconoir-clock',
    value: 2,
    variation: 100,
    description: 'Partner onboarding in progress'
  }
]

function generateUsageData(baseMessages: number, days: number): UsageDataPoint[] {
  const data: UsageDataPoint[] = []
  const now = new Date('2026-05-20T12:00:00.000Z')

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const variance = Math.floor(Math.random() * baseMessages * 0.4)
    const messages = baseMessages + variance - Math.floor(baseMessages * 0.2)
    const daySeed = date.getDate() + date.getMonth()
    const uptime = Math.min(
      100,
      Math.max(88, 99.6 - (daySeed % 5) * 0.4 - (i === days - 3 ? 12 : 0))
    )

    data.push({
      date: date.toISOString().split('T')[0]!,
      messages,
      fhirResources: Math.floor(messages * 0.85),
      uptime: Math.round(uptime * 10) / 10,
      byConnection: {}
    })
  }

  return data
}

export const sandboxUsageChart = generateUsageData(180, 14)
export const liveUsageChart = generateUsageData(720, 14)
