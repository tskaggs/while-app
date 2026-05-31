<script setup lang="ts">
import type { Connection } from '~/types/while'
import type { BadgeStatus, LinkStatus, TopologyBadge, TopologyLink, TopologyNode } from '~/components/connections/topology-map-types'

const props = defineProps<{
  connection: Connection
}>()

const { isSystemSandbox } = useConnections()

const systemSandbox = computed(() => isSystemSandbox(props.connection))

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

const isPending = computed(() =>
  !systemSandbox.value && props.connection.tunnelStatus === 'pending'
)
const isError = computed(() =>
  !systemSandbox.value && props.connection.tunnelStatus === 'error'
)
const isActive = computed(() =>
  systemSandbox.value
    ? props.connection.flightCheck.hl7Ack
    : props.connection.tunnelStatus === 'active'
)

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

const links = computed<TopologyLink[]>(() => {
  if (systemSandbox.value) {
    const apiStatus: LinkStatus = props.connection.flightCheck.hl7Ack ? 'success' : 'review'
    return [
      {
        label: 'REST API',
        status: apiStatus,
        tooltip: `Bearer-authenticated HTTPS from your app to the While control plane. ${statusClause(apiStatus)}`
      },
      {
        label: 'FHIR R4',
        status: apiStatus,
        tooltip: `Synthetic patient and clinical resources from the sandbox catalog. ${statusClause(apiStatus)}`
      }
    ]
  }

  return [
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
  ]
})

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

  if (systemSandbox.value) {
    const ready = connection.flightCheck.hl7Ack
    const apiStatus: BadgeStatus = ready ? 'success' : 'review'
    return [
      {
        id: 'app',
        title: 'Your App',
        subtitle: 'Integration client',
        icon: 'i-iconoir-smartphone-device',
        badges: [
          {
            icon: 'i-iconoir-cube',
            label: 'REST',
            status: apiStatus,
            tooltip: `HTTPS REST calls to While sandbox APIs. ${statusClause(apiStatus)}`
          },
          {
            icon: 'i-iconoir-flash',
            label: msg,
            status: 'neutral',
            tooltip: `Webhook and API events processed in the last 24 hours (${msg} total).`
          },
          {
            icon: 'i-iconoir-check-circle',
            label: ready ? 'Ready' : 'Setup',
            status: apiStatus,
            tooltip: ready
              ? 'Mapping and credentials are configured for sandbox API calls.'
              : 'Complete mapping and credentials before relying on sandbox responses.'
          },
          {
            icon: 'i-iconoir-activity',
            label: 'sandbox',
            status: 'neutral',
            tooltip: 'System sandbox — synthetic FHIR data on the control plane; no live twin.'
          }
        ]
      },
      {
        id: 'sidecar',
        title: 'While Control Plane',
        subtitle: connection.sidecarId,
        icon: 'i-iconoir-server',
        badges: [
          {
            icon: 'i-iconoir-cube',
            label: 'API',
            status: apiStatus,
            tooltip: `Sandbox catalog, patient reads, and webhook triggers. ${statusClause(apiStatus)}`
          },
          {
            icon: 'i-iconoir-rocket',
            label: 'FHIR',
            status: apiStatus,
            tooltip: `Synthetic FHIR R4 resources scoped to your organization. ${statusClause(apiStatus)}`
          },
          {
            icon: 'i-iconoir-check-circle',
            label: 'Catalog',
            status: apiStatus,
            tooltip: `Field mappings and sandbox profile ${ready ? 'ready' : 'in progress'}. ${statusClause(apiStatus)}`
          },
          {
            icon: 'i-iconoir-flash',
            label: msg,
            status: ready ? 'success' : 'neutral',
            tooltip: `Events routed through the control plane in the last 24 hours (${msg}).`
          }
        ]
      },
      {
        id: 'clinic',
        title: connection.partnerName,
        subtitle: connection.ehrEndpoint,
        icon: 'i-iconoir-hospital',
        badges: [
          {
            icon: 'i-iconoir-cube',
            label: 'Synth',
            status: 'neutral',
            tooltip: 'Synthetic clinic data — not a real EHR endpoint.'
          },
          {
            icon: 'i-iconoir-rocket',
            label: 'FHIR',
            status: apiStatus,
            tooltip: `Synthetic FHIR R4 patient and observation data. ${statusClause(apiStatus)}`
          },
          {
            icon: 'i-iconoir-check-circle',
            label: ready ? 'Active' : 'Pending',
            status: apiStatus,
            tooltip: ready
              ? 'Sandbox clinic responses are available for integration testing.'
              : 'Finish mapping setup to unlock full sandbox catalog responses.'
          },
          {
            icon: 'i-iconoir-flash',
            label: connection.ehrVendor.slice(0, 3),
            status: 'neutral',
            tooltip: `Origin EHR profile for default mappings: ${connection.ehrVendor}.`
          }
        ]
      }
    ]
  }

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

function linkAt(index: number): TopologyLink {
  return links.value[index]!
}

const platformLayerLabel = computed(() =>
  systemSandbox.value ? 'Control plane' : 'While platform'
)
const endpointLayerLabel = computed(() =>
  systemSandbox.value ? 'Synthetic clinic' : 'Clinic network'
)
const secondLinkVariant = computed(() =>
  systemSandbox.value ? 'api' as const : 'vpn' as const
)

