<script setup lang="ts">
import type { Connection } from '~/types/while'
import type { BadgeStatus, LinkStatus, TopologyBadge, TopologyLink, TopologyNode } from '~/components/connections/topology-map-types'

const props = defineProps<{
  connection: Connection
}>()

function badgeFromCheck(passed: boolean, pending: boolean): BadgeStatus {
  if (passed) return 'success'
  if (pending) return 'review'
  return 'error'
}

function statusClause(status: BadgeStatus | LinkStatus): string {
  if (status === 'success') return 'Currently connected.'
  if (status === 'review') return 'Pending review or setup in progress.'
  if (status === 'error') return 'Failed or unreachable.'
  return ''
}

const isPending = computed(() => props.connection.tunnelStatus === 'pending')
const isError = computed(() => props.connection.tunnelStatus === 'error')
const isActive = computed(() => props.connection.tunnelStatus === 'active')

const secureApiStatus = computed<LinkStatus>(() => {
  if (isError.value) return 'error'
  if (isPending.value || !props.connection.flightCheck.mtu) return 'review'
  return 'success'
})

const wireguardStatus = computed<LinkStatus>(() => {
  if (isError.value) return 'error'
  if (isPending.value || !props.connection.flightCheck.handshake) return 'review'
  if (isActive.value && props.connection.flightCheck.handshake) return 'success'
  return 'review'
})

const links = computed<TopologyLink[]>(() => [
  {
    label: 'Secure API',
    status: secureApiStatus.value,
    tooltip: `TLS-terminated REST path from your application to the While sidecar. ${statusClause(secureApiStatus.value)}`
  },
  {
    label: 'WireGuard',
    status: wireguardStatus.value,
    tooltip: `Encrypted site-to-site VPN between the While sidecar and the clinic network. ${statusClause(wireguardStatus.value)}`
  }
])

const nodes = computed<TopologyNode[]>(() => {
  const { connection } = props
  const pending = connection.tunnelStatus === 'pending'
  const fc = connection.flightCheck
  const msg = connection.messagesProcessed24h.toLocaleString()
  const mtuStatus = badgeFromCheck(fc.mtu, pending && !fc.mtu)
  const wgStatus = badgeFromCheck(fc.handshake, pending)
  const hl7Status = badgeFromCheck(fc.hl7Ack, pending && fc.handshake)

  const appApiStatus: BadgeStatus = isError.value
    ? 'error'
    : isActive.value
      ? 'success'
      : 'review'

  const clinicStatus: BadgeStatus = isError.value
    ? 'error'
    : isActive.value && fc.hl7Ack
      ? 'success'
      : pending
        ? 'review'
        : 'error'

  const clinicReachLabel = isActive.value ? 'Up' : pending ? 'Review' : 'Down'

  return [
    {
      id: 'app',
      title: 'Your App',
      subtitle: 'Outbound integration',
      icon: 'i-iconoir-smartphone-device',
      badges: [
        {
          icon: 'i-iconoir-cube',
          label: 'REST',
          status: appApiStatus,
          tooltip: `HTTPS REST channel from your app to While. ${statusClause(appApiStatus)}`
        },
        {
          icon: 'i-iconoir-flash',
          label: msg,
          status: 'neutral',
          tooltip: `Messages processed through this connection in the last 24 hours (${msg} total).`
        },
        {
          icon: 'i-iconoir-check-circle',
          label: isActive.value ? 'Live' : 'Idle',
          status: appApiStatus,
          tooltip: isActive.value
            ? 'Integration is actively sending or receiving messages.'
            : 'No recent traffic; the integration is idle but may still be configured.'
        },
        {
          icon: 'i-iconoir-activity',
          label: connection.environment,
          status: 'neutral',
          tooltip: connection.environment === 'sandbox'
            ? 'Sandbox environment — mock EHR endpoints, no production PHI.'
            : 'Live environment — production EHR endpoints and PHI policies apply.'
        }
      ]
    },
    {
      id: 'sidecar',
      title: 'While Sidecar',
      subtitle: connection.sidecarId,
      icon: 'i-iconoir-server',
      badges: [
        {
          icon: 'i-iconoir-cube',
          label: 'MTU',
          status: mtuStatus,
          tooltip: `Path MTU discovery across the tunnel (${fc.mtu ? 'passed' : 'not passed'}). Required for large HL7 and FHIR payloads. ${statusClause(mtuStatus)}`
        },
        {
          icon: 'i-iconoir-rocket',
          label: 'WG',
          status: wgStatus,
          tooltip: `WireGuard peer handshake with the clinic gateway (${fc.handshake ? 'complete' : 'incomplete'}). ${statusClause(wgStatus)}`
        },
        {
          icon: 'i-iconoir-check-circle',
          label: 'HL7',
          status: hl7Status,
          tooltip: `HL7 ACK validation from the clinic interface (${fc.hl7Ack ? 'passing' : 'failing'}). ${statusClause(hl7Status)}`
        },
        {
          icon: 'i-iconoir-flash',
          label: msg,
          status: isActive.value ? 'success' : 'neutral',
          tooltip: `Messages routed through this sidecar in the last 24 hours (${msg}).`
        }
      ]
    },
    {
      id: 'clinic',
      title: connection.partnerName,
      subtitle: connection.ehrVendor,
      icon: 'i-iconoir-hospital',
      badges: [
        {
          icon: 'i-iconoir-cube',
          label: connection.region.split('-')[0]?.toUpperCase() ?? 'US',
          status: 'neutral',
          tooltip: `AWS region hosting this connection's sidecar (${connection.region}).`
        },
        {
          icon: 'i-iconoir-rocket',
          label: 'FHIR',
          status: clinicStatus,
          tooltip: `FHIR R4 reachability at ${connection.ehrEndpoint}. ${statusClause(clinicStatus)}`
        },
        {
          icon: 'i-iconoir-check-circle',
          label: clinicReachLabel,
          status: clinicStatus,
          tooltip: clinicReachLabel === 'Up'
            ? 'Clinic EHR is reachable and responding on the tunnel.'
            : clinicReachLabel === 'Review'
              ? 'Clinic connectivity is being validated or awaiting clinic IT action.'
              : 'Clinic EHR is not reachable — tunnel or interface may be down.'
        },
        {
          icon: 'i-iconoir-flash',
          label: connection.ehrVendor.slice(0, 3),
          status: 'neutral',
          tooltip: `EHR vendor for this site: ${connection.ehrVendor}.`
        }
      ]
    }
  ]
})

