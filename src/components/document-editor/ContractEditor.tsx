'use client'

import type { ContractDocumentContent } from '@/lib/document-editor/types'
import type { ContractData } from '@/lib/document-generator'

interface ContractEditorProps {
  content: ContractDocumentContent
  onChange: (content: ContractDocumentContent) => void
  readOnly?: boolean
}

export function ContractEditor({ content, onChange, readOnly }: ContractEditorProps) {
  const data = content.data

  const updateData = (patch: Partial<ContractData>) => {
    if (readOnly) return
    onChange({ ...content, data: { ...data, ...patch } })
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Договор подряда</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="text-gray-600">Номер договора</span>
            <input
              type="text"
              value={data.contractNumber}
              onChange={(e) => updateData({ contractNumber: e.target.value })}
              readOnly={readOnly}
              className="mt-1 w-full border rounded-lg px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="text-gray-600">Дата</span>
            <input
              type="text"
              value={data.contractDate}
              onChange={(e) => updateData({ contractDate: e.target.value })}
              readOnly={readOnly}
              className="mt-1 w-full border rounded-lg px-3 py-2"
            />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="text-gray-600">Предмет / проект</span>
            <input
              type="text"
              value={data.projectName}
              onChange={(e) => updateData({ projectName: e.target.value })}
              readOnly={readOnly}
              className="mt-1 w-full border rounded-lg px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="text-gray-600">Сумма договора</span>
            <input
              type="text"
              value={data.totalAmount}
              onChange={(e) => updateData({ totalAmount: e.target.value })}
              readOnly={readOnly}
              className="mt-1 w-full border rounded-lg px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="text-gray-600">Адрес работ</span>
            <input
              type="text"
              value={data.workAddress}
              onChange={(e) => updateData({ workAddress: e.target.value })}
              readOnly={readOnly}
              className="mt-1 w-full border rounded-lg px-3 py-2"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="bg-white rounded-lg border p-4 space-y-2">
          <p className="font-medium text-gray-700">Исполнитель</p>
          <input
            value={data.executorLegalName}
            onChange={(e) => updateData({ executorLegalName: e.target.value })}
            readOnly={readOnly}
            className="w-full border rounded-lg px-3 py-2"
          />
          <input
            value={data.executorInn}
            onChange={(e) => updateData({ executorInn: e.target.value })}
            readOnly={readOnly}
            placeholder="ИНН"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div className="bg-white rounded-lg border p-4 space-y-2">
          <p className="font-medium text-gray-700">Заказчик</p>
          <input
            value={data.clientLegalName}
            onChange={(e) => updateData({ clientLegalName: e.target.value })}
            readOnly={readOnly}
            className="w-full border rounded-lg px-3 py-2"
          />
          <input
            value={data.clientInn}
            onChange={(e) => updateData({ clientInn: e.target.value })}
            readOnly={readOnly}
            placeholder="ИНН"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
      </div>

      {data.specification?.items?.length ? (
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm font-medium text-gray-800 mb-2">Спецификация</p>
          <p className="text-sm text-gray-600">
            {data.specification.items.length} позиций, итого{' '}
            {data.specification.totalWithVat.toLocaleString('ru-RU')} ₽
          </p>
        </div>
      ) : null}
    </div>
  )
}
