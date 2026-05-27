<script setup lang="ts">
import type { WhileEnvironment } from '~/types/while'

const { environment, setEnvironment } = useEnvironment()

const options = [
  { label: 'Sandbox', value: 'sandbox' as WhileEnvironment, icon: 'i-lucide-flask-conical' },
  { label: 'Live', value: 'live' as WhileEnvironment, icon: 'i-lucide-shield-check' }
]
</script>

<template>
  <div class="flex items-center rounded-lg border border-default bg-accented/60 p-0.5">
    <UButton
      v-for="option in options"
      :key="option.value"
      :icon="option.icon"
      :label="option.label"
      size="xs"
      :color="environment === option.value ? (option.value === 'sandbox' ? 'warning' : 'success') : 'neutral'"
      :variant="environment === option.value ? 'soft' : 'ghost'"
      class="rounded-md"
      @click="setEnvironment(option.value)"
    />
  </div>
</template>
