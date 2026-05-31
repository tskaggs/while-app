<script setup lang="ts">
import type { Connection } from '~/types/while'

interface TestContext {
  connectionId: string
  partnerName: string
  isSystemSandbox: boolean
  apiBaseUrl: string
  orgDefaultWebhookUrl?: string | null
  connectionWebhookUrl?: string | null
  webhookUrl: string | null
  inheritsDefault?: boolean
  urlSource?: 'org' | 'connection' | null
  hasCustomSecret?: boolean
  webhookSecretConfigured: boolean
  samplePatientId: string
  keyPrefix: string | null
  siteReceiverUrl: string
  dockerReceiverUrl: string
  webhookUrlNeedsDockerFix: boolean
}

const props = defineProps<{
  connection: Connection
}>()

const config = useRuntimeConfig()
const requestFetch = useRequestFetch()
const { connections, getPairedConnection, isSystemSandbox } = useConnections()

const sandboxApiKey = ref('')

const { data: testContext, refresh: refreshContext, pending } = await useAsyncData(
  () => `connection-test-${props.connection.id}`,
  () => {
    if (config.public.mockMode) {
      const siteUrl = config.public.siteUrl as string
      const apiBaseUrl = config.public.whileApiUrl as string
      const isSystem = isSystemSandbox(props.connection)
      const receiverUrl = `${siteUrl}/api/webhooks/while`
      return Promise.resolve({
        connectionId: props.connection.id,
        partnerName: props.connection.partnerName,
        isSystemSandbox: isSystem,
        apiBaseUrl,
        orgDefaultWebhookUrl: receiverUrl,
        connectionWebhookUrl: null,
        webhookUrl: receiverUrl,
        inheritsDefault: true,
        urlSource: 'org',
        hasCustomSecret: false,
        webhookSecretConfigured: true,
        samplePatientId: 'pat_mock0001_01',
        keyPrefix: 'wh_test_mock',
        siteReceiverUrl: receiverUrl,
        dockerReceiverUrl: `${siteUrl.replace('localhost', 'host.docker.internal')}/api/webhooks/while`,
        webhookUrlNeedsDockerFix: false
      } satisfies TestContext)
    }

    return requestFetch<TestContext>(`/api/connections/${props.connection.id}/test/context`)
  },
  { watch: () => props.connection.id }
)

const snippetContext = computed(() => ({
  apiBaseUrl: testContext.value?.apiBaseUrl ?? (config.public.whileApiUrl as string),
  connectionId: testContext.value?.connectionId ?? props.connection.id,
  samplePatientId: testContext.value?.samplePatientId ?? 'pat_00000000_01',
  apiKey: sandboxApiKey.value
}))

const {
  catalogSnippets,
  patientSnippets,
  webhookTriggerSnippets,
  webhookVerifySnippet
} = useConnectionTestSnippets(snippetContext)

const canRunLiveTests = computed(() =>
  config.public.mockMode || Boolean(sandboxApiKey.value.trim())
)

const catalogLoading = ref(false)
const catalogStatus = ref<number | null>(null)
const catalogResponse = ref<unknown>(null)
const catalogError = ref<string | null>(null)

const patientLoading = ref(false)
const patientStatus = ref<number | null>(null)
const patientResponse = ref<unknown>(null)
const patientError = ref<string | null>(null)

function testRequestOptions() {
  const key = sandboxApiKey.value.trim()
  if (!key) return {}

  return {
    query: { sandboxApiKey: key },
    headers: {
      'X-Sandbox-Api-Key': key,
      Authorization: `Bearer ${key}`
    }
  }
}

function parseFetchError(error: unknown) {
  const fetchError = error as { data?: { message?: string }, message?: string }
  return fetchError.data?.message ?? fetchError.message ?? 'Request failed'
}

async function runCatalogTest() {
  catalogLoading.value = true
  catalogError.value = null
  catalogStatus.value = null
  catalogResponse.value = null

  try {
    const res = await $fetch<{ status: number, body: unknown }>(
      `/api/connections/${props.connection.id}/test/catalog`,
      testRequestOptions()
    )
    catalogStatus.value = res.status
    catalogResponse.value = res.body
  } catch (error) {
    catalogError.value = parseFetchError(error)
  } finally {
    catalogLoading.value = false
  }
}

