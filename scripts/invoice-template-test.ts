import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'
import { renderInvoiceDocx } from '../src/lib/document-renderer/invoice/invoice-docx-renderer'
import type { InvoiceDocumentData } from '../src/lib/document-renderer/fns-form-types'
import { rublesToWords } from '../src/lib/number-to-words-ru'

const sample: InvoiceDocumentData = {
  documentNumber: '38',
  documentDate: '29.05.2026',
  projectName: 'Тест',
  seller: {
    name: 'Уралтек',
    legalName: 'Общество с ограниченной ответственностью "Уралтек"',
    inn: '6670532682',
    kpp: '667001001',
    address:
      '620078, Российская Федерация, Свердловская обл, город Екатеринбург г.о., г Екатеринбург, ул Мира, д. 44, кв. 6',
    directorName: 'Копыл Сергей Владимирович',
    directorPosition: 'Генеральный директор',
    bankName: 'ООО "Банк Точка"',
    bankBik: '044525104',
    correspondentAccount: '30101810745374525104',
    bankAccount: '40702810320000272737',
    bankCity: 'г Москва',
  },
  buyer: {
    name: 'Завод Полимер Техсинтез',
    legalName: 'Общество с ограниченной ответственностью "Завод Полимер Техсинтез"',
    inn: '6671238370',
    kpp: '667901001',
    address:
      '620902, Российская Федерация, Свердловская обл, г Екатеринбург, ул 1-я Баритовая, стр. 127и, 3 офис',
  },
  items: [
    {
      lineNumber: 1,
      name: 'MESH-комплект TP-Link Deco',
      unit: 'шт',
      quantity: 2,
      unitPriceWithoutVat: 9490,
      totalWithoutVat: 18980,
      vatRate: 0,
      vatAmount: 0,
      totalWithVat: 18980,
    },
    {
      lineNumber: 2,
      name: 'Установка и настройка',
      unit: 'шт',
      quantity: 2,
      unitPriceWithoutVat: 3000,
      totalWithoutVat: 6000,
      vatRate: 0,
      vatAmount: 0,
      totalWithVat: 6000,
    },
  ],
  totals: {
    totalWithoutVat: 24980,
    totalVat: 0,
    totalWithVat: 24980,
    hasVat: false,
  },
  paymentPurpose: '',
  dueDate: '',
}

assert.match(rublesToWords(24980), /Двадцать четыре тысячи/)

async function main() {
  const buffer = await renderInvoiceDocx(sample)
  assert.ok(buffer.length > 5000)

  const out = path.join(process.cwd(), '.tmp/invoice-render-test.docx')
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, buffer)
  console.log('invoice-template-test: OK ->', out)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
