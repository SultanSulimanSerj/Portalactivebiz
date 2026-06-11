/** Общие сущности канонической модели документов */

export interface DocumentParty {
  name: string
  legalName: string
  inn: string
  kpp?: string
  address: string
  directorName?: string
  directorPosition?: string
  bankName?: string
  bankBik?: string
  bankAccount?: string
  correspondentAccount?: string
  bankCity?: string
}

export interface DocumentLineItem {
  lineNumber: number
  name: string
  description?: string | null
  unit: string
  quantity: number
  unitPriceWithoutVat: number
  totalWithoutVat: number
  vatRate: number
  vatAmount: number
  totalWithVat: number
}

export interface DocumentMoneyTotals {
  totalWithoutVat: number
  totalVat: number
  totalWithVat: number
  hasVat: boolean
}

export interface DocumentMeta {
  documentNumber: string
  documentDate: string
  projectName: string
  contractNumber?: string
  contractDate?: string
}