async function runPatientTest() {
  patientLoading.value = true
  patientError.value = null
  patientStatus.value = null
  patientResponse.value = null

  try {
    const res = await $fetch<{ status: number, body: unknown }>(
      `/api/connections/${props.connection.id}/test/patient`,
      testRequestOptions()
    )
    patientStatus.value = res.status
    patientResponse.value = res.body
  } catch (error) {
    patientError.value = parseFetchError(error)
  } finally {
    patientLoading.value = false
  }
}

const systemSandboxConnection = computed(() =>
  connections.value.find(c => isSystemSandbox(c))
)

const sandboxTestLink = computed(() => {
  if (isSystemSandbox(props.connection)) return null

  if (props.connection.environment === 'live' && props.connection.pairedConnectionId) {
    return `/connections/${props.connection.pairedConnectionId}/connectivity?section=tests`
  }

  if (systemSandboxConnection.value) {
    return `/connections/${systemSandboxConnection.value.id}/connectivity?section=tests`
  }

  return null
})

const pairedSandbox = computed(() => {
  const paired = getPairedConnection(props.connection)
  if (paired?.environment === 'sandbox') return paired
  return undefined
})

function onWebhookSaved(payload: { effectiveUrl: string | null, inheritsDefault: boolean }) {
  if (testContext.value) {
    testContext.value = {
      ...testContext.value,
      webhookUrl: payload.effectiveUrl,
      inheritsDefault: payload.inheritsDefault,
      connectionWebhookUrl: payload.inheritsDefault ? null : payload.effectiveUrl,
      urlSource: payload.inheritsDefault ? 'org' : 'connection'
    }
  }
  if (!config.public.mockMode) {
    void refreshContext()
  }
}
</script>

