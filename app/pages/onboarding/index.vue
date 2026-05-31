<script setup lang="ts">
import { authClient } from '~/lib/auth-client'
import type { Connection, FlightCheck } from '~/types/while'

definePageMeta({ layout: 'auth' })

const config = useRuntimeConfig()
const route = useRoute()
const requestFetch = useRequestFetch()
const step = ref(1)
const loading = ref(false)
const error = ref('')
const statusReady = ref(false)

const ehrVendor = ref<'Epic' | 'Cerner' | 'Meditech' | 'Athena' | 'Other'>('Epic')
const dataFormat = ref<'fhir' | 'hl7' | 'both'>('fhir')
const resourceTypes = ref<string[]>(['Patient', 'Encounter', 'Observation'])

const provision = ref<{
  orgId: string
  orgName: string
  sandboxApiKey: string
  webhookSecret: string
  connectionId: string
  samplePatientId: string
  alreadyProvisioned: boolean
  keyRegenerated?: boolean
} | null>(null)

const keySaved = ref(false)
const keyRegenerated = ref(false)
const loadingKey = ref(false)
const resumeSetup = ref(false)
const patientResult = ref<{ patient: unknown; patientId: string; catalog: unknown } | null>(null)
const webhookResult = ref<{
  trigger: unknown
  received: unknown[]
  message?: { id: string, connectionId: string, summary: string, timestamp: string } | null
} | null>(null)
const snippetTab = ref('curl')

const provisioningActive = ref(false)
const provisionStage = ref('queued')
const provisionProgress = ref(0)
const provisionFlightCheck = ref<FlightCheck>({ mtu: false, handshake: false, hl7Ack: false })
const provisioningStatus = ref<'provisioning' | 'active' | 'pending_customer' | 'error'>('provisioning')

let provisioningPoll: ReturnType<typeof setInterval> | null = null
let provisioningStream: EventSource | null = null

const { refreshMessages } = useMessages()

const inviteEmail = ref('')
const inviteRole = ref<'owner' | 'admin' | 'member'>('member')
const inviteLinks = ref<Array<{ id: string; email: string; role: string; url: string }>>([])

const toast = useToast()

const apiBaseUrl = computed(() => config.public.whileApiUrl as string)

const sandboxApiKeyValue = computed(() => provision.value?.sandboxApiKey ?? '')

const sandboxApiKeyDisplay = computed(() => {
  if (sandboxApiKeyValue.value) return sandboxApiKeyValue.value
  if (loadingKey.value) return 'Loading sandbox API key…'
  return 'Sandbox API key unavailable — generate a new key below'
})

const provisionConnection = computed((): Connection | null => {
  if (!provision.value) return null
  return {
    id: provision.value.connectionId,
    partnerName: provision.value.orgName,
    ehrVendor: ehrVendor.value,
    environment: 'sandbox',
    pairedConnectionId: '',
    sidecarId: `fc-sa-${provision.value.connectionId.replace(/^conn-sa-/, '')}`,
    tunnelStatus: provisioningStatus.value === 'active' ? 'active' : 'pending',
    wireguardPublicKey: '—',
    ehrEndpoint: 'While Synthetic Hospital (FHIR R4)',
    lastSyncAt: new Date().toISOString(),
    flightCheck: provisionFlightCheck.value,
    region: 'control-plane',
    messagesProcessed24h: 0,
    provisioningStatus: provisioningStatus.value
  }
})

const provisioningBuildComplete = computed(() =>
  ['active', 'pending_customer'].includes(provisioningStatus.value)
  && provisionStage.value === 'completed'
)

function stopProvisioningMonitor() {
  if (provisioningPoll) {
    clearInterval(provisioningPoll)
    provisioningPoll = null
  }
  provisioningStream?.close()
  provisioningStream = null
}

async function loadProvisioningState(connectionId: string) {
  try {
    const data = await $fetch<{
      connection: { provisioningStatus: string }
      jobs: Array<{ stage: string, progressPercent: number, status: string }>
      flightCheck: FlightCheck
    }>(`/api/connections/${connectionId}/provisioning`)

    provisioningStatus.value = data.connection.provisioningStatus as typeof provisioningStatus.value
    provisionFlightCheck.value = data.flightCheck
    const activeJob = data.jobs.find(j => j.status === 'running' || j.status === 'queued')
      ?? data.jobs[data.jobs.length - 1]
    if (activeJob) {
      provisionStage.value = activeJob.stage
      provisionProgress.value = activeJob.progressPercent
    }
    if (['active', 'pending_customer'].includes(data.connection.provisioningStatus)) {
      provisionStage.value = 'completed'
      provisionProgress.value = 100
    }
  } catch {
    // polling will retry
  }
}

