/**
 * Budget Progress Bar component
 * Shows budget utilization with estimate comparison
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react"

interface BudgetProgressBarProps {
  budget: number
  estimateTotal: number
  spent: number
  received: number
  projectName?: string
}

export function BudgetProgressBar({ 
  budget, 
  estimateTotal, 
  spent, 
  received,
  projectName 
}: BudgetProgressBarProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)} млн ₽`
    }
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const remaining = budget - spent
  const spentPercentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
  const receivedPercentage = budget > 0 ? Math.min((received / budget) * 100, 100) : 0
  const estimateVsBudget = budget > 0 && estimateTotal > 0 
    ? ((estimateTotal / budget) * 100).toFixed(0) 
    : null

  const isOverBudget = spent > budget
  const isNearLimit = spentPercentage >= 80 && !isOverBudget

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>Освоение бюджета</span>
          {isOverBudget && (
            <span className="flex items-center gap-1 text-sm font-normal text-red-600">
              <AlertTriangle className="h-4 w-4" />
              Перерасход
            </span>
          )}
          {isNearLimit && (
            <span className="flex items-center gap-1 text-sm font-normal text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              Близко к лимиту
            </span>
          )}
          {!isOverBudget && !isNearLimit && spentPercentage > 0 && (
            <span className="flex items-center gap-1 text-sm font-normal text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              В норме
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Основной прогресс-бар расходов */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Расходы</span>
            <span className="text-sm font-medium">
              {formatCurrency(spent)} из {formatCurrency(budget)}
            </span>
          </div>
          <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                isOverBudget ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(spentPercentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">{spentPercentage.toFixed(1)}% освоено</span>
            <span className={`text-xs font-medium ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {remaining >= 0 ? `Остаток: ${formatCurrency(remaining)}` : `Перерасход: ${formatCurrency(Math.abs(remaining))}`}
            </span>
          </div>
        </div>

        {/* Прогресс-бар доходов */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Получено</span>
            <span className="text-sm font-medium text-green-600">
              {formatCurrency(received)}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{ width: `${receivedPercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">{receivedPercentage.toFixed(1)}% от бюджета</span>
          </div>
        </div>

        {/* Сравнение со сметой */}
        {estimateTotal > 0 && (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-500" />
                <span className="text-sm text-gray-600">По смете</span>
              </div>
              <span className="text-sm font-medium text-indigo-600">
                {formatCurrency(estimateTotal)}
              </span>
            </div>
            {estimateVsBudget && (
              <p className="text-xs text-gray-500 mt-1">
                {Number(estimateVsBudget) > 100 
                  ? `Смета превышает бюджет на ${Number(estimateVsBudget) - 100}%`
                  : `Смета составляет ${estimateVsBudget}% от бюджета`
                }
              </p>
            )}
          </div>
        )}

        {/* Итоговая сводка */}
        <div className="grid grid-cols-3 gap-4 pt-3 border-t">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{formatCurrency(budget)}</p>
            <p className="text-xs text-gray-500">Бюджет</p>
          </div>
          <div className="text-center">
            <p className={`text-lg font-bold ${isOverBudget ? 'text-red-600' : 'text-blue-600'}`}>
              {formatCurrency(spent)}
            </p>
            <p className="text-xs text-gray-500">Потрачено</p>
          </div>
          <div className="text-center">
            <p className={`text-lg font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(remaining)}
            </p>
            <p className="text-xs text-gray-500">Остаток</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
