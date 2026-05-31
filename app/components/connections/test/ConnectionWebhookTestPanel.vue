<script setup lang="ts">
const props = defineProps<{
  connectionId: string
  webhookUrl: string | null
  orgDefaultWebhookUrl?: string | null
  connectionWebhookUrl?: string | null
  inheritsDefault?: boolean
  urlSource?: 'org' | 'connection' | null
  hasCustomSecret?: boolean
  webhookSecretConfigured?: boolean
  siteReceiverUrl: string
  dockerReceiverUrl: string
  webhookUrlNeedsDockerFix?: boolean
  webhookVerifySnippet: string
  webhookTriggerCurl: string
  webhookTriggerTypescript: string
  samplePatientId: string
  sandboxApiKey: string
  mockMode?: boolean
  enableTriggerTest?: boolean
}>()

const emit = defineEmits<{
  webhookSaved: [payload: { effectiveUrl: string | null, inheritsDefault: boolean }]
}>()

const toast = useToast()
const { refreshMessages } = useMessages()

interface TestWebhookMessage {
  id: string
  connectionId: string
  summary: string
  timestamp: string
}

interface TestWebhookDelivery {
  success: boolean
  statusCode: number | null
  errorMessage: string | null
  webhookUrl: string | null
  urlSource?: 'org' | 'connection' | null
}

interface TestWebhookResult {
  trigger: unknown
  delivery?: TestWebhookDelivery
  received: unknown[]
  message?: TestWebhookMessage | null
}

const inheritOrgDefault = ref(props.inheritsDefault !== false)
const overrideUrlInput = ref(props.connectionWebhookUrl ?? props.webhookUrl ?? '')
const overrideSecretInput = ref('')
const revealedSecret = ref<string | null>(null)
const webhookSaving = ref(false)
const secretRotating = ref(false)
const verifyTab = ref<'verify' | 'trigger'>('verify')

const eventType = ref('patient.admitted')
const patientId = ref(props.samplePatientId)
const webhookLoading = ref(false)
const webhookError = ref<string | null>(null)
const webhookStatus = ref<number | null>(null)
const webhookResult = ref<TestWebhookResult | null>(null)

const effectiveUrl = computed(() => {
  if (inheritOrgDefault.value) {
    return props.orgDefaultWebhookUrl ?? props.webhookUrl
  }
  return overrideUrlInput.value.trim() || null
})

const effectiveUrlSource = computed(() => {
  if (inheritOrgDefault.value) return 'org' as const
  if (overrideUrlInput.value.trim()) return 'connection' as const
  return props.urlSource ?? null
})

const urlSourceLabel = computed(() => {
  if (effectiveUrlSource.value === 'connection') return 'Connection override'
  if (effectiveUrlSource.value === 'org') return 'Org default'
  return 'Not configured'
})

const dockerLocalhostWarning = computed(() => {
  const url = effectiveUrl.value
  if (props.webhookUrlNeedsDockerFix || isLocalhostUrl(url)) {
    return {
      current: url,
      suggested: props.dockerReceiverUrl
    }
  }
  return null
})

function isLocalhostUrl(url: string | null | undefined) {
  if (!url) return false
  try {
    const hostname = new URL(url).hostname
    return hostname === 'localhost' || hostname === '127.0.0.1'
  } catch {
    return url.includes('localhost') || url.includes('127.0.0.1')
  }
}

function applyDockerWebhookUrl() {
  inheritOrgDefault.value = false
  overrideUrlInput.value = props.dockerReceiverUrl
}

watch(() => props.inheritsDefault, (value) => {
  inheritOrgDefault.value = value !== false
})

watch(() => props.connectionWebhookUrl, (url) => {
  if (url) overrideUrlInput.value = url
})

watch(() => props.webhookUrl, (url) => {
  if (props.inheritsDefault !== false && url) {
    overrideUrlInput.value = url
  }
})

watch(() => props.samplePatientId, (id) => {
  patientId.value = id
})

watch(inheritOrgDefault, (inherits) => {
  if (inherits) {
    overrideSecretInput.value = ''
    revealedSecret.value = null
  }
})

const eventOptions = [
  { label: 'patient.admitted', value: 'patient.admitted' },
  { label: 'patient.discharged', value: 'patient.discharged' },
  { label: 'observation.created', value: 'observation.created' }
]

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.add({ title: `${label} copied`, color: 'success' })
  } catch {
    toast.add({ title: 'Copy failed', color: 'error' })
  }
}

