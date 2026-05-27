<script setup lang="ts">
defineProps<{
  compact?: boolean
}>()
</script>

<template>
  <NuxtLink
    to="/"
    class="inline-flex rounded-md px-1 py-1 transition-opacity hover:opacity-90"
    aria-label="While home"
  >
    <span
      class="inline-flex flex-col items-stretch"
      :class="compact ? 'gap-0.5' : 'gap-1'"
    >
      <span
        class="font-instrument-serif leading-none text-highlighted dark:text-white"
        :class="compact ? 'text-lg' : 'text-[1.375rem]'"
      >
        While
      </span>
      <span
        class="while-logo-line block shrink-0 rounded-sm"
        :class="compact ? 'h-0.5' : 'h-[3px]'"
        aria-hidden="true"
      />
    </span>
  </NuxtLink>
</template>
