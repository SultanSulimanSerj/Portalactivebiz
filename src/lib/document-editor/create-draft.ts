import { prisma } from '@/lib/prisma'
import { generateId } from '@/lib/id-generator'
import { createDocumentWithAllocatedNumber } from '@/lib/document-numbering'
import type { DocumentContent, DocumentContentType, DocumentSourceMeta } from './types'
import { getDocumentTypeDefinition } from './registry'
import { buildUpdDraftContent, type CreateUpdDraftParams } from './prefill-upd'
import { buildInvoiceDraftContent, type CreateInvoiceDraftParams } from './prefill-invoice'
import { buildCommercialOfferDraftContent } from './prefill-commercial-offer'
import { buildContractDraftContent } from './prefill-contract'

const PLACEHOLDER_FILE = 'draft-placeholder.txt'

export interface CreateEditableDraftParams {
  type: DocumentContentType
  projectId: string
  companyId: string
  creatorId: string
  estimateIds?: string[]
  stageIds?: string[]
  commercialOfferId?: string
  invoiceDocumentId?: string
  contractDocumentId?: string
  parentDocumentId?: string
  documentNumber?: string | null
  documentDate?: Date
  updStatus?: 1 | 2
}

function draftDescription(type: DocumentContentType, sourceMeta: DocumentSourceMeta): string {
  const label = getDocumentTypeDefinition(type).label.toLowerCase()
  if (sourceMeta.invoiceDocumentId) return `Черновик ${label} на основании счёта`
  if (sourceMeta.commercialOfferId) return `Черновик ${label} на основании КП`
  if (sourceMeta.estimateIds?.length) return `Черновик ${label} по сметам проекта`
  return `Черновик ${label}`
}

function documentDateFromContent(content: DocumentContent): string {
  const data = content.data as unknown as Record<string, unknown>
  return (
    (data.documentDate as string) ||
    (data.offerDate as string) ||
    (data.contractDate as string) ||
    new Date().toLocaleDateString('ru-RU')
  )
}

async function buildDraftByType(
  params: CreateEditableDraftParams & { documentNumber: string }
): Promise<{ content: DocumentContent; sourceMeta: DocumentSourceMeta }> {
  const base = {
    projectId: params.projectId,
    companyId: params.companyId,
    documentNumber: params.documentNumber,
    documentDate: params.documentDate,
  }

  switch (params.type) {
    case 'UPD':
      return buildUpdDraftContent({
        ...base,
        creatorId: params.creatorId,
        invoiceDocumentId: params.invoiceDocumentId!,
        contractDocumentId: params.contractDocumentId,
        updStatus: params.updStatus,
        parentDocumentId: params.parentDocumentId,
      })
    case 'INVOICE':
      return buildInvoiceDraftContent({
        ...base,
        creatorId: params.creatorId,
        estimateIds: params.estimateIds,
        commercialOfferId: params.commercialOfferId,
        parentDocumentId: params.parentDocumentId,
      })
    case 'COMMERCIAL_OFFER':
      return buildCommercialOfferDraftContent({
        ...base,
        estimateIds: params.estimateIds ?? [],
      })
    case 'CONTRACT':
      return buildContractDraftContent({
        ...base,
        estimateIds: params.estimateIds,
      })
    case 'KS2':
    case 'KS3':
      throw new Error('КС-2 и КС-3 пока не поддерживаются')
    default:
      throw new Error(`Тип ${params.type} не поддерживает редактор черновика`)
  }
}

export async function createEditableDocumentDraft(params: CreateEditableDraftParams) {
  const typeDef = getDocumentTypeDefinition(params.type)

  if (!typeDef.supportsEditor) {
    throw new Error(`Тип ${typeDef.label} не поддерживает редактор черновика`)
  }

  return createDocumentWithAllocatedNumber(
    params.companyId,
    typeDef.category,
    params.documentNumber,
    async (documentNumber) => {
      const { content, sourceMeta } = await buildDraftByType({
        ...params,
        documentNumber,
      })
      const dataDate = documentDateFromContent(content)

      const title = `${typeDef.label} № ${documentNumber} от ${dataDate}`

      return prisma.document.create({
        data: {
          id: generateId(),
          title,
          description: draftDescription(params.type, sourceMeta),
          fileName: PLACEHOLDER_FILE,
          filePath: PLACEHOLDER_FILE,
          fileSize: 0,
          mimeType: typeDef.mimeType,
          category: typeDef.category,
          documentNumber,
          editorStatus: 'DRAFT',
          contentJson: content as object,
          sourceMeta: sourceMeta as object,
          isPublished: false,
          numberAllocated: true,
          hasUnpublishedChanges: true,
          projectId: params.projectId,
          parentDocumentId: params.parentDocumentId ?? null,
          creatorId: params.creatorId,
          companyId: params.companyId,
        },
        include: {
          project: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true, email: true } },
        },
      })
    }
  )
}

export type { CreateUpdDraftParams, CreateInvoiceDraftParams }
