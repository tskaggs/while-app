<script setup lang="ts">
import type { Connection } from '~/types/while'

const props = defineProps<{
  connection: Connection
}>()

const config = useRuntimeConfig()
const toast = useToast()
const saving = ref(false)

const ehrEndpoint = ref(props.connection.ehrEndpoint)
const ehrVendor = ref(props.connection.ehrVendor)
const markComplete = ref(false)

async function loadRequiredData() {
  if (config.public.mockMode) return

  const data = await $fetch<{
    requiredData: { ehrEndpoint: string | null, ehrVendor: string | null, completedAt: string | null } | null
  }>(`/api/connections/${props.connection.id}/required-data`)

  if (data.requiredData) {
    ehrEndpoint.value = data.requiredData.ehrEndpoint ?? props.connection.ehrEndpoint
    ehrVendor.value = (data.requiredData.ehrVendor as Connection['ehrVendor']) ?? props.connection.ehrVendor
    markComplete.value = Boolean(data.requiredData.completedAt)
  }
}

async function saveRequiredData() {
  saving.value = true
  try {
    await $fetch(`/api/connections/${props.connection.id}/required-data`, {
      method: 'PUT',
      body: {
        ehrEndpoint: ehrEndpoint.value,
        ehrVendor: ehrVendor.value,
        markComplete: markComplete.value
      }
    })
    toast.add({ title: 'Required data saved', color: 'success' })
  } catch {
    toast.add({ title: 'Failed to save required data', color: 'error' })
  } finally {
    saving.value = false
  }
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text)
  toast.add({ title: 'Copied to clipboard', description: label, icon: 'i-iconoir-copy' })
}

onMounted(loadRequiredData)
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-iconoir-key" class="size-5 text-primary" />
        <h3 class="font-semibold text-highlighted">
          Connectivity Configuration
        </h3>
      </div>
      <p class="text-sm text-muted mt-1">
        Provide EHR connection details for this integration. WireGuard keys are provisioned by While.
      </p>
    </template>

    <div class="space-y-4">
      <div>
        <label class="text-xs font-medium text-muted uppercase">WireGuard Public Key</label>
        <div class="mt-1 flex items-center gap-2">
          <code class="flex-1 rounded-lg bg-elevated px-3 py-2 text-xs break-all">{{ connection.wireguardPublicKey }}</code>
          <UButton
            icon="i-iconoir-copy"
            color="neutral"
            variant="ghost"
            size="xs"
            @click="copyToClipboard(connection.wireguardPublicKey, 'WireGuard public key')"
          />
        </div>
      </div>

      <UFormField label="EHR endpoint">
        <UInput v-model="ehrEndpoint" class="font-mono text-sm" placeholder="https://sandbox.example.test/fhir/R4" />
      </UFormField>

      <UFormField label="EHR vendor">
        <USelectMenu
          v-model="ehrVendor"
          :items="['Epic', 'Cerner', 'Meditech', 'Athena', 'Other']"
        />
      </UFormField>

      <UCheckbox v-model="markComplete" label="Required connectivity data is complete" />

      <UButton :loading="saving" @click="saveRequiredData">
        Save required data
      </UButton>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-xs font-medium text-muted uppercase">Sidecar ID</label>
          <p class="mt-1 text-sm font-mono text-highlighted">
            {{ connection.sidecarId }}
          </p>
        </div>
        <div>
          <label class="text-xs font-medium text-muted uppercase">Region</label>
          <p class="mt-1 text-sm text-highlighted">
            {{ connection.region }}
          </p>
        </div>
      </div>
    </div>
  </UCard>
</template>
