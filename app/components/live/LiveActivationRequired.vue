<script setup lang="ts">
import type { Connection } from '~/types/while'
import { LIVE_BLOCKER_LABELS } from '~/data/connections'

const props = defineProps<{
  connection?: Connection
  variant?: 'connection' | 'environment'
}>()

const { blockedLiveConnections, getPairedConnection } = useConnections()

const activation = computed(() => props.connection?.liveActivation)

const blockerIcon: Record<string, string> = {
  customer_action: 'i-iconoir-user-circle',
  while_documents: 'i-iconoir-edit-pencil',
  clinic_approval: 'i-iconoir-building',
  clinic_connectivity: 'i-iconoir-network'
}

const sandboxPair = computed(() =>
  props.connection ? getPairedConnection(props.connection) : undefined
)

const blockedList = computed(() =>
  props.connection ? [props.connection] : blockedLiveConnections.value
)
</script>

<template>
  <div class="rounded-xl border border-warning/30 bg-warning/5 p-6 sm:p-8">
    <div class="flex flex-col gap-6 sm:flex-row sm:items-start">
      <div
        class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning"
      >
        <UIcon name="i-iconoir-shield-alert" class="size-6" />
      </div>

      <div class="min-w-0 flex-1 space-y-4">
        <div>
          <h2 class="text-lg font-semibold text-highlighted">
            <template v-if="variant === 'environment' && !connection">
              Live must be activated
            </template>
            <template v-else>
              Live is not activated for this connection
            </template>
          </h2>
          <p class="mt-2 text-sm text-muted leading-relaxed max-w-2xl">
            <template v-if="variant === 'environment' && !connection">
              None of your Live connections are activated yet. Operational views (messages, tunnel
              logs, integration logs, and charts) only include partners that have completed Live
              promotion. Activate at least one connection to use Live views.
            </template>
            <template v-else-if="activation">
              {{ activation.detail }}
            </template>
            <template v-else>
              This Live connection cannot be used until promotion from Sandbox is complete and all
              blocking steps are resolved.
            </template>
          </p>
        </div>

        <div
          v-if="activation"
          class="rounded-lg border border-default bg-elevated/80 p-4 space-y-3 text-sm"
        >
          <div class="flex flex-wrap items-center gap-2">
            <UBadge color="warning" variant="subtle">
              Activation blocked
            </UBadge>
            <UBadge
              v-if="activation.blocker"
              color="neutral"
              variant="outline"
            >
              {{ LIVE_BLOCKER_LABELS[activation.blocker] }}
            </UBadge>
          </div>
          <p class="font-medium text-highlighted">
            {{ activation.title }}
          </p>
          <p v-if="activation.waitingOn" class="text-muted">
            Waiting on: <span class="text-highlighted">{{ activation.waitingOn }}</span>
          </p>
        </div>

        <ul
          v-if="blockedList.length > 1 || (variant === 'environment' && blockedList.length)"
          class="space-y-2 text-sm"
        >
          <li
            v-for="conn in blockedList"
            :key="conn.id"
            class="flex items-start gap-2 rounded-lg border border-default px-3 py-2 bg-elevated/50"
          >
            <UIcon
              :name="conn.liveActivation?.blocker ? blockerIcon[conn.liveActivation.blocker] : 'i-iconoir-clock'"
              class="size-4 shrink-0 text-warning mt-0.5"
            />
            <div class="min-w-0">
              <p class="font-medium text-highlighted">
                {{ conn.partnerName }}
              </p>
              <p class="text-muted text-xs mt-0.5">
                {{ conn.liveActivation?.title }}
              </p>
            </div>
          </li>
        </ul>

        <div
          v-if="sandboxPair"
          class="text-sm text-muted"
        >
          Sandbox twin:
          <NuxtLink
            :to="`/connections/${sandboxPair.id}`"
            class="text-primary hover:underline font-medium"
          >
            {{ sandboxPair.partnerName }}
          </NuxtLink>
          — continue testing there while Live promotion is in progress.
        </div>

        <div class="flex flex-wrap gap-2 pt-1">
          <UButton
            to="/support"
            label="Contact support"
            icon="i-iconoir-headset"
            size="sm"
          />
          <UButton
            to="/connections"
            label="View connections"
            color="neutral"
            variant="outline"
            icon="i-iconoir-network"
            size="sm"
          />
        </div>
      </div>
    </div>
  </div>
</template>
