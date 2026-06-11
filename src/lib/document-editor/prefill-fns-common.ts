import { prisma } from '@/lib/prisma'
import { mergeEstimatesForUpd, type EstimateWithItems } from '@/lib/estimate-merge'
import type { DocumentLineItem, DocumentParty } from './common'

export interface FnsPrefillProject {
  id: string
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
  estimates?: EstimateWithItems[]
}

export function buildPartiesFromProject(project: FnsPrefillProject): {
  seller: DocumentParty
  buyer: DocumentParty
} {
  return {
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
  }
}

export function formatContractBasis(project: FnsPrefillProject): string {
  if (project.contractNumber) {
    const date =
      project.contractDate instanceof Date
        ? project.contractDate.toLocaleDateString('ru-RU')
        : project.contractDate
          ? new Date(project.contractDate).toLocaleDateString('ru-RU')
          : ''
    return date
      ? `Договор № ${project.contractNumber} от ${date}`
      : `Договор № ${project.contractNumber}`
  }
  return 'Договор подряда'
}

export function mergedToLineItems(
  merged: ReturnType<typeof mergeEstimatesForUpd>
): DocumentLineItem[] {
  return merged.items.map((item) => ({
    lineNumber: item.lineNumber,
    name: item.name,
    description: item.description,
    unit: item.unit,
    quantity: item.quantity,
    unitPriceWithoutVat: item.unitPriceWithoutVat,
    totalWithoutVat: item.totalWithoutVat,
    vatRate: item.vatRate,
    vatAmount: item.vatAmount,
    totalWithVat: item.totalWithVat,
  }))
}

export async function loadProjectForFnsPrefill(
  projectId: string,
  companyId: string,
  estimateIds: string[]
): Promise<FnsPrefillProject> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      company: true,
      estimates:
        estimateIds.length > 0
          ? {
              where: { id: { in: estimateIds } },
              include: { items: { orderBy: { createdAt: 'asc' } } },
            }
          : undefined,
    },
  })

  if (!project) throw new Error('Проект не найден')
  if (project.companyId !== companyId) throw new Error('Недостаточно прав')

  return project as unknown as FnsPrefillProject
}

export async function loadStageNames(projectId: string, stageIds: string[]): Promise<string[]> {
  if (!stageIds.length) return []
  const stages = await prisma.workStage.findMany({
    where: { id: { in: stageIds }, projectId },
    select: { name: true },
    orderBy: { orderIndex: 'asc' },
  })
  return stages.map((s) => s.name)
}

export function mergeEstimatesOrEmpty(
  project: FnsPrefillProject,
  estimateIds: string[]
): ReturnType<typeof mergeEstimatesForUpd> {
  if (estimateIds.length > 0 && project.estimates?.length) {
    if (project.estimates.length !== estimateIds.length) {
      throw new Error('Одна или несколько смет не найдены в этом проекте')
    }
    return mergeEstimatesForUpd(project.estimates as EstimateWithItems[])
  }
  return {
    items: [],
    estimateNames: [],
    estimateIds: [],
    totalWithoutVat: 0,
    totalVat: 0,
    totalWithVat: 0,
    hasVat: false,
  }
}
