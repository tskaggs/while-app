<script setup lang="ts">
import type { Connection } from '~/types/while'

defineProps<{
  connection: Connection
}>()

const toast = useToast()

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text)
  toast.add({
    title: 'Copied to clipboard',
    description: label,
    icon: 'i-lucide-copy'
  })
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-key" class="size-5 text-primary" />
        <h3 class="font-semibold text-highlighted">Connectivity Configuration</h3>
      </div>
      <p class="text-sm text-muted mt-1">
        Share these details with the clinic IT team to complete the WireGuard handshake.
      </p>
    </template>

    <div class="space-y-4">
      <div>
        <label class="text-xs font-medium text-muted uppercase">WireGuard Public Key</label>
        <div class="mt-1 flex items-center gap-2">
          <code class="flex-1 rounded-lg bg-elevated px-3 py-2 text-xs break-all">{{ connection.wireguardPublicKey }}</code>
          <UButton
            icon="i-lucide-copy"
            color="neutral"
            variant="ghost"
            size="xs"
            @click="copyToClipboard(connection.wireguardPublicKey, 'WireGuard public key')"
          />
        </div>
      </div>

      <div>
        <label class="text-xs font-medium text-muted uppercase">EHR Endpoint</label>
        <div class="mt-1 flex items-center gap-2">
          <code class="flex-1 rounded-lg bg-elevated px-3 py-2 text-xs break-all">{{ connection.ehrEndpoint }}</code>
          <UButton
            icon="i-lucide-copy"
            color="neutral"
            variant="ghost"
            size="xs"
            @click="copyToClipboard(connection.ehrEndpoint, 'EHR endpoint')"
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-xs font-medium text-muted uppercase">Sidecar ID</label>
          <p class="mt-1 text-sm font-mono text-highlighted">{{ connection.sidecarId }}</p>
        </div>
        <div>
          <label class="text-xs font-medium text-muted uppercase">Region</label>
          <p class="mt-1 text-sm text-highlighted">{{ connection.region }}</p>
        </div>
      </div>
    </div>
  </UCard>
</template>
