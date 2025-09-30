import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { getCacheKey, getFromCache, setCache } from '@/lib/cache'
import { logger } from '@/lib/logger'
import { performanceMonitor } from '@/lib/monitoring'
import { createErrorAlert } from '@/lib/alerts'
import { notifyFinancialUpdate } from '@/lib/notifications'
import { UserRole } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substring(7)
  
  try {
    const { allowed, user, error } = await checkPermission(request, 'canViewFinances')
    
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 401 })
    }
    
    if (!allowed) {
      await logger.security('Unauthorized access attempt to finance API', { requestId })
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Проверяем кэш
    const cacheKey = getCacheKey(request)
    const cached = getFromCache(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Фильтрация финансов в зависимости от роли пользователя
    let where: any = {
      project: {
        companyId: user.companyId!
      },
      ...(projectId && { projectId }),
      ...(type && { type: type as 'INCOME' | 'EXPENSE' }),
      ...(startDate && endDate && {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    }

    // OWNER и ADMIN видят все финансовые записи компании
    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      // Никаких дополнительных ограничений
    } else {
      // MANAGER и USER видят только финансовые записи проектов, где являются участниками
      where.project.OR = [
        { creatorId: user.id }, // Пользователь создал проект
        { users: { some: { userId: user.id } } } // Пользователь является участником проекта
      ]
    }

    const finances = await prisma.finance.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true }
        }
      },
      orderBy: { date: 'desc' }
    })

    // Calculate totals
    const totals = await prisma.finance.groupBy({
      by: ['type'],
      where,
      _sum: {
        amount: true
      }
    })

    const income = totals.find(t => t.type === 'INCOME')?._sum.amount || 0
    const expenses = totals.find(t => t.type === 'EXPENSE')?._sum.amount || 0
    const profit = Number(income) - Number(expenses)

    const result = {
      finances,
      summary: {
        income: Number(income),
        expenses: Number(expenses),
        profit,
        margin: Number(income) > 0 ? (profit / Number(income)) * 100 : 0
      }
    }

    // Сохраняем в кэш на 5 минут
    setCache(cacheKey, result, 300)

    const duration = Date.now() - startTime
    performanceMonitor.recordOperation('GET /api/finance', duration, true, user.id, requestId)
    
    await logger.info('Finance data retrieved', { 
      userId: user.id, 
      requestId, 
      duration,
      projectId,
      type,
      recordCount: result.finances.length
    })

    return NextResponse.json(result)
  } catch (error) {
    const duration = Date.now() - startTime
    performanceMonitor.recordOperation('GET /api/finance', duration, false, undefined, requestId, error instanceof Error ? error.message : String(error))
    
    await logger.error('Error fetching finances', { 
      requestId, 
      duration,
      error: error instanceof Error ? error.message : String(error)
    })
    
    await createErrorAlert('Finance API error', { 
      operation: 'GET /api/finance',
      duration,
      error: error instanceof Error ? error.message : String(error)
    })
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canCreateFinances')
    
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 401 })
    }
    
    if (!allowed) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    const body = await request.json()
    const { type, category, description, amount, date, projectId } = body
    
    console.log('Creating finance record:', { type, category, description, amount, date, projectId })

    const finance = await prisma.finance.create({
      data: {
        type,
        category: category || 'Other',
        description: description || null,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        projectId: projectId || '1', // Используем projectId напрямую
        creatorId: user.id // Используем creatorId напрямую
      },
      include: {
        project: {
          select: { id: true, name: true }
        }
      }
    })

    // Отправляем уведомления участникам проекта
    if (projectId && finance.project) {
      try {
        // Получаем участников проекта
        const projectUsers = await prisma.projectUser.findMany({
          where: { projectId },
          select: { userId: true }
        })

        const participantIds = projectUsers.map(pu => pu.userId)
        
        if (participantIds.length > 0) {
          await notifyFinancialUpdate(
            projectId,
            participantIds,
            type as 'income' | 'expense' | 'budget',
            parseFloat(amount),
            finance.project.name,
            description
          )
        }
      } catch (notificationError) {
        console.error('Error sending financial update notifications:', notificationError)
        // Не прерываем создание финансовой записи из-за ошибки уведомлений
      }
    }

    return NextResponse.json(finance, { status: 201 })
  } catch (error) {
    console.error('Error creating finance record:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
