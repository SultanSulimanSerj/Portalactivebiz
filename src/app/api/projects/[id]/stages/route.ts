import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkPermission, canUserAccessProject } from '@/lib/auth-middleware'
import { generateId } from '@/lib/id-generator'

// GET - получить все этапы работ проекта
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canViewAllProjects')
    
    if (!allowed || !user) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    // Проверяем доступ к проекту
    const hasAccess = await canUserAccessProject(user.id, params.id, user.companyId, user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Нет доступа к этому проекту' }, { status: 403 })
    }

    const stages = await prisma.workStage.findMany({
      where: {
        projectId: params.id,
        project: {
          companyId: user.companyId
        }
      },
      include: {
        responsible: {
          select: { id: true, name: true, email: true }
        },
        dependsOn: {
          include: {
            dependsOn: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: [
        { orderIndex: 'asc' },
        { plannedStart: 'asc' }
      ]
    })

    return NextResponse.json(stages)
  } catch (error) {
    console.error('Error fetching work stages:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

// POST - создать новый этап работ
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canEditProjects')
    
    if (!allowed || !user) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    // Проверяем доступ к проекту
    const hasAccess = await canUserAccessProject(user.id, params.id, user.companyId, user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Нет доступа к этому проекту' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      name, 
      description, 
      plannedStart, 
      plannedEnd, 
      responsibleId,
      color,
      dependsOnIds 
    } = body

    if (!name || !plannedStart || !plannedEnd) {
      return NextResponse.json({ 
        error: 'Название, дата начала и дата окончания обязательны' 
      }, { status: 400 })
    }

    // Проверяем что проект существует
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 })
    }

    // Получаем максимальный orderIndex
    const maxOrder = await prisma.workStage.findFirst({
      where: { projectId: params.id },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true }
    })

    // Создаём этап
    const stage = await prisma.workStage.create({
      data: {
        id: generateId(),
        name,
        description: description || null,
        plannedStart: new Date(plannedStart),
        plannedEnd: new Date(plannedEnd),
        orderIndex: (maxOrder?.orderIndex ?? -1) + 1,
        color: color || '#3B82F6',
        projectId: params.id,
        responsibleId: responsibleId || null,
        companyId: user.companyId,
        // Создаём зависимости если есть
        dependsOn: dependsOnIds?.length ? {
          create: dependsOnIds.map((depId: string) => ({
            id: generateId(),
            dependsOnId: depId
          }))
        } : undefined
      },
      include: {
        responsible: {
          select: { id: true, name: true, email: true }
        },
        dependsOn: {
          include: {
            dependsOn: {
              select: { id: true, name: true }
            }
          }
        }
      }
    })

    return NextResponse.json(stage, { status: 201 })
  } catch (error) {
    console.error('Error creating work stage:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

// PUT - массовое обновление порядка этапов
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
    const { stages } = body // [{ id, orderIndex }]

    if (!stages || !Array.isArray(stages)) {
      return NextResponse.json({ error: 'Неверный формат данных' }, { status: 400 })
    }

    // Обновляем порядок этапов
    await prisma.$transaction(
      stages.map((stage: { id: string; orderIndex: number }) =>
        prisma.workStage.update({
          where: { id: stage.id },
          data: { orderIndex: stage.orderIndex }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering work stages:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
