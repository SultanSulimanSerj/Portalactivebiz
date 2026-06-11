import type { UpdMergedLineItem } from '@/lib/estimate-merge'
import type { UpdDocumentData } from '@/lib/upd-generator'
import {
  UPD_CELLS,
  UPD_ITEM_COLS,
  DEFAULT_OKEI,
  DEFAULT_EXCISE,
} from '@/lib/upd-template-cells'
import { filterNonemptyLineItems } from '@/lib/upd-line-items'
import { roundMoney } from '@/lib/document-editor/upd-calculations'
import type { XlsxCellAssignment } from '../types'

const MONTHS_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
]

export const UPD_MAX_ITEM_ROWS = 9
const TOTAL_ROW = UPD_CELLS.itemStartRow + UPD_MAX_ITEM_ROWS

export function getUnusedItemRows(itemCount: number): number[] {
  const rows: number[] = []
  for (let row = UPD_CELLS.itemStartRow + itemCount; row < TOTAL_ROW; row++) {
    rows.push(row)
  }
  return rows
}

function formatInnKpp(inn: string, kpp?: string) {
  if (!inn) return ''
  return kpp ? `${inn}/${kpp}` : inn
}

function formatMoney(value: number): string {
  return value.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatVatRate(rate: number): string {
  if (rate <= 0) return 'без НДС'
  return `${rate}%`
}

function parseRuDate(dateStr: string) {
  const parts = dateStr.split('.')
  if (parts.length !== 3) return null
  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  const year = parseInt(parts[2], 10)
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null
  return { day, month, year, monthName: MONTHS_GENITIVE[month - 1] || '' }
}

function assign(assignments: XlsxCellAssignment[], address: string, value: string | number | null) {
  assignments.push({ address, value })
}

function clearItemRow(assignments: XlsxCellAssignment[], row: number) {
  for (const col of Object.values(UPD_ITEM_COLS)) {
    assign(assignments, `${col}${row}`, null)
  }
}

function fillItemRow(
  assignments: XlsxCellAssignment[],
  row: number,
  item: UpdMergedLineItem
) {
  assign(assignments, `${UPD_ITEM_COLS.lineNumber}${row}`, item.lineNumber)
  assign(assignments, `${UPD_ITEM_COLS.name}${row}`, item.name)
  assign(assignments, `${UPD_ITEM_COLS.okeiCode}${row}`, DEFAULT_OKEI)
  assign(assignments, `${UPD_ITEM_COLS.unit}${row}`, item.unit || 'шт')
  if (item.quantity !== 1 || item.totalWithoutVat !== item.unitPriceWithoutVat) {
    assign(assignments, `${UPD_ITEM_COLS.quantity}${row}`, item.quantity)
  } else {
    assign(assignments, `${UPD_ITEM_COLS.quantity}${row}`, null)
  }
  assign(assignments, `${UPD_ITEM_COLS.unitPrice}${row}`, formatMoney(item.unitPriceWithoutVat))
  assign(assignments, `${UPD_ITEM_COLS.amountWithoutVat}${row}`, formatMoney(item.totalWithoutVat))
  assign(assignments, `${UPD_ITEM_COLS.excise}${row}`, DEFAULT_EXCISE)
  assign(assignments, `${UPD_ITEM_COLS.vatRate}${row}`, formatVatRate(item.vatRate))
  if (item.vatAmount > 0) {
    assign(assignments, `${UPD_ITEM_COLS.vatAmount}${row}`, formatMoney(item.vatAmount))
  } else {
    assign(assignments, `${UPD_ITEM_COLS.vatAmount}${row}`, null)
  }
  assign(assignments, `${UPD_ITEM_COLS.amountWithVat}${row}`, formatMoney(item.totalWithVat))
}

export interface UpdXlsxPatchPlan {
  assignments: XlsxCellAssignment[]
  hideRows: number[]
  itemCount: number
}

export function buildUpdXlsxPatchPlan(data: UpdDocumentData): UpdXlsxPatchPlan {
  const items = filterNonemptyLineItems(data.items).map((item, index) => ({
    ...item,
    lineNumber: index + 1,
  }))

  if (items.length === 0) {
    throw new Error('Нет позиций для выгрузки в УПД')
  }
  if (items.length > UPD_MAX_ITEM_ROWS) {
    throw new Error(
      `В УПД по форме ФНС не более ${UPD_MAX_ITEM_ROWS} позиций на лист. Разбейте на несколько документов.`
    )
  }

  const assignments: XlsxCellAssignment[] = []

  for (let row = UPD_CELLS.itemStartRow; row < TOTAL_ROW; row++) {
    clearItemRow(assignments, row)
  }

  const totalWithoutVat = roundMoney(items.reduce((s, i) => s + i.totalWithoutVat, 0))
  const totalVat = roundMoney(items.reduce((s, i) => s + i.vatAmount, 0))
  const totalWithVat = roundMoney(items.reduce((s, i) => s + i.totalWithVat, 0))
  const hasVat = totalVat > 0

  const docNum = data.documentNumber.replace(/^UPD-/, '')
  assign(assignments, UPD_CELLS.invoiceNumber, docNum)
  assign(assignments, UPD_CELLS.invoiceDate, data.documentDate)
  assign(assignments, UPD_CELLS.correctionNumber, '—')
  assign(assignments, UPD_CELLS.status, data.status)

  const sellerLabel = data.seller.legalName || data.seller.name
  const buyerLabel = data.buyer.legalName || data.buyer.name

  assign(assignments, UPD_CELLS.sellerName, sellerLabel)
  assign(assignments, UPD_CELLS.sellerAddress, data.seller.address || '—')
  assign(assignments, UPD_CELLS.sellerInnKpp, formatInnKpp(data.seller.inn, data.seller.kpp))
  assign(assignments, UPD_CELLS.shipper, '—')
  assign(assignments, UPD_CELLS.consignee, '—')

  const paymentText =
    data.paymentDocText ||
    (data.contractNumber
      ? `Договор № ${data.contractNumber}${data.contractDate ? ` от ${data.contractDate}` : ''}`
      : '№ —')
  assign(assignments, UPD_CELLS.paymentDoc, paymentText)

  assign(assignments, UPD_CELLS.buyerName, buyerLabel)
  assign(assignments, UPD_CELLS.buyerAddress, data.buyer.address || '—')
  assign(assignments, UPD_CELLS.buyerInnKpp, formatInnKpp(data.buyer.inn, data.buyer.kpp))
  assign(assignments, UPD_CELLS.currency, 'российский рубль, 643')

  items.forEach((item, index) => {
    fillItemRow(assignments, UPD_CELLS.itemStartRow + index, item)
  })

  assign(assignments, UPD_CELLS.totalLabel, `Всего к оплате (${items.length})`)

  assign(assignments, `${UPD_CELLS.totalAmountWithoutVat}${TOTAL_ROW}`, formatMoney(totalWithoutVat))
  assign(assignments, `${UPD_CELLS.totalVat}${TOTAL_ROW}`, formatMoney(totalVat))
  assign(
    assignments,
    `${UPD_CELLS.totalWithVat}${TOTAL_ROW}`,
    formatMoney(hasVat ? totalWithVat : totalWithoutVat)
  )
  assign(assignments, `${UPD_ITEM_COLS.excise}${TOTAL_ROW}`, 'Х')

  const basis =
    data.basisText ||
    (data.contractNumber
      ? `Договор № ${data.contractNumber}${data.contractDate ? ` от ${data.contractDate}` : ''}`
      : `Проект «${data.projectName}»`)
  assign(assignments, UPD_CELLS.basisText, basis)

  const signSeller =
    data.signatorySeller || data.seller.directorName || data.seller.directorPosition || ''
  const signBuyer = data.signatoryBuyer || ''
  const directorTitle = data.seller.directorPosition || 'Генеральный директор'
  if (signSeller) {
    assign(assignments, UPD_CELLS.directorTitle, directorTitle)
    assign(assignments, UPD_CELLS.directorName, signSeller)
    assign(assignments, UPD_CELLS.directorTitle2, directorTitle)
    assign(assignments, UPD_CELLS.directorName2, signBuyer || signSeller)
    assign(assignments, UPD_CELLS.signatory1, signSeller)
    if (signBuyer) {
      assign(assignments, UPD_CELLS.signatory2, signBuyer)
    }
  }

  assign(
    assignments,
    UPD_CELLS.sellerFooter,
    `${sellerLabel}, ${formatInnKpp(data.seller.inn, data.seller.kpp)}`
  )
  assign(
    assignments,
    UPD_CELLS.buyerFooter,
    `${buyerLabel}, ${formatInnKpp(data.buyer.inn, data.buyer.kpp)}`
  )

  const shipDateStr = data.shipDate || data.documentDate
  const parsedDate = parseRuDate(shipDateStr)
  if (parsedDate) {
    assign(assignments, UPD_CELLS.shipDay, String(parsedDate.day))
    assign(assignments, UPD_CELLS.shipMonth, parsedDate.monthName)
    assign(assignments, UPD_CELLS.shipYear, String(parsedDate.year))
  }

  return {
    assignments,
    hideRows: getUnusedItemRows(items.length),
    itemCount: items.length,
  }
}

/** @deprecated используйте buildUpdXlsxPatchPlan */
export function buildUpdCellAssignments(data: UpdDocumentData): XlsxCellAssignment[] {
  return buildUpdXlsxPatchPlan(data).assignments
}
