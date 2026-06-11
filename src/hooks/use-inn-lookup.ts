'use client'

import { useCallback, useState } from 'react'
import type { CounterpartyRequisites } from '@/lib/counterparty/types'
import { normalizeInn } from '@/lib/counterparty/inn'

interface LookupResponse {
  data?: CounterpartyRequisites
  error?: string
  code?: string
}

export function useInnLookup() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [found, setFound] = useState<CounterpartyRequisites | null>(null)

  const lookup = useCallback(async (inn: string): Promise<CounterpartyRequisites | null> => {
    const normalized = normalizeInn(inn)
    if (!normalized) {
      setError('Введите ИНН')
      setFound(null)
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/counterparty/lookup?inn=${encodeURIComponent(normalized)}`)
      const payload = (await response.json()) as LookupResponse

      if (!response.ok) {
        setFound(null)
        setError(payload.error || 'Не удалось найти контрагента')
        return null
      }

      if (!payload.data) {
        setFound(null)
        setError('Контрагент не найден')
        return null
      }

      setFound(payload.data)
      return payload.data
    } catch {
      setFound(null)
      setError('Ошибка сети при поиске по ИНН')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setError(null)
    setFound(null)
  }, [])

  return { lookup, loading, error, found, reset }
}
