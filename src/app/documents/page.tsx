'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Layout from '@/components/layout'
import { Plus, Search, Download, Trash2, Eye, X, Upload, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Document {
  id: string
  title: string
  description: string | null
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  version: number
  createdAt: string
  Project: { id: string; name: string } | null
  User: { id: string; name: string; email: string }
}

export default function DocumentsPage() {
  const searchParams = useSearchParams()
  const projectIdFromUrl = searchParams?.get('projectId')
  
  const [documents, setDocuments] = useState<Document[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [currentProject, setCurrentProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: projectIdFromUrl || ''
  })

  useEffect(() => {
    fetchDocuments()
    fetchProjects()
    if (projectIdFromUrl) {
      fetchCurrentProject()
    }
  }, [projectIdFromUrl])

  const fetchCurrentProject = async () => {
    if (!projectIdFromUrl) return
    try {
      const response = await fetch(`/api/projects/${projectIdFromUrl}`, {
      })
      if (response.ok) {
        const data = await response.json()
        setCurrentProject(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents', {
      })
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects', {
      })
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadFile) return

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('file', uploadFile)
      formDataToSend.append('title', formData.title)
      formDataToSend.append('description', formData.description)
      if (formData.projectId) {
        formDataToSend.append('projectId', formData.projectId)
      }

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
        },
        body: formDataToSend
      })

      if (response.ok) {
        setShowModal(false)
        setUploadFile(null)
        setFormData({ title: '', description: '', projectId: '' })
        fetchDocuments()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`)
      if (response.ok) {
        // Если ответ - редирект, браузер автоматически перейдет по URL
        window.open(`/api/documents/${documentId}/download`, '_blank')
      } else {
        alert('Ошибка при скачивании файла')
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('Ошибка при скачивании файла')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить документ?')) return

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchDocuments()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getFileType = (mimeType: string) => {
    if (mimeType.includes('pdf')) return 'PDF'
    if (mimeType.includes('image')) return 'IMG'
    if (mimeType.includes('word')) return 'DOC'
    if (mimeType.includes('excel')) return 'XLS'
    return 'FILE'
  }

  const getFileColor = (mimeType: string) => {
    if (mimeType.includes('pdf')) return 'bg-red-50 text-red-700 border-red-200'
    if (mimeType.includes('image')) return 'bg-purple-50 text-purple-700 border-purple-200'
    if (mimeType.includes('word')) return 'bg-blue-50 text-blue-700 border-blue-200'
    if (mimeType.includes('excel')) return 'bg-green-50 text-green-700 border-green-200'
    return 'bg-gray-50 text-gray-700 border-gray-200'
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProject = !projectIdFromUrl || doc.Project?.name === currentProject?.name
    return matchesSearch && matchesProject
  })

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Загрузка...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        {currentProject && (
          <Link 
            href={`/projects/${currentProject.id}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Вернуться к проекту "{currentProject.name}"
          </Link>
        )}
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentProject ? `Документы проекта "${currentProject.name}"` : 'Документы'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">{filteredDocuments.length} документов</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Загрузить
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск документов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тип</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Документ</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Файл</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Размер</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Проект</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded border ${getFileColor(doc.mimeType)}`}>
                        {getFileType(doc.mimeType)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{doc.title}</div>
                        {doc.description && (
                          <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{doc.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700">{doc.fileName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700">{formatFileSize(doc.fileSize)}</div>
                    </td>
                    <td className="px-4 py-3">
                      {doc.Project ? (
                        <Link 
                          href={`/projects/${doc.Project.id}`}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          {doc.Project.name}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700">
                        {new Date(doc.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleDownload(doc.id, doc.fileName)}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" 
                          title="Скачать"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" 
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Загрузить документ</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Файл *</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-purple-400 transition-colors">
                    <input
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="w-full text-sm"
                      required
                    />
                    {uploadFile && (
                      <p className="text-xs text-gray-600 mt-2">
                        Выбран: {uploadFile.name} ({formatFileSize(uploadFile.size)})
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Название *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Проект</label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({...formData, projectId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Без проекта</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center justify-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Загрузить
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setUploadFile(null)
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}