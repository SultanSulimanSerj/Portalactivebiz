'use client'

import { CheckCircle, XCircle, Clock, User } from 'lucide-react'

interface ApprovalProgressProps {
  assignments: Array<{
    id: string
    user: { name: string; email: string }
    status: string
    role: string
    comment: string | null
    respondedAt: string | null
  }>
  requireAllApprovals: boolean
  currentUserId?: string
}

export default function ApprovalProgress({ 
  assignments, 
  requireAllApprovals, 
  currentUserId 
}: ApprovalProgressProps) {
  const approvedCount = assignments.filter(a => a.status === 'APPROVED').length
  const rejectedCount = assignments.filter(a => a.status === 'REJECTED').length
  const pendingCount = assignments.filter(a => a.status === 'PENDING').length
  const totalCount = assignments.length

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'Одобрено'
      case 'REJECTED':
        return 'Отклонено'
      case 'PENDING':
        return 'Ожидает'
      default:
        return 'Неизвестно'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'text-green-600 bg-green-50'
      case 'REJECTED':
        return 'text-red-600 bg-red-50'
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'APPROVER':
        return 'Согласующий'
      case 'REVIEWER':
        return 'Рецензент'
      case 'OBSERVER':
        return 'Наблюдатель'
      default:
        return role
    }
  }

  return (
    <div className="space-y-3">
      {/* Общий прогресс */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Прогресс согласования
          </span>
          <span className="text-sm text-gray-500">
            {approvedCount + rejectedCount}/{totalCount}
          </span>
        </div>
        
        <div className="flex space-x-1">
          {assignments.map((assignment, index) => (
            <div
              key={assignment.id}
              className={`h-2 flex-1 rounded ${
                assignment.status === 'APPROVED' 
                  ? 'bg-green-500' 
                  : assignment.status === 'REJECTED'
                  ? 'bg-red-500'
                  : 'bg-gray-300'
              }`}
              title={`${assignment.user.name}: ${getStatusText(assignment.status)}`}
            />
          ))}
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Одобрено: {approvedCount}</span>
          <span>Отклонено: {rejectedCount}</span>
          <span>Ожидает: {pendingCount}</span>
        </div>
      </div>

      {/* Детальный список участников */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Участники:</h4>
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className={`flex items-center justify-between p-2 rounded-lg border ${
              assignment.user.id === currentUserId 
                ? 'border-blue-300 bg-blue-50' 
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {getStatusIcon(assignment.status)}
                <User className="h-4 w-4 text-gray-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {assignment.user.name}
                  {assignment.user.id === currentUserId && (
                    <span className="ml-1 text-xs text-blue-600">(Вы)</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {getRoleText(assignment.role)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(assignment.status)}`}>
                {getStatusText(assignment.status)}
              </span>
              {assignment.respondedAt && (
                <span className="text-xs text-gray-500">
                  {new Date(assignment.respondedAt).toLocaleDateString('ru-RU')}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Логика отображения кнопок */}
      {requireAllApprovals ? (
        <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
          <strong>Требуется согласие всех участников</strong>
          {approvedCount === totalCount && (
            <p className="text-green-600 mt-1">✓ Все участники согласовали</p>
          )}
          {rejectedCount > 0 && (
            <p className="text-red-600 mt-1">✗ Согласование отклонено</p>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-600 bg-green-50 p-2 rounded">
          <strong>Достаточно одного согласия</strong>
          {approvedCount > 0 && (
            <p className="text-green-600 mt-1">✓ Согласование одобрено</p>
          )}
          {rejectedCount > 0 && (
            <p className="text-red-600 mt-1">✗ Согласование отклонено</p>
          )}
        </div>
      )}
    </div>
  )
}
