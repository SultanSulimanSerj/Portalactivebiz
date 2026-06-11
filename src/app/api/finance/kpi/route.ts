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

    const where: {
      project: { companyId: string }
      projectId?: string
    } = {
      project: { companyId: user.companyId! },
    }

    if (projectId) {
      where.projectId = projectId
    }

    const [totals, projectBudget] = await Promise.all([
      prisma.finance.groupBy({
        by: ['type'],
        where,
        _sum: { amount: true },
      }),
      projectId
        ? prisma.project.findUnique({
            where: { id: projectId },
            select: { budget: true, expensePlan: true },
          })
        : Promise.resolve(null),
    ])

    const sumByType = (type: string) =>
      Number(totals.find((t) => t.type === type)?._sum.amount || 0)

    const plannedIncome = sumByType('PLANNED_INCOME')
    const actualIncome = sumByType('INCOME')
    const actualExpenses = sumByType('EXPENSE')

    const budgetPlan = projectBudget?.budget ? Number(projectBudget.budget) : plannedIncome
    const expensePlan = projectBudget?.expensePlan
      ? Number(projectBudget.expensePlan)
      : budgetPlan * 0.8

    const deviationAmount = actualExpenses > expensePlan ? actualExpenses - expensePlan : 0
    const deviation = expensePlan > 0 ? (deviationAmount / expensePlan) * 100 : 0

    return NextResponse.json({
      budgetPlan,
      actualExpenses,
      deviation: Math.round(deviation * 100) / 100,
      deviationAmount: Math.round(deviationAmount * 100) / 100,
      incomeByActs: actualIncome,
    })
  } catch (error) {
    await logger.error('Error fetching finance KPI data', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return NextResponse.json({ error: 'Ошибка получения KPI данных' }, { status: 500 })
  }
}
