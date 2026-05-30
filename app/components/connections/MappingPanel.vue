<script setup lang="ts">
import type { Connection } from '~/types/while'

const props = defineProps<{
  connection: Connection
}>()

const config = useRuntimeConfig()
const toast = useToast()
const saving = ref(false)
const aiLoading = ref(false)

interface MappingRow {
  id?: string
  sourcePath: string
  targetFhirPath: string
  status: string
  isRequired: boolean
  sortOrder: number
}

const mappings = ref<MappingRow[]>([])
const suggestions = ref<Array<{ sourcePath: string, targetFhirPath: string, label: string }>>([])
const completion = ref({ total: 0, confirmed: 0, requiredTotal: 0, requiredConfirmed: 0, complete: false })

async function loadMappings() {
  if (config.public.mockMode) {
    mappings.value = [
      { sourcePath: 'PID-5 (Patient Name)', targetFhirPath: 'Patient.name', status: 'mapped', isRequired: true, sortOrder: 1 },
      { sourcePath: 'PID-7 (Date of Birth)', targetFhirPath: 'Patient.birthDate', status: 'mapped', isRequired: true, sortOrder: 2 }
    ]
    return
  }

  const data = await $fetch<{
    mappings: MappingRow[]
    suggestions: typeof suggestions.value
    completion: typeof completion.value
  }>(`/api/connections/${props.connection.id}/mapping`)

  mappings.value = data.mappings.map(m => ({
    id: m.id,
    sourcePath: m.sourcePath,
    targetFhirPath: m.targetFhirPath,
    status: m.status,
    isRequired: m.isRequired,
    sortOrder: m.sortOrder
  }))
  suggestions.value = data.suggestions
  completion.value = data.completion
}

async function saveMappings() {
  saving.value = true
  try {
    const data = await $fetch<{ mappings: MappingRow[], completion: typeof completion.value }>(
      `/api/connections/${props.connection.id}/mapping`,
      {
        method: 'PUT',
        body: { mappings: mappings.value }
      }
    )
    mappings.value = data.mappings.map(m => ({
      id: m.id,
      sourcePath: m.sourcePath,
      targetFhirPath: m.targetFhirPath,
      status: m.status,
      isRequired: m.isRequired,
      sortOrder: m.sortOrder
    }))
    completion.value = data.completion
    toast.add({ title: 'Mappings saved', color: 'success' })
  } catch {
    toast.add({ title: 'Failed to save mappings', color: 'error' })
  } finally {
    saving.value = false
  }
}

function addSuggestion(row: { sourcePath: string, targetFhirPath: string }) {
  mappings.value.push({
    sourcePath: row.sourcePath,
    targetFhirPath: row.targetFhirPath,
    status: 'review',
    isRequired: false,
    sortOrder: mappings.value.length + 1
  })
  suggestions.value = suggestions.value.filter(s => s.sourcePath !== row.sourcePath)
}

async function runAiSuggest() {
  aiLoading.value = true
  try {
    const data = await $fetch<{ applied: boolean, mappings?: MappingRow[] }>(
      `/api/connections/${props.connection.id}/mapping/ai-suggest`,
      { method: 'POST' }
    )
    if (data.applied) {
      await loadMappings()
      toast.add({ title: 'AI suggestions applied', color: 'success' })
    } else {
      toast.add({ title: 'No AI suggestions available', color: 'warning' })
    }
  } catch {
    toast.add({ title: 'AI suggest failed', color: 'error' })
  } finally {
    aiLoading.value = false
  }
}

function exportTemplate() {
  const payload = {
    connectionId: props.connection.id,
    partnerName: props.connection.partnerName,
    mappings: mappings.value
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${props.connection.id}-mapping.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

onMounted(loadMappings)
</script>

<template>
  <UCard class="mt-4">
    <template #header>
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <div class="flex items-center gap-2">
          <UIcon name="i-iconoir-git-compare" class="size-5 text-primary" />
          <h3 class="font-semibold text-highlighted">
            HL7 → FHIR Mapping
          </h3>
        </div>
        <div class="flex items-center gap-2">
          <UBadge :color="completion.complete ? 'success' : 'warning'" variant="subtle">
            {{ completion.requiredConfirmed }}/{{ completion.requiredTotal }} required
          </UBadge>
          <UBadge color="info" variant="subtle">
            AI-assisted
          </UBadge>
        </div>
      </div>
      <p class="text-sm text-muted mt-1">
        Configure field mappings for {{ connection.partnerName }}. Your sandbox uses these mappings to produce unified FHIR R4.
      </p>
    </template>

    <UTable
      :data="mappings"
      :columns="[
        { accessorKey: 'sourcePath', header: 'Source field' },
        { accessorKey: 'targetFhirPath', header: 'FHIR R4 path' },
        { accessorKey: 'status', header: 'Status' }
      ]"
    >
      <template #sourcePath-cell="{ row }">
        <UInput v-model="row.original.sourcePath" class="font-mono text-xs" />
      </template>
      <template #targetFhirPath-cell="{ row }">
        <UInput v-model="row.original.targetFhirPath" class="font-mono text-xs" />
      </template>
      <template #status-cell="{ row }">
        <USelectMenu
          v-model="row.original.status"
          :items="[
            { label: 'Suggested', value: 'suggested' },
            { label: 'Mapped', value: 'mapped' },
            { label: 'Review', value: 'review' }
          ]"
          value-key="value"
          size="xs"
        />
      </template>
    </UTable>

    <div v-if="suggestions.length" class="mt-4 rounded-lg border border-default p-3">
      <p class="text-sm font-medium text-highlighted mb-2">
        Suggested fields
      </p>
      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="row in suggestions"
          :key="row.sourcePath"
          size="xs"
          variant="outline"
          @click="addSuggestion(row)"
        >
          Add {{ row.label }}
        </UButton>
      </div>
    </div>

    <div class="mt-4 flex flex-wrap gap-2">
      <UButton :loading="saving" @click="saveMappings">
        Save mappings
      </UButton>
      <UButton
        label="AI Suggest Mapping"
        icon="i-iconoir-spark"
        color="neutral"
        variant="outline"
        :loading="aiLoading"
        @click="runAiSuggest"
      />
      <UButton
        label="Export Template"
        icon="i-iconoir-download"
        color="neutral"
        variant="ghost"
        @click="exportTemplate"
      />
    </div>
  </UCard>
</template>
