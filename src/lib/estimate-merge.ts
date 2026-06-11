import type { SpecificationItem } from './specification-appendix'
import { isEmptyLineItem } from './upd-line-items'

export interface EstimateWithItems {
  id: string
  name: string
  total: unknown
  vatEnabled: boolean
  vatRate?: unknown
  vatAmount?: unknown
  totalWithVat?: unknown
  items: Array<{
    name: string
    description?: string | null
    quantity: unknown
    unit: string
    unitPrice: unknown
    total: unknown
    category: string
  }>
}

export interface UpdMergedLineItem extends SpecificationItem {
  lineNumber: number
  estimateId: string
  estimateName: string
  unitPriceWithoutVat: number
  totalWithoutVat: number
  vatRate: number
  vatAmount: number
  totalWithVat: number
}

export interface MergedEstimatesForUpd {
  items: UpdMergedLineItem[]
  estimateNames: string[]
  estimateIds: string[]
  totalWithoutVat: number
  totalVat: number
  totalWithVat: number
  hasVat: boolean
}

export function mergeEstimatesForUpd(estimates: EstimateWithItems[]): MergedEstimatesForUpd {
  if (estimates.length === 0) {
    throw new Error('Не выбрано ни одной сметы')
  }

  const items: UpdMergedLineItem[] = []
  let lineNumber = 0

  for (const estimate of estimates) {
    const vatRate = Number(estimate.vatRate ?? 22)
    const vatEnabled = Boolean(estimate.vatEnabled)

    for (const item of estimate.items || []) {
      if (isEmptyLineItem({ name: item.name, description: item.description })) {
        continue
      }
      lineNumber += 1
      const quantity = Number(item.quantity)
      const unitPriceWithoutVat = Number(item.unitPrice)
      const totalWithoutVat = Number(item.total)
      const vatAmount = vatEnabled ? (totalWithoutVat * vatRate) / 100 : 0
      const totalWithVat = totalWithoutVat + vatAmount

      const displayName =
        estimate.items.length > 1 && estimates.length > 1
          ? `[${estimate.name}] ${item.name}`
          : item.name

      items.push({
        lineNumber,
        name: displayName,
        description: item.description,
        quantity,
        unit: item.unit || 'шт.',
        unitPrice: unitPriceWithoutVat,
        total: totalWithoutVat,
        category: item.category,
        estimateId: estimate.id,
        estimateName: estimate.name,
        unitPriceWithoutVat,
        totalWithoutVat,
        vatRate: vatEnabled ? vatRate : 0,
        vatAmount,
        totalWithVat,
      })
    }
  }

  if (items.length === 0) {
    throw new Error('В выбранных сметах нет позиций')
  }

  const totalWithoutVat = items.reduce((sum, item) => sum + item.totalWithoutVat, 0)
  const totalVat = items.reduce((sum, item) => sum + item.vatAmount, 0)
  const totalWithVat = items.reduce((sum, item) => sum + item.totalWithVat, 0)

  return {
    items,
    estimateNames: estimates.map((e) => e.name),
    estimateIds: estimates.map((e) => e.id),
    totalWithoutVat,
    totalVat,
    totalWithVat,
    hasVat: totalVat > 0,
  }
}
