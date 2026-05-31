<script setup lang="ts">
defineProps<{
  title: string
  description: string
  icon?: string
}>()
</script>

<template>
  <div class="while-card while-card-intro overflow-hidden px-4 py-3">
    <div class="flex items-start gap-3">
      <div
        v-if="icon"
        class="while-card-inset flex size-9 shrink-0 items-center justify-center"
      >
        <UIcon :name="icon" class="size-4 text-primary" />
      </div>
      <div class="min-w-0">
        <h3 class="text-base font-semibold text-highlighted">
          {{ title }}
        </h3>
        <p class="mt-1 text-sm text-muted leading-relaxed">
          {{ description }}
        </p>
      </div>
    </div>
  </div>
</template>
