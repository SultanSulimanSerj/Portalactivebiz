import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/auth-middleware'
import { verifyEstimateAccess } from '@/lib/access-control'
import { prisma } from '@/lib/prisma'
import {
  recalculateEstimateTotals,
  serializeEstimateItem,
} from '@/lib/estimate-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; estimateId: string; itemId: string } }
) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canViewEstimates')

    if (!allowed || !user) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    const hasAccess = await verifyEstimateAccess(user, params.id, params.estimateId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Смета не найдена' }, { status: 404 })
    }

    const item = await prisma.estimateItem.findFirst({
      where: { id: params.itemId, estimateId: params.estimateId },
    })

    if (!item) {
      return NextResponse.json({ error: 'Позиция не найдена' }, { status: 404 })
    }

    return NextResponse.json(serializeEstimateItem(item))
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

    const hasAccess = await verifyEstimateAccess(user, params.id, params.estimateId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Смета не найдена' }, { status: 404 })
    }

    const existing = await prisma.estimateItem.findFirst({
      where: { id: params.itemId, estimateId: params.estimateId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Позиция не найдена' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, notes, quantity, unit, unitPrice, costPrice, category } = body

    if (!name || quantity === undefined || unitPrice === undefined) {
      return NextResponse.json(
        { error: 'Все обязательные поля должны быть заполнены' },
        { status: 400 }
      )
    }

    const qty = Number(quantity)
    const price = Number(unitPrice)
    const cost = Number(costPrice ?? existing.costPrice)
    const total = qty * price

    const item = await prisma.estimateItem.update({
      where: { id: params.itemId },
      data: {
        name,
        description: description !== undefined ? description || null : undefined,
        notes: notes !== undefined ? notes || null : undefined,
        quantity: qty,
        unit: unit || existing.unit,
        unitPrice: price,
        costPrice: cost,
        total,
        category: category || existing.category,
        updatedAt: new Date(),
      },
    })

    await recalculateEstimateTotals(params.estimateId)

    return NextResponse.json(serializeEstimateItem(item))
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

    const hasAccess = await verifyEstimateAccess(user, params.id, params.estimateId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Смета не найдена' }, { status: 404 })
    }

    const existing = await prisma.estimateItem.findFirst({
      where: { id: params.itemId, estimateId: params.estimateId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Позиция не найдена' }, { status: 404 })
    }

    await prisma.estimateItem.delete({ where: { id: params.itemId } })
    await recalculateEstimateTotals(params.estimateId)

    return NextResponse.json({ message: 'Позиция удалена' })
  } catch (error) {
    console.error('Error deleting estimate item:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
