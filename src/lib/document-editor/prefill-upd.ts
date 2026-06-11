import { prisma } from '@/lib/prisma'
import { buildUpdDocumentData } from '@/lib/upd-generator'
import type { UpdDocumentContent } from './types'
import { DOCUMENT_CONTENT_SCHEMA_VERSION, buildSourceMeta, isContractContent, isInvoiceContent } from './types'
import { applyCalculationsToUpdData } from './upd-calculations'
import { lineItemsToUpdMergedItems } from './document-line-items'
import { buildPartiesFromProject } from './prefill-fns-common'
import { buildInvoicePaymentReference } from '@/lib/document-renderer/upd/upd-cell-map'

export interface CreateUpdDraftParams {
  projectId: string
  companyId: string
  creatorId: string
  invoiceDocumentId: string
  contractDocumentId?: string
  documentNumber?: string | null
  updStatus?: 1 | 2
  documentDate?: Date
  parentDocumentId?: string
}

async function loadInvoiceDocument(invoiceDocumentId: string, projectId: string, companyId: string) {
  const invoiceDoc = await prisma.document.findFirst({
    where: {
      id: invoiceDocumentId,
      projectId,
      category: 'INVOICE',
      OR: [{ companyId }, { companyId: null, creator: { companyId } }],
    },
  })

  if (!invoiceDoc?.contentJson) {
    throw new Error('Счёт не найден или не содержит данных для УПД')
  }

  if (!isInvoiceContent(invoiceDoc.contentJson)) {
    throw new Error('Выбранный документ не является счётом на оплату')
  }

  return { doc: invoiceDoc, content: invoiceDoc.contentJson }
}

async function loadContractBasis(
  contractDocumentId: string | undefined,
  projectId: string,
  companyId: string
): Promise<string | undefined> {
  if (!contractDocumentId) return undefined

  const contractDoc = await prisma.document.findFirst({
    where: {
      id: contractDocumentId,
      projectId,
      category: 'CONTRACT',
      OR: [{ companyId }, { companyId: null, creator: { companyId } }],
    },
  })

  if (!contractDoc?.contentJson || !isContractContent(contractDoc.contentJson)) {
    return undefined
  }

  const { contractNumber, contractDate } = contractDoc.contentJson.data
  if (!contractNumber) return undefined
  return contractDate
    ? `Договор № ${contractNumber} от ${contractDate}`
    : `Договор № ${contractNumber}`
}

export async function buildUpdDraftContent(
  params: CreateUpdDraftParams
): Promise<{
  content: UpdDocumentContent
  sourceMeta: ReturnType<typeof buildSourceMeta>
  documentNumber: string
}> {
  const {
    projectId,
    companyId,
    invoiceDocumentId,
    contractDocumentId,
    documentNumber,
    updStatus = 2,
    documentDate = new Date(),
  } = params

  if (!invoiceDocumentId?.trim()) {
    throw new Error('Для УПД необходимо выбрать счёт-основание')
  }

  if (!documentNumber?.trim()) {
    throw new Error('Номер документа не задан')
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { company: true },
  })

  if (!project) throw new Error('Проект не найден')
  if (project.companyId !== companyId) throw new Error('Недостаточно прав')

  const { content: invoiceContent } = await loadInvoiceDocument(
    invoiceDocumentId,
    projectId,
    companyId
  )
  const invoiceData = invoiceContent.data

  const items = lineItemsToUpdMergedItems(invoiceData.items)
  const merged = {
    items,
    estimateNames: [],
    estimateIds: [] as string[],
    totalWithoutVat: invoiceData.totals.totalWithoutVat,
    totalVat: invoiceData.totals.totalVat,
    totalWithVat: invoiceData.totals.totalWithVat,
    hasVat: invoiceData.totals.hasVat,
  }

  const contractBasis = await loadContractBasis(contractDocumentId, projectId, companyId)
  const invoiceReference = buildInvoicePaymentReference(
    invoiceData.documentNumber,
    invoiceData.documentDate
  )

  const dateStr = documentDate.toLocaleDateString('ru-RU')
  const rawData = buildUpdDocumentData(
    project,
    merged,
    documentNumber,
    documentDate,
    updStatus,
    { basisText: contractBasis ?? invoiceReference }
  )

  rawData.shipDate = dateStr
  rawData.paymentDocText = invoiceReference
  rawData.basisText = contractBasis ?? invoiceReference

  if (invoiceData.seller?.inn) {
    rawData.seller = {
      name: invoiceData.seller.name,
      legalName: invoiceData.seller.legalName,
      inn: invoiceData.seller.inn,
      kpp: invoiceData.seller.kpp,
      address: invoiceData.seller.address,
      directorName: invoiceData.seller.directorName,
      directorPosition: invoiceData.seller.directorPosition,
    }
  } else {
    const { seller } = buildPartiesFromProject(project)
    rawData.seller = seller
  }

  if (invoiceData.buyer?.inn) {
    rawData.buyer = {
      name: invoiceData.buyer.name,
      legalName: invoiceData.buyer.legalName,
      inn: invoiceData.buyer.inn,
      kpp: invoiceData.buyer.kpp,
      address: invoiceData.buyer.address,
    }
  } else {
    const { buyer } = buildPartiesFromProject(project)
    rawData.buyer = buyer
  }

  const data = applyCalculationsToUpdData(rawData)

  const content: UpdDocumentContent = {
    type: 'UPD',
    schemaVersion: DOCUMENT_CONTENT_SCHEMA_VERSION,
    data,
  }

  const sourceMeta = buildSourceMeta(projectId, {
    invoiceDocumentId,
    contractDocumentId,
  })

  return { content, sourceMeta, documentNumber }
}
