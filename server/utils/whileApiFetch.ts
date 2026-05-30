const CONTROL_PLANE_HINT =
  'Start ultra-a with `cd ultra-a && docker compose up` (API on http://localhost:8000).'

export async function fetchWhileApi(url: string, init?: RequestInit) {
  try {
    return await fetch(url, init)
  } catch (error) {
    const cause = error as { code?: string, cause?: { code?: string } }
    const code = cause.code ?? cause.cause?.code
    if (code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
      throw createError({
        statusCode: 503,
        message: `While control plane is unreachable at ${url}. ${CONTROL_PLANE_HINT}`
      })
    }

    throw createError({
      statusCode: 502,
      message: error instanceof Error ? error.message : 'Control plane request failed'
    })
  }
}
