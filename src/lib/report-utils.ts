export type ReportPeriod = 'week' | 'month' | 'quarter' | 'year' | 'custom' | 'all'

export function getReportDateRange(
  period: string,
  startDate?: string | null,
  endDate?: string | null
): { start: Date | null; end: Date | null } {
  if (period === 'custom' && startDate) {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = endDate ? new Date(endDate) : new Date()
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }

  if (!period || period === 'all') {
    return { start: null, end: null }
  }

  const start = new Date()
  start.setHours(0, 0, 0, 0)
  switch (period) {
    case 'week':
      start.setDate(start.getDate() - 7)
      break
    case 'month':
      start.setMonth(start.getMonth() - 1)
      break
    case 'quarter':
      start.setMonth(start.getMonth() - 3)
      break
    case 'year':
      start.setFullYear(start.getFullYear() - 1)
      break
    default:
      return { start: null, end: null }
  }

  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export function isDateInRange(
  date: Date | string,
  range: { start: Date | null; end: Date | null }
): boolean {
  if (!range.start && !range.end) return true
  const d = new Date(date)
  if (range.start && d < range.start) return false
  if (range.end && d > range.end) return false
  return true
}

export function periodLabel(period: string): string {
  const labels: Record<string, string> = {
    week: 'Последняя неделя',
    month: 'Последний месяц',
    quarter: 'Последний квартал',
    year: 'Последний год',
    custom: 'Произвольный период',
    all: 'Все время',
  }
  return labels[period] || period
}

/** Prisma date filter from report period — avoids full-table scan + JS filter. */
export function prismaDateFilter(
  range: { start: Date | null; end: Date | null }
): { gte?: Date; lte?: Date } | undefined {
  if (!range.start && !range.end) return undefined
  const filter: { gte?: Date; lte?: Date } = {}
  if (range.start) filter.gte = range.start
  if (range.end) filter.lte = range.end
  return filter
}
