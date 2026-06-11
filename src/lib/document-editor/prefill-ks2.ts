import { peekNextDocumentNumber } from '@/lib/document-numbering'
import type { Ks2DocumentData } from '@/lib/document-renderer/fns-form-types'
import type { Ks2DocumentContent, DocumentSourceMeta } from './types'
import { DOCUMENT_CONTENT_SCHEMA_VERSION } from './types'
import {
  buildPartiesFromProject,
  formatContractBasis,
  loadProjectForFnsPrefill,
  loadStageNames,
  mergeEstimatesOrEmpty,
  mergedToLineItems,
} from './prefill-fns-common'

export interface CreateKs2DraftParams {
  projectId: string
  companyId: string
  creatorId: string
  estimateIds?: string[]
  stageIds?: string[]
  documentNumber?: string | null
  documentDate?: Date
}

export async function buildKs2DraftContent(
  params: CreateKs2DraftParams
): Promise<{ content: Ks2DocumentContent; sourceMeta: DocumentSourceMeta; documentNumber: string }> {
  const {
    projectId,
    companyId,
    estimateIds = [],
    stageIds = [],
    documentNumber: customNumber,
    documentDate = new Date(),
  } = params

  const project = await loadProjectForFnsPrefill(projectId, companyId, estimateIds)
  const stageNames = await loadStageNames(projectId, stageIds)
  const merged = mergeEstimatesOrEmpty(project, estimateIds)
  const documentNumber =
    customNumber?.trim() || String(await peekNextDocumentNumber(companyId, 'KS2'))
  const dateStr = documentDate.toLocaleDateString('ru-RU')
  const { seller, buyer } = buildPartiesFromProject(project)

  const data: Ks2DocumentData = {
    documentNumber,
    documentDate: dateStr,
    projectName: project.name,
    contractNumber: project.contractNumber || undefined,
    contractDate: project.contractDate
      ? new Date(project.contractDate).toLocaleDateString('ru-RU')
      : undefined,
    seller,
    buyer,
    objectName: project.name,
    contractBasis: formatContractBasis(project),
    basisText: stageNames.length ? `Этапы: ${stageNames.join(', ')}` : undefined,
    items: mergedToLineItems(merged),
    totals: {
      totalWithoutVat: merged.totalWithoutVat,
      totalVat: merged.totalVat,
      totalWithVat: merged.totalWithVat,
      hasVat: merged.hasVat,
    },
  }

  const content: Ks2DocumentContent = {
    type: 'KS2',
    schemaVersion: DOCUMENT_CONTENT_SCHEMA_VERSION,
    data,
  }

  const sourceMeta: DocumentSourceMeta = {
    estimateIds,
    stageIds,
    prefillAt: new Date().toISOString(),
    projectId,
  }

  return { content, sourceMeta, documentNumber }
}
