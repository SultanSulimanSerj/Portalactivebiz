import type { CommercialOfferData } from '@/lib/commercial-offer-generator'
import type { SpecificationItem } from '@/lib/specification-appendix'
import { roundMoney } from './upd-calculations'

export function recalculateSpecificationItem(item: SpecificationItem): SpecificationItem {
  const quantity = Number(item.quantity) || 0
  const unitPrice = Number(item.unitPrice) || 0
  return {
    ...item,
    quantity,
    unitPrice,
    total: roundMoney(quantity * unitPrice),
  }
}

export function recalculateCommercialOfferData(data: CommercialOfferData): CommercialOfferData {
  const items = data.items.map(recalculateSpecificationItem)
  const total = roundMoney(items.reduce((sum, item) => sum + item.total, 0))
  const vatAmount = data.vatEnabled ? roundMoney((total * data.vatRate) / 100) : 0
  const totalWithVat = roundMoney(total + vatAmount)

  return {
    ...data,
    items,
    total,
    vatAmount,
    totalWithVat,
  }
}
