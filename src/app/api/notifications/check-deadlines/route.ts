import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateId } from '@/lib/id-generator'

// API для проверки дедлайнов и генерации уведомлений
// Может вызываться по cron или вручную

export async function POST(request: NextRequest) {
  try {
    // Опционально: проверка секретного ключа для cron
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    const cronSecret = process.env.CRON_SECRET
    
    // Если установлен CRON_SECRET, проверяем его
    if (cronSecret && secret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = {
      deadlineReminders: 0,
      overdueStages: 0,
      budgetWarnings: 0,
      overdueInvoices: 0
    }

    // Получаем все компании с их настройками
    const companies = await prisma.company.findMany({
      where: { isActive: true },
      include: {
        notificationSettings: true
      }
    })

    for (const company of companies) {
      // Получаем или создаём настройки по умолчанию
      let settings = company.notificationSettings
      if (!settings) {
        settings = await prisma.notificationSettings.create({
          data: {
            id: generateId(),
            companyId: company.id
          }
        })
      }

      // 1. Проверка дедлайнов этапов (напоминание за N дней)
      if (settings.deadlineReminderEnabled) {
        const reminderDate = new Date()
        reminderDate.setDate(reminderDate.getDate() + settings.deadlineReminderDays)
        
        const upcomingStages = await prisma.workStage.findMany({
          where: {
            companyId: company.id,
            status: { in: ['NOT_STARTED', 'IN_PROGRESS'] },
            plannedEnd: {
              gte: new Date(),
              lte: reminderDate
            }
          },
          include: {
            project: { select: { id: true, name: true, creatorId: true } },
            responsible: { select: { id: true, name: true } }
          }
        })

        for (const stage of upcomingStages) {
          const daysLeft = Math.ceil((new Date(stage.plannedEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          
          // Уведомляем ответственного
          if (stage.responsibleId) {
            // Проверяем, не было ли уже такого уведомления сегодня
            const existingNotification = await prisma.notification.findFirst({
              where: {
                userId: stage.responsibleId,
                type: 'DEADLINE_REMINDER',
                actionType: 'stage',
                actionId: stage.id,
                createdAt: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
              }
            })

            if (!existingNotification) {
              await prisma.notification.create({
                data: {
                  id: generateId(),
                  title: `Приближается дедлайн: ${stage.name}`,
                  message: `Этап "${stage.name}" проекта "${stage.project.name}" должен быть завершён через ${daysLeft} дн.`,
                  type: 'DEADLINE_REMINDER',
                  actionType: 'stage',
                  actionId: stage.id,
                  projectId: stage.projectId,
                  userId: stage.responsibleId,
                  companyId: company.id
                }
              })
              results.deadlineReminders++
            }
          }
        }
      }

      // 2. Проверка просроченных этапов
      if (settings.overdueNotifyEnabled) {
        const overdueStages = await prisma.workStage.findMany({
          where: {
            companyId: company.id,
            status: { in: ['NOT_STARTED', 'IN_PROGRESS', 'PAUSED'] },
            plannedEnd: { lt: new Date() }
          },
          include: {
            project: { select: { id: true, name: true, creatorId: true } },
            responsible: { select: { id: true, name: true } }
          }
        })

        for (const stage of overdueStages) {
          const daysOverdue = Math.ceil((Date.now() - new Date(stage.plannedEnd).getTime()) / (1000 * 60 * 60 * 24))
          
          // Уведомляем ответственного
          if (stage.responsibleId) {
            const existingNotification = await prisma.notification.findFirst({
              where: {
                userId: stage.responsibleId,
                type: 'DEADLINE_OVERDUE',
                actionType: 'stage',
                actionId: stage.id,
                createdAt: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
              }
            })

            if (!existingNotification) {
              await prisma.notification.create({
                data: {
                  id: generateId(),
                  title: `Просрочен этап: ${stage.name}`,
                  message: `Этап "${stage.name}" проекта "${stage.project.name}" просрочен на ${daysOverdue} дн.!`,
                  type: 'DEADLINE_OVERDUE',
                  actionType: 'stage',
                  actionId: stage.id,
                  projectId: stage.projectId,
                  userId: stage.responsibleId,
                  companyId: company.id
                }
              })
              results.overdueStages++
            }
          }

          // Уведомляем руководителя проекта
          if (settings.overdueNotifyManager && stage.project.creatorId && stage.project.creatorId !== stage.responsibleId) {
            const existingNotification = await prisma.notification.findFirst({
              where: {
                userId: stage.project.creatorId,
                type: 'DEADLINE_OVERDUE',
                actionType: 'stage',
                actionId: stage.id,
                createdAt: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
              }
            })

            if (!existingNotification) {
              await prisma.notification.create({
                data: {
                  id: generateId(),
                  title: `Просрочен этап в вашем проекте`,
                  message: `Этап "${stage.name}" проекта "${stage.project.name}" просрочен на ${daysOverdue} дн.`,
                  type: 'DEADLINE_OVERDUE',
                  actionType: 'stage',
                  actionId: stage.id,
                  projectId: stage.projectId,
                  userId: stage.project.creatorId,
                  companyId: company.id
                }
              })
              results.overdueStages++
            }
          }
        }
      }

      // 3. Проверка бюджета проектов
      if (settings.budgetWarningEnabled) {
        const projects = await prisma.project.findMany({
          where: {
            companyId: company.id,
            status: { in: ['PLANNING', 'ACTIVE'] },
            budget: { not: null }
          },
          include: {
            finances: {
              where: { type: 'EXPENSE' }
            },
            creator: { select: { id: true, name: true } }
          }
        })

        for (const project of projects) {
          if (!project.budget || !project.creatorId) continue

          const totalExpenses = project.finances.reduce(
            (sum, f) => sum + Number(f.amount), 
            0
          )
          const budgetUsedPercent = (totalExpenses / Number(project.budget)) * 100

          if (budgetUsedPercent >= settings.budgetWarningPercent) {
            const existingNotification = await prisma.notification.findFirst({
              where: {
                userId: project.creatorId,
                type: 'BUDGET_WARNING',
                actionType: 'project',
                actionId: project.id,
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Не чаще раза в неделю
                }
              }
            })

            if (!existingNotification) {
              await prisma.notification.create({
                data: {
                  id: generateId(),
                  title: `Внимание: бюджет проекта`,
                  message: `Бюджет проекта "${project.name}" израсходован на ${budgetUsedPercent.toFixed(0)}%`,
                  type: 'BUDGET_WARNING',
                  actionType: 'project',
                  actionId: project.id,
                  projectId: project.id,
                  userId: project.creatorId,
                  companyId: company.id
                }
              })
              results.budgetWarnings++
            }
          }
        }
      }

      // 4. Проверка просроченных счетов
      if (settings.invoiceOverdueEnabled) {
        const overdueInvoices = await prisma.finance.findMany({
          where: {
            companyId: company.id,
            type: 'EXPENSE',
            isPaid: false,
            date: { lt: new Date() } // Дата (срок оплаты) прошла
          },
          include: {
            project: { select: { id: true, name: true, creatorId: true } },
            creator: { select: { id: true, name: true } }
          }
        })

        for (const invoice of overdueInvoices) {
          if (!invoice.project?.creatorId) continue

          const daysOverdue = Math.ceil((Date.now() - new Date(invoice.date).getTime()) / (1000 * 60 * 60 * 24))

          const existingNotification = await prisma.notification.findFirst({
            where: {
              userId: invoice.project.creatorId,
              type: 'INVOICE_OVERDUE',
              actionType: 'finance',
              actionId: invoice.id,
              createdAt: {
                gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // Не чаще раза в 3 дня
              }
            }
          })

          if (!existingNotification) {
            await prisma.notification.create({
              data: {
                id: generateId(),
                title: `Неоплаченный счёт`,
                message: `Счёт "${invoice.description || invoice.category}" на сумму ${Number(invoice.amount).toLocaleString('ru-RU')} ₽ просрочен на ${daysOverdue} дн.`,
                type: 'INVOICE_OVERDUE',
                actionType: 'finance',
                actionId: invoice.id,
                projectId: invoice.projectId,
                userId: invoice.project.creatorId,
                companyId: company.id
              }
            })
            results.overdueInvoices++
          }
        }
      }

      // Обновляем время последней проверки
      await prisma.notificationSettings.update({
        where: { id: settings.id },
        data: { lastCheckAt: new Date() }
      })
    }

    return NextResponse.json({
      success: true,
      results,
      checkedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error checking deadlines:', error)
    return NextResponse.json({ error: 'Ошибка проверки сроков' }, { status: 500 })
  }
}

// GET для ручного запуска из браузера (для тестирования)
export async function GET(request: NextRequest) {
  return POST(request)
}
