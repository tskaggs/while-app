<script setup lang="ts">
const props = defineProps<{
  connectionId: string
  webhookUrl: string | null
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
  webhookSaved: [url: string]
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
}

interface TestWebhookResult {
  trigger: unknown
  delivery?: TestWebhookDelivery
  received: unknown[]
  message?: TestWebhookMessage | null
}

const webhookUrlInput = ref(props.webhookUrl ?? '')
const webhookSaving = ref(false)
const verifyTab = ref<'verify' | 'trigger'>('verify')

const eventType = ref('patient.admitted')
const patientId = ref(props.samplePatientId)
const webhookLoading = ref(false)
const webhookError = ref<string | null>(null)
const webhookStatus = ref<number | null>(null)
const webhookResult = ref<TestWebhookResult | null>(null)

const dockerLocalhostWarning = computed(() => {
  if (props.webhookUrlNeedsDockerFix || isLocalhostUrl(webhookUrlInput.value)) {
    return {
      current: webhookUrlInput.value.trim() || props.webhookUrl,
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
  webhookUrlInput.value = props.dockerReceiverUrl
}

async function saveDockerWebhookUrl() {
  webhookUrlInput.value = props.dockerReceiverUrl
  await saveWebhookUrl()
}

watch(() => props.webhookUrl, (url) => {
  webhookUrlInput.value = url ?? ''
})

watch(() => props.samplePatientId, (id) => {
  patientId.value = id
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

async function saveWebhookUrl() {
  webhookSaving.value = true
  try {
    if (props.mockMode) {
      toast.add({ title: 'Webhook URL saved (mock mode)', color: 'success' })
      emit('webhookSaved', webhookUrlInput.value)
      return
    }

    await $fetch('/api/settings/webhook', {
      method: 'POST',
      body: { webhookUrl: webhookUrlInput.value }
    })
    toast.add({ title: 'Webhook URL saved', color: 'success' })
    emit('webhookSaved', webhookUrlInput.value)
  } catch {
    toast.add({ title: 'Failed to save webhook URL', color: 'error' })
  } finally {
    webhookSaving.value = false
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
  <UCard class="rounded-xl border border-default bg-elevated">
    <template #header>
      <h3 class="font-semibold text-highlighted">
        Webhooks
      </h3>
      <p class="text-sm text-muted mt-1">
        Webhook URL is organization-scoped. Each delivery includes
        <code class="font-mono text-xs">connection_id: {{ connectionId }}</code>
        so your receiver can route events to the right integration.
      </p>
    </template>

    <ol class="list-decimal list-inside space-y-2 text-sm text-muted mb-6">
      <li>
        Set your webhook URL below (or use While's built-in receiver for dashboard Messages).
      </li>
      <li>
        Store your webhook secret from onboarding (<code class="font-mono text-xs">whsec_*</code>).
      </li>
      <li>
        Verify <code class="font-mono text-xs">X-While-Signature</code> on every inbound POST.
      </li>
      <li>
        Respond with <strong class="text-highlighted">2xx</strong> promptly so delivery succeeds.
      </li>
    </ol>

    <div class="space-y-4">
      <UFormField label="Current webhook URL">
        <div class="flex flex-col gap-2 sm:flex-row">
          <UInput
            v-model="webhookUrlInput"
            placeholder="https://your-app.com/webhooks/while"
            class="flex-1 font-mono text-sm"
          />
          <UButton :loading="webhookSaving" @click="saveWebhookUrl">
            Save
          </UButton>
        </div>
      </UFormField>

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
          class="text-xs overflow-auto rounded-lg border border-default p-3 bg-muted/30 max-h-64"
        >{{ webhookVerifySnippet }}</pre>
        <ConnectionsTestCodeSnippetTabs
          v-else
          :curl="webhookTriggerCurl"
          :typescript="webhookTriggerTypescript"
        />
      </div>

      <div v-if="enableTriggerTest !== false" class="rounded-lg border border-default p-4 space-y-3">
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
            <pre class="text-xs overflow-auto rounded-lg border border-default p-3 bg-muted/30 max-h-40">{{ JSON.stringify(webhookResult.trigger, null, 2) }}</pre>
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
              Configured URL: {{ webhookResult.delivery.webhookUrl }}
            </p>
          </div>

          <div v-if="webhookResult.delivery?.success && webhookResult.received.length">
            <p class="text-sm font-medium text-highlighted mb-2">
              Recent delivery (while-app ingest)
            </p>
            <pre class="text-xs overflow-auto rounded-lg border border-default p-3 bg-muted/30 max-h-40">{{ JSON.stringify(webhookResult.received[0], null, 2) }}</pre>
          </div>
          <UAlert
            v-if="webhookResult.delivery?.success && webhookResult.received.length && !webhookResult.message"
            color="warning"
            variant="subtle"
            title="Ingest OK but no Messages row"
            description="Webhook delivery reached while-app, but no clinical processed message was created. Use a clinical event such as patient.admitted — tunnel-only events appear under Logs, not Messages."
          />
          <div v-if="webhookResult.message" class="rounded-lg border border-default p-3 space-y-1">
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
            Fix the webhook URL above (use
            <code class="font-mono text-xs">{{ dockerReceiverUrl }}</code>
            when ultra-a runs in Docker), click Save, then send the test again.
          </p>
        </div>
      </div>
    </div>
  </UCard>
</template>
