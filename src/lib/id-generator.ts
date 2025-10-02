import { createId } from '@paralleldrive/cuid2'

/**
 * Утилита для генерации ID в соответствии со схемой базы данных
 * Все модели в Prisma используют @default(cuid()), поэтому мы должны использовать cuid2
 * для консистентности с базой данных
 */

export function generateId(): string {
  return createId()
}

/**
 * Проверяет, является ли строка валидным CUID
 */
export function isValidCuid(id: string): boolean {
  // CUID2 имеет длину 24 символа и содержит только буквы и цифры
  return /^[a-z0-9]{24}$/.test(id)
}

/**
 * Проверяет, является ли строка валидным UUID v4
 */
export function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}

/**
 * Конвертирует UUID в CUID (если возможно) или генерирует новый CUID
 */
export function convertToCuid(id: string): string {
  if (isValidCuid(id)) {
    return id
  }
  
  if (isValidUuid(id)) {
    // Для UUID генерируем новый CUID
    return generateId()
  }
  
  // Для неизвестного формата генерируем новый CUID
  return generateId()
}
