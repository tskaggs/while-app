<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { EhrVendor, SupportRequestForm, WhileEnvironment } from '~/types/while'

const props = defineProps<{
  embedded?: boolean
}>()

const emit = defineEmits<{
  submitted: [key: string]
}>()

const router = useRouter()
const { submitRequest } = useSupportRequests()
const { environment } = useEnvironment()

const step = ref(0)

const schema = z.object({
  partnerName: z.string().min(2, 'Partner name is required'),
  ehrVendor: z.enum(['Epic', 'Cerner', 'Meditech', 'Athena', 'Other']),
  contactEmail: z.string().email('Valid email required'),
  targetGoLive: z.string().min(1, 'Target date required'),
  scope: z.enum(['read', 'write', 'read_write']),
  resourceTypes: z.array(z.string()).min(1, 'Select at least one resource type'),
  dataFormat: z.enum(['fhir', 'hl7', 'both']),
  environment: z.enum(['sandbox', 'live']),
  estimatedVolume: z.string().min(1, 'Volume estimate required'),
  notes: z.string().optional()
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  partnerName: '',
  ehrVendor: 'Epic' as EhrVendor,
  contactEmail: '',
  targetGoLive: '',
  scope: 'read',
  resourceTypes: ['Patient'],
  dataFormat: 'fhir',
  environment: environment.value as WhileEnvironment,
  estimatedVolume: '',
  notes: ''
})

const steps = [
  { title: 'Partner Info', icon: 'i-lucide-building-2' },
  { title: 'Integration Scope', icon: 'i-lucide-layers' },
  { title: 'Environment', icon: 'i-lucide-settings-2' },
  { title: 'Review', icon: 'i-lucide-check-circle' }
]

const ehrOptions = ['Epic', 'Cerner', 'Meditech', 'Athena', 'Other']
const scopeOptions = [
  { label: 'Read only', value: 'read' },
  { label: 'Write only', value: 'write' },
  { label: 'Read & Write', value: 'read_write' }
]
const formatOptions = [
  { label: 'FHIR R4', value: 'fhir' },
  { label: 'HL7 v2', value: 'hl7' },
  { label: 'Both', value: 'both' }
]
const resourceOptions = ['Patient', 'Observation', 'Encounter', 'DiagnosticReport', 'MedicationRequest', 'Condition']
const volumeOptions = ['< 1K/day', '1K–10K/day', '10K–100K/day', '100K+/day']

function toggleResource(type: string) {
  const current = state.resourceTypes ?? []
  if (current.includes(type)) {
    state.resourceTypes = current.filter(t => t !== type)
  } else {
    state.resourceTypes = [...current, type]
  }
}

function nextStep() {
  if (step.value < steps.length - 1) step.value++
}

function prevStep() {
  if (step.value > 0) step.value--
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const key = submitRequest(event.data as SupportRequestForm)
  if (props.embedded) {
    emit('submitted', key)
    return
  }
  await router.push({ path: '/support', query: { selected: key } })
}
</script>