function startProvisioningMonitor(connectionId: string) {
  stopProvisioningMonitor()
  provisioningActive.value = true
  void loadProvisioningState(connectionId)

  if (import.meta.client) {
    provisioningStream = new EventSource(
      `/api/provisioning/stream?connectionId=${encodeURIComponent(connectionId)}`
    )
    provisioningStream.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.type === 'provisioning') {
          if (payload.stage) provisionStage.value = payload.stage
          if (payload.progressPercent !== undefined) {
            provisionProgress.value = payload.progressPercent
          }
          if (payload.provisioningStatus) {
            provisioningStatus.value = payload.provisioningStatus
          }
          if (payload.stage === 'completed') {
            provisionProgress.value = 100
            void loadProvisioningState(connectionId)
          }
        }
      } catch {
        // ignore malformed events
      }
    }
    provisioningPoll = setInterval(() => loadProvisioningState(connectionId), 4000)
  }
}

function continueFromProvisioning() {
  if (!provisioningBuildComplete.value) return
  stopProvisioningMonitor()
  provisioningActive.value = false
  step.value = 2
}

watch(provisioningBuildComplete, (done) => {
  if (done) stopProvisioningMonitor()
})

type ProvisionPayload = {
  orgId: string
  orgName: string
  sandboxApiKey: string
  webhookSecret: string
  connectionId: string
  samplePatientId: string
  alreadyProvisioned: boolean
  keyRegenerated?: boolean
}

function redirectDestination() {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/'
}

async function redirectAfterOnboarding() {
  await navigateTo(redirectDestination())
}

function applyProvisionResult(creds: ProvisionPayload) {
  provision.value = creds
  keySaved.value = false
  keyRegenerated.value = Boolean(creds.keyRegenerated)
}

