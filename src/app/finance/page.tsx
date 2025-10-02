'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Layout from '@/components/layout'
import { Plus, TrendingUp, TrendingDown, Filter, X, Trash2, ArrowLeft, DollarSign, Percent } from 'lucide-react'
import Link from 'next/link'

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
  const [formData, setFormData] = useState({
    type: 'INCOME',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    projectId: projectIdFromUrl || ''
  })

  useEffect(() => {
    fetchRecords()
    fetchProjects()
    if (projectIdFromUrl) {
      fetchCurrentProject()
    }
  }, [projectIdFromUrl])

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
      })
      if (response.ok) {
        const data = await response.json()
        setRecords(data.finances || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
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
          projectId: formData.projectId || null
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
          projectId: ''
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
          <button 
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Добавить запись
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-5 border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">План. доход</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{totalPlannedIncome.toLocaleString()} ₽</p>
          </div>

          <div className="bg-white rounded-lg p-5 border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">Доходы</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{totalIncome.toLocaleString()} ₽</p>
          </div>

          <div className="bg-white rounded-lg p-5 border border-red-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-50 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-sm text-gray-600">Расходы</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{totalExpenses.toLocaleString()} ₽</p>
          </div>

          <div className={`bg-white rounded-lg p-5 border ${balance >= 0 ? 'border-green-200' : 'border-red-200'}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Percent className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-sm text-gray-600">Прибыль</p>
            </div>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {balance.toLocaleString()} ₽
            </p>
            <p className="text-xs text-gray-500 mt-1">Маржа: {margin.toFixed(1)}%</p>
          </div>
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
                    onChange={(e) => setFormData({...formData, projectId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Без проекта</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

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