<template>
  <div class="w-full space-y-6">
    <UStepper v-model="step" :items="steps" class="w-full" />

    <UCard class="w-full">
      <UForm :schema="schema" :state="state" @submit="onSubmit">
        <!-- Step 1: Partner Info -->
        <div v-show="step === 0" class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <UFormField label="Partner / Clinic Name" name="partnerName" required>
            <UInput v-model="state.partnerName" placeholder="North Valley Clinic" class="w-full" />
          </UFormField>
          <UFormField label="EHR System" name="ehrVendor" required>
            <USelectMenu
              v-model="state.ehrVendor"
              :items="ehrOptions"
              placeholder="Select EHR"
              class="w-full"
            />
          </UFormField>
          <UFormField label="IT Contact Email" name="contactEmail" required>
            <UInput
              v-model="state.contactEmail"
              type="email"
              placeholder="it@clinic.org"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Target Go-Live Date" name="targetGoLive" required>
            <UInput v-model="state.targetGoLive" type="date" class="w-full" />
          </UFormField>
        </div>

        <!-- Step 2: Integration Scope -->
        <div v-show="step === 1" class="space-y-6">
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <UFormField label="Integration Scope" name="scope" required>
              <URadioGroup v-model="state.scope" :items="scopeOptions" />
            </UFormField>
            <UFormField label="Data Format" name="dataFormat" required>
              <URadioGroup v-model="state.dataFormat" :items="formatOptions" />
            </UFormField>
          </div>
          <UFormField label="Resource Types" name="resourceTypes" required>
            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="type in resourceOptions"
                :key="type"
                :label="type"
                size="sm"
                :color="state.resourceTypes?.includes(type) ? 'primary' : 'neutral'"
                :variant="state.resourceTypes?.includes(type) ? 'soft' : 'outline'"
                @click="toggleResource(type)"
              />
            </div>
          </UFormField>
        </div>

        <!-- Step 3: Environment -->
        <div v-show="step === 2" class="space-y-4">
          <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <UFormField label="Environment" name="environment" required>
              <URadioGroup
                v-model="state.environment"
                :items="[
                  { label: 'Sandbox first (recommended)', value: 'sandbox' },
                  { label: 'Live production', value: 'live' }
                ]"
              />
            </UFormField>
            <UFormField label="Estimated Daily Volume" name="estimatedVolume" required>
              <USelectMenu
                v-model="state.estimatedVolume"
                :items="volumeOptions"
                placeholder="Select volume"
                class="w-full"
              />
            </UFormField>
          </div>
          <UFormField label="Additional Notes" name="notes">
            <UTextarea
              v-model="state.notes"
              placeholder="Any special requirements, existing VPN setup, etc."
              :rows="4"
              class="w-full"
            />
          </UFormField>
        </div>

        <!-- Step 4: Review -->
        <div v-show="step === 3">
          <dl class="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div class="flex justify-between gap-4 rounded-lg border border-default px-4 py-3 sm:block">
              <dt class="text-muted">
                Partner
              </dt>
              <dd class="font-medium text-highlighted sm:mt-1">
                {{ state.partnerName }}
              </dd>
            </div>
            <div class="flex justify-between gap-4 rounded-lg border border-default px-4 py-3 sm:block">
              <dt class="text-muted">
                EHR
              </dt>
              <dd class="font-medium text-highlighted sm:mt-1">
                {{ state.ehrVendor }}
              </dd>
            </div>
            <div class="flex justify-between gap-4 rounded-lg border border-default px-4 py-3 sm:block">
              <dt class="text-muted">
                Contact
              </dt>
              <dd class="font-medium text-highlighted sm:mt-1">
                {{ state.contactEmail }}
              </dd>
            </div>
            <div class="flex justify-between gap-4 rounded-lg border border-default px-4 py-3 sm:block">
              <dt class="text-muted">
                Go-Live
              </dt>
              <dd class="font-medium text-highlighted sm:mt-1">
                {{ state.targetGoLive }}
              </dd>
            </div>
            <div class="flex justify-between gap-4 rounded-lg border border-default px-4 py-3 sm:block">
              <dt class="text-muted">
                Scope
              </dt>
              <dd class="font-medium text-highlighted capitalize sm:mt-1">
                {{ state.scope?.replace('_', ' & ') }}
              </dd>
            </div>
            <div class="flex justify-between gap-4 rounded-lg border border-default px-4 py-3 sm:block">
              <dt class="text-muted">
                Format
              </dt>
              <dd class="font-medium text-highlighted uppercase sm:mt-1">
                {{ state.dataFormat }}
              </dd>
            </div>
            <div class="flex justify-between gap-4 rounded-lg border border-default px-4 py-3 sm:block lg:col-span-2">
              <dt class="text-muted">
                Resources
              </dt>
              <dd class="font-medium text-highlighted sm:mt-1">
                {{ state.resourceTypes?.join(', ') }}
              </dd>
            </div>
            <div class="flex justify-between gap-4 rounded-lg border border-default px-4 py-3 sm:block">
              <dt class="text-muted">
                Environment
              </dt>
              <dd class="font-medium text-highlighted capitalize sm:mt-1">
                {{ state.environment }}
              </dd>
            </div>
            <div class="flex justify-between gap-4 rounded-lg border border-default px-4 py-3 sm:block">
              <dt class="text-muted">
                Volume
              </dt>
              <dd class="font-medium text-highlighted sm:mt-1">
                {{ state.estimatedVolume }}
              </dd>
            </div>
          </dl>
        </div>

        <div class="flex justify-between mt-8">
          <UButton
            v-if="step > 0"
            label="Back"
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-left"
            @click="prevStep"
          />
          <div v-else />
          <UButton
            v-if="step < steps.length - 1"
            label="Continue"
            icon="i-lucide-arrow-right"
            trailing
            @click="nextStep"
          />
          <UButton
            v-else
            type="submit"
            label="Submit Request"
            icon="i-lucide-send"
          />
        </div>
      </UForm>
    </UCard>
  </div>
</template>
