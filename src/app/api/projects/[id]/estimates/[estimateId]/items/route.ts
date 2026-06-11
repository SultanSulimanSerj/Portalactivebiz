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
  { params }: { params: { id: string; estimateId: string } }
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

    const items = await prisma.estimateItem.findMany({
      where: { estimateId: params.estimateId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(items.map(serializeEstimateItem))
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

    const hasAccess = await verifyEstimateAccess(user, params.id, params.estimateId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Смета не найдена' }, { status: 404 })
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
    const cost = Number(costPrice || 0)
    const total = qty * price

    const item = await prisma.estimateItem.create({
      data: {
        name,
        description: description || null,
        notes: notes || null,
        quantity: qty,
        unit: unit || 'шт',
        unitPrice: price,
        costPrice: cost,
        total,
        category: category || 'Материалы',
        estimateId: params.estimateId,
        companyId: user.companyId,
      },
    })

    await recalculateEstimateTotals(params.estimateId)

    return NextResponse.json(serializeEstimateItem(item), { status: 201 })
  } catch (error) {
    console.error('Error creating estimate item:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
