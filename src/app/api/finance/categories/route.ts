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
      await logger.security('Unauthorized access attempt to finance categories API', { userId: user.id })
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    // Фильтрация по проекту и компании
    const companyFilter = {
      project: {
        companyId: user.companyId!
      }
    }

    // 1. Получаем ПЛАН по расходам из сметы: себестоимость по категориям (quantity × costPrice)
    const estimateItemsWhere: any = {
      estimate: {
        project: {
          companyId: user.companyId!
        }
      }
    }

    if (projectId) {
      estimateItemsWhere.estimate = {
        ...estimateItemsWhere.estimate,
        projectId
      }
    }

    const estimateItems = await prisma.estimateItem.findMany({
      where: estimateItemsWhere,
      select: {
        category: true,
        quantity: true,
        costPrice: true
      }
    })

    // 2. Получаем ФАКТ из расходов (Finance type = EXPENSE)
    const expensesWhere: any = {
      type: 'EXPENSE',
      ...companyFilter
    }

    if (projectId) {
      expensesWhere.projectId = projectId
    }

    const expenses = await prisma.finance.findMany({
      where: expensesWhere,
      select: {
        category: true,
        amount: true
      }
    })

    // Группируем данные по категориям
    const categoryData: { [key: string]: { plan: number, fact: number } } = {}

    // План по расходам: себестоимость по смете (quantity × costPrice) по категориям
    estimateItems.forEach(item => {
      const category = item.category || 'Без категории'
      const costTotal = Number(item.quantity) * Number(item.costPrice)
      if (!categoryData[category]) {
        categoryData[category] = { plan: 0, fact: 0 }
      }
      categoryData[category].plan += costTotal
    })

    // Факт из расходов
    expenses.forEach(expense => {
      const category = expense.category || 'Без категории'
      
      if (!categoryData[category]) {
        categoryData[category] = { plan: 0, fact: 0 }
      }
      categoryData[category].fact += Number(expense.amount)
    })

    // Преобразуем в формат для таблицы
    const categoriesData = Object.entries(categoryData).map(([category, data], index) => {
      const percentage = data.plan > 0 ? (data.fact / data.plan) * 100 : 0
      
      return {
        id: `category-${index}`,
        category,
        plan: data.plan,
        fact: data.fact,
        percentage: Math.round(percentage * 100) / 100
      }
    }).sort((a, b) => b.plan - a.plan) // Сортируем по размеру плана

    return NextResponse.json(categoriesData)

  } catch (error) {
    await logger.error('Error fetching finance categories data', { error: error instanceof Error ? error.message : 'Unknown error' })
    return NextResponse.json({ error: 'Ошибка получения данных по категориям' }, { status: 500 })
  }
}



