import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(16),
  NEXTAUTH_URL: z.string().url().optional(),
  CRON_SECRET: z.string().min(16).optional(),
  REDIS_URL: z.string().optional(),
  MINIO_ENDPOINT: z.string().optional(),
  MINIO_ACCESS_KEY: z.string().optional(),
  MINIO_SECRET_KEY: z.string().optional(),
  ALLOW_PUBLIC_REGISTRATION: z.enum(['true', 'false']).optional(),
  ALLOW_DEBUG_ROUTES: z.enum(['true', 'false']).optional(),
  HEALTH_PUBLIC: z.enum(['true', 'false']).optional(),
  ALERTS_ENABLED: z.enum(['true', 'false']).optional(),
  ALERT_EMAIL: z.string().email().optional(),
  ALERT_WEBHOOK: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
  CDN_BASE_URL: z.string().url().optional(),
  APP_INTERNAL_URL: z.string().url().optional(),
})

export type Env = z.infer<typeof envSchema>

const INSECURE_SECRETS = new Set([
  'your-secret-key',
  'changeme',
  'changeme_local_dev',
  'generate-with-openssl-rand-base64-32',
  'ci-nextauth-secret-min-32-chars-long',
])

function assertProductionSecrets(env: Env) {
  if (env.NODE_ENV !== 'production') return

  if (!env.CRON_SECRET) {
    throw new Error('CRON_SECRET is required in production')
  }

  for (const [name, value] of [
    ['NEXTAUTH_SECRET', env.NEXTAUTH_SECRET],
    ['CRON_SECRET', env.CRON_SECRET],
  ] as const) {
    if (INSECURE_SECRETS.has(value) || value.length < 32) {
      throw new Error(`${name} must be a random string of at least 32 characters in production`)
    }
  }

  const minioKey = process.env.MINIO_ACCESS_KEY
  const minioSecret = process.env.MINIO_SECRET_KEY
  if (
    minioKey === 'minioadmin' ||
    minioSecret === 'changeme_local_dev' ||
    minioSecret === 'minioadmin123'
  ) {
    throw new Error('MINIO credentials must be changed from defaults in production')
  }
}

export function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new Error(`Invalid environment: ${details}`)
  }
  assertProductionSecrets(parsed.data)
  return parsed.data
}
