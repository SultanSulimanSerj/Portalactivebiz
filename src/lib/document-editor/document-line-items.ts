import type { UpdMergedLineItem } from '@/lib/estimate-merge'
import type { DocumentLineItem } from './common'
import type { SpecificationItem } from '@/lib/specification-appendix'

export function lineItemsToUpdMergedItems(items: DocumentLineItem[]): UpdMergedLineItem[] {
  return items.map((item, index) => ({
    lineNumber: index + 1,
    name: item.name,
    description: item.description,
    unit: item.unit || 'шт',
    quantity: item.quantity,
    unitPrice: item.unitPriceWithoutVat,
    total: item.totalWithVat,
    unitPriceWithoutVat: item.unitPriceWithoutVat,
    totalWithoutVat: item.totalWithoutVat,
    vatRate: item.vatRate,
    vatAmount: item.vatAmount,
    totalWithVat: item.totalWithVat,
    estimateId: '',
    estimateName: '',
    category: 'materials',
  }))
}

export function specificationItemsToLineItems(items: SpecificationItem[]): DocumentLineItem[] {
  return items.map((item, index) => {
    const total = Number(item.total)
    const qty = Number(item.quantity) || 1
    const unitPrice = Number(item.unitPrice)
    return {
      lineNumber: index + 1,
      name: item.name,
      description: item.description,
      unit: item.unit || 'шт',
      quantity: qty,
      unitPriceWithoutVat: unitPrice,
      totalWithoutVat: total,
      vatRate: 0,
      vatAmount: 0,
      totalWithVat: total,
    }
  })
}
