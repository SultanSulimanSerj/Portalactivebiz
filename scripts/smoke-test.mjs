#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`)
    process.exit(1)
  }
  console.log(`OK: ${message}`)
}

const requiredFiles = [
  'src/middleware.ts',
  'src/lib/env.ts',
  'scripts/validate-env.cjs',
  'scripts/backup-minio.sh',
  'server.js',
  'docs/PRODUCTION.md',
]

for (const file of requiredFiles) {
  assert(fs.existsSync(path.join(root, file)), `${file} exists`)
}

assert(
  !fs.existsSync(path.join(root, 'src/app/api/auth/login/route.ts')),
  'legacy /api/auth/login removed'
)
assert(
  !fs.existsSync(path.join(root, 'src/app/api/auth/logout/route.ts')),
  'legacy /api/auth/logout removed'
)

const deployYml = fs.readFileSync(path.join(root, '.github/workflows/deploy.yml'), 'utf8')
assert(!deployYml.includes('vercel-action'), 'CI workflow does not deploy to Vercel')
assert(deployYml.includes('npm run lint'), 'CI runs lint')

const rateLimit = fs.readFileSync(path.join(root, 'src/lib/rate-limit.ts'), 'utf8')
assert(rateLimit.includes('REDIS_URL'), 'rate limit supports Redis')

const optionalBaseUrl = process.env.SMOKE_BASE_URL
if (optionalBaseUrl) {
  const base = optionalBaseUrl.replace(/\/$/, '')
  const health = await fetch(`${base}/api/health`)
  assert(health.status === 401 || health.status === 200, `/api/health responds (${health.status})`)
}

console.log('All smoke checks passed.')
