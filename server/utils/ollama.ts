import type { CatalogField } from './ehrFieldCatalog'

interface OllamaSuggestInput {
  ehrVendor: string
  dataFormat: string
  unmapped: CatalogField[]
}

interface OllamaMappingSuggestion {
  sourcePath: string
  targetFhirPath: string
  required?: boolean
}

export async function suggestMappingsWithOllama(input: OllamaSuggestInput): Promise<OllamaMappingSuggestion[]> {
  if (!input.unmapped.length) return []

  const config = useRuntimeConfig()
  const baseUrl = config.ollamaBaseUrl || process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434'
  const model = config.ollamaModel || process.env.OLLAMA_MODEL || 'gpt-oss:120b-cloud'

  const prompt = [
    'You suggest HL7/FHIR field mappings for a healthcare integration sandbox.',
    `EHR vendor: ${input.ehrVendor}. Data format: ${input.dataFormat}.`,
    'Return JSON array only: [{ "sourcePath": "...", "targetFhirPath": "...", "required": false }]',
    'Unmapped fields:',
    JSON.stringify(input.unmapped.map(f => ({
      sourcePath: f.sourcePath,
      suggestedTarget: f.targetFhirPath,
      label: f.label
    })))
  ].join('\n')

  try {
    const res = await $fetch<{ message?: { content?: string } }>(`${baseUrl}/api/chat`, {
      method: 'POST',
      body: {
        model,
        stream: false,
        format: 'json',
        messages: [{ role: 'user', content: prompt }]
      }
    })

    const content = res.message?.content
    if (!content) return fallbackSuggestions(input.unmapped)

    const parsed = JSON.parse(content)
    const rows = Array.isArray(parsed) ? parsed : parsed.suggestions
    if (!Array.isArray(rows)) return fallbackSuggestions(input.unmapped)

    return rows
      .filter((row: OllamaMappingSuggestion) => row.sourcePath && row.targetFhirPath)
      .slice(0, 8)
  } catch {
    return fallbackSuggestions(input.unmapped)
  }
}

function fallbackSuggestions(unmapped: CatalogField[]): OllamaMappingSuggestion[] {
  return unmapped.slice(0, 4).map(field => ({
    sourcePath: field.sourcePath,
    targetFhirPath: field.targetFhirPath,
    required: field.required
  }))
}