async function saveWebhookConfig() {
  webhookSaving.value = true
  try {
    if (props.mockMode) {
      toast.add({ title: 'Webhook settings saved (mock mode)', color: 'success' })
      emit('webhookSaved', {
        effectiveUrl: effectiveUrl.value,
        inheritsDefault: inheritOrgDefault.value
      })
      return
    }

    if (inheritOrgDefault.value) {
      await $fetch(`/api/connections/${props.connectionId}/webhook`, {
        method: 'POST',
        body: { inheritDefault: true }
      })
    } else {
      const body: { webhookUrl?: string, webhookSecret?: string } = {
        webhookUrl: overrideUrlInput.value.trim()
      }
      const secret = overrideSecretInput.value.trim()
      if (secret) {
        body.webhookSecret = secret
      }
      await $fetch(`/api/connections/${props.connectionId}/webhook`, {
        method: 'POST',
        body
      })
      overrideSecretInput.value = ''
    }

    toast.add({ title: 'Webhook settings saved', color: 'success' })
    emit('webhookSaved', {
      effectiveUrl: effectiveUrl.value,
      inheritsDefault: inheritOrgDefault.value
    })
  } catch {
    toast.add({ title: 'Failed to save webhook settings', color: 'error' })
  } finally {
    webhookSaving.value = false
  }
}

async function saveDockerWebhookUrl() {
  inheritOrgDefault.value = false
  overrideUrlInput.value = props.dockerReceiverUrl
  await saveWebhookConfig()
}

async function rotateConnectionSecret() {
  secretRotating.value = true
  try {
    if (props.mockMode) {
      revealedSecret.value = 'whsec_mock_rotated_secret'
      inheritOrgDefault.value = false
      toast.add({ title: 'Connection secret rotated (mock mode)', color: 'success' })
      return
    }

    const res = await $fetch<{ webhookSecret: string }>(
      `/api/connections/${props.connectionId}/webhook/rotate-secret`,
      { method: 'POST' }
    )
    inheritOrgDefault.value = false
    revealedSecret.value = res.webhookSecret
    toast.add({ title: 'Connection secret rotated — copy it now', color: 'success' })
    emit('webhookSaved', {
      effectiveUrl: effectiveUrl.value,
      inheritsDefault: false
    })
  } catch {
    toast.add({ title: 'Failed to rotate connection secret', color: 'error' })
  } finally {
    secretRotating.value = false
  }
}

async function sendTestWebhook() {
  webhookLoading.value = true
  webhookError.value = null
  webhookStatus.value = null
  webhookResult.value = null

  try {
    const key = props.sandboxApiKey.trim()
    const headers: Record<string, string> = {}
    if (key) {
      headers['X-Sandbox-Api-Key'] = key
      headers.Authorization = `Bearer ${key}`
    }

    const res = await $fetch<{ status: number, body: TestWebhookResult }>(
      `/api/connections/${props.connectionId}/test/webhook`,
      {
        method: 'POST',
        headers,
        query: key ? { sandboxApiKey: key } : undefined,
        body: {
          event: eventType.value,
          patient_id: patientId.value,
          apiKey: key || undefined
        }
      }
    )

    webhookStatus.value = res.status
    webhookResult.value = res.body

    if (res.body.delivery?.success && res.body.message) {
      await refreshMessages()
    }
  } catch (error) {
    const fetchError = error as { data?: { message?: string }, message?: string }
    webhookError.value = fetchError.data?.message ?? fetchError.message ?? 'Webhook test failed'
  } finally {
    webhookLoading.value = false
  }
}
</script>

