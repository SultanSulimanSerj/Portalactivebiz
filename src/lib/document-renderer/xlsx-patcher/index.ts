import fs from 'fs'
import PizZip from 'pizzip'
import type { XlsxPatchOptions, XlsxQualityMetrics } from '../types'
import { hideSheetRows, patchSheetXml } from './patch-sheet'
import { SharedStringTable } from './shared-strings'
import { assertUpdQuality, inspectXlsxXml } from './inspect'

const DEFAULT_SHEET_PATH = 'xl/worksheets/sheet1.xml'
const DEFAULT_SST_PATH = 'xl/sharedStrings.xml'

export async function patchXlsxTemplate(options: XlsxPatchOptions): Promise<Buffer> {
  const templateBuffer = fs.readFileSync(options.templatePath)
  const zip = new PizZip(templateBuffer)

  const sheetPath = options.sheetPath ?? DEFAULT_SHEET_PATH
  const sstPath = DEFAULT_SST_PATH

  const sheetFile = zip.file(sheetPath)
  const sstFile = zip.file(sstPath)
  if (!sheetFile || !sstFile) {
    throw new Error(`Шаблон XLSX не содержит ${sheetPath} или ${sstPath}`)
  }

  const sst = new SharedStringTable(sstFile.asText())
  let patchedSheet = patchSheetXml(sheetFile.asText(), options.assignments, sst)
  if (options.hideRows?.length) {
    patchedSheet = hideSheetRows(patchedSheet, options.hideRows)
  }

  zip.file(sheetPath, patchedSheet)
  zip.file(sstPath, sst.toXml())

  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' })
}

export function inspectXlsxBuffer(buffer: Buffer, sheetPath = DEFAULT_SHEET_PATH): XlsxQualityMetrics {
  const zip = new PizZip(buffer)
  const sheetFile = zip.file(sheetPath)
  const sstFile = zip.file(DEFAULT_SST_PATH)
  if (!sheetFile || !sstFile) {
    throw new Error('XLSX не содержит лист или sharedStrings')
  }
  return inspectXlsxXml(sheetFile.asText(), sstFile.asText())
}

export function validateUpdXlsxBuffer(buffer: Buffer): XlsxQualityMetrics {
  const metrics = inspectXlsxBuffer(buffer)
  assertUpdQuality(metrics)
  return metrics
}

export { assertUpdQuality, inspectXlsxXml }
