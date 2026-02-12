import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-api'
import { prisma } from '@/lib/prisma'
import { generateId } from '@/lib/id-generator'

// GET - получить настройки уведомлений компании
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.companyId) {
      return NextResponse.json({ error: 'Компания не найдена' }, { status: 404 })
    }

    // Получаем или создаём настройки
    let settings = await prisma.notificationSettings.findUnique({
      where: { companyId: user.companyId }
    })

    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: {
          id: generateId(),
          companyId: user.companyId
        }
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json({ error: 'Ошибка получения настроек' }, { status: 500 })
  }
}

// PUT - обновить настройки уведомлений
export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.companyId) {
      return NextResponse.json({ error: 'Компания не найдена' }, { status: 404 })
    }

    // Проверяем права (только админ или руководитель)
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const body = await request.json()
    const {
      deadlineReminderDays,
      deadlineReminderEnabled,
      overdueNotifyEnabled,
      overdueNotifyManager,
      budgetWarningPercent,
      budgetWarningEnabled,
      invoiceOverdueEnabled
    } = body

    // Получаем или создаём настройки
    let settings = await prisma.notificationSettings.findUnique({
      where: { companyId: user.companyId }
    })

    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: {
          id: generateId(),
          companyId: user.companyId,
          deadlineReminderDays: deadlineReminderDays ?? 3,
          deadlineReminderEnabled: deadlineReminderEnabled ?? true,
          overdueNotifyEnabled: overdueNotifyEnabled ?? true,
          overdueNotifyManager: overdueNotifyManager ?? true,
          budgetWarningPercent: budgetWarningPercent ?? 80,
          budgetWarningEnabled: budgetWarningEnabled ?? true,
          invoiceOverdueEnabled: invoiceOverdueEnabled ?? true
        }
      })
    } else {
      settings = await prisma.notificationSettings.update({
        where: { id: settings.id },
        data: {
          ...(deadlineReminderDays !== undefined && { deadlineReminderDays }),
          ...(deadlineReminderEnabled !== undefined && { deadlineReminderEnabled }),
          ...(overdueNotifyEnabled !== undefined && { overdueNotifyEnabled }),
          ...(overdueNotifyManager !== undefined && { overdueNotifyManager }),
          ...(budgetWarningPercent !== undefined && { budgetWarningPercent }),
          ...(budgetWarningEnabled !== undefined && { budgetWarningEnabled }),
          ...(invoiceOverdueEnabled !== undefined && { invoiceOverdueEnabled })
        }
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating notification settings:', error)
    return NextResponse.json({ error: 'Ошибка сохранения настроек' }, { status: 500 })
  }
}
