import { redirect } from 'next/navigation'

const TYPE_MAP: Record<string, string> = {
  upd: 'UPD',
  invoice: 'INVOICE',
  contract: 'CONTRACT',
  'commercial-offer': 'COMMERCIAL_OFFER',
}

export default function LegacyGeneratePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const params = new URLSearchParams()
  const docType = searchParams.documentType
  const rawType = typeof docType === 'string' ? docType : Array.isArray(docType) ? docType[0] : null
  if (rawType && TYPE_MAP[rawType]) {
    params.set('type', TYPE_MAP[rawType])
  } else {
    params.set('type', 'CONTRACT')
  }

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === 'documentType') continue
    if (typeof value === 'string') params.set(key, value)
    else if (Array.isArray(value) && value[0]) params.set(key, value[0])
  }

  redirect(`/documents/new?${params.toString()}`)
}
