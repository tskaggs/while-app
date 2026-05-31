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

interface CatalogField {
  sourcePath: string
  targetFhirPath: string
  label: string
  required: boolean
  description: string
}

interface SandboxProfile {
  ehrVendor: string
  dataFormat: string
  resourceTypes: string[]
}

interface ApiPayloadPreview {
  connection_id: string
  ehr_vendor: string
  data_format: string
  resource_types: string[]
  field_mappings: Array<{
    source_path: string
    target_fhir_path: string
    status: string
    is_required: boolean
  }>
}

const mappings = ref<MappingRow[]>([])
const catalog = ref<CatalogField[]>([])
const profile = ref<SandboxProfile | null>(null)
const completion = ref({ total: 0, confirmed: 0, requiredTotal: 0, requiredConfirmed: 0, complete: false })
const lastSavedAt = ref<string | null>(null)

const customSource = ref('')
const customTarget = ref('')

const mockCatalog: CatalogField[] = [
  { sourcePath: 'PID-5 (Patient Name)', targetFhirPath: 'Patient.name', label: 'Patient name', required: true, description: 'HL7 PID-5 patient name components' },
  { sourcePath: 'PID-7 (Date of Birth)', targetFhirPath: 'Patient.birthDate', label: 'Date of birth', required: true, description: 'Patient date of birth' },
  { sourcePath: 'PID-8 (Gender)', targetFhirPath: 'Patient.gender', label: 'Gender', required: true, description: 'Administrative gender' },
  { sourcePath: 'PID-3 (MRN)', targetFhirPath: 'Patient.identifier', label: 'Medical record number', required: true, description: 'Primary patient identifier' },
  { sourcePath: 'OBX-5 (Observation Value)', targetFhirPath: 'Observation.valueQuantity', label: 'Observation value', required: false, description: 'Lab or vital observation value' },
  { sourcePath: 'PV1-44 (Admit Date)', targetFhirPath: 'Encounter.period.start', label: 'Admit date', required: false, description: 'Encounter admission timestamp' }
]

const availableFields = computed(() =>
  catalog.value.filter(field =>
    !field.required
    && !mappings.value.some(m => m.sourcePath === field.sourcePath)
  )
)

function normalizeMappings(rows: MappingRow[]) {
  return rows.map((row, index) => ({
    ...row,
    sortOrder: index + 1
  }))
}

function buildApiPayloadPreview(rows: MappingRow[]): ApiPayloadPreview {
  return {
    connection_id: props.connection.id,
    ehr_vendor: profile.value?.ehrVendor ?? props.connection.ehrVendor ?? 'Other',
    data_format: profile.value?.dataFormat ?? 'fhir',
    resource_types: profile.value?.resourceTypes ?? ['Patient'],
    field_mappings: rows.map(row => ({
      source_path: row.sourcePath,
      target_fhir_path: row.targetFhirPath,
      status: row.status,
      is_required: row.isRequired
    }))
  }
}

const apiPayloadPreview = computed(() => buildApiPayloadPreview(mappings.value))

const apiPayloadJson = computed(() =>
  JSON.stringify(apiPayloadPreview.value, null, 2)
)

async function loadMappings() {
  if (config.public.mockMode) {
    catalog.value = mockCatalog
    profile.value = {
      ehrVendor: props.connection.ehrVendor,
      dataFormat: 'hl7',
      resourceTypes: ['Patient']
    }
    mappings.value = normalizeMappings([
      { sourcePath: 'PID-5 (Patient Name)', targetFhirPath: 'Patient.name', status: 'mapped', isRequired: true, sortOrder: 1 },
      { sourcePath: 'PID-7 (Date of Birth)', targetFhirPath: 'Patient.birthDate', status: 'mapped', isRequired: true, sortOrder: 2 },
      { sourcePath: 'PID-8 (Gender)', targetFhirPath: 'Patient.gender', status: 'mapped', isRequired: true, sortOrder: 3 },
      { sourcePath: 'PID-3 (MRN)', targetFhirPath: 'Patient.identifier', status: 'mapped', isRequired: true, sortOrder: 4 }
    ])
    completion.value = {
      total: mappings.value.length,
      confirmed: mappings.value.length,
      requiredTotal: 4,
      requiredConfirmed: 4,
      complete: true
    }
    ensureRequiredMappings()
    return
  }

  const data = await $fetch<{
    mappings: MappingRow[]
    catalog: CatalogField[]
    profile: SandboxProfile | null
    completion: typeof completion.value
    apiPayload: ApiPayloadPreview
  }>(`/api/connections/${props.connection.id}/mapping`)

  catalog.value = data.catalog
  profile.value = data.profile
    ? {
        ehrVendor: data.profile.ehrVendor,
        dataFormat: data.profile.dataFormat,
        resourceTypes: Array.isArray(data.profile.resourceTypes)
          ? data.profile.resourceTypes as string[]
          : ['Patient']
      }
    : null
  mappings.value = normalizeMappings(data.mappings.map(m => ({
    id: m.id,
    sourcePath: m.sourcePath,
    targetFhirPath: m.targetFhirPath,
    status: m.status,
    isRequired: m.isRequired,
    sortOrder: m.sortOrder
  })))
  completion.value = data.completion
  ensureRequiredMappings()
}

