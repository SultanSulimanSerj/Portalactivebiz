import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/auth-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; estimateId: string; itemId: string } }
) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canViewEstimates')
    
    if (!allowed || !user) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    // Пока что возвращаем заглушку
    return NextResponse.json({ error: 'Позиция не найдена' }, { status: 404 })
  } catch (error) {
    console.error('Error fetching estimate item:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; estimateId: string; itemId: string } }
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
      id: params.itemId,
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
    console.error('Error updating estimate item:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; estimateId: string; itemId: string } }
) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canDeleteEstimates')
    
    if (!allowed || !user) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    // Пока что возвращаем заглушку
    return NextResponse.json({ message: 'Позиция удалена' })
  } catch (error) {
    console.error('Error deleting estimate item:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
