import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkPermission, canUserAccessProject } from '@/lib/auth-middleware'
import { generateId } from '@/lib/id-generator'

// GET - получить один этап
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; stageId: string } }
) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canViewAllProjects')
    
    if (!allowed || !user) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    const stage = await prisma.workStage.findFirst({
      where: {
        id: params.stageId,
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
      }
    })

    if (!stage) {
      return NextResponse.json({ error: 'Этап не найден' }, { status: 404 })
    }

    return NextResponse.json(stage)
  } catch (error) {
    console.error('Error fetching work stage:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

// PUT - обновить этап
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; stageId: string } }
) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canEditProjects')
    
    if (!allowed || !user) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    // Проверяем существование этапа
    const existingStage = await prisma.workStage.findFirst({
      where: {
        id: params.stageId,
        projectId: params.id,
        project: {
          companyId: user.companyId
        }
      }
    })

    if (!existingStage) {
      return NextResponse.json({ error: 'Этап не найден' }, { status: 404 })
    }

    const body = await request.json()
    const { 
      name, 
      description, 
      plannedStart, 
      plannedEnd,
      actualStart,
      actualEnd,
      progress,
      status,
      responsibleId,
      color,
      dependsOnIds 
    } = body

    // Обновляем этап в транзакции
    const stage = await prisma.$transaction(async (tx) => {
      // Если изменились зависимости - удаляем старые и создаём новые
      if (dependsOnIds !== undefined) {
        await tx.workStageDependency.deleteMany({
          where: { stageId: params.stageId }
        })

        if (dependsOnIds.length > 0) {
          await tx.workStageDependency.createMany({
            data: dependsOnIds.map((depId: string) => ({
              id: generateId(),
              stageId: params.stageId,
              dependsOnId: depId
            }))
          })
        }
      }

      // Обновляем этап
      const updated = await tx.workStage.update({
        where: { id: params.stageId },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description: description || null }),
          ...(plannedStart !== undefined && { plannedStart: new Date(plannedStart) }),
          ...(plannedEnd !== undefined && { plannedEnd: new Date(plannedEnd) }),
          ...(actualStart !== undefined && { actualStart: actualStart ? new Date(actualStart) : null }),
          ...(actualEnd !== undefined && { actualEnd: actualEnd ? new Date(actualEnd) : null }),
          ...(progress !== undefined && { progress: Math.min(100, Math.max(0, progress)) }),
          ...(status !== undefined && { status }),
          ...(responsibleId !== undefined && { responsibleId: responsibleId || null }),
          ...(color !== undefined && { color }),
          updatedAt: new Date()
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

      return updated
    })

    return NextResponse.json(stage)
  } catch (error) {
    console.error('Error updating work stage:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

// DELETE - удалить этап
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; stageId: string } }
) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canEditProjects')
    
    if (!allowed || !user) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    // Проверяем существование этапа
    const existingStage = await prisma.workStage.findFirst({
      where: {
        id: params.stageId,
        projectId: params.id,
        project: {
          companyId: user.companyId
        }
      }
    })

    if (!existingStage) {
      return NextResponse.json({ error: 'Этап не найден' }, { status: 404 })
    }

    // Удаляем этап (зависимости удалятся каскадно)
    await prisma.workStage.delete({
      where: { id: params.stageId }
    })

    return NextResponse.json({ message: 'Этап удалён' })
  } catch (error) {
    console.error('Error deleting work stage:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
