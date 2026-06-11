'use client'

import type { UpdParty } from '@/lib/upd-generator'

interface UpdPartyFieldsProps {
  title: string
  party: UpdParty
  prefix: 'seller' | 'buyer'
  onChange: (prefix: 'seller' | 'buyer', field: keyof UpdParty, value: string) => void
  errors?: Record<string, string>
  readOnly?: boolean
}

export function UpdPartyFields({
  title,
  party,
  prefix,
  onChange,
  errors = {},
  readOnly,
}: UpdPartyFieldsProps) {
  const fields: { key: keyof UpdParty; label: string; required?: boolean }[] = [
    { key: 'legalName', label: 'Наименование (юр.)', required: true },
    { key: 'name', label: 'Краткое наименование' },
    { key: 'inn', label: 'ИНН', required: true },
    { key: 'kpp', label: 'КПП' },
    { key: 'address', label: 'Адрес' },
    { key: 'directorPosition', label: 'Должность подписанта' },
    { key: 'directorName', label: 'ФИО подписанта' },
  ]

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {fields.map(({ key, label, required }) => (
          <div key={key} className={key === 'address' ? 'md:col-span-2' : ''}>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {label}
              {required && <span className="text-red-500"> *</span>}
            </label>
            <input
              type="text"
              value={party[key] || ''}
              onChange={(e) => onChange(prefix, key, e.target.value)}
              disabled={readOnly}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 ${
                errors[`${prefix}.${key}`] ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors[`${prefix}.${key}`] && (
              <p className="text-xs text-red-600 mt-0.5">{errors[`${prefix}.${key}`]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
