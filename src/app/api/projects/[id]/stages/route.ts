import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkPermission, canUserAccessProject } from '@/lib/auth-middleware'
import { generateId } from '@/lib/id-generator'

// Календарная дата YYYY-MM-DD → Date в UTC полночь (без сдвига по таймзоне сервера)
function parseDateOnlyToUTC(dateStr: string | undefined): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null
  const part = dateStr.slice(0, 10)
  const [y, m, d] = part.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(Date.UTC(y, m - 1, d))
}

// Date → YYYY-MM-DD по UTC (календарная дата без привязки к таймзоне)
function formatDateToYYYYMMDD(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

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

    // Календарные даты в формате YYYY-MM-DD по UTC (одинаково для любого часового пояса)
    const stagesWithDateOnly = stages.map((s) => ({
      ...s,
      plannedStartDate: s.plannedStart ? formatDateToYYYYMMDD(new Date(s.plannedStart)) : null,
      plannedEndDate: s.plannedEnd ? formatDateToYYYYMMDD(new Date(s.plannedEnd)) : null,
      actualStartDate: s.actualStart ? formatDateToYYYYMMDD(new Date(s.actualStart)) : null,
      actualEndDate: s.actualEnd ? formatDateToYYYYMMDD(new Date(s.actualEnd)) : null
    }))

    return NextResponse.json(stagesWithDateOnly)
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

    const plannedStartUtc = parseDateOnlyToUTC(plannedStart)
    const plannedEndUtc = parseDateOnlyToUTC(plannedEnd)
    if (!plannedStartUtc || !plannedEndUtc) {
      return NextResponse.json({ error: 'Некорректный формат дат (ожидается YYYY-MM-DD)' }, { status: 400 })
    }

    // Создаём этап (даты храним как UTC полночь выбранного дня)
    const stage = await prisma.workStage.create({
      data: {
        id: generateId(),
        name,
        description: description || null,
        plannedStart: plannedStartUtc,
        plannedEnd: plannedEndUtc,
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

    // Добавляем календарные даты для клиента (как в GET)
    const stageWithDates = {
      ...stage,
      plannedStartDate: formatDateToYYYYMMDD(stage.plannedStart),
      plannedEndDate: formatDateToYYYYMMDD(stage.plannedEnd),
      actualStartDate: stage.actualStart ? formatDateToYYYYMMDD(stage.actualStart) : null,
      actualEndDate: stage.actualEnd ? formatDateToYYYYMMDD(stage.actualEnd) : null
    }

    return NextResponse.json(stageWithDates, { status: 201 })
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
