import type { UpdDocumentData } from '@/lib/upd-generator'
import { filterNonemptyLineItems } from '@/lib/upd-line-items'
import type { DocumentSourceMeta, ValidationIssue, ValidationResult } from './types'
import { roundMoney } from './upd-calculations'

function isValidInn(inn: string): boolean {
  const digits = inn.replace(/\D/g, '')
  return digits.length === 10 || digits.length === 12
}

export function validateUpdDocument(data: UpdDocumentData): ValidationResult {
  const issues: ValidationIssue[] = []

  if (!data.documentNumber?.trim()) {
    issues.push({ field: 'documentNumber', message: 'Укажите номер документа', severity: 'error' })
  }
  if (!data.documentDate?.trim()) {
    issues.push({ field: 'documentDate', message: 'Укажите дату документа', severity: 'error' })
  }
  if (!data.seller.legalName?.trim() && !data.seller.name?.trim()) {
    issues.push({ field: 'seller.name', message: 'Укажите наименование продавца', severity: 'error' })
  }
  if (!data.seller.inn?.trim()) {
    issues.push({ field: 'seller.inn', message: 'Укажите ИНН продавца', severity: 'error' })
  } else if (!isValidInn(data.seller.inn)) {
    issues.push({ field: 'seller.inn', message: 'ИНН продавца должен содержать 10 или 12 цифр', severity: 'error' })
  }
  if (!data.buyer.legalName?.trim() && !data.buyer.name?.trim()) {
    issues.push({ field: 'buyer.name', message: 'Укажите наименование покупателя', severity: 'error' })
  }
  if (!data.buyer.inn?.trim()) {
    issues.push({ field: 'buyer.inn', message: 'Укажите ИНН покупателя', severity: 'error' })
  } else if (!isValidInn(data.buyer.inn)) {
    issues.push({ field: 'buyer.inn', message: 'ИНН покупателя должен содержать 10 или 12 цифр', severity: 'error' })
  }

  const items = filterNonemptyLineItems(data.items)

  if (!items.length) {
    issues.push({ field: 'items', message: 'Добавьте хотя бы одну позицию', severity: 'error' })
  }

  items.forEach((item, index) => {
    const prefix = `items.${index}`
    if (!item.name?.trim()) {
      issues.push({ field: `${prefix}.name`, message: `Строка ${index + 1}: укажите наименование`, severity: 'error' })
    }
    if (item.quantity <= 0) {
      issues.push({ field: `${prefix}.quantity`, message: `Строка ${index + 1}: количество должно быть больше 0`, severity: 'error' })
    }
    if (item.unitPriceWithoutVat < 0) {
      issues.push({ field: `${prefix}.unitPrice`, message: `Строка ${index + 1}: цена не может быть отрицательной`, severity: 'error' })
    }

    const expectedTotal = roundMoney(item.quantity * item.unitPriceWithoutVat)
    if (Math.abs(expectedTotal - item.totalWithoutVat) > 0.02) {
      issues.push({
        field: `${prefix}.total`,
        message: `Строка ${index + 1}: сумма без НДС не согласована с количеством и ценой`,
        severity: 'warning',
      })
    }
  })

  const calcWithoutVat = roundMoney(items.reduce((s, i) => s + i.totalWithoutVat, 0))
  const calcVat = roundMoney(items.reduce((s, i) => s + i.vatAmount, 0))
  const calcWithVat = roundMoney(items.reduce((s, i) => s + i.totalWithVat, 0))

  if (Math.abs(calcWithoutVat - data.totalWithoutVat) > 0.02) {
    issues.push({ field: 'totalWithoutVat', message: 'Итог без НДС не совпадает с суммой строк', severity: 'error' })
  }
  if (Math.abs(calcVat - data.totalVat) > 0.02) {
    issues.push({ field: 'totalVat', message: 'Итог НДС не совпадает с суммой строк', severity: 'error' })
  }
  if (Math.abs(calcWithVat - data.totalWithVat) > 0.02) {
    issues.push({ field: 'totalWithVat', message: 'Итог с НДС не совпадает с суммой строк', severity: 'error' })
  }

  return {
    valid: !issues.some((i) => i.severity === 'error'),
    issues,
  }
}

export function appendUpdSourceMetaWarnings(
  result: ValidationResult,
  sourceMeta?: DocumentSourceMeta | null
): ValidationResult {
  const issues = [...result.issues]
  if (!sourceMeta?.invoiceDocumentId?.trim()) {
    issues.push({
      field: 'sourceMeta.invoiceDocumentId',
      message:
        'УПД не привязан к счёту-основанию. Рекомендуется создать УПД из счёта в цепочке документов.',
      severity: 'warning',
    })
  }
  return {
    valid: result.valid,
    issues,
  }
}
