'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Layout from '@/components/layout'
import { ArrowLeft, FileText, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface TemplateDetail {
  id: string
  name: string
  description?: string
  category: string
  type: string
  fileType: string
  autoFillSources?: {
    company?: string[]
    project?: string[]
    custom?: string[]
  }
  variables?: Record<string, unknown>
  isPublic?: boolean
  isActive?: boolean
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

export default function TemplateDetailPage() {
  const params = useParams()
  const templateId = Array.isArray(params?.id) ? params.id[0] : params?.id
  const [template, setTemplate] = useState<TemplateDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!templateId) return
    const fetchTemplate = async () => {
      try {
        const response = await fetch(`/api/templates/${templateId}`)
        if (response.ok) {
          setTemplate(await response.json())
          setError(null)
        } else {
          const data = await response.json().catch(() => ({}))
          setError(data.error || 'Шаблон не найден')
        }
      } catch {
        setError('Ошибка загрузки шаблона')
      } finally {
        setLoading(false)
      }
    }
    fetchTemplate()
  }, [templateId])

  if (loading) {
    return (
      <Layout>
        <div className="flex h-96 items-center justify-center text-gray-500">Загрузка...</div>
      </Layout>
    )
  }

  if (error || !template) {
    return (
      <Layout>
        <div className="mx-auto max-w-2xl py-12 text-center">
          <p className="mb-4 text-lg font-medium text-gray-900">{error || 'Шаблон не найден'}</p>
          <Link href="/templates" className="text-blue-600 hover:underline">
            Вернуться к шаблонам
          </Link>
        </div>
      </Layout>
    )
  }

  const variableEntries = template.variables
    ? Object.entries(template.variables)
    : []

  return (
    <Layout>
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/templates"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к шаблонам
        </Link>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
              {template.description && (
                <p className="mt-2 text-gray-600">{template.description}</p>
              )}
            </div>
            <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
              Системный
            </span>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Категория</p>
              <p className="font-medium">{categoryLabels[template.category] || template.category}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Тип</p>
              <p className="font-medium">{template.type}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Формат</p>
              <p className="font-medium">{template.fileType}</p>
            </div>
          </div>

          {template.autoFillSources && (
            <div className="mb-6">
              <h2 className="mb-2 font-semibold text-gray-900">Автозаполнение</h2>
              <div className="space-y-1 text-sm text-gray-600">
                {template.autoFillSources.company && (
                  <p>Компания: {template.autoFillSources.company.length} полей</p>
                )}
                {template.autoFillSources.project && (
                  <p>Проект: {template.autoFillSources.project.length} полей</p>
                )}
                {template.autoFillSources.custom && (
                  <p>Ручной ввод: {template.autoFillSources.custom.length} полей</p>
                )}
              </div>
            </div>
          )}

          {variableEntries.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-2 font-semibold text-gray-900">Переменные ({variableEntries.length})</h2>
              <div className="max-h-64 overflow-y-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Поле</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Описание</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variableEntries.map(([key, val]) => (
                      <tr key={key} className="border-t">
                        <td className="px-3 py-2 font-mono text-xs">{key}</td>
                        <td className="px-3 py-2 text-gray-600">
                          {(val as { description?: string })?.description || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <Link
            href={`/documents/generate?templateId=${template.id}&documentType=${template.type}`}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <ExternalLink className="h-4 w-4" />
            Создать документ из шаблона
          </Link>
        </div>
      </div>
    </Layout>
  )
}
