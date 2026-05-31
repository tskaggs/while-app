<script setup lang="ts">
const props = defineProps<{
  method: 'GET' | 'POST'
  title: string
  description: string
  curl: string
  typescript: string
  runLabel?: string
  loading?: boolean
  disabled?: boolean
  status?: number | null
  response?: unknown
  error?: string | null
}>()

defineEmits<{
  run: []
}>()

const methodColor = computed(() => (props.method === 'GET' ? 'info' : 'warning'))
</script>

<template>
  <UCard class="while-card overflow-hidden">
    <template #header>
      <div class="flex flex-wrap items-start gap-3">
        <UBadge :color="methodColor" variant="subtle" class="font-mono shrink-0">
          {{ method }}
        </UBadge>
        <div class="min-w-0 flex-1">
          <h3 class="font-semibold text-highlighted font-mono text-sm">
            {{ title }}
          </h3>
          <p class="text-sm text-muted mt-1">
            {{ description }}
          </p>
        </div>
      </div>
    </template>

    <ConnectionsTestCodeSnippetTabs :curl="curl" :typescript="typescript" />

    <div class="mt-4 flex flex-wrap items-center gap-3">
      <UButton
        :loading="loading"
        :disabled="disabled"
        icon="i-iconoir-play-solid"
        @click="$emit('run')"
      >
        {{ runLabel ?? 'Run test' }}
      </UButton>
      <p v-if="disabled" class="text-xs text-muted">
        Paste your sandbox API key above to run live tests.
      </p>
    </div>

    <div v-if="error" class="mt-4">
      <UAlert color="error" variant="subtle" :title="error" />
    </div>

    <div v-else-if="status != null" class="mt-4 space-y-2">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-highlighted">Response</span>
        <UBadge
          :color="status >= 200 && status < 300 ? 'success' : 'error'"
          variant="subtle"
          class="font-mono"
        >
          {{ status }}
        </UBadge>
      </div>
      <pre class="while-card-inset max-h-80 overflow-auto p-3 text-xs">{{ JSON.stringify(response, null, 2) }}</pre>
    </div>
  </UCard>
</template>