const linkStatusStyles: Record<LinkStatus, { line: string, dot: string, pill: string }> = {
  success: {
    line: 'bg-success/50',
    dot: 'bg-success ring-success/30',
    pill: 'border-success/40 bg-success/5 text-success'
  },
  error: {
    line: 'bg-error/50',
    dot: 'bg-error ring-error/30',
    pill: 'border-error/40 bg-error/5 text-error'
  },
  review: {
    line: 'bg-warning/50',
    dot: 'bg-warning ring-warning/30',
    pill: 'border-warning/40 bg-warning/5 text-warning'
  }
}

function linkAt(index: number): TopologyLink {
  return links.value[index]!
}

function linkStyle(index: number) {
  return linkStatusStyles[linkAt(index).status]
}

const alertMeta = computed(() => {
  if (isActive.value) return null
  if (isPending.value) {
    return {
      color: 'warning' as const,
      icon: 'i-iconoir-clock',
      title: 'Handshake pending',
      description: 'Clinic IT must add the Sidecar public key to their WireGuard gateway.'
    }
  }
  return {
    color: 'error' as const,
    icon: 'i-iconoir-warning-triangle',
    title: 'Tunnel disconnected',
    description: 'WireGuard peer unreachable. Check clinic gateway configuration.'
  }
})
</script>

