'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/layout'
import { ArrowLeft, Edit, Users, FileText, Flag, DollarSign, Calendar, X, MessageSquare, Send, TrendingUp, TrendingDown, Percent, Plus, UserMinus } from 'lucide-react'
import Link from 'next/link'
import { PermissionButton } from '@/components/permission-guard'

interface ProjectDetail {
  id: string
  name: string
  description: string | null
  status: string
  priority: string
  budget: number | null
  startDate: string | null
  endDate: string | null
  creator: { name: string }
  users: Array<{ user: { id: string; name: string } }>
  _count: { tasks: number; documents: number; users: number }
  // Реквизиты клиента
  clientName?: string
  clientLegalName?: string
  clientInn?: string
  clientKpp?: string
  clientOgrn?: string
  clientLegalAddress?: string
  clientActualAddress?: string
  clientDirectorName?: string
  clientContactPhone?: string
  clientContactEmail?: string
  clientBankAccount?: string
  clientBankName?: string
  clientBankBik?: string
  clientCorrespondentAccount?: string
}

interface Message {
  id: string
  content: string
  createdAt: string
  user: { id: string; name: string }
}

interface FinanceStats {
  totalIncome: number
  totalExpenses: number
  profit: number
  margin: number
}

interface User {
  id: string
  name: string
  email: string
  position: string | null
  phone: string | null
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [financeStats, setFinanceStats] = useState<FinanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'PLANNING',
    priority: 'MEDIUM',
    budget: '',
    startDate: '',
    endDate: ''
  })
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [membersLoading, setMembersLoading] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<User | null>(null)
  const [estimatesTotal, setEstimatesTotal] = useState<number>(0)

  useEffect(() => {
    if (params?.id) {
      fetchProject()
      fetchMessages()
      fetchFinanceStats()
      fetchEstimatesTotal()
    }
  }, [params?.id])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params?.id}`, {
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Project data:', data) // Отладочная информация
        setProject(data)
      } else {
        router.push('/projects')
      }
    } catch (err) {
      console.error(err)
      router.push('/projects')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/projects/${params?.id}/messages`, {
      })
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchFinanceStats = async () => {
    try {
      const response = await fetch(`/api/finance?projectId=${params?.id}`, {
      })
      if (response.ok) {
        const data = await response.json()
        const finances = data.finances || []
        
        const totalIncome = finances.filter((f: any) => f.type === 'INCOME').reduce((sum: number, f: any) => sum + Number(f.amount), 0)
        const totalExpenses = finances.filter((f: any) => f.type === 'EXPENSE').reduce((sum: number, f: any) => sum + Number(f.amount), 0)
        const profit = totalIncome - totalExpenses
        const margin = totalIncome > 0 ? ((profit / totalIncome) * 100) : 0
        
        setFinanceStats({
          totalIncome,
          totalExpenses,
          profit,
          margin
        })
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchEstimatesTotal = async () => {
    try {
      const response = await fetch(`/api/projects/${params?.id}/estimates`)
      if (response.ok) {
        const estimates = await response.json()
        const total = estimates.reduce((sum: number, estimate: any) => {
          return sum + Number(estimate.totalWithVat || estimate.total || 0)
        }, 0)
        setEstimatesTotal(total)
      }
    } catch (error) {
      console.error('Error fetching estimates total:', error)
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setAvailableUsers(data.users || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddMember = async () => {
    if (!selectedUserId) return
    
    setMembersLoading(true)
    try {
      const response = await fetch(`/api/projects/${params?.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId })
      })
      
      if (response.ok) {
        console.log('Member added successfully, refreshing project data...')
        await fetchProject() // Обновляем данные проекта
        console.log('Project data refreshed:', project)
        setSelectedUserId('')
        setShowMembersModal(false)
        // Принудительно обновляем страницу через небольшую задержку
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка при добавлении участника')
      }
    } catch (err) {
      console.error(err)
      alert('Ошибка при добавлении участника')
    } finally {
      setMembersLoading(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Удалить участника из проекта?')) return
    
    try {
      const response = await fetch(`/api/projects/${params?.id}/members?userId=${userId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchProject() // Обновляем данные проекта
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка при удалении участника')
      }
    } catch (err) {
      console.error(err)
      alert('Ошибка при удалении участника')
    }
  }

  const handleShowContact = (member: any) => {
    setSelectedMember(member.user)
    setShowContactModal(true)
  }

  const handleEdit = () => {
    if (!project) return
    
    setFormData({
      name: project.name,
      description: project.description || '',
      status: project.status,
      priority: project.priority,
      budget: project.budget?.toString() || '',
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/projects/${params?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null
        })
      })

      if (response.ok) {
        setShowModal(false)
        fetchProject()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      const response = await fetch(`/api/projects/${params?.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage
        })
      })

      if (response.ok) {
        setNewMessage('')
        fetchMessages()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'PLANNING': 'Планирование',
      'ACTIVE': 'Активный',
      'COMPLETED': 'Завершен',
      'ON_HOLD': 'Приостановлен',
      'CANCELLED': 'Отменен'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'PLANNING': 'bg-blue-100 text-blue-800 border-blue-200',
      'ACTIVE': 'bg-green-100 text-green-800 border-green-200',
      'COMPLETED': 'bg-gray-100 text-gray-800 border-gray-200',
      'ON_HOLD': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'CANCELLED': 'bg-red-100 text-red-800 border-red-200'
    }
    return colorMap[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityText = (priority: string) => {
    const priorityMap: { [key: string]: string } = {
      'LOW': 'Низкий',
      'MEDIUM': 'Средний',
      'HIGH': 'Высокий',
      'URGENT': 'Срочный'
    }
    return priorityMap[priority] || priority
  }

  const getPriorityColor = (priority: string) => {
    const colorMap: { [key: string]: string } = {
      'LOW': 'bg-green-100 text-green-800',
      'MEDIUM': 'bg-blue-100 text-blue-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'URGENT': 'bg-red-100 text-red-800'
    }
    return colorMap[priority] || 'bg-gray-100 text-gray-800'
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

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Проект не найден</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link 
            href="/projects"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                {getStatusText(project.status)}
              </span>
              <span className="text-sm text-gray-600">
                Создатель: {project.creator.name}
              </span>
            </div>
          </div>
          <button 
            onClick={handleEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Редактировать
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Link 
            href={`/tasks?projectId=${project.id}`}
            className="bg-white rounded-lg p-5 border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Flag className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{project._count.tasks}</p>
            <p className="text-xs text-gray-600">Задач →</p>
          </Link>

          <Link 
            href={`/documents?projectId=${project.id}`}
            className="bg-white rounded-lg p-5 border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-50 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{project._count.documents}</p>
            <p className="text-xs text-gray-600">Документов →</p>
          </Link>

          <Link 
            href={`/finance?projectId=${project.id}`}
            className="bg-white rounded-lg p-5 border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {project.budget ? `${(project.budget / 1000000).toFixed(1)}M ₽` : '—'}
            </p>
            <p className="text-xs text-gray-600">Бюджет →</p>
          </Link>

          <Link 
            href={`/projects/${project.id}/estimate`}
            className="bg-white rounded-lg p-5 border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <FileText className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {estimatesTotal > 0 ? `${estimatesTotal.toLocaleString('ru-RU')} ₽` : '—'}
            </p>
            <p className="text-xs text-gray-600">Смета →</p>
          </Link>


          <Link 
            href={`/documents/generate?projectId=${project.id}`}
            className="bg-white rounded-lg p-5 border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-blue-600">Создать договор</p>
            <p className="text-xs text-gray-600">Генерация документа →</p>
          </Link>
        </div>

        {/* Financial Stats */}
        {financeStats && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Финансовая статистика</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Доходы</span>
                </div>
                <p className="text-xl font-bold text-green-600">
                  {financeStats.totalIncome.toLocaleString()} ₽
                </p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-gray-600">Расходы</span>
                </div>
                <p className="text-xl font-bold text-red-600">
                  {financeStats.totalExpenses.toLocaleString()} ₽
                </p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Прибыль</span>
                </div>
                <p className={`text-xl font-bold ${financeStats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {financeStats.profit.toLocaleString()} ₽
                </p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Percent className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Маржа</span>
                </div>
                <p className={`text-xl font-bold ${financeStats.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {financeStats.margin.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Details */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Детали проекта</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {project.startDate && (
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Дата начала</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(project.startDate).toLocaleDateString('ru-RU')}
                </p>
              </div>
            )}
            {project.endDate && (
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Дата окончания</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(project.endDate).toLocaleDateString('ru-RU')}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500 mb-1">Приоритет</p>
              <p className={`text-sm font-medium ${
                project.priority === 'HIGH' ? 'text-red-600' : 
                project.priority === 'MEDIUM' ? 'text-blue-600' : 'text-green-600'
              }`}>
                {getPriorityText(project.priority)}
              </p>
            </div>
            {project.budget && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Бюджет</p>
                <p className="text-sm font-medium text-gray-900">
                  {project.budget.toLocaleString()} ₽
                </p>
              </div>
            )}
          </div>
          {project.description && (
            <div className="mt-6">
              <p className="text-sm text-gray-500 mb-2">Описание</p>
              <p className="text-sm text-gray-900">{project.description}</p>
            </div>
          )}

          {/* Реквизиты клиента */}
          {project.clientName && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">Реквизиты клиента</p>
                <Link
                  href={`/projects/${project.id}/client-requisites`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Редактировать
                </Link>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{project.clientName}</p>
                    {project.clientLegalName && (
                      <p className="text-xs text-gray-600 mt-1">{project.clientLegalName}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {project.clientInn && (
                      <p className="text-xs text-gray-600">ИНН: {project.clientInn}</p>
                    )}
                    {project.clientKpp && (
                      <p className="text-xs text-gray-600">КПП: {project.clientKpp}</p>
                    )}
                  </div>
                </div>
                {project.clientLegalAddress && (
                  <p className="text-xs text-gray-600 mt-2">Адрес: {project.clientLegalAddress}</p>
                )}
                {project.clientContactPhone && (
                  <p className="text-xs text-gray-600">Телефон: {project.clientContactPhone}</p>
                )}
                {project.clientContactEmail && (
                  <p className="text-xs text-gray-600">Email: {project.clientContactEmail}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Team */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Команда ({project._count.users})</h2>
            <PermissionButton
              permission="canManageProjectMembers"
              onClick={() => {
                fetchAvailableUsers()
                setShowMembersModal(true)
              }}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Добавить участника
            </PermissionButton>
          </div>
          
          {project._count.users > 0 ? (
            <div className="flex flex-wrap gap-2">
              {project.users.map((member) => {
                console.log('Rendering member:', member) // Отладочная информация
                return (
                  <div key={member.user.id} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <div 
                      className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer"
                      onClick={() => handleShowContact(member)}
                      title="Показать контакты"
                    >
                      <span className="text-xs text-white font-medium">
                        {member.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span 
                      className="text-sm text-gray-700 cursor-pointer hover:text-blue-600"
                      onClick={() => handleShowContact(member)}
                      title="Показать контакты"
                    >
                    {member.user.name}
                  </span>
                    <PermissionButton
                      permission="canManageProjectMembers"
                      onClick={() => handleRemoveMember(member.user.id)}
                      className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                    >
                      <UserMinus className="h-3 w-3" />
                    </PermissionButton>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Участники не добавлены</p>
          )}
        </div>

        {/* Chat */}
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Обсуждение проекта
            </h2>
          </div>
          
          <div className="p-6 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Пока нет сообщений</p>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-white font-medium">
                        {message.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">{message.user.name}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleString('ru-RU')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <form onSubmit={handleSendMessage} className="p-6 border-t">
            <div className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Написать сообщение..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Отправить
              </button>
            </div>
          </form>
        </div>

        {/* Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Редактировать проект</h2>
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
                      <option value="COMPLETED">Завершен</option>
                      <option value="ON_HOLD">Приостановлен</option>
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
                      <option value="URGENT">Срочный</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Бюджет (₽)</label>
                    <input
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({...formData, budget: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Изменение бюджета обновит финансовую запись планируемого дохода
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Дата начала</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
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

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    Сохранить
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

        {/* Add Member Modal */}
        {showMembersModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Добавить участника</h2>
                <button 
                  onClick={() => setShowMembersModal(false)} 
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Выберите пользователя
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Выберите пользователя...</option>
                    {availableUsers
                      .filter(user => !project?.users.some(member => member.user.id === user.id))
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email}) {user.position && `- ${user.position}`}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAddMember}
                    disabled={!selectedUserId || membersLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {membersLoading ? 'Добавление...' : 'Добавить'}
                  </button>
                  <button
                    onClick={() => setShowMembersModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Modal */}
        {showContactModal && selectedMember && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Контактные данные</h2>
                <button 
                  onClick={() => setShowContactModal(false)} 
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl text-white font-medium">
                      {selectedMember.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedMember.name}</h3>
                    {selectedMember.position && (
                      <p className="text-sm text-gray-600">{selectedMember.position}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm">📧</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900">{selectedMember.email}</p>
                    </div>
                  </div>

                  {selectedMember.phone && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm">📞</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Телефон</p>
                        <p className="text-sm font-medium text-gray-900">{selectedMember.phone}</p>
                      </div>
                    </div>
                  )}

                  {selectedMember.position && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm">💼</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Должность</p>
                        <p className="text-sm font-medium text-gray-900">{selectedMember.position}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-6">
                  <button
                    onClick={() => setShowContactModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
