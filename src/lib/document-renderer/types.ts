import type { ValidationResult } from '@/lib/document-editor/types'

export type PrintRendererKind = 'docx' | 'xlsx' | 'html'

export interface DocumentRenderer {
  kind: PrintRendererKind
  render(input: unknown): Promise<Buffer>
}

export interface EdoXmlRenderer {
  /** Идентификатор формата ФНС, напр. ON_NSCHFDOPPR */
  formatId: string
  render(input: unknown): Promise<Buffer>
}

export interface XlsxCellAssignment {
  address: string
  value: string | number | null
}

export interface XlsxPatchOptions {
  templatePath: string
  sheetPath?: string
  assignments: XlsxCellAssignment[]
  /** Номера строк листа, которые нужно скрыть (hidden=1, ht=0) */
  hideRows?: number[]
}

export interface XlsxQualityMetrics {
  mergeCount: number
  substringCounts: Record<string, number>
}

export interface DocumentTypePlugin {
  type: string
  label: string
  category: string
  printRenderer: PrintRendererKind
  edoXmlFormatId?: string
  validate?: (content: unknown) => ValidationResult
}
