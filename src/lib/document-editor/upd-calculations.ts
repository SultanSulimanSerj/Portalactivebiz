import type { UpdMergedLineItem } from '@/lib/estimate-merge'
import type { UpdDocumentData } from '@/lib/upd-generator'
import { filterNonemptyLineItems } from '@/lib/upd-line-items'
import type { UpdEditableLineItem } from './types'

export { isEmptyLineItem, filterNonemptyLineItems } from '@/lib/upd-line-items'

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export function calculateLineItemTotals(
  quantity: number,
  unitPriceWithoutVat: number,
  vatRate: number
): Pick<UpdEditableLineItem, 'totalWithoutVat' | 'vatAmount' | 'totalWithVat'> {
  const totalWithoutVat = roundMoney(quantity * unitPriceWithoutVat)
  const vatAmount = vatRate > 0 ? roundMoney((totalWithoutVat * vatRate) / 100) : 0
  const totalWithVat = roundMoney(totalWithoutVat + vatAmount)
  return { totalWithoutVat, vatAmount, totalWithVat }
}

export function recalculateLineItem(item: UpdEditableLineItem): UpdEditableLineItem {
  const totals = calculateLineItemTotals(
    item.quantity,
    item.unitPriceWithoutVat,
    item.vatRate
  )
  return { ...item, ...totals }
}

export function recalculateAllLineItems(items: UpdEditableLineItem[]): UpdEditableLineItem[] {
  return items.map((item, index) =>
    recalculateLineItem({ ...item, lineNumber: index + 1 })
  )
}

export function calculateDocumentTotals(items: UpdEditableLineItem[]) {
  const totalWithoutVat = roundMoney(items.reduce((s, i) => s + i.totalWithoutVat, 0))
  const totalVat = roundMoney(items.reduce((s, i) => s + i.vatAmount, 0))
  const totalWithVat = roundMoney(items.reduce((s, i) => s + i.totalWithVat, 0))
  const hasVat = totalVat > 0
  return { totalWithoutVat, totalVat, totalWithVat, hasVat }
}

export function mergedLineItemToEditable(item: UpdMergedLineItem): UpdEditableLineItem {
  return {
    id: `line-${item.lineNumber}-${item.estimateId}`,
    lineNumber: item.lineNumber,
    name: item.name,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    unitPriceWithoutVat: item.unitPriceWithoutVat,
    totalWithoutVat: item.totalWithoutVat,
    vatRate: item.vatRate,
    vatAmount: item.vatAmount,
    totalWithVat: item.totalWithVat,
    estimateId: item.estimateId,
    estimateName: item.estimateName,
    category: item.category,
  }
}

export function editableToMergedLineItem(item: UpdEditableLineItem): UpdMergedLineItem {
  return {
    lineNumber: item.lineNumber,
    name: item.name,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    unitPrice: item.unitPriceWithoutVat,
    total: item.totalWithoutVat,
    category: item.category || 'WORK',
    estimateId: item.estimateId || '',
    estimateName: item.estimateName || '',
    unitPriceWithoutVat: item.unitPriceWithoutVat,
    totalWithoutVat: item.totalWithoutVat,
    vatRate: item.vatRate,
    vatAmount: item.vatAmount,
    totalWithVat: item.totalWithVat,
  }
}

/** Данные для выгрузки: без пустых строк, с пересчитанными итогами. */
export function prepareUpdDataForExport(data: UpdDocumentData): UpdDocumentData {
  const items = filterNonemptyLineItems(data.items)
  return applyCalculationsToUpdData({ ...data, items })
}

export function applyCalculationsToUpdData(data: UpdDocumentData): UpdDocumentData {
  const editable = data.items.map((item, index) =>
    mergedLineItemToEditable({ ...item, lineNumber: index + 1 })
  )
  const recalculated = recalculateAllLineItems(editable)
  const totals = calculateDocumentTotals(recalculated)
  return {
    ...data,
    items: recalculated.map(editableToMergedLineItem),
    ...totals,
  }
}

export function createEmptyLineItem(lineNumber: number, vatRate = 22): UpdEditableLineItem {
  return recalculateLineItem({
    id: `line-new-${Date.now()}-${lineNumber}`,
    lineNumber,
    name: '',
    quantity: 1,
    unit: 'шт.',
    unitPriceWithoutVat: 0,
    totalWithoutVat: 0,
    vatRate,
    vatAmount: 0,
    totalWithVat: 0,
  })
}
