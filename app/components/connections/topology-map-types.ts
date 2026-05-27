export type LinkStatus = 'success' | 'error' | 'review'
export type BadgeStatus = LinkStatus | 'neutral'

export interface TopologyBadge {
  icon: string
  label: string
  status: BadgeStatus
  tooltip: string
}

export interface TopologyNode {
  id: string
  title: string
  subtitle: string
  icon: string
  badges: TopologyBadge[]
}

export interface TopologyLink {
  label: string
  status: LinkStatus
  tooltip: string
}
