'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout'
import { Plus, Search, Edit, Trash2, Users, X } from 'lucide-react'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  priority: string
  budget: number | null
  startDate: string | null
  endDate: string | null
  creator: { name: string | null }
  users: Array<{ user: { id: string; name: string | null } }>
  _count: { tasks: number; documents: number }
  financialSummary?: {
    income: number
    expenses: number
    profit: number
    margin: number
  }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'PLANNING',
    priority: 'MEDIUM',
    budget: '',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects', {
        headers: { 'Authorization': 'Bearer demo-token' }
      })
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingProject(null)
    setFormData({
      name: '',
      description: '',
      status: 'PLANNING',
      priority: 'MEDIUM',
      budget: '',
      startDate: '',
      endDate: ''
    })
    setShowModal(true)
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      description: project.description || '',
      status: project.status,
      priority: project.priority,
      budget: project.budget?.toString() || '',
      startDate: project.startDate?.split('T')[0] || '',
      endDate: project.endDate?.split('T')[0] || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingProject 
        ? `/api/projects/${editingProject.id}`
        : '/api/projects'
      
      const method = editingProject ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowModal(false)
        fetchProjects()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить проект?')) return

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer demo-token' }
      })

      if (response.ok) {
        fetchProjects()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      'PLANNING': 'Планирование',
      'ACTIVE': 'Активный',
      'COMPLETED': 'Завершен',
      'ON_HOLD': 'Приостановлен',
      'CANCELLED': 'Отменен'
    }
    return map[status] || status
  }

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      'PLANNING': 'bg-blue-50 text-blue-700 border-blue-200',
      'ACTIVE': 'bg-green-50 text-green-700 border-green-200',
      'COMPLETED': 'bg-gray-50 text-gray-700 border-gray-200',
      'ON_HOLD': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'CANCELLED': 'bg-red-50 text-red-700 border-red-200'
    }
    return map[status] || 'bg-gray-50 text-gray-700'
  }

  const getPriorityColor = (priority: string) => {
    const map: Record<string, string> = {
      'HIGH': 'text-red-600',
      'MEDIUM': 'text-yellow-600',
      'LOW': 'text-green-600'
    }
    return map[priority] || 'text-gray-600'
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Проекты</h1>
            <p className="text-sm text-gray-600 mt-1">{projects.length} проектов</p>
          </div>
          <button 
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Создать проект
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск проектов..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все статусы</option>
              <option value="PLANNING">Планирование</option>
              <option value="ACTIVE">Активный</option>
              <option value="COMPLETED">Завершен</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Проект</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Доходы</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Расходы</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Прибыль</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Маржа %</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Задачи</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Команда</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProjects.map((project) => {
                  const fs = project.financialSummary
                  return (
                    <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Link 
                              href={`/projects/${project.id}`}
                              className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {project.name}
                            </Link>
                            <span className={`text-xs font-bold ${getPriorityColor(project.priority)}`}>●</span>
                          </div>
                          {project.description && (
                            <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{project.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded border ${getStatusColor(project.status)}`}>
                          {getStatusText(project.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm font-medium text-green-600">
                          {fs ? `+${fs.income.toLocaleString()}` : '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm font-medium text-red-600">
                          {fs ? `-${fs.expenses.toLocaleString()}` : '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className={`text-sm font-semibold ${fs && fs.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {fs ? fs.profit.toLocaleString() : '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className={`text-sm font-semibold ${fs && fs.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {fs ? `${fs.margin}%` : '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="text-sm text-gray-900">{project._count.tasks}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-900">{project.users.length}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => handleEdit(project)}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" 
                            title="Редактировать"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(project.id)}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" 
                            title="Удалить"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingProject ? 'Редактировать проект' : 'Создать проект'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Название *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Статус</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="PLANNING">Планирование</option>
                      <option value="ACTIVE">Активный</option>
                      <option value="ON_HOLD">Приостановлен</option>
                      <option value="COMPLETED">Завершен</option>
                      <option value="CANCELLED">Отменен</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Приоритет</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="LOW">Низкий</option>
                      <option value="MEDIUM">Средний</option>
                      <option value="HIGH">Высокий</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Бюджет (₽)</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Дата начала</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Дата окончания</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    {editingProject ? 'Сохранить' : 'Создать'}
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