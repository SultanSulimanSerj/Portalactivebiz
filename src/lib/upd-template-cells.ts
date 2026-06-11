/** Ячейки официальной формы УПД (Постановление № 1137), лист 1 */
export const UPD_CELLS = {
  invoiceNumber: 'AM1',
  invoiceDate: 'BD1',
  correctionNumber: 'BR2',
  status: 'I6',
  sellerName: 'BA4',
  sellerAddress: 'BA5',
  sellerInnKpp: 'BA6',
  shipper: 'BA7',
  consignee: 'BA8',
  paymentDoc: 'BA9',
  buyerName: 'BA19',
  buyerAddress: 'BA20',
  buyerInnKpp: 'BA21',
  currency: 'BA22',
  itemStartRow: 30,
  totalLabel: 'U39',
  totalLabelCol: 'U',
  totalAmountWithoutVat: 'CJ',
  totalVat: 'DM',
  totalWithVat: 'DZ',
  directorTitle: 'B53',
  directorName: 'BA53',
  directorTitle2: 'B60',
  directorName2: 'BA60',
  basisText: 'AR48',
  sellerFooter: 'B63',
  buyerFooter: 'CK63',
  signatory1: 'BO41',
  signatory2: 'BO42',
  shipDay: 'AI55',
  shipMonth: 'AO55',
  shipYear: 'BR55',
} as const

/** Колонки строки товара */
export const UPD_ITEM_COLS = {
  lineNumber: 'A',
  name: 'T',
  okeiCode: 'BA',
  unit: 'BG',
  quantity: 'BP',
  unitPrice: 'BY',
  amountWithoutVat: 'CJ',
  excise: 'CY',
  vatRate: 'DF',
  vatAmount: 'DM',
  amountWithVat: 'DZ',
} as const

export const DEFAULT_OKEI = '796'
export const DEFAULT_EXCISE = 'без акциза'
