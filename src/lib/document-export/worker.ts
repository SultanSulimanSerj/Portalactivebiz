import { Worker } from 'bullmq'
import IORedis from 'ioredis'
import { DOCUMENT_EXPORT_QUEUE_NAME, type DocumentExportQueuePayload } from './types'
import { processDocumentExportJob } from './process-export-job'
import { recoverStaleExportJobs } from './export-job-service'
import { closeDocumentExportQueue } from './queue'

const WORKER_CONCURRENCY = parseInt(
  process.env.DOCUMENT_EXPORT_WORKER_CONCURRENCY || '3',
  10
)

let exportWorker: Worker<DocumentExportQueuePayload> | null = null

function createWorkerRedis(): IORedis {
  const url = process.env.REDIS_URL
  if (!url) {
    throw new Error('REDIS_URL обязателен для воркера экспорта документов')
  }
  return new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })
}

export async function startDocumentExportWorker(): Promise<Worker<DocumentExportQueuePayload>> {
  if (exportWorker) {
    return exportWorker
  }

  const recovered = await recoverStaleExportJobs()
  if (recovered > 0) {
    console.log(`[document-export] recovered ${recovered} stale job(s)`)
  }

  const connection = createWorkerRedis()

  exportWorker = new Worker<DocumentExportQueuePayload>(
    DOCUMENT_EXPORT_QUEUE_NAME,
    async (bullJob) => {
      const { jobId } = bullJob.data
      const maxAttempts = bullJob.opts.attempts ?? 1
      const isFinalAttempt = bullJob.attemptsMade + 1 >= maxAttempts
      await processDocumentExportJob(jobId, { isFinalAttempt })
    },
    {
      connection,
      concurrency: WORKER_CONCURRENCY,
      lockDuration: 120_000,
      stalledInterval: 60_000,
    }
  )

  exportWorker.on('completed', (job) => {
    console.log(`[document-export] completed ${job.id}`)
  })

  exportWorker.on('failed', (job, err) => {
    console.error(`[document-export] failed ${job?.id}:`, err.message)
  })

  exportWorker.on('error', (err) => {
    console.error('[document-export] worker error:', err)
  })

  const shutdown = async (signal: string) => {
    console.log(`[document-export] ${signal}, shutting down worker…`)
    await stopDocumentExportWorker()
    process.exit(0)
  }

  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))

  console.log(
    `[document-export] worker started (concurrency=${WORKER_CONCURRENCY})`
  )

  return exportWorker
}

export async function stopDocumentExportWorker(): Promise<void> {
  if (exportWorker) {
    await exportWorker.close()
    exportWorker = null
  }
  await closeDocumentExportQueue()
}
