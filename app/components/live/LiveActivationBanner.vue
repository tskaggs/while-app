<script setup lang="ts">
import { LIVE_BLOCKER_LABELS } from '~/data/connections'

const { blockedLiveConnections } = useConnections()
</script>

<template>
  <div
    v-if="blockedLiveConnections.length"
    class="rounded-xl border border-warning/25 bg-warning/5 px-4 py-3"
  >
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div class="flex gap-3 min-w-0">
        <UIcon name="i-iconoir-info-circle" class="size-5 shrink-0 text-warning mt-0.5" />
        <div class="min-w-0">
          <p class="text-sm font-medium text-highlighted">
            {{ blockedLiveConnections.length }} Live connection{{ blockedLiveConnections.length === 1 ? '' : 's' }} not activated
          </p>
          <p class="text-xs text-muted mt-1">
            Operational views only include activated partners. Pending promotions are listed below.
          </p>
          <ul class="mt-2 space-y-1.5">
            <li
              v-for="conn in blockedLiveConnections"
              :key="conn.id"
              class="text-xs text-muted flex flex-wrap items-center gap-x-2 gap-y-0.5"
            >
              <NuxtLink
                :to="`/connections/${conn.id}`"
                class="font-medium text-highlighted hover:text-primary"
              >
                {{ conn.partnerName }}
              </NuxtLink>
              <span class="text-dimmed">·</span>
              <span>{{ conn.liveActivation?.title }}</span>
              <UBadge
                v-if="conn.liveActivation?.blocker"
                color="neutral"
                variant="subtle"
                size="xs"
              >
                {{ LIVE_BLOCKER_LABELS[conn.liveActivation.blocker] }}
              </UBadge>
            </li>
          </ul>
        </div>
      </div>
      <UButton
        to="/support"
        label="Get help"
        icon="i-iconoir-headset"
        color="neutral"
        variant="outline"
        size="xs"
        class="shrink-0"
      />
    </div>
  </div>
</template>
