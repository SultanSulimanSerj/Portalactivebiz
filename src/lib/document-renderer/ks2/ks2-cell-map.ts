import type { Ks2DocumentData } from '../fns-form-types'
import type { XlsxCellAssignment } from '../types'

/**
 * Карта ячеек КС-2. Адреса уточняются после добавления официального шаблона ФНС.
 * Сейчас — минимальный набор полей для интеграции с XlsxTemplatePatcher.
 */
export function buildKs2CellAssignments(data: Ks2DocumentData): XlsxCellAssignment[] {
  const assignments: XlsxCellAssignment[] = [
    { address: 'A1', value: data.documentNumber },
    { address: 'B1', value: data.documentDate },
    { address: 'A3', value: data.seller.legalName || data.seller.name },
    { address: 'A4', value: data.buyer.legalName || data.buyer.name },
    { address: 'A5', value: data.objectName },
    { address: 'A6', value: data.contractBasis },
  ]

  if (data.basisText) {
    assignments.push({ address: 'A7', value: data.basisText })
  }

  data.items.slice(0, 9).forEach((item, index) => {
    const row = 10 + index
    assignments.push(
      { address: `A${row}`, value: item.lineNumber },
      { address: `B${row}`, value: item.name },
      { address: `C${row}`, value: item.quantity },
      { address: `D${row}`, value: item.unit },
      { address: `E${row}`, value: item.totalWithoutVat }
    )
  })

  return assignments
}
