import { uploadFile } from '@/lib/storage'
import { generateId } from '@/lib/id-generator'
import { renderCommercialOfferDocx, renderContractDocx } from '@/lib/document-renderer/docx-renderer'
import type { CommercialOfferDocumentContent, ContractDocumentContent } from './types'

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export interface DocxExportResult {
  buffer: Buffer
  fileName: string
  fileSize: number
  mimeType: string
}

export async function exportCommercialOfferContent(
  content: CommercialOfferDocumentContent
): Promise<DocxExportResult> {
  const buffer = await renderCommercialOfferDocx(content.data)
  const fileName = `КП_№${content.data.offerNumber}.docx`
  return { buffer, fileName, fileSize: buffer.length, mimeType: DOCX_MIME }
}

export async function exportContractContent(
  content: ContractDocumentContent
): Promise<DocxExportResult> {
  const buffer = await renderContractDocx(content.data)
  const fileName = `Договор_подряда_№${content.data.contractNumber}.docx`
  return { buffer, fileName, fileSize: buffer.length, mimeType: DOCX_MIME }
}

export async function uploadDocumentFile(
  companyId: string,
  fileName: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const storageKey = `documents/${companyId}/${generateId()}_${fileName}`
  await uploadFile(storageKey, buffer, mimeType)
  return storageKey
}
