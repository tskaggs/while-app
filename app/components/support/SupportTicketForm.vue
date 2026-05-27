<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { SupportTicketCategory, SupportTicketForm } from '~/types/while'

const router = useRouter()
const { connections } = useConnections()
const { submitTicket } = useSupportRequests()

const schema = z.object({
  category: z.enum(['general', 'billing', 'connection']),
  connectionId: z.string().optional(),
  message: z.string().min(10, 'Please enter at least 10 characters')
}).superRefine((data, ctx) => {
  if (data.category === 'connection' && !data.connectionId) {
    ctx.addIssue({
      code: 'custom',
      path: ['connectionId'],
      message: 'Select a connection'
    })
  }
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  category: 'general',
  connectionId: undefined,
  message: ''
})

const categoryOptions = [
  { label: 'General', value: 'general' as SupportTicketCategory },
  { label: 'Billing', value: 'billing' as SupportTicketCategory },
  { label: 'Connection', value: 'connection' as SupportTicketCategory }
]

const connectionOptions = computed(() =>
  connections.value.map(connection => ({
    label: connection.partnerName,
    value: connection.id
  }))
)

watch(() => state.category, (category) => {
  if (category !== 'connection') state.connectionId = undefined
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  submitTicket(event.data as SupportTicketForm)
  await router.push('/')
}
</script>

<template>
  <UCard class="w-full">
    <UForm :schema="schema" :state="state" class="space-y-6" @submit="onSubmit">
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UFormField label="Request Type" name="category" required>
          <USelectMenu
            v-model="state.category"
            :items="categoryOptions"
            value-key="value"
            placeholder="Select request type"
            class="w-full"
          />
        </UFormField>

        <UFormField
          v-if="state.category === 'connection'"
          label="Connection"
          name="connectionId"
          required
        >
          <USelectMenu
            v-model="state.connectionId"
            :items="connectionOptions"
            value-key="value"
            placeholder="Select connection"
            class="w-full"
          />
        </UFormField>
      </div>

      <UFormField label="Message" name="message" required>
        <UTextarea
          v-model="state.message"
          placeholder="Describe your issue or question..."
          :rows="8"
          class="w-full"
        />
      </UFormField>

      <div class="flex justify-end pt-2">
        <UButton type="submit" label="Submit Ticket" icon="i-lucide-send" />
      </div>
    </UForm>
  </UCard>
</template>
