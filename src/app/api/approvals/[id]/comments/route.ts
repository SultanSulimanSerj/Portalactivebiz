import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-api'
import { prisma } from '@/lib/prisma'
import { notifyNewComment } from '@/lib/notifications'

// GET /api/approvals/[id]/comments - Получить все комментарии согласования
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const comments = await prisma.approvalComment.findMany({
      where: {
        approvalId: params.id
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching approval comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/approvals/[id]/comments - Добавить комментарий к согласованию
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content } = body

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const comment = await prisma.approvalComment.create({
      data: {
        content,
        approvalId: params.id,
        userId: user.id
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Добавляем запись в историю
    await prisma.approvalHistory.create({
      data: {
        action: 'commented',
        changes: {
          comment: content
        },
        approvalId: params.id,
        userId: user.id
      }
    })

    // Отправляем уведомления участникам
    try {
      await notifyNewComment(params.id, user.id, content)
    } catch (notificationError) {
      console.error('Error sending notifications:', notificationError)
      // Не прерываем выполнение, если уведомления не отправились
    }

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating approval comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
