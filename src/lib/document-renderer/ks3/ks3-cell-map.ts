import type { Ks3DocumentData } from '../fns-form-types'
import type { XlsxCellAssignment } from '../types'

export function buildKs3CellAssignments(data: Ks3DocumentData): XlsxCellAssignment[] {
  const assignments: XlsxCellAssignment[] = [
    { address: 'A1', value: data.documentNumber },
    { address: 'B1', value: data.documentDate },
    { address: 'A3', value: data.seller.legalName || data.seller.name },
    { address: 'A4', value: data.buyer.legalName || data.buyer.name },
    { address: 'A5', value: data.objectName },
    { address: 'A6', value: data.contractBasis },
  ]

  if (data.ks2DocumentNumbers?.length) {
    assignments.push({
      address: 'A7',
      value: `КС-2: ${data.ks2DocumentNumbers.join(', ')}`,
    })
  }

  data.items.slice(0, 9).forEach((item, index) => {
    const row = 10 + index
    assignments.push(
      { address: `A${row}`, value: item.lineNumber },
      { address: `B${row}`, value: item.name },
      { address: `E${row}`, value: item.totalWithoutVat }
    )
  })

  return assignments
}
