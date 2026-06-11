import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { getReportDateRange, isDateInRange, periodLabel } from '@/lib/report-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { allowed, user, error } = await checkPermission(request, 'canExportReports')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!allowed) {
      return NextResponse.json({ error: error || 'Forbidden' }, { status: 403 })
    }
    if (!user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const dateRange = getReportDateRange(period, startDate, endDate)

    const [projects, tasks, finances, documents] = await Promise.all([
      prisma.project.findMany({ where: { companyId: user.companyId! } }),
      prisma.task.findMany({ where: { project: { companyId: user.companyId! } } }),
      prisma.finance.findMany({ where: { project: { companyId: user.companyId! } } }),
      prisma.document.findMany({ where: { project: { companyId: user.companyId! } } }),
    ])

    const filteredFinances = finances.filter((f) => isDateInRange(f.date, dateRange))
    const revenue = filteredFinances
      .filter((f) => f.type === 'INCOME')
      .reduce((s, f) => s + Number(f.amount), 0)
    const expenses = filteredFinances
      .filter((f) => f.type === 'EXPENSE')
      .reduce((s, f) => s + Number(f.amount), 0)

    const reportContent = [
      'ОТЧЕТ ПО КОМПАНИИ',
      '=================',
      '',
      `Пользователь: ${user.email}`,
      `Дата формирования: ${new Date().toLocaleString('ru-RU')}`,
      `Период: ${periodLabel(period)}`,
      '',
      'ПРОЕКТЫ',
      `  Всего: ${projects.length}`,
      `  Активных: ${projects.filter((p) => p.status === 'ACTIVE').length}`,
      `  Завершённых: ${projects.filter((p) => p.status === 'COMPLETED').length}`,
      `  Создано за период: ${projects.filter((p) => isDateInRange(p.createdAt, dateRange)).length}`,
      '',
      'ЗАДАЧИ',
      `  Всего: ${tasks.length}`,
      `  Выполнено: ${tasks.filter((t) => t.status === 'COMPLETED').length}`,
      `  Создано за период: ${tasks.filter((t) => isDateInRange(t.createdAt, dateRange)).length}`,
      '',
      'ФИНАНСЫ (за период)',
      `  Доходы: ${revenue.toLocaleString('ru-RU')} ₽`,
      `  Расходы: ${expenses.toLocaleString('ru-RU')} ₽`,
      `  Прибыль: ${(revenue - expenses).toLocaleString('ru-RU')} ₽`,
      '',
      'ДОКУМЕНТЫ',
      `  Всего: ${documents.length}`,
      `  Загружено за период: ${documents.filter((d) => isDateInRange(d.createdAt, dateRange)).length}`,
      '',
      '---',
      `Файл: ${params.filename}`,
    ].join('\n')

    return new NextResponse(reportContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${params.filename}"`,
      },
    })
  } catch (error) {
    console.error('Error downloading report:', error)
    return NextResponse.json({ error: 'Failed to download report' }, { status: 500 })
  }
}
