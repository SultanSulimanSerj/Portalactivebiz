'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/layout'
import { ArrowLeft, Edit, Users, FileText, Flag, DollarSign, Calendar, X, MessageSquare, Send } from 'lucide-react'
import Link from 'next/link'

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
  _count: { tasks: number; documents: number }
}

interface Message {
  id: string
  content: string
  createdAt: string
  user: { id: string; name: string }
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
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

  useEffect(() => {
    if (params.id) {
      fetchProject()
      fetchMessages()
    }
  }, [params.id])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`, {
        headers: { 'Authorization': 'Bearer demo-token' }
      })
      if (response.ok) {
        const data = await response.json()
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

  const handleEdit = () => {
    if (!project) return
    
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

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}/messages`, {
        headers: { 'Authorization': 'Bearer demo-token' }
      })
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/projects/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token'
        },
        body: JSON.stringify(formData)
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
      const response = await fetch(`/api/projects/${params.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token'
        },
        body: JSON.stringify({ content: newMessage })
      })

      if (response.ok) {
        setNewMessage('')
        fetchMessages()
      }
    } catch (err) {
      console.error(err)
    }
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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-sm text-gray-500">Загрузка...</div>
        </div>
      </Layout>
    )
  }

  if (!project) {
    return null
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link 
            href="/projects"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад к проектам
          </Link>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              {project.description && (
                <p className="text-gray-600 mt-2">{project.description}</p>
              )}
              <div className="flex items-center gap-3 mt-4">
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded border ${getStatusColor(project.status)}`}>
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
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

          <div className="bg-white rounded-lg p-5 border">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{project.users.length}</p>
            <p className="text-xs text-gray-600">Участников</p>
          </div>
        </div>

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
                project.priority === 'MEDIUM' ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {project.priority === 'HIGH' ? 'Высокий' : 
                 project.priority === 'MEDIUM' ? 'Средний' : 'Низкий'}
              </p>
            </div>
          </div>
        </div>

        {/* Team */}
        {project.users.length > 0 && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Команда</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {project.users.map((member, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                    {member.user.name?.[0] || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{member.user.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Чат проекта ({messages.length})</h2>
          </div>

          {/* Messages */}
          <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Сообщений пока нет. Начните обсуждение!</p>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {message.user.name?.[0] || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">{message.user.name}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleString('ru-RU')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Send Message Form */}
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Написать сообщение..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Отправить
            </button>
          </form>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
      </div>
    </Layout>
  )
}