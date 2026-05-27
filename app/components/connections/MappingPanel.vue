<script setup lang="ts">
import type { Connection } from '~/types/while'

defineProps<{
  connection: Connection
}>()

const mappings = [
  { hl7: 'PID-5 (Patient Name)', fhir: 'Patient.name', status: 'mapped' },
  { hl7: 'PID-7 (Date of Birth)', fhir: 'Patient.birthDate', status: 'mapped' },
  { hl7: 'PID-8 (Gender)', fhir: 'Patient.gender', status: 'mapped' },
  { hl7: 'PID-3 (MRN)', fhir: 'Patient.identifier', status: 'mapped' },
  { hl7: 'OBX-5 (Observation Value)', fhir: 'Observation.valueQuantity', status: 'review' },
  { hl7: 'PV1-44 (Admit Date)', fhir: 'Encounter.period.start', status: 'mapped' }
]
</script>

<template>
  <UCard class="mt-4">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-git-compare-arrows" class="size-5 text-primary" />
          <h3 class="font-semibold text-highlighted">HL7 → FHIR Mapping</h3>
        </div>
        <UBadge color="info" variant="subtle">AI-assisted</UBadge>
      </div>
      <p class="text-sm text-muted mt-1">
        Field mappings for {{ connection.partnerName }}. AI mapping assistant coming in Phase 2.
      </p>
    </template>

    <UTable
      :data="mappings"
      :columns="[
        { accessorKey: 'hl7', header: 'HL7 Segment' },
        { accessorKey: 'fhir', header: 'FHIR R4 Path' },
        { accessorKey: 'status', header: 'Status' }
      ]"
    >
      <template #hl7-cell="{ row }">
        <code class="text-xs">{{ row.original.hl7 }}</code>
      </template>
      <template #fhir-cell="{ row }">
        <code class="text-xs text-primary">{{ row.original.fhir }}</code>
      </template>
      <template #status-cell="{ row }">
        <UBadge
          :color="row.original.status === 'mapped' ? 'success' : 'warning'"
          variant="subtle"
          class="capitalize"
        >
          {{ row.original.status }}
        </UBadge>
      </template>
    </UTable>

    <div class="mt-4 flex gap-2">
      <UButton label="AI Suggest Mapping" icon="i-lucide-sparkles" color="neutral" variant="outline" disabled />
      <UButton label="Export Template" icon="i-lucide-download" color="neutral" variant="ghost" disabled />
    </div>
  </UCard>
</template>
