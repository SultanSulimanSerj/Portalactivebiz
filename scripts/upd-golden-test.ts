import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import PizZip from 'pizzip'
import { generateUpdExcelBuffer, type UpdDocumentData } from '../src/lib/upd-generator'
import { inspectXlsxBuffer, assertUpdQuality } from '../src/lib/document-renderer/xlsx-patcher'

function readXlsxCell(buffer: Buffer, address: string): string | null {
  const zip = new PizZip(buffer)
  const sheet = zip.file('xl/worksheets/sheet1.xml')?.asText()
  const sstXml = zip.file('xl/sharedStrings.xml')?.asText()
  if (!sheet || !sstXml) return null

  const cellMatch = sheet.match(
    new RegExp(`<c r="${address}"([^>]*)>([\\s\\S]*?)</c>|<c r="${address}"([^>]*)/>`)
  )
  if (!cellMatch) return null
  const attrs = cellMatch[1] ?? cellMatch[3] ?? ''
  const inner = cellMatch[2]
  if (!inner) return ''
  const valueMatch = /<v>([^<]*)<\/v>/.exec(inner)
  if (!valueMatch) return ''
  if (/\bt="s"/.test(attrs)) {
    const all = Array.from(sstXml.matchAll(/<si>[\s\S]*?<\/si>/g))
    const si = all[parseInt(valueMatch[1], 10)]?.[0] ?? ''
    return Array.from(si.matchAll(/<t[^>]*>([^<]*)<\/t>/g))
      .map((m) => m[1])
      .join('')
  }
  return valueMatch[1]
}

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
  paymentDocText: 'Счёт на оплату № 36 от 27.05.2026',
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

  assert(readXlsxCell(generated, 'BA9') === '№', 'в BA9 остаётся символ «№»')
  const paymentDoc = readXlsxCell(generated, 'BD9')
  assert(
    paymentDoc != null && paymentDoc.includes('Счёт на оплату № 36'),
    'платёжный документ заполнен в BD9'
  )
  assert(readXlsxCell(generated, 'BN55') === '20', 'префикс года в BN55')
  assert(readXlsxCell(generated, 'BR55') === '26', 'суффикс года в BR55 (не полный 2026)')

  console.log('Все проверки УПД пройдены')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
