type JobHandler<T> = () => Promise<T>

interface QueuedJob<T> {
  handler: JobHandler<T>
  resolve: (value: T) => void
  reject: (reason: unknown) => void
}

const queue: QueuedJob<unknown>[] = []
let activeJobs = 0
const MAX_CONCURRENT = parseInt(process.env.JOB_QUEUE_CONCURRENCY || '2', 10)

function processQueue() {
  while (activeJobs < MAX_CONCURRENT && queue.length > 0) {
    const job = queue.shift()
    if (!job) break
    activeJobs += 1
    job
      .handler()
      .then(job.resolve)
      .catch(job.reject)
      .finally(() => {
        activeJobs -= 1
        processQueue()
      })
  }
}

/**
 * Simple in-process job queue for light tasks.
 * Экспорт УПД — отдельная production-очередь: src/lib/document-export/ (BullMQ + Redis).
 */
export function enqueueJob<T>(handler: JobHandler<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    queue.push({ handler, resolve: resolve as (value: unknown) => void, reject })
    processQueue()
  })
}

export function getQueueStats() {
  return { pending: queue.length, active: activeJobs }
}
