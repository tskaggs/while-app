<script setup lang="ts">
defineProps<{
  title?: string
}>()

const route = useRoute()
const { canGoBack, goBack } = useBackNavigation()

const showBack = computed(() => canGoBack.value && route.path !== '/')
</script>

<template>
  <div class="flex items-center gap-3 min-w-0">
    <UButton
      v-if="showBack"
      icon="i-iconoir-arrow-left"
      color="neutral"
      variant="ghost"
      size="sm"
      aria-label="Go back"
      @click="goBack"
    />
    <div class="flex items-center gap-3 min-w-0">
      <slot>
        <span class="text-xl font-semibold tracking-tight text-highlighted">{{ title }}</span>
      </slot>
    </div>
  </div>
</template>
