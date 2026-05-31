<script setup lang="ts">
import type { Connection, EhrVendor } from '~/types/while'

const props = defineProps<{
  connection: Connection
}>()

const config = useRuntimeConfig()
const toast = useToast()
const saving = ref(false)

const ehrEndpoint = ref(props.connection.ehrEndpoint)
const ehrVendor = ref(props.connection.ehrVendor)
const markComplete = ref(false)

const vendorOptions: EhrVendor[] = ['Epic', 'Cerner', 'Meditech', 'Athena', 'Other']

async function loadRequiredData() {
  if (config.public.mockMode) return

  const data = await $fetch<{
    requiredData: { ehrEndpoint: string | null, ehrVendor: string | null, completedAt: string | null } | null
  }>(`/api/connections/${props.connection.id}/required-data`)

  if (data.requiredData) {
    ehrEndpoint.value = data.requiredData.ehrEndpoint ?? props.connection.ehrEndpoint
    ehrVendor.value = (data.requiredData.ehrVendor as EhrVendor) ?? props.connection.ehrVendor
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
    toast.add({ title: 'EHR configuration saved', color: 'success' })
  } catch {
    toast.add({ title: 'Failed to save EHR configuration', color: 'error' })
  } finally {
    saving.value = false
  }
}

onMounted(loadRequiredData)
</script>

<template>
  <div class="space-y-5">
    <ConnectionsConnectivitySectionIntro
      title="EHR integration"
      description="Clinic EHR vendor and FHIR endpoint details While uses to route and validate traffic through the sidecar."
      icon="i-iconoir-hospital"
    />

    <ConnectionsConnectivityFieldGroup
      title="Clinic configuration"
      description="Editable fields your team confirms with the clinic before go-live."
    >
      <ConnectionsConnectivityFieldBlock
        label="Partner name"
        description="Display name for this clinic or health system."
        help="Set when the connection is created. Used in logs, messages, and support tickets — it should match the name your team uses internally."
      >
        <p class="text-sm font-medium text-highlighted">
          {{ connection.partnerName }}
        </p>
      </ConnectionsConnectivityFieldBlock>

      <ConnectionsConnectivityFieldBlock
        label="EHR vendor"
        description="The electronic health record system at the clinic."
        help="Ask your clinic IT contact or check the EHR login screen / contract. While uses this to select the correct mapping templates and validation rules."
        required
      >
        <USelectMenu
          v-model="ehrVendor"
          :items="vendorOptions"
          class="w-full sm:max-w-xs"
        />
      </ConnectionsConnectivityFieldBlock>

      <ConnectionsConnectivityFieldBlock
        label="EHR FHIR endpoint"
        description="Base URL for the clinic FHIR R4 API behind the VPN."
        help="Request this from the clinic integration team or EHR vendor sandbox documentation. Example: https://fhir.clinic.example.org/R4 — must be reachable from the While sidecar over WireGuard."
        required
      >
        <UInput
          v-model="ehrEndpoint"
          class="w-full font-mono text-sm"
          placeholder="https://sandbox.example.test/fhir/R4"
        />
      </ConnectionsConnectivityFieldBlock>
    </ConnectionsConnectivityFieldGroup>

    <ConnectionsConnectivityFieldGroup
      title="Reference"
      description="Read-only identifiers for support and cross-environment comparison."
    >
      <ConnectionsConnectivityFieldBlock
        label="Connection ID"
        description="While identifier sent in HL7/FHIR context for this clinic."
        help="Include it when opening support tickets or correlating While webhook payloads with EHR traffic."
      >
        <code class="block break-all font-mono text-xs text-highlighted">{{ connection.id }}</code>
      </ConnectionsConnectivityFieldBlock>

      <ConnectionsConnectivityFieldBlock
        label="Region"
        description="Geographic region for this clinic connection."
        help="Should align with where patient data resides and where the clinic expects low-latency access. Confirm with While if you need a different region than assigned."
      >
        <p class="text-sm font-medium text-highlighted">
          {{ connection.region }}
        </p>
      </ConnectionsConnectivityFieldBlock>
    </ConnectionsConnectivityFieldGroup>

    <div class="while-card overflow-hidden">
      <div class="while-card-muted border-b border-default px-4 py-3">
        <h4 class="text-sm font-semibold text-highlighted">
          Save configuration
        </h4>
        <p class="mt-1 text-xs text-muted">
          Mark EHR details as verified once your clinic confirms vendor and endpoint values.
        </p>
        <div class="while-card-inset mt-3 px-3 py-3">
          <UCheckbox v-model="markComplete" label="EHR connectivity data is verified with the clinic" />
        </div>
      </div>
      <div class="flex items-center justify-between gap-3 bg-default px-4 py-3">
        <p class="text-xs text-dimmed">
          While uses this flag to schedule flight checks and go-live steps.
        </p>
        <UButton :loading="saving" size="sm" @click="saveRequiredData">
          Save EHR configuration
        </UButton>
      </div>
    </div>
  </div>
</template>
