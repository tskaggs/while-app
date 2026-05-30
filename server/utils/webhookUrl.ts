export function webhookReceiverPath() {
  return '/api/webhooks/while'
}

/** Built-in while-app receiver from public site URL (browser / host-native ultra-a). */
export function siteReceiverUrl(siteUrl: string) {
  return `${siteUrl.replace(/\/$/, '')}${webhookReceiverPath()}`
}

/**
 * URL ultra-a in Docker can reach on the host.
 * Maps localhost/127.0.0.1 → host.docker.internal with the same port.
 */
export function dockerReceiverUrl(siteUrl: string) {
  try {
    const base = new URL(siteUrl)
    const port = base.port || (base.protocol === 'https:' ? '443' : '80')
    const host = base.hostname === 'localhost' || base.hostname === '127.0.0.1'
      ? 'host.docker.internal'
      : base.hostname
    return `http://${host}:${port}${webhookReceiverPath()}`
  } catch {
    return siteReceiverUrl(siteUrl)
  }
}

export function isLocalhostWebhookUrl(url: string | null | undefined) {
  if (!url) return false
  try {
    const hostname = new URL(url).hostname
    return hostname === 'localhost' || hostname === '127.0.0.1'
  } catch {
    return url.includes('localhost') || url.includes('127.0.0.1')
  }
}

export function resolveProvisionWebhookUrl(webhookBaseUrl: string, overrideBase?: string) {
  const base = (overrideBase ?? webhookBaseUrl).replace(/\/$/, '')
  return `${base}${webhookReceiverPath()}`
}
