import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canViewFinances')
    
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 401 })
    }
    
    if (!allowed) {
      await logger.security('Unauthorized access attempt to finance chart API', { userId: user.id })
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const period = searchParams.get('period') || 'month'

    // Фильтрация по проекту и компании
    let where: any = {
      project: {
        companyId: user.companyId!
      }
    }

    if (projectId) {
      where.projectId = projectId
    }

    // Определяем период для группировки
    let dateFormat: string
    let groupBy: string
    let months: number

    switch (period) {
      case 'quarter':
        dateFormat = 'YYYY-Q'
        groupBy = 'quarter'
        months = 3
        break
      case 'year':
        dateFormat = 'YYYY'
        groupBy = 'year'
        months = 12
        break
      default: // month
        dateFormat = 'YYYY-MM'
        groupBy = 'month'
        months = 6
        break
    }

    // Получаем данные за последние N месяцев
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    where.date = {
      gte: startDate
    }

    const finances = await prisma.finance.findMany({
      where,
      select: {
        date: true,
        type: true,
        amount: true
      },
      orderBy: { date: 'asc' }
    })

    // Группируем данные по периодам
    const groupedData: { [key: string]: { plan: number, fact: number } } = {}

    finances.forEach(finance => {
      const date = new Date(finance.date)
      let periodKey: string

      switch (groupBy) {
        case 'quarter':
          const quarter = Math.floor(date.getMonth() / 3) + 1
          periodKey = `${date.getFullYear()}-Q${quarter}`
          break
        case 'year':
          periodKey = date.getFullYear().toString()
          break
        default: // month
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
      }

      if (!groupedData[periodKey]) {
        groupedData[periodKey] = { plan: 0, fact: 0 }
      }

      if (finance.type === 'PLANNED_INCOME') {
        groupedData[periodKey].plan += Number(finance.amount)
      } else if (finance.type === 'INCOME') {
        groupedData[periodKey].fact += Number(finance.amount)
      }
    })

    // Преобразуем в формат для графика
    const chartData = Object.entries(groupedData).map(([period, data]) => ({
      date: period,
      plan: data.plan,
      fact: data.fact
    })).sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json(chartData)

  } catch (error) {
    await logger.error('Error fetching finance chart data', { error: error instanceof Error ? error.message : 'Unknown error' })
    return NextResponse.json({ error: 'Ошибка получения данных графика' }, { status: 500 })
  }
}



