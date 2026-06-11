import path from 'path'
import fs from 'fs'
import type { UpdDocumentData } from '@/lib/upd-generator'
import { patchXlsxTemplate, validateUpdXlsxBuffer } from '../xlsx-patcher'
import { buildUpdXlsxPatchPlan } from './upd-cell-map'

const TEMPLATE_PATH = path.join(
  process.cwd(),
  'templates/documents/upd-status-2-template.xlsx'
)

export async function renderUpdXlsx(data: UpdDocumentData): Promise<Buffer> {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(
      `Шаблон УПД не найден: ${TEMPLATE_PATH}. Положите официальную форму в templates/documents/upd-status-2-template.xlsx`
    )
  }

  const plan = buildUpdXlsxPatchPlan(data)
  const buffer = await patchXlsxTemplate({
    templatePath: TEMPLATE_PATH,
    assignments: plan.assignments,
    hideRows: plan.hideRows,
  })

  validateUpdXlsxBuffer(buffer)
  return buffer
}
