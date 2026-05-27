<script setup lang="ts">
import type { SupportInboxItem } from '~/types/while'

defineProps<{
  item: SupportInboxItem
}>()

const statusColors: Record<SupportInboxItem['status'], 'success' | 'warning' | 'info' | 'neutral'> = {
  submitted: 'info',
  in_review: 'warning',
  in_progress: 'info',
  completed: 'success'
}

const categoryLabels = {
  general: 'General',
  billing: 'Billing',
  connection: 'Connection'
} as const

function formatDate(date: string) {
  return new Date(date).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="shrink-0 border-b border-default px-6 py-4">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <p class="text-xs font-medium uppercase tracking-wide text-muted">
            {{ item.kind === 'connection' ? 'Connection onboarding' : 'Support ticket' }}
          </p>
          <h2 class="mt-1 text-lg font-semibold text-highlighted truncate">
            {{ item.title }}
          </h2>
          <p class="mt-0.5 text-xs text-muted">
            {{ item.id.toUpperCase() }} · Submitted {{ formatDate(item.submittedAt) }}
          </p>
        </div>
        <UBadge
          :color="statusColors[item.status]"
          variant="subtle"
          class="capitalize shrink-0"
        >
          {{ item.status.replace('_', ' ') }}
        </UBadge>
      </div>
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-6">
      <div
        v-if="item.kind === 'connection'"
        class="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <div class="rounded-lg border border-default p-4">
          <p class="text-xs text-muted">
            EHR system
          </p>
          <p class="mt-1 font-medium text-highlighted">
            {{ item.ehrVendor }}
          </p>
        </div>
        <div class="rounded-lg border border-default p-4">
          <p class="text-xs text-muted">
            Environment
          </p>
          <p class="mt-1 font-medium capitalize text-highlighted">
            {{ item.environment }}
          </p>
        </div>
        <div class="rounded-lg border border-default p-4 sm:col-span-2">
          <p class="text-xs text-muted">
            Target go-live
          </p>
          <p class="mt-1 font-medium text-highlighted">
            {{ item.targetGoLive }}
          </p>
        </div>
      </div>

      <div
        v-else
        class="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <div class="rounded-lg border border-default p-4">
          <p class="text-xs text-muted">
            Category
          </p>
          <p class="mt-1 font-medium text-highlighted">
            {{ item.category ? categoryLabels[item.category] : '—' }}
          </p>
        </div>
        <div v-if="item.connectionId" class="rounded-lg border border-default p-4">
          <p class="text-xs text-muted">
            Connection
          </p>
          <NuxtLink
            :to="`/connections/${item.connectionId}`"
            class="mt-1 inline-flex font-medium text-primary hover:underline"
          >
            {{ item.title }}
          </NuxtLink>
        </div>
      </div>

      <div class="rounded-lg border border-default bg-elevated/50 p-4">
        <p class="text-xs font-medium text-muted mb-2">
          {{ item.kind === 'ticket' ? 'Message' : 'Summary' }}
        </p>
        <p class="text-sm leading-relaxed text-highlighted whitespace-pre-wrap">
          {{ item.kind === 'ticket' ? item.message : item.preview }}
        </p>
      </div>

      <div class="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-muted">
        <p class="font-medium text-highlighted mb-1">
          While team
        </p>
        <p>
          Thanks for reaching out. A solutions engineer is assigned to this
          {{ item.kind === 'connection' ? 'onboarding request' : 'ticket' }} and will update the status as work progresses.
          Typical response time is within one business day.
        </p>
      </div>
    </div>
  </div>
</template>
