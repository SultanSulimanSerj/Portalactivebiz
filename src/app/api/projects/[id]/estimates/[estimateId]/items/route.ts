import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/auth-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; estimateId: string } }
) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canViewEstimates')
    
    if (!allowed || !user) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    // Пока что возвращаем пустой массив
    return NextResponse.json([])
  } catch (error) {
    console.error('Error fetching estimate items:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; estimateId: string } }
) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canEditEstimates')
    
    if (!allowed || !user) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, quantity, unit, unitPrice, category } = body

    if (!name || !quantity || !unitPrice) {
      return NextResponse.json({ error: 'Все обязательные поля должны быть заполнены' }, { status: 400 })
    }

    // Пока что возвращаем заглушку
    const item = {
      id: `item_${Date.now()}`,
      name,
      description: description || '',
      quantity: Number(quantity),
      unit,
      unitPrice: Number(unitPrice),
      total: Number(quantity) * Number(unitPrice),
      category: category || 'Материалы'
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error creating estimate item:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
