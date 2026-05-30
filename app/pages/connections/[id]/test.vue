<script setup lang="ts">
interface TestContext {
  connectionId: string
  partnerName: string
  isSystemSandbox: boolean
  apiBaseUrl: string
  webhookUrl: string | null
  webhookSecretConfigured: boolean
  samplePatientId: string
  keyPrefix: string | null
  siteReceiverUrl: string
  dockerReceiverUrl: string
  webhookUrlNeedsDockerFix: boolean
}

const config = useRuntimeConfig()
const requestFetch = useRequestFetch()

const {
  connection,
  connectionId,
  useConnectionPageMeta,
  isSystemSandbox
} = useConnectionDetail()
const { connections, getPairedConnection } = useConnections()

useConnectionPageMeta('Test')

const sandboxApiKey = ref('')

const { data: testContext, refresh: refreshContext } = await useAsyncData(
  () => `connection-test-${connectionId.value}`,
  () => {
    if (!connectionId.value) return Promise.resolve(null)

    if (config.public.mockMode) {
      const siteUrl = config.public.siteUrl as string
      const apiBaseUrl = config.public.whileApiUrl as string
      const isSystem = isSystemSandbox(connection.value!)
      return Promise.resolve({
        connectionId: connectionId.value,
        partnerName: connection.value?.partnerName ?? 'Connection',
        isSystemSandbox: isSystem,
        apiBaseUrl,
        webhookUrl: `${siteUrl}/api/webhooks/while`,
        webhookSecretConfigured: true,
        samplePatientId: 'pat_mock0001_01',
        keyPrefix: 'wh_test_mock',
        siteReceiverUrl: `${siteUrl}/api/webhooks/while`,
        dockerReceiverUrl: `${siteUrl.replace('localhost', 'host.docker.internal')}/api/webhooks/while`,
        webhookUrlNeedsDockerFix: false
      } satisfies TestContext)
    }

    return requestFetch<TestContext>(`/api/connections/${connectionId.value}/test/context`)
  },
  { watch: [connectionId] }
)

const snippetContext = computed(() => ({
  apiBaseUrl: testContext.value?.apiBaseUrl ?? (config.public.whileApiUrl as string),
  connectionId: testContext.value?.connectionId ?? connectionId.value,
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
      `/api/connections/${connectionId.value}/test/catalog`,
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
      `/api/connections/${connectionId.value}/test/patient`,
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
  if (!connection.value || isSystemSandbox(connection.value)) return null

  if (connection.value.environment === 'live' && connection.value.pairedConnectionId) {
    return `/connections/${connection.value.pairedConnectionId}/test`
  }

  if (systemSandboxConnection.value) {
    return `/connections/${systemSandboxConnection.value.id}/test`
  }

  return null
})

const pairedSandbox = computed(() => {
  if (!connection.value) return undefined
  const paired = getPairedConnection(connection.value)
  if (paired?.environment === 'sandbox') return paired
  return undefined
})

function onWebhookSaved(url: string) {
  if (testContext.value) {
    testContext.value = { ...testContext.value, webhookUrl: url }
  }
  if (!config.public.mockMode) {
    void refreshContext()
  }
}
</script>

<template>
  <div v-if="connection && testContext" class="space-y-6">
    <UCard class="rounded-xl border border-default bg-elevated">
      <p class="text-sm text-muted">
        Integration tests for
        <span class="font-medium text-highlighted">{{ testContext.partnerName }}</span>
        ·
        <span class="font-mono text-xs">{{ testContext.connectionId }}</span>
      </p>
    </UCard>

    <UCard class="rounded-xl border border-default bg-elevated">
      <template #header>
        <h3 class="font-semibold text-highlighted">
          Credentials
        </h3>
        <p class="text-sm text-muted mt-1">
          Sandbox API key is kept in this browser session only — never stored on the server.
        </p>
      </template>
      <div class="space-y-4">
        <UFormField label="Sandbox API key (session only)">
          <UInput
            v-model="sandboxApiKey"
            type="password"
            placeholder="wh_test_…"
            class="font-mono text-sm"
            autocomplete="off"
          />
        </UFormField>
        <p v-if="testContext.keyPrefix" class="text-xs text-muted">
          Active org key prefix:
          <code class="font-mono">{{ testContext.keyPrefix }}…</code>
          — paste the full key from onboarding to run live tests.
        </p>
        <UAlert
          v-if="!config.public.mockMode && !canRunLiveTests"
          color="warning"
          variant="subtle"
          title="API key required for live tests"
          description="After onboarding, the plaintext sandbox key is not stored. Paste it here to proxy requests through While."
        />
      </div>
    </UCard>

    <UCard
      v-if="!testContext.isSystemSandbox"
      class="rounded-xl border border-default bg-elevated"
    >
      <template #header>
        <h3 class="font-semibold text-highlighted">
          Partner connection
        </h3>
      </template>
      <p class="text-sm text-muted">
        Interactive API tests run against the
        <strong class="text-highlighted">While Sandbox</strong>
        system connection. This {{ connection.environment }} clinic connection uses Sidecar tunneling —
        use the webhook section below for org-level delivery setup.
        <code class="font-mono text-xs">connection_id</code>
        in each payload identifies this connection (
        <code class="font-mono text-xs">{{ connection.id }}</code>).
      </p>
      <div v-if="sandboxTestLink" class="mt-4">
        <UButton :to="sandboxTestLink" variant="outline" icon="i-iconoir-arrow-right">
          Open While Sandbox test suite
        </UButton>
        <p v-if="pairedSandbox && connection.environment === 'live'" class="text-xs text-muted mt-2">
          Clinic sandbox twin:
          <NuxtLink
            :to="`/connections/${pairedSandbox.id}`"
            class="font-mono text-primary hover:underline"
          >
            {{ pairedSandbox.id }}
          </NuxtLink>
        </p>
      </div>
    </UCard>

    <template v-if="testContext.isSystemSandbox">
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
    </template>

    <ConnectionsTestConnectionWebhookTestPanel
      :connection-id="testContext.connectionId"
      :webhook-url="testContext.webhookUrl"
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

  <div v-else-if="connection" class="flex justify-center py-16">
    <UIcon name="i-iconoir-refresh-double" class="size-6 animate-spin text-muted" />
  </div>
</template>
