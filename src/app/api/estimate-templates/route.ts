import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/auth-middleware'
import { ESTIMATE_TEMPLATES } from '@/lib/estimate-templates'

export async function GET(request: NextRequest) {
  try {
    const { allowed, error } = await checkPermission(request, 'canViewEstimates')

    if (!allowed) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    return NextResponse.json({ templates: ESTIMATE_TEMPLATES })
  } catch (err) {
    console.error('Error fetching estimate templates:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