function ensureRequiredMappings() {
  const missing = catalog.value.filter(field =>
    field.required && !mappings.value.some(m => m.sourcePath === field.sourcePath)
  )
  if (!missing.length) return

  mappings.value = normalizeMappings([
    ...mappings.value,
    ...missing.map(field => ({
      sourcePath: field.sourcePath,
      targetFhirPath: field.targetFhirPath,
      status: 'mapped',
      isRequired: true,
      sortOrder: mappings.value.length + 1
    }))
  ])
}

function applySavedBundle(data: {
  mappings: MappingRow[]
  completion: typeof completion.value
}) {
  mappings.value = normalizeMappings(data.mappings.map(m => ({
    id: m.id,
    sourcePath: m.sourcePath,
    targetFhirPath: m.targetFhirPath,
    status: m.status,
    isRequired: m.isRequired,
    sortOrder: m.sortOrder
  })))
  completion.value = data.completion
  lastSavedAt.value = new Date().toLocaleString()
}

async function saveMappings() {
  saving.value = true
  try {
    const payload = normalizeMappings(mappings.value)
    const data = await $fetch<{
      mappings: MappingRow[]
      completion: typeof completion.value
      apiPayload: ApiPayloadPreview
    }>(
      `/api/connections/${props.connection.id}/mapping`,
      {
        method: 'PUT',
        body: { mappings: payload }
      }
    )
    applySavedBundle(data)
    toast.add({ title: 'Mappings saved', color: 'success' })
  } catch {
    toast.add({ title: 'Failed to save mappings', color: 'error' })
  } finally {
    saving.value = false
  }
}

function addCatalogField(field: CatalogField) {
  mappings.value = normalizeMappings([
    ...mappings.value,
    {
      sourcePath: field.sourcePath,
      targetFhirPath: field.targetFhirPath,
      status: 'review',
      isRequired: field.required,
      sortOrder: mappings.value.length + 1
    }
  ])
}

function addCustomMapping() {
  const sourcePath = customSource.value.trim()
  const targetFhirPath = customTarget.value.trim()
  if (!sourcePath || !targetFhirPath) return

  if (mappings.value.some(m => m.sourcePath === sourcePath)) {
    toast.add({ title: 'Source field already mapped', color: 'warning' })
    return
  }

  mappings.value = normalizeMappings([
    ...mappings.value,
    {
      sourcePath,
      targetFhirPath,
      status: 'review',
      isRequired: false,
      sortOrder: mappings.value.length + 1
    }
  ])
  customSource.value = ''
  customTarget.value = ''
}

function removeMapping(row: MappingRow) {
  if (row.isRequired) return
  mappings.value = normalizeMappings(
    mappings.value.filter(m => m.sourcePath !== row.sourcePath)
  )
}

