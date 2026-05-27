<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
}>()
</script>

<template>
  <div class="mb-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0">
        <slot name="title">
          <h1
            v-if="title"
            class="text-xl font-semibold tracking-tight text-highlighted"
          >
            {{ title }}
          </h1>
        </slot>
        <p v-if="description" class="mt-1 text-sm text-muted">
          {{ description }}
        </p>
      </div>
      <div v-if="$slots.actions" class="flex shrink-0 items-center gap-2">
        <slot name="actions" />
      </div>
    </div>

    <div
      v-if="$slots.filters"
      class="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
    >
      <slot name="filters" />
    </div>
  </div>
</template>
