<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="space-y-3">
    <div class="border-b border-default pb-2">
      <h4 class="text-xs font-semibold uppercase tracking-wide text-dimmed">
        {{ title }}
      </h4>
      <p v-if="description" class="mt-1 text-xs text-muted">
        {{ description }}
      </p>
    </div>
    <div class="space-y-3">
      <slot />
    </div>
  </div>
</template>
