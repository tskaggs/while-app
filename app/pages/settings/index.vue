<script setup lang="ts">
import { authClient } from '~/lib/auth-client'

const config = useRuntimeConfig()

useSeoMeta({ title: 'Settings' })

const { data: orgStatus, refresh: refreshOrg } = await useAsyncData('org-settings', () =>
  config.public.mockMode
    ? Promise.resolve(null)
    : $fetch<{
        organization: { name: string; metadata: Record<string, unknown> } | null
        apiKeys: Array<{ environment: string; keyPrefix: string; isActive: boolean }>
        sandboxSettings: { webhookUrl: string | null } | null
      }>('/api/org/status')
)

const webhookUrl = ref(orgStatus.value?.sandboxSettings?.webhookUrl ?? '')
const webhookSaving = ref(false)
const webhookMessage = ref('')

async function saveWebhook() {
  webhookSaving.value = true
  webhookMessage.value = ''
  try {
    await $fetch('/api/settings/webhook', {
      method: 'POST',
      body: { webhookUrl: webhookUrl.value }
    })
    webhookMessage.value = 'Webhook URL saved.'
    await refreshOrg()
  } catch {
    webhookMessage.value = 'Failed to save webhook URL.'
  } finally {
    webhookSaving.value = false
  }
}

const inviteEmail = ref('')
const inviteRole = ref<'owner' | 'admin' | 'member'>('member')
const inviteLoading = ref(false)
const inviteError = ref('')
const inviteLinks = ref<Array<{ id: string; email: string; role: string; url: string; createdAt: string }>>([])

const { data: orgMembers } = await useAsyncData('org-members', async () => {
  if (config.public.mockMode) return null
  const { data } = await authClient.organization.getFullOrganization()
  return data
}, { watch: [] })

async function loadInviteLinks() {
  if (config.public.mockMode) return
  const res = await $fetch<{ invites: typeof inviteLinks.value }>('/api/team/invites')
  inviteLinks.value = res.invites
}

async function sendInvite() {
  if (!inviteEmail.value) return
  inviteLoading.value = true
  inviteError.value = ''
  try {
    const { error } = await authClient.organization.inviteMember({
      email: inviteEmail.value,
      role: inviteRole.value
    })
    if (error) {
      inviteError.value = error.message ?? 'Invite failed'
      return
    }
    inviteEmail.value = ''
    await loadInviteLinks()
  } finally {
    inviteLoading.value = false
  }
}

onMounted(loadInviteLinks)

const orgName = computed(() =>
  orgStatus.value?.organization?.name
  ?? orgMembers.value?.name
  ?? 'Acme Health Inc.'
)

const planLabel = computed(() => {
  const plan = orgStatus.value?.organization?.metadata?.plan
  return plan ? `Managed Cloud — ${String(plan)}` : 'Managed Cloud — Startup'
})
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
            <UInput :model-value="orgName" disabled />
          </UFormField>
          <UFormField label="Plan">
            <UInput :model-value="planLabel" disabled />
          </UFormField>
        </div>
      </UCard>

      <UCard class="rounded-xl border border-default bg-elevated">
        <template #header>
          <h3 class="font-semibold text-highlighted">
            API Keys
          </h3>
          <p class="text-sm text-muted mt-1">
            Keys are shown masked. The plaintext sandbox key was displayed once during onboarding.
          </p>
        </template>
        <div class="space-y-3">
          <template v-if="orgStatus?.apiKeys?.length">
            <div
              v-for="key in orgStatus.apiKeys"
              :key="key.environment"
              class="flex items-center justify-between rounded-lg border border-default p-3"
            >
              <div>
                <p class="text-sm font-medium text-highlighted capitalize">
                  {{ key.environment }} Key
                </p>
                <code class="text-xs text-muted">{{ key.keyPrefix }}••••••••••••</code>
              </div>
              <UBadge :color="key.environment === 'sandbox' ? 'warning' : 'success'" variant="subtle">
                {{ key.isActive ? 'Active' : 'Inactive' }}
              </UBadge>
            </div>
          </template>
          <template v-else>
            <div class="flex items-center justify-between rounded-lg border border-default p-3">
              <div>
                <p class="text-sm font-medium text-highlighted">
                  Sandbox Key
                </p>
                <code class="text-xs text-muted">wh_test_••••••••••••</code>
              </div>
              <UBadge color="warning" variant="subtle">
                Sandbox
              </UBadge>
            </div>
          </template>
        </div>
      </UCard>

      <UCard class="rounded-xl border border-default bg-elevated">
        <template #header>
          <h3 class="font-semibold text-highlighted">
            Default webhook destination
          </h3>
          <p class="text-sm text-muted mt-1">
            Used by all connections unless a connection overrides URL or secret on its Test page.
          </p>
        </template>
        <div class="space-y-3">
          <UFormField label="Org default webhook URL">
            <UInput v-model="webhookUrl" placeholder="https://your-app.com/webhook/while" />
          </UFormField>
          <UButton :loading="webhookSaving" @click="saveWebhook">
            Save default webhook URL
          </UButton>
          <p class="text-xs text-muted">
            Per-connection overrides and secret rotation are on each connection's
            <NuxtLink to="/connections" class="text-primary hover:underline">
              Test
            </NuxtLink>
            tab.
          </p>
          <p v-if="webhookMessage" class="text-sm text-muted">
            {{ webhookMessage }}
          </p>
        </div>
      </UCard>

      <UCard v-if="!config.public.mockMode" class="rounded-xl border border-default bg-elevated">
        <template #header>
          <h3 class="font-semibold text-highlighted">
            Team
          </h3>
          <p class="text-sm text-muted mt-1">
            Invite owners, developers, and managers. All roles have full access for now.
          </p>
        </template>
        <div class="space-y-4">
          <div v-if="orgMembers?.members?.length" class="space-y-2">
            <p class="text-sm font-medium text-highlighted">
              Members
            </p>
            <div
              v-for="member in orgMembers.members"
              :key="member.id"
              class="flex items-center justify-between rounded-lg border border-default p-3 text-sm"
            >
              <span>{{ member.user.name || member.user.email }}</span>
              <UBadge variant="subtle" class="capitalize">
                {{ member.role }}
              </UBadge>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <UFormField label="Email" class="sm:col-span-2">
              <UInput v-model="inviteEmail" type="email" placeholder="colleague@company.com" />
            </UFormField>
            <UFormField label="Role">
              <USelect
                v-model="inviteRole"
                :items="[
                  { label: 'Owner', value: 'owner' },
                  { label: 'Developer', value: 'member' },
                  { label: 'Manager', value: 'admin' }
                ]"
              />
            </UFormField>
          </div>
          <UAlert v-if="inviteError" color="error" variant="subtle" :title="inviteError" />
          <UButton :loading="inviteLoading" @click="sendInvite">
            Send invite
          </UButton>
          <div v-if="inviteLinks.length" class="space-y-2">
            <p class="text-sm text-muted">
              Pending invite links (dev mode):
            </p>
            <div
              v-for="link in inviteLinks"
              :key="link.id"
              class="rounded-lg border border-default p-3 text-xs font-mono break-all"
            >
              {{ link.email }} ({{ link.role }}): {{ link.url }}
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
