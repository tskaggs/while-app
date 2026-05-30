<script setup lang="ts">
defineProps<{
  curl: string
  typescript: string
}>()

const tab = ref<'curl' | 'typescript'>('curl')
const toast = useToast()

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.add({ title: 'Copied to clipboard', color: 'success' })
  } catch {
    toast.add({ title: 'Copy failed', color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-2">
    <div class="flex flex-wrap items-center gap-2">
      <UButton
        size="xs"
        :variant="tab === 'curl' ? 'solid' : 'outline'"
        @click="tab = 'curl'"
      >
        curl
      </UButton>
      <UButton
        size="xs"
        :variant="tab === 'typescript' ? 'solid' : 'outline'"
        @click="tab = 'typescript'"
      >
        TypeScript
      </UButton>
      <UButton
        icon="i-iconoir-copy"
        size="xs"
        color="neutral"
        variant="ghost"
        aria-label="Copy snippet"
        @click="copy(tab === 'curl' ? curl : typescript)"
      />
    </div>
    <pre class="text-xs overflow-auto rounded-lg border border-default p-3 bg-muted/30 max-h-64">{{ tab === 'curl' ? curl : typescript }}</pre>
  </div>
</template>
