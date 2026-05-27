<script setup lang="ts">
defineProps<{
  compact?: boolean
}>()
</script>

<template>
  <NuxtLink
    to="/"
    class="flex items-center gap-2 rounded-md px-1 py-1 transition-colors hover:opacity-90"
  >
    <span
      class="size-2 rotate-45 rounded-[2px] bg-primary shrink-0"
      aria-hidden="true"
    />
    <span
      v-if="!compact"
      class="text-sm font-semibold tracking-tight text-highlighted"
    >
      While
    </span>
  </NuxtLink>
</template>
