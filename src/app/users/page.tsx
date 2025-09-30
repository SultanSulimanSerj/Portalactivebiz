'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout'
import { Plus, Search, Edit, Trash2, X } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
  position?: string
  createdAt: string
  _count: {
    createdProjects: number
    createdTasks: number
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'USER',
    position: '',
    password: ''
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: { 'Authorization': 'Bearer demo-token' }
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingUser(null)
    setError(null)
    setFormData({ name: '', email: '', role: 'USER', position: '', password: '' })
    setShowModal(true)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setError(null)
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      position: user.position || '',
      password: ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    try {
      const url = editingUser 
        ? `/api/users/${editingUser.id}`
        : '/api/users'
      
      const method = editingUser ? 'PUT' : 'POST'
      
      const body = editingUser 
        ? { name: formData.name, email: formData.email, role: formData.role }
        : formData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token'
        },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        setShowModal(false)
        setError(null)
        fetchUsers()
      } else {
        const data = await response.json()
        setError(data.error || 'Ошибка при сохранении')
      }
    } catch (err) {
      console.error(err)
      setError('Ошибка при сохранении')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить пользователя?')) return

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer demo-token' }
      })

      if (response.ok) {
        fetchUsers()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getRoleText = (role: string) => {
    const map: Record<string, string> = {
      'ADMIN': 'Администратор',
      'MANAGER': 'Менеджер',
      'USER': 'Пользователь'
    }
    return map[role] || role
  }

  const getRoleColor = (role: string) => {
    const map: Record<string, string> = {
      'ADMIN': 'bg-red-50 text-red-700 border-red-200',
      'MANAGER': 'bg-blue-50 text-blue-700 border-blue-200',
      'USER': 'bg-gray-50 text-gray-700 border-gray-200'
    }
    return map[role] || 'bg-gray-50 text-gray-700'
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
            <h1 className="text-2xl font-bold text-gray-900">Пользователи</h1>
            <p className="text-sm text-gray-600 mt-1">{users.length} пользователей</p>
          </div>
          <button 
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Добавить пользователя
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по имени или email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Пользователь</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Роль</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Должность</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Проектов</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Задач</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата создания</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700">{user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded border ${getRoleColor(user.role)}`}>
                        {getRoleText(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700">{user.position || 'Не указана'}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="text-sm text-gray-900">{user._count.createdProjects}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="text-sm text-gray-900">{user._count.createdTasks}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700">
                        {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleEdit(user)}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
                <h2 className="text-xl font-bold text-gray-900">
                  {editingUser ? 'Редактировать пользователя' : 'Добавить пользователя'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Имя *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Роль *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USER">Пользователь</option>
                    <option value="MANAGER">Менеджер</option>
                    <option value="ADMIN">Администратор</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Должность</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Выберите должность</option>
                    <option value="Директор">Директор</option>
                    <option value="Менеджер проекта">Менеджер проекта</option>
                    <option value="Технический специалист">Технический специалист</option>
                    <option value="Руководитель проекта">Руководитель проекта</option>
                  </select>
                </div>

                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Пароль *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={!editingUser}
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    {editingUser ? 'Сохранить' : 'Создать'}
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