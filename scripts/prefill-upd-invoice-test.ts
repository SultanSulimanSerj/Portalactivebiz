import { lineItemsToUpdMergedItems } from '../src/lib/document-editor/document-line-items'
import type { DocumentLineItem } from '../src/lib/document-editor/common'

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`)
    process.exit(1)
  }
  console.log(`OK: ${message}`)
}

const invoiceItems: DocumentLineItem[] = [
  {
    lineNumber: 1,
    name: 'Монтаж оборудования',
    description: 'По смете',
    unit: 'шт',
    quantity: 2,
    unitPriceWithoutVat: 10000,
    totalWithoutVat: 20000,
    vatRate: 20,
    vatAmount: 4000,
    totalWithVat: 24000,
  },
  {
    lineNumber: 2,
    name: 'Доставка',
    unit: 'усл',
    quantity: 1,
    unitPriceWithoutVat: 5000,
    totalWithoutVat: 5000,
    vatRate: 20,
    vatAmount: 1000,
    totalWithVat: 6000,
  },
]

const merged = lineItemsToUpdMergedItems(invoiceItems)

assert(merged.length === 2, 'количество позиций совпадает со счётом')
assert(merged[0].name === 'Монтаж оборудования', 'наименование переносится')
assert(merged[0].quantity === 2, 'количество переносится')
assert(merged[0].unitPriceWithoutVat === 10000, 'цена без НДС переносится')
assert(merged[0].totalWithVat === 24000, 'сумма с НДС переносится')
assert(merged[1].lineNumber === 2, 'нумерация строк корректна')

console.log('prefill-upd-invoice-test: все проверки пройдены')
