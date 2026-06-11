'use client'

import Link from 'next/link'
import { AlertTriangle, Download } from 'lucide-react'
import { getCategoryLabel } from '@/lib/document-category-labels'

const NEW_DOC_TYPE: Record<string, string> = {
  UPD: 'UPD',
  INVOICE: 'INVOICE',
  CONTRACT: 'CONTRACT',
  COMMERCIAL: 'COMMERCIAL_OFFER',
}

interface LegacyDocumentNoticeProps {
  documentId: string
  projectId?: string | null
  fileName: string
  category?: string | null
}

export function LegacyDocumentNotice({
  documentId,
  projectId,
  fileName,
  category,
}: LegacyDocumentNoticeProps) {
  const label = getCategoryLabel(category)
  const newType = category ? NEW_DOC_TYPE[category] : null
  const createHref =
    projectId && newType
      ? `/documents/new?type=${newType}&projectId=${projectId}`
      : projectId
        ? `/documents/new?projectId=${projectId}`
        : '/documents/new'

  return (
    <div className="max-w-2xl mx-auto mt-12">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Документ создан до появления редактора
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Этот {label.toLowerCase()} был сгенерирован как готовый файл без сохранения структуры
          данных. Его можно скачать, но редактирование и повторное формирование в системе
          недоступны. Создайте новый документ — данные подтянутся из сметы автоматически.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={`/api/documents/${documentId}/download`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
          >
            <Download className="h-4 w-4" />
            Скачать {fileName}
          </a>
          <Link
            href={createHref}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Создать новый {label.toLowerCase()}
          </Link>
        </div>
      </div>
    </div>
  )
}
