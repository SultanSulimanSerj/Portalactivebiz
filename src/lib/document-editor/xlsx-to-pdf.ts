import { execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

const execFileAsync = promisify(execFile)

const SOFFICE_CANDIDATES = [
  process.env.LIBREOFFICE_PATH,
  '/Applications/LibreOffice.app/Contents/MacOS/soffice',
  '/usr/bin/libreoffice',
  '/usr/bin/soffice',
  'soffice',
  'libreoffice',
].filter((p): p is string => Boolean(p))

function sanitizeBaseName(name: string): string {
  return name.replace(/[^\w\u0400-\u04FF.-]+/g, '_').slice(0, 80) || 'upd'
}

async function convertViaGotenberg(
  gotenbergUrl: string,
  xlsxBuffer: Buffer,
  fileName: string
): Promise<Buffer> {
  const base = gotenbergUrl.replace(/\/$/, '')
  const formData = new FormData()
  const blob = new Blob([new Uint8Array(xlsxBuffer)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  formData.append('files', blob, fileName)

  const response = await fetch(`${base}/forms/libreoffice/convert`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Gotenberg (${response.status}): ${text || 'ошибка конвертации'}`)
  }

  return Buffer.from(await response.arrayBuffer())
}

async function convertViaLibreOfficeLocal(
  xlsxBuffer: Buffer,
  baseName: string,
  fileName: string
): Promise<Buffer> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'manexa-upd-pdf-'))
  const xlsxPath = path.join(tmpDir, fileName)
  const pdfPath = path.join(tmpDir, `${baseName}.pdf`)

  await fs.writeFile(xlsxPath, xlsxBuffer)

  let lastError: Error | null = null
  for (const soffice of SOFFICE_CANDIDATES) {
    try {
      await execFileAsync(
        soffice,
        [
          '--headless',
          '--nologo',
          '--nofirststartwizard',
          '--convert-to',
          'pdf',
          '--outdir',
          tmpDir,
          xlsxPath,
        ],
        { timeout: 120_000 }
      )

      const pdf = await fs.readFile(pdfPath)
      await fs.rm(tmpDir, { recursive: true, force: true })
      return pdf
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
    }
  }

  await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  throw lastError || new Error('LibreOffice не найден')
}

/**
 * Конвертирует XLSX (официальная форма УПД) в PDF с сохранением вёрстки.
 * Использует Gotenberg (docker) или локальный LibreOffice.
 */
export async function convertXlsxBufferToPdf(
  xlsxBuffer: Buffer,
  suggestedName: string
): Promise<Buffer> {
  const fileName = suggestedName.endsWith('.xlsx') ? suggestedName : `${suggestedName}.xlsx`
  const baseName = sanitizeBaseName(fileName.replace(/\.xlsx$/i, ''))

  const gotenbergUrl = process.env.GOTENBERG_URL
  if (gotenbergUrl) {
    try {
      return await convertViaGotenberg(gotenbergUrl, xlsxBuffer, fileName)
    } catch (err) {
      console.error('Gotenberg PDF conversion failed, trying LibreOffice:', err)
    }
  }

  try {
    return await convertViaLibreOfficeLocal(xlsxBuffer, baseName, fileName)
  } catch {
    throw new Error(
      'PDF формируется из того же Excel-шаблона УПД. Для конвертации нужен LibreOffice или сервис Gotenberg. ' +
        'Запустите: docker compose up -d gotenberg и задайте GOTENBERG_URL=http://localhost:3001 в .env'
    )
  }
}
