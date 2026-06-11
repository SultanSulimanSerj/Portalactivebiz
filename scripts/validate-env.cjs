const { z } = require('zod')

const INSECURE_SECRETS = new Set([
  'your-secret-key',
  'changeme',
  'changeme_local_dev',
  'generate-with-openssl-rand-base64-32',
])

function validateProductionEnv() {
  if (process.env.NODE_ENV !== 'production') return

  const required = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'CRON_SECRET',
    'REDIS_URL',
    'GOTENBERG_URL',
  ]
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`[env] ${key} is required in production`)
    }
  }

  for (const key of ['NEXTAUTH_SECRET', 'CRON_SECRET']) {
    const value = process.env[key]
    if (INSECURE_SECRETS.has(value) || value.length < 32) {
      throw new Error(`[env] ${key} must be a random string of at least 32 characters in production`)
    }
  }

  const minioKey = process.env.MINIO_ACCESS_KEY
  const minioSecret = process.env.MINIO_SECRET_KEY
  if (
    minioKey === 'minioadmin' ||
    minioSecret === 'changeme_local_dev' ||
    minioSecret === 'minioadmin123'
  ) {
    throw new Error('[env] MINIO credentials must be changed from defaults in production')
  }
}

module.exports = { validateProductionEnv }
