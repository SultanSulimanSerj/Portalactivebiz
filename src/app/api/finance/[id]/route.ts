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

    const finance = await prisma.finance.update({
      where: { id: params.id },
      data: {
        ...(type && { type }),
        ...(category && { category }),
        ...(description !== undefined && { description: description || null }),
        ...(amount && { amount: parseFloat(amount) }),
        ...(date && { date: new Date(date) }),
        ...(projectId !== undefined && { projectId: projectId || null })
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

    await prisma.finance.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting finance record:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
