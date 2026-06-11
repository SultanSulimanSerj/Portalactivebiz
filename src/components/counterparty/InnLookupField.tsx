'use client'

import { useEffect, useRef } from 'react'
import { Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useInnLookup } from '@/hooks/use-inn-lookup'
import type { CounterpartyRequisites } from '@/lib/counterparty/types'
import { normalizeInn } from '@/lib/counterparty/inn'
import { cn } from '@/lib/utils'

interface InnLookupFieldProps {
  value: string
  onChange: (inn: string) => void
  onFound?: (data: CounterpartyRequisites) => void
  label?: string
  placeholder?: string
  required?: boolean
  autoLookup?: boolean
  className?: string
  inputClassName?: string
  variant?: 'shadcn' | 'native'
}

export function InnLookupField({
  value,
  onChange,
  onFound,
  label = 'ИНН',
  placeholder = '1234567890',
  required = false,
  autoLookup = true,
  className,
  inputClassName,
  variant = 'shadcn',
}: InnLookupFieldProps) {
  const { lookup, loading, error, found, reset } = useInnLookup()
  const lastAutoLookupInn = useRef<string | null>(null)
  const onFoundRef = useRef(onFound)
  onFoundRef.current = onFound

  const applyResult = (result: CounterpartyRequisites | null) => {
    if (result) onFoundRef.current?.(result)
  }

  const handleLookup = async () => {
    const result = await lookup(value)
    applyResult(result)
  }

  const handleChange = (nextValue: string) => {
    const digits = normalizeInn(nextValue)
    if (digits !== normalizeInn(value)) {
      reset()
      lastAutoLookupInn.current = null
    }
    onChange(digits)
  }

  useEffect(() => {
    if (!autoLookup) return
    const normalized = normalizeInn(value)
    if (normalized.length !== 10 && normalized.length !== 12) return
    if (lastAutoLookupInn.current === normalized) return

    const timer = window.setTimeout(() => {
      lastAutoLookupInn.current = normalized
      void lookup(normalized).then(applyResult)
    }, 500)

    return () => window.clearTimeout(timer)
  }, [autoLookup, lookup, value])

  const inputProps = {
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.value),
    placeholder,
    required,
    inputMode: 'numeric' as const,
    autoComplete: 'off',
    maxLength: 12,
  }

  return (
    <div className={className}>
      {label && (
        <Label htmlFor="inn-lookup-input" className={variant === 'native' ? 'block text-sm font-medium text-gray-700 mb-2' : undefined}>
          {label}
        </Label>
      )}
      <div className={cn('flex gap-2', variant === 'shadcn' && label && 'mt-1')}>
        {variant === 'shadcn' ? (
          <Input
            id="inn-lookup-input"
            {...inputProps}
            className={inputClassName}
          />
        ) : (
          <input
            id="inn-lookup-input"
            type="text"
            {...inputProps}
            className={cn(
              'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
              inputClassName
            )}
          />
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleLookup()}
          disabled={loading || !normalizeInn(value)}
          className="shrink-0"
          title="Найти по ИНН"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          <span className="sr-only">Найти</span>
        </Button>
      </div>
      {found && !error && (
        <p className="mt-1.5 text-xs text-green-700">
          Найдено: {found.legalName || found.name}
        </p>
      )}
      {error && (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
