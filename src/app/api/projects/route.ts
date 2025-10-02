import { NextRequest, NextResponse } from 'next/server'
import { checkPermission, filterDataByPermissions } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { notifyProjectUpdate } from '@/lib/notifications'
import { UserRole } from '@/lib/permissions'
import { generateId } from '@/lib/id-generator'
import { FinanceType } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canViewAllProjects')
    
    if (!allowed || !user) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Фильтрация проектов в зависимости от роли пользователя
    let where: any = {
      companyId: user.companyId,
      ...(status && { status })
    }

    // OWNER и ADMIN видят все проекты компании
    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      // Никаких дополнительных ограничений
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } }
        ]
      }
    } else {
      // MANAGER и USER видят только проекты, где являются участниками
      const baseFilter = [
        { creatorId: user.id }, // Пользователь создал проект
        { users: { some: { userId: user.id } } } // Пользователь является участником
      ]

      if (search) {
        // Если есть поиск, объединяем фильтры
        where.AND = [
          {
            OR: baseFilter
          },
          {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { description: { contains: search, mode: 'insensitive' as const } }
            ]
          }
        ]
      } else {
        where.OR = baseFilter
      }
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: { tasks: true, documents: true, users: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.project.count({ where })
    ])

    // Добавляем финансовые данные для каждого проекта
    const projectsWithFinance = await Promise.all(
      projects.map(async (project) => {
        const finances = await prisma.finance.findMany({
          where: { projectId: project.id },
          select: { type: true, amount: true }
        })

        // Реальный доход (только INCOME, без планируемого)
        const income = finances
          .filter(f => f.type === 'INCOME')
          .reduce((sum, f) => sum + Number(f.amount), 0)
        
        // Планируемый доход (отдельно)
        const plannedIncome = finances
          .filter(f => f.type === 'PLANNED_INCOME')
          .reduce((sum, f) => sum + Number(f.amount), 0)
        
        const expenses = finances
          .filter(f => f.type === 'EXPENSE')
          .reduce((sum, f) => sum + Number(f.amount), 0)
        
        const profit = income - expenses
        const margin = income > 0 ? ((profit / income) * 100) : 0

        return {
          ...project,
          financialSummary: {
            income,
            plannedIncome,
            expenses,
            profit,
            margin: Math.round(margin * 10) / 10 // Округляем до 1 знака после запятой
          }
        }
      })
    )

    return NextResponse.json({
      projects: projectsWithFinance,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canCreateProjects')
    
    if (!allowed || !user) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      name, 
      description, 
      status, 
      priority, 
      budget, 
      startDate, 
      endDate,
      // Реквизиты клиента
      clientName,
      clientLegalName,
      clientInn,
      clientKpp,
      clientOgrn,
      clientLegalAddress,
      clientActualAddress,
      clientDirectorName,
      clientContactPhone,
      clientContactEmail,
      clientBankAccount,
      clientBankName,
      clientBankBik,
      clientCorrespondentAccount
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Создаем проект и финансовую запись в транзакции
    const result = await prisma.$transaction(async (tx) => {
      // Создаем проект
        const project = await tx.project.create({
          data: {
            id: generateId(),
            name,
            description: description || null,
            status: status || 'PLANNING',
            priority: priority || 'MEDIUM',
            budget: budget ? parseFloat(budget) : null,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            companyId: user.companyId!,
            creatorId: user.id,
            updatedAt: new Date(),
            // Реквизиты клиента
            clientName: clientName || null,
            clientLegalName: clientLegalName || null,
            clientInn: clientInn || null,
            clientKpp: clientKpp || null,
            clientOgrn: clientOgrn || null,
            clientLegalAddress: clientLegalAddress || null,
            clientActualAddress: clientActualAddress || null,
            clientDirectorName: clientDirectorName || null,
            clientContactPhone: clientContactPhone || null,
            clientContactEmail: clientContactEmail || null,
            clientBankAccount: clientBankAccount || null,
            clientBankName: clientBankName || null,
            clientBankBik: clientBankBik || null,
            clientCorrespondentAccount: clientCorrespondentAccount || null
          },
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: { tasks: true, documents: true, users: true }
          }
        }
      })

      // Если указан бюджет, создаем финансовую запись в зависимости от статуса проекта
      if (budget && parseFloat(budget) > 0) {
        const projectStatus = status || 'PLANNING'
        
        // Определяем тип финансовой записи в зависимости от статуса
        let financeType: 'PLANNED_INCOME' | 'INCOME' = 'PLANNED_INCOME'
        let financeCategory = 'Планируемый доход'
        
        if (projectStatus === 'ACTIVE' || projectStatus === 'COMPLETED') {
          financeType = 'INCOME'
          financeCategory = 'Доход от проекта'
        }
        
        await tx.finance.create({
          data: {
            id: generateId(),
            type: financeType as any,
            category: financeCategory,
            description: `Бюджет проекта "${name}"`,
            amount: parseFloat(budget),
            date: new Date(),
            projectId: project.id,
            creatorId: user.id,
            updatedAt: new Date()
          }
        })
      }

      return project
    })

    return NextResponse.json({ project: result }, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}