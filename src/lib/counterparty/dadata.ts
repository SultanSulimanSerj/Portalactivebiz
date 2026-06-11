import type { CounterpartyRequisites, CounterpartyType } from './types'

interface DaDataPartyName {
  short_with_opf?: string | null
  full_with_opf?: string | null
  short?: string | null
  full?: string | null
}

interface DaDataPartyManagement {
  name?: string | null
  post?: string | null
}

interface DaDataPartyAddress {
  value?: string | null
  unrestricted_value?: string | null
}

interface DaDataPartyFinance {
  account?: string | null
  bank?: {
    name?: string | null
    bic?: string | null
    correspondent_account?: string | null
  } | null
}

interface DaDataPartyData {
  inn?: string | null
  kpp?: string | null
  ogrn?: string | null
  ogrnip?: string | null
  type?: 'LEGAL' | 'INDIVIDUAL' | null
  name?: DaDataPartyName | null
  address?: DaDataPartyAddress | null
  management?: DaDataPartyManagement | null
  fio?: {
    surname?: string | null
    name?: string | null
    patronymic?: string | null
  } | null
  phones?: Array<string | { value?: string | null }> | null
  emails?: Array<string | { value?: string | null }> | null
  finance?: DaDataPartyFinance | null
  state?: {
    status?: string | null
  } | null
}

interface DaDataFindPartyResponse {
  suggestions?: Array<{
    value?: string
    data?: DaDataPartyData
  }>
}

function pickContact(values?: Array<string | { value?: string | null }> | null): string | undefined {
  if (!values?.length) return undefined
  const first = values[0]
  if (typeof first === 'string') return first.trim() || undefined
  return first.value?.trim() || undefined
}

function buildDirectorName(data: DaDataPartyData): string | undefined {
  const managementName = data.management?.name?.trim()
  if (managementName) return managementName

  if (data.type === 'INDIVIDUAL' && data.fio) {
    const parts = [data.fio.surname, data.fio.name, data.fio.patronymic].filter(Boolean)
    if (parts.length) return parts.join(' ')
  }

  return undefined
}

export function mapDaDataPartyToRequisites(party: DaDataPartyData): CounterpartyRequisites {
  const type: CounterpartyType = party.type === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'LEGAL'
  const name = party.name?.short_with_opf || party.name?.short || party.name?.full_with_opf || ''
  const legalName = party.name?.full_with_opf || party.name?.full || name
  const legalAddress = party.address?.unrestricted_value || party.address?.value || undefined

  return {
    inn: party.inn || '',
    kpp: party.kpp || undefined,
    ogrn: party.ogrn || party.ogrnip || undefined,
    name,
    legalName,
    legalAddress,
    actualAddress: legalAddress,
    directorName: buildDirectorName(party),
    directorPosition: party.management?.post || undefined,
    contactPhone: pickContact(party.phones),
    contactEmail: pickContact(party.emails),
    bankAccount: party.finance?.account || undefined,
    bankName: party.finance?.bank?.name || undefined,
    bankBik: party.finance?.bank?.bic || undefined,
    correspondentAccount: party.finance?.bank?.correspondent_account || undefined,
    type,
    status: party.state?.status || undefined,
  }
}

export async function fetchPartyByInnFromDaData(inn: string): Promise<CounterpartyRequisites | null> {
  const token = process.env.DADATA_API_KEY?.trim()
  if (!token) {
    throw new Error('DADATA_NOT_CONFIGURED')
  }

  const response = await fetch(
    'https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({ query: inn }),
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    throw new Error(`DADATA_HTTP_${response.status}`)
  }

  const payload = (await response.json()) as DaDataFindPartyResponse
  const party = payload.suggestions?.[0]?.data
  if (!party?.inn) return null

  return mapDaDataPartyToRequisites(party)
}