<template>
  <UCard class="while-card overflow-hidden">
    <template #header>
      <h3 class="font-semibold text-highlighted">
        Webhooks
      </h3>
      <p class="text-sm text-muted mt-1">
        Set an org default in
        <NuxtLink to="/settings" class="text-primary hover:underline">
          Settings
        </NuxtLink>,
        or override URL and secret for this connection. Each delivery includes
        <code class="font-mono text-xs">connection_id: {{ connectionId }}</code>.
      </p>
    </template>

    <ol class="list-decimal list-inside space-y-2 text-sm text-muted mb-6">
      <li>
        Configure where events for this connection are delivered (inherit org default or override).
      </li>
      <li>
        Store the effective webhook secret (org default from onboarding, or a per-connection secret).
      </li>
      <li>
        Verify <code class="font-mono text-xs">X-While-Signature</code> on every inbound POST.
      </li>
      <li>
        Respond with <strong class="text-highlighted">2xx</strong> promptly so delivery succeeds.
      </li>
    </ol>

    <div class="space-y-4">
      <div class="while-card-inset space-y-3 p-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p class="text-sm font-medium text-highlighted">
              Effective destination
            </p>
            <p v-if="effectiveUrl" class="text-xs text-muted font-mono break-all mt-1">
              {{ effectiveUrl }}
            </p>
            <p v-else class="text-xs text-muted mt-1">
              No URL configured — set an org default in Settings or a connection override below.
            </p>
          </div>
          <UBadge variant="subtle" :color="effectiveUrl ? 'primary' : 'neutral'">
            {{ urlSourceLabel }}
          </UBadge>
        </div>
        <p v-if="!webhookSecretConfigured" class="text-xs text-warning">
          Webhook secret not configured for this connection.
        </p>
      </div>

      <UCheckbox
        v-model="inheritOrgDefault"
        label="Inherit org default webhook destination"
      />
      <p v-if="inheritOrgDefault && orgDefaultWebhookUrl" class="text-xs text-muted -mt-2">
        Org default:
        <code class="font-mono">{{ orgDefaultWebhookUrl }}</code>
      </p>
      <p v-else-if="inheritOrgDefault" class="text-xs text-muted -mt-2">
        No org default URL yet —
        <NuxtLink to="/settings" class="text-primary hover:underline">configure in Settings</NuxtLink>.
      </p>

      <template v-if="!inheritOrgDefault">
        <UFormField label="Connection webhook URL">
          <UInput
            v-model="overrideUrlInput"
            placeholder="https://your-app.com/webhooks/while"
            class="font-mono text-sm"
          />
        </UFormField>

        <UFormField label="Connection webhook secret (optional paste)">
          <UInput
            v-model="overrideSecretInput"
            type="password"
            placeholder="whsec_…"
            class="font-mono text-sm"
            autocomplete="off"
          />
          <p class="text-xs text-muted mt-1">
            Leave blank to keep the current secret. Org secret is not used when this connection has a custom secret.
          </p>
        </UFormField>

        <div class="flex flex-wrap gap-2">
          <UButton
            variant="outline"
            size="sm"
            :loading="secretRotating"
            @click="rotateConnectionSecret"
          >
            Rotate connection secret
          </UButton>
        </div>

        <UAlert
          v-if="revealedSecret"
          color="warning"
          variant="subtle"
          title="Copy your new connection secret now"
        >
          <template #description>
            <code class="font-mono text-xs break-all">{{ revealedSecret }}</code>
          </template>
        </UAlert>

        <p v-else-if="hasCustomSecret" class="text-xs text-muted">
          This connection uses a custom secret (not shown again after save).
        </p>
      </template>

      <UButton :loading="webhookSaving" @click="saveWebhookConfig">
        Save webhook settings
      </UButton>

      <UAlert
        v-if="dockerLocalhostWarning"
        color="warning"
        variant="subtle"
        title="Webhook URL unreachable from Docker ultra-a"
      >
        <template #description>
          <p class="mb-2">
            ultra-a in Docker cannot POST to
            <code class="font-mono text-xs">{{ dockerLocalhostWarning.current || 'localhost' }}</code>.
            Save a host-reachable URL so deliveries succeed and Messages populate.
          </p>
          <div class="flex flex-wrap gap-2">
            <UButton size="xs" variant="solid" :loading="webhookSaving" @click="saveDockerWebhookUrl">
              Save {{ dockerReceiverUrl }}
            </UButton>
            <UButton size="xs" variant="outline" @click="applyDockerWebhookUrl">
              Use in editor only
            </UButton>
          </div>
        </template>
      </UAlert>

      <UFormField label="While built-in receiver (copy for local testing)">
        <div class="flex items-center gap-2">
          <UInput
            :model-value="siteReceiverUrl"
            readonly
            class="flex-1 font-mono text-sm"
          />
          <UButton
            icon="i-iconoir-copy"
            color="neutral"
            variant="ghost"
            size="sm"
            aria-label="Copy receiver URL"
            @click="copy(siteReceiverUrl, 'Receiver URL')"
          />
        </div>
        <p class="text-xs text-muted mt-1">
          Events delivered here appear under
          <NuxtLink :to="`/connections/${connectionId}/messages`" class="text-primary hover:underline">
            Messages
          </NuxtLink>
          for this connection.
        </p>
      </UFormField>

      <UAlert color="info" variant="subtle" title="Local development">
        <template #description>
          When ultra-a runs in Docker, use
          <code class="font-mono text-xs">host.docker.internal</code>
          instead of <code class="font-mono text-xs">localhost</code>
          so the control plane can reach your app on the host.
          See
          <NuxtLink to="/docs/webhooks" class="text-primary hover:underline">
            Webhook docs
          </NuxtLink>.
        </template>
      </UAlert>

      <div>
        <div class="flex flex-wrap gap-2 mb-2">
          <UButton
            size="xs"
            :variant="verifyTab === 'verify' ? 'solid' : 'outline'"
            @click="verifyTab = 'verify'"
          >
            Verify signature
          </UButton>
          <UButton
            size="xs"
            :variant="verifyTab === 'trigger' ? 'solid' : 'outline'"
            @click="verifyTab = 'trigger'"
          >
            Trigger event
          </UButton>
        </div>
        <pre
          v-if="verifyTab === 'verify'"
          class="while-card-inset max-h-64 overflow-auto p-3 text-xs"
        >{{ webhookVerifySnippet }}</pre>
        <ConnectionsTestCodeSnippetTabs
          v-else
          :curl="webhookTriggerCurl"
          :typescript="webhookTriggerTypescript"
        />
      </div>

      <div v-if="enableTriggerTest !== false" class="while-card-inset space-y-3 p-4">
        <p class="text-sm font-medium text-highlighted">
          Send test webhook
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <UFormField label="Event type">
            <USelectMenu
              v-model="eventType"
              :items="eventOptions"
              value-key="value"
            />
          </UFormField>
          <UFormField label="Patient ID">
            <UInput v-model="patientId" class="font-mono text-sm" />
          </UFormField>
        </div>
        <UButton
          :loading="webhookLoading"
          variant="outline"
          icon="i-iconoir-send-diagonal"
          @click="sendTestWebhook"
        >
          Send test webhook
        </UButton>

        <UAlert v-if="webhookError" color="error" variant="subtle" :title="webhookError" />

        <div v-if="webhookStatus != null && webhookResult" class="space-y-3">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="text-sm font-medium text-highlighted">Trigger response</span>
              <UBadge color="success" variant="subtle" class="font-mono">
                {{ webhookStatus }}
              </UBadge>
            </div>
            <pre class="while-card-inset max-h-40 overflow-auto p-3 text-xs">{{ JSON.stringify(webhookResult.trigger, null, 2) }}</pre>
          </div>

          <div v-if="webhookResult.delivery" class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-highlighted">Control plane delivery</span>
              <UBadge
                :color="webhookResult.delivery.success ? 'success' : 'error'"
                variant="subtle"
              >
                {{ webhookResult.delivery.success ? 'Delivered' : 'Failed' }}
              </UBadge>
            </div>
            <UAlert
              v-if="!webhookResult.delivery.success"
              color="error"
              variant="subtle"
              title="Webhook delivery failed"
              :description="webhookResult.delivery.errorMessage
                ?? 'ultra-a could not reach your webhook URL. If ultra-a runs in Docker, save host.docker.internal instead of localhost, then retry.'"
            />
            <p v-if="webhookResult.delivery.webhookUrl" class="text-xs text-muted font-mono break-all">
              Effective URL ({{ webhookResult.delivery.urlSource === 'connection' ? 'connection override' : 'org default' }}):
              {{ webhookResult.delivery.webhookUrl }}
            </p>
          </div>

          <div v-if="webhookResult.delivery?.success && webhookResult.received.length">
            <p class="text-sm font-medium text-highlighted mb-2">
              Recent delivery (while-app ingest)
            </p>
            <pre class="while-card-inset max-h-40 overflow-auto p-3 text-xs">{{ JSON.stringify(webhookResult.received[0], null, 2) }}</pre>
          </div>
          <UAlert
            v-if="webhookResult.delivery?.success && webhookResult.received.length && !webhookResult.message"
            color="warning"
            variant="subtle"
            title="Ingest OK but no Messages row"
            description="Webhook delivery reached while-app, but no clinical processed message was created. Use a clinical event such as patient.admitted — tunnel-only events appear under Logs, not Messages."
          />
          <div v-if="webhookResult.message" class="while-card-inset space-y-1 p-3">
            <p class="text-sm font-medium text-highlighted">
              Latest processed message
            </p>
            <p class="text-sm text-muted">
              {{ webhookResult.message.summary }}
            </p>
            <NuxtLink
              :to="`/connections/${webhookResult.message.connectionId}/messages`"
              class="text-xs text-primary hover:underline"
            >
              View in Messages
            </NuxtLink>
          </div>
          <p
            v-else-if="webhookResult.delivery?.success && !webhookResult.received.length"
            class="text-sm text-muted"
          >
            Delivery succeeded but no ingest log yet. Retry or check while-app logs.
          </p>
          <p
            v-else-if="!webhookResult.delivery?.success"
            class="text-sm text-muted"
          >
            Fix the effective webhook URL (use
            <code class="font-mono text-xs">{{ dockerReceiverUrl }}</code>
            when ultra-a runs in Docker), save settings, then send the test again.
          </p>
        </div>
      </div>
    </div>
  </UCard>
</template>
