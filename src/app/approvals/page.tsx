'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout'
import { Plus, CheckCircle, X, Clock, XCircle } from 'lucide-react'

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

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchApprovals()
  }, [])

  const fetchApprovals = async () => {
    try {
      const response = await fetch('/api/approvals', {
        headers: { 'Authorization': 'Bearer demo-token' }
      })
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}