<template>
  <div v-if="pending" class="flex justify-center py-12">
    <UIcon name="i-iconoir-refresh-double" class="size-6 animate-spin text-muted" />
  </div>

  <div v-else-if="testContext" class="space-y-5">
    <ConnectionsConnectivitySectionIntro
      title="Tests"
      description="Validate sandbox API access, webhook delivery, and integration endpoints before go-live."
      icon="i-iconoir-flask"
    />

    <ConnectionsConnectivityFieldGroup
      title="Test setup"
      description="Session credentials and endpoints used by the runners below."
    >
      <ConnectionsConnectivityFieldBlock
        label="Control plane API base URL"
        description="Root URL for While sandbox API requests from your application."
        help="Configured in your environment (WHILE_API_URL). Use this base when building client SDK calls or curl examples below."
      >
        <code class="block break-all font-mono text-xs text-highlighted">{{ testContext.apiBaseUrl }}</code>
      </ConnectionsConnectivityFieldBlock>

      <ConnectionsConnectivityFieldBlock
        label="Sandbox API key (session only)"
        description="Temporary copy of your wh_test_* key for proxying live test requests through While."
        help="Paste the full key from onboarding or Credential rotation. It is never stored on the server — only kept in this browser tab for the current session."
      >
        <UInput
          v-model="sandboxApiKey"
          type="password"
          placeholder="wh_test_…"
          class="w-full font-mono text-sm"
          autocomplete="off"
        />
        <p v-if="testContext.keyPrefix" class="mt-2 text-xs text-muted">
          Active org key prefix:
          <code class="font-mono">{{ testContext.keyPrefix }}…</code>
        </p>
        <UAlert
          v-if="!config.public.mockMode && !canRunLiveTests"
          class="mt-3"
          color="warning"
          variant="subtle"
          title="API key required for live tests"
          description="After onboarding, the plaintext sandbox key is not stored. Paste it here or rotate a new key in Credential."
        />
      </ConnectionsConnectivityFieldBlock>

      <ConnectionsConnectivityFieldBlock
        v-if="!testContext.isSystemSandbox"
        label="Partner connection testing"
        description="Interactive API catalog tests run against the While Sandbox system connection."
        help="Clinic connections use sidecar tunneling in production. Open the While Sandbox test suite for catalog/patient API checks; use webhook tests below for per-connection delivery."
      >
        <p class="text-sm text-muted">
          This {{ connection.environment }} connection is identified by
          <code class="font-mono text-xs">{{ connection.id }}</code>
          in webhook payloads.
        </p>
        <UButton
          v-if="sandboxTestLink"
          :to="sandboxTestLink"
          class="mt-3"
          variant="outline"
          icon="i-iconoir-arrow-right"
          size="sm"
        >
          Open While Sandbox tests
        </UButton>
        <p v-if="pairedSandbox && connection.environment === 'live'" class="mt-2 text-xs text-muted">
          Clinic sandbox twin:
          <NuxtLink
            :to="`/connections/${pairedSandbox.id}/connectivity?section=tests`"
            class="font-mono text-primary hover:underline"
          >
            {{ pairedSandbox.id }}
          </NuxtLink>
        </p>
      </ConnectionsConnectivityFieldBlock>
    </ConnectionsConnectivityFieldGroup>

    <div v-if="testContext.isSystemSandbox" class="space-y-4 border-t border-default pt-5">
      <div class="border-b border-default pb-2">
        <h4 class="text-xs font-semibold uppercase tracking-wide text-dimmed">
          API endpoint tests
        </h4>
        <p class="mt-1 text-xs text-muted">
          Run live requests against the control plane using your session API key.
        </p>
      </div>

      <ConnectionsTestConnectionTestEndpointCard
        method="GET"
        title="/v1/sandbox/catalog"
        description="List synthetic patients and available mock event types from the control plane sandbox."
        :curl="catalogSnippets.curl"
        :typescript="catalogSnippets.typescript"
        :loading="catalogLoading"
        :disabled="!canRunLiveTests"
        :status="catalogStatus"
        :response="catalogResponse"
        :error="catalogError"
        @run="runCatalogTest"
      />

      <ConnectionsTestConnectionTestEndpointCard
        method="GET"
        :title="`/v1/patients/${testContext.samplePatientId}`"
        description="Fetch the default sample patient provisioned for your organization."
        :curl="patientSnippets.curl"
        :typescript="patientSnippets.typescript"
        :loading="patientLoading"
        :disabled="!canRunLiveTests"
        :status="patientStatus"
        :response="patientResponse"
        :error="patientError"
        @run="runPatientTest"
      />

      <ConnectionsTestConnectionTestEndpointCard
        method="POST"
        title="/v1/webhooks/trigger-mock-event"
        description="Trigger a signed webhook delivery to your configured URL via the control plane."
        :curl="webhookTriggerSnippets.curl"
        :typescript="webhookTriggerSnippets.typescript"
        run-label="Run trigger (API only)"
        :loading="false"
        :disabled="!canRunLiveTests"
      />
    </div>

    <div class="space-y-4 border-t border-default pt-5">
      <div class="border-b border-default pb-2">
        <h4 class="text-xs font-semibold uppercase tracking-wide text-dimmed">
          Webhook tests
        </h4>
        <p class="mt-1 text-xs text-muted">
          Configure delivery URL, verify signatures, and trigger sample events.
        </p>
      </div>

      <ConnectionsTestConnectionWebhookTestPanel
      :connection-id="testContext.connectionId"
      :webhook-url="testContext.webhookUrl"
      :org-default-webhook-url="testContext.orgDefaultWebhookUrl"
      :connection-webhook-url="testContext.connectionWebhookUrl"
      :inherits-default="testContext.inheritsDefault"
      :url-source="testContext.urlSource"
      :has-custom-secret="testContext.hasCustomSecret"
      :webhook-secret-configured="testContext.webhookSecretConfigured"
      :site-receiver-url="testContext.siteReceiverUrl"
      :docker-receiver-url="testContext.dockerReceiverUrl"
      :webhook-url-needs-docker-fix="testContext.webhookUrlNeedsDockerFix"
      :webhook-verify-snippet="webhookVerifySnippet"
      :webhook-trigger-curl="webhookTriggerSnippets.curl"
      :webhook-trigger-typescript="webhookTriggerSnippets.typescript"
      :sample-patient-id="testContext.samplePatientId"
      :sandbox-api-key="sandboxApiKey"
      :mock-mode="config.public.mockMode"
      :enable-trigger-test="testContext.isSystemSandbox"
      @webhook-saved="onWebhookSaved"
    />
    </div>
  </div>
</template>
