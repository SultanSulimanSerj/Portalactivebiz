#!/usr/bin/env node
/**
 * Production worker for async UPD export (Excel + PDF via Gotenberg).
 * Requires REDIS_URL, DATABASE_URL, GOTENBERG_URL, MinIO credentials.
 *
 * PM2: see ecosystem.config.js
 * Docker: see docker-compose.yml service document-export-worker
 */

import { startDocumentExportWorker } from '../src/lib/document-export/worker'

startDocumentExportWorker().catch((err) => {
  console.error('[document-export] failed to start worker:', err)
  process.exit(1)
})
