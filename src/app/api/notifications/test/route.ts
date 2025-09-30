import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-api'
import { createNotification, createProjectNotification, createSystemNotification } from '@/lib/notifications'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Создаем несколько тестовых уведомлений
    const notifications = []

    // 1. Личное уведомление
    const personalNotification = await createNotification({
      userId: user.id,
      title: 'Добро пожаловать!',
      message: 'Вы успешно вошли в систему управления проектами.',
      type: 'success'
    })
    notifications.push(personalNotification)

    // 2. Уведомление о новом проекте (если есть проекты)
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { creatorId: user.id },
          { users: { some: { userId: user.id } } }
        ]
      },
      take: 1
    })

    if (projects.length > 0) {
      const projectNotification = await createProjectNotification(
        projects[0].id,
        'Обновление проекта',
        'В проект были внесены изменения. Проверьте детали.',
        'info'
      )
      notifications.push(...projectNotification)
    }

    // 3. Системное уведомление
    if (user.companyId) {
      const systemNotification = await createSystemNotification(
        user.companyId,
        'Системное обновление',
        'Система была обновлена. Новые функции доступны в разделе "Настройки".',
        'info'
      )
      notifications.push(...systemNotification)
    }

    return NextResponse.json({ 
      success: true, 
      message: `Создано ${notifications.length} уведомлений`,
      notifications: notifications.length
    })
  } catch (error) {
    console.error('Error creating test notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
