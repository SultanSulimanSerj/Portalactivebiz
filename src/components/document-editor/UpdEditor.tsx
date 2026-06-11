'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import type { UpdDocumentContent } from '@/lib/document-editor/types'
import type { UpdDocumentData } from '@/lib/upd-generator'
import type { UpdParty } from '@/lib/upd-generator'
import {
  mergedLineItemToEditable,
  editableToMergedLineItem,
  recalculateAllLineItems,
  calculateDocumentTotals,
} from '@/lib/document-editor/upd-calculations'
import type { UpdEditableLineItem } from '@/lib/document-editor/types'
import { UpdPartyFields } from './UpdPartyFields'
import { UpdLineItemsTable } from './UpdLineItemsTable'

interface UpdEditorProps {
  content: UpdDocumentContent
  onChange: (content: UpdDocumentContent) => void
  validationErrors?: Record<string, string>
  readOnly?: boolean
  sourceInvoice?: { id: string; title: string } | null
  sourceMetaWarning?: string | null
}

export function UpdEditor({
  content,
  onChange,
  validationErrors = {},
  readOnly,
  sourceInvoice,
  sourceMetaWarning,
}: UpdEditorProps) {
  const data = content.data

  const editableItems = useMemo(
    () => data.items.map((item, i) => mergedLineItemToEditable({ ...item, lineNumber: i + 1 })),
    [data.items]
  )

  const updateData = (patch: Partial<UpdDocumentData>) => {
    if (readOnly) return
    onChange({
      ...content,
      data: { ...data, ...patch },
    })
  }

  const updateParty = (prefix: 'seller' | 'buyer', field: keyof UpdParty, value: string) => {
    updateData({
      [prefix]: { ...data[prefix], [field]: value },
    })
  }

  const handleItemsChange = (items: UpdEditableLineItem[]) => {
    const recalculated = recalculateAllLineItems(items)
    const totals = calculateDocumentTotals(recalculated)
    updateData({
      items: recalculated.map(editableToMergedLineItem),
      ...totals,
    })
  }

  return (
    <div className="space-y-6">
      {sourceInvoice && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-900">
          Основание: счёт{' '}
          <Link
            href={`/documents/${sourceInvoice.id}/edit`}
            className="font-medium underline hover:text-blue-700"
          >
            {sourceInvoice.title}
          </Link>
        </div>
      )}
      {sourceMetaWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-900">
          {sourceMetaWarning}
        </div>
      )}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Общие сведения</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Номер УПД <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.documentNumber}
              onChange={(e) => updateData({ documentNumber: e.target.value })}
              disabled={readOnly}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 ${
                validationErrors.documentNumber ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {validationErrors.documentNumber && (
              <p className="text-xs text-red-600 mt-0.5">{validationErrors.documentNumber}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Дата <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.documentDate}
              onChange={(e) => updateData({ documentDate: e.target.value })}
              placeholder="ДД.ММ.ГГГГ"
              disabled={readOnly}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 ${
                validationErrors.documentDate ? 'border-red-400' : 'border-gray-300'
              }`}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Статус УПД</label>
            <select
              value={data.status}
              onChange={(e) => updateData({ status: Number(e.target.value) as 1 | 2 })}
              disabled={readOnly}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            >
              <option value={1}>1 — счёт-фактура</option>
              <option value={2}>2 — передаточный документ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Договор и основание */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Договор и основание</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Номер договора</label>
            <input
              type="text"
              value={data.contractNumber || ''}
              onChange={(e) => updateData({ contractNumber: e.target.value || undefined })}
              disabled={readOnly}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Дата договора</label>
            <input
              type="text"
              value={data.contractDate || ''}
              onChange={(e) => updateData({ contractDate: e.target.value || undefined })}
              placeholder="ДД.ММ.ГГГГ"
              disabled={readOnly}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Основание передачи</label>
            <textarea
              value={data.basisText || ''}
              onChange={(e) => updateData({ basisText: e.target.value || undefined })}
              rows={2}
              disabled={readOnly}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Платёжный документ</label>
            <input
              type="text"
              value={data.paymentDocText || ''}
              onChange={(e) => updateData({ paymentDocText: e.target.value || undefined })}
              disabled={readOnly}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Стороны */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UpdPartyFields
          title="Продавец"
          party={data.seller}
          prefix="seller"
          onChange={updateParty}
          errors={validationErrors}
          readOnly={readOnly}
        />
        <UpdPartyFields
          title="Покупатель"
          party={data.buyer}
          prefix="buyer"
          onChange={updateParty}
          errors={validationErrors}
          readOnly={readOnly}
        />
      </div>

      {/* Отгрузка и подписанты */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Передача и подписанты</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Дата отгрузки</label>
            <input
              type="text"
              value={data.shipDate || data.documentDate}
              onChange={(e) => updateData({ shipDate: e.target.value || undefined })}
              placeholder="ДД.ММ.ГГГГ"
              disabled={readOnly}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Подписант (продавец)</label>
            <input
              type="text"
              value={data.signatorySeller || data.seller.directorName || ''}
              onChange={(e) => updateData({ signatorySeller: e.target.value || undefined })}
              disabled={readOnly}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Подписант (покупатель)</label>
            <input
              type="text"
              value={data.signatoryBuyer || ''}
              onChange={(e) => updateData({ signatoryBuyer: e.target.value || undefined })}
              disabled={readOnly}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Позиции */}
      <UpdLineItemsTable
        items={editableItems}
        onChange={handleItemsChange}
        errors={validationErrors}
        readOnly={readOnly}
      />

      {/* Итоги */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Итоги</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Сумма без НДС</p>
            <p className="text-lg font-bold text-gray-900">
              {data.totalWithoutVat.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Сумма НДС</p>
            <p className="text-lg font-bold text-gray-900">
              {data.totalVat.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽
            </p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600 mb-1">Всего к оплате</p>
            <p className="text-lg font-bold text-blue-900">
              {data.totalWithVat.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
