'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout'
import { FileText, Search, Filter, Eye, FileType, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface SystemTemplate {
  id: string
  name: string
  description?: string
  category: string
  type: string
  fileType: string
  autoFillSources: {
    company?: string[]
    project?: string[]
    custom?: string[]
  }
  isActive: boolean
  isPublic: boolean
  companyId: null
  creatorId: null
  createdAt: string
  updatedAt: string
  _count: {
    documents: number
  }
}

const categoryLabels: Record<string, string> = {
  COMMERCIAL: 'Коммерческие',
  FINANCIAL: 'Финансовые',
  REPORT: 'Отчетные',
  HR: 'Кадровые',
  TECHNICAL: 'Технические',
  LEGAL: 'Юридические',
  OTHER: 'Прочие',
}

const fileTypeLabels: Record<string, string> = {
  HTML: 'HTML',
  DOCX: 'Word',
  XLSX: 'Excel',
  PDF: 'PDF',
  MARKDOWN: 'Markdown',
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<SystemTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  useEffect(() => {
    fetchTemplates()
  }, [filterCategory])

  const fetchTemplates = async () => {
    try {
      const params = new URLSearchParams()
      if (filterCategory !== 'all') params.append('category', filterCategory)

      const response = await fetch(`/api/templates?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching system templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Layout>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Системные шаблоны</h1>
            <p className="text-sm text-gray-600 mt-1">
              Готовые шаблоны документов с автоматическим заполнением данных
            </p>
          </div>
          <Link
            href="/documents/generate"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FileText className="h-4 w-4" />
            Создать документ
          </Link>
        </div>

        {/* Информационное сообщение */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Системные шаблоны</h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>
                  Все шаблоны встроены в систему и автоматически заполняются данными из вашей компании и проектов. 
                  Дополнительно можно указать только необходимые переменные.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Фильтры и поиск */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по названию или описанию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Все категории</option>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всего шаблонов</p>
                <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Системных</p>
                <p className="text-2xl font-bold text-green-600">{templates.length}</p>
              </div>
              <FileType className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Категорий</p>
                <p className="text-2xl font-bold text-purple-600">
                  {new Set(templates.map((t) => t.category)).size}
                </p>
              </div>
              <Filter className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Документов создано</p>
                <p className="text-2xl font-bold text-orange-600">
                  {templates.reduce((sum, t) => sum + t._count.documents, 0)}
                </p>
              </div>
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Таблица шаблонов */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Загрузка системных шаблонов...</div>
        ) : filteredTemplates.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">
              {searchQuery ? 'Шаблоны не найдены' : 'Нет доступных системных шаблонов'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Название
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Категория
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Формат
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Автозаполнение
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Использован
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Статус
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTemplates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{template.name}</div>
                        {template.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {template.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {categoryLabels[template.category] || template.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                        {fileTypeLabels[template.fileType] || template.fileType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-600">
                        {template.autoFillSources?.company && (
                          <div>Компания: {template.autoFillSources.company.length} полей</div>
                        )}
                        {template.autoFillSources?.project && (
                          <div>Проект: {template.autoFillSources.project.length} полей</div>
                        )}
                        {template.autoFillSources?.custom && (
                          <div>Ручной ввод: {template.autoFillSources.custom.length} полей</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">
                        {template._count.documents} раз
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                        Системный
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/templates/${template.id}`}
                          className="p-1 text-gray-600 hover:text-blue-600"
                          title="Просмотр"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/documents/generate?templateId=${template.id}`}
                          className="p-1 text-gray-600 hover:text-green-600"
                          title="Создать документ"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
