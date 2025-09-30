'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout'
import { Bell, Check, X, Trash2, Eye, EyeOff, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Notification {
  id: string
  title: string
  message: string
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'
  isRead: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])

  useEffect(() => {
    fetchNotifications()
  }, [showAll, typeFilter])

  const fetchNotifications = async () => {
    try {
      const params = new URLSearchParams({
        unreadOnly: (!showAll).toString(),
        limit: '50'
      })
      
      const response = await fetch(`/api/notifications?${params}`)
      if (response.ok) {
        const data = await response.json()
        let filteredNotifications = data.notifications || []
        
        if (typeFilter !== 'all') {
          filteredNotifications = filteredNotifications.filter(
            (n: Notification) => n.type === typeFilter
          )
        }
        
        setNotifications(filteredNotifications)
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id)
      if (unreadIds.length === 0) return

      const response = await fetch('/api/notifications/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAsRead', notificationIds: unreadIds })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const deleteSelected = async () => {
    if (selectedNotifications.length === 0) return

    try {
      const response = await fetch('/api/notifications/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', notificationIds: selectedNotifications })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.filter(n => !selectedNotifications.includes(n.id))
        )
        setSelectedNotifications([])
      }
    } catch (error) {
      console.error('Error deleting selected notifications:', error)
    }
  }

  const toggleSelection = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    )
  }

  const getTypeColor = (type: string) => {
    const colors = {
      'INFO': 'bg-blue-50 border-blue-200 text-blue-800',
      'WARNING': 'bg-yellow-50 border-yellow-200 text-yellow-800',
      'ERROR': 'bg-red-50 border-red-200 text-red-800',
      'SUCCESS': 'bg-green-50 border-green-200 text-green-800'
    }
    return colors[type as keyof typeof colors] || colors.INFO
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      'INFO': 'ℹ️',
      'WARNING': '⚠️',
      'ERROR': '❌',
      'SUCCESS': '✅'
    }
    return icons[type as keyof typeof icons] || icons.INFO
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Загрузка уведомлений...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Уведомления</h1>
            <p className="text-sm text-gray-600 mt-1">
              {notifications.length} уведомлений, {unreadCount} непрочитанных
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showAll ? 'Только непрочитанные' : 'Все уведомления'}
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={markAllAsRead}
              >
                <Check className="h-4 w-4 mr-2" />
                Отметить все как прочитанные
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Фильтр по типу:</span>
            </div>
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                typeFilter === 'all' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setTypeFilter('INFO')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                typeFilter === 'INFO' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Информация
            </button>
            <button
              onClick={() => setTypeFilter('WARNING')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                typeFilter === 'WARNING' ? 'bg-yellow-50 text-yellow-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Предупреждения
            </button>
            <button
              onClick={() => setTypeFilter('ERROR')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                typeFilter === 'ERROR' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Ошибки
            </button>
            <button
              onClick={() => setTypeFilter('SUCCESS')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                typeFilter === 'SUCCESS' ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Успех
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedNotifications.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                Выбрано {selectedNotifications.length} уведомлений
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedNotifications([])}
                >
                  Отменить выбор
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={deleteSelected}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Удалить выбранные
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {showAll ? 'Нет уведомлений' : 'Нет непрочитанных уведомлений'}
              </h3>
              <p className="text-sm text-gray-500">
                {showAll 
                  ? 'Все уведомления будут отображаться здесь'
                  : 'Новые уведомления появятся здесь'
                }
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`transition-all duration-200 ${
                  notification.isRead 
                    ? 'bg-gray-50 border-gray-200' 
                    : 'bg-white border-blue-200 shadow-sm'
                } ${selectedNotifications.includes(notification.id) ? 'ring-2 ring-blue-500' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={() => toggleSelection(notification.id)}
                        className="mt-1"
                      />
                      <span className="text-lg">
                        {getTypeIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`text-sm font-medium ${
                            notification.isRead ? 'text-gray-600' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h4>
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded border ${getTypeColor(notification.type)}`}>
                            {notification.type}
                          </span>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        <p className={`text-sm ${
                          notification.isRead ? 'text-gray-500' : 'text-gray-700'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.createdAt).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}
