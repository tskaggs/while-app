<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()
</script>

<template>
  <NuxtLink
    to="/"
    class="flex items-center rounded-md px-2 py-2 transition-colors hover:bg-elevated/60"
    :class="collapsed ? 'justify-center' : ''"
  >
    <span
      v-if="collapsed"
      class="font-serif text-xl leading-none text-highlighted"
    >
      W
    </span>

    <span v-else class="inline-flex flex-col gap-1.5">
      <span class="font-serif text-[1.35rem] leading-none tracking-tight text-highlighted">
        While
      </span>
      <span
        class="h-px w-11 rounded-full while-logo-underline"
      />
    </span>
  </NuxtLink>
</template>
