<script setup lang="ts">
type BadgeStatus = 'success' | 'error' | 'review' | 'neutral'

defineProps<{
  icon: string
  label: string
  status: BadgeStatus
  tooltip: string
}>()

const badgeStatusStyles: Record<BadgeStatus, string> = {
  success: 'border-success/35 bg-success/5 text-success',
  error: 'border-error/35 bg-error/5 text-error',
  review: 'border-warning/35 bg-warning/5 text-warning',
  neutral: 'border-default bg-elevated/80 text-muted'
}
</script>

<template>
  <UTooltip
    :text="tooltip"
    :content="{ side: 'top', sideOffset: 6 }"
  >
    <span
      tabindex="0"
      class="inline-flex cursor-help items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      :class="badgeStatusStyles[status]"
    >
      <UIcon :name="icon" class="size-3.5 shrink-0" />
      {{ label }}
    </span>
  </UTooltip>
</template>
