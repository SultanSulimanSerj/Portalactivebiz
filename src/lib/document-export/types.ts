import type { ExportFormat } from '@/lib/document-editor/export-upd'

export const DOCUMENT_EXPORT_QUEUE_NAME = 'document-export'

export interface DocumentExportQueuePayload {
  jobId: string
}

export interface EnqueueExportOptions {
  publish?: boolean
  comment?: string
  format?: ExportFormat
}

export interface ExportJobPublicView {
  id: string
  documentId: string
  format: ExportFormat
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  errorMessage: string | null
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  cached?: boolean
}

export type EnqueueExportResult =
  | { kind: 'cached'; document: unknown }
  | { kind: 'queued'; job: ExportJobPublicView }
  | { kind: 'existing'; job: ExportJobPublicView }
