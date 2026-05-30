<script setup lang="ts">
import type { Connection } from '~/types/while'

defineProps<{
  connection: Connection
}>()

const config = useRuntimeConfig()
const apiBaseUrl = computed(() => config.public.whileApiUrl as string)
</script>

<template>
  <UCard class="rounded-xl border border-default bg-elevated">
    <template #header>
      <div class="flex items-center gap-2">
        <h3 class="font-semibold text-highlighted">
          While Sandbox API
        </h3>
        <UBadge color="warning" variant="subtle">
          System Sandbox
        </UBadge>
      </div>
      <p class="text-sm text-muted mt-1">
        Synthetic FHIR clinic data via the control plane. No live version — use this connection to build and test integrations. Webhook URL and secret are configured under <NuxtLink to="/settings" class="text-primary hover:underline">Settings</NuxtLink> — see <NuxtLink to="/docs/webhooks" class="text-primary hover:underline">Webhooks</NuxtLink>.
      </p>
    </template>
    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
      <div>
        <dt class="text-muted">
          Connection ID
        </dt>
        <dd class="font-mono text-highlighted">
          {{ connection.id }}
        </dd>
      </div>
      <div>
        <dt class="text-muted">
          API base URL
        </dt>
        <dd class="font-mono text-highlighted break-all">
          {{ apiBaseUrl }}
        </dd>
      </div>
      <div class="sm:col-span-2">
        <dt class="text-muted mb-1">
          Quick start
        </dt>
        <dd>
          <pre class="text-xs overflow-auto rounded-lg border border-default p-3 bg-muted/30">GET {{ apiBaseUrl }}/v1/sandbox/catalog
GET {{ apiBaseUrl }}/v1/patients/{patient_id}
POST {{ apiBaseUrl }}/v1/webhooks/trigger-mock-event</pre>
        </dd>
      </div>
    </dl>
    <template #footer>
      <div class="flex flex-wrap gap-2">
        <UButton :to="`/connections/${connection.id}/test`" size="sm">
          Open test suite
        </UButton>
        <UButton :to="`/connections/${connection.id}/credentials`" variant="outline" size="sm">
          Manage credentials
        </UButton>
        <UButton to="/settings" variant="outline" size="sm">
          Webhook settings
        </UButton>
        <UButton to="/docs/webhooks" variant="outline" size="sm">
          Webhook docs
        </UButton>
        <UButton to="/docs/getting-started" variant="outline" size="sm">
          Developer docs
        </UButton>
      </div>
    </template>
  </UCard>
</template>
