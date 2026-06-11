import { redirect } from 'next/navigation'

export default function LegacyNewUpdPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const params = new URLSearchParams()
  params.set('type', 'UPD')
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === 'string') params.set(key, value)
    else if (Array.isArray(value) && value[0]) params.set(key, value[0])
  }
  redirect(`/documents/new?${params.toString()}`)
}
