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
    const { status, comment } = body

    const approval = await prisma.approval.update({
      where: { id: params.id },
      data: {
        status,
        comment: comment || null,
        ...(status === 'APPROVED' && { approvedAt: new Date() }),
        ...(status === 'REJECTED' && { rejectedAt: new Date() })
      },
      include: {
        document: {
          select: {
            id: true,
            title: true
          }
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(approval)
  } catch (error) {
    console.error('Error updating approval:', error)
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

    await prisma.approval.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting approval:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
