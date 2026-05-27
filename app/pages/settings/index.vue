<script setup lang="ts">
useSeoMeta({ title: 'Settings' })
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Settings" />

    <div class="max-w-2xl space-y-6">
      <UCard class="rounded-xl border border-default bg-elevated">
        <template #header>
          <h3 class="font-semibold text-highlighted">
            Appearance
          </h3>
          <p class="text-sm text-muted mt-1">
            Choose light or dark mode, or match your system preference.
          </p>
        </template>
        <UFormField label="Theme">
          <UColorModeSelect class="w-full sm:max-w-xs" />
        </UFormField>
      </UCard>

      <UCard class="rounded-xl border border-default bg-elevated">
        <template #header>
          <h3 class="font-semibold text-highlighted">
            Organization
          </h3>
        </template>
        <div class="space-y-4">
          <UFormField label="Organization Name">
            <UInput model-value="Acme Health Inc." disabled />
          </UFormField>
          <UFormField label="Plan">
            <UInput model-value="Managed Cloud — Startup" disabled />
          </UFormField>
        </div>
      </UCard>

      <UCard class="rounded-xl border border-default bg-elevated">
        <template #header>
          <h3 class="font-semibold text-highlighted">
            API Keys
          </h3>
          <p class="text-sm text-muted mt-1">
            Display only — key management requires backend integration.
          </p>
        </template>
        <div class="space-y-3">
          <div class="flex items-center justify-between rounded-lg border border-default p-3">
            <div>
              <p class="text-sm font-medium text-highlighted">
                Production Key
              </p>
              <code class="text-xs text-muted">wh_live_••••••••••••4k9f</code>
            </div>
            <UBadge color="success" variant="subtle">
              Active
            </UBadge>
          </div>
          <div class="flex items-center justify-between rounded-lg border border-default p-3">
            <div>
              <p class="text-sm font-medium text-highlighted">
                Sandbox Key
              </p>
              <code class="text-xs text-muted">wh_test_••••••••••••7m2p</code>
            </div>
            <UBadge color="warning" variant="subtle">
              Sandbox
            </UBadge>
          </div>
        </div>
      </UCard>

      <UCard class="rounded-xl border border-default bg-elevated">
        <template #header>
          <h3 class="font-semibold text-highlighted">
            Webhook URL
          </h3>
        </template>
        <UFormField label="Event Destination">
          <UInput model-value="https://app.startup.co/webhook/while" />
        </UFormField>
      </UCard>
    </div>
  </div>
</template>
