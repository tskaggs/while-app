import { requireMachineOrg } from '../../../../utils/authSession'
import { assertConnectionAccess } from '../../../../utils/connectionTest'
import { getConnectionMappingBundle, saveConnectionMappings } from '../../../../utils/connectionMapping'
import { suggestMappingsWithOllama } from '../../../../utils/ollama'

export default defineEventHandler(async (event) => {
  const connectionId = getRouterParam(event, 'id')
  if (!connectionId) {
    throw createError({ statusCode: 400, message: 'Connection id is required' })
  }

  const { machineOrgId } = await requireMachineOrg(event)
  const connection = await assertConnectionAccess(machineOrgId, connectionId)
  const bundle = await getConnectionMappingBundle(machineOrgId, connectionId)

  const suggestions = await suggestMappingsWithOllama({
    ehrVendor: bundle.profile?.ehrVendor ?? connection.ehrVendor ?? 'Other',
    dataFormat: bundle.profile?.dataFormat ?? 'fhir',
    unmapped: bundle.suggestions.slice(0, 8)
  })

  if (!suggestions.length) {
    return { suggestions: [], applied: false }
  }

  const merged = [
    ...bundle.mappings.map(m => ({
      sourcePath: m.sourcePath,
      targetFhirPath: m.targetFhirPath,
      status: m.status,
      isRequired: m.isRequired,
      sortOrder: m.sortOrder
    })),
    ...suggestions.map((s, index) => ({
      sourcePath: s.sourcePath,
      targetFhirPath: s.targetFhirPath,
      status: 'review',
      isRequired: s.required ?? false,
      sortOrder: bundle.mappings.length + index + 1
    }))
  ]

  const saved = await saveConnectionMappings(machineOrgId, connectionId, merged)
  return { suggestions, applied: true, mappings: saved.mappings }
})
