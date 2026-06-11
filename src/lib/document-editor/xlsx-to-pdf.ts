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
  return name.replace(/[^\w\u0400-\u04FF.-]+/g, '_').slice(0, 80) || 'document'
}

async function convertViaGotenberg(
  gotenbergUrl: string,
  sourceBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<Buffer> {
  const base = gotenbergUrl.replace(/\/$/, '')
  const formData = new FormData()
  const blob = new Blob([new Uint8Array(sourceBuffer)], { type: mimeType })
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
  sourceBuffer: Buffer,
  baseName: string,
  fileName: string
): Promise<Buffer> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'manexa-office-pdf-'))
  const sourcePath = path.join(tmpDir, fileName)
  const pdfPath = path.join(tmpDir, `${baseName}.pdf`)

  await fs.writeFile(sourcePath, sourceBuffer)

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
          sourcePath,
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

async function convertOfficeBufferToPdf(
  sourceBuffer: Buffer,
  fileName: string,
  mimeType: string,
  pdfErrorHint: string
): Promise<Buffer> {
  const baseName = sanitizeBaseName(fileName.replace(/\.[^.]+$/i, ''))

  const gotenbergUrl = process.env.GOTENBERG_URL
  if (gotenbergUrl) {
    try {
      return await convertViaGotenberg(gotenbergUrl, sourceBuffer, fileName, mimeType)
    } catch (err) {
      console.error('Gotenberg PDF conversion failed, trying LibreOffice:', err)
    }
  }

  try {
    return await convertViaLibreOfficeLocal(sourceBuffer, baseName, fileName)
  } catch {
    throw new Error(
      `${pdfErrorHint} Для конвертации нужен LibreOffice или сервис Gotenberg. ` +
        'Запустите: docker compose up -d gotenberg и задайте GOTENBERG_URL=http://localhost:3001 в .env'
    )
  }
}

/**
 * Конвертирует XLSX (официальная форма УПД) в PDF с сохранением вёрстки.
 */
export async function convertXlsxBufferToPdf(
  xlsxBuffer: Buffer,
  suggestedName: string
): Promise<Buffer> {
  const fileName = suggestedName.endsWith('.xlsx') ? suggestedName : `${suggestedName}.xlsx`
  return convertOfficeBufferToPdf(
    xlsxBuffer,
    fileName,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'PDF формируется из того же Excel-шаблона УПД.'
  )
}

/**
 * Конвертирует DOCX (КП, счёт, договор) в PDF.
 */
export async function convertDocxBufferToPdf(
  docxBuffer: Buffer,
  suggestedName: string
): Promise<Buffer> {
  const fileName = suggestedName.endsWith('.docx') ? suggestedName : `${suggestedName}.docx`
  return convertOfficeBufferToPdf(
    docxBuffer,
    fileName,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'PDF формируется из Word-файла.'
  )
}
