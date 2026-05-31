<script setup lang="ts">
import type { Connection } from '~/types/while'

const props = defineProps<{
  connection: Connection
}>()

const toast = useToast()

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text)
  toast.add({ title: 'Copied to clipboard', description: label, icon: 'i-iconoir-copy' })
}

const sidecarEndpoint = computed(() => {
  if (props.connection.sidecarId === 'while-sandbox') {
    return 'While control plane (no clinic VPN)'
  }
  return `${props.connection.sidecarId}.sidecar.while.internal`
})
</script>

<template>
  <div class="space-y-5">
    <ConnectionsConnectivitySectionIntro
      title="VPN & tunnel"
      description="WireGuard tunnel details between your While sidecar and the clinic network. Share VPN fields with your clinic IT team for firewall and routing setup."
      icon="i-iconoir-shield-check"
    />

    <ConnectionsConnectivityFieldGroup
      title="Identity"
      description="Identifiers While and your clinic use to reference this integration."
    >
      <ConnectionsConnectivityFieldBlock
        label="Connection ID"
        description="While-assigned identifier for this integration."
        help="Used in webhook payloads as connection_id and in support requests. Find it on this page, in webhook JSON, and in the Connections list."
      >
        <div class="flex items-center gap-2">
          <code class="flex-1 break-all font-mono text-xs text-highlighted">{{ connection.id }}</code>
          <UButton
            icon="i-iconoir-copy"
            color="neutral"
            variant="ghost"
            size="xs"
            aria-label="Copy connection ID"
            @click="copyToClipboard(connection.id, 'Connection ID')"
          />
        </div>
      </ConnectionsConnectivityFieldBlock>

      <ConnectionsConnectivityFieldBlock
        label="Sidecar ID"
        description="Unique ID for the While sidecar VM serving this connection."
        help="While provisions this during onboarding. Reference it when contacting While support about tunnel issues."
      >
        <code class="block break-all font-mono text-xs text-highlighted">{{ connection.sidecarId }}</code>
      </ConnectionsConnectivityFieldBlock>

      <ConnectionsConnectivityFieldBlock
        v-if="connection.pairedConnectionId"
        label="Paired connection"
        description="Linked connection in the other environment (sandbox ↔ live)."
        help="Each clinic partner has a sandbox twin for testing and a live connection for production. Use the paired ID when comparing configuration between environments."
      >
        <NuxtLink
          :to="`/connections/${connection.pairedConnectionId}/connectivity`"
          class="block break-all font-mono text-xs text-primary hover:underline"
        >
          {{ connection.pairedConnectionId }}
        </NuxtLink>
      </ConnectionsConnectivityFieldBlock>
    </ConnectionsConnectivityFieldGroup>

    <ConnectionsConnectivityFieldGroup
      title="Tunnel endpoints"
      description="Network details for WireGuard peering and firewall rules."
    >
      <ConnectionsConnectivityFieldBlock
        label="Sidecar endpoint"
        description="Hostname While uses for the encrypted tunnel endpoint."
        help="Clinic firewalls may need to allow outbound UDP to this endpoint. While shares the exact IP and port during provisioning if your network team requires it."
      >
        <code class="block break-all font-mono text-xs text-highlighted">{{ sidecarEndpoint }}</code>
      </ConnectionsConnectivityFieldBlock>

      <ConnectionsConnectivityFieldBlock
        label="WireGuard public key"
        description="While sidecar public key for WireGuard peer configuration."
        help="Required so the clinic VPN appliance can authenticate the While sidecar. Copy it into your clinic's WireGuard peer list or send it to your clinic IT contact."
      >
        <div class="flex items-center gap-2">
          <code class="flex-1 break-all font-mono text-xs text-highlighted">{{ connection.wireguardPublicKey }}</code>
          <UButton
            icon="i-iconoir-copy"
            color="neutral"
            variant="ghost"
            size="xs"
            aria-label="Copy WireGuard public key"
            @click="copyToClipboard(connection.wireguardPublicKey, 'WireGuard public key')"
          />
        </div>
      </ConnectionsConnectivityFieldBlock>
    </ConnectionsConnectivityFieldGroup>

    <ConnectionsConnectivityFieldGroup
      title="Status & placement"
      description="Operational state and infrastructure region for this connection."
    >
      <ConnectionsConnectivityFieldBlock
        label="Region"
        description="Cloud region where the While sidecar runs."
        help="Choose a region close to the clinic when requesting a connection. While assigns this during provisioning — confirm latency expectations with your While contact if needed."
      >
        <p class="text-sm font-medium text-highlighted">
          {{ connection.region }}
        </p>
      </ConnectionsConnectivityFieldBlock>

      <ConnectionsConnectivityFieldBlock
        label="Tunnel status"
        description="Current health of the WireGuard handshake and tunnel."
        help="Active means recent handshake success. Pending or error usually means clinic firewall, key mismatch, or routing issues — check flight checks on Overview or open a support request."
      >
        <ConnectionsConnectionStatusBadge :status="connection.tunnelStatus" />
      </ConnectionsConnectivityFieldBlock>

      <ConnectionsConnectivityFieldBlock
        label="Environment"
        description="Whether this connection runs in Sandbox (testing) or Live (production)."
        help="Sandbox uses synthetic data and relaxed policies. Live requires activation and BAA before patient data flows. Switch environments from the top navigation."
      >
        <UBadge
          :color="connection.environment === 'sandbox' ? 'warning' : 'success'"
          variant="subtle"
          class="capitalize"
        >
          {{ connection.environment }}
        </UBadge>
      </ConnectionsConnectivityFieldBlock>
    </ConnectionsConnectivityFieldGroup>
  </div>
</template>
