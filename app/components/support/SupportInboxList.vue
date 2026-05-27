<script setup lang="ts">
import type { SupportInboxItem } from '~/types/while'

defineProps<{
  items: SupportInboxItem[]
  selectedKey?: string
}>()

const emit = defineEmits<{
  select: [key: string]
}>()

const statusColors: Record<SupportInboxItem['status'], 'success' | 'warning' | 'info' | 'neutral'> = {
  submitted: 'info',
  in_review: 'warning',
  in_progress: 'info',
  completed: 'success'
}

const kindIcons: Record<SupportInboxItem['kind'], string> = {
  connection: 'i-lucide-network',
  ticket: 'i-lucide-headphones'
}

function formatDate(date: string) {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="flex-1 min-h-0 overflow-y-auto divide-y divide-default">
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      class="w-full px-4 py-3 text-left transition-colors hover:bg-accented/40"
      :class="selectedKey === item.key ? 'bg-accented/60' : ''"
      @click="emit('select', item.key)"
    >
      <div class="flex items-start gap-3">
        <div
          class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-default bg-default/50"
        >
          <UIcon :name="kindIcons[item.kind]" class="size-4 text-primary" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <p class="truncate text-sm font-medium text-highlighted">
              {{ item.title }}
            </p>
            <UBadge
              :color="statusColors[item.status]"
              variant="subtle"
              class="shrink-0 capitalize text-[10px]"
            >
              {{ item.status.replace('_', ' ') }}
            </UBadge>
          </div>
          <p class="mt-1 line-clamp-2 text-xs text-muted">
            {{ item.preview }}
          </p>
          <div class="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-dimmed">
            <span class="uppercase tracking-wide">{{ item.kind === 'connection' ? 'Onboarding' : 'Ticket' }}</span>
            <span>{{ item.id.toUpperCase() }}</span>
            <span v-if="item.environment" class="capitalize">{{ item.environment }}</span>
            <span>{{ formatDate(item.submittedAt) }}</span>
          </div>
        </div>
      </div>
    </button>

    <p v-if="!items.length" class="px-4 py-10 text-center text-sm text-muted">
      No support requests match your filters.
    </p>
  </div>
</template>
