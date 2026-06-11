import { prisma } from '@/lib/prisma'
import type { InvoiceDocumentData } from '@/lib/document-renderer/fns-form-types'
import type { InvoiceDocumentContent } from './types'
import { DOCUMENT_CONTENT_SCHEMA_VERSION, buildSourceMeta, isCommercialOfferContent } from './types'
import {
  buildPartiesFromProject,
  loadProjectForFnsPrefill,
  mergeEstimatesOrEmpty,
  mergedToLineItems,
} from './prefill-fns-common'
import { specificationItemsToLineItems } from './document-line-items'
import { roundMoney } from './upd-calculations'

export interface CreateInvoiceDraftParams {
  projectId: string
  companyId: string
  creatorId: string
  estimateIds?: string[]
  commercialOfferId?: string
  documentNumber?: string | null
  documentDate?: Date
  dueDate?: Date
  parentDocumentId?: string
}

async function loadItemsFromCommercialOffer(
  commercialOfferId: string,
  projectId: string,
  companyId: string
) {
  const kpDoc = await prisma.document.findFirst({
    where: {
      id: commercialOfferId,
      projectId,
      category: 'COMMERCIAL',
      OR: [{ companyId }, { companyId: null, creator: { companyId } }],
    },
  })

  if (!kpDoc?.contentJson || !isCommercialOfferContent(kpDoc.contentJson)) {
    throw new Error('Коммерческое предложение не найдено')
  }

  const kp = kpDoc.contentJson.data
  const items = specificationItemsToLineItems(kp.items)
  const totalWithoutVat = roundMoney(kp.total)
  const totalVat = roundMoney(kp.vatAmount)
  const totalWithVat = roundMoney(kp.totalWithVat)

  return {
    items,
    estimateNames: [kp.estimateName],
    totals: {
      totalWithoutVat,
      totalVat,
      totalWithVat,
      hasVat: kp.vatEnabled && totalVat > 0,
    },
    paymentPurpose: `Оплата по КП № ${kp.offerNumber} от ${kp.offerDate}`,
  }
}

export async function buildInvoiceDraftContent(
  params: CreateInvoiceDraftParams
): Promise<{
  content: InvoiceDocumentContent
  sourceMeta: ReturnType<typeof buildSourceMeta>
  documentNumber: string
}> {
  const {
    projectId,
    companyId,
    estimateIds = [],
    commercialOfferId,
    documentNumber,
    documentDate = new Date(),
    dueDate,
  } = params

  if (!documentNumber?.trim()) {
    throw new Error('Номер документа не задан')
  }

  const project = await loadProjectForFnsPrefill(projectId, companyId, estimateIds)
  const dateStr = documentDate.toLocaleDateString('ru-RU')
  const { seller, buyer } = buildPartiesFromProject(project)

  let items
  let totals
  let paymentPurpose

  if (commercialOfferId) {
    const fromKp = await loadItemsFromCommercialOffer(commercialOfferId, projectId, companyId)
    items = fromKp.items
    totals = fromKp.totals
    paymentPurpose = fromKp.paymentPurpose
  } else {
    const merged = mergeEstimatesOrEmpty(project, estimateIds)
    items = mergedToLineItems(merged)
    totals = {
      totalWithoutVat: merged.totalWithoutVat,
      totalVat: merged.totalVat,
      totalWithVat: merged.totalWithVat,
      hasVat: merged.hasVat,
    }
    paymentPurpose = merged.estimateNames.length
      ? `Оплата по смете: ${merged.estimateNames.join(', ')} (${project.name})`
      : `Оплата по проекту ${project.name}`
  }

  const data: InvoiceDocumentData = {
    documentNumber,
    documentDate: dateStr,
    projectName: project.name,
    contractNumber: project.contractNumber || undefined,
    contractDate: project.contractDate
      ? new Date(project.contractDate).toLocaleDateString('ru-RU')
      : undefined,
    seller,
    buyer,
    items,
    totals,
    paymentPurpose,
    dueDate: dueDate?.toLocaleDateString('ru-RU'),
  }

  const content: InvoiceDocumentContent = {
    type: 'INVOICE',
    schemaVersion: DOCUMENT_CONTENT_SCHEMA_VERSION,
    data,
  }

  const sourceMeta = buildSourceMeta(projectId, {
    estimateIds,
    commercialOfferId,
  })

  return { content, sourceMeta, documentNumber }
}
