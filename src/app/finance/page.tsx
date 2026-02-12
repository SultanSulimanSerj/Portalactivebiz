'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Layout from '@/components/layout'
import { Plus, TrendingUp, TrendingDown, Filter, X, Trash2, ArrowLeft, DollarSign, Percent, Download, Settings } from 'lucide-react'
import Link from 'next/link'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { KpiCard } from '@/components/finance/KpiCard'
import { ExpenseStructureChart } from '@/components/finance/ExpenseStructureChart'
import { BudgetProgressBar } from '@/components/finance/BudgetProgressBar'
import { BudgetCategoriesTable } from '@/components/finance/BudgetCategoriesTable'
import { InvoicesTable } from '@/components/finance/InvoicesTable'

interface FinanceRecord {
  id: string
  type: string
  category: string
  amount: number
  date: string
  description: string | null
  project: { id: string; name: string } | null
}

export default function FinancePage() {
  const searchParams = useSearchParams()
  const projectIdFromUrl = searchParams?.get('projectId')
  
  const [records, setRecords] = useState<FinanceRecord[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [currentProject, setCurrentProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [budgetFormData, setBudgetFormData] = useState('')
  const [budgetData, setBudgetData] = useState({
    budget: 0,
    estimateTotal: 0,
    spent: 0,
    received: 0
  })
  const [expenseStructure, setExpenseStructure] = useState<Array<{category: string, amount: number}>>([])
  const [categoriesData, setCategoriesData] = useState<Array<{id: string, category: string, plan: number, fact: number, percentage: number}>>([])
  const [invoicesData, setInvoicesData] = useState<Array<{
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
  }>>([])
  const [formData, setFormData] = useState({
    type: 'INCOME',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    projectId: projectIdFromUrl || '',
    estimateItemId: ''
  })
  const [estimateItems, setEstimateItems] = useState<Array<{id: string, name: string}>>([])

  useEffect(() => {
    fetchRecords()
    fetchProjects()
    fetchCategoriesData()
    fetchInvoicesData()
    if (projectIdFromUrl) {
      fetchCurrentProject()
      fetchEstimateItems(projectIdFromUrl)
    }
  }, [projectIdFromUrl])

  // Загружаем позиции сметы при изменении проекта
  useEffect(() => {
    if (formData.projectId && formData.type === 'EXPENSE') {
      fetchEstimateItems(formData.projectId)
    } else {
      setEstimateItems([])
    }
  }, [formData.projectId, formData.type])

  const fetchEstimateItems = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/estimates`)
      if (response.ok) {
        const estimates = await response.json()
        const items: Array<{id: string, name: string}> = []
        estimates.forEach((est: any) => {
          est.items?.forEach((item: any) => {
            items.push({ id: item.id, name: `${item.name} (${est.name})` })
          })
        })
        setEstimateItems(items)
      }
    } catch (err) {
      console.error('Error fetching estimate items:', err)
    }
  }

  // Пересчитываем данные бюджета когда records или currentProject меняются
  useEffect(() => {
    fetchBudgetData()
  }, [records, currentProject, projectIdFromUrl])

  const fetchCurrentProject = async () => {
    if (!projectIdFromUrl) return
    try {
      const response = await fetch(`/api/projects/${projectIdFromUrl}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentProject(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchRecords = async () => {
    try {
      const response = await fetch('/api/finance', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Finance records loaded:', data.finances?.length)
        setRecords(data.finances || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchBudgetData = async () => {
    try {
      // Получаем данные о бюджете и смете
      let budget = 0
      let estimateTotal = 0
      
      if (projectIdFromUrl && currentProject) {
        budget = Number(currentProject.budget) || 0
        
        // Загружаем сумму сметы
        const estimateRes = await fetch(`/api/projects/${projectIdFromUrl}/estimates`)
        if (estimateRes.ok) {
          const estimates = await estimateRes.json()
          estimateTotal = estimates.reduce((sum: number, est: any) => 
            sum + Number(est.totalWithVat || est.total || 0), 0)
        }
      }

      // Считаем расходы и доходы из records
      const projectRecords = projectIdFromUrl 
        ? records.filter(r => r.project?.id === projectIdFromUrl)
        : records
      
      const spent = projectRecords
        .filter(r => r.type === 'EXPENSE')
        .reduce((sum, r) => sum + Number(r.amount), 0)
      
      const received = projectRecords
        .filter(r => r.type === 'INCOME')
        .reduce((sum, r) => sum + Number(r.amount), 0)

      setBudgetData({ budget, estimateTotal, spent, received })

      // Структура расходов по категориям
      const expensesByCategory = projectRecords
        .filter(r => r.type === 'EXPENSE')
        .reduce((acc: Record<string, number>, r) => {
          acc[r.category] = (acc[r.category] || 0) + Number(r.amount)
          return acc
        }, {})

      const structureData = Object.entries(expensesByCategory)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)

      setExpenseStructure(structureData)
    } catch (err) {
      console.error('Error fetching budget data:', err)
    }
  }

  const fetchCategoriesData = async () => {
    try {
      const response = await fetch('/api/finance/categories', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      if (response.ok) {
        const data = await response.json()
        setCategoriesData(data)
      }
    } catch (err) {
      console.error('Error fetching categories data:', err)
    }
  }

  const fetchInvoicesData = async () => {
    try {
      const response = await fetch('/api/finance/invoices', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      if (response.ok) {
        const data = await response.json()
        setInvoicesData(data)
      }
    } catch (err) {
      console.error('Error fetching invoices data:', err)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects', {
      })
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/finance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          projectId: formData.projectId || null,
          estimateItemId: formData.estimateItemId || null
        })
      })

      if (response.ok) {
        setShowModal(false)
        setFormData({
          type: 'INCOME',
          category: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          description: '',
          projectId: '',
          estimateItemId: ''
        })
        fetchRecords()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить запись?')) return

    try {
      const response = await fetch(`/api/finance/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchRecords()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Action handlers for new components
  const handleExport = async () => {
    try {
      // Фильтруем записи
      const exportRecords = projectIdFromUrl 
        ? records.filter(r => r.project?.id === projectIdFromUrl)
        : records

      // Вызываем API для генерации Excel
      const response = await fetch('/api/finance/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: exportRecords,
          projectName: currentProject?.name || 'Все проекты'
        })
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Скачиваем файл
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Получаем имя файла из заголовка
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'Финансы.xlsx'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/)
        if (filenameMatch) {
          filename = decodeURIComponent(filenameMatch[1])
        }
      }
      
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
      alert('Ошибка экспорта')
    }
  }

  const handleBudgetSettings = () => {
    if (!projectIdFromUrl) {
      alert('Выберите проект для настройки бюджета')
      return
    }
    setBudgetFormData(String(currentProject?.budget || 0))
    setShowBudgetModal(true)
  }

  const handleSaveBudget = async () => {
    if (!projectIdFromUrl) return
    
    try {
      const response = await fetch(`/api/projects/${projectIdFromUrl}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget: parseFloat(budgetFormData) || 0 })
      })

      if (response.ok) {
        const updated = await response.json()
        setCurrentProject(updated)
        setShowBudgetModal(false)
        fetchBudgetData()
      } else {
        alert('Ошибка сохранения бюджета')
      }
    } catch (err) {
      console.error(err)
      alert('Ошибка сохранения бюджета')
    }
  }

  const handleAddOperation = () => {
    setShowModal(true)
  }

  const handleCreateInvoice = () => {
    // TODO: Implement create invoice functionality
    console.log('Create invoice clicked')
  }

  const handleCreatePayment = () => {
    // TODO: Implement create payment functionality
    console.log('Create payment clicked')
  }

  const handleMarkAsPaid = async (financeId: string, isPaid: boolean) => {
    try {
      const response = await fetch('/api/finance/invoices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ financeId, isPaid })
      })

      if (response.ok) {
        // Обновляем локальное состояние
        setInvoicesData(prev => prev.map(item => 
          item.id === financeId 
            ? { ...item, isPaid, status: isPaid ? 'paid' : (new Date(item.dueDate) < new Date() ? 'overdue' : 'pending') as 'paid' | 'pending' | 'overdue' }
            : item
        ))
      }
    } catch (err) {
      console.error('Error marking invoice as paid:', err)
    }
  }

  const projectFilteredRecords = projectIdFromUrl 
    ? records.filter(r => r.project?.id === projectIdFromUrl)
    : records
  
  const filteredRecords = filterType === 'all' 
    ? projectFilteredRecords 
    : projectFilteredRecords.filter(r => r.type === filterType)
  
  const totalIncome = projectFilteredRecords.filter(r => r.type === 'INCOME').reduce((sum, r) => sum + Number(r.amount), 0)
  const totalPlannedIncome = projectFilteredRecords.filter(r => r.type === 'PLANNED_INCOME').reduce((sum, r) => sum + Number(r.amount), 0)
  const totalExpenses = projectFilteredRecords.filter(r => r.type === 'EXPENSE').reduce((sum, r) => sum + Number(r.amount), 0)
  const balance = totalIncome - totalExpenses
  const margin = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Загрузка...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        {currentProject && (
          <Link 
            href={`/projects/${currentProject.id}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Вернуться к проекту "{currentProject.name}"
          </Link>
        )}
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentProject ? `Финансы проекта "${currentProject.name}"` : 'Финансы'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">{filteredRecords.length} записей</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Экспорт
            </Button>
            <Button onClick={handleBudgetSettings} variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Настройки бюджета
            </Button>
            <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Добавить запись
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Бюджет"
            value={new Intl.NumberFormat('ru-RU', {
              style: 'currency',
              currency: 'RUB',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(budgetData.budget)}
            icon={<DollarSign className="h-5 w-5" />}
            status="neutral"
          />
          <KpiCard
            title="Потрачено"
            value={new Intl.NumberFormat('ru-RU', {
              style: 'currency',
              currency: 'RUB',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(budgetData.spent)}
            change={budgetData.budget > 0 ? Number(((budgetData.spent / budgetData.budget) * 100).toFixed(1)) : 0}
            changeLabel="от бюджета"
            icon={<TrendingDown className="h-5 w-5" />}
            status={budgetData.spent > budgetData.budget ? 'negative' : 'neutral'}
          />
          <KpiCard
            title="Остаток"
            value={new Intl.NumberFormat('ru-RU', {
              style: 'currency',
              currency: 'RUB',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(budgetData.budget - budgetData.spent)}
            icon={<Percent className="h-5 w-5" />}
            status={budgetData.budget - budgetData.spent >= 0 ? 'positive' : 'negative'}
          />
          <KpiCard
            title="Получено"
            value={new Intl.NumberFormat('ru-RU', {
              style: 'currency',
              currency: 'RUB',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(budgetData.received)}
            icon={<TrendingUp className="h-5 w-5" />}
            status="positive"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-gray-400" />
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                filterType === 'all' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setFilterType('INCOME')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                filterType === 'INCOME' ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Доходы
            </button>
            <button
              onClick={() => setFilterType('PLANNED_INCOME')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                filterType === 'PLANNED_INCOME' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Планируемый доход
            </button>
            <button
              onClick={() => setFilterType('EXPENSE')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                filterType === 'EXPENSE' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Расходы
            </button>
          </div>
        </div>

        {/* Budget Progress & Expense Structure */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BudgetProgressBar
            budget={budgetData.budget}
            estimateTotal={budgetData.estimateTotal}
            spent={budgetData.spent}
            received={budgetData.received}
            projectName={currentProject?.name}
          />
          <ExpenseStructureChart
            data={expenseStructure}
            total={budgetData.spent}
          />
        </div>

        {/* Detailed Sections */}
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="categories">
            <AccordionTrigger>Детализация по статьям</AccordionTrigger>
            <AccordionContent>
              <BudgetCategoriesTable 
                data={categoriesData}
                onAddOperation={handleAddOperation}
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="invoices">
            <AccordionTrigger>Счета и платежи</AccordionTrigger>
            <AccordionContent>
              <InvoicesTable 
                data={invoicesData}
                onCreateInvoice={handleCreateInvoice}
                onCreatePayment={handleCreatePayment}
                onMarkAsPaid={handleMarkAsPaid}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">Тип</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Категория</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Проект</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Сумма</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {record.type === 'INCOME' ? (
                          <div className="p-1.5 bg-green-50 rounded">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          </div>
                        ) : record.type === 'PLANNED_INCOME' ? (
                          <div className="p-1.5 bg-blue-50 rounded">
                            <DollarSign className="h-4 w-4 text-blue-600" />
                          </div>
                        ) : (
                          <div className="p-1.5 bg-red-50 rounded">
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-gray-900">{record.category}</div>
                      {record.description && (
                        <div className="text-xs text-gray-500 line-clamp-1">{record.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700">{record.project?.name || '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700">
                        {new Date(record.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className={`text-sm font-bold ${
                        record.type === 'INCOME' ? 'text-green-600' : 
                        record.type === 'PLANNED_INCOME' ? 'text-blue-600' : 
                        'text-red-600'
                      }`}>
                        {record.type === 'EXPENSE' ? '-' : '+'}{Number(record.amount).toLocaleString()} ₽
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => handleDelete(record.id)}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Budget Settings Modal */}
        {showBudgetModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Настройки бюджета</h2>
                <button onClick={() => setShowBudgetModal(false)} className="p-2 hover:bg-gray-100 rounded">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Бюджет проекта (₽)
                  </label>
                  <input
                    type="number"
                    value={budgetFormData}
                    onChange={(e) => setBudgetFormData(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Введите сумму бюджета"
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Информация</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Сумма сметы: {new Intl.NumberFormat('ru-RU').format(budgetData.estimateTotal)} ₽</p>
                    <p>Потрачено: {new Intl.NumberFormat('ru-RU').format(budgetData.spent)} ₽</p>
                    <p>Получено: {new Intl.NumberFormat('ru-RU').format(budgetData.received)} ₽</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSaveBudget}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={() => setShowBudgetModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Добавить финансовую запись</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Тип *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="INCOME">Доход</option>
                      <option value="EXPENSE">Расход</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Категория *</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Сумма *</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Дата *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Проект</label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({...formData, projectId: e.target.value, estimateItemId: ''})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Без проекта</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {formData.type === 'EXPENSE' && formData.projectId && estimateItems.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Позиция сметы (опционально)</label>
                    <select
                      value={formData.estimateItemId}
                      onChange={(e) => setFormData({...formData, estimateItemId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Не привязывать</option>
                      {estimateItems.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                  >
                    Добавить
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}