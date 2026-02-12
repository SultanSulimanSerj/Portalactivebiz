/**
 * Budget Categories Table component
 * Shows detailed breakdown by expense categories
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

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

  const getPercentageBadge = (percentage: number) => {
    if (percentage >= 100) {
      return <Badge variant="destructive">Перерасход</Badge>
    } else if (percentage >= 80) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Риск</Badge>
    } else {
      return <Badge variant="default" className="bg-green-100 text-green-800">ОК</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Детализация по статьям</CardTitle>
          {onAddOperation && (
            <Button onClick={onAddOperation} size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Добавить операцию
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Категория</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">План</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Факт</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">% выполнения</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{item.category}</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(item.plan)}</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(item.fact)}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-medium">{item.percentage.toFixed(1)}%</span>
                      {getPercentageBadge(item.percentage)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}



