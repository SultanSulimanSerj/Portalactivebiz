import { fetchPartyByInnFromDaData } from './dadata'
import { getInnValidationError, normalizeInn } from './inn'
import type { CounterpartyRequisites } from './types'

export class CounterpartyLookupError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'INVALID_INN'
      | 'NOT_FOUND'
      | 'DADATA_NOT_CONFIGURED'
      | 'UPSTREAM_ERROR'
  ) {
    super(message)
    this.name = 'CounterpartyLookupError'
  }
}

export async function lookupCounterpartyByInn(inn: string): Promise<CounterpartyRequisites> {
  const normalized = normalizeInn(inn)
  const validationError = getInnValidationError(normalized)
  if (validationError) {
    throw new CounterpartyLookupError(validationError, 'INVALID_INN')
  }

  try {
    const result = await fetchPartyByInnFromDaData(normalized)
    if (!result) {
      throw new CounterpartyLookupError(
        'Организация с таким ИНН не найдена',
        'NOT_FOUND'
      )
    }

    if (result.status && result.status !== 'ACTIVE') {
      throw new CounterpartyLookupError(
        'Организация найдена, но не действует (ликвидирована или в процессе ликвидации)',
        'NOT_FOUND'
      )
    }

    return result
  } catch (error) {
    if (error instanceof CounterpartyLookupError) throw error
    if (error instanceof Error && error.message === 'DADATA_NOT_CONFIGURED') {
      throw new CounterpartyLookupError(
        'Поиск по ИНН не настроен. Добавьте DADATA_API_KEY в переменные окружения.',
        'DADATA_NOT_CONFIGURED'
      )
    }
    throw new CounterpartyLookupError(
      'Не удалось получить данные контрагента. Попробуйте позже.',
      'UPSTREAM_ERROR'
    )
  }
}
