import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { generateUpdExcelBuffer, type UpdDocumentData } from '../src/lib/upd-generator'
import { inspectXlsxBuffer, assertUpdQuality } from '../src/lib/document-renderer/xlsx-patcher'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`)
    process.exit(1)
  }
  console.log(`OK: ${message}`)
}

const goldenPath = path.join(root, 'Исходящий УПД № 33 от 27.05.2026.xlsx')
const templatePath = path.join(root, 'templates/documents/upd-status-2-template.xlsx')

assert(fs.existsSync(templatePath), 'шаблон УПД существует')
assert(fs.existsSync(goldenPath), 'эталонный файл Контура существует')

const goldenBuffer = fs.readFileSync(goldenPath)
const goldenMetrics = inspectXlsxBuffer(goldenBuffer)
assert(goldenMetrics.mergeCount === 338, `эталон: merge cells = ${goldenMetrics.mergeCount}`)
assert(
  goldenMetrics.substringCounts['(подпись)'] === 1,
  `эталон: (подпись) = ${goldenMetrics.substringCounts['(подпись)']}`
)
assert(
  goldenMetrics.substringCounts['(ф.и.о.)'] === 1,
  `эталон: (ф.и.о.) = ${goldenMetrics.substringCounts['(ф.и.о.)']}`
)

const sampleData: UpdDocumentData = {
  documentNumber: '33',
  documentDate: '27.05.2026',
  status: 2 as const,
  seller: {
    name: 'ООО Тест',
    legalName: 'ООО Тест',
    inn: '6658497833',
    kpp: '665801001',
    address: 'г. Екатеринбург',
    directorName: 'Копыл С.В.',
    directorPosition: 'Генеральный директор',
  },
  buyer: {
    name: 'ООО Клиент',
    legalName: 'ООО Клиент',
    inn: '1234567890',
    kpp: '123401001',
    address: 'г. Москва',
  },
  projectName: 'Проект',
  estimateNames: ['Смета'],
  items: [
    {
      lineNumber: 1,
      name: 'Шкаф напольный 42U',
      unit: 'шт',
      quantity: 1,
      unitPrice: 44900,
      total: 44900,
      unitPriceWithoutVat: 44900,
      totalWithoutVat: 44900,
      vatRate: 0,
      vatAmount: 0,
      totalWithVat: 44900,
      estimateId: 'est-1',
      estimateName: 'Смета',
      category: 'materials',
    },
  ],
  totalWithoutVat: 44900,
  totalVat: 0,
  totalWithVat: 44900,
  hasVat: false,
  basisText: 'Счет на оплату № 36 от 27.05.2026',
  shipDate: '27.05.2026',
  signatorySeller: 'Копыл С.В.',
}

async function main() {
  const generated = await generateUpdExcelBuffer(sampleData)
  const generatedMetrics = inspectXlsxBuffer(generated)
  assertUpdQuality(generatedMetrics)
  assert(generatedMetrics.mergeCount === goldenMetrics.mergeCount, 'merge count совпадает с эталоном')
  assert(
    generatedMetrics.substringCounts['(подпись)'] === goldenMetrics.substringCounts['(подпись)'],
    'количество (подпись) совпадает с эталоном'
  )

  const templateMetrics = inspectXlsxBuffer(fs.readFileSync(templatePath))
  assert(generatedMetrics.mergeCount === templateMetrics.mergeCount, 'merge count совпадает с шаблоном')

  console.log('Все проверки УПД пройдены')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
