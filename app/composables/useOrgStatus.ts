export interface OrgStatusResponse {
  onboardingComplete: boolean
}

export function getFetchErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  if ('statusCode' in error && typeof error.statusCode === 'number') {
    return error.statusCode
  }
  if ('status' in error && typeof error.status === 'number') {
    return error.status
  }
  return undefined
}

/** Cookie-aware org status fetch for middleware and setup code. */
export async function fetchOrgStatus(): Promise<OrgStatusResponse> {
  const requestFetch = useRequestFetch()
  return requestFetch<OrgStatusResponse>('/api/org/status')
}

export function useOrgStatus() {
  return useAsyncData('org-status', () => fetchOrgStatus())
}
