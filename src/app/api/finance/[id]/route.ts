import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-api'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, category, description, amount, date, projectId } = body

    // Валидация суммы если она передана
    let parsedAmount: number | undefined
    if (amount !== undefined) {
      parsedAmount = parseFloat(amount)
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        return NextResponse.json({ error: 'Некорректная сумма' }, { status: 400 })
      }
    }

    const finance = await prisma.finance.update({
      where: { id: params.id },
      data: {
        ...(type && { type }),
        ...(category && { category }),
        ...(description !== undefined && { description: description || null }),
        ...(parsedAmount !== undefined && { amount: parsedAmount }),
        ...(date && { date: new Date(date) }),
        ...(projectId !== undefined && { projectId: projectId || null }),
        updatedAt: new Date()
      },
      include: {
        project: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json(finance)
  } catch (error) {
    console.error('Error updating finance record:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем, существует ли запись
    const existingRecord = await prisma.finance.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: { companyId: true }
        }
      }
    })

    if (!existingRecord) {
      // Если запись уже удалена, возвращаем успех (идемпотентность)
      return NextResponse.json({ success: true, message: 'Record already deleted' })
    }

    // Проверяем, что запись принадлежит компании пользователя
    if (existingRecord.project.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.finance.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting finance record:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
