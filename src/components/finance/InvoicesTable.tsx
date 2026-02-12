/**
 * Invoices and Payments Table component
 * Shows invoices, payments and their statuses
 */

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, FileText, CreditCard, Check, Loader2 } from "lucide-react"

interface InvoiceData {
  id: string
  number: string
  type: 'invoice' | 'payment'
  amount: number
  dueDate: string
  isPaid: boolean
  paidAt: string | null
  paidBy: { id: string; name: string } | null
  status: 'paid' | 'pending' | 'overdue'
  description?: string
  category?: string
}

interface InvoicesTableProps {
  data: InvoiceData[]
  onCreateInvoice?: () => void
  onCreatePayment?: () => void
  onMarkAsPaid?: (financeId: string, isPaid: boolean) => Promise<void>
}

export function InvoicesTable({ data, onCreateInvoice, onCreatePayment, onMarkAsPaid }: InvoicesTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Оплачен</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Ожидает</Badge>
      case 'overdue':
        return <Badge variant="destructive">Просрочен</Badge>
      default:
        return <Badge variant="outline">Неизвестно</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    return type === 'invoice' ? 
      <FileText className="h-4 w-4" /> : 
      <CreditCard className="h-4 w-4" />
  }

  const handleMarkAsPaid = async (item: InvoiceData) => {
    if (!onMarkAsPaid) return
    
    setLoadingId(item.id)
    try {
      await onMarkAsPaid(item.id, !item.isPaid)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Счета и платежи</CardTitle>
          <div className="flex gap-2">
            {onCreateInvoice && (
              <Button onClick={onCreateInvoice} size="sm" variant="outline" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Создать счёт
              </Button>
            )}
            {onCreatePayment && (
              <Button onClick={onCreatePayment} size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Добавить платёж
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-600">№</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Тип</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Описание</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Сумма</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Срок</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Статус</th>
                {onMarkAsPaid && (
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Действие</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{item.number}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(item.type)}
                      <span className="capitalize">
                        {item.type === 'invoice' ? 'Счёт' : 'Платёж'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600 max-w-[200px] truncate">
                    {item.description || item.category || '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-medium">{formatCurrency(item.amount)}</td>
                  <td className="py-3 px-4 text-right">{formatDate(item.dueDate)}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      {getStatusBadge(item.status)}
                      {item.isPaid && item.paidBy && (
                        <span className="text-xs text-gray-500">
                          {item.paidBy.name}
                        </span>
                      )}
                    </div>
                  </td>
                  {onMarkAsPaid && (
                    <td className="py-3 px-4 text-center">
                      <Button
                        size="sm"
                        variant={item.isPaid ? "outline" : "default"}
                        onClick={() => handleMarkAsPaid(item)}
                        disabled={loadingId === item.id}
                        className="flex items-center gap-1"
                      >
                        {loadingId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        {item.isPaid ? 'Отменить' : 'Оплачено'}
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}



