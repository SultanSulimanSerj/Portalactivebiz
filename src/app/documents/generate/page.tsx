'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Layout from '@/components/layout'
import { FileText, Download, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface Estimate {
  id: string
  name: string
  total: number
  totalWithVat: number
  vatEnabled: boolean
}

export default function GenerateDocumentPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const projectId = searchParams?.get('projectId') || null
  
  const [selectedDocType, setSelectedDocType] = useState('contract')
  const [selectedEstimate, setSelectedEstimate] = useState('')
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [loading, setLoading] = useState(false)
  const [projectName, setProjectName] = useState('')

  useEffect(() => {
    if (projectId) {
      fetchProject()
      fetchEstimates()
    }
  }, [projectId])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setProjectName(data.name)
      }
    } catch (error) {
      console.error('Error fetching project:', error)
    }
  }

  const fetchEstimates = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/estimates`)
      if (response.ok) {
        const data = await response.json()
        setEstimates(data)
        if (data.length > 0) {
          setSelectedEstimate(data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching estimates:', error)
    }
  }

  const handleGenerate = async () => {
    if (!projectId || !selectedDocType) {
      alert('Выберите тип документа')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          documentType: selectedDocType,
          estimateId: selectedEstimate || undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка при генерации документа')
      }

      // Получаем ID документа из заголовка
      const documentId = response.headers.get('X-Document-Id')

      // Получаем blob и скачиваем файл
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Договор_подряда_${Date.now()}.docx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert('✅ Документ успешно сгенерирован и сохранен в проекте!\n\nВы можете найти его во вкладке "Документы" проекта.')
    } catch (error) {
      console.error('Error generating document:', error)
      alert(error instanceof Error ? error.message : 'Ошибка при генерации документа')
    } finally {
      setLoading(false)
    }
  }

  const documentTypes = [
    { id: 'contract', name: 'Договор подряда', icon: FileText, color: 'blue', description: 'Договор на выполнение строительно-монтажных работ с полным текстом' },
    { id: 'commercial', name: 'Коммерческое предложение', icon: FileText, color: 'green', description: 'Презентация услуг с ценами', disabled: true },
    { id: 'avr', name: 'Акт выполненных работ (АВР)', icon: FileText, color: 'purple', description: 'Подтверждение выполненных работ', disabled: true },
    { id: 'upd', name: 'УПД', icon: FileText, color: 'orange', description: 'Универсальный передаточный документ', disabled: true },
    { id: 'ks2', name: 'КС-2', icon: FileText, color: 'red', description: 'Справка о стоимости выполненных работ', disabled: true },
    { id: 'ks3', name: 'КС-3', icon: FileText, color: 'pink', description: 'Справка о стоимости материалов', disabled: true }
  ]

  if (!projectId) {
    return (
      <Layout>
        <div className="p-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Ошибка</h1>
            <p className="text-gray-600 mb-6">Проект не выбран</p>
            <Link href="/projects" className="text-blue-600 hover:underline">
              ← Вернуться к проектам
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Генерация документов</h1>
              <p className="text-sm text-gray-600">Проект: {projectName}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Левая панель - выбор типа документа */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Выберите тип документа</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documentTypes.map((docType) => (
                    <button
                      key={docType.id}
                      onClick={() => !docType.disabled && setSelectedDocType(docType.id)}
                      disabled={docType.disabled}
                      className={`
                        relative p-4 rounded-lg border-2 transition-all text-left
                        ${selectedDocType === docType.id 
                          ? `border-${docType.color}-600 bg-${docType.color}-50` 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                        ${docType.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 bg-${docType.color}-100 rounded-lg`}>
                          <docType.icon className={`h-5 w-5 text-${docType.color}-600`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                            {docType.name}
                            {selectedDocType === docType.id && (
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                            )}
                          </h3>
                          <p className="text-xs text-gray-600">{docType.description}</p>
                          {docType.disabled && (
                            <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                              Скоро доступно
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Выбор сметы */}
              {estimates.length > 0 && (
                <div className="bg-white rounded-lg border p-6 mt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Выберите смету (опционально)</h2>
                  <select
                    value={selectedEstimate}
                    onChange={(e) => setSelectedEstimate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Без привязки к смете</option>
                    {estimates.map((estimate) => (
                      <option key={estimate.id} value={estimate.id}>
                        {estimate.name} - {Number(estimate.totalWithVat || estimate.total).toLocaleString('ru-RU')} ₽
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Правая панель - информация и действия */}
            <div className="lg:col-span-1">
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 sticky top-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Информация</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <p className="text-sm text-gray-700">Автоматическое заполнение реквизитов</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <p className="text-sm text-gray-700">Данные из проекта и сметы</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <p className="text-sm text-gray-700">Формат Word (DOCX) - готово к редактированию</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <p className="text-sm text-gray-700">Готово к печати и подписанию</p>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={loading || !selectedDocType}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Генерация...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5" />
                      <span>Сгенерировать документ</span>
                    </>
                  )}
                </button>

                <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">📝 Что будет включено?</h3>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Реквизиты компании и клиента</li>
                    <li>• Предмет договора</li>
                    <li>• Стоимость работ</li>
                    <li>• Условия оплаты</li>
                    <li>• Сроки выполнения</li>
                    <li>• Подписи сторон</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

