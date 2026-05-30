<script setup lang="ts">
const { isPaused, isLive, togglePause } = useLiveMonitoring()
</script>

<template>
  <UTooltip
    :text="isPaused
      ? 'Resume live updates'
      : 'Pause live updates while analyzing filters'"
  >
    <UButton
      size="sm"
      :color="isPaused ? 'neutral' : 'success'"
      :variant="isPaused ? 'outline' : 'subtle'"
      class="shrink-0"
      @click="togglePause()"
    >
      <span
        v-if="isLive"
        class="size-1.5 shrink-0 rounded-full bg-success animate-pulse"
        aria-hidden="true"
      />
      <UIcon
        :name="isPaused ? 'i-iconoir-play' : 'i-iconoir-pause'"
        class="size-4 shrink-0"
      />
      {{ isPaused ? 'Paused' : 'Live' }}
    </UButton>
  </UTooltip>
</template>
