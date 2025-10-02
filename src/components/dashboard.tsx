'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Layout from '@/components/layout'
import { PermissionGuard } from '@/components/permission-guard'
import { 
  FolderOpen, 
  FileText, 
  DollarSign, 
  Flag,
  CheckCircle,
  TrendingUp,
  ArrowUpRight,
  Activity,
  Calendar,
  MessageSquare
} from 'lucide-react'

interface ActivityItem {
  id: string
  type: string
  action: string
  title: string
  subtitle?: string
  userName: string
  createdAt: Date
  icon: string
  color: string
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalTasks: 0,
    totalDocuments: 0
  })
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activityLoading, setActivityLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    fetchActivity()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [projectsRes, tasksRes, documentsRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/tasks'),
        fetch('/api/documents')
      ])

      const projects = await projectsRes.json()
      const tasks = await tasksRes.json()
      const documents = await documentsRes.json()

      setStats({
        totalProjects: projects.projects?.length || 0,
        activeProjects: projects.projects?.filter((p: any) => p.status === 'ACTIVE').length || 0,
        totalTasks: tasks.tasks?.length || 0,
        totalDocuments: documents.documents?.length || 0
      })
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchActivity = async () => {
    try {
      const response = await fetch('/api/activity?limit=10')
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (err) {
      console.error('Error fetching activity:', err)
    } finally {
      setActivityLoading(false)
    }
  }

  const getActivityIcon = (iconName: string) => {
    switch (iconName) {
      case 'FolderOpen':
        return FolderOpen
      case 'CheckCircle':
        return CheckCircle
      case 'FileText':
        return FileText
      case 'MessageSquare':
        return MessageSquare
      case 'DollarSign':
        return DollarSign
      default:
        return Activity
    }
  }

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-600'
      case 'green':
        return 'bg-green-100 text-green-600'
      case 'purple':
        return 'bg-purple-100 text-purple-600'
      case 'orange':
        return 'bg-orange-100 text-orange-600'
      case 'yellow':
        return 'bg-yellow-100 text-yellow-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Только что'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} мин. назад`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ч. назад`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} дн. назад`
    
    return new Date(date).toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const statCards = [
    { 
      name: 'Всего проектов',
      value: stats.totalProjects,
      icon: FolderOpen,
      color: 'bg-blue-500',
      href: '/projects'
    },
    { 
      name: 'Активные проекты',
      value: stats.activeProjects,
      icon: Activity,
      color: 'bg-green-500',
      href: '/projects'
    },
    { 
      name: 'Всего задач',
      value: stats.totalTasks,
      icon: CheckCircle,
      color: 'bg-purple-500',
      href: '/tasks'
    },
    { 
      name: 'Документы',
      value: stats.totalDocuments,
      icon: FileText,
      color: 'bg-orange-500',
      href: '/documents'
    }
  ]

  const quickActions = [
    {
      title: 'Создать проект',
      description: 'Добавить новый проект в систему',
      icon: FolderOpen,
      href: '/projects/create',
      color: 'bg-blue-50 text-blue-600',
      permission: 'canCreateProjects'
    },
    {
      title: 'Добавить задачу',
      description: 'Создать новую задачу',
      icon: Flag,
      href: '/tasks/create',
      color: 'bg-green-50 text-green-600',
      permission: 'canCreateTasks'
    },
    {
      title: 'Загрузить документ',
      description: 'Добавить новый документ',
      icon: FileText,
      href: '/documents',
      color: 'bg-purple-50 text-purple-600',
      permission: 'canCreateDocuments'
    },
    {
      title: 'Финансовый отчет',
      description: 'Просмотреть финансовую отчетность',
      icon: DollarSign,
      href: '/reports',
      color: 'bg-orange-50 text-orange-600',
      permission: 'canViewReports'
    }
  ]

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Загрузка данных...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Панель управления</h1>
          <p className="text-sm text-gray-600 mt-1">Обзор ваших проектов и задач</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <Link key={stat.name} href={stat.href}>
              <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  Перейти к разделу
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Быстрые действия</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <PermissionGuard key={action.title} permission={action.permission as any}>
                <Link href={action.href}>
                  <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <action.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{action.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </PermissionGuard>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Последняя активность</h2>
          </div>
          <div className="p-6">
            {activityLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Загрузка активности...</p>
                </div>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Пока нет активности</p>
                <p className="text-xs text-gray-400 mt-1">Начните создавать проекты и задачи</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => {
                  const Icon = getActivityIcon(activity.icon)
                  const colorClasses = getColorClasses(activity.color)
                  
                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${colorClasses} flex-shrink-0`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{activity.userName}</span>
                          {' '}{activity.action}{' '}
                          <span className="font-medium">"{activity.title}"</span>
                        </p>
                        {activity.subtitle && (
                          <p className="text-xs text-gray-500 mt-0.5">{activity.subtitle}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimeAgo(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}