import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/auth-middleware'
import ExcelJS from 'exceljs'

interface FinanceRecord {
  id: string
  type: string
  category: string
  amount: number
  date: string
  description: string | null
  project: { id: string; name: string } | null
}

export async function POST(request: NextRequest) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canViewFinances')
    
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 401 })
    }
    
    if (!allowed) {
      return NextResponse.json({ error: error || 'Недостаточно прав' }, { status: 403 })
    }

    const body = await request.json()
    const { records, projectName } = body as { records: FinanceRecord[], projectName: string }

    // Создаем Excel файл
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Manexa'
    workbook.created = new Date()

    const worksheet = workbook.addWorksheet('Финансы')

    // Заголовок
    worksheet.mergeCells('A1:F1')
    const titleCell = worksheet.getCell('A1')
    titleCell.value = `Финансовый отчёт: ${projectName}`
    titleCell.font = { size: 16, bold: true }
    titleCell.alignment = { horizontal: 'center' }

    // Дата отчёта
    worksheet.mergeCells('A2:F2')
    const dateCell = worksheet.getCell('A2')
    dateCell.value = `Дата формирования: ${new Date().toLocaleDateString('ru-RU')}`
    dateCell.font = { size: 10, italic: true }
    dateCell.alignment = { horizontal: 'center' }

    // Пустая строка
    worksheet.addRow([])

    // Заголовки таблицы
    const headerRow = worksheet.addRow(['Тип', 'Категория', 'Описание', 'Проект', 'Дата', 'Сумма'])
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }
    headerRow.eachCell(cell => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })

    // Данные
    let totalIncome = 0
    let totalExpenses = 0

    records.forEach(record => {
      const typeLabel = record.type === 'INCOME' ? 'Доход' : 
                        record.type === 'PLANNED_INCOME' ? 'План. доход' : 'Расход'
      const amount = Number(record.amount)
      
      if (record.type === 'INCOME') totalIncome += amount
      if (record.type === 'EXPENSE') totalExpenses += amount

      const row = worksheet.addRow([
        typeLabel,
        record.category,
        record.description || '',
        record.project?.name || '',
        new Date(record.date).toLocaleDateString('ru-RU'),
        amount
      ])

      // Цвет для типа
      const typeCell = row.getCell(1)
      if (record.type === 'INCOME') {
        typeCell.font = { color: { argb: 'FF16A34A' } }
      } else if (record.type === 'EXPENSE') {
        typeCell.font = { color: { argb: 'FFDC2626' } }
      } else {
        typeCell.font = { color: { argb: 'FF2563EB' } }
      }

      // Формат суммы
      const amountCell = row.getCell(6)
      amountCell.numFmt = '#,##0.00 ₽'
      if (record.type === 'EXPENSE') {
        amountCell.font = { color: { argb: 'FFDC2626' } }
      } else {
        amountCell.font = { color: { argb: 'FF16A34A' } }
      }

      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      })
    })

    // Пустая строка
    worksheet.addRow([])

    // Итоги
    const summaryStartRow = worksheet.rowCount + 1

    const incomeRow = worksheet.addRow(['', '', '', '', 'Итого доходы:', totalIncome])
    incomeRow.getCell(5).font = { bold: true }
    incomeRow.getCell(6).numFmt = '#,##0.00 ₽'
    incomeRow.getCell(6).font = { bold: true, color: { argb: 'FF16A34A' } }

    const expenseRow = worksheet.addRow(['', '', '', '', 'Итого расходы:', totalExpenses])
    expenseRow.getCell(5).font = { bold: true }
    expenseRow.getCell(6).numFmt = '#,##0.00 ₽'
    expenseRow.getCell(6).font = { bold: true, color: { argb: 'FFDC2626' } }

    const balanceRow = worksheet.addRow(['', '', '', '', 'Баланс:', totalIncome - totalExpenses])
    balanceRow.getCell(5).font = { bold: true }
    balanceRow.getCell(6).numFmt = '#,##0.00 ₽'
    balanceRow.getCell(6).font = { bold: true }

    // Ширина колонок
    worksheet.columns = [
      { width: 12 },  // Тип
      { width: 20 },  // Категория
      { width: 30 },  // Описание
      { width: 25 },  // Проект
      { width: 12 },  // Дата
      { width: 18 },  // Сумма
    ]

    // Генерируем файл
    const buffer = await workbook.xlsx.writeBuffer()

    // Формируем имя файла
    const safeProjectName = projectName.replace(/[^a-zA-Zа-яА-Я0-9\s]/g, '_')
    const dateStr = new Date().toISOString().split('T')[0]
    const fileName = `Финансы_${safeProjectName}_${dateStr}.xlsx`
    const asciiFileName = `finance_${dateStr}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${asciiFileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    })

  } catch (error) {
    console.error('Error exporting finance:', error)
    return NextResponse.json({ error: 'Ошибка экспорта' }, { status: 500 })
  }
}
