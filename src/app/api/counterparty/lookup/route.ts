import { NextRequest, NextResponse } from 'next/server'
import { CounterpartyLookupError, lookupCounterpartyByInn } from '@/lib/counterparty/lookup'
import { normalizeInn } from '@/lib/counterparty/inn'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    const inn = normalizeInn(request.nextUrl.searchParams.get('inn') || '')
    if (!inn) {
      return NextResponse.json({ error: 'Укажите параметр inn' }, { status: 400 })
    }

    const ip = getClientIp(request)
    const rateLimit = await checkRateLimit(`counterparty-inn:${ip}`, 60, 60 * 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Слишком много запросов. Попробуйте позже.' },
        { status: 429 }
      )
    }

    const data = await lookupCounterpartyByInn(inn)
    return NextResponse.json({ data })
  } catch (error) {
    if (error instanceof CounterpartyLookupError) {
      const status =
        error.code === 'INVALID_INN'
          ? 400
          : error.code === 'NOT_FOUND'
            ? 404
            : error.code === 'DADATA_NOT_CONFIGURED'
              ? 503
              : 502
      return NextResponse.json({ error: error.message, code: error.code }, { status })
    }

    console.error('Counterparty lookup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
