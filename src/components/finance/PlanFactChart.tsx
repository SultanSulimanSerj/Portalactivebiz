/**
 * Plan vs Fact Chart component
 * Displays financial data comparison over time with period tabs
 */

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface ChartData {
  date: string
  plan: number
  fact: number
}

interface PlanFactChartProps {
  data: ChartData[]
  period: 'month' | 'quarter' | 'year'
  onPeriodChange: (period: 'month' | 'quarter' | 'year') => void
}

export function PlanFactChart({ data, period, onPeriodChange }: PlanFactChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-sm text-blue-600">
            План: {formatCurrency(payload[0]?.value || 0)}
          </p>
          <p className="text-sm text-green-600">
            Факт: {formatCurrency(payload[1]?.value || 0)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>План vs Факт по времени</CardTitle>
        <Tabs value={period} onValueChange={(value) => onPeriodChange(value as 'month' | 'quarter' | 'year')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="month">Месяц</TabsTrigger>
            <TabsTrigger value="quarter">Квартал</TabsTrigger>
            <TabsTrigger value="year">Год</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="planGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="currentColor" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="currentColor" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="factGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="currentColor" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="currentColor" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="plan"
                stroke="currentColor"
                fill="url(#planGradient)"
                className="text-blue-500"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="fact"
                stroke="currentColor"
                fill="url(#factGradient)"
                className="text-green-500"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
