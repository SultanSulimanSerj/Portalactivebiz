import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkPermission, canUserAccessProject } from '@/lib/auth-middleware'
import { generateId } from '@/lib/id-generator'

function parseDateOnlyToUTC(dateStr: string | undefined): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null
  const part = dateStr.slice(0, 10)
  const [y, m, d] = part.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(Date.UTC(y, m - 1, d))
}

function formatDateToYYYYMMDD(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

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

    const stageWithDates = {
      ...stage,
      plannedStartDate: formatDateToYYYYMMDD(stage.plannedStart),
      plannedEndDate: formatDateToYYYYMMDD(stage.plannedEnd),
      actualStartDate: stage.actualStart ? formatDateToYYYYMMDD(stage.actualStart) : null,
      actualEndDate: stage.actualEnd ? formatDateToYYYYMMDD(stage.actualEnd) : null
    }

    return NextResponse.json(stageWithDates)
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

      const plannedStartUtc = plannedStart !== undefined ? parseDateOnlyToUTC(plannedStart) : undefined
      const plannedEndUtc = plannedEnd !== undefined ? parseDateOnlyToUTC(plannedEnd) : undefined
      if (plannedStart !== undefined && !plannedStartUtc) {
        throw new Error('Некорректный формат даты начала (ожидается YYYY-MM-DD)')
      }
      if (plannedEnd !== undefined && !plannedEndUtc) {
        throw new Error('Некорректный формат даты окончания (ожидается YYYY-MM-DD)')
      }

      // Обновляем этап (даты — UTC полночь выбранного дня)
      const updated = await tx.workStage.update({
        where: { id: params.stageId },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description: description || null }),
          ...(plannedStartUtc !== undefined && { plannedStart: plannedStartUtc }),
          ...(plannedEndUtc !== undefined && { plannedEnd: plannedEndUtc }),
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

    // Добавляем календарные даты для клиента
    const stageWithDates = {
      ...stage,
      plannedStartDate: formatDateToYYYYMMDD(stage.plannedStart),
      plannedEndDate: formatDateToYYYYMMDD(stage.plannedEnd),
      actualStartDate: stage.actualStart ? formatDateToYYYYMMDD(stage.actualStart) : null,
      actualEndDate: stage.actualEnd ? formatDateToYYYYMMDD(stage.actualEnd) : null
    }

    return NextResponse.json(stageWithDates)
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
