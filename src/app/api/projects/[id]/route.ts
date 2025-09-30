import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/lib/permissions'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canViewAllProjects')
    
    if (!allowed) {
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
        { users: { some: { userId: user.id } } } // Пользователь является участником
      ]
    }

    const project = await prisma.project.findFirst({
      where,
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
    
    if (!allowed) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, startDate, endDate, budget, priority, status } = body

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
          ...(status && { status })
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

      // Если изменился бюджет, обновляем финансовую запись
      if (budget !== undefined) {
        const budgetAmount = parseFloat(budget)
        const projectStatus = status || project.status
        const isCompleted = projectStatus === 'COMPLETED'
        
        // Удаляем старые финансовые записи с бюджетом проекта
        await tx.finance.deleteMany({
          where: {
            projectId: params.id,
            type: 'INCOME',
            OR: [
              { category: 'Планируемый доход' },
              { category: 'Доход' }
            ]
          }
        })

        // Создаем новую финансовую запись, если бюджет больше 0
        if (budgetAmount > 0) {
          await tx.finance.create({
            data: {
              type: 'INCOME',
              category: isCompleted ? 'Доход' : 'Планируемый доход',
              description: `Бюджет проекта "${project.name}"`,
              amount: budgetAmount,
              date: new Date(),
              projectId: project.id,
              creatorId: user.id
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
    
    if (!allowed) {
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
