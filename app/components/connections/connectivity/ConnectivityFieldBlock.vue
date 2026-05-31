<script setup lang="ts">
defineProps<{
  label: string
  description: string
  help: string
  required?: boolean
}>()
</script>

<template>
  <article class="while-card overflow-hidden">
    <div class="while-card-muted border-b border-default px-4 py-3">
      <div class="mb-2 flex items-center gap-2">
        <h4 class="text-sm font-semibold text-highlighted">
          {{ label }}
        </h4>
        <span
          v-if="required"
          class="text-xs font-medium text-error"
          aria-hidden="true"
        >
          Required
        </span>
      </div>
      <div class="while-card-inset px-3 py-2.5">
        <slot />
      </div>
    </div>

    <div class="space-y-2 bg-default px-4 py-3">
      <div class="flex gap-2.5">
        <UIcon name="i-iconoir-info-circle" class="mt-0.5 size-4 shrink-0 text-dimmed" />
        <p class="text-xs leading-relaxed text-muted">
          <span class="font-medium text-highlighted">What it is.</span>
          {{ description }}
        </p>
      </div>
      <div class="ml-6 border-l-2 border-primary/25 pl-3">
        <p class="text-xs leading-relaxed text-dimmed">
          <span class="font-medium text-muted">Where to find it.</span>
          {{ help }}
        </p>
      </div>
    </div>
  </article>
</template>
