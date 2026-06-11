import type { UpdMergedLineItem } from './estimate-merge'
import { renderUpdXlsx } from './document-renderer/upd/upd-xlsx-renderer'

export interface UpdParty {
  name: string
  legalName: string
  inn: string
  kpp?: string
  address: string
  directorName?: string
  directorPosition?: string
}

export interface UpdDocumentData {
  documentNumber: string
  documentDate: string
  status: 1 | 2
  contractNumber?: string
  contractDate?: string
  seller: UpdParty
  buyer: UpdParty
  projectName: string
  estimateNames: string[]
  items: UpdMergedLineItem[]
  totalWithoutVat: number
  totalVat: number
  totalWithVat: number
  hasVat: boolean
  basisText?: string
  paymentDocText?: string
  /** Дата отгрузки (ДД.ММ.ГГГГ), по умолчанию = documentDate */
  shipDate?: string
  signatorySeller?: string
  signatoryBuyer?: string
}

export const PDF_MIME = 'application/pdf'

export const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export async function generateUpdExcelBuffer(data: UpdDocumentData): Promise<Buffer> {
  return renderUpdXlsx(data)
}

export function buildUpdDocumentData(
  project: {
    name: string
    contractNumber?: string | null
    contractDate?: Date | string | null
    clientName?: string | null
    clientLegalName?: string | null
    clientInn?: string | null
    clientKpp?: string | null
    clientLegalAddress?: string | null
    clientActualAddress?: string | null
    company?: {
      name?: string | null
      legalName?: string | null
      inn?: string | null
      kpp?: string | null
      legalAddress?: string | null
      address?: string | null
      directorName?: string | null
      directorPosition?: string | null
    } | null
  },
  merged: {
    items: UpdMergedLineItem[]
    estimateNames: string[]
    totalWithoutVat: number
    totalVat: number
    totalWithVat: number
    hasVat: boolean
  },
  documentNumber: string,
  documentDate: Date,
  status: 1 | 2 = 2,
  options?: {
    basisText?: string
    stageNames?: string[]
  }
): UpdDocumentData {
  const dateStr = documentDate.toLocaleDateString('ru-RU')
  const contractDate = project.contractDate
    ? new Date(project.contractDate).toLocaleDateString('ru-RU')
    : undefined

  let basisText = options?.basisText
  if (!basisText && options?.stageNames?.length) {
    basisText = `Этапы: ${options.stageNames.join(', ')}. ${project.contractNumber ? `Договор № ${project.contractNumber}` : project.name}`
  }

  return {
    documentNumber,
    documentDate: dateStr,
    status,
    contractNumber: project.contractNumber || undefined,
    contractDate,
    seller: {
      name: project.company?.name || '',
      legalName: project.company?.legalName || project.company?.name || '',
      inn: project.company?.inn || '',
      kpp: project.company?.kpp || undefined,
      address: project.company?.legalAddress || project.company?.address || '',
      directorName: project.company?.directorName || undefined,
      directorPosition: project.company?.directorPosition || undefined,
    },
    buyer: {
      name: project.clientName || '',
      legalName: project.clientLegalName || project.clientName || '',
      inn: project.clientInn || '',
      kpp: project.clientKpp || undefined,
      address: project.clientLegalAddress || project.clientActualAddress || '',
    },
    projectName: project.name,
    estimateNames: merged.estimateNames,
    items: merged.items,
    totalWithoutVat: merged.totalWithoutVat,
    totalVat: merged.totalVat,
    totalWithVat: merged.totalWithVat,
    hasVat: merged.hasVat,
    basisText,
    shipDate: dateStr,
    signatorySeller: project.company?.directorName || undefined,
  }
}
