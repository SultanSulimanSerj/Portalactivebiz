/**
 * KPI Card component for finance dashboard
 * Displays key financial metrics with visual indicators
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react"

interface KpiCardProps {
  title: string
  value: string
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  status?: 'positive' | 'negative' | 'neutral'
}

export function KpiCard({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon, 
  status = 'neutral' 
}: KpiCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'positive': return 'text-green-600'
      case 'negative': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getChangeIcon = () => {
    if (change === undefined) return null
    return change >= 0 ? 
      <TrendingUp className="h-4 w-4" /> : 
      <TrendingDown className="h-4 w-4" />
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <div className="text-gray-400">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className={`flex items-center text-xs ${getStatusColor()}`}>
            {getChangeIcon()}
            <span className="ml-1">
              {change > 0 ? '+' : ''}{change}% {changeLabel}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}