async function runAiSuggest() {
  aiLoading.value = true
  try {
    const data = await $fetch<{ applied: boolean }>(
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
  const blob = new Blob([apiPayloadJson.value], { type: 'application/json' })
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
  <UCard class="while-card mt-4 overflow-hidden">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
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
      <p class="mt-1 text-sm text-muted">
        Configure field mappings for {{ connection.partnerName }}. Required fields stay mapped; optional catalog fields can be added or removed.
      </p>
    </template>

    <div class="grid grid-cols-1 gap-4 xl:grid-cols-5">
      <div class="while-card-inset overflow-hidden xl:col-span-3">
        <div class="border-b border-default px-4 py-3">
          <h4 class="text-sm font-semibold text-highlighted">
            Active mappings
          </h4>
          <p class="mt-0.5 text-xs text-muted">
            Required fields cannot be removed. Edit paths and status for each mapped item.
          </p>
        </div>
        <UTable
          :data="mappings"
          :columns="[
            { accessorKey: 'sourcePath', header: 'Source field' },
            { accessorKey: 'targetFhirPath', header: 'FHIR R4 path' },
            { accessorKey: 'status', header: 'Status' },
            { id: 'actions', header: '' }
          ]"
        >
          <template #sourcePath-cell="{ row }">
            <UInput
              v-model="row.original.sourcePath"
              class="font-mono text-xs"
              :disabled="row.original.isRequired"
            />
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
          <template #actions-cell="{ row }">
            <UTooltip :text="row.original.isRequired ? 'Required fields always stay mapped' : 'Remove from mapping'">
              <UButton
                icon="i-iconoir-minus"
                color="neutral"
                variant="ghost"
                size="xs"
                :disabled="row.original.isRequired"
                aria-label="Remove mapping"
                @click="removeMapping(row.original)"
              />
            </UTooltip>
          </template>
          <template #empty>
            <p class="py-8 text-center text-sm text-muted">
              No mappings yet. Add fields from the catalog or create a custom mapping.
            </p>
          </template>
        </UTable>
      </div>

      <div class="while-card-inset flex flex-col overflow-hidden xl:col-span-2">
        <div class="border-b border-default px-4 py-3">
          <h4 class="text-sm font-semibold text-highlighted">
            Available fields
          </h4>
          <p class="mt-0.5 text-xs text-muted">
            Optional catalog fields for {{ profile?.ehrVendor ?? connection.ehrVendor }}. Required fields are always mapped and do not appear here.
          </p>
        </div>
        <div class="max-h-80 flex-1 overflow-y-auto px-2 py-2">
          <p
            v-if="!availableFields.length"
            class="px-2 py-6 text-center text-sm text-muted"
          >
            All optional catalog fields are mapped.
          </p>
          <ul v-else class="space-y-1">
            <li
              v-for="field in availableFields"
              :key="field.sourcePath"
              class="flex items-start gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-accented/50"
            >
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-highlighted">
                  {{ field.label }}
                </p>
                <p class="mt-0.5 font-mono text-xs text-muted">
                  {{ field.sourcePath }}
                </p>
                <p class="mt-0.5 font-mono text-xs text-dimmed">
                  → {{ field.targetFhirPath }}
                </p>
              </div>
              <UButton
                icon="i-iconoir-plus"
                color="primary"
                variant="soft"
                size="xs"
                class="shrink-0"
                aria-label="Add to mapping"
                @click="addCatalogField(field)"
              />
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="while-card-inset mt-4 p-4">
      <h4 class="text-sm font-semibold text-highlighted">
        Custom field
      </h4>
      <p class="mt-1 text-xs text-muted">
        Add a source field not listed in the catalog. Confirm with your EHR vendor that the field is available for this clinic or connection before relying on it in production.
      </p>
      <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <UFormField label="Source field">
          <UInput
            v-model="customSource"
            placeholder="e.g. ZPD-1 (Custom segment)"
            class="font-mono text-xs"
          />
        </UFormField>
        <UFormField label="FHIR R4 path">
          <UInput
            v-model="customTarget"
            placeholder="e.g. Patient.extension"
            class="font-mono text-xs"
          />
        </UFormField>
      </div>
      <UButton
        class="mt-3"
        icon="i-iconoir-plus"
        size="sm"
        variant="outline"
        :disabled="!customSource.trim() || !customTarget.trim()"
        @click="addCustomMapping"
      >
        Add custom mapping
      </UButton>
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

    <div class="while-card-inset mt-4 overflow-hidden">
      <div class="border-b border-default px-4 py-3">
        <h4 class="text-sm font-semibold text-highlighted">
          API return payload
        </h4>
        <p class="mt-0.5 text-xs text-muted">
          Preview of <code class="font-mono">field_mappings</code> returned by
          <code class="font-mono">GET /v1/sandbox/catalog?connection_id=…</code>
          after you save. The preview updates as you edit; save to persist.
        </p>
        <p v-if="lastSavedAt" class="mt-1 text-xs text-success">
          Last saved {{ lastSavedAt }}
        </p>
      </div>
      <pre class="max-h-96 overflow-auto bg-default p-4 text-xs leading-relaxed text-highlighted">{{ apiPayloadJson }}</pre>
    </div>
  </UCard>
</template>
