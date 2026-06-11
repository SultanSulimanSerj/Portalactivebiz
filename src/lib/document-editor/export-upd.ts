import { generateUpdExcelBuffer, XLSX_MIME, type UpdDocumentData } from '@/lib/upd-generator'
import { uploadFile } from '@/lib/storage'
import { generateId } from '@/lib/id-generator'
import type { UpdDocumentContent } from './types'
import { prepareUpdDataForExport } from './upd-calculations'
import { validateUpdDocument } from './upd-validator'
import { buildUpdPdfFileName } from './upd-pdf-generator'
import { PDF_MIME } from '@/lib/upd-generator'
import { convertXlsxBufferToPdf } from './xlsx-to-pdf'

export type ExportFormat = 'xlsx' | 'pdf' | 'both'

export interface UpdXlsxExport {
  buffer: Buffer
  fileName: string
  fileSize: number
  mimeType: string
}

export interface UpdPdfExport {
  buffer: Buffer
  fileName: string
  fileSize: number
  mimeType: string
}

export interface UpdFullExportResult {
  data: UpdDocumentData
  xlsx?: UpdXlsxExport
  pdf?: UpdPdfExport
}

export function buildUpdFileName(documentNumber: string, documentDate: string): string {
  return `Исходящий УПД № ${documentNumber} от ${documentDate}.xlsx`
}

function validateExportData(data: ReturnType<typeof prepareUpdDataForExport>) {
  const validation = validateUpdDocument(data)
  if (!validation.valid) {
    const messages = validation.issues
      .filter((i) => i.severity === 'error')
      .map((i) => i.message)
      .join('; ')
    throw new Error(messages || 'Документ не прошёл валидацию')
  }
  return data
}

export async function exportUpdContent(
  content: UpdDocumentContent,
  format: ExportFormat = 'both'
): Promise<UpdFullExportResult> {
  const data = validateExportData(prepareUpdDataForExport(content.data))
  const result: UpdFullExportResult = { data }

  const xlsxFileName = buildUpdFileName(data.documentNumber, data.documentDate)

  if (format === 'xlsx' || format === 'both') {
    const buffer = await generateUpdExcelBuffer(data)
    result.xlsx = {
      buffer,
      fileName: xlsxFileName,
      fileSize: buffer.length,
      mimeType: XLSX_MIME,
    }
  }

  if (format === 'pdf' || format === 'both') {
    const xlsxBuffer =
      result.xlsx?.buffer ?? (await generateUpdExcelBuffer(data))
    const pdfBuffer = await convertXlsxBufferToPdf(xlsxBuffer, xlsxFileName)
    const pdfFileName = buildUpdPdfFileName(data.documentNumber, data.documentDate)
    result.pdf = {
      buffer: pdfBuffer,
      fileName: pdfFileName,
      fileSize: pdfBuffer.length,
      mimeType: PDF_MIME,
    }
    if (format === 'pdf' && !result.xlsx) {
      result.xlsx = {
        buffer: xlsxBuffer,
        fileName: xlsxFileName,
        fileSize: xlsxBuffer.length,
        mimeType: XLSX_MIME,
      }
    }
  }

  return result
}

export async function uploadUpdFile(
  companyId: string,
  fileName: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const storageKey = `documents/${companyId}/${generateId()}_${fileName}`
  await uploadFile(storageKey, buffer, mimeType)
  return storageKey
}
