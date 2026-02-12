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
      await logger.security('Unauthorized access attempt to finance KPI API', { userId: user.id })
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    // Фильтрация по проекту и компании
    let where: any = {
      project: {
        companyId: user.companyId!
      }
    }

    if (projectId) {
      where.projectId = projectId
    }

    // Получаем данные о финансах
    const finances = await prisma.finance.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, budget: true }
        }
      }
    })

    // Получаем бюджет и план расходов проекта
    const projectBudget = projectId 
      ? await prisma.project.findUnique({
          where: { id: projectId },
          select: { budget: true }
        })
      : null

    // Рассчитываем KPI
    const plannedIncome = finances
      .filter(f => f.type === 'PLANNED_INCOME')
      .reduce((sum, f) => sum + Number(f.amount), 0)

    const actualIncome = finances
      .filter(f => f.type === 'INCOME')
      .reduce((sum, f) => sum + Number(f.amount), 0)

    const actualExpenses = finances
      .filter(f => f.type === 'EXPENSE')
      .reduce((sum, f) => sum + Number(f.amount), 0)

    const budgetPlan = projectBudget?.budget ? Number(projectBudget.budget) : plannedIncome
    
    // План расходов - временно используем 80% от бюджета
    // TODO: После исправления TypeScript использовать expensePlan из проекта
    const expensePlan = budgetPlan * 0.8
    
    // Отклонение рассчитываем как превышение плана расходов
    // Если расходов нет или они в пределах плана - отклонение 0
    const deviationAmount = actualExpenses > expensePlan ? actualExpenses - expensePlan : 0
    const deviation = expensePlan > 0 ? (deviationAmount / expensePlan) * 100 : 0

    const kpiData = {
      budgetPlan,
      actualExpenses,
      deviation: Math.round(deviation * 100) / 100,
      deviationAmount: Math.round(deviationAmount * 100) / 100,
      incomeByActs: actualIncome
    }

    return NextResponse.json(kpiData)

  } catch (error) {
    await logger.error('Error fetching finance KPI data', { error: error instanceof Error ? error.message : 'Unknown error' })
    return NextResponse.json({ error: 'Ошибка получения KPI данных' }, { status: 500 })
  }
}