function escapeCsvValue(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function copyToClipboard(text: string, label: string) {
  if (!text) {
    toast.add({
      title: 'Nothing to copy',
      description: `${label} is not available`,
      color: 'warning'
    })
    return
  }

  navigator.clipboard.writeText(text)
  toast.add({
    title: 'Copied to clipboard',
    description: label,
    icon: 'i-iconoir-copy'
  })
}

function downloadCredentialsCsv() {
  if (!provision.value) return

  const rows = [
    ['Field', 'Value'],
    ['Organization', provision.value.orgName],
    [
      'Sandbox API key',
      provision.value.sandboxApiKey || '(not available in this session)'
    ],
    ['Webhook secret', provision.value.webhookSecret],
    ['Connection ID', provision.value.connectionId]
  ]

  const csv = rows
    .map(row => row.map(escapeCsvValue).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const slug = provision.value.orgName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'while'

  link.href = url
  link.download = `${slug}-sandbox-credentials.csv`
  link.click()
  URL.revokeObjectURL(url)

  toast.add({
    title: 'Downloaded credentials',
    description: `${slug}-sandbox-credentials.csv`,
    icon: 'i-iconoir-download'
  })
}

async function refreshCredentials() {
  loadingKey.value = true
  error.value = ''
  try {
    const creds = await requestFetch<{
      provisioned: boolean
      onboardingComplete?: boolean
      orgId?: string
      orgName?: string
      sandboxApiKey?: string
      webhookSecret?: string
      connectionId?: string
      samplePatientId?: string
      alreadyProvisioned?: boolean
      keyRegenerated?: boolean
    }>('/api/onboarding/credentials')

    if (creds.onboardingComplete) {
      await redirectAfterOnboarding()
      return false
    }

    if (!creds.provisioned) return false

    applyProvisionResult({
      orgId: creds.orgId!,
      orgName: creds.orgName!,
      sandboxApiKey: creds.sandboxApiKey ?? '',
      webhookSecret: creds.webhookSecret ?? '',
      connectionId: creds.connectionId!,
      samplePatientId: creds.samplePatientId!,
      alreadyProvisioned: true,
      keyRegenerated: creds.keyRegenerated
    })
    resumeSetup.value = true
    return true
  } catch (e: unknown) {
    const fetchError = e as { data?: { message?: string }, message?: string }
    error.value = fetchError.data?.message ?? fetchError.message ?? 'Could not load sandbox credentials'
    return false
  } finally {
    loadingKey.value = false
  }
}

async function ensureSandboxKey() {
  if (step.value !== 2 || sandboxApiKeyValue.value) return
  await refreshCredentials()
}

async function runProvision() {
  loading.value = true
  error.value = ''
  try {
    const result = await $fetch<ProvisionPayload & { onboardingComplete?: boolean }>(
      '/api/onboarding/provision',
      {
        method: 'POST',
        body: {
          ehrVendor: ehrVendor.value,
          dataFormat: dataFormat.value,
          resourceTypes: resourceTypes.value
        }
      }
    )

    if (result.onboardingComplete) {
      await redirectAfterOnboarding()
      return
    }

    if (!result.sandboxApiKey) {
      error.value = 'Unable to issue a sandbox API key. Try again.'
      return
    }

    applyProvisionResult(result)
    resumeSetup.value = result.alreadyProvisioned
    if (import.meta.client) {
      sessionStorage.setItem('while-onboarding-provision', JSON.stringify(result))
    }

    if (result.alreadyProvisioned) {
      try {
        const state = await $fetch<{ connection: { provisioningStatus: string } }>(
          `/api/connections/${result.connectionId}/provisioning`
        )
        if (state.connection.provisioningStatus === 'provisioning') {
          startProvisioningMonitor(result.connectionId)
        } else {
          step.value = 2
        }
      } catch {
        step.value = 2
      }
      return
    }

    startProvisioningMonitor(result.connectionId)
  } catch (e: unknown) {
    const fetchError = e as { data?: { message?: string }, message?: string }
    error.value = fetchError.data?.message ?? fetchError.message ?? 'Provisioning failed'
  } finally {
    loading.value = false
  }
}

async function testPatient() {
  const apiKey = provision.value?.sandboxApiKey
  if (!apiKey) {
    error.value = 'Sandbox API key missing. Go back to step 2 to copy your key.'
    return
  }

  loading.value = true
  error.value = ''
  try {
    patientResult.value = await $fetch('/api/onboarding/test-patient', {
      headers: { 'X-Sandbox-Api-Key': apiKey }
    })
    step.value = 4
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'API test failed'
  } finally {
    loading.value = false
  }
}

async function testWebhook() {
  const apiKey = provision.value?.sandboxApiKey
  if (!apiKey) {
    error.value = 'Sandbox API key missing. Go back to step 2 to copy your key.'
    return
  }

  loading.value = true
  error.value = ''
  try {
    const result = await $fetch<{
      trigger: unknown
      received: unknown[]
      delivery?: { success: boolean }
      message?: { id: string, connectionId: string, summary: string, timestamp: string } | null
    }>('/api/onboarding/test-webhook', {
      method: 'POST',
      body: {
        event: 'patient.admitted',
        patient_id: provision.value?.samplePatientId,
        apiKey
      }
    })
    webhookResult.value = result
    if (result.delivery?.success && result.message) {
      await refreshMessages()
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Webhook test failed'
  } finally {
    loading.value = false
  }
}

async function sendInvite() {
  if (!inviteEmail.value) return
  loading.value = true
  error.value = ''
  try {
    const { error: inviteError } = await authClient.organization.inviteMember({
      email: inviteEmail.value,
      role: inviteRole.value
    })
    if (inviteError) {
      error.value = inviteError.message ?? 'Invite failed'
      return
    }
    const res = await $fetch<{ invites: typeof inviteLinks.value }>('/api/team/invites')
    inviteLinks.value = res.invites
    inviteEmail.value = ''
  } finally {
    loading.value = false
  }
}

async function finishOnboarding() {
  loading.value = true
  try {
    await requestFetch('/api/onboarding/complete', {
      method: 'POST',
      body: { apiKeyAcknowledged: keySaved.value }
    })
    await redirectAfterOnboarding()
  } finally {
    loading.value = false
  }
}

const curlSnippet = computed(() => {
  const key = provision.value?.sandboxApiKey || 'wh_test_your_key'
  const pid = provision.value?.samplePatientId || 'pat_00000000_01'
  return `curl -s -H "Authorization: Bearer ${key}" \\
  ${apiBaseUrl.value}/v1/patients/${pid} | jq .`
})

const tsSnippet = computed(() => {
  const key = provision.value?.sandboxApiKey || 'wh_test_your_key'
  const pid = provision.value?.samplePatientId || 'pat_00000000_01'
  return `const res = await fetch("${apiBaseUrl.value}/v1/patients/${pid}", {
  headers: { Authorization: "Bearer ${key}" },
});
const patient = await res.json();`
})

const webhookSnippet = computed(() => {
  const key = provision.value?.sandboxApiKey || 'wh_test_your_key'
  const pid = provision.value?.samplePatientId || 'pat_00000000_01'
  return `await fetch("${apiBaseUrl.value}/v1/webhooks/trigger-mock-event", {
  method: "POST",
  headers: {
    Authorization: "Bearer ${key}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ event: "patient.admitted", patient_id: "${pid}" }),
});`
})

onMounted(async () => {
  const { data: session } = await authClient.useSession(useFetch)
  if (!session.value) {
    await navigateTo('/login')
    return
  }

  const routeStep = Number(route.query.step)
  if (routeStep >= 2 && routeStep <= 5) {
    step.value = routeStep
  }

  if (import.meta.client) {
    const stored = sessionStorage.getItem('while-onboarding-provision')
    if (stored) {
      try {
        applyProvisionResult(JSON.parse(stored) as ProvisionPayload)
      } catch {
        // ignore invalid stored payload
      }
    }
  }

  try {
    const restored = await refreshCredentials()
    if (restored && provision.value && step.value === 1) {
      try {
        const state = await $fetch<{ connection: { provisioningStatus: string } }>(
          `/api/connections/${provision.value.connectionId}/provisioning`
        )
        if (state.connection.provisioningStatus === 'provisioning') {
          startProvisioningMonitor(provision.value.connectionId)
        } else {
          step.value = 2
        }
      } catch {
        step.value = 2
      }
    }
  } finally {
    statusReady.value = true
  }
})

onUnmounted(() => {
  stopProvisioningMonitor()
})

watch(step, (nextStep) => {
  if (nextStep === 2) {
    void ensureSandboxKey()
  }
}, { immediate: true })

useSeoMeta({ title: 'Onboarding' })
</script>

<template>
  <div class="min-h-screen bg-default p-6">
    <div v-if="!statusReady" class="mx-auto flex max-w-3xl items-center justify-center py-24">
      <UIcon name="i-iconoir-refresh-double" class="size-6 animate-spin text-muted" />
    </div>

    <div v-else class="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">
          Welcome to While
        </h1>
        <p class="text-muted mt-1">
          Set up your sandbox and make your first API call in minutes.
        </p>
      </div>

      <UAlert v-if="error" color="error" variant="subtle" :title="error" />

      <!-- Step 1 -->
      <UCard v-if="step === 1 && !provisioningActive" class="rounded-xl border border-default bg-elevated">
        <template #header>
          <h2 class="font-semibold text-highlighted">
            Step 1 — Organization
          </h2>
        </template>
        <p class="text-sm text-muted mb-4">
          <template v-if="resumeSetup">
            Your sandbox is already set up. Continue to retrieve your credentials and finish onboarding.
          </template>
          <template v-else>
            We'll create your machine-plane organization, a 1:1 account sandbox, API key, and default field mappings for your EHR.
          </template>
        </p>

        <div v-if="!resumeSetup" class="space-y-4 mb-4">
          <UFormField label="Origin EHR vendor">
            <USelectMenu
              v-model="ehrVendor"
              :items="['Epic', 'Cerner', 'Meditech', 'Athena', 'Other']"
            />
          </UFormField>
          <UFormField label="Source data format">
            <USelectMenu
              v-model="dataFormat"
              :items="[
                { label: 'FHIR R4', value: 'fhir' },
                { label: 'HL7 v2', value: 'hl7' },
                { label: 'Both', value: 'both' }
              ]"
              value-key="value"
            />
          </UFormField>
          <UFormField label="Resource scope">
            <div class="flex flex-wrap gap-2">
              <UCheckbox
                v-for="type in ['Patient', 'Encounter', 'Observation', 'DiagnosticReport']"
                :key="type"
                :model-value="resourceTypes.includes(type)"
                :label="type"
                @update:model-value="(value: boolean | 'indeterminate') => {
                  const checked = value === true
                  if (checked && !resourceTypes.includes(type)) resourceTypes.push(type)
                  if (!checked) resourceTypes = resourceTypes.filter(t => t !== type)
                }"
              />
            </div>
          </UFormField>
        </div>

        <UButton :loading="loading" @click="runProvision">
          {{ resumeSetup ? 'Continue setup' : 'Set up sandbox' }}
        </UButton>
      </UCard>

      <!-- Provisioning build -->
      <UCard
        v-if="provisioningActive && provisionConnection"
        class="rounded-xl border border-default bg-elevated"
      >
        <template #header>
          <h2 class="font-semibold text-highlighted">
            Building your sandbox
          </h2>
        </template>
        <ConnectionsProvisioningCanvas
          :connection="provisionConnection"
          :stage="provisionStage"
          :progress-percent="provisionProgress"
        />
        <div class="flex justify-end pt-2">
          <UButton
            :disabled="!provisioningBuildComplete"
            @click="continueFromProvisioning"
          >
            Continue
          </UButton>
        </div>
      </UCard>

      <!-- Step 2 -->
      <UCard v-if="step === 2 && provision" class="rounded-xl border border-default bg-elevated">
        <template #header>
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 class="font-semibold text-highlighted">
                Step 2 — Sandbox credentials
              </h2>
              <p class="text-sm text-muted mt-1">
                Save these now. The API key is shown once.
              </p>
            </div>
            <UButton
              icon="i-iconoir-download"
              variant="outline"
              size="sm"
              class="shrink-0"
              @click="downloadCredentialsCsv"
            >
              Download as CSV
            </UButton>
          </div>
        </template>
        <div class="space-y-4">
          <UAlert
            v-if="keyRegenerated"
            color="warning"
            variant="subtle"
            title="New sandbox API key generated"
            description="Your previous key is no longer available. Save this new key before continuing."
          />
          <UFormField label="Organization">
            <div class="flex items-center gap-2">
              <UInput :model-value="provision.orgName" disabled class="flex-1" />
              <UButton
                icon="i-iconoir-copy"
                color="neutral"
                variant="ghost"
                size="sm"
                aria-label="Copy organization"
                @click="copyToClipboard(provision.orgName, 'Organization')"
              />
            </div>
          </UFormField>
          <UFormField label="Sandbox API key">
            <div class="flex items-center gap-2">
              <UInput
                :model-value="sandboxApiKeyDisplay"
                readonly
                class="flex-1 font-mono text-sm"
              />
              <UButton
                icon="i-iconoir-copy"
                color="neutral"
                variant="ghost"
                size="sm"
                aria-label="Copy sandbox API key"
                :disabled="!sandboxApiKeyValue"
                @click="copyToClipboard(sandboxApiKeyValue, 'Sandbox API key')"
              />
            </div>
          </UFormField>
          <UFormField label="Webhook secret">
            <div class="flex items-center gap-2">
              <UInput
                :model-value="provision.webhookSecret"
                readonly
                class="flex-1 font-mono text-sm"
              />
              <UButton
                icon="i-iconoir-copy"
                color="neutral"
                variant="ghost"
                size="sm"
                aria-label="Copy webhook secret"
                @click="copyToClipboard(provision.webhookSecret, 'Webhook secret')"
              />
            </div>
          </UFormField>
          <UFormField label="Connection ID">
            <div class="flex items-center gap-2">
              <UInput
                :model-value="provision.connectionId"
                readonly
                class="flex-1 font-mono text-sm"
              />
              <UButton
                icon="i-iconoir-copy"
                color="neutral"
                variant="ghost"
                size="sm"
                aria-label="Copy connection ID"
                @click="copyToClipboard(provision.connectionId, 'Connection ID')"
              />
            </div>
          </UFormField>
          <UCheckbox v-model="keySaved" label="I've saved my API key" />
          <div class="flex flex-wrap gap-2">
            <UButton
              v-if="!sandboxApiKeyValue"
              variant="outline"
              :loading="loadingKey"
              @click="ensureSandboxKey"
            >
              Generate sandbox API key
            </UButton>
            <UButton :disabled="!keySaved || !sandboxApiKeyValue" @click="step = 3">
              Continue
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Step 3 -->
      <UCard v-if="step === 3" class="rounded-xl border border-default bg-elevated">
        <template #header>
          <h2 class="font-semibold text-highlighted">
            Step 3 — Try the API
          </h2>
        </template>
        <p class="text-sm text-muted mb-4">
          Fetch synthetic clinic data from the control plane sandbox.
        </p>
        <UButton :loading="loading" @click="testPatient">
          Test GET /v1/patients/{id}
        </UButton>
      </UCard>

      <!-- Step 4 -->
      <UCard v-if="step === 4 && provision" class="rounded-xl border border-default bg-elevated">
        <template #header>
          <h2 class="font-semibold text-highlighted">
            Step 4 — Code snippets &amp; webhook test
          </h2>
        </template>
        <div class="space-y-4">
          <div v-if="patientResult">
            <p class="text-sm font-medium text-highlighted mb-2">
              API response
            </p>
            <pre class="text-xs overflow-auto rounded-lg border border-default p-3 bg-muted/30 max-h-48">{{ JSON.stringify(patientResult.patient, null, 2) }}</pre>
          </div>

          <div class="flex gap-2">
            <UButton
              v-for="tab in ['curl', 'ts', 'webhook']"
              :key="tab"
              size="xs"
              :variant="snippetTab === tab ? 'solid' : 'outline'"
              @click="snippetTab = tab"
            >
              {{ tab === 'ts' ? 'TypeScript' : tab }}
            </UButton>
          </div>
          <pre class="text-xs overflow-auto rounded-lg border border-default p-3 bg-muted/30">{{ snippetTab === 'curl' ? curlSnippet : snippetTab === 'ts' ? tsSnippet : webhookSnippet }}</pre>

          <div class="flex flex-wrap gap-2">
            <UButton :loading="loading" variant="outline" @click="testWebhook">
              Send test webhook
            </UButton>

            <UButton @click="step = 5">
              Continue
            </UButton>
          </div>

          <div v-if="webhookResult">
            <p class="text-sm font-medium text-highlighted mb-2">
              Trigger response (202)
            </p>
            <pre class="text-xs overflow-auto rounded-lg border border-default p-3 bg-muted/30 max-h-32">{{ JSON.stringify(webhookResult.trigger, null, 2) }}</pre>
            <p v-if="webhookResult.received.length" class="text-sm font-medium text-highlighted mt-3 mb-2">
              Received at your webhook URL
            </p>
            <pre v-if="webhookResult.received.length" class="text-xs overflow-auto rounded-lg border border-default p-3 bg-muted/30 max-h-32">{{ JSON.stringify(webhookResult.received[0], null, 2) }}</pre>
            <UAlert
              v-if="webhookResult.received.length && !webhookResult.message"
              class="mt-3"
              color="warning"
              variant="subtle"
              title="Ingest OK but no Messages row"
              description="Use a clinical event such as patient.admitted. Tunnel-only events appear under Logs, not Messages."
            />
            <p v-if="webhookResult.message" class="text-sm text-muted mt-3">
              Processed message: {{ webhookResult.message.summary }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- Step 5 -->
      <UCard v-if="step === 5" class="rounded-xl border border-default bg-elevated">
        <template #header>
          <h2 class="font-semibold text-highlighted">
            Step 5 — Invite your team (optional)
          </h2>
        </template>
        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <UFormField label="Email" class="sm:col-span-2">
              <UInput v-model="inviteEmail" type="email" placeholder="colleague@company.com" />
            </UFormField>
            <UFormField label="Role">
              <USelect v-model="inviteRole"               :items="[
                { label: 'Owner', value: 'owner' },
                { label: 'Developer', value: 'member' },
                { label: 'Manager', value: 'admin' }
              ]" />
            </UFormField>
          </div>
          <div v-if="inviteLinks.length" class="space-y-2">
            <p class="text-sm text-muted">
              Dev-mode invite links (also logged to server console):
            </p>
            <div v-for="link in inviteLinks" :key="link.id" class="rounded-lg border border-default p-3 text-xs font-mono break-all">
              {{ link.email }} ({{ link.role }}): {{ link.url }}
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <UButton variant="outline" :loading="loading" @click="sendInvite">
              Send invite
            </UButton>
            <UButton :loading="loading" @click="finishOnboarding">
              Finish onboarding
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