<template>
  <UCard
    :ui="{
      root: 'overflow-hidden',
      body: 'p-0'
    }"
  >
    <UAlert
      v-if="connection.provisioningStatus === 'provisioning'"
      color="info"
      variant="subtle"
      class="m-4 mb-0"
      title="Sandbox provisioning in progress"
      description="Configure mappings while your sidecar VM is being prepared."
    />
    <UAlert
      v-else-if="connection.provisioningStatus === 'pending_customer'"
      color="warning"
      variant="subtle"
      class="m-4 mb-0"
      title="Customer data required"
    >
      <template #description>
        Complete required fields on the
        <NuxtLink :to="`/connections/${connection.id}/mapping`" class="text-primary hover:underline">
          Mapping
        </NuxtLink>
        and
        <NuxtLink :to="`/connections/${connection.id}/connectivity`" class="text-primary hover:underline">
          Connectivity
        </NuxtLink>
        tabs.
      </template>
    </UAlert>
    <div
      class="topology-canvas relative px-4 py-8 sm:px-6 sm:py-10"
    >
      <!-- Desktop: horizontal flow -->
      <div class="hidden lg:flex lg:items-stretch lg:gap-0">
        <template
          v-for="(node, index) in nodes"
          :key="node.id"
        >
          <div class="topology-node flex min-w-0 flex-1 flex-col">
            <div
              class="flex h-full flex-col rounded-xl border border-default bg-elevated shadow-sm"
            >
              <div class="flex items-start gap-3 border-b border-default px-4 py-3.5">
                <div
                  class="flex size-10 shrink-0 items-center justify-center rounded-lg border border-default bg-accented/60"
                >
                  <UIcon :name="node.icon" class="size-5 text-muted" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold text-highlighted">
                    {{ node.title }}
                  </p>
                  <p class="truncate text-xs text-muted">
                    {{ node.subtitle }}
                  </p>
                </div>
                <UIcon
                  name="i-iconoir-drag-hand-gesture"
                  class="size-4 shrink-0 text-dimmed"
                />
              </div>
              <div class="flex flex-wrap gap-2 px-4 py-3">
                <ConnectionsTopologyBadgePill
                  v-for="(badge, badgeIndex) in node.badges"
                  :key="badgeIndex"
                  v-bind="badge"
                />
              </div>
            </div>
          </div>

          <div
            v-if="index < links.length"
            class="topology-connector flex w-[min(11rem,14vw)] shrink-0 flex-col justify-center px-1"
          >
            <div class="flex items-center">
              <div
                class="h-px min-w-3 flex-1"
                :class="linkStyle(index).line"
              />
              <span
                class="mx-0.5 size-2 shrink-0 rounded-full ring-2 ring-bg"
                :class="linkStyle(index).dot"
              />
              <UTooltip
                :text="linkAt(index).tooltip"
                :content="{ side: 'top', sideOffset: 6 }"
              >
                <span
                  tabindex="0"
                  class="shrink-0 cursor-help rounded-full border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  :class="linkStyle(index).pill"
                >
                  {{ linkAt(index).label }}
                </span>
              </UTooltip>
              <span
                class="mx-0.5 size-2 shrink-0 rounded-full ring-2 ring-bg"
                :class="linkStyle(index).dot"
              />
              <div
                class="h-px min-w-3 flex-1"
                :class="linkStyle(index).line"
              />
            </div>
          </div>
        </template>
      </div>

      <!-- Mobile / tablet: vertical flow -->
      <div class="flex flex-col gap-0 lg:hidden">
        <template
          v-for="(node, index) in nodes"
          :key="`${node.id}-mobile`"
        >
          <div
            class="flex flex-col rounded-xl border border-default bg-elevated shadow-sm"
          >
            <div class="flex items-start gap-3 border-b border-default px-4 py-3.5">
              <div
                class="flex size-10 shrink-0 items-center justify-center rounded-lg border border-default bg-accented/60"
              >
                <UIcon :name="node.icon" class="size-5 text-muted" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-highlighted">
                  {{ node.title }}
                </p>
                <p class="truncate text-xs text-muted">
                  {{ node.subtitle }}
                </p>
              </div>
              <UIcon
                name="i-iconoir-drag-hand-gesture"
                class="size-4 shrink-0 text-dimmed"
              />
            </div>
            <div class="flex flex-wrap gap-2 px-4 py-3">
              <ConnectionsTopologyBadgePill
                v-for="(badge, badgeIndex) in node.badges"
                :key="badgeIndex"
                v-bind="badge"
              />
            </div>
          </div>

          <div
            v-if="index < links.length"
            class="flex flex-col items-center py-3"
          >
            <div
              class="w-px flex-1 min-h-4"
              :class="linkStyle(index).line"
            />
            <span
              class="my-1 size-2 shrink-0 rounded-full ring-2 ring-bg"
              :class="linkStyle(index).dot"
            />
            <UTooltip
              :text="linkAt(index).tooltip"
              :content="{ side: 'top', sideOffset: 6 }"
            >
              <span
                tabindex="0"
                class="cursor-help rounded-full border px-2.5 py-1 text-[11px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                :class="linkStyle(index).pill"
              >
                {{ linkAt(index).label }}
              </span>
            </UTooltip>
            <span
              class="my-1 size-2 shrink-0 rounded-full ring-2 ring-bg"
              :class="linkStyle(index).dot"
            />
            <div
              class="w-px flex-1 min-h-4"
              :class="linkStyle(index).line"
            />
          </div>
        </template>
      </div>

      <!-- Legend -->
      <div
        class="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-default pt-5 text-xs text-muted"
      >
        <span class="inline-flex items-center gap-1.5">
          <span class="size-2 rounded-full bg-success" />
          Connected
        </span>
        <span class="inline-flex items-center gap-1.5">
          <span class="size-2 rounded-full bg-warning" />
          To be reviewed
        </span>
        <span class="inline-flex items-center gap-1.5">
          <span class="size-2 rounded-full bg-error" />
          Failed
        </span>
      </div>
    </div>

    <UAlert
      v-if="alertMeta"
      class="mx-4 mb-4 sm:mx-6"
      :color="alertMeta.color"
      variant="subtle"
      :icon="alertMeta.icon"
      :title="alertMeta.title"
      :description="alertMeta.description"
    />
  </UCard>
</template>

<style scoped>
.topology-canvas {
  background-color: var(--ui-bg);
  background-image: radial-gradient(circle, var(--ui-border) 1px, transparent 1px);
  background-size: 16px 16px;
}

html.dark .topology-canvas {
  background-image: radial-gradient(circle, rgb(255 255 255 / 0.06) 1px, transparent 1px);
}

.topology-node {
  position: relative;
  z-index: 1;
}

.topology-connector {
  position: relative;
  z-index: 0;
  align-self: center;
  min-height: 5.5rem;
}
</style>
