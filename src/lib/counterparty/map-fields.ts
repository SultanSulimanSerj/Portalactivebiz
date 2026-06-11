import type {
  ClientRequisitesFields,
  CompanyRegistrationFields,
  CounterpartyRequisites,
} from './types'

function pickString(...values: Array<string | undefined | null>): string {
  for (const value of values) {
    if (value?.trim()) return value.trim()
  }
  return ''
}

export function toCompanyRegistrationFields(
  data: CounterpartyRequisites
): Partial<CompanyRegistrationFields> {
  return {
    companyName: data.name,
    inn: data.inn,
    kpp: data.kpp || '',
    ogrn: data.ogrn || '',
    legalAddress: data.legalAddress || '',
    actualAddress: pickString(data.actualAddress, data.legalAddress),
    directorName: data.directorName || '',
    contactPhone: data.contactPhone || '',
    contactEmail: data.contactEmail || '',
    bankAccount: data.bankAccount || '',
    bankName: data.bankName || '',
    bankBik: data.bankBik || '',
    correspondentAccount: data.correspondentAccount || '',
  }
}

export function toClientRequisitesFields(
  data: CounterpartyRequisites
): Partial<ClientRequisitesFields> {
  return {
    clientName: data.name,
    clientLegalName: data.legalName,
    clientInn: data.inn,
    clientKpp: data.kpp || '',
    clientOgrn: data.ogrn || '',
    clientLegalAddress: data.legalAddress || '',
    clientActualAddress: pickString(data.actualAddress, data.legalAddress),
    clientDirectorName: data.directorName || '',
    clientContactPhone: data.contactPhone || '',
    clientContactEmail: data.contactEmail || '',
    clientBankAccount: data.bankAccount || '',
    clientBankName: data.bankName || '',
    clientBankBik: data.bankBik || '',
    clientCorrespondentAccount: data.correspondentAccount || '',
  }
}
