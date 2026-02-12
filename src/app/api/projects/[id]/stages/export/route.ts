import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkPermission, canUserAccessProject } from '@/lib/auth-middleware'
import ExcelJS from 'exceljs'

const statusLabels: Record<string, string> = {
  NOT_STARTED: 'Не начат',
  IN_PROGRESS: 'В работе',
  PAUSED: 'Приостановлен',
  COMPLETED: 'Завершён',
  DELAYED: 'Задерживается'
}

// GET - экспорт графика работ
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

    // Получаем проект
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId
      },
      include: {
        company: {
          select: { name: true }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 })
    }

    // Получаем этапы
    const stages = await prisma.workStage.findMany({
      where: {
        projectId: params.id,
        project: {
          companyId: user.companyId
        }
      },
      include: {
        responsible: {
          select: { name: true }
        },
        dependsOn: {
          include: {
            dependsOn: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: [
        { orderIndex: 'asc' },
        { plannedStart: 'asc' }
      ]
    })

    // Создаём Excel файл
    const workbook = new ExcelJS.Workbook()
    workbook.creator = project.company?.name || 'Система управления проектами'
    workbook.created = new Date()

    const worksheet = workbook.addWorksheet('График работ')

    // Заголовок документа
    worksheet.mergeCells('A1:H1')
    const titleCell = worksheet.getCell('A1')
    titleCell.value = `График работ: ${project.name}`
    titleCell.font = { size: 16, bold: true }
    titleCell.alignment = { horizontal: 'center' }

    // Информация о проекте
    worksheet.mergeCells('A2:H2')
    const infoCell = worksheet.getCell('A2')
    const projectDates = []
    if (project.startDate) projectDates.push(`Начало: ${new Date(project.startDate).toLocaleDateString('ru-RU')}`)
    if (project.endDate) projectDates.push(`Окончание: ${new Date(project.endDate).toLocaleDateString('ru-RU')}`)
    infoCell.value = projectDates.length > 0 ? projectDates.join(' | ') : 'Даты не указаны'
    infoCell.font = { size: 11, italic: true }
    infoCell.alignment = { horizontal: 'center' }

    // Пустая строка
    worksheet.addRow([])

    // Заголовки таблицы
    const headerRow = worksheet.addRow([
      '№',
      'Этап работ',
      'Статус',
      'Прогресс',
      'Плановое начало',
      'Плановое окончание',
      'Ответственный',
      'Зависимости'
    ])

    // Стили заголовков
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4472C4' }
      }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })

    // Данные этапов
    stages.forEach((stage, index) => {
      const dependencies = stage.dependsOn
        .map(d => d.dependsOn.name)
        .join(', ') || '—'

      const row = worksheet.addRow([
        index + 1,
        stage.name,
        statusLabels[stage.status] || stage.status,
        `${stage.progress}%`,
        new Date(stage.plannedStart).toLocaleDateString('ru-RU'),
        new Date(stage.plannedEnd).toLocaleDateString('ru-RU'),
        stage.responsible?.name || '—',
        dependencies
      ])

      // Стили строк данных
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
        cell.alignment = { vertical: 'middle' }
        
        // Центрируем номер, статус и прогресс
        if ([1, 3, 4].includes(colNumber)) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        }
      })

      // Подсветка статусов
      const statusCell = row.getCell(3)
      switch (stage.status) {
        case 'COMPLETED':
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C6EFCE' } }
          statusCell.font = { color: { argb: '006100' } }
          break
        case 'IN_PROGRESS':
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'BDD7EE' } }
          statusCell.font = { color: { argb: '1F4E79' } }
          break
        case 'DELAYED':
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC7CE' } }
          statusCell.font = { color: { argb: '9C0006' } }
          break
        case 'PAUSED':
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEB9C' } }
          statusCell.font = { color: { argb: '9C5700' } }
          break
      }

      // Подсветка прогресса
      const progressCell = row.getCell(4)
      if (stage.progress === 100) {
        progressCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C6EFCE' } }
      } else if (stage.progress >= 50) {
        progressCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'BDD7EE' } }
      }
    })

    // Ширина колонок
    worksheet.columns = [
      { width: 5 },   // №
      { width: 35 },  // Этап
      { width: 15 },  // Статус
      { width: 12 },  // Прогресс
      { width: 15 },  // Начало
      { width: 15 },  // Окончание
      { width: 20 },  // Ответственный
      { width: 25 },  // Зависимости
    ]

    // Пустая строка и итоги
    worksheet.addRow([])
    
    const completedCount = stages.filter(s => s.status === 'COMPLETED').length
    const totalProgress = stages.length > 0 
      ? Math.round(stages.reduce((sum, s) => sum + s.progress, 0) / stages.length)
      : 0

    const summaryRow = worksheet.addRow([
      '', 
      `Всего этапов: ${stages.length}`,
      `Завершено: ${completedCount}`,
      `Общий прогресс: ${totalProgress}%`,
      '', '', '', ''
    ])
    summaryRow.font = { bold: true }

    // Дата формирования
    worksheet.addRow([])
    const dateRow = worksheet.addRow([
      `Документ сформирован: ${new Date().toLocaleString('ru-RU')}`
    ])
    dateRow.font = { italic: true, size: 10, color: { argb: '808080' } }

    // Генерируем файл
    const buffer = await workbook.xlsx.writeBuffer()

    // Формируем имя файла
    const safeProjectName = project.name.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')
    const dateStr = new Date().toISOString().split('T')[0]
    const fileName = `График_работ_${safeProjectName}_${dateStr}.xlsx`
    const asciiFileName = `work_schedule_${dateStr}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${asciiFileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    })

  } catch (error) {
    console.error('Error exporting work stages:', error)
    return NextResponse.json({ error: 'Ошибка при экспорте' }, { status: 500 })
  }
}
