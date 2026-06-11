import { peekNextDocumentNumber } from '@/lib/document-numbering'
import type { Ks3DocumentData } from '@/lib/document-renderer/fns-form-types'
import type { Ks3DocumentContent, DocumentSourceMeta } from './types'
import { DOCUMENT_CONTENT_SCHEMA_VERSION } from './types'
import {
  buildPartiesFromProject,
  formatContractBasis,
  loadProjectForFnsPrefill,
  loadStageNames,
  mergeEstimatesOrEmpty,
  mergedToLineItems,
} from './prefill-fns-common'

export interface CreateKs3DraftParams {
  projectId: string
  companyId: string
  creatorId: string
  estimateIds?: string[]
  stageIds?: string[]
  documentNumber?: string | null
  documentDate?: Date
  ks2DocumentNumbers?: string[]
}

export async function buildKs3DraftContent(
  params: CreateKs3DraftParams
): Promise<{ content: Ks3DocumentContent; sourceMeta: DocumentSourceMeta; documentNumber: string }> {
  const {
    projectId,
    companyId,
    estimateIds = [],
    stageIds = [],
    documentNumber: customNumber,
    documentDate = new Date(),
    ks2DocumentNumbers = [],
  } = params

  const project = await loadProjectForFnsPrefill(projectId, companyId, estimateIds)
  const stageNames = await loadStageNames(projectId, stageIds)
  const merged = mergeEstimatesOrEmpty(project, estimateIds)
  const documentNumber =
    customNumber?.trim() || String(await peekNextDocumentNumber(companyId, 'KS3'))
  const dateStr = documentDate.toLocaleDateString('ru-RU')
  const { seller, buyer } = buildPartiesFromProject(project)

  const data: Ks3DocumentData = {
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
    ks2DocumentNumbers: ks2DocumentNumbers.length ? ks2DocumentNumbers : undefined,
    items: mergedToLineItems(merged),
    totals: {
      totalWithoutVat: merged.totalWithoutVat,
      totalVat: merged.totalVat,
      totalWithVat: merged.totalWithVat,
      hasVat: merged.hasVat,
    },
  }

  const content: Ks3DocumentContent = {
    type: 'KS3',
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
