'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, FileText, Edit, Download, Trash2, Search } from 'lucide-react'
import Layout from '@/components/layout'

interface Template {
  id: string
  name: string
  description: string | null
  content: string
  variables: Record<string, string>
  type: string
  createdAt: string
  updatedAt: string
  creator: {
    id: string
    name: string
    email: string
  }
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    content: '',
    type: 'DOCX',
    variables: {} as Record<string, string>
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (err) {
      console.error('Error fetching templates:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm)
      })

      if (response.ok) {
        const newTemplate = await response.json()
        setTemplates([newTemplate, ...templates])
        setShowCreateModal(false)
        setCreateForm({
          name: '',
          description: '',
          content: '',
          type: 'DOCX',
          variables: {}
        })
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleEditTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTemplate) return

    try {
      const response = await fetch(`/api/templates/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm)
      })

      if (response.ok) {
        const updatedTemplate = await response.json()
        setTemplates(templates.map(t => t.id === selectedTemplate.id ? updatedTemplate : t))
        setShowEditModal(false)
        setSelectedTemplate(null)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот шаблон?')) return

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setTemplates(templates.filter(t => t.id !== templateId))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDownloadTemplate = (template: Template) => {
    // Создаем файл с содержимым шаблона
    const blob = new Blob([template.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.name}.${template.type.toLowerCase()}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU')
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Загрузка шаблонов...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Шаблоны документов</h1>
            <p className="text-sm text-gray-600 mt-1">{templates.length} шаблонов</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Создать шаблон
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Поиск шаблонов..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет шаблонов</h3>
              <p className="text-gray-500">Создайте первый шаблон документа</p>
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template)
                          setCreateForm({
                            name: template.name,
                            description: template.description || '',
                            content: template.content,
                            type: template.type,
                            variables: template.variables
                          })
                          setShowEditModal(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{template.description || 'Нет описания'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Тип:</span>
                      <span className="font-medium">{template.type}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Создатель:</span>
                      <span className="font-medium">{template.creator.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Создан:</span>
                      <span className="font-medium">{formatDate(template.createdAt)}</span>
                    </div>
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadTemplate(template)}
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Скачать
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Create Template Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Создать шаблон</CardTitle>
                <CardDescription>
                  Создайте новый шаблон документа
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTemplate} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Название</Label>
                    <Input
                      id="name"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      placeholder="Название шаблона"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Описание</Label>
                    <Input
                      id="description"
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      placeholder="Описание шаблона"
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Тип файла</Label>
                    <select
                      id="type"
                      value={createForm.type}
                      onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="DOCX">DOCX</option>
                      <option value="PDF">PDF</option>
                      <option value="XLSX">XLSX</option>
                      <option value="TXT">TXT</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="content">Содержимое шаблона</Label>
                    <textarea
                      id="content"
                      value={createForm.content}
                      onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                      placeholder="Введите содержимое шаблона..."
                      className="w-full p-2 border border-gray-300 rounded-md h-32"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Отмена
                    </Button>
                    <Button type="submit">
                      Создать шаблон
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Template Modal */}
        {showEditModal && selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Редактировать шаблон</CardTitle>
                <CardDescription>
                  Измените параметры шаблона
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEditTemplate} className="space-y-4">
                  <div>
                    <Label htmlFor="edit-name">Название</Label>
                    <Input
                      id="edit-name"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      placeholder="Название шаблона"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-description">Описание</Label>
                    <Input
                      id="edit-description"
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      placeholder="Описание шаблона"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-type">Тип файла</Label>
                    <select
                      id="edit-type"
                      value={createForm.type}
                      onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="DOCX">DOCX</option>
                      <option value="PDF">PDF</option>
                      <option value="XLSX">XLSX</option>
                      <option value="TXT">TXT</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="edit-content">Содержимое шаблона</Label>
                    <textarea
                      id="edit-content"
                      value={createForm.content}
                      onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                      placeholder="Введите содержимое шаблона..."
                      className="w-full p-2 border border-gray-300 rounded-md h-32"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowEditModal(false)}
                    >
                      Отмена
                    </Button>
                    <Button type="submit">
                      Сохранить изменения
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  )
}