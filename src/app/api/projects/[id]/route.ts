import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/lib/permissions'
import { generateId } from '@/lib/id-generator'
import { FinanceType } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canViewAllProjects')
    
    if (!allowed || !user) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    // Проверяем доступ к проекту в зависимости от роли
    let where: any = {
      id: params.id,
      companyId: user.companyId
    }

    // OWNER и ADMIN видят все проекты компании
    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      // Никаких дополнительных ограничений
    } else {
      // MANAGER и USER видят только проекты, где являются участниками
      where.OR = [
        { creatorId: user.id }, // Пользователь создал проект
        { ProjectUser: { some: { userId: user.id } } } // Пользователь является участником
      ]
    }

    const project = await prisma.project.findFirst({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        priority: true,
        budget: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,
        // Данные клиента
        clientName: true,
        clientLegalName: true,
        clientInn: true,
        clientKpp: true,
        clientOgrn: true,
        clientLegalAddress: true,
        clientActualAddress: true,
        clientDirectorName: true,
        clientContactPhone: true,
        clientContactEmail: true,
        clientBankAccount: true,
        clientBankName: true,
        clientBankBik: true,
        clientCorrespondentAccount: true,
        creator: {
          select: { id: true, name: true, email: true }
        },
        users: {
          select: {
            user: {
              select: { id: true, name: true, email: true, position: true, phone: true }
            }
          }
        },
        _count: {
          select: { tasks: true, documents: true, users: true }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canEditProjects')
    
    if (!allowed || !user) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      name, 
      description, 
      startDate, 
      endDate, 
      budget, 
      priority, 
      status,
      // Данные клиента
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

    // Обновляем проект и финансовую запись в транзакции
    const result = await prisma.$transaction(async (tx) => {
      // Обновляем проект
      const project = await tx.project.update({
        where: {
          id: params.id,
          companyId: user.companyId
        },
        data: {
          ...(name && { name }),
          ...(description && { description }),
          ...(startDate && { startDate: new Date(startDate) }),
          ...(endDate && { endDate: new Date(endDate) }),
          ...(budget && { budget: parseFloat(budget) }),
          ...(priority && { priority }),
          ...(status && { status }),
          // Данные клиента
          ...(clientName !== undefined && { clientName }),
          ...(clientLegalName !== undefined && { clientLegalName }),
          ...(clientInn !== undefined && { clientInn }),
          ...(clientKpp !== undefined && { clientKpp }),
          ...(clientOgrn !== undefined && { clientOgrn }),
          ...(clientLegalAddress !== undefined && { clientLegalAddress }),
          ...(clientActualAddress !== undefined && { clientActualAddress }),
          ...(clientDirectorName !== undefined && { clientDirectorName }),
          ...(clientContactPhone !== undefined && { clientContactPhone }),
          ...(clientContactEmail !== undefined && { clientContactEmail }),
          ...(clientBankAccount !== undefined && { clientBankAccount }),
          ...(clientBankName !== undefined && { clientBankName }),
          ...(clientBankBik !== undefined && { clientBankBik }),
          ...(clientCorrespondentAccount !== undefined && { clientCorrespondentAccount })
        },
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          },
          users: {
            include: {
              user: {
                select: { id: true, name: true, email: true, position: true, phone: true }
              }
            }
          },
          _count: {
            select: { tasks: true, documents: true, users: true }
          }
        }
      })

      // Получаем старый статус проекта для проверки изменения
      const oldProject = await tx.project.findUnique({
        where: { id: params.id },
        select: { status: true }
      })

      // Если изменился статус с PLANNING на ACTIVE - конвертируем планируемый доход в реальный
      if (status && oldProject && oldProject.status === 'PLANNING' && (status === 'ACTIVE' || status === 'COMPLETED')) {
        await tx.finance.updateMany({
          where: {
            projectId: params.id,
            type: 'PLANNED_INCOME'
          },
          data: {
            type: 'INCOME',
            category: 'Доход от проекта'
          }
        })
      }

      // Если изменился бюджет, обновляем финансовую запись
      if (budget !== undefined) {
        const budgetAmount = parseFloat(budget)
        const projectStatus = status || project.status
        
        // Определяем тип финансовой записи в зависимости от статуса
        let financeType: 'PLANNED_INCOME' | 'INCOME' = 'PLANNED_INCOME'
        let financeCategory = 'Планируемый доход'
        
        if (projectStatus === 'ACTIVE' || projectStatus === 'COMPLETED') {
          financeType = 'INCOME'
          financeCategory = 'Доход от проекта'
        }
        
        // Удаляем старые финансовые записи с бюджетом проекта
        await tx.finance.deleteMany({
          where: {
            projectId: params.id,
            OR: [
              { type: 'INCOME', category: { contains: 'Бюджет проекта' } },
              { type: 'PLANNED_INCOME', category: { contains: 'Планируемый' } },
              { category: 'Планируемый доход' },
              { category: 'Доход от проекта' }
            ]
          }
        })

        // Создаем новую финансовую запись, если бюджет больше 0
        if (budgetAmount > 0) {
          await tx.finance.create({
            data: {
              id: generateId(),
              type: financeType as any,
              category: financeCategory,
              description: `Бюджет проекта "${project.name}"`,
              amount: budgetAmount,
              date: new Date(),
              projectId: project.id,
              creatorId: user.id,
              updatedAt: new Date()
            }
          })
        }
      }

      return project
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canDeleteProjects')
    
    if (!allowed || !user) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    // Check if project exists and belongs to user's company
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Delete project (cascade will handle related records)
    await prisma.project.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({ message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
