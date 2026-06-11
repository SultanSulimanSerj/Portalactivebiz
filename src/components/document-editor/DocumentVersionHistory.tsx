'use client'

import { X, RotateCcw, Download } from 'lucide-react'

interface VersionItem {
  id?: string
  version: number
  fileName: string
  fileSize: number
  pdfFileName?: string | null
  pdfFileSize?: number | null
  createdAt: string
  comment?: string | null
  isCurrent?: boolean
}

interface DocumentVersionHistoryProps {
  open: boolean
  onClose: () => void
  current: VersionItem | null
  versions: VersionItem[]
  documentId: string
  onRestore: (versionId: string) => void
  restoring?: boolean
}

export function DocumentVersionHistory({
  open,
  onClose,
  current,
  versions,
  documentId,
  onRestore,
  restoring,
}: DocumentVersionHistoryProps) {
  if (!open) return null

  const allVersions: VersionItem[] = [
    ...(current ? [{ ...current, isCurrent: true }] : []),
    ...versions.filter((v) => !v.isCurrent),
  ].sort((a, b) => b.version - a.version)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md bg-white shadow-xl h-full overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">История версий</h2>
          <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {allVersions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Версий пока нет. Сформируйте Excel, чтобы создать первую версию.
            </p>
          ) : (
            allVersions.map((v) => (
              <div
                key={v.id || `current-${v.version}`}
                className={`border rounded-lg p-3 ${v.isCurrent ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Версия {v.version}
                      {v.isCurrent && (
                        <span className="ml-2 text-xs text-blue-600">(текущая)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{v.fileName}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(v.createdAt).toLocaleString('ru-RU')}
                      {v.comment && ` · ${v.comment}`}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!v.isCurrent && v.id && (
                      <button
                        type="button"
                        onClick={() => onRestore(v.id!)}
                        disabled={restoring}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Восстановить содержимое"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                    <a
                      href={`/api/documents/${documentId}/download${v.isCurrent ? '' : `?version=${v.version}`}`}
                      className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded"
                      title="Скачать Excel"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                    {(v.pdfFileName || v.isCurrent) && (
                      <a
                        href={`/api/documents/${documentId}/download?format=pdf${v.isCurrent ? '' : `&version=${v.version}`}`}
                        className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded text-xs"
                        title="Скачать PDF"
                      >
                        PDF
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