const alertMeta = computed(() => {
  if (systemSandbox.value) {
    if (props.connection.flightCheck.hl7Ack) return null
    return {
      color: 'warning' as const,
      icon: 'i-iconoir-clock',
      title: 'Sandbox setup in progress',
      description: 'Complete field mappings on the Mapping tab to unlock the full sandbox catalog.'
    }
  }
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
    class="while-card overflow-hidden"
    :ui="{
      root: 'overflow-hidden',
      body: 'p-0'
    }"
  >
    <UAlert
      v-if="!systemSandbox && connection.provisioningStatus === 'provisioning'"
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
    <div class="topology-canvas relative overflow-hidden px-3 py-8 sm:px-6 sm:py-10">
      <!-- Isometric grid -->
      <div class="topology-iso-grid pointer-events-none absolute inset-0" aria-hidden="true" />

      <!-- Desktop: layered isometric flow -->
      <div class="relative hidden lg:flex lg:items-start lg:gap-0">
        <ConnectionsTopologyIsometricNode
          :node="nodes[0]!"
          layer-label="Client layer"
          icon-type="device"
          :active="isActive || isPending"
        />
        <ConnectionsTopologyIsometricConnector
          :label="linkAt(0).label"
          :status="linkAt(0).status"
          :tooltip="linkAt(0).tooltip"
          variant="api"
        />
        <ConnectionsTopologyIsometricNode
          :node="nodes[1]!"
          :layer-label="platformLayerLabel"
          icon-type="server"
          :active="systemSandbox ? isActive : !isError"
        />
        <ConnectionsTopologyIsometricConnector
          :label="linkAt(1).label"
          :status="linkAt(1).status"
          :tooltip="linkAt(1).tooltip"
          :variant="secondLinkVariant"
        />
        <ConnectionsTopologyIsometricNode
          :node="nodes[2]!"
          :layer-label="endpointLayerLabel"
          icon-type="clinic"
          :active="isActive && connection.flightCheck.hl7Ack"
        />
      </div>

      <!-- Mobile / tablet: vertical isometric stack -->
      <div class="relative flex flex-col items-stretch gap-0 lg:hidden">
        <ConnectionsTopologyIsometricNode
          :node="nodes[0]!"
          layer-label="Client layer"
          icon-type="device"
          :active="isActive || isPending"
        />
        <ConnectionsTopologyIsometricConnector
          :label="linkAt(0).label"
          :status="linkAt(0).status"
          :tooltip="linkAt(0).tooltip"
          variant="api"
          vertical
        />
        <ConnectionsTopologyIsometricNode
          :node="nodes[1]!"
          :layer-label="platformLayerLabel"
          icon-type="server"
          :active="systemSandbox ? isActive : !isError"
        />
        <ConnectionsTopologyIsometricConnector
          :label="linkAt(1).label"
          :status="linkAt(1).status"
          :tooltip="linkAt(1).tooltip"
          :variant="secondLinkVariant"
          vertical
        />
        <ConnectionsTopologyIsometricNode
          :node="nodes[2]!"
          :layer-label="endpointLayerLabel"
          icon-type="clinic"
          :active="isActive && connection.flightCheck.hl7Ack"
        />
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
  --topo-accent: var(--color-while-500);
  --topo-accent-soft: var(--color-while-300);
  --topo-face-top: var(--color-while-400);
  --topo-face-top-end: var(--color-while-500);
  --topo-face-left: var(--color-while-600);
  --topo-face-left-end: var(--color-while-800);
  --topo-face-right: var(--color-while-500);
  --topo-face-right-end: var(--color-while-700);
  --topo-plinth: var(--ui-bg-accented);
  --topo-plinth-edge: var(--ui-border);
  --topo-screen: var(--ui-bg-elevated);
  --topo-screen-edge: color-mix(in srgb, var(--color-while-500) 35%, var(--ui-border));
  --topo-shadow: var(--color-while-900);
  --topo-wire-fill: color-mix(in srgb, var(--color-while-500) 4%, transparent);
  --topo-wire-edge: color-mix(in srgb, var(--color-while-500) 28%, var(--ui-border));
  --topo-wire-highlight: var(--color-while-400);

  background-color: var(--ui-bg);
}

.topology-iso-grid {
  background-image:
    linear-gradient(150deg, transparent 24.5%, color-mix(in srgb, var(--ui-border) 65%, transparent) 25%, color-mix(in srgb, var(--ui-border) 65%, transparent) 25.5%, transparent 26%),
    linear-gradient(30deg, transparent 24.5%, color-mix(in srgb, var(--ui-border) 65%, transparent) 25%, color-mix(in srgb, var(--ui-border) 65%, transparent) 25.5%, transparent 26%);
  background-size: 28px 48px;
  background-position: center top;
  opacity: 0.55;
  mask-image: radial-gradient(ellipse 90% 85% at 50% 45%, black 30%, transparent 100%);
}

html.dark .topology-canvas {
  --topo-face-top: var(--color-while-500);
  --topo-face-top-end: var(--color-while-600);
  --topo-face-left: var(--color-while-700);
  --topo-face-left-end: var(--color-while-950);
  --topo-face-right: var(--color-while-600);
  --topo-face-right-end: var(--color-while-800);
  --topo-wire-fill: color-mix(in srgb, var(--color-while-400) 8%, transparent);
  --topo-wire-edge: color-mix(in srgb, var(--color-while-400) 35%, var(--ui-border));
}

html.dark .topology-iso-grid {
  opacity: 0.35;
}
</style>
