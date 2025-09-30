import { NextRequest } from 'next/server'

// Простое in-memory кэширование для разработки
// В продакшене использовать Redis или Memcached
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  key?: string // Custom cache key
}

export function getCacheKey(request: NextRequest, customKey?: string): string {
  if (customKey) return customKey
  
  const url = new URL(request.url)
  const pathname = url.pathname
  const searchParams = url.searchParams.toString()
  
  return `${pathname}${searchParams ? `?${searchParams}` : ''}`
}

export function getFromCache(key: string): any | null {
  const cached = cache.get(key)
  
  if (!cached) return null
  
  const now = Date.now()
  const isExpired = (now - cached.timestamp) > (cached.ttl * 1000)
  
  if (isExpired) {
    cache.delete(key)
    return null
  }
  
  return cached.data
}

export function setCache(key: string, data: any, ttl: number = 300): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  })
}

export function clearCache(pattern?: string): void {
  if (!pattern) {
    cache.clear()
    return
  }
  
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key)
    }
  }
}

// Очистка устаревших записей каждые 5 минут
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of cache.entries()) {
    const isExpired = (now - value.timestamp) > (value.ttl * 1000)
    if (isExpired) {
      cache.delete(key)
    }
  }
}, 5 * 60 * 1000)
