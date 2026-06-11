import type { UpdMergedLineItem } from './estimate-merge'

function hasMeaningfulText(value?: string | null): boolean {
  const text = value?.trim()
  if (!text) return false
  return !/^[-—–.\s]+$/.test(text)
}

/** Пустая позиция: нет наименования (и нет описания). Суммы не учитываем — без названия строка в УПД недопустима. */
export function isEmptyLineItem(item: {
  name?: string | null
  description?: string | null
}): boolean {
  return !hasMeaningfulText(item.name) && !hasMeaningfulText(item.description)
}

export function filterNonemptyLineItems<T extends UpdMergedLineItem>(items: T[]): T[] {
  return items.filter((item) => !isEmptyLineItem(item))
}
