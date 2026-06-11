import { prisma } from './prisma'

export function serializeEstimateItem(item: {
  id: string
  name: string
  description: string | null
  notes: string | null
  quantity: unknown
  unit: string
  unitPrice: unknown
  costPrice: unknown
  total: unknown
  category: string
}) {
  return {
    id: item.id,
    name: item.name,
    description: item.description || '',
    notes: item.notes || '',
    quantity: Number(item.quantity),
    unit: item.unit,
    unitPrice: Number(item.unitPrice),
    costPrice: Number(item.costPrice),
    total: Number(item.total),
    category: item.category,
  }
}

export async function recalculateEstimateTotals(estimateId: string) {
  const [items, estimate] = await Promise.all([
    prisma.estimateItem.findMany({ where: { estimateId } }),
    prisma.estimate.findUnique({ where: { id: estimateId } }),
  ])

  if (!estimate) return

  const total = items.reduce((sum, item) => sum + Number(item.total), 0)
  const totalCost = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.costPrice),
    0
  )
  const vatEnabled = estimate.vatEnabled ?? false
  const vatRate = Number(estimate.vatRate ?? 22)
  const vatAmount = vatEnabled ? (total * vatRate) / 100 : 0

  await prisma.estimate.update({
    where: { id: estimateId },
    data: {
      total,
      totalCost,
      profit: total - totalCost,
      vatAmount,
      totalWithVat: total + vatAmount,
      updatedAt: new Date(),
    },
  })
}
