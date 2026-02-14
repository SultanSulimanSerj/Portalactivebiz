/**
 * Budget Categories Table component
 * План по смете vs факт расходов по категориям
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Info } from "lucide-react"

interface CategoryData {
  id: string
  category: string
  plan: number
  fact: number
  percentage: number
}

interface BudgetCategoriesTableProps {
  data: CategoryData[]
  onAddOperation?: () => void
}

export function BudgetCategoriesTable({ data, onAddOperation }: BudgetCategoriesTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getPercentageBadge = (percentage: number, plan: number) => {
    if (plan === 0) return <Badge variant="outline" className="bg-gray-50">Только факт</Badge>
    if (percentage >= 100) return <Badge variant="destructive">Перерасход</Badge>
    if (percentage >= 80) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Близко к лимиту</Badge>
    return <Badge variant="default" className="bg-green-100 text-green-800">В пределах плана</Badge>
  }

  const totalPlan = data.reduce((s, i) => s + i.plan, 0)
  const totalFact = data.reduce((s, i) => s + i.fact, 0)
  const totalPct = totalPlan > 0 ? (totalFact / totalPlan) * 100 : 0
  const totalRemainder = totalPlan - totalFact

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Детализация по статьям</CardTitle>
            <CardDescription className="mt-1 flex items-center gap-1.5 text-sm">
              <Info className="h-4 w-4 shrink-0" />
              План/факт по расходам: план — себестоимость по смете по категориям (заложенные закупки). Факт — фактические расходы по проекту (записи «Расход») по тем же категориям.
            </CardDescription>
          </div>
          {onAddOperation && (
            <Button onClick={onAddOperation} size="sm" className="flex items-center gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              Добавить расход
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!data.length ? (
          <div className="py-8 text-center text-sm text-gray-500 rounded-lg bg-gray-50 border border-dashed">
            Нет данных по статьям. Добавьте смету к проекту и/или запишите расходы по категориям — здесь появится план и факт.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Статья (категория)</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">План (себестоимость)</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Факт расходов</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Остаток</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Факт / план</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => {
                  const remainder = item.plan - item.fact
                  return (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{item.category}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(item.plan)}</td>
                      <td className="py-3 px-4 text-right font-medium">{formatCurrency(item.fact)}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={remainder >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {remainder >= 0 ? '' : '−'}{formatCurrency(Math.abs(remainder))}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-medium">{item.plan > 0 ? `${item.percentage.toFixed(1)}%` : '—'}</span>
                          {getPercentageBadge(item.percentage, item.plan)}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                <tr className="border-t-2 bg-gray-50 font-semibold">
                  <td className="py-3 px-4 text-gray-900">Итого</td>
                  <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(totalPlan)}</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(totalFact)}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={totalRemainder >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {totalRemainder >= 0 ? '' : '−'}{formatCurrency(Math.abs(totalRemainder))}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {totalPlan > 0 ? `${totalPct.toFixed(1)}%` : '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}



