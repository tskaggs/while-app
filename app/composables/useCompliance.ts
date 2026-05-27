import { complianceData } from '~/data/compliance'

export function useCompliance() {
  const compliance = ref(complianceData)

  return { compliance }
}
