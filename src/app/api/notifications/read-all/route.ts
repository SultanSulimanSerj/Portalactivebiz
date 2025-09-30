import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-api'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Отмечаем все уведомления пользователя как прочитанные
    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false
      },
      data: { isRead: true }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
