import fs from 'fs'
import path from 'path'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import type { InvoiceDocumentData } from '../fns-form-types'
import type { DocumentLineItem, DocumentParty } from '@/lib/document-editor/common'
import { directorShortName, rublesToWords } from '@/lib/number-to-words-ru'

const TEMPLATE_PATH = path.join(
  process.cwd(),
  'assets/templates/invoice-template.docx'
)

function formatMoney(value: number): string {
  return value.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function buildPartyLine(party: DocumentParty): string {
  const name = party.legalName || party.name
  const parts = [name]
  if (party.inn) parts.push(`ИНН ${party.inn}`)
  if (party.kpp) parts.push(`КПП ${party.kpp}`)
  if (party.address) parts.push(party.address)
  return parts.join(', ')
}

function buildSellerAddressLine(party: DocumentParty): string {
  const name = party.legalName || party.name
  if (party.address) return `${name}, ${party.address}`
  return name
}

function itemUnitPrice(item: DocumentLineItem): number {
  if (!item.quantity) return 0
  return item.totalWithVat / item.quantity
}

function buildItemsSummary(itemsCount: number, total: number): string {
  const rubles = Math.floor(total)
  const kopecks = Math.round((total - rubles) * 100)
  return `Всего наименований ${itemsCount} на сумму ${rubles} рублей ${String(kopecks).padStart(2, '0')} копеек`
}

function buildPaymentTerms(data: InvoiceDocumentData): string {
  const parts: string[] = []
  if (data.paymentPurpose?.trim()) parts.push(data.paymentPurpose.trim())
  if (data.dueDate?.trim()) parts.push(`Оплатить до ${data.dueDate.trim()}`)
  return parts.join('. ')
}

function buildTemplateData(data: InvoiceDocumentData) {
  const seller = data.seller
  const total = data.totals.totalWithVat
  const hasVat = data.totals.hasVat && data.totals.totalVat > 0

  return {
    documentNumber: data.documentNumber,
    documentDate: data.documentDate,
    sellerAddressLine: buildSellerAddressLine(seller),
    bankName: seller.bankName || '',
    bankBik: seller.bankBik || '',
    bankCity: seller.bankCity || '',
    correspondentAccount: seller.correspondentAccount || '',
    sellerInn: seller.inn || '',
    sellerKpp: seller.kpp || '',
    sellerLegalName: seller.legalName || seller.name || '',
    bankAccount: seller.bankAccount || '',
    buyerLine: buildPartyLine(data.buyer),
    items: data.items.map((item) => ({
      lineNumber: String(item.lineNumber),
      name: item.name,
      quantity: String(item.quantity),
      unit: item.unit,
      unitPrice: formatMoney(itemUnitPrice(item)),
      total: formatMoney(item.totalWithVat),
    })),
    totalFormatted: formatMoney(total),
    vatLabel: hasVat ? 'НДС' : 'Без налога (НДС)',
    vatDisplay: hasVat ? formatMoney(data.totals.totalVat) : '-',
    itemsSummary: buildItemsSummary(data.items.length, total),
    totalInWords: rublesToWords(total),
    paymentTerms: buildPaymentTerms(data),
    directorShortName: directorShortName(seller.directorName),
  }
}

export async function renderInvoiceDocx(data: InvoiceDocumentData): Promise<Buffer> {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(
      `Шаблон счёта не найден: ${TEMPLATE_PATH}. Запустите: npx tsx scripts/prepare-invoice-template.ts`
    )
  }

  const content = fs.readFileSync(TEMPLATE_PATH)
  const zip = new PizZip(content)
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => '',
  })

  doc.render(buildTemplateData(data))
  return doc.getZip().generate({ type: 'nodebuffer' })
}
