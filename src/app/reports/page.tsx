'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  FileText,
  Target,
  Filter,
  Loader2
} from 'lucide-react'
import Layout from '@/components/layout'

interface ReportStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  totalDocuments: number
  totalUsers: number
  activeUsers: number
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  margin: number
  recentProjects: number
  recentTasks: number
  recentDocuments: number
}

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedType, setSelectedType] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  // Загрузка данных отчетов
  const fetchReportData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth-token')
      const params = new URLSearchParams({
        period: selectedPeriod,
        type: selectedType,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      })

      const response = await fetch(`/api/reports?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      } else {
        console.error('Failed to fetch report data')
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Генерация отчета
  const handleGenerateReport = async (reportId: string) => {
    try {
      setGenerating(reportId)
      const token = localStorage.getItem('auth-token')
      
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reportType: reportId,
          period: selectedPeriod,
          startDate,
          endDate
        })
      })

      if (response.ok) {
        // Получаем файл как blob
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        // Определяем имя файла из заголовка или используем по умолчанию
        const contentDisposition = response.headers.get('content-disposition')
        let fileName = `${reportId}_report_${Date.now()}.xlsx`
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename="(.+)"/)
          if (fileNameMatch) {
            fileName = fileNameMatch[1]
          }
        }
        
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        alert(`Отчет ${reportId} успешно сгенерирован и скачан!`)
      } else {
        alert('Ошибка при генерации отчета')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Ошибка при генерации отчета')
    } finally {
      setGenerating(null)
    }
  }

  // Скачивание отчета
  const handleDownloadReport = async (reportId: string) => {
    try {
      setDownloading(reportId)
      const token = localStorage.getItem('auth-token')
      
      const response = await fetch(`/api/reports/download/${reportId}_${Date.now()}.txt`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${reportId}_report.txt`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Ошибка при скачивании отчета')
      }
    } catch (error) {
      console.error('Error downloading report:', error)
      alert('Ошибка при скачивании отчета')
    } finally {
      setDownloading(null)
    }
  }

  // Экспорт всех отчетов
  const handleExportAll = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      
      // Генерируем все типы отчетов
      const reportTypes = ['financial', 'projects', 'users', 'documents']
      
      for (const type of reportTypes) {
        const response = await fetch('/api/reports/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            reportType: type,
            period: selectedPeriod,
            startDate,
            endDate
          })
        })

        if (response.ok) {
          // Скачиваем каждый файл
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          
          const contentDisposition = response.headers.get('content-disposition')
          let fileName = `${type}_report_${Date.now()}.xlsx`
          if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename="(.+)"/)
            if (fileNameMatch) {
              fileName = fileNameMatch[1]
            }
          }
          
          a.download = fileName
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }
      }
      
      alert('Все отчеты успешно экспортированы в Excel!')
    } catch (error) {
      console.error('Error exporting all reports:', error)
      alert('Ошибка при экспорте отчетов')
    }
  }

  // Быстрые действия
  const handleQuickAction = async (action: string) => {
    try {
      const token = localStorage.getItem('auth-token')
      
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reportType: action,
          period: selectedPeriod,
          startDate,
          endDate
        })
      })

      if (response.ok) {
        // Скачиваем файл
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        const contentDisposition = response.headers.get('content-disposition')
        let fileName = `${action}_report_${Date.now()}.xlsx`
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename="(.+)"/)
          if (fileNameMatch) {
            fileName = fileNameMatch[1]
          }
        }
        
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        alert(`Отчет "${action}" успешно сгенерирован и скачан!`)
      } else {
        alert('Ошибка при генерации отчета')
      }
    } catch (error) {
      console.error('Error generating quick report:', error)
      alert('Ошибка при генерации отчета')
    }
  }

  // Загрузка данных при изменении фильтров
  useEffect(() => {
    fetchReportData()
  }, [selectedPeriod, selectedType, startDate, endDate])

  const reports = [
    {
      id: 'financial',
      title: 'Финансовый отчет',
      description: 'Анализ доходов и расходов по проектам',
      type: 'financial',
      icon: DollarSign,
      color: 'bg-green-100 text-green-800',
      lastGenerated: new Date().toISOString().split('T')[0]
    },
    {
      id: 'projects',
      title: 'Отчет по проектам',
      description: 'Статус и прогресс выполнения проектов',
      type: 'projects',
      icon: Target,
      color: 'bg-blue-100 text-blue-800',
      lastGenerated: new Date().toISOString().split('T')[0]
    },
    {
      id: 'users',
      title: 'Отчет по пользователям',
      description: 'Активность и производительность команды',
      type: 'users',
      icon: Users,
      color: 'bg-purple-100 text-purple-800',
      lastGenerated: new Date().toISOString().split('T')[0]
    },
    {
      id: 'documents',
      title: 'Отчет по документам',
      description: 'Статистика документооборота',
      type: 'documents',
      icon: FileText,
      color: 'bg-orange-100 text-orange-800',
      lastGenerated: new Date().toISOString().split('T')[0]
    }
  ]

  // Динамические статистические данные
  const getStatsData = () => {
    if (!stats) return []
    
    return [
      {
        title: 'Общая прибыль',
        value: `₽${stats.netProfit.toLocaleString()}`,
        change: stats.margin > 0 ? `+${stats.margin.toFixed(1)}%` : `${stats.margin.toFixed(1)}%`,
        trend: stats.netProfit > 0 ? 'up' : 'down',
        icon: stats.netProfit > 0 ? TrendingUp : TrendingDown
      },
      {
        title: 'Активные проекты',
        value: stats.activeProjects.toString(),
        change: `+${stats.recentProjects}`,
        trend: 'up',
        icon: Target
      },
      {
        title: 'Завершенные задачи',
        value: stats.completedTasks.toString(),
        change: `+${stats.recentTasks}`,
        trend: 'up',
        icon: FileText
      },
      {
        title: 'Средняя маржа',
        value: `${stats.margin.toFixed(1)}%`,
        change: stats.margin > 0 ? `+${stats.margin.toFixed(1)}%` : `${stats.margin.toFixed(1)}%`,
        trend: stats.margin > 0 ? 'up' : 'down',
        icon: TrendingDown
      }
    ]
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Отчеты</h1>
                <p className="text-gray-600">Аналитика и отчетность по проектам</p>
              </div>
              <div className="flex space-x-3">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="week">За неделю</option>
                  <option value="month">За месяц</option>
                  <option value="quarter">За квартал</option>
                  <option value="year">За год</option>
                </select>
                <Button 
                  className="gradient-primary hover:opacity-90"
                  onClick={handleExportAll}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Экспорт всех
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {loading ? (
              <div className="col-span-4 flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Загрузка данных...</span>
              </div>
            ) : (
              getStatsData().map((stat, index) => (
              <Card key={index} className="animate-fade-in hover:shadow-lg transition-all duration-200" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className={`text-sm flex items-center mt-1 ${
                        stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <stat.icon className="h-4 w-4 mr-1" />
                        {stat.change}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50">
                      <stat.icon className="h-6 w-6 text-gray-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))
            )}
          </div>

          {/* Filters */}
          <Card className="mb-6 animate-fade-in">
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Фильтры:</span>
                </div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">Все отчеты</option>
                  <option value="financial">Финансовые</option>
                  <option value="projects">Проекты</option>
                  <option value="users">Пользователи</option>
                  <option value="documents">Документы</option>
                </select>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <input
                    type="date"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="date"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports
              .filter(report => selectedType === 'all' || report.type === selectedType)
              .map((report, index) => (
                <Card key={report.id} className="animate-fade-in hover:shadow-lg transition-all duration-200" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg ${report.color} mr-3`}>
                          <report.icon className="h-5 w-5" />
                        </div>
                        <span>{report.title}</span>
                      </div>
                    </CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Последний отчет:</span> {report.lastGenerated}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        className="flex-1 gradient-primary hover:opacity-90"
                        onClick={() => handleGenerateReport(report.id)}
                        disabled={generating === report.id}
                      >
                        {generating === report.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <BarChart3 className="h-4 w-4 mr-2" />
                        )}
                        {generating === report.id ? 'Генерация...' : 'Сгенерировать'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDownloadReport(report.id)}
                        disabled={downloading === report.id}
                      >
                        {downloading === report.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {/* Quick Actions */}
          <Card className="mt-8 animate-fade-in">
            <CardHeader>
              <CardTitle>Быстрые действия</CardTitle>
              <CardDescription>Часто используемые отчеты и аналитика</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col space-y-2"
                  onClick={() => handleQuickAction('financial')}
                >
                  <DollarSign className="h-6 w-6" />
                  <span>Финансовая сводка</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col space-y-2"
                  onClick={() => handleQuickAction('projects')}
                >
                  <Target className="h-6 w-6" />
                  <span>Прогресс проектов</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col space-y-2"
                  onClick={() => handleQuickAction('users')}
                >
                  <Users className="h-6 w-6" />
                  <span>Активность команды</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}