export type CounterpartyType = 'LEGAL' | 'INDIVIDUAL'

export interface CounterpartyRequisites {
  inn: string
  kpp?: string
  ogrn?: string
  name: string
  legalName: string
  legalAddress?: string
  actualAddress?: string
  directorName?: string
  directorPosition?: string
  contactPhone?: string
  contactEmail?: string
  bankAccount?: string
  bankName?: string
  bankBik?: string
  correspondentAccount?: string
  type: CounterpartyType
  status?: string
}

export interface CompanyRegistrationFields {
  companyName: string
  inn: string
  kpp: string
  ogrn: string
  legalAddress: string
  actualAddress: string
  directorName: string
  contactPhone: string
  contactEmail: string
  bankAccount: string
  bankName: string
  bankBik: string
  correspondentAccount: string
}

export interface ClientRequisitesFields {
  clientName: string
  clientLegalName: string
  clientInn: string
  clientKpp: string
  clientOgrn: string
  clientLegalAddress: string
  clientActualAddress: string
  clientDirectorName: string
  clientContactPhone: string
  clientContactEmail: string
  clientBankAccount: string
  clientBankName: string
  clientBankBik: string
  clientCorrespondentAccount: string
}
