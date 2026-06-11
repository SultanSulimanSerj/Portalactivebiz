/**
 * Rate limiter with optional Redis store (PM2 cluster / multi-instance).
 * Falls back to in-memory when REDIS_URL is unset or Redis is unavailable.
 */

import { createClient, type RedisClientType } from 'redis'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const memoryStore = new Map<string, RateLimitEntry>()

let redisClient: RedisClientType | null = null
let redisConnecting: Promise<RedisClientType | null> | null = null

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

async function getRedisClient(): Promise<RedisClientType | null> {
  const url = process.env.REDIS_URL
  if (!url) return null

  if (redisClient?.isOpen) return redisClient
  if (redisConnecting) return redisConnecting

  redisConnecting = (async () => {
    try {
      const client = createClient({ url })
      client.on('error', () => {})
      await client.connect()
      redisClient = client
      return client
    } catch {
      return null
    } finally {
      redisConnecting = null
    }
  })()

  return redisConnecting
}

function checkRateLimitMemory(
  key: string,
  maxAttempts: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const entry = memoryStore.get(key)

  if (!entry || now >= entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxAttempts - 1, resetAt: now + windowMs }
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count += 1
  return { allowed: true, remaining: maxAttempts - entry.count, resetAt: entry.resetAt }
}

export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): Promise<RateLimitResult> {
  const client = await getRedisClient()
  if (!client) {
    return checkRateLimitMemory(key, maxAttempts, windowMs)
  }

  const redisKey = `rl:${key}`
  try {
    const count = await client.incr(redisKey)
    if (count === 1) {
      await client.pExpire(redisKey, windowMs)
    }

    const ttl = await client.pTTL(redisKey)
    const resetAt = Date.now() + (ttl > 0 ? ttl : windowMs)

    if (count > maxAttempts) {
      return { allowed: false, remaining: 0, resetAt }
    }

    return {
      allowed: true,
      remaining: Math.max(0, maxAttempts - count),
      resetAt,
    }
  } catch {
    return checkRateLimitMemory(key, maxAttempts, windowMs)
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}
