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
  Calendar
} from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalTasks: 0,
    totalDocuments: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
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
              <PermissionGuard key={action.title} permission={action.permission}>
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
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Система запущена и работает</p>
                  <p className="text-xs text-gray-500">Только что</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">База данных подключена</p>
                  <p className="text-xs text-gray-500">Несколько секунд назад</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Все API endpoints активны</p>
                  <p className="text-xs text-gray-500">Несколько секунд назад</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}