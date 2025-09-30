'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Check, AlertCircle, Info, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  createdAt: string
  projectId?: string
  projectName?: string
  actionType?: string
  actionId?: string
}

export default function Notifications() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      })
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST'
      })
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true }))
        )
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    // Отмечаем как прочитанное
    await markAsRead(notification.id)
    
    // Закрываем dropdown
    setIsOpen(false)
    
    // Навигация в зависимости от типа действия
    if (notification.actionType && notification.actionId) {
      switch (notification.actionType) {
        case 'approval':
          window.location.href = `/approvals`
          break
        case 'task':
          window.location.href = `/tasks`
          break
        case 'project':
          window.location.href = `/projects/${notification.actionId}`
          break
        case 'document':
          window.location.href = `/documents`
          break
        case 'finance':
          window.location.href = `/projects/${notification.projectId}`
          break
        default:
          // Если нет специфического типа, переходим на главную
          window.location.href = `/`
      }
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Только что'
    if (diffInMinutes < 60) return `${diffInMinutes} мин назад`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ч назад`
    return date.toLocaleDateString('ru-RU')
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Уведомления</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      Отметить все как прочитанные
                    </Button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  Загрузка...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Нет уведомлений
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer ${
                        !notification.isRead ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          {notification.projectName && (
                            <p className="text-xs text-blue-600 mt-1">
                              Проект: {notification.projectName}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-sm"
                  onClick={() => {
                    setIsOpen(false)
                    // Здесь можно добавить переход на страницу всех уведомлений
                  }}
                >
                  Показать все уведомления
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}