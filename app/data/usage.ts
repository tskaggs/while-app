import type { UsageDataPoint, UsageStat } from '~/types/while'

export const sandboxUsageStats: UsageStat[] = [
  {
    title: 'Active Connections',
    icon: 'i-lucide-network',
    value: 2,
    variation: 0,
    description: 'Tunnels with active handshake'
  },
  {
    title: 'Messages Processed',
    icon: 'i-lucide-activity',
    value: '2,096',
    variation: 12,
    description: 'Last 24 hours',
    to: '/messages'
  },
  {
    title: 'Tunnel Uptime',
    icon: 'i-lucide-shield-check',
    value: '99.2%',
    variation: 0.3,
    description: 'Rolling 30-day average',
    to: '/uptime'
  },
  {
    title: 'Pending Requests',
    icon: 'i-lucide-clock',
    value: 1,
    variation: -25,
    description: 'Partner onboarding in progress'
  }
]

export const liveUsageStats: UsageStat[] = [
  {
    title: 'Active Connections',
    icon: 'i-lucide-network',
    value: 2,
    variation: 50,
    description: 'Tunnels with active handshake'
  },
  {
    title: 'Messages Processed',
    icon: 'i-lucide-activity',
    value: '8,390',
    variation: 8,
    description: 'Last 24 hours',
    to: '/messages'
  },
  {
    title: 'Tunnel Uptime',
    icon: 'i-lucide-shield-check',
    value: '99.8%',
    variation: 0.1,
    description: 'Rolling 30-day average',
    to: '/uptime'
  },
  {
    title: 'Pending Requests',
    icon: 'i-lucide-clock',
    value: 2,
    variation: 100,
    description: 'Partner onboarding in progress'
  }
]

function generateUsageData(baseMessages: number, days: number): UsageDataPoint[] {
  const data: UsageDataPoint[] = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const variance = Math.floor(Math.random() * baseMessages * 0.4)
    const messages = baseMessages + variance - Math.floor(baseMessages * 0.2)
    data.push({
      date: date.toISOString().split('T')[0]!,
      messages,
      fhirResources: Math.floor(messages * 0.85)
    })
  }

  return data
}

export const sandboxUsageChart = generateUsageData(180, 14)
export const liveUsageChart = generateUsageData(720, 14)
