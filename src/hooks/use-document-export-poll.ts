'use client'

import { useCallback, useRef } from 'react'

export type ExportJobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface ExportJobState {
  id: string
  status: ExportJobStatus
  errorMessage?: string | null
}

interface PollExportJobResult {
  job: ExportJobState
  document?: unknown
}

const POLL_INTERVAL_MS = 1500
const POLL_TIMEOUT_MS = 300_000

export function useDocumentExportPoll() {
  const abortRef = useRef(false)

  const pollExportJob = useCallback(
    async (
      pollUrl: string,
      onStatus?: (job: ExportJobState) => void
    ): Promise<PollExportJobResult> => {
      abortRef.current = false
      const started = Date.now()

      while (!abortRef.current) {
        const res = await fetch(pollUrl)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Не удалось получить статус экспорта')
        }

        const data = await res.json()
        const job = data.job as ExportJobState
        onStatus?.(job)

        if (job.status === 'COMPLETED') {
          return { job, document: data.document }
        }

        if (job.status === 'FAILED') {
          throw new Error(job.errorMessage || 'Ошибка формирования файлов')
        }

        if (Date.now() - started > POLL_TIMEOUT_MS) {
          throw new Error('Превышено время ожидания экспорта. Попробуйте позже.')
        }

        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
      }

      throw new Error('Экспорт отменён')
    },
    []
  )

  const cancelPoll = useCallback(() => {
    abortRef.current = true
  }, [])

  return { pollExportJob, cancelPoll }
}
