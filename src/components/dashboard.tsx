'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Layout from '@/components/layout'
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
        fetch('/api/projects', { headers: { 'Authorization': 'Bearer demo-token' } }),
        fetch('/api/tasks', { headers: { 'Authorization': 'Bearer demo-token' } }),
        fetch('/api/documents', { headers: { 'Authorization': 'Bearer demo-token' } })
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
    { name: 'Всего проектов', value: stats.totalProjects, icon: FolderOpen, link: '/projects', color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Активных', value: stats.activeProjects, icon: Activity, link: '/projects', color: 'text-green-600', bg: 'bg-green-50' },
    { name: 'Задач', value: stats.totalTasks, icon: Flag, link: '/tasks', color: 'text-orange-600', bg: 'bg-orange-50' },
    { name: 'Документов', value: stats.totalDocuments, icon: FileText, link: '/documents', color: 'text-purple-600', bg: 'bg-purple-50' }
  ]

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Загрузка данных...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl p-6 border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Добро пожаловать! 👋</h1>
              <p className="text-gray-600">Вот что происходит в ваших проектах сегодня</p>
            </div>
            <div className="hidden md:flex items-center gap-3 text-sm text-gray-600">
              <Calendar className="h-5 w-5" />
              <span className="font-medium">{new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Link
                key={stat.name}
                href={stat.link}
                className="bg-white rounded-xl p-5 border hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 ${stat.bg} rounded-lg`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.name}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t flex items-center text-blue-600 text-sm">
                  <span>Подробнее</span>
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </div>
              </Link>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 border shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Быстрые действия</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              href="/projects"
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all group"
            >
              <div className="p-3 bg-blue-50 rounded-lg mb-2 group-hover:bg-blue-100">
                <FolderOpen className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Новый проект</span>
            </Link>

            <Link
              href="/tasks"
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-orange-50 hover:border-orange-200 transition-all group"
            >
              <div className="p-3 bg-orange-50 rounded-lg mb-2 group-hover:bg-orange-100">
                <Flag className="h-5 w-5 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Новая задача</span>
            </Link>

            <Link
              href="/documents"
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-purple-50 hover:border-purple-200 transition-all group"
            >
              <div className="p-3 bg-purple-50 rounded-lg mb-2 group-hover:bg-purple-100">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Документ</span>
            </Link>

            <Link
              href="/finance"
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-green-50 hover:border-green-200 transition-all group"
            >
              <div className="p-3 bg-green-50 rounded-lg mb-2 group-hover:bg-green-100">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Запись</span>
            </Link>
          </div>
        </div>

        {/* Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Недавняя активность</h2>
              <Activity className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Обновление проекта</p>
                    <p className="text-xs text-gray-500">2 часа назад</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Предстоящие события</h2>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Calendar className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Встреча с командой</p>
                    <p className="text-xs text-gray-500">Завтра в 14:00</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}