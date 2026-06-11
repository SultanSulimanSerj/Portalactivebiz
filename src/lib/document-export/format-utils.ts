import type { ExportFormat } from '@/lib/document-editor/export-upd'

const PLACEHOLDER_FILE = 'draft-placeholder.txt'

/** Активная задача с format=both покрывает любой запрос; иначе форматы должны совпадать. */
export function exportJobCoversFormat(
  jobFormat: ExportFormat,
  requestedFormat: ExportFormat
): boolean {
  if (jobFormat === 'both') return true
  return jobFormat === requestedFormat
}

export function canUseCachedExportForFormat(
  document: {
    exportContentHash: string | null
    hasUnpublishedChanges: boolean
    lastExportedAt: Date | null
    filePath: string
    fileSize: number
    pdfFilePath: string | null
    pdfFileSize: number | null
  },
  format: ExportFormat,
  contentHash: string
): boolean {
  if (document.exportContentHash !== contentHash) return false

  const needsXlsx = format === 'xlsx' || format === 'both'
  const needsPdf = format === 'pdf' || format === 'both'

  if (needsXlsx) {
    if (
      !document.lastExportedAt ||
      document.filePath === PLACEHOLDER_FILE ||
      document.fileSize <= 0
    ) {
      return false
    }
  }

  if (needsPdf) {
    if (!document.pdfFilePath || (document.pdfFileSize ?? 0) <= 0) {
      return false
    }
  }

  return true
}

export function computeHasUnpublishedChangesAfterExport(
  format: ExportFormat,
  document: {
    filePath: string
    pdfFilePath: string | null
  }
): boolean {
  const PLACEHOLDER = 'draft-placeholder.txt'
  const regeneratedPdf = format === 'pdf' || format === 'both'
  const regeneratedXlsx = format === 'xlsx' || format === 'both'
  const hasStalePdf = Boolean(document.pdfFilePath) && !regeneratedPdf
  const hasStaleXlsx = document.filePath !== PLACEHOLDER && !regeneratedXlsx
  return hasStalePdf || hasStaleXlsx
}
