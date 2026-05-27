<script setup lang="ts">
const router = useRouter()

const options = [
  {
    title: 'Support Ticket',
    description: 'Get help with billing, a connection issue, or a general question.',
    icon: 'i-iconoir-headset',
    to: '/support/ticket'
  },
  {
    title: 'New Connection',
    description: 'Onboard a new healthcare partner with WireGuard setup, EHR mapping, and compliance review.',
    icon: 'i-iconoir-network',
    to: '/support/new-connection'
  }
] as const
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <button
        v-for="option in options"
        :key="option.to"
        type="button"
        class="rounded-lg border border-default p-6 text-left transition-colors hover:bg-elevated/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        @click="router.push(option.to)"
      >
        <div class="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 ring ring-inset ring-primary/25">
          <UIcon :name="option.icon" class="size-6 text-primary" />
        </div>
        <h3 class="mt-4 font-semibold text-highlighted">
          {{ option.title }}
        </h3>
        <p class="mt-2 text-sm text-muted">
          {{ option.description }}
        </p>
      </button>
    </div>
  </div>
</template>
