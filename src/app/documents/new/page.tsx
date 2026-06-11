'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PageSuspense } from '@/components/page-suspense'
import Layout from '@/components/layout'
import { ErrorBanner } from '@/components/ui/error-banner'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type DocType = 'COMMERCIAL_OFFER' | 'CONTRACT' | 'INVOICE' | 'UPD'

const TYPE_LABELS: Record<DocType, string> = {
  COMMERCIAL_OFFER: 'Коммерческое предложение',
  CONTRACT: 'Договор подряда',
  INVOICE: 'Счёт на оплату',
  UPD: 'УПД',
}

interface ProjectOption {
  id: string
  name: string
}

interface Estimate {
  id: string
  name: string
  total: number
}

interface ProjectDocument {
  id: string
  title: string
  documentNumber: string | null
  documentDate: string | null
}

function NewDocumentPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const type = (searchParams?.get('type') || 'INVOICE') as DocType
  const projectIdFromUrl = searchParams?.get('projectId') || ''
  const estimateIdFromUrl = searchParams?.get('estimateId') || ''
  const commercialOfferIdFromUrl = searchParams?.get('commercialOfferId') || ''
  const invoiceDocumentIdFromUrl = searchParams?.get('invoiceDocumentId') || ''

  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState(projectIdFromUrl)
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [selectedEstimateIds, setSelectedEstimateIds] = useState<string[]>(
    estimateIdFromUrl ? [estimateIdFromUrl] : []
  )
  const [commercialOffers, setCommercialOffers] = useState<ProjectDocument[]>([])
  const [invoices, setInvoices] = useState<ProjectDocument[]>([])
  const [contracts, setContracts] = useState<ProjectDocument[]>([])
  const [commercialOfferId, setCommercialOfferId] = useState(commercialOfferIdFromUrl)
  const [invoiceDocumentId, setInvoiceDocumentId] = useState(invoiceDocumentIdFromUrl)
  const [contractDocumentId, setContractDocumentId] = useState('')
  const [invoiceSource, setInvoiceSource] = useState<'estimate' | 'kp'>(
    commercialOfferIdFromUrl ? 'kp' : 'estimate'
  )
  const [docNumber, setDocNumber] = useState('')
  const [suggestedNumber, setSuggestedNumber] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!projectIdFromUrl) {
      fetch('/api/projects')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => setProjects(data?.projects || []))
        .catch(() => setProjects([]))
    }
  }, [projectIdFromUrl])

  useEffect(() => {
    const numberingType =
      type === 'UPD' ? 'UPD' : type === 'INVOICE' ? 'INVOICE' : type === 'CONTRACT' ? 'CONTRACT' : 'COMMERCIAL'
    fetch(`/api/documents/next-number?type=${numberingType}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setSuggestedNumber(data?.nextNumber || null))
      .catch(() => setSuggestedNumber(null))
  }, [type])

  useEffect(() => {
    if (!selectedProjectId) {
      setEstimates([])
      setCommercialOffers([])
      setInvoices([])
      setContracts([])
      return
    }

    fetch(`/api/projects/${selectedProjectId}/estimates`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setEstimates(Array.isArray(data) ? data : data?.estimates || []))
      .catch(() => setEstimates([]))

    const loadDocs = async (category: string) => {
      const res = await fetch(`/api/projects/${selectedProjectId}/documents?category=${category}`)
      if (!res.ok) return []
      const data = await res.json()
      return data.documents || []
    }

    if (type === 'INVOICE') {
      loadDocs('COMMERCIAL').then(setCommercialOffers)
    }
    if (type === 'UPD') {
      Promise.all([loadDocs('INVOICE'), loadDocs('CONTRACT')]).then(([inv, ctr]) => {
        setInvoices(inv)
        setContracts(ctr)
      })
    }
  }, [selectedProjectId, type])

  const toggleEstimate = (id: string) => {
    setSelectedEstimateIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (!selectedProjectId) {
      setErrorMessage('Выберите проект')
      return
    }
    setLoading(true)
    setErrorMessage(null)
    try {
      const body: Record<string, unknown> = {
        type,
        projectId: selectedProjectId,
        documentNumber: docNumber.trim() || suggestedNumber,
      }

      if (type === 'COMMERCIAL_OFFER' || (type === 'INVOICE' && invoiceSource === 'estimate')) {
        body.estimateIds = selectedEstimateIds
      }
      if (type === 'INVOICE' && invoiceSource === 'kp' && commercialOfferId) {
        body.commercialOfferId = commercialOfferId
      }
      if (type === 'CONTRACT' && selectedEstimateIds.length) {
        body.estimateIds = selectedEstimateIds
      }
      if (type === 'UPD') {
        body.invoiceDocumentId = invoiceDocumentId
        if (contractDocumentId) body.contractDocumentId = contractDocumentId
        if (invoiceDocumentIdFromUrl) body.parentDocumentId = invoiceDocumentIdFromUrl
      }
      if (type === 'INVOICE' && commercialOfferIdFromUrl) {
        body.parentDocumentId = commercialOfferIdFromUrl
      }

      const res = await fetch('/api/documents/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка создания')
      router.push(data.redirectUrl || `/documents/${data.documentId}/edit`)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Ошибка создания документа')
    } finally {
      setLoading(false)
    }
  }

  const typeLabel = TYPE_LABELS[type] || 'Документ'

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Link
          href={selectedProjectId ? `/documents?projectId=${selectedProjectId}` : '/documents'}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к документам
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Создать: {typeLabel}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {type === 'UPD' && 'УПД создаётся на основании счёта на оплату'}
            {type === 'INVOICE' && 'Счёт можно заполнить из сметы или КП'}
            {type === 'COMMERCIAL_OFFER' && 'КП формируется по выбранной смете'}
            {type === 'CONTRACT' && 'Договор можно дополнить спецификацией из сметы'}
          </p>
        </div>

        <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />

        <div className="bg-white rounded-xl border p-6 space-y-5">
          {!projectIdFromUrl && (
            <label className="block text-sm">
              <span className="text-gray-700 font-medium">Проект</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2"
              >
                <option value="">Выберите проект</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {(type === 'COMMERCIAL_OFFER' || type === 'CONTRACT' || (type === 'INVOICE' && invoiceSource === 'estimate')) && (
            <div>
              <p className="text-sm font-medium text-gray-800 mb-2">
                Смета{type === 'CONTRACT' ? ' (опционально)' : ''}
              </p>
              {estimates.length === 0 ? (
                <p className="text-sm text-gray-500">В проекте нет смет</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {estimates.map((est) => (
                    <label
                      key={est.id}
                      className="flex items-center gap-2 text-sm p-2 rounded-lg border hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEstimateIds.includes(est.id)}
                        onChange={() => toggleEstimate(est.id)}
                      />
                      <span>{est.name}</span>
                      <span className="ml-auto text-gray-500">
                        {est.total.toLocaleString('ru-RU')} ₽
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {type === 'INVOICE' && (
            <div>
              <p className="text-sm font-medium text-gray-800 mb-2">Источник данных</p>
              <div className="flex gap-4 text-sm mb-3">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={invoiceSource === 'estimate'}
                    onChange={() => setInvoiceSource('estimate')}
                  />
                  Из сметы
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={invoiceSource === 'kp'}
                    onChange={() => setInvoiceSource('kp')}
                  />
                  Из КП
                </label>
              </div>
              {invoiceSource === 'kp' && (
                <select
                  value={commercialOfferId}
                  onChange={(e) => setCommercialOfferId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Выберите КП</option>
                  {commercialOffers.map((kp) => (
                    <option key={kp.id} value={kp.id}>
                      {kp.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {type === 'UPD' && (
            <>
              <label className="block text-sm">
                <span className="text-gray-700 font-medium">Счёт-основание *</span>
                <select
                  value={invoiceDocumentId}
                  onChange={(e) => setInvoiceDocumentId(e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Выберите счёт</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.title}
                    </option>
                  ))}
                </select>
                {invoices.length === 0 && selectedProjectId && (
                  <p className="text-xs text-amber-600 mt-1">
                    Сначала создайте счёт на оплату в этом проекте
                  </p>
                )}
              </label>
              <label className="block text-sm">
                <span className="text-gray-700 font-medium">Договор-основание (опционально)</span>
                <select
                  value={contractDocumentId}
                  onChange={(e) => setContractDocumentId(e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Не выбран</option>
                  {contracts.map((ctr) => (
                    <option key={ctr.id} value={ctr.id}>
                      {ctr.title}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          <label className="block text-sm">
            <span className="text-gray-700 font-medium">Номер документа</span>
            <input
              type="text"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              placeholder={suggestedNumber || 'Авто'}
              className="mt-1 w-full border rounded-lg px-3 py-2"
            />
          </label>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Создание…' : 'Открыть редактор'}
          </button>
        </div>
      </div>
    </Layout>
  )
}

export default function NewDocumentPage() {
  return (
    <PageSuspense>
      <NewDocumentPageContent />
    </PageSuspense>
  )
}
