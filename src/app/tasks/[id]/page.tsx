'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/layout'
import { ArrowLeft, Edit, Calendar, User, FolderOpen, MessageSquare, Send, Save, X } from 'lucide-react'
import Link from 'next/link'

interface TaskDetail {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  createdAt: string
  project: { id: string; name: string } | null
  creator: { id: string; name: string }
  assignments: Array<{ user: { id: string; name: string } }>
}

interface Comment {
  id: string
  content: string
  createdAt: string
  user: { name: string }
}

interface User {
  id: string
  name: string
  email: string
}

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: '',
    assigneeIds: [] as string[]
  })

  useEffect(() => {
    if (params.id) {
      fetchTask()
      fetchComments()
      fetchUsers()
    }
  }, [params.id])

  const fetchTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${params.id}`, {
      })
      if (response.ok) {
        const data = await response.json()
        setTask(data)
      } else {
        router.push('/tasks')
      }
    } catch (err) {
      console.error(err)
      router.push('/tasks')
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/tasks/${params.id}/comments`, {
      })
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      const response = await fetch(`/api/tasks/${params.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment })
      })

      if (response.ok) {
        setNewComment('')
        fetchComments()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleEditTask = () => {
    if (!task) return
    
    setEditForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      assigneeIds: task.assignments.map(a => a.user.id)
    })
    setShowEditModal(true)
  }

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch(`/api/tasks/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          status: editForm.status,
          priority: editForm.priority,
          dueDate: editForm.dueDate ? new Date(editForm.dueDate).toISOString() : null,
          assigneeIds: editForm.assigneeIds
        })
      })

      if (response.ok) {
        setShowEditModal(false)
        fetchTask() // Обновляем данные задачи
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      'TODO': 'bg-gray-50 text-gray-700 border-gray-200',
      'IN_PROGRESS': 'bg-blue-50 text-blue-700 border-blue-200',
      'COMPLETED': 'bg-green-50 text-green-700 border-green-200',
      'CANCELLED': 'bg-red-50 text-red-700 border-red-200'
    }
    return map[status] || 'bg-gray-50 text-gray-700'
  }

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      'TODO': 'К выполнению',
      'IN_PROGRESS': 'В работе',
      'COMPLETED': 'Завершена',
      'CANCELLED': 'Отменена'
    }
    return map[status] || status
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
          <div className="text-sm text-gray-500">Загрузка...</div>
        </div>
      </Layout>
    )
  }

  if (!task) {
    return null
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link 
            href={task.project ? `/projects/${task.project.id}` : '/tasks'}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            {task.project ? `Вернуться к проекту "${task.project.name}"` : 'Назад к задачам'}
          </Link>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
              {task.description && (
                <p className="text-gray-600 mt-2">{task.description}</p>
              )}
              <div className="flex items-center gap-3 mt-4">
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded border ${getStatusColor(task.status)}`}>
                  {getStatusText(task.status)}
                </span>
                <span className={`text-sm font-semibold ${getPriorityColor(task.priority)}`}>
                  ● {task.priority === 'HIGH' ? 'Высокий' : task.priority === 'MEDIUM' ? 'Средний' : 'Низкий'} приоритет
                </span>
              </div>
            </div>
            <button
              onClick={handleEditTask}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <Edit className="h-4 w-4" />
              Редактировать
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Детали задачи</h2>
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <User className="h-4 w-4" />
                  <span>Создатель</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{task.creator.name}</p>
              </div>

              {task.project && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <FolderOpen className="h-4 w-4" />
                    <span>Проект</span>
                  </div>
                  <Link href={`/projects/${task.project.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                    {task.project.name}
                  </Link>
                </div>
              )}

              {task.dueDate && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span>Срок выполнения</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(task.dueDate).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500 mb-1">Создана</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(task.createdAt).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>
          </div>

          {/* Assignees */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Исполнители</h2>
            {task.assignments.length > 0 ? (
              <div className="space-y-2">
                {task.assignments.map((assignment, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                      {assignment.user.name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{assignment.user.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Исполнители не назначены</p>
            )}
          </div>
        </div>

        {/* Comments */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Комментарии ({comments.length})</h2>
          </div>

          {/* Comments List */}
          <div className="space-y-4 mb-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-semibold flex-shrink-0">
                  {comment.user.name[0]}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900">{comment.user.name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleString('ru-RU')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="flex gap-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Добавить комментарий..."
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
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Редактировать задачу</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название задачи
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Статус
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TODO">К выполнению</option>
                    <option value="IN_PROGRESS">В работе</option>
                    <option value="COMPLETED">Завершена</option>
                    <option value="CANCELLED">Отменена</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Приоритет
                  </label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">Низкий</option>
                    <option value="MEDIUM">Средний</option>
                    <option value="HIGH">Высокий</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Срок выполнения
                </label>
                <input
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Исполнители
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  {users.map((user) => (
                    <label key={user.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.assigneeIds.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditForm({
                              ...editForm,
                              assigneeIds: [...editForm.assigneeIds, user.id]
                            })
                          } else {
                            setEditForm({
                              ...editForm,
                              assigneeIds: editForm.assigneeIds.filter(id => id !== user.id)
                            })
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{user.name} ({user.email})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
