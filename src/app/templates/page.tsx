'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, FileText, Edit, Download, Trash2, Search } from 'lucide-react'
import Layout from '@/components/layout'

interface Template {
  id: string
  name: string
  description: string
  type: string
  createdAt: string
  updatedAt: string
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: 'Договор подряда (стандартный)',
      description: 'Стандартный шаблон договора подряда для строительных проектов.',
      type: 'DOCX',
      createdAt: '2023-10-01',
      updatedAt: '2024-01-05',
    },
    {
      id: '2',
      name: 'Акт выполненных работ',
      description: 'Шаблон акта для подтверждения выполнения этапов работ.',
      type: 'PDF',
      createdAt: '2023-11-10',
      updatedAt: '2023-12-20',
    },
    {
      id: '3',
      name: 'Финансовый отчет (ежемесячный)',
      description: 'Шаблон для ежемесячного финансового отчета по проекту.',
      type: 'XLSX',
      createdAt: '2023-09-15',
      updatedAt: '2024-01-10',
    },
  ])
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU')
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Шаблоны документов</h1>
                <p className="text-gray-600">Управление шаблонами для генерации документов</p>
              </div>
              <Button className="gradient-primary hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Новый шаблон
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search */}
          <Card className="mb-6 animate-fade-in">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск шаблонов..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </CardContent>
          </Card>

          {/* Templates List */}
          {filteredTemplates.length === 0 ? (
            <Card className="animate-fade-in">
              <CardContent className="p-12 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Шаблоны не найдены</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm ? 'Попробуйте изменить поиск' : 'Создайте свой первый шаблон документа'}
                </p>
                <Button className="gradient-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Создать шаблон
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template, index) => (
                <Card key={template.id} className="animate-fade-in hover:shadow-lg transition-all duration-200" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{template.name}</span>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        {template.type}
                      </span>
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Создан: {formatDate(template.createdAt)}</span>
                      <span>Обновлен: {formatDate(template.updatedAt)}</span>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Редактировать
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}