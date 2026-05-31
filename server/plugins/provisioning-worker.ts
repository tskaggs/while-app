import { processQueuedJobs } from '../utils/provisioningWorker'

let timer: ReturnType<typeof setInterval> | null = null

export default defineNitroPlugin(() => {
  if (timer) return

  const intervalMs = Number(process.env.PROVISIONING_POLL_MS || 3000)

  timer = setInterval(() => {
    processQueuedJobs(3).catch((error) => {
      console.error('[provisioning-worker]', error)
    })
  }, intervalMs)

  processQueuedJobs(3).catch(() => {})
})
