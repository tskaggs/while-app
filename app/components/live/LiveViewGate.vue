<script setup lang="ts">
import type { Connection } from '~/types/while'

const props = defineProps<{
  connection?: Connection
}>()

const { isLive, isLiveActivated, hasActivatedLiveConnections } = useConnections()

const showEnvironmentGate = computed(() =>
  isLive.value && !props.connection && !hasActivatedLiveConnections.value
)

const showConnectionGate = computed(() =>
  props.connection && isLive.value && !isLiveActivated(props.connection)
)
</script>

<template>
  <LiveActivationRequired
    v-if="showEnvironmentGate"
    variant="environment"
  />

  <LiveActivationRequired
    v-else-if="showConnectionGate"
    :connection="connection"
    variant="connection"
  />

  <template v-else>
    <LiveActivationBanner v-if="isLive && !connection" class="mb-6" />
    <slot />
  </template>
</template>
