#!/usr/bin/env node
/**
 * Standalone worker for deadline checks.
 * Run via system cron or PM2 when DISABLE_IN_PROCESS_CRON=true on app instances.
 *
 * Example crontab: 0 9 * * * cd /app && node scripts/check-deadlines-worker.js
 */

const port = process.env.PORT || '3000'
const cronSecret = process.env.CRON_SECRET
const baseUrl = process.env.APP_INTERNAL_URL || `http://127.0.0.1:${port}`

async function main() {
  const url = new URL(`${baseUrl}/api/notifications/check-deadlines`)
  if (cronSecret) {
    url.searchParams.set('secret', cronSecret)
  }

  const headers = {}
  if (cronSecret) {
    headers['x-cron-secret'] = cronSecret
  }

  const response = await fetch(url.toString(), { method: 'POST', headers })
  const body = await response.json()

  if (!response.ok) {
    console.error('check-deadlines failed:', response.status, body)
    process.exit(1)
  }

  console.log(JSON.stringify(body, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
