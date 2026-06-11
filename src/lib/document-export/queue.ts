import { Queue } from 'bullmq'
import IORedis from 'ioredis'
import {
  DOCUMENT_EXPORT_QUEUE_NAME,
  type DocumentExportQueuePayload,
} from './types'

const QUEUE_ATTEMPTS = parseInt(process.env.DOCUMENT_EXPORT_QUEUE_ATTEMPTS || '3', 10)
const QUEUE_BACKOFF_MS = parseInt(process.env.DOCUMENT_EXPORT_QUEUE_BACKOFF_MS || '5000', 10)

let exportQueue: Queue<DocumentExportQueuePayload> | null = null
let queueRedis: IORedis | null = null

export function isExportQueueConfigured(): boolean {
  return Boolean(process.env.REDIS_URL)
}

function createRedisClient(): IORedis {
  const url = process.env.REDIS_URL
  if (!url) {
    throw new Error('REDIS_URL обязателен для очереди экспорта документов')
  }
  return new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })
}

export function getQueueRedis(): IORedis {
  if (!queueRedis) {
    queueRedis = createRedisClient()
  }
  return queueRedis
}

export function getDocumentExportQueue(): Queue<DocumentExportQueuePayload> {
  if (!exportQueue) {
    exportQueue = new Queue<DocumentExportQueuePayload>(DOCUMENT_EXPORT_QUEUE_NAME, {
      connection: getQueueRedis(),
      defaultJobOptions: {
        attempts: QUEUE_ATTEMPTS,
        backoff: { type: 'exponential', delay: QUEUE_BACKOFF_MS },
        removeOnComplete: { count: 5000 },
        removeOnFail: { count: 1000 },
      },
    })
  }
  return exportQueue
}

export async function addDocumentExportToQueue(
  jobId: string,
  options?: { priority?: number }
): Promise<string> {
  const queue = getDocumentExportQueue()
  const bullJob = await queue.add(
    'export',
    { jobId },
    {
      jobId: `doc-export-${jobId}`,
      priority: options?.priority,
    }
  )
  return bullJob.id ?? jobId
}

export async function closeDocumentExportQueue(): Promise<void> {
  if (exportQueue) {
    await exportQueue.close()
    exportQueue = null
  }
  if (queueRedis) {
    await queueRedis.quit()
    queueRedis = null
  }
}
