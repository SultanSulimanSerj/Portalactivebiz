import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-api'
import { prisma } from '@/lib/prisma'

// POST /api/notifications/bulk - Массовые операции с уведомлениями
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, notificationIds } = body

    if (!action || !notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    let result

    switch (action) {
      case 'markAsRead':
        result = await prisma.notification.updateMany({
          where: {
            id: { in: notificationIds },
            userId: user.id
          },
          data: { isRead: true }
        })
        break

      case 'markAsUnread':
        result = await prisma.notification.updateMany({
          where: {
            id: { in: notificationIds },
            userId: user.id
          },
          data: { isRead: false }
        })
        break

      case 'delete':
        result = await prisma.notification.deleteMany({
          where: {
            id: { in: notificationIds },
            userId: user.id
          }
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      affectedCount: result.count 
    })
  } catch (error) {
    console.error('Error in bulk notification operation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
