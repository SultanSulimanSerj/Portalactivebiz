'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, CheckCircle, X, Clock, XCircle, FileText, Users, Calendar, MessageSquare } from 'lucide-react'

interface Approval {
  id: string
  title: string
  description: string | null
  status: string
  type: string
  createdAt: string
  document: { id: string; title: string } | null
  project: { id: string; name: string } | null
  creator: { name: string }
  assignments: Array<{
    user: { name: string }
    status: string
  }>
}

interface Project {
  id: string
  name: string
}

interface Document {
  id: string
  title: string
}

interface User {
  id: string
  name: string
  email: string
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null)
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    type: 'DOCUMENT',
    projectId: '',
    documentId: '',
    assigneeIds: [] as string[]
  })

  useEffect(() => {
    fetchApprovals()
    fetchProjects()
    fetchDocuments()
    fetchUsers()
  }, [])

  const fetchApprovals = async () => {
    try {
      const response = await fetch('/api/approvals')
      if (response.ok) {
        const data = await response.json()
        setApprovals(data.approvals || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents')
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreateApproval = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/approvals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm)
      })

      if (response.ok) {
        const newApproval = await response.json()
        setApprovals([newApproval, ...approvals])
        setShowCreateModal(false)
        setCreateForm({
          title: '',
          description: '',
          type: 'DOCUMENT',
          projectId: '',
          documentId: '',
          assigneeIds: []
        })
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleApprove = async (approvalId: string) => {
    try {
      const response = await fetch(`/api/approvals/${approvalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'APPROVED' })
      })

      if (response.ok) {
        fetchApprovals()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleReject = async (approvalId: string) => {
    try {
      const response = await fetch(`/api/approvals/${approvalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'REJECTED' })
      })

      if (response.ok) {
        fetchApprovals()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      'PENDING': 'Ожидает',
      'APPROVED': 'Одобрено',
      'REJECTED': 'Отклонено'
    }
    return map[status] || status
  }

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      'PENDING': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'APPROVED': 'bg-green-50 text-green-700 border-green-200',
      'REJECTED': 'bg-red-50 text-red-700 border-red-200'
    }
    return map[status] || 'bg-gray-50 text-gray-700'
  }

  const getTypeText = (type: string) => {
    const map: Record<string, string> = {
      'BUDGET': 'Бюджет',
      'DOCUMENT': 'Документ',
      'TIMELINE': 'Сроки',
      'CONTRACT': 'Договор',
      'OTHER': 'Другое'
    }
    return map[type] || type
  }

  const filteredApprovals = statusFilter === 'all' 
    ? approvals 
    : approvals.filter(a => a.status === statusFilter)

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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Согласования</h1>
            <p className="text-sm text-gray-600 mt-1">{approvals.length} согласований</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Создать согласование
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex gap-3">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                statusFilter === 'all' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                statusFilter === 'PENDING' ? 'bg-yellow-50 text-yellow-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Ожидают
            </button>
            <button
              onClick={() => setStatusFilter('APPROVED')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                statusFilter === 'APPROVED' ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Одобрено
            </button>
            <button
              onClick={() => setStatusFilter('REJECTED')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                statusFilter === 'REJECTED' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Отклонено
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Согласование</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тип</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Проект</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Создатель</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">
                      Нет согласований
                    </td>
                  </tr>
                ) : (
                  filteredApprovals.map((approval) => (
                    <tr key={approval.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{approval.title}</div>
                          {approval.description && (
                            <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{approval.description}</div>
                          )}
                          {approval.document && (
                            <div className="text-xs text-blue-600 mt-0.5">Документ: {approval.document.title}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-700">{getTypeText(approval.type)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-700">{approval.project?.name || '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded border ${getStatusColor(approval.status)}`}>
                          {getStatusText(approval.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-700">{approval.creator.name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-700">
                          {new Date(approval.createdAt).toLocaleDateString('ru-RU')}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedApproval(approval)
                              setShowDetailsModal(true)
                            }}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          {approval.status === 'PENDING' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApprove(approval.id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReject(approval.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Approval Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Создать согласование</CardTitle>
                <CardDescription>
                  Создайте новое согласование для документа или проекта
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateApproval} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Название</Label>
                    <Input
                      id="title"
                      value={createForm.title}
                      onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                      placeholder="Введите название согласования"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Описание</Label>
                    <Input
                      id="description"
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      placeholder="Описание согласования"
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Тип согласования</Label>
                    <select
                      id="type"
                      value={createForm.type}
                      onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="DOCUMENT">Документ</option>
                      <option value="BUDGET">Бюджет</option>
                      <option value="TIMELINE">Сроки</option>
                      <option value="CONTRACT">Договор</option>
                      <option value="OTHER">Другое</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="project">Проект (опционально)</Label>
                    <select
                      id="project"
                      value={createForm.projectId}
                      onChange={(e) => setCreateForm({ ...createForm, projectId: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Выберите проект</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="document">Документ (опционально)</Label>
                    <select
                      id="document"
                      value={createForm.documentId}
                      onChange={(e) => setCreateForm({ ...createForm, documentId: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Выберите документ</option>
                      {documents.map(doc => (
                        <option key={doc.id} value={doc.id}>{doc.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Участники согласования</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                      {users.map(user => (
                        <label key={user.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={createForm.assigneeIds.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCreateForm({
                                  ...createForm,
                                  assigneeIds: [...createForm.assigneeIds, user.id]
                                })
                              } else {
                                setCreateForm({
                                  ...createForm,
                                  assigneeIds: createForm.assigneeIds.filter(id => id !== user.id)
                                })
                              }
                            }}
                          />
                          <span className="text-sm">{user.name} ({user.email})</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Отмена
                    </Button>
                    <Button type="submit">
                      Создать согласование
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Approval Details Modal */}
        {showDetailsModal && selectedApproval && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>{selectedApproval.title}</CardTitle>
                <CardDescription>
                  Детали согласования
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Описание</Label>
                  <p className="text-sm text-gray-700">{selectedApproval.description || 'Нет описания'}</p>
                </div>

                <div>
                  <Label>Тип</Label>
                  <p className="text-sm text-gray-700">{getTypeText(selectedApproval.type)}</p>
                </div>

                <div>
                  <Label>Проект</Label>
                  <p className="text-sm text-gray-700">{selectedApproval.project?.name || 'Не указан'}</p>
                </div>

                <div>
                  <Label>Документ</Label>
                  <p className="text-sm text-gray-700">{selectedApproval.document?.title || 'Не указан'}</p>
                </div>

                <div>
                  <Label>Статус</Label>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded border ${getStatusColor(selectedApproval.status)}`}>
                    {getStatusText(selectedApproval.status)}
                  </span>
                </div>

                <div>
                  <Label>Участники</Label>
                  <div className="space-y-2">
                    {selectedApproval.assignments.map((assignment, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{assignment.user.name}</span>
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(assignment.status)}`}>
                          {getStatusText(assignment.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    Закрыть
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  )